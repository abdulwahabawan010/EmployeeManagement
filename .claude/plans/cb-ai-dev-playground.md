# CB AI Dev Playground - Feature Plan

## Overview

Create a comprehensive development playground for testing, debugging, and monitoring all CB AI Tools and Workflows. The playground provides full visibility into the AI processing pipeline with detailed debug information.

---

## Current State Analysis

### Existing CB AI Tools (16 Tools)

| Category | Tool | Alias | Description |
|----------|------|-------|-------------|
| **Language** | IntentClassifierTool | `intent-classifier` | Classifies user intent from NL queries |
| **Language** | EntityMentionExtractorTool | `entity-mention-extractor` | Extracts entity mentions from text |
| **Knowledge** | EntityDiscoveryTool | `entity-discovery` | Discovers relevant entities from NL |
| **Knowledge** | SchemaContextTool | `schema-context` | Provides schema context for queries |
| **Knowledge** | AttributeDiscoveryTool | `attribute-discovery` | Discovers relevant attributes |
| **Knowledge** | DomainConceptResolverTool | `domain-concept-resolver` | Resolves domain concepts/synonyms |
| **Knowledge** | JoinPathFinderTool | `join-path-finder` | Finds join paths between entities |
| **Query** | QlQueryComposerTool | `ql-query-composer` | Composes QL queries from structured input |
| **Query** | QlQueryValidatorTool | `ql-query-validator` | Validates QL query syntax and semantics |
| **Query** | QlExecutorTool | `ql-executor` | Executes QL queries |
| **Query** | FilterExpressionTool | `filter-expression` | Parses NL to filter expressions |
| **Query** | AggregationExpressionTool | `aggregation-expression` | Parses NL to aggregation expressions |
| **Query** | TemporalExpressionTool | `temporal-expression` | Parses temporal expressions |
| **Output** | VisualizationSuggesterTool | `visualization-suggester` | Suggests visualization types |
| **Output** | NarrativeGeneratorTool | `narrative-generator` | Generates narrative explanations |

### Existing CB Workflows (4 Workflows)

| Workflow | Alias | Description | Steps |
|----------|-------|-------------|-------|
| QueryBuilderWorkflow | `query-builder` | Builds QL from structured input | JoinPathFinder → QlQueryComposer → QlQueryValidator → (Explainer) |
| EntitySearchWorkflow | `entity-search` | Searches for entities | EntityDiscovery → AttributeDiscovery → Search |
| DataExplorerWorkflow | `data-explorer` | Explores data interactively | Schema → EntityDiscovery → Query → Visualization |
| ReportFromPromptWorkflow | `report-from-prompt` | Generates reports from NL | Intent → EntityDiscovery → QueryBuilder → Narrative |

### Existing Backend APIs

```
GET  /api/cb/ai/tools                      # List all tools
GET  /api/cb/ai/tools/{alias}              # Get tool details
POST /api/cb/ai/tools/{alias}/execute      # Execute tool

GET  /api/cb/ai/workflows                  # List all workflows
GET  /api/cb/ai/workflows/{alias}          # Get workflow details
POST /api/cb/ai/workflows/{alias}/execute  # Execute workflow

GET  /api/cb/ai/executions                 # List recent executions
GET  /api/cb/ai/executions/{id}            # Get execution details
```

---

## Feature List

### Phase 1: Core Playground Infrastructure

#### 1.1 CB AI Dev Playground Page
- **Route:** `/cb/dev-playground`
- **Purpose:** Central hub for all CB AI testing and debugging
- **Components:**
  - Tab-based navigation (Tools | Workflows | Execution History | Debug Console)
  - Global debug mode toggle
  - Session management

#### 1.2 Tool Explorer & Executor
- **Features:**
  - Browse all available tools by category
  - View tool metadata (name, description, input/output schemas)
  - Dynamic form generation based on input DTO schema
  - JSON input mode for advanced users
  - Execute tools with real-time status
  - View structured output results

#### 1.3 Workflow Explorer & Executor
- **Features:**
  - Browse all available workflows
  - Visual workflow diagram showing steps
  - Configure workflow input parameters
  - Execute workflows with progress tracking
  - View step-by-step execution results

#### 1.4 Debug Mode Infrastructure
- **Global Debug Toggle:** Enable/disable debug mode for all executions
- **Debug Data Captured:**
  - System prompt (for LLM tools)
  - User prompt (for LLM tools)
  - Raw LLM response
  - Model used
  - Token counts (prompt/completion)
  - Execution timing per step
  - Input/output for each step
  - Error details and stack traces

---

### Phase 2: Advanced Debug Features

#### 2.1 Debug Panel Component
- **Collapsible sections for:**
  - LLM Prompts (syntax-highlighted)
  - LLM Response (syntax-highlighted JSON)
  - Token Usage (prompt/completion/total)
  - Timing Breakdown (per step visualization)
  - Input/Output Diff View

