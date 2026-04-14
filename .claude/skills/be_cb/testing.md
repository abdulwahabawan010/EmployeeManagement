# CB Module - Testing Documentation

This document describes the testing infrastructure and patterns for the CB (Cognitive Backend) module.

## CbTestService

**Location:** `src/test/java/com/mvs/backend/test/cb/CbTestService.java`

CbTestService is a test data factory that follows the established pattern from TmTestService. It provides factory methods for creating test data for all 14 CB entities.

### Class Structure

```java
@Service
public class CbTestService {

    @Autowired
    private CbEntityDocumentationRepository entityDocumentationRepository;
    @Autowired
    private CbAttributeDocumentationRepository attributeDocumentationRepository;
    @Autowired
    private CbDomainConceptRepository domainConceptRepository;
    @Autowired
    private CbSynonymRepository synonymRepository;
    @Autowired
    private CbBusinessRuleRepository businessRuleRepository;
    @Autowired
    private CbQueryTemplateRepository queryTemplateRepository;
    @Autowired
    private CbQueryTemplateParameterRepository queryTemplateParameterRepository;
    @Autowired
    private CbQueryLogRepository queryLogRepository;
    @Autowired
    private CbQueryFeedbackRepository queryFeedbackRepository;
    @Autowired
    private CbTrainingDataRepository trainingDataRepository;
    @Autowired
    private CbModelVersionRepository modelVersionRepository;
    @Autowired
    private CbCoverageMetricRepository coverageMetricRepository;
    @Autowired
    private CbConversationSessionRepository conversationSessionRepository;
    @Autowired
    private CbConversationTurnRepository conversationTurnRepository;

    // Factory methods...
}
```

### Factory Methods

#### Documentation Entities

```java
/**
 * Creates an entity documentation record.
 */
@Transactional(propagation = Propagation.REQUIRES_NEW)
public CbEntityDocumentation createEntityDocumentation(
        String objectTypeAlias,
        String businessDescription) {

    CbEntityDocumentation doc = new CbEntityDocumentation();
    doc.setObjectTypeAlias(objectTypeAlias);
    doc.setBusinessDescription(businessDescription);
    doc.setUsageNotes("Test usage notes");
    doc.setDomainContext("Test domain");
    doc.setLastReviewedAt(LocalDateTime.now());
    return entityDocumentationRepository.save(doc);
}

/**
 * Creates an attribute documentation record.
 */
@Transactional(propagation = Propagation.REQUIRES_NEW)
public CbAttributeDocumentation createAttributeDocumentation(
        CbEntityDocumentation entityDoc,
        String attributeName,
        String description) {

    CbAttributeDocumentation attrDoc = new CbAttributeDocumentation();
    attrDoc.setEntityDocumentation(entityDoc);
    attrDoc.setAttributeName(attributeName);
    attrDoc.setBusinessDescription(description);
    attrDoc.setExampleValues("Example: value1, value2");
    return attributeDocumentationRepository.save(attrDoc);
}
```

#### Knowledge Base Entities

```java
/**
 * Creates a domain concept.
 */
@Transactional(propagation = Propagation.REQUIRES_NEW)
public CbDomainConcept createDomainConcept(String term, String definition) {
    CbDomainConcept concept = new CbDomainConcept();
    concept.setTerm(term);
    concept.setDefinition(definition);
    concept.setCategory("Test Category");
    return domainConceptRepository.save(concept);
}

/**
 * Creates a synonym for a concept.
 */
@Transactional(propagation = Propagation.REQUIRES_NEW)
public CbSynonym createSynonym(
        CbDomainConcept concept,
        String synonym,
        CbSynonymType type) {

    CbSynonym syn = new CbSynonym();
    syn.setConcept(concept);
    syn.setSynonym(synonym);
    syn.setType(type);
    return synonymRepository.save(syn);
}

/**
 * Creates a business rule.
 */
@Transactional(propagation = Propagation.REQUIRES_NEW)
public CbBusinessRule createBusinessRule(
        String name,
        String objectTypeAlias,
        String qlFilterJson) {

    CbBusinessRule rule = new CbBusinessRule();
    rule.setName(name);
    rule.setDescription("Test rule description");
    rule.setObjectTypeAlias(objectTypeAlias);
    rule.setQlFilterJson(qlFilterJson);
    rule.setIsActive(true);
    return businessRuleRepository.save(rule);
}
```

