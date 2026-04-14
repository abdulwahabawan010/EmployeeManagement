# EA Module API Endpoints

This document describes all REST API endpoints in the EA (Entity Analyze) module.

---

## Base URL

```
/mvsa/ea
```

---

## Standard CRUD Endpoints

All entities support standard CRUD operations via `ObjectCrudController`.

| Endpoint | Controller | Entity |
|----------|------------|--------|
| `/mvsa/ea/eaProjects` | EaProjectController | EaProject |
| `/mvsa/ea/eaSourceFiles` | EaSourceFileController | EaSourceFile |
| `/mvsa/ea/eaAnalysisResults` | EaAnalysisResultController | EaAnalysisResult |
| `/mvsa/ea/eaColumns` | EaColumnController | EaColumn |
| `/mvsa/ea/eaColumnValues` | EaColumnValueController | EaColumnValue |
| `/mvsa/ea/eaModelDrafts` | EaModelDraftController | EaModelDraft |
| `/mvsa/ea/eaModelDraftFields` | EaModelDraftFieldController | EaModelDraftField |
| `/mvsa/ea/eaImportConfigDrafts` | EaImportConfigDraftController | EaImportConfigDraft |
| `/mvsa/ea/eaImportStructureDrafts` | EaImportStructureDraftController | EaImportStructureDraft |
| `/mvsa/ea/eaImportFieldDrafts` | EaImportFieldDraftController | EaImportFieldDraft |

### Standard Operations

Each endpoint supports:

| Method | Path | Operation |
|--------|------|-----------|
| GET | `/{endpoint}` | List (with pagination) |
| GET | `/{endpoint}/{id}` | Get by ID |
| POST | `/{endpoint}` | Create |
| PUT | `/{endpoint}/{id}` | Update |
| DELETE | `/{endpoint}/{id}` | Delete |

---

## Custom Endpoints

### EaSourceFileController

#### Upload File

```http
POST /mvsa/ea/eaSourceFiles/upload/{projectId}
Content-Type: multipart/form-data
```

**Parameters:**
| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| projectId | Long | Path | Yes | Project ID |
| file | MultipartFile | Form | Yes | File to upload |

**Response:**
```json
{
  "id": 1,
  "name": "data.csv",
  "fileType": "CSV",
  "encoding": "UTF-8",
  "delimiter": ",",
  "fileSize": 10240,
  "rowCount": 500,
  "hasHeader": true,
  "headerConfidence": 0.95
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "File type not supported"
}
```

#### Get File Preview

```http
GET /mvsa/ea/eaSourceFiles/preview/{id}?rowLimit=100
```

**Parameters:**
| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| id | Long | Path | Yes | Source file ID |
| rowLimit | Integer | Query | No | Max rows (default: 100) |

**Response:**
```json
{
  "sourceFile": {
    "id": 1,
    "name": "data.csv",
    "fileType": "CSV",
    "encoding": "UTF-8",
    "delimiter": ","
  },
  "rows": [
    ["ID", "Name", "Email"],
    ["1", "John Doe", "john@example.com"],
    ["2", "Jane Smith", "jane@example.com"]
  ],
  "rowCount": 3,
  "columnCount": 3
}
```

---

### EaAnalysisResultController

#### Start Analysis

```http
POST /mvsa/ea/eaAnalysisResults/startAnalysis/{sourceFileId}
```

**Parameters:**
| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| sourceFileId | Long | Path | Yes | Source file to analyze |

**Response:**
```json
{
  "id": 1,
  "sourceFile": { "id": 1, "name": "data.csv" },
  "analyzedAt": "2024-01-15T10:30:00",
  "columnCount": 10,
  "analyzedRowCount": 500,
  "overallQualityScore": 92.5,
  "duplicatePercentage": 2.3
}
```

---

### EaColumnController

#### Confirm Header

```http
POST /mvsa/ea/eaColumns/confirmHeader/{id}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Customer Name",
  "alias": "customer_name"
}
```

**Response:**
```json
{
  "id": 1,
  "columnIndex": 0,
  "detectedHeader": "CustName",
  "name": "Customer Name",
  "alias": "customer_name",
  "dataType": "STRING"
}
```

---

### EaModelDraftController

#### Generate Model Draft

```http
POST /mvsa/ea/eaModelDrafts/generate/{projectId}
```

**Parameters:**
| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| projectId | Long | Path | Yes | Project ID |

**Response:**
```json
{
  "id": 1,
  "project": { "id": 1, "name": "Customer Import" },
  "name": "Customer Import Schema",
  "alias": "customer_import_schema",
  "status": "DRAFT"
}
```