#### 2.2 Execution Timeline
- **Features:**
  - Visual timeline of all steps
  - Duration bars for each step
  - Success/failure indicators
  - Click to expand step details
  - Compare multiple executions

#### 2.3 Workflow Step Trace Viewer
- **Features:**
  - Hierarchical view of workflow steps
  - Expand/collapse step details
  - View input transformation between steps
  - Highlight skipped steps with reasons
  - Show data flow between steps

#### 2.4 LLM Prompt Analyzer
- **Features:**
  - Side-by-side view: System Prompt | User Prompt | Response
  - Token count per section
  - Copy prompts to clipboard
  - Edit and re-execute with modified prompts
  - Compare prompt variations

---

### Phase 3: Testing & Comparison Features

#### 3.1 Test Case Management
- **Features:**
  - Save test inputs as named test cases
  - Organize test cases by tool/workflow
  - Bulk execute test cases
  - Assert expected outputs
  - Export/import test cases (JSON)

#### 3.2 A/B Comparison Mode
- **Features:**
  - Run same input on two different configurations
  - Side-by-side result comparison
  - Diff view for outputs
  - Compare execution times
  - Compare token usage

#### 3.3 Batch Execution
- **Features:**
  - Upload CSV/JSON with multiple test inputs
  - Execute all inputs sequentially or in parallel
  - Download results as CSV/JSON
  - Summary statistics (success rate, avg time)

---

### Phase 4: Monitoring & Analytics

#### 4.1 Execution History Dashboard
- **Features:**
  - Paginated list of all executions
  - Filter by: tool/workflow, status, date range
  - Quick stats: success rate, avg duration
  - Re-execute from history
  - Delete old executions

#### 4.2 Performance Metrics
- **Metrics Tracked:**
  - Execution count by tool/workflow
  - Average execution time
  - Token usage trends
  - Error rates
  - Most used tools/workflows

#### 4.3 Error Analysis
- **Features:**
  - Group errors by type/message
  - View error frequency
  - Drill down to specific executions
  - Export error reports

---

## Technical Implementation

### Backend Extensions Required

#### New DTOs

```java
// CbToolSchemaDto.java - Input/output schema information
record CbToolSchemaDto(
    String toolAlias,
    JsonSchema inputSchema,
    JsonSchema outputSchema,
    List<FieldInfo> inputFields,
    List<FieldInfo> outputFields
) {}

// CbDebugExecutionDto.java - Full debug execution response
record CbDebugExecutionDto(
    String executionId,
    String type, // TOOL or WORKFLOW
    Object input,
    Object output,
    boolean success,
    String errorMessage,
    long durationMs,
    int totalTokens,
    CbToolDebugInfo debugInfo,
    List<CbWorkflowStepTrace> stepTraces
) {}
```

#### New API Endpoints

```
GET /api/cb/ai/tools/{alias}/schema        # Get input/output schema
POST /api/cb/ai/tools/{alias}/validate     # Validate input without executing

GET /api/cb/ai/debug/executions            # List debug executions
GET /api/cb/ai/debug/executions/{id}       # Get full debug execution
DELETE /api/cb/ai/debug/executions/{id}    # Delete execution

POST /api/cb/ai/test-cases                 # Save test case
GET /api/cb/ai/test-cases                  # List test cases
DELETE /api/cb/ai/test-cases/{id}          # Delete test case
POST /api/cb/ai/test-cases/batch           # Batch execute test cases
```

### Frontend Components

```
frontend/features/feature-core/cb/
├── page/
│   └── cb-dev-playground-page/
│       ├── cb-dev-playground.page.ts
│       ├── cb-dev-playground.page.html
│       └── cb-dev-playground.page.scss
├── component/
│   ├── cb-tool-explorer/
│   │   ├── cb-tool-explorer.component.ts
│   │   ├── cb-tool-explorer.component.html
│   │   └── cb-tool-explorer.component.scss
│   ├── cb-tool-executor/
│   │   ├── cb-tool-executor.component.ts
│   │   ├── cb-tool-executor.component.html
│   │   └── cb-tool-executor.component.scss
│   ├── cb-workflow-explorer/
│   │   ├── cb-workflow-explorer.component.ts
│   │   ├── cb-workflow-explorer.component.html
│   │   └── cb-workflow-explorer.component.scss
│   ├── cb-workflow-executor/
│   │   ├── cb-workflow-executor.component.ts
│   │   ├── cb-workflow-executor.component.html
│   │   └── cb-workflow-executor.component.scss
│   ├── cb-debug-panel/
│   │   ├── cb-debug-panel.component.ts
│   │   ├── cb-debug-panel.component.html
│   │   └── cb-debug-panel.component.scss
│   ├── cb-execution-timeline/
│   │   ├── cb-execution-timeline.component.ts
│   │   ├── cb-execution-timeline.component.html
│   │   └── cb-execution-timeline.component.scss
│   ├── cb-step-trace-viewer/
│   │   ├── cb-step-trace-viewer.component.ts
│   │   ├── cb-step-trace-viewer.component.html
│   │   └── cb-step-trace-viewer.component.scss
│   ├── cb-llm-prompt-viewer/
│   │   ├── cb-llm-prompt-viewer.component.ts
│   │   ├── cb-llm-prompt-viewer.component.html
│   │   └── cb-llm-prompt-viewer.component.scss
│   └── cb-execution-history/
│       ├── cb-execution-history.component.ts
│       ├── cb-execution-history.component.html
│       └── cb-execution-history.component.scss
└── service/api/
    ├── cb-ai-tool.service.ts
    ├── cb-ai-workflow.service.ts
    └── cb-ai-debug.service.ts
```

