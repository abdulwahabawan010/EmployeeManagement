# CB AI Core Framework Documentation

## Overview

The CB AI Core Framework provides a type-safe, extensible foundation for building AI-powered tools and workflows in the Alpha system. The framework supports three types of tools: LLM-based, Logic-based, and Hybrid tools, and allows composition of tools into complex workflows.

## Architecture

```
cb.ai/
├── tool/              # Tool interfaces and implementations
│   ├── CbTool.java           # Base interface
│   ├── CbLlmTool.java        # LLM tool interface
│   ├── CbLogicTool.java      # Logic tool interface
│   ├── CbHybridTool.java     # Hybrid tool interface
│   └── CbToolType.java       # Tool type enum
├── workflow/          # Workflow interfaces and implementations
│   ├── CbWorkflow.java       # Workflow interface
│   └── AbstractCbWorkflow.java # Abstract base class
├── context/           # Execution contexts
│   ├── CbToolContext.java    # Tool execution context
│   └── CbWorkflowContext.java # Workflow execution context
├── result/            # Result classes
│   ├── CbToolResult.java     # Tool result
│   ├── CbWorkflowResult.java # Workflow result
│   ├── CbToolDebugInfo.java  # Debug information
│   ├── CbWorkflowStepTrace.java # Step trace
│   └── CbValidationResult.java # Validation result
├── registry/          # Tool and workflow registries
│   ├── CbToolRegistry.java   # Tool registry
│   └── CbWorkflowRegistry.java # Workflow registry
├── service/           # Execution services
│   ├── CbExecutionService.java # Main execution service
│   └── CbExecutionTracker.java # Execution tracking
└── dto/               # Data transfer objects
    ├── api/           # API request/response DTOs
    ├── tool/          # Tool input/output DTOs
    └── workflow/      # Workflow input/output DTOs
```

## Tool Types

### 1. CbTool (Base Interface)

The base interface for all tools. All tools must implement:

```java
public interface CbTool<I, O> {
    String getAlias();           // Unique identifier
    String getName();            // Display name
    String getDescription();     // Description
    Class<I> getInputClass();    // Input type
    Class<O> getOutputClass();   // Output type
    CbToolResult<O> execute(I input, CbToolContext context);
    CbToolType getType();        // LLM, LOGIC, or HYBRID
}
```

### 2. CbLlmTool (LLM-based Tools)

For tools that use language models:

```java
public interface CbLlmTool<I, O> extends CbTool<I, O> {
    String buildSystemPrompt(I input);   // Build system prompt
    String buildUserPrompt(I input);     // Build user prompt
    O parseResponse(String response, I input);  // Parse LLM response
    default String getModel() { return "gpt-4.1-mini"; }
}
```

### 3. CbLogicTool (Logic-based Tools)

For pure logic/code-based tools:

```java
public interface CbLogicTool<I, O> extends CbTool<I, O> {
    O process(I input);  // Main processing method
}
```

### 4. CbHybridTool (Hybrid Tools)

Combines LLM with logic validation:

```java
public interface CbHybridTool<I, O> extends CbLlmTool<I, O> {
    List<String> validate(O output, I input);  // Validate LLM output
    O transform(O output, I input);            // Transform validated output
    default boolean enableFallbackOnValidationFailure() { return false; }
    default O getFallbackOutput(I input, List<String> errors) { return null; }
}
```

## How to Implement a New Tool

### Example: LLM-based Tool

```java
@Service
public class EntityDiscoveryTool implements CbLlmTool<EntityDiscoveryInput, EntityDiscoveryOutput> {

    @Autowired
    private OpenAIService openAIService;

    @Override
    public String getAlias() {
        return "cb.entity.discovery";
    }

    @Override
    public String getName() {
        return "Entity Discovery Tool";
    }

    @Override
    public String getDescription() {
        return "Finds entities matching a natural language description";
    }

    @Override
    public Class<EntityDiscoveryInput> getInputClass() {
        return EntityDiscoveryInput.class;
    }

    @Override
    public Class<EntityDiscoveryOutput> getOutputClass() {
        return EntityDiscoveryOutput.class;
    }

    @Override
    public String buildSystemPrompt(EntityDiscoveryInput input) {
        return """
            You are an entity discovery assistant.
            Given a description, find matching entities from the schema.
            Return results as JSON array.
            """;
    }

    @Override
    public String buildUserPrompt(EntityDiscoveryInput input) {
        return "Find entities matching: " + input.getQuery();
    }

    @Override
    public EntityDiscoveryOutput parseResponse(String response, EntityDiscoveryInput input) {
        // Parse JSON response from LLM
        return new ObjectMapper().readValue(response, EntityDiscoveryOutput.class);
    }

    @Override
    public CbToolResult<EntityDiscoveryOutput> execute(EntityDiscoveryInput input, CbToolContext context) {
        try {
            String systemPrompt = buildSystemPrompt(input);
            String userPrompt = buildUserPrompt(input);

            // Call LLM
            OpenAIResponse response = openAIService.chat(systemPrompt, userPrompt);

            // Parse response
            EntityDiscoveryOutput output = parseResponse(response.getContent(), input);

            // Build debug info if enabled
            CbToolDebugInfo debugInfo = null;
            if (context.isDebugEnabled()) {
                debugInfo = CbToolDebugInfo.builder()
                    .systemPrompt(systemPrompt)
                    .userPrompt(userPrompt)
                    .llmResponse(response.getContent())
                    .modelUsed(getModel())
                    .promptTokens(response.getPromptTokens())
                    .completionTokens(response.getCompletionTokens())
                    .build();
            }

            return CbToolResult.<EntityDiscoveryOutput>builder()
                .output(output)
                .success(true)
                .tokensUsed(response.getTotalTokens())
                .debugInfo(debugInfo)
                .build();

        } catch (Exception e) {
            return CbToolResult.failure("Error: " + e.getMessage(), e);
        }
    }
}
```

