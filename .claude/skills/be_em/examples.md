# EM Module Examples

Practical code examples for common EM module operations.

---

## Creating a Complete Schema

### Step 1: Create Schema Type

```java
@Autowired
private EmSchemaTypeService schemaTypeService;

// Create schema type
EmSchemaType type = schemaTypeService.createSchemaTypeCommit(
    "Customer Data",
    "customer-data"
);
```

### Step 2: Create Schema

```java
@Autowired
private EmSchemaService schemaService;

// Create schema
EmSchema schema = new EmSchema();
schema.setName("Customer Import v1.0");
schema.setSchemaType(type);
schema.setVersionStatus(EmSchemaVersionStatus.DRAFT);
schema.setSchemaScope(EmSchemaScope.STANDARD);
schema.setStatus(EmSchemaStatus.OK);

schema = schemaService.createSchemaNewTransaction(schema);
```

### Step 3: Create Fields

```java
@Autowired
private EmSchemaFieldService fieldService;

// Create root field (complex type)
EmSchemaField rootField = new EmSchemaField();
rootField.setSchema(schema);
rootField.setAlias("customer");
rootField.setName("Customer");
rootField.setFieldTypeInternal(EmSchemaFieldTypeInternal.COMPLEX);
rootField.setFieldScope(EmSchemaFieldScope.STANDARD);

// Create simple fields
EmSchemaField nameField = new EmSchemaField();
nameField.setSchema(schema);
nameField.setAlias("customerName");
nameField.setName("Customer Name");
nameField.setFieldTypeInternal(EmSchemaFieldTypeInternal.SIMPLE);
nameField.setFieldScope(EmSchemaFieldScope.STANDARD);
nameField.setLength(100);

EmSchemaField statusField = new EmSchemaField();
statusField.setSchema(schema);
statusField.setAlias("status");
statusField.setName("Status");
statusField.setFieldTypeInternal(EmSchemaFieldTypeInternal.SIMPLE);
statusField.setFieldScope(EmSchemaFieldScope.STANDARD);
statusField.setHasValueList(true);

// Save all fields
fieldService.createOrUpdateSchemaFields(
    List.of(rootField, nameField, statusField),
    schema
);
```

### Step 4: Create Structures

```java
@Autowired
private EmSchemaStructureService structureService;

// Create root structure
EmSchemaStructure rootStructure = new EmSchemaStructure();
rootStructure.setSchema(schema);
rootStructure.setField(rootField);
rootStructure.setStructureType(EmSchemaStructureType.ROOT);
rootStructure.setName("Customer Root");
rootStructure.setCardinality(EmSchemaCardinality.ONE_TO_ONE);
rootStructure.setStructureScope(EmSchemaStructureScope.STANDARD);

// Create child structures
EmSchemaStructure nameStructure = new EmSchemaStructure();
nameStructure.setSchema(schema);
nameStructure.setField(nameField);
nameStructure.setParent(rootStructure);
nameStructure.setStructureType(EmSchemaStructureType.PARENT_CHILD);
nameStructure.setName("Customer Name");
nameStructure.setCardinality(EmSchemaCardinality.ONE_TO_ONE);

EmSchemaStructure statusStructure = new EmSchemaStructure();
statusStructure.setSchema(schema);
statusStructure.setField(statusField);
statusStructure.setParent(rootStructure);
statusStructure.setStructureType(EmSchemaStructureType.PARENT_CHILD);
statusStructure.setName("Status");
statusStructure.setCardinality(EmSchemaCardinality.ONE_TO_ONE);

// Save structures
structureService.createOrUpdateSchemaStructure(
    List.of(rootStructure, nameStructure, statusStructure),
    schema
);
```

### Step 5: Create Field Values