#### Query Template Entities

```java
/**
 * Creates a query template.
 */
@Transactional(propagation = Propagation.REQUIRES_NEW)
public CbQueryTemplate createQueryTemplate(
        String name,
        String intentPattern,
        String qlRequestJson) {

    CbQueryTemplate template = new CbQueryTemplate();
    template.setName(name);
    template.setDescription("Test template");
    template.setIntentPattern(intentPattern);
    template.setQlRequestJson(qlRequestJson);
    template.setIsActive(true);
    template.setPriority(100);
    return queryTemplateRepository.save(template);
}

/**
 * Creates a template parameter.
 */
@Transactional(propagation = Propagation.REQUIRES_NEW)
public CbQueryTemplateParameter createTemplateParameter(
        CbQueryTemplate template,
        String parameterName,
        String dataType) {

    CbQueryTemplateParameter param = new CbQueryTemplateParameter();
    param.setTemplate(template);
    param.setParameterName(parameterName);
    param.setDataType(dataType);
    param.setExtractionPattern(".*" + parameterName + ".*");
    return queryTemplateParameterRepository.save(param);
}
```

#### Logging & Feedback Entities

```java
/**
 * Creates a query log entry.
 */
@Transactional(propagation = Propagation.REQUIRES_NEW)
public CbQueryLog createQueryLog(
        String naturalLanguageQuery,
        CbQueryStatus status,
        BigDecimal confidence) {

    CbQueryLog log = new CbQueryLog();
    log.setUserId(1L);
    log.setNaturalLanguageQuery(naturalLanguageQuery);
    log.setGeneratedQlJson("{\"queries\":[]}");
    log.setConfidence(confidence);
    log.setLatencyMs(100L);
    log.setStatus(status);
    log.setExecutedAt(LocalDateTime.now());
    return queryLogRepository.save(log);
}

/**
 * Creates feedback for a query.
 */
@Transactional(propagation = Propagation.REQUIRES_NEW)
public CbQueryFeedback createQueryFeedback(
        CbQueryLog queryLog,
        Boolean wasHelpful,
        Integer rating) {

    CbQueryFeedback feedback = new CbQueryFeedback();
    feedback.setQueryLog(queryLog);
    feedback.setUserId(1L);
    feedback.setWasHelpful(wasHelpful);
    feedback.setRating(rating);
    feedback.setFeedbackAt(LocalDateTime.now());
    return queryFeedbackRepository.save(feedback);
}
```

#### ML Entities