### Example: Logic-based Tool

```java
@Service
public class JoinPathFinderTool implements CbLogicTool<JoinPathFinderInput, JoinPathFinderOutput> {

    @Autowired
    private SchemaService schemaService;

    @Override
    public String getAlias() {
        return "cb.join.path.finder";
    }

    @Override
    public String getName() {
        return "Join Path Finder";
    }

    @Override
    public String getDescription() {
        return "Calculates optimal join paths between entities";
    }

    @Override
    public Class<JoinPathFinderInput> getInputClass() {
        return JoinPathFinderInput.class;
    }

    @Override
    public Class<JoinPathFinderOutput> getOutputClass() {
        return JoinPathFinderOutput.class;
    }

    @Override
    public JoinPathFinderOutput process(JoinPathFinderInput input) {
        // Pure logic - find join paths
        List<JoinPath> paths = schemaService.findJoinPaths(
            input.getSourceEntity(),
            input.getTargetEntity()
        );
        return new JoinPathFinderOutput(paths);
    }

    @Override
    public CbToolResult<JoinPathFinderOutput> execute(JoinPathFinderInput input, CbToolContext context) {
        try {
            JoinPathFinderOutput output = process(input);

            CbToolDebugInfo debugInfo = null;
            if (context.isDebugEnabled()) {
                debugInfo = CbToolDebugInfo.builder()
                    .addInfo("sourceEntity", input.getSourceEntity())
                    .addInfo("targetEntity", input.getTargetEntity())
                    .addInfo("pathsFound", output.getPaths().size())
                    .build();
            }

            return CbToolResult.success(output, debugInfo);
        } catch (Exception e) {
            return CbToolResult.failure(e);
        }
    }
}
```

### Example: Hybrid Tool

```java
@Service
public class TemporalExpressionTool implements CbHybridTool<TemporalInput, TemporalOutput> {

    @Override
    public String getAlias() {
        return "cb.temporal.expression";
    }

    // ... other interface methods ...

    @Override
    public List<String> validate(TemporalOutput output, TemporalInput input) {
        List<String> errors = new ArrayList<>();

        if (output.getStartDate() != null && output.getEndDate() != null) {
            if (output.getStartDate().isAfter(output.getEndDate())) {
                errors.add("Start date cannot be after end date");
            }
        }

        return errors;
    }

    @Override
    public TemporalOutput transform(TemporalOutput output, TemporalInput input) {
        // Normalize dates, apply business rules
        return output;
    }

    @Override
    public boolean enableFallbackOnValidationFailure() {
        return true;  // Use fallback on validation failure
    }

    @Override
    public TemporalOutput getFallbackOutput(TemporalInput input, List<String> errors) {
        // Return sensible defaults
        return TemporalOutput.defaultRange();
    }
}
```

## How to Implement a New Workflow

```java
@Service
public class ReportFromPromptWorkflow extends AbstractCbWorkflow<ReportPromptInput, ReportResult> {

    @Override
    public String getAlias() {
        return "cb.report.from.prompt";
    }

    @Override
    public String getName() {
        return "Report from Prompt";
    }

    @Override
    public String getDescription() {
        return "Generates a report from natural language prompt";
    }

    @Override
    public Class<ReportPromptInput> getInputClass() {
        return ReportPromptInput.class;
    }

    @Override
    public Class<ReportResult> getOutputClass() {
        return ReportResult.class;
    }

    @Override
    public List<String> getToolAliases() {
        return List.of(
            "cb.intent.classifier",
            "cb.entity.discovery",
            "cb.filter.expression",
            "cb.ql.composer",
            "cb.ql.validator",
            "cb.ql.executor"
        );
    }

    @Override
    public List<String> getStepNames() {
        return List.of(
            "classifyIntent",
            "discoverEntities",
            "extractFilters",
            "composeQuery",
            "validateQuery",
            "executeQuery"
        );
    }

    @Override
    public CbWorkflowResult<ReportResult> execute(ReportPromptInput input, CbWorkflowContext context) {
        // Step 1: Classify intent
        CbToolResult<IntentOutput> intentResult = executeTool(
            "cb.intent.classifier",
            new IntentInput(input.getPrompt()),
            "classifyIntent",
            context
        );

        if (!intentResult.isSuccess()) {
            return buildFailureResult(intentResult.getErrorMessage(), "classifyIntent", context);
        }

        // Step 2: Discover entities
        CbToolResult<EntityOutput> entityResult = executeTool(
            "cb.entity.discovery",
            new EntityInput(input.getPrompt()),
            "discoverEntities",
            context
        );

        if (!entityResult.isSuccess()) {
            return buildFailureResult(entityResult.getErrorMessage(), "discoverEntities", context);
        }

        // ... continue with other steps ...

        // Build final result
        ReportResult output = ReportResult.builder()
            .intent(intentResult.getOutput().getIntent())
            .entities(entityResult.getOutput().getEntities())
            // ... set other fields ...
            .build();

        return buildSuccessResult(output, context);
    }
}
```