```java
@Autowired
private EmSchemaFieldValueService fieldValueService;
@Autowired
private FieldValueService ccFieldValueService; // From CC module

// Get or create CC field values
FieldValue activeValue = ccFieldValueService.getOrCreate("active", "Active");
FieldValue inactiveValue = ccFieldValueService.getOrCreate("inactive", "Inactive");

// Create schema field values
EmSchemaFieldValue activeFV = new EmSchemaFieldValue();
activeFV.setSchema(schema);
activeFV.setField(statusField);
activeFV.setFieldValue(activeValue);
activeFV.setLabel("Active");
activeFV.setDescription("Customer is active");

EmSchemaFieldValue inactiveFV = new EmSchemaFieldValue();
inactiveFV.setSchema(schema);
inactiveFV.setField(statusField);
inactiveFV.setFieldValue(inactiveValue);
inactiveFV.setLabel("Inactive");
inactiveFV.setDescription("Customer is inactive");

fieldValueService.createOrUpdateSchemaFieldValue(
    List.of(activeFV, inactiveFV),
    schema
);
```

---

## Creating a Choice Structure

```java
// Create address type field for choice discrimination
EmSchemaField addressTypeField = new EmSchemaField();
addressTypeField.setSchema(schema);
addressTypeField.setAlias("addressType");
addressTypeField.setName("Address Type");
addressTypeField.setFieldTypeInternal(EmSchemaFieldTypeInternal.SIMPLE);
addressTypeField.setHasValueList(true);

// Create address fields (complex types for different address formats)
EmSchemaField deAddressField = new EmSchemaField();
deAddressField.setSchema(schema);
deAddressField.setAlias("germanAddress");
deAddressField.setName("German Address");
deAddressField.setFieldTypeInternal(EmSchemaFieldTypeInternal.COMPLEX);

EmSchemaField usAddressField = new EmSchemaField();
usAddressField.setSchema(schema);
usAddressField.setAlias("usAddress");
usAddressField.setName("US Address");
usAddressField.setFieldTypeInternal(EmSchemaFieldTypeInternal.COMPLEX);

fieldService.createOrUpdateSchemaFields(
    List.of(addressTypeField, deAddressField, usAddressField),
    schema
);

// Create choice structure
EmSchemaStructure addressChoice = new EmSchemaStructure();
addressChoice.setSchema(schema);
addressChoice.setField(addressField); // Parent address field
addressChoice.setParent(rootStructure);
addressChoice.setStructureType(EmSchemaStructureType.CHOICE);
addressChoice.setName("Address Choice");
addressChoice.setCardinality(EmSchemaCardinality.ONE_TO_ONE);
addressChoice.setChoiceResolution(EmSchemaChoiceResolution.DISCRIMINATOR);
addressChoice.setDiscriminatorField(addressTypeField);

// Create choice options
EmSchemaStructure deAddressOption = new EmSchemaStructure();
deAddressOption.setSchema(schema);
deAddressOption.setField(deAddressField);
deAddressOption.setParent(addressChoice);
deAddressOption.setStructureType(EmSchemaStructureType.PARENT_CHILD);
deAddressOption.setName("German Address Option");
deAddressOption.setDiscriminatorValue("DE");
deAddressOption.setCardinality(EmSchemaCardinality.ONE_TO_ONE);

EmSchemaStructure usAddressOption = new EmSchemaStructure();
usAddressOption.setSchema(schema);
usAddressOption.setField(usAddressField);
usAddressOption.setParent(addressChoice);
usAddressOption.setStructureType(EmSchemaStructureType.PARENT_CHILD);
usAddressOption.setName("US Address Option");
usAddressOption.setDiscriminatorValue("US");
usAddressOption.setCardinality(EmSchemaCardinality.ONE_TO_ONE);

structureService.createOrUpdateSchemaStructure(
    List.of(addressChoice, deAddressOption, usAddressOption),
    schema
);
```

---

## Creating an Extension Schema