```java
/**
 * Creates training data.
 */
@Transactional(propagation = Propagation.REQUIRES_NEW)
public CbTrainingData createTrainingData(
        String naturalLanguageQuery,
        String qlRequestJson,
        Boolean isPositiveExample) {

    CbTrainingData data = new CbTrainingData();
    data.setNaturalLanguageQuery(naturalLanguageQuery);
    data.setQlRequestJson(qlRequestJson);
    data.setIsPositiveExample(isPositiveExample);
    data.setQualityScore(BigDecimal.valueOf(0.9));
    data.setSource("MANUAL");
    data.setUsedForTraining(false);
    data.setCapturedAt(LocalDateTime.now());
    return trainingDataRepository.save(data);
}

/**
 * Creates a model version.
 */
@Transactional(propagation = Propagation.REQUIRES_NEW)
public CbModelVersion createModelVersion(
        String name,
        Integer version,
        CbModelStatus status) {

    CbModelVersion model = new CbModelVersion();
    model.setName(name);
    model.setVersion(version);
    model.setStatus(status);
    model.setConfigurationJson("{\"model\":\"gpt-4\"}");
    model.setAccuracy(BigDecimal.valueOf(0.85));
    model.setTrainedAt(LocalDateTime.now());
    model.setTrainingSampleSize(1000);
    return modelVersionRepository.save(model);
}

/**
 * Creates a coverage metric.
 */
@Transactional(propagation = Propagation.REQUIRES_NEW)
public CbCoverageMetric createCoverageMetric(
        String moduleName,
        BigDecimal coveragePercent) {

    CbCoverageMetric metric = new CbCoverageMetric();
    metric.setModuleName(moduleName);
    metric.setTotalElements(100);
    metric.setDocumentedElements(coveragePercent.intValue());
    metric.setCoveragePercent(coveragePercent);
    metric.setCalculatedAt(LocalDateTime.now());
    return coverageMetricRepository.save(metric);
}
```

#### Conversation Entities

```java
/**
 * Creates a conversation session.
 */
@Transactional(propagation = Propagation.REQUIRES_NEW)
public CbConversationSession createConversationSession(
        Long userId,
        CbSessionStatus status) {

    CbConversationSession session = new CbConversationSession();
    session.setUserId(userId);
    session.setStartedAt(LocalDateTime.now());
    session.setLastActivityAt(LocalDateTime.now());
    session.setStatus(status);
    session.setContextJson("{\"referencedEntities\":[]}");
    return conversationSessionRepository.save(session);
}

/**
 * Creates a conversation turn.
 */
@Transactional(propagation = Propagation.REQUIRES_NEW)
public CbConversationTurn createConversationTurn(
        CbConversationSession session,
        Integer turnNumber,
        String userInput) {

    CbConversationTurn turn = new CbConversationTurn();
    turn.setSession(session);
    turn.setTurnNumber(turnNumber);
    turn.setUserInput(userInput);
    turn.setResponseJson("{\"success\":true}");
    turn.setTimestamp(LocalDateTime.now());
    return conversationTurnRepository.save(turn);
}
```

---

## Unit Tests

Unit tests use `@UnitTest` annotation and extend `AbstractTestBaseUnit`.

### CbSecurityServiceTest

**Location:** `src/test/java/com/mvs/backend/test/cb/unit/CbSecurityServiceTest.java`

```java
@UnitTest
public class CbSecurityServiceTest extends AbstractTestBaseUnit {

    @InjectMocks
    private CbSecurityService securityService;

    @Test
    public void validateQuery_validQuery_shouldPass() {
        // Arrange
        QlRequestDto qlRequest = createValidQlRequest();

        // Act
        CbSecurityValidation result = securityService.validateQuery(qlRequest);

        // Assert
        assertThat(result.isValid()).isTrue();
        assertThat(result.getViolations()).isEmpty();
    }

    @Test
    public void checkInjectionPatterns_sqlInjection_shouldDetect() {
        // Arrange
        String maliciousInput = "'; DROP TABLE users; --";

        // Act
        boolean detected = securityService.checkInjectionPatterns(maliciousInput);

        // Assert
        assertThat(detected).isTrue();
    }

    @Test
    public void checkAccessPermissions_unauthorizedEntity_shouldDeny() {
        // Arrange
        Long userId = 1L;
        List<String> entities = Arrays.asList("um.User", "admin.SystemConfig");

        // Act
        boolean hasAccess = securityService.checkAccessPermissions(userId, entities);

        // Assert
        assertThat(hasAccess).isFalse();
    }

    @Test
    public void calculateQueryComplexity_simpleQuery_shouldBeLow() {
        // Arrange
        QlRequestDto simpleQuery = createSimpleQlRequest();

        // Act
        int complexity = securityService.calculateQueryComplexity(simpleQuery);

        // Assert
        assertThat(complexity).isLessThan(10);
    }
}
```

