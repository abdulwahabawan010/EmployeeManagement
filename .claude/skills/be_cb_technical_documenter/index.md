# CB Technical Documenter Skill

## Overview

This skill enables Claude to automatically generate and update technical documentation for Alpha backend modules, entities, and attributes. It uses a four-phase workflow with parallel worker agents to ensure complete documentation coverage.

## IMPORTANT: Parallel Worker Pattern

When documenting multiple modules, **ALWAYS** use parallel workers:

1. **Use Task tool** with `model: "opus"` for each module
2. **Launch all workers in a single message** (parallel execution)
3. **Each worker gets a fresh context** with the index file as checklist
4. **Wait for all workers** before proceeding to the next phase

```
Example: Document modules cr, cm, am

Phase 1: Generate indexes (single command - no AI needed)
Phase 2: Launch 3 parallel documenter workers (opus model)
Phase 3: Launch 3 parallel checker workers (opus model)
Phase 4: Upload all modules (single command)
```

## Directory Structure

Documentation is stored in `.cb/` directory at project root:

```
.cb/
├── modules/
│   ├── cr/
│   │   ├── cr_index.json              # Complete inventory from source scan
│   │   ├── cr_state.json              # Processing timestamps & metadata
│   │   ├── cr_checker_report.json     # Verification results
│   │   └── documentation/
│   │       ├── module.json            # Module documentation
│   │       ├── entities/
│   │       │   ├── cr_Customer.json
│   │       │   └── ...
│   │       ├── attributes/
│   │       │   ├── cr_Customer_status.json
│   │       │   └── ...
│   │       └── attribute_values/
│   │           └── cr_Customer_status_ACTIVE.json
│   └── cm/
│       └── ...
└── config.json                         # Global settings (optional)
```

## Four-Phase Workflow

### Phase 1: Index Generation (Deterministic)

Generate a complete inventory of what needs to be documented:

```bash
# Single module
python generate_index.py --module cr

# Multiple modules
python generate_index.py --modules cr,cm,am

# All known modules
python generate_index.py --all

# Delta mode (only files changed since last run)
python generate_index.py --module cr --delta
```

**Output:** `.cb/modules/<alias>/<alias>_index.json`

The index contains:
- All entities with their attributes
- All enums with their values
- File modification timestamps
- Summary statistics

### Phase 2: Documentation Generation (AI Workers - Parallel)

Each documenter worker receives the index file and generates documentation.

**CRITICAL:** Launch one worker per module using the Task tool with `model: "opus"`:

```
For each module, launch a Task agent with prompt:

"Document module {moduleAlias} using the index at .cb/modules/{moduleAlias}/{moduleAlias}_index.json

You MUST document:
- The module itself
- All {entityCount} entities listed in the index
- All {attributeCount} attributes listed in the index
- All {enumValueCount} enum values listed in the index

Read the Java source files for context and generate:
1. purpose (max 200 chars)
2. businessDescription (detailed)
3. technicalDescription (detailed)

Save using the generate_documentation.py helper functions."
```

**Helper functions in generate_documentation.py:**
- `save_module_documentation(module_alias, doc_data)`
- `save_entity_documentation(module_alias, entity_alias, doc_data)`
- `save_attribute_documentation(module_alias, entity_alias, attr_name, doc_data)`
- `save_attribute_value_documentation(module_alias, entity_alias, attr_name, value_name, doc_data)`

### Phase 3: Documentation Check (AI Checkers - Parallel)

Verify completeness and fill gaps:

```bash
# Check single module
python check_documentation.py --module cr

# Check with verbose output
python check_documentation.py --module cr --verbose

# Output as JSON
python check_documentation.py --module cr --json
```

**Output:** `.cb/modules/<alias>/<alias>_checker_report.json`

The checker:
1. Compares index with generated documentation
2. Identifies missing items and incomplete fields
3. Reports coverage percentage
4. Returns status: COMPLETE or INCOMPLETE

**For gap-filling:** Launch checker workers that read the checker report and document missing items.

### Phase 4: Upload (API Sync)

Upload documentation to the CB API:

```bash
# Upload single module
python upload_documentation.py --module cr

# Upload multiple modules
python upload_documentation.py --modules cr,cm,am

# Dry run (preview without uploading)
python upload_documentation.py --module cr --dry-run

# Delta mode (only upload changes)
python upload_documentation.py --module cr --delta

# Delta with orphan removal
python upload_documentation.py --module cr --delta --remove-orphaned
```

## CLI Reference

### generate_index.py

| Argument | Description |
|----------|-------------|
| `--module <alias>` | Single module to index |
| `--modules <a,b,c>` | Comma-separated list of modules |
| `--all` | Index all known modules |
| `--delta` | Only include files modified since last run |
| `--full` | Generate complete index (default) |
| `--verbose` | Show detailed output |
| `--dry-run` | Preview without writing files |

### generate_documentation.py

| Argument | Description |
|----------|-------------|
| `--module <alias>` | Module to check/document |
| `--status` | Show documentation status |
| `--checklist` | Show full documentation checklist |
| `--json` | Output in JSON format |

### check_documentation.py

| Argument | Description |
|----------|-------------|
| `--module <alias>` | Module to check |
| `--report-only` | Only generate report |
| `--fill-gaps` | Mark items for gap-filling |
| `--json` | Output in JSON format |
| `--verbose` | Show detailed output |

### upload_documentation.py