```java
// Find base schema
EmSchema baseSchema = schemaService.findSchemaById(baseSchemaId);

// Create extension schema
EmSchema extensionSchema = new EmSchema();
extensionSchema.setName("Customer Import - Company XY");
extensionSchema.setSchemaType(baseSchema.getSchemaType());
extensionSchema.setVersionStatus(EmSchemaVersionStatus.DRAFT);
extensionSchema.setSchemaScope(EmSchemaScope.EXTENSION);
extensionSchema.setBaseSchema(baseSchema);
extensionSchema.setOrganization("Company XY");
extensionSchema.setOrganizationCode("XY123");

extensionSchema = schemaService.createSchemaNewTransaction(extensionSchema);

// Add extended field (new field not in base)
EmSchemaField customField = new EmSchemaField();
customField.setSchema(extensionSchema);
customField.setAlias("customerId");
customField.setName("Company XY Customer ID");
customField.setFieldTypeInternal(EmSchemaFieldTypeInternal.SIMPLE);
customField.setFieldScope(EmSchemaFieldScope.EXTENDED);

fieldService.createOrUpdateSchemaFields(List.of(customField), extensionSchema);

// Override existing field
EmSchemaField baseNameField = findFieldByAlias(baseSchema, "customerName");

EmSchemaField overriddenNameField = new EmSchemaField();
overriddenNameField.setSchema(extensionSchema);
overriddenNameField.setAlias("customerName");
overriddenNameField.setName("Company XY Customer Name");
overriddenNameField.setFieldTypeInternal(EmSchemaFieldTypeInternal.SIMPLE);
overriddenNameField.setFieldScope(EmSchemaFieldScope.OVERRIDDEN);
overriddenNameField.setBaseField(baseNameField);
overriddenNameField.setLength(200); // Extended length
overriddenNameField.setOverriddenProperties("[\"length\", \"name\"]");

fieldService.createOrUpdateSchemaFields(List.of(overriddenNameField), extensionSchema);
```

---

## Working with Schema Runtime

### Creating Runtime and Processing Data

```java
@Autowired
private EmSchemaRuntimeService runtimeService;
@Autowired
private EmDtoService dtoService;

// Create runtime from schema
EmSchema schema = schemaService.findSchemaById(schemaId);
EmSchemaRuntime runtime = runtimeService.createSchemaRuntime(schema);

// Create runtime data
EmSchemaRuntimeData data = new EmSchemaRuntimeData(runtime);

// Get root structure
EmSchemaStructure rootStructure = runtime.getRootStructures().get(0);

// Add root node with data
EmSchemaRuntimeDataNode rootNode = data.addRootNode(rootStructure, null);

// Add child nodes
for (EmSchemaStructure childStructure : runtime.getChildrenStructures(rootStructure)) {
    EmSchemaField field = runtime.getField(childStructure.getField());

    // Get value from your data source
    Object value = getValueFromSource(field.getAlias());

    // Validate value if field has value list
    if (field.getHasValueList()) {
        List<EmSchemaFieldValue> allowedValues =
            runtime.getSchemaFieldValues().get(field.getId());
        if (!isValidValue(value, allowedValues)) {
            data.addMessage(EmMessageSeverity.ERROR,
                "Invalid value for field " + field.getName());
        }
    }

    // Add child node
    data.addChildNode(rootNode, childStructure, value);
}

// Convert to DTO for API response
EmSchemaRuntimeDataDto dto = dtoService.convert(data);
```

### Serializing and Deserializing Runtime Data

```java
// Serialize to JSON
String json = runtimeService.serializeRuntimeDataNode(rootNode);

// Store JSON somewhere...

// Later, deserialize
EmSchemaRuntimeDataNode restoredNode =
    runtimeService.deserializeRuntimeDataNode(json, runtime);
```

---

## Schema Versioning Workflow