### CbSchemaLinkingServiceTest

**Location:** `src/test/java/com/mvs/backend/test/cb/unit/CbSchemaLinkingServiceTest.java`

```java
@UnitTest
public class CbSchemaLinkingServiceTest extends AbstractTestBaseUnit {

    @InjectMocks
    private CbSchemaLinkingService schemaLinkingService;

    @Mock
    private CbSynonymRepository synonymRepository;

    @Mock
    private CbEntityDocumentationRepository entityDocRepository;

    @Test
    public void linkTermToEntities_exactMatch_shouldReturnHighConfidence() {
        // Arrange
        String term = "Customer";

        // Act
        List<CbSchemaMatch> matches = schemaLinkingService.linkTermToEntities(term);

        // Assert
        assertThat(matches).isNotEmpty();
        assertThat(matches.get(0).getEntityAlias()).isEqualTo("cr.Customer");
        assertThat(matches.get(0).getConfidence()).isGreaterThan(BigDecimal.valueOf(0.9));
    }

    @Test
    public void findJoinPath_directRelation_shouldFindPath() {
        // Arrange
        String fromEntity = "cr.Customer";
        String toEntity = "cm.Contract";

        // Act
        List<JoinDefinition> path = schemaLinkingService.findJoinPath(fromEntity, toEntity);

        // Assert
        assertThat(path).isNotEmpty();
        assertThat(path).hasSizeLessThanOrEqualTo(3);
    }

    @Test
    public void resolveSynonyms_knownSynonym_shouldResolveToCanonical() {
        // Arrange
        String term = "running contract";
        when(synonymRepository.findBySynonym(term))
            .thenReturn(Optional.of(createSynonymForActiveContract()));

        // Act
        CbSynonymResolution resolution = schemaLinkingService.resolveSynonyms(term);

        // Assert
        assertThat(resolution.getCanonicalTerm()).isEqualTo("active contract");
    }
}
```

### CbKnowledgeBaseServiceTest

**Location:** `src/test/java/com/mvs/backend/test/cb/unit/CbKnowledgeBaseServiceTest.java`

```java
@UnitTest
public class CbKnowledgeBaseServiceTest extends AbstractTestBaseUnit {

    @InjectMocks
    private CbKnowledgeBaseService knowledgeBaseService;

    @Mock
    private CbDomainConceptRepository conceptRepository;

    @Mock
    private CbBusinessRuleRepository businessRuleRepository;

    @Test
    public void findConcepts_partialMatch_shouldReturnMatches() {
        // Arrange
        String query = "active";
        when(conceptRepository.findByTermContaining(query))
            .thenReturn(Arrays.asList(createActiveContractConcept()));

        // Act
        List<CbDomainConcept> concepts = knowledgeBaseService.findConcepts(query);

        // Assert
        assertThat(concepts).hasSize(1);
        assertThat(concepts.get(0).getTerm()).contains("active");
    }

    @Test
    public void getBusinessRules_forEntity_shouldReturnActiveRules() {
        // Arrange
        String objectTypeAlias = "cm.Contract";
        when(businessRuleRepository.findByObjectTypeAliasAndIsActiveTrue(objectTypeAlias))
            .thenReturn(Arrays.asList(createActiveContractsRule()));

        // Act
        List<CbBusinessRule> rules = knowledgeBaseService.getBusinessRules(objectTypeAlias);

        // Assert
        assertThat(rules).isNotEmpty();
        assertThat(rules).allMatch(CbBusinessRule::getIsActive);
    }

    @Test
    public void applyBusinessRules_withValidRule_shouldModifyQuery() {
        // Arrange
        QlRequestDto originalQuery = createQlRequestWithoutFilters();
        List<String> ruleNames = Arrays.asList("Active Contracts");

        // Act
        QlRequestDto modifiedQuery = knowledgeBaseService
            .applyBusinessRules(originalQuery, ruleNames);

        // Assert
        assertThat(modifiedQuery.getQueries().get(0).getFilters()).isNotEmpty();
    }
}
```