## Debug Mode

Debug mode captures detailed information about each execution for troubleshooting and analysis.

### Enabling Debug Mode

```java
// Via API request
CbToolExecuteRequest request = CbToolExecuteRequest.builder()
    .input(inputData)
    .debugEnabled(true)  // Enable debug
    .build();

// Via direct execution
CbToolContext context = CbToolContext.builder()
    .debugEnabled(true)
    .build();
```

### Debug Information Captured

For **LLM tools**:
- System prompt
- User prompt
- Raw LLM response
- Model used
- Token counts (prompt + completion)

For **Logic tools**:
- Logic alias (if using LG module)
- Input parameters
- Output values
- Logic language

For **Workflows**:
- Step-by-step traces
- Duration per step
- Input/output for each step
- Total tokens across all LLM calls

### Accessing Debug Information

```java
// In tool result
CbToolResult<Output> result = tool.execute(input, context);
CbToolDebugInfo debugInfo = result.getDebugInfo();

// In workflow result
CbWorkflowResult<Output> result = workflow.execute(input, context);
List<CbWorkflowStepTrace> traces = result.getStepTraces();
```

## Registry System

Tools and workflows are automatically discovered at startup via Spring's component scanning.

### Tool Registration

All `@Service` classes implementing `CbTool` are automatically registered:

```java
@Service
public class MyTool implements CbTool<Input, Output> {
    // ...
}
```

### Accessing Registered Tools

```java
@Autowired
private CbToolRegistry toolRegistry;

// Get a specific tool
Optional<CbTool<?, ?>> tool = toolRegistry.getTool("cb.my.tool");

// List all tools
List<CbToolInfo> tools = toolRegistry.getToolInfoList();

// Check if tool exists
boolean exists = toolRegistry.hasTool("cb.my.tool");
```

### Workflow Registration

Same pattern applies to workflows:

```java
@Autowired
private CbWorkflowRegistry workflowRegistry;

Optional<CbWorkflow<?, ?>> workflow = workflowRegistry.getWorkflow("cb.report.workflow");
```

## Execution Service

The `CbExecutionService` provides the main entry point for executing tools and workflows.

### Tool Execution

```java
@Autowired
private CbExecutionService executionService;

// Via API request
CbToolExecuteRequest request = CbToolExecuteRequest.builder()
    .input(Map.of("query", "find customers"))
    .debugEnabled(true)
    .build();

CbToolExecuteResponse response = executionService.executeTool("cb.entity.discovery", request, userId);

// Direct execution with typed input
CbToolResult<Output> result = executionService.executeToolDirect("cb.my.tool", input, debugEnabled);
```

### Workflow Execution

```java
CbWorkflowExecuteRequest request = CbWorkflowExecuteRequest.builder()
    .input(Map.of("prompt", "Show me sales for Q1"))
    .debugEnabled(true)
    .build();

CbWorkflowExecuteResponse response = executionService.executeWorkflow("cb.report.workflow", request, userId);
```

## Execution Tracking

The `CbExecutionTracker` maintains an in-memory history of executions.

```java
@Autowired
private CbExecutionTracker tracker;

// Get recent executions
List<CbExecutionSummary> recent = tracker.getRecentExecutions(10);

// Get by execution ID
Optional<ExecutionRecord> record = tracker.getExecution(executionId);

// Get statistics
ExecutionStats stats = tracker.getStats();
```

## Best Practices

1. **Tool Naming**: Use dot-separated aliases like `cb.category.name`
2. **Error Handling**: Never throw exceptions from `execute()` - return failed results
3. **Debug Info**: Always populate debug info when `context.isDebugEnabled()`
4. **Type Safety**: Use specific input/output DTOs, not generic Maps
5. **Validation**: For hybrid tools, validate LLM output before using
6. **Token Tracking**: Track and report token usage for cost monitoring
7. **Logging**: Use structured logging with correlation IDs

## Testing

```java
@ExtendWith(MockitoExtension.class)
class MyToolTest {

    @Test
    void testToolExecution() {
        MyTool tool = new MyTool();

        CbToolContext context = CbToolContext.debug();
        CbToolResult<Output> result = tool.execute(input, context);

        assertTrue(result.isSuccess());
        assertNotNull(result.getOutput());
        assertNotNull(result.getDebugInfo());
    }
}
```

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-05 | Initial framework implementation |