---

## UI Wireframes

### Main Dev Playground Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CB AI Dev Playground                                    [Debug Mode: ON]   │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Tools] [Workflows] [Execution History] [Debug Console]                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────────────────────────────┐  │
│  │  Tool Categories    │  │  Tool: intent-classifier                   │  │
│  │                     │  │                                             │  │
│  │  ▼ Language (2)     │  │  Description: Classifies user intent...    │  │
│  │    • intent-class.  │  │                                             │  │
│  │    • entity-mention │  │  ┌─────────────────────────────────────┐    │  │
│  │                     │  │  │  Input                               │    │  │
│  │  ▼ Knowledge (5)    │  │  │  ┌─────────────────────────────────┐│    │  │
│  │    • entity-discov. │  │  │  │ text: [________________]        ││    │  │
│  │    • schema-context │  │  │  │ possibleIntents: [dropdown]     ││    │  │
│  │    • attribute-disc │  │  │  └─────────────────────────────────┘│    │  │
│  │    • domain-concept │  │  │  [Form] [JSON]                       │    │  │
│  │    • join-path-find │  │  └─────────────────────────────────────┘    │  │
│  │                     │  │                                             │  │
│  │  ▼ Query (6)        │  │  [Execute Tool]                             │  │
│  │    • ql-query-comp  │  │                                             │  │
│  │    • ql-query-valid │  │  ┌─────────────────────────────────────┐    │  │
│  │    • ql-executor    │  │  │  Output                              │    │  │
│  │    • filter-express │  │  │  intent: "list"                      │    │  │
│  │    • aggregation-ex │  │  │  confidence: 0.92                    │    │  │
│  │    • temporal-expr  │  │  │  subIntents: ["filter"]              │    │  │
│  │                     │  │  └─────────────────────────────────────┘    │  │
│  │  ▼ Output (2)       │  │                                             │  │
│  │    • visualization  │  │  ┌─────────────────────────────────────┐    │  │
│  │    • narrative-gen  │  │  │  Debug Info                    [▼]  │    │  │
│  │                     │  │  │  ├─ LLM Prompts                      │    │  │
│  └─────────────────────┘  │  │  ├─ Token Usage: 156 + 42 = 198     │    │  │
│                           │  │  ├─ Duration: 1,234ms               │    │  │
│                           │  │  └─ Model: gpt-4.1-mini             │    │  │
│                           │  └─────────────────────────────────────┘    │  │
│                           └─────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Workflow Execution View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Workflow: query-builder                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Execution Timeline                                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Step 1: Find Join Paths  ████████░░░░░░░░░░░░░  320ms  ✓               │ │
│  │ Step 2: Compose Query    █████████████████░░░░  890ms  ✓               │ │
│  │ Step 3: Validate Query   ████░░░░░░░░░░░░░░░░░  180ms  ✓               │ │
│  │ Step 4: Explain Query    (skipped - not requested)                     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Step Details: Step 2 - Compose Query                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Tool: ql-query-composer                                               │ │
│  │  Duration: 890ms | Tokens: 234 + 156 = 390                             │ │
│  │                                                                        │ │
│  │  ┌──────────────────────┐  ┌──────────────────────┐                    │ │
│  │  │ Input               │  │ Output              │                    │ │
│  │  │ {                   │  │ {                   │                    │ │
│  │  │   "primaryEntity":  │  │   "qlRequest": {   │                    │ │
│  │  │     "cr.Customer",  │  │     "queries": [...│                    │ │
│  │  │   ...               │  │   }                 │                    │ │
│  │  │ }                   │  │ }                   │                    │ │
│  │  └──────────────────────┘  └──────────────────────┘                    │ │
│  │                                                                        │ │
│  │  [View LLM Prompts] [View Full Debug Info]                             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Debug Panel (Expanded)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Debug Info - Step 2: Compose Query                              [Collapse] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ▼ LLM Prompts                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ System Prompt                                                    [Copy]│ │
│  │ ──────────────────────────────────────────────────────────────────────│ │
│  │ You are a QL query composer. Given the following structured input,    │ │
│  │ generate a valid QL query...                                          │ │
│  │                                                                        │ │
│  │ Available entities: cr.Customer, cm.Contract, ...                     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ User Prompt                                                      [Copy]│ │
│  │ ──────────────────────────────────────────────────────────────────────│ │
│  │ Build a query with:                                                   │ │
│  │ - Primary entity: cr.Customer                                         │ │
│  │ - Joins: [cm.Contract]                                                │ │
│  │ - Filters: status = 'ACTIVE'                                          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ LLM Response                                                     [Copy]│ │
│  │ ──────────────────────────────────────────────────────────────────────│ │
│  │ {                                                                      │ │
│  │   "qlRequest": {                                                       │ │
│  │     "queries": [{                                                      │ │
│  │       "name": "main",                                                  │ │
│  │       "start": { "name": "cr.Customer", "as": "c" },                   │ │
│  │       ...                                                              │ │
│  │     }]                                                                 │ │
│  │   }                                                                    │ │
│  │ }                                                                      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ▼ Token Usage                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Prompt Tokens:      234  ████████████████░░░░░░░░░░  60%              │ │
│  │  Completion Tokens:  156  ██████████░░░░░░░░░░░░░░░░  40%              │ │
│  │  ──────────────────────────────────────                                │ │
│  │  Total Tokens:       390                                               │ │
│  │  Model: gpt-4.1-mini                                                   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ▼ Timing                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Start:    2024-01-15 14:32:45.123                                     │ │
│  │  End:      2024-01-15 14:32:46.013                                     │ │
│  │  Duration: 890ms                                                       │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Core Infrastructure (Priority: MUST)
1. Create route `/cb/dev-playground`
2. Implement Tool Explorer with category grouping
3. Implement Tool Executor with form/JSON input modes
4. Basic debug panel showing debug info
5. Frontend services for tool/workflow APIs

### Phase 2: Workflow Support (Priority: MUST)
1. Implement Workflow Explorer
2. Implement Workflow Executor
3. Execution Timeline component
4. Step Trace Viewer with expand/collapse

### Phase 3: Advanced Debug (Priority: NEED)
1. LLM Prompt Viewer component
2. Token usage visualization
3. Timing breakdown charts
4. Full debug info panel

### Phase 4: History & Testing (Priority: NICE)
1. Execution History dashboard
2. Test Case management
3. A/B Comparison mode
4. Batch execution

---

## Acceptance Criteria

### Phase 1
- [ ] User can browse all tools organized by category
- [ ] User can view tool metadata (description, input/output)
- [ ] User can input tool parameters via form or JSON
- [ ] User can execute tools and see results
- [ ] Debug mode toggle enables capture of debug info
- [ ] Debug info displays LLM prompts, response, timing

### Phase 2
- [ ] User can browse all workflows
- [ ] User can configure workflow inputs
- [ ] User can execute workflows with progress indicator
- [ ] Timeline shows step-by-step execution
- [ ] User can expand any step to see details

### Phase 3
- [ ] LLM prompts displayed with syntax highlighting
- [ ] Token usage shown with visual breakdown
- [ ] Timing shown per step with bar chart
- [ ] Copy-to-clipboard for prompts and responses

### Phase 4
- [ ] Execution history with filters and pagination
- [ ] Save/load test cases
- [ ] Compare two executions side-by-side
- [ ] Batch execute multiple inputs

---

## Files to Create/Modify

### Backend (New Files)
1. `CbToolSchemaDto.java` - Tool schema information
2. `CbAiDebugController.java` - Debug endpoints

### Backend (Modified Files)
1. `CbAiToolController.java` - Add schema endpoint
2. `CbToolRegistry.java` - Add schema retrieval

### Frontend (New Files)
1. `cb-dev-playground.page.ts/html/scss`
2. `cb-tool-explorer.component.ts/html/scss`
3. `cb-tool-executor.component.ts/html/scss`
4. `cb-workflow-explorer.component.ts/html/scss`
5. `cb-workflow-executor.component.ts/html/scss`
6. `cb-debug-panel.component.ts/html/scss`
7. `cb-execution-timeline.component.ts/html/scss`
8. `cb-step-trace-viewer.component.ts/html/scss`
9. `cb-llm-prompt-viewer.component.ts/html/scss`
10. `cb-execution-history.component.ts/html/scss`
11. `cb-ai-tool.service.ts`
12. `cb-ai-workflow.service.ts`
13. `cb-ai-debug.service.ts`

### Frontend (Modified Files)
1. `cb.route.ts` - Add new route
2. `cb.module.ts` - Register new components