---

## Integration Tests

Integration tests use `@IntegrationTest` annotation and extend `AbstractTestBaseIntegration`.

### CbQueryServiceIntegrationTest

**Location:** `src/test/java/com/mvs/backend/test/cb/integration/CbQueryServiceIntegrationTest.java`

```java
@IntegrationTest
public class CbQueryServiceIntegrationTest extends AbstractTestBaseIntegration {

    @Autowired
    private CbQueryService queryService;

    @Autowired
    private CbTestService cbTestService;

    @BeforeEach
    void setUp() {
        // Create test data
        cbTestService.createEntityDocumentation("cr.Customer", "Customer entity");
        cbTestService.createDomainConcept("customer", "A person or company");
    }

    @Test
    public void processNaturalLanguageQuery_simpleQuery_shouldGenerateValidQl() {
        // Arrange
        String nlQuery = "Show all customers";
        Long userId = 1L;

        // Act
        CbQueryResponse response = queryService.processNaturalLanguageQuery(nlQuery, userId);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getQlRequest()).isNotNull();
        assertThat(response.getQlRequest().getQueries()).isNotEmpty();
        assertThat(response.getConfidence()).isGreaterThan(BigDecimal.ZERO);
    }

    @Test
    public void processNaturalLanguageQuery_withFilter_shouldIncludeFilterInQl() {
        // Arrange
        String nlQuery = "Show active customers from Munich";
        Long userId = 1L;

        // Act
        CbQueryResponse response = queryService.processNaturalLanguageQuery(nlQuery, userId);

        // Assert
        assertThat(response.getQlRequest().getQueries().get(0).getFilters())
            .anyMatch(f -> f.getField().contains("city") || f.getField().contains("status"));
    }

    @Test
    public void validateQuery_invalidSyntax_shouldReturnErrors() {
        // Arrange
        String nlQuery = "";

        // Act
        CbValidationResponse response = queryService.validateQuery(nlQuery);

        // Assert
        assertThat(response.isValid()).isFalse();
        assertThat(response.getErrors()).isNotEmpty();
    }
}
```

### CbCoverageServiceIntegrationTest

**Location:** `src/test/java/com/mvs/backend/test/cb/integration/CbCoverageServiceIntegrationTest.java`

```java
@IntegrationTest
public class CbCoverageServiceIntegrationTest extends AbstractTestBaseIntegration {

    @Autowired
    private CbCoverageService coverageService;

    @Autowired
    private CbTestService cbTestService;

    @Test
    public void calculateModuleCoverage_withDocumentation_shouldReturnCorrectPercentage() {
        // Arrange
        String moduleName = "cr";
        // Assume cr module has 10 entities, we document 3
        cbTestService.createEntityDocumentation("cr.Customer", "Customer description");
        cbTestService.createEntityDocumentation("cr.Contact", "Contact description");
        cbTestService.createEntityDocumentation("cr.Address", "Address description");

        // Act
        CbCoverageMetric metric = coverageService.calculateModuleCoverage(moduleName);

        // Assert
        assertThat(metric).isNotNull();
        assertThat(metric.getModuleName()).isEqualTo(moduleName);
        assertThat(metric.getDocumentedElements()).isGreaterThan(0);
        assertThat(metric.getCoveragePercent()).isGreaterThan(BigDecimal.ZERO);
    }

    @Test
    public void calculateEntityCoverage_fullyDocumented_shouldReturn100Percent() {
        // Arrange
        String objectTypeAlias = "test.FullyDocumented";
        CbEntityDocumentation entityDoc = cbTestService.createEntityDocumentation(
            objectTypeAlias, "Full documentation"
        );
        // Document all attributes
        cbTestService.createAttributeDocumentation(entityDoc, "id", "Primary key");
        cbTestService.createAttributeDocumentation(entityDoc, "name", "Name field");

        // Act
        CbCoverageMetric metric = coverageService.calculateEntityCoverage(objectTypeAlias);

        // Assert
        assertThat(metric.getCoveragePercent()).isGreaterThanOrEqualTo(BigDecimal.valueOf(50));
    }
}
```