#### Validate Draft

```http
GET /mvsa/ea/eaModelDrafts/validate/{id}
```

**Parameters:**
| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| id | Long | Path | Yes | Model draft ID |

**Response:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": ["Field 'email' may contain PII data"]
}
```

**Invalid Response:**
```json
{
  "valid": false,
  "errors": [
    "Draft name is required",
    "Duplicate field alias: customer_id"
  ],
  "warnings": []
}
```

#### Export to EM

```http
POST /mvsa/ea/eaModelDrafts/exportToEm/{id}
```

**Parameters:**
| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| id | Long | Path | Yes | Model draft ID |

**Response:**
```json
{
  "id": 1,
  "status": "EXPORTED",
  "exportedAt": "2024-01-15T11:00:00",
  "exportedSchema": {
    "id": 42,
    "name": "Customer Import Schema"
  }
}
```

---

### EaImportConfigDraftController

#### Generate Import Config

```http
POST /mvsa/ea/eaImportConfigDrafts/generate/{projectId}
Content-Type: application/json
```

**Parameters:**
| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| projectId | Long | Path | Yes | Project ID |

**Request Body:**
```json
{
  "targetObjectType": "cr.CrCustomer"
}
```

**Response:**
```json
{
  "id": 1,
  "project": { "id": 1, "name": "Customer Import" },
  "name": "Customer Import Import",
  "alias": "customer_import_import",
  "status": "MAPPING_REQUIRED",
  "targetObjectType": "cr.CrCustomer"
}
```

#### Auto-Map Fields

```http
POST /mvsa/ea/eaImportConfigDrafts/autoMap/{id}
```

**Parameters:**
| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| id | Long | Path | Yes | Config draft ID |

**Response:**
```json
{
  "mappedCount": 8,
  "unmappedCount": 2,
  "mappings": [
    {
      "sourceColumn": "customer_name",
      "targetAttribute": "name",
      "confidence": "HIGH"
    },
    {
      "sourceColumn": "email_address",
      "targetAttribute": "email",
      "confidence": "MEDIUM"
    }
  ]
}
```

#### Export to EI

```http
POST /mvsa/ea/eaImportConfigDrafts/exportToEi/{id}
```

**Parameters:**
| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| id | Long | Path | Yes | Config draft ID |

**Response:**
```json
{
  "id": 1,
  "status": "EXPORTED",
  "exportedAt": "2024-01-15T11:30:00",
  "exportedImportType": {
    "id": 15,
    "name": "Customer Import"
  }
}
```

---

## Query Language (QL) Support

All list endpoints support QL queries for filtering, sorting, and pagination.

### Example: Get columns for an analysis result

```http
POST /mvsa/ea/eaColumns
Content-Type: application/json
```

**Request Body:**
```json
{
  "objectType": "ea.EaColumn",
  "filter": {
    "and": [
      { "field": "analysisResultId", "operator": "eq", "value": 1 }
    ]
  },
  "orderBy": [
    { "field": "columnIndex", "direction": "asc" }
  ]
}
```

### Example: Get model draft fields

```http
POST /mvsa/ea/eaModelDraftFields
Content-Type: application/json
```

**Request Body:**
```json
{
  "objectType": "ea.EaModelDraftField",
  "filter": {
    "and": [
      { "field": "modelDraftId", "operator": "eq", "value": 1 }
    ]
  },
  "orderBy": [
    { "field": "sortOrder", "direction": "asc" }
  ]
}
```

---

## Error Responses

All endpoints return standard error responses:

### 400 Bad Request

```json
{
  "success": false,
  "message": "Validation failed: Draft name is required"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Entity not found with id: 999"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Analysis failed: File could not be parsed"
}
```

---

## Frontend Service Mapping

| API Endpoint | Frontend Service |
|--------------|------------------|
| `/mvsa/ea/eaProjects` | EaProjectService |
| `/mvsa/ea/eaSourceFiles` | EaSourceFileService |
| `/mvsa/ea/eaAnalysisResults` | EaAnalysisResultService |
| `/mvsa/ea/eaColumns` | EaColumnService |
| `/mvsa/ea/eaColumnValues` | EaColumnValueService |
| `/mvsa/ea/eaModelDrafts` | EaModelDraftService |
| `/mvsa/ea/eaModelDraftFields` | EaModelDraftFieldService |
| `/mvsa/ea/eaImportConfigDrafts` | EaImportConfigDraftService |
| `/mvsa/ea/eaImportStructureDrafts` | EaImportStructureDraftService |
| `/mvsa/ea/eaImportFieldDrafts` | EaImportFieldDraftService |