```java
// 1. Create new version (DRAFT)
EmSchema draft = new EmSchema();
draft.setName("Customer Import v2.0");
draft.setVersionStatus(EmSchemaVersionStatus.DRAFT);
draft.setPreviousVersion(activeSchema);
draft = schemaService.createSchemaNewTransaction(draft);

// 2. Make modifications while in DRAFT
// ... modify fields, structures, etc.

// 3. Submit for review
draft.setVersionStatus(EmSchemaVersionStatus.REVIEW);
schemaService.saveSchemaNewTransaction(draft);

// 4. Activate (locks the schema)
draft.setVersionStatus(EmSchemaVersionStatus.ACTIVE);
draft.setLockedAt(LocalDateTime.now());
draft.setLockedBy(currentUser);
schemaService.saveSchemaNewTransaction(draft);

// 5. Deprecate old version
activeSchema.setVersionStatus(EmSchemaVersionStatus.DEPRECATED);
schemaService.saveSchemaNewTransaction(activeSchema);

// 6. Eventually archive
activeSchema.setVersionStatus(EmSchemaVersionStatus.ARCHIVED);
schemaService.saveSchemaNewTransaction(activeSchema);
```

---

## Deep Copy Schema Type

```java
@Autowired
private EmSchemaTypeService schemaTypeService;

// Get import type to copy
EiImportType importType = eiImportTypeService.findById(importTypeId);

// Perform deep copy
// This copies: SchemaType, all Schemas, all Fields, all Structures,
// all Comments, all FieldValues, all FieldValueComments
EmSchemaType copiedType = schemaTypeService.copy(importType);

// The copied type has:
// - Name with " - Copy" suffix
// - Unique alias
// - All related entities duplicated with new IDs
// - All references properly mapped
```

---

## API Controller Example

### Get Schema Runtime Endpoint

```java
@RestController
@RequestMapping("/mvsa/em/emSchemas")
public class EmSchemaController extends ObjectCrudController<EmSchema> {

    @Autowired
    private EmSchemaService schemaService;

    @Autowired
    private EmSchemaRuntimeService runtimeService;

    @Autowired
    private EmDtoService dtoService;

    @PostMapping("/{id}/runtime")
    public EmSchemaRuntimeDto getSchemaRuntime(@PathVariable Long id) {
        // 1. Fetch schema
        EmSchema schema = schemaService.findSchemaById(id);

        // 2. Create runtime
        EmSchemaRuntime runtime = runtimeService.createSchemaRuntime(schema);

        // 3. Convert to DTO
        return dtoService.convert(runtime);
    }
}
```

---

## Form Customization Example

### Dynamic Field Population in Structure Form

```java
public class EmSchemaStructureForm extends FormObjectAbstract<EmSchemaStructure> {

    @Autowired
    private EmSchemaFieldService fieldService;

    @Autowired
    private EmSchemaStructureService structureService;

    @Override
    protected void postFormGenerate() {
        FormFieldDto schemaField = FormHelper.findByAttributeValue("schema", this.formDto);
        FormFieldDto fieldField = FormHelper.findByAttributeValue("field", this.formDto);
        FormFieldDto parentField = FormHelper.findByAttributeValue("parent", this.formDto);

        // Monitor schema selection
        RefreshOnChange refreshOnSchemaChange = new RefreshOnChange();
        refreshOnSchemaChange.setRequired(true);
        schemaField.getUiData().setRefreshOnChange(refreshOnSchemaChange);

        // Monitor field selection
        RefreshOnChange refreshOnFieldChange = new RefreshOnChange();
        refreshOnFieldChange.setRequired(false);
        fieldField.getUiData().setRefreshOnChange(refreshOnFieldChange);

        // If no schema selected, hide field dropdown
        if (dto.getSchema() == null) {
            fieldField.setFormControl(FormControl.Hidden);
            parentField.setFormControl(FormControl.Hidden);
            formDto.setIncomplete(true);
            return;
        }

        // Populate field dropdown
        List<EmSchemaField> fields = fieldService.findAllSchemaFields(dto.getSchema());
        fieldField.setFormControlObject(
            FormControlObject.createDropdown(
                fields.stream()
                    .map(f -> new DropdownItem(f.getName(), f.getId()))
                    .collect(Collectors.toList())
            )
        );

        // If field selected, populate parent dropdown
        if (dto.getField() != null) {
            List<EmSchemaStructure> structures =
                structureService.findAllBySchemaAndEmSchemaField(
                    dto.getSchema(),
                    dto.getField()
                );
            parentField.setFormControlObject(
                FormControlObject.createDropdown(
                    structures.stream()
                        .map(s -> new DropdownItem(s.getName(), s.getId()))
                        .collect(Collectors.toList())
                )
            );
        } else {
            parentField.setFormControl(FormControl.Hidden);
            formDto.setIncomplete(true);
        }
    }
}
```