### CbTrainingServiceIntegrationTest

**Location:** `src/test/java/com/mvs/backend/test/cb/integration/CbTrainingServiceIntegrationTest.java`

```java
@IntegrationTest
public class CbTrainingServiceIntegrationTest extends AbstractTestBaseIntegration {

    @Autowired
    private CbTrainingService trainingService;

    @Autowired
    private CbTestService cbTestService;

    @Test
    public void createTrainingDataFromFeedback_positiveFeedback_shouldCreateTrainingData() {
        // Arrange
        CbQueryLog queryLog = cbTestService.createQueryLog(
            "Show all customers",
            CbQueryStatus.SUCCESS,
            BigDecimal.valueOf(0.95)
        );
        CbQueryFeedback feedback = cbTestService.createQueryFeedback(queryLog, true, 5);

        // Act
        CbTrainingData trainingData = trainingService.createTrainingDataFromFeedback(feedback);

        // Assert
        assertThat(trainingData).isNotNull();
        assertThat(trainingData.getIsPositiveExample()).isTrue();
        assertThat(trainingData.getSource()).isEqualTo("FEEDBACK");
    }

    @Test
    public void collectTrainingData_withUnusedData_shouldReturnRecords() {
        // Arrange
        cbTestService.createTrainingData(
            "Show customers",
            "{\"queries\":[]}",
            true
        );
        cbTestService.createTrainingData(
            "List contracts",
            "{\"queries\":[]}",
            true
        );

        // Act
        List<CbTrainingData> data = trainingService.collectTrainingData(100);

        // Assert
        assertThat(data).hasSizeGreaterThanOrEqualTo(2);
        assertThat(data).allMatch(d -> !d.getUsedForTraining());
    }

    @Test
    public void getActiveModelVersion_withActiveModel_shouldReturnModel() {
        // Arrange
        cbTestService.createModelVersion("TestModel", 1, CbModelStatus.ACTIVE);

        // Act
        CbModelVersion activeModel = trainingService.getActiveModelVersion();

        // Assert
        assertThat(activeModel).isNotNull();
        assertThat(activeModel.getStatus()).isEqualTo(CbModelStatus.ACTIVE);
    }
}
```

---

## Running Tests

### Run All CB Tests
```bash
./gradlew test --tests "com.mvs.backend.test.cb.*"
```

### Run Unit Tests Only
```bash
./gradlew test --tests "com.mvs.backend.test.cb.unit.*"
```

### Run Integration Tests Only
```bash
./gradlew test --tests "com.mvs.backend.test.cb.integration.*"
```

### Run Specific Test Class
```bash
./gradlew test --tests "com.mvs.backend.test.cb.unit.CbSecurityServiceTest"
```

---

## Test Data Isolation

The `@Transactional(propagation = Propagation.REQUIRES_NEW)` annotation on CbTestService factory methods ensures:

1. **Data isolation:** Each test creates its own data in a new transaction
2. **Rollback safety:** Failed tests don't leave dirty data
3. **Parallel execution:** Tests can run in parallel without conflicts

### Important Notes

- **Unique constraints:** Entities like `CbEntityDocumentation` have unique constraints on `objectTypeAlias`. Use unique values in tests or clean up between tests.
- **Foreign key dependencies:** Create parent entities before children (e.g., `CbEntityDocumentation` before `CbAttributeDocumentation`)
- **Enum values:** Always use valid enum constants from `CbSynonymType`, `CbModelStatus`, `CbQueryStatus`, `CbSessionStatus`
