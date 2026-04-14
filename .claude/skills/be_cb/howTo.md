# CB Module - How-To Guide

This guide provides practical examples and implementation patterns for common CB module tasks.

## Table of Contents

1. [Setting Up Entity Documentation](#setting-up-entity-documentation)
2. [Creating Domain Knowledge](#creating-domain-knowledge)
3. [Defining Query Templates](#defining-query-templates)
4. [Implementing Business Rules](#implementing-business-rules)
5. [Handling User Feedback](#handling-user-feedback)
6. [Multi-Turn Conversations](#multi-turn-conversations)
7. [Monitoring Coverage](#monitoring-coverage)
8. [Frontend Integration](#frontend-integration)

---

## Setting Up Entity Documentation

### Step 1: Document an Entity

```java
@Service
public class DocumentationSetupService {

    @Autowired
    private CbEntityDocumentationRepository entityDocRepo;

    @Autowired
    private CbAttributeDocumentationRepository attrDocRepo;

    public void documentCustomerEntity() {
        // Create entity documentation
        CbEntityDocumentation entityDoc = new CbEntityDocumentation();
        entityDoc.setObjectTypeAlias("cr.Customer");
        entityDoc.setBusinessDescription(
            "A Customer represents an individual or organization that " +
            "has a business relationship with the company. Customers can " +
            "have contracts, contacts, and associated addresses."
        );
        entityDoc.setUsageNotes(
            "Use this entity when querying customer-related data. " +
            "Always consider privacy regulations when accessing customer data."
        );
        entityDoc.setDomainContext("Customer Relationship Management");
        entityDoc.setLastReviewedAt(LocalDateTime.now());
        entityDoc.setReviewedByUserId(getCurrentUserId());

        entityDoc = entityDocRepo.save(entityDoc);

        // Document key attributes
        documentAttribute(entityDoc, "name",
            "The full legal name of the customer",
            "Examples: 'ACME Corporation', 'John Smith'");

        documentAttribute(entityDoc, "customerNumber",
            "Unique identifier assigned to each customer",
            "Format: CUS-XXXXXXXX (8 digits)");

        documentAttribute(entityDoc, "status",
            "Current status of the customer relationship",
            "Values: ACTIVE, INACTIVE, PROSPECT, CHURNED");

        documentAttribute(entityDoc, "city",
            "City where the customer is located",
            "Examples: 'Munich', 'Berlin', 'Hamburg'");
    }

    private void documentAttribute(CbEntityDocumentation entity,
            String attrName, String description, String examples) {
        CbAttributeDocumentation attrDoc = new CbAttributeDocumentation();
        attrDoc.setEntityDocumentation(entity);
        attrDoc.setAttributeName(attrName);
        attrDoc.setBusinessDescription(description);
        attrDoc.setExampleValues(examples);
        attrDocRepo.save(attrDoc);
    }
}
```

### Step 2: Verify Documentation Coverage

```java
@Autowired
private CbCoverageService coverageService;

public void checkCoverage() {
    CbCoverageMetric metric = coverageService.calculateModuleCoverage("cr");

    System.out.println("Module: " + metric.getModuleName());
    System.out.println("Coverage: " + metric.getCoveragePercent() + "%");
    System.out.println("Documented: " + metric.getDocumentedElements() +
                       " / " + metric.getTotalElements());
}
```

---

## Creating Domain Knowledge

### Define Domain Concepts

```java
@Service
public class KnowledgeSetupService {

    @Autowired
    private CbDomainConceptRepository conceptRepo;

    @Autowired
    private CbSynonymRepository synonymRepo;

    public void setupContractConcepts() {
        // Define "active contract" concept
        CbDomainConcept activeContract = new CbDomainConcept();
        activeContract.setTerm("active contract");
        activeContract.setDefinition(
            "A contract that is currently in effect, has status ACTIVE, " +
            "and has not yet reached its end date."
        );
        activeContract.setCategory("Contract Management");
        activeContract = conceptRepo.save(activeContract);

        // Add synonyms
        addSynonym(activeContract, "running contract", CbSynonymType.EXACT);
        addSynonym(activeContract, "current contract", CbSynonymType.EXACT);
        addSynonym(activeContract, "valid contract", CbSynonymType.RELATED);

        // Define "premium customer" concept
        CbDomainConcept premiumCustomer = new CbDomainConcept();
        premiumCustomer.setTerm("premium customer");
        premiumCustomer.setDefinition(
            "A customer with tier level PREMIUM or annual revenue " +
            "exceeding 100,000 EUR."
        );
        premiumCustomer.setCategory("Customer Segmentation");
        premiumCustomer = conceptRepo.save(premiumCustomer);

        addSynonym(premiumCustomer, "VIP customer", CbSynonymType.EXACT);
        addSynonym(premiumCustomer, "key account", CbSynonymType.RELATED);
        addSynonym(premiumCustomer, "customer", CbSynonymType.BROADER);
    }

    private void addSynonym(CbDomainConcept concept, String synonym,
            CbSynonymType type) {
        CbSynonym syn = new CbSynonym();
        syn.setConcept(concept);
        syn.setSynonym(synonym);
        syn.setType(type);
        synonymRepo.save(syn);
    }
}
```

---

## Defining Query Templates

### Create a High-Accuracy Template

```java
@Service
public class TemplateSetupService {

    @Autowired
    private CbQueryTemplateRepository templateRepo;

    @Autowired
    private CbQueryTemplateParameterRepository paramRepo;

    public void createCustomerContractsTemplate() {
        // Create template
        CbQueryTemplate template = new CbQueryTemplate();
        template.setName("Customer Active Contracts");
        template.setDescription(
            "Retrieves all active contracts for a specific customer"
        );
        template.setIntentPattern(
            "(?i).*(show|get|list|find).*active.*contracts.*" +
            "(for|of).*customer.*"
        );
        template.setQlRequestJson(buildQlRequestJson());
        template.setIsActive(true);
        template.setPriority(100);  // High priority

        template = templateRepo.save(template);

        // Add parameter for customer name
        CbQueryTemplateParameter customerParam =
            new CbQueryTemplateParameter();
        customerParam.setTemplate(template);
        customerParam.setParameterName("customerName");
        customerParam.setDataType("STRING");
        customerParam.setExtractionPattern(
            "customer\\s+(?:named?\\s+)?['\"]?([^'\"]+)['\"]?"
        );
        paramRepo.save(customerParam);
    }

    private String buildQlRequestJson() {
        return """
        {
          "queries": [{
            "name": "customerActiveContracts",
            "start": {
              "name": "cr.Customer",
              "as": "c"
            },
            "joins": [
              {
                "name": "cm.Contract#customer",
                "as": "co",
                "joinType": "inner"
              }
            ],
            "filters": [
              {
                "field": "c.name",
                "operation": "LIKE",
                "value": "%${customerName}%"
              },
              {
                "field": "co.status",
                "operation": "EQ",
                "value": "ACTIVE"
              }
            ],
            "fields": [
              "co.contractNumber",
              "co.status",
              "co.startDate",
              "co.endDate",
              "c.name"
            ]
          }]
        }
        """;
    }
}
```

### Template Matching in Query Processing

```java
@Service
public class CbQueryService {

    @Autowired
    private CbQueryTemplateRepository templateRepo;

    public CbQueryResponse processQuery(String nlQuery, Long userId) {
        // Step 1: Try template matching first
        List<CbQueryTemplate> templates = templateRepo
            .findByIsActiveTrueOrderByPriorityDesc();

        for (CbQueryTemplate template : templates) {
            Pattern pattern = Pattern.compile(
                template.getIntentPattern(),
                Pattern.CASE_INSENSITIVE
            );

            if (pattern.matcher(nlQuery).matches()) {
                // Template matched - extract parameters and fill
                return buildFromTemplate(template, nlQuery);
            }
        }

        // Step 2: No template match - use LLM generation
        return generateWithLLM(nlQuery, userId);
    }

    private CbQueryResponse buildFromTemplate(
            CbQueryTemplate template, String nlQuery) {
        // Extract parameter values from natural language
        Map<String, String> params = extractParameters(
            template.getParameters(), nlQuery
        );

        // Replace placeholders in QL template
        String qlJson = template.getQlRequestJson();
        for (Map.Entry<String, String> param : params.entrySet()) {
            qlJson = qlJson.replace(
                "${" + param.getKey() + "}",
                param.getValue()
            );
        }

        CbQueryResponse response = new CbQueryResponse();
        response.setQlRequest(parseQlRequest(qlJson));
        response.setConfidence(BigDecimal.valueOf(0.99));  // High confidence
        response.setExplanation("Matched template: " + template.getName());

        return response;
    }
}
```

---

## Implementing Business Rules

### Create Reusable Filter Rules

```java
@Service
public class BusinessRuleSetupService {

    @Autowired
    private CbBusinessRuleRepository ruleRepo;

    public void createCommonRules() {
        // Rule: Active only
        createRule(
            "Active Records Only",
            "Filters to show only active records",
            "cm.Contract",
            "[{\"field\":\"status\",\"operation\":\"EQ\",\"value\":\"ACTIVE\"}]"
        );

        // Rule: Not deleted
        createRule(
            "Exclude Deleted",
            "Excludes soft-deleted records",
            null,  // Applies to any entity with deletedAt field
            "[{\"field\":\"deletedAt\",\"operation\":\"IS_NULL\"}]"
        );

        // Rule: Current year only
        createRule(
            "Current Year",
            "Filters to current year records",
            "cm.Contract",
            "[{\"field\":\"startDate\",\"operation\":\"GTE\",\"value\":\"YEAR_START\"}," +
            "{\"field\":\"startDate\",\"operation\":\"LTE\",\"value\":\"YEAR_END\"}]"
        );

        // Rule: Premium customers
        createRule(
            "Premium Customers Only",
            "Filters to premium tier customers",
            "cr.Customer",
            "[{\"field\":\"tier\",\"operation\":\"EQ\",\"value\":\"PREMIUM\"}]"
        );
    }

    private void createRule(String name, String description,
            String objectTypeAlias, String qlFilterJson) {
        CbBusinessRule rule = new CbBusinessRule();
        rule.setName(name);
        rule.setDescription(description);
        rule.setObjectTypeAlias(objectTypeAlias);
        rule.setQlFilterJson(qlFilterJson);
        rule.setIsActive(true);
        ruleRepo.save(rule);
    }
}
```

### Apply Rules Automatically

```java
@Service
public class CbKnowledgeBaseService {

    @Autowired
    private CbBusinessRuleRepository ruleRepo;

    @Autowired
    private ObjectMapper objectMapper;

    public QlRequestDto applyBusinessRules(
            QlRequestDto qlRequest,
            List<String> ruleNames) {

        for (String ruleName : ruleNames) {
            Optional<CbBusinessRule> ruleOpt = ruleRepo
                .findByNameAndIsActiveTrue(ruleName);

            if (ruleOpt.isPresent()) {
                CbBusinessRule rule = ruleOpt.get();

                List<FilterCriteria> ruleFilters = objectMapper.readValue(
                    rule.getQlFilterJson(),
                    new TypeReference<List<FilterCriteria>>() {}
                );

                // Add filters to all matching queries
                for (QlQueryDto query : qlRequest.getQueries()) {
                    if (rule.getObjectTypeAlias() == null ||
                        matchesEntity(query, rule.getObjectTypeAlias())) {

                        if (query.getFilters() == null) {
                            query.setFilters(new ArrayList<>());
                        }
                        query.getFilters().addAll(ruleFilters);
                    }
                }
            }
        }

        return qlRequest;
    }
}
```

---

## Handling User Feedback

### Collect and Process Feedback

```java
@Service
public class FeedbackProcessingService {

    @Autowired
    private CbQueryFeedbackRepository feedbackRepo;

    @Autowired
    private CbTrainingDataRepository trainingDataRepo;

    @Autowired
    private CbQueryLogRepository queryLogRepo;

    public void submitFeedback(CbFeedbackRequest request) {
        CbQueryLog queryLog = queryLogRepo
            .findById(request.getQueryLogId())
            .orElseThrow(() -> new NotFoundException("Query log not found"));

        // Create feedback record
        CbQueryFeedback feedback = new CbQueryFeedback();
        feedback.setQueryLog(queryLog);
        feedback.setUserId(getCurrentUserId());
        feedback.setWasHelpful(request.getWasHelpful());
        feedback.setRating(request.getRating());
        feedback.setFeedbackComment(request.getComment());
        feedback.setCorrectedQlJson(request.getCorrectedQlJson());
        feedback.setFeedbackAt(LocalDateTime.now());

        feedbackRepo.save(feedback);

        // Create training data from feedback
        createTrainingData(queryLog, feedback);
    }

    private void createTrainingData(CbQueryLog queryLog,
            CbQueryFeedback feedback) {

        CbTrainingData trainingData = new CbTrainingData();
        trainingData.setNaturalLanguageQuery(queryLog.getNaturalLanguageQuery());

        // Use corrected QL if provided, otherwise use original
        if (feedback.getCorrectedQlJson() != null) {
            trainingData.setQlRequestJson(feedback.getCorrectedQlJson());
            trainingData.setIsPositiveExample(true);

            // Also create negative example from original
            CbTrainingData negativeExample = new CbTrainingData();
            negativeExample.setNaturalLanguageQuery(
                queryLog.getNaturalLanguageQuery()
            );
            negativeExample.setQlRequestJson(queryLog.getGeneratedQlJson());
            negativeExample.setIsPositiveExample(false);
            negativeExample.setQualityScore(BigDecimal.ZERO);
            negativeExample.setSource("FEEDBACK");
            negativeExample.setCapturedAt(LocalDateTime.now());
            trainingDataRepo.save(negativeExample);
        } else {
            trainingData.setQlRequestJson(queryLog.getGeneratedQlJson());
            trainingData.setIsPositiveExample(feedback.getWasHelpful());
        }

        trainingData.setQualityScore(
            BigDecimal.valueOf(feedback.getRating()).divide(
                BigDecimal.valueOf(5), 2, RoundingMode.HALF_UP
            )
        );
        trainingData.setSource("FEEDBACK");
        trainingData.setUsedForTraining(false);
        trainingData.setCapturedAt(LocalDateTime.now());

        trainingDataRepo.save(trainingData);
    }
}
```

---

## Multi-Turn Conversations

### Implement Conversation Context

```java
@Service
public class CbConversationService {

    @Autowired
    private CbConversationSessionRepository sessionRepo;

    @Autowired
    private CbConversationTurnRepository turnRepo;

    @Autowired
    private CbQueryService queryService;

    public CbConversationTurnResponse processTurn(
            Long sessionId, String userInput) {

        CbConversationSession session = sessionRepo.findById(sessionId)
            .orElseThrow(() -> new NotFoundException("Session not found"));

        if (session.getStatus() != CbSessionStatus.ACTIVE) {
            throw new InvalidStateException("Session is not active");
        }

        // Get conversation context
        CbConversationContext context = parseContext(session.getContextJson());

        // Resolve pronouns and references
        String resolvedInput = resolveReferences(userInput, context);

        // Process the resolved query
        CbQueryResponse queryResponse = queryService.processQuery(
            resolvedInput, session.getUserId()
        );

        // Update context with new information
        updateContext(context, userInput, queryResponse);
        session.setContextJson(serializeContext(context));
        session.setLastActivityAt(LocalDateTime.now());
        sessionRepo.save(session);

        // Create turn record
        CbConversationTurn turn = new CbConversationTurn();
        turn.setSession(session);
        turn.setTurnNumber(getNextTurnNumber(sessionId));
        turn.setUserInput(userInput);
        turn.setResponseJson(serializeResponse(queryResponse));
        turn.setTimestamp(LocalDateTime.now());
        turnRepo.save(turn);

        return new CbConversationTurnResponse(turn, queryResponse);
    }

    private String resolveReferences(String input,
            CbConversationContext context) {

        String resolved = input;

        // Resolve "they", "them", "their"
        if (input.matches("(?i).*\\b(they|them|their)\\b.*")) {
            if (context.getLastReferencedEntities() != null &&
                !context.getLastReferencedEntities().isEmpty()) {

                String replacement = context.getLastEntityDescription();
                resolved = resolved.replaceAll(
                    "(?i)\\b(they|them|their)\\b",
                    replacement
                );
            }
        }

        // Resolve "it"
        if (input.matches("(?i).*\\bit\\b.*")) {
            if (context.getCurrentFocus() != null) {
                resolved = resolved.replaceAll(
                    "(?i)\\bit\\b",
                    context.getCurrentFocus()
                );
            }
        }

        return resolved;
    }
}
```

---

## Monitoring Coverage

### Create Coverage Dashboard Data

```java
@Service
public class CbCoverageDashboardService {

    @Autowired
    private CbCoverageService coverageService;

    public CbCoverageDashboard getDashboardData() {
        List<CbCoverageMetric> moduleMetrics =
            coverageService.calculateAllModuleCoverage();

        CbCoverageDashboard dashboard = new CbCoverageDashboard();

        // Calculate overall coverage
        int totalEntities = moduleMetrics.stream()
            .mapToInt(CbCoverageMetric::getTotalElements).sum();
        int documentedEntities = moduleMetrics.stream()
            .mapToInt(CbCoverageMetric::getDocumentedElements).sum();

        dashboard.setOverallCoveragePercent(
            BigDecimal.valueOf(documentedEntities)
                .divide(BigDecimal.valueOf(totalEntities), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
        );

        // Group by coverage level
        Map<String, List<CbCoverageMetric>> grouped = moduleMetrics.stream()
            .collect(Collectors.groupingBy(m -> {
                if (m.getCoveragePercent().compareTo(BigDecimal.valueOf(80)) >= 0) {
                    return "HIGH";
                } else if (m.getCoveragePercent().compareTo(BigDecimal.valueOf(50)) >= 0) {
                    return "MEDIUM";
                } else {
                    return "LOW";
                }
            }));

        dashboard.setHighCoverageModules(grouped.getOrDefault("HIGH", List.of()));
        dashboard.setMediumCoverageModules(grouped.getOrDefault("MEDIUM", List.of()));
        dashboard.setLowCoverageModules(grouped.getOrDefault("LOW", List.of()));

        return dashboard;
    }
}
```

---

## Frontend Integration

### Angular Service Pattern

```typescript
// cb-query.service.ts
@Injectable({ providedIn: 'root' })
export class CbQueryService {

    private baseUrl = '/mvsa/cb';

    constructor(private http: HttpClient) {}

    processQuery(query: string, options?: CbQueryOptions): Observable<CbQueryResponse> {
        return this.http.post<CbQueryResponse>(`${this.baseUrl}/query`, {
            query,
            options
        });
    }

    executeQuery(query: string): Observable<CbExecutionResponse> {
        return this.http.post<CbExecutionResponse>(`${this.baseUrl}/query/execute`, {
            query
        });
    }

    submitFeedback(feedback: CbFeedbackRequest): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/feedback`, feedback);
    }

    getCoverage(): Observable<CbCoverageOverview> {
        return this.http.get<CbCoverageOverview>(`${this.baseUrl}/coverage`);
    }
}
```

### Component Implementation

```typescript
// cb-query-interface.component.ts
@Component({
    selector: 'mvs-cb-query-interface',
    template: `
        <div class="cb-query-interface">
            <textarea [(ngModel)]="query"
                      placeholder="Ask a question in natural language..."
                      (keydown.enter)="submitQuery()">
            </textarea>

            <button pButton (click)="submitQuery()" [loading]="loading">
                <i class="fa fa-search"></i> Ask
            </button>

            @if (response) {
                <div class="response">
                    <div class="explanation">{{ response.explanation }}</div>
                    <div class="confidence">
                        Confidence: {{ response.confidence | percent }}
                    </div>
                    <mvs-ql-preview [qlRequest]="response.qlRequest"></mvs-ql-preview>

                    <div class="feedback">
                        <button (click)="submitFeedback(true)">
                            <i class="fa fa-thumbs-up"></i>
                        </button>
                        <button (click)="submitFeedback(false)">
                            <i class="fa fa-thumbs-down"></i>
                        </button>
                    </div>
                </div>
            }
        </div>
    `
})
export class CbQueryInterfaceComponent {
    query: string = '';
    response: CbQueryResponse | null = null;
    loading = false;

    constructor(private cbQueryService: CbQueryService) {}

    submitQuery(): void {
        if (!this.query.trim()) return;

        this.loading = true;
        this.cbQueryService.processQuery(this.query)
            .pipe(finalize(() => this.loading = false))
            .subscribe(response => {
                this.response = response;
            });
    }

    submitFeedback(wasHelpful: boolean): void {
        if (!this.response?.queryLogId) return;

        this.cbQueryService.submitFeedback({
            queryLogId: this.response.queryLogId,
            wasHelpful
        }).subscribe();
    }
}
```