| Argument | Description |
|----------|-------------|
| `--module <alias>` | Single module to upload |
| `--modules <a,b,c>` | Comma-separated list of modules |
| `--input-dir <path>` | Legacy: path to .temp/cb_batch_* directory |
| `--delta` | Enable delta mode (only upload changes) |
| `--remove-orphaned` | Delete docs not in source (requires --delta) |
| `--dry-run` | Preview without uploading |
| `--base-url <url>` | API base URL |
| `--tenant <name>` | Tenant header value |
| `--batch-size <n>` | Items per API call (default: 50) |

## API Endpoints

### Import Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/mvsa/cb/technicalDoc/import/module` | Import single module |
| POST | `/mvsa/cb/technicalDoc/import/modules` | Batch import modules |
| POST | `/mvsa/cb/technicalDoc/import/entities` | Batch import entities |
| POST | `/mvsa/cb/technicalDoc/import/attributes` | Batch import attributes |
| POST | `/mvsa/cb/technicalDoc/import/attributeValues` | Batch import enum values |
| POST | `/mvsa/cb/technicalDoc/import/batch` | Full hierarchical import |

### Delta/State Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/mvsa/cb/technicalDoc/module/{alias}/state` | Get current documented state |
| GET | `/mvsa/cb/technicalDoc/entities/aliases` | List all documented entity aliases |
| GET | `/mvsa/cb/technicalDoc/module/{alias}/entities/aliases` | List entities for module |
| POST | `/mvsa/cb/technicalDoc/module/{alias}/orphaned` | Find orphaned documentation |
| POST | `/mvsa/cb/technicalDoc/sync/delta` | Perform delta sync |

### Delete Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| DELETE | `/mvsa/cb/technicalDoc/entity/{alias}` | Delete entity documentation |
| DELETE | `/mvsa/cb/technicalDoc/attribute/{entity}/{attr}` | Delete attribute documentation |
| DELETE | `/mvsa/cb/technicalDoc/attributeValue/{entity}/{attr}/{value}` | Delete enum value |

## Complete Example: Document Multiple Modules

```
# Step 1: Generate indexes for all modules (single command)
python generate_index.py --modules cr,cm,am

# Step 2: Launch parallel documenter workers
# In Claude Code, use Task tool with model="opus" for each module:

Task(
  prompt="Document module cr using index at .cb/modules/cr/cr_index.json.
         Document all 67 entities, 218 attributes, and 31 enum values.
         Read Java source files and generate purpose, businessDescription,
         and technicalDescription for each item.",
  model="opus",
  subagent_type="general-purpose"
)

Task(
  prompt="Document module cm using index at .cb/modules/cm/cm_index.json...",
  model="opus",
  subagent_type="general-purpose"
)

Task(
  prompt="Document module am using index at .cb/modules/am/am_index.json...",
  model="opus",
  subagent_type="general-purpose"
)

# Wait for all workers to complete

# Step 3: Launch parallel checker workers
Task(
  prompt="Check documentation for module cr. Load the checker report from
         .cb/modules/cr/cr_checker_report.json. If status is INCOMPLETE,
         document the missing items listed in the gaps section.",
  model="opus",
  subagent_type="general-purpose"
)
# ... repeat for cm, am

# Wait for all checkers to complete

# Step 4: Verify all modules are complete
python check_documentation.py --module cr
python check_documentation.py --module cm
python check_documentation.py --module am

# Step 5: Upload to API
python upload_documentation.py --modules cr,cm,am
```

## When to Use Full vs Delta Mode

| Mode | Use Case |
|------|----------|
| **Full** | Initial documentation, major refactoring, ensure complete coverage |
| **Delta** | Regular updates, adding new entities, incremental changes |

### Full Workflow
```bash
python generate_index.py --module cr --full
# Document all items
python upload_documentation.py --module cr
```

### Delta Workflow
```bash
python generate_index.py --module cr --delta
# Document only changed items
python upload_documentation.py --module cr --delta
```

## Documentation Format

### Module Documentation
```json
{
  "moduleAlias": "cr",
  "moduleName": "Customer Relationship",
  "purpose": "Short description (max 200 chars)",
  "businessDescription": "Detailed business description",
  "technicalDescription": "Technical implementation details"
}
```

### Entity Documentation
```json
{
  "objectTypeAlias": "cr.Customer",
  "purpose": "Short description (max 200 chars)",
  "businessDescription": "Detailed business description",
  "technicalDescription": "Technical implementation details",
  "usageNotes": "Usage notes and best practices",
  "domainContext": "Domain context (max 255 chars)"
}
```

### Attribute Documentation
```json
{
  "attributeName": "status",
  "purpose": "Short description (max 200 chars)",
  "businessDescription": "Detailed business description",
  "technicalDescription": "Technical implementation details",
  "exampleValues": "ACTIVE, INACTIVE, PENDING",
  "validationRules": "Required, must be a valid enum value"
}
```

### Attribute Value Documentation
```json
{
  "valueName": "ACTIVE",
  "ordinalValue": 0,
  "purpose": "Short description",
  "businessDescription": "Detailed business meaning",
  "technicalDescription": "Technical details"
}
```

## Best Practices

1. **Always generate index first** - The index is the source of truth for what needs documenting
2. **Use parallel workers** - One worker per module with opus model
3. **Verify with checker** - Run checker after documentation to ensure completeness
4. **Respect business lock** - Don't overwrite locked business descriptions
5. **Use delta mode for updates** - Faster and more efficient for incremental changes
6. **Review before upload** - Check documentation files in .cb/ before uploading

## Legacy Support

The old `.temp/cb_batch_*` directory structure is still supported:

```bash
# Legacy upload from .temp directory
python upload_documentation.py --input-dir .temp/cb_batch_cr_20260203_112403

# Legacy batch generation (still works)
python update_documentation.py --action document_batch --input-file batch.json
```