---

## Test Data Generation Example

```java
@Service
public class EmSchemaTestService {

    @Autowired
    private EmSchemaTypeService schemaTypeService;
    @Autowired
    private EmSchemaService schemaService;
    @Autowired
    private EmSchemaFieldService fieldService;
    @Autowired
    private EmSchemaStructureService structureService;

    @Transactional
    public EmSchema generateTestSchema() {
        // Create type
        EmSchemaType type = schemaTypeService.createSchemaTypeCommit(
            "Test Schema Type",
            "test-schema-" + System.currentTimeMillis()
        );

        // Create schema
        EmSchema schema = new EmSchema();
        schema.setName("Test Schema");
        schema.setSchemaType(type);
        schema.setVersionStatus(EmSchemaVersionStatus.DRAFT);
        schema.setSchemaScope(EmSchemaScope.STANDARD);
        schema = schemaService.createSchemaNewTransaction(schema);

        // Create root field
        EmSchemaField rootField = createField(schema, "root", "Root", COMPLEX);

        // Create child fields
        EmSchemaField nameField = createField(schema, "name", "Name", SIMPLE);
        EmSchemaField codeField = createField(schema, "code", "Code", SIMPLE);
        EmSchemaField addressField = createField(schema, "address", "Address", COMPLEX);
        EmSchemaField streetField = createField(schema, "street", "Street", SIMPLE);
        EmSchemaField cityField = createField(schema, "city", "City", SIMPLE);

        fieldService.createOrUpdateSchemaFields(
            List.of(rootField, nameField, codeField, addressField, streetField, cityField),
            schema
        );

        // Create structures
        EmSchemaStructure root = createStructure(schema, rootField, null, ROOT, ONE_TO_ONE);
        EmSchemaStructure name = createStructure(schema, nameField, root, PARENT_CHILD, ONE_TO_ONE);
        EmSchemaStructure code = createStructure(schema, codeField, root, PARENT_CHILD, ZERO_TO_ONE);
        EmSchemaStructure address = createStructure(schema, addressField, root, PARENT_CHILD, ZERO_TO_MANY);
        EmSchemaStructure street = createStructure(schema, streetField, address, PARENT_CHILD, ONE_TO_ONE);
        EmSchemaStructure city = createStructure(schema, cityField, address, PARENT_CHILD, ONE_TO_ONE);

        structureService.createOrUpdateSchemaStructure(
            List.of(root, name, code, address, street, city),
            schema
        );

        return schema;
    }

    private EmSchemaField createField(EmSchema schema, String alias, String name,
                                       EmSchemaFieldTypeInternal type) {
        EmSchemaField field = new EmSchemaField();
        field.setSchema(schema);
        field.setAlias(alias);
        field.setName(name);
        field.setFieldTypeInternal(type);
        field.setFieldScope(EmSchemaFieldScope.STANDARD);
        return field;
    }

    private EmSchemaStructure createStructure(EmSchema schema, EmSchemaField field,
                                               EmSchemaStructure parent,
                                               EmSchemaStructureType type,
                                               EmSchemaCardinality cardinality) {
        EmSchemaStructure structure = new EmSchemaStructure();
        structure.setSchema(schema);
        structure.setField(field);
        structure.setParent(parent);
        structure.setStructureType(type);
        structure.setName(field.getName());
        structure.setCardinality(cardinality);
        structure.setStructureScope(EmSchemaStructureScope.STANDARD);
        return structure;
    }
}
```
