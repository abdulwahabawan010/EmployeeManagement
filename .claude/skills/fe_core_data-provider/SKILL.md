---
name: fe_core_data-provider
description: "Frontend: Governs Data Provider System configuration and implementation. Use when creating or modifying widgets with data fetching, configuring dataSource/dataProvider/dataProviderObject properties, or implementing DP patterns. Enforces valid combinations, required properties, and AI Javadoc injection."
---

# Data Provider Governance Skill

## Quick Reference

| Resource | Content |
|----------|---------|
| `reference.md` | Architecture, pitfalls, runtime operations, imports |
| `scripts/` | Validation script |

---

## Activation Triggers

Claude MUST apply this skill when:

1. Creating or modifying widgets with data fetching
2. Configuring `dataSource`, `dataProvider`, or `dataProviderObject`
3. Setting up `WidgetData` for tables, lists, charts, or forms
4. User mentions: "data provider", "data source", "widget data", "QL query"

---

## Non-Negotiable Rules

### Rule 1: AI Javadoc Injection (MANDATORY)

**EVERY** DP configuration file **MUST** have AI Javadoc at the **VERY TOP**:

```typescript
/**
 * AI:
 * Status: "in progress" | "confirmed"
 * Type: Service
 * SubType: DataProvider | DataSource | WidgetConfig
 * Reason: <Clear, context-specific explanation>
 */
```

**Reason Field Quality:**
- GOOD: `"Configured entity data provider for Customer table widget with pagination"`
- BAD: `"Created data provider"` (too generic)

### Rule 2: Required Properties (MANDATORY)

All three properties are **REQUIRED** for any DP configuration:

```typescript
widgetData.dataSource = 'entity';           // WHERE: entity, ql, transient, etc.
widgetData.dataProvider = 'list';           // HOW: list or transient
widgetData.dataProviderObject = 'cr.Customer'; // WHAT: entity type or query name
```

**CRITICAL:** Forgetting any property will cause data loading to fail.

### Rule 3: Valid Combinations (CRITICAL)

| dataSource | dataProvider | Use Case |
|------------|--------------|----------|
| `entity` | `list` | Standard entity CRUD (90% of cases) |
| `entity.groupBy` | `list` | Aggregated data, charts |
| `ql` | `list` | Complex queries with joins |
| `transient` | `transient` | In-memory data (MUST match) |
| `report` | `list` | Pre-configured reports |
| `os` | `list` | Object browser (legacy) |

**CRITICAL:** Invalid combinations cause runtime errors.

### Rule 4: Request Object Requirements (MANDATORY)

| dataSource | Required Request | Notes |
|------------|------------------|-------|
| `ql` | `QlRequest` with `queries` | MUST provide query definitions |
| `entity.groupBy` | `ObjectRequestList` with `setGroupBy()` | MUST configure groupBy |
| `entity` | `ObjectRequestList` (optional) | For filters/sorting/pagination |
| `transient` | None | Data via `dataTransient` property |

---

## Rule Priority

1. **CRITICAL RULES** - Never violate
2. **MANDATORY RULES** (MUST/MUST NOT) - Required for operation
3. **GOVERNANCE RULES** - Core DP configuration
4. **PITFALL AVOIDANCE** - Prevent common mistakes
5. **BEST PRACTICES** - Recommended patterns

---

## Conflict Resolution

| Conflict | Resolution |
|----------|------------|
| Manual config vs WidgetFactory | Prefer WidgetFactory; manual when factory lacks method |
| Transient data location | Prefer `dataTransient` over `setTransientData()` |
| Request object type | Match to dataSource: `QlRequest` for `ql`, `ObjectRequestList` for `entity` |

---

## Stop-and-Ask Conditions

**MUST ask user when:**
- Unknown dataSource value
- Ambiguous entity type
- Complex query spanning >3 entities
- User requests something violating governance

**MUST NOT guess:**
- Entity alias format
- Query names
- Data provider object values

---

## Data Source Selection

### Use `entity` When:
- Fetching standard entity lists
- Simple filtering/sorting on single entity
- 90% of CRUD operations

```typescript
/**
 * AI:
 * Status: "in progress"
 * Type: Service
 * SubType: WidgetConfig
 * Reason: Configured entity data provider for Customer list widget
 */
widgetData.dataSource = 'entity';
widgetData.dataProvider = 'list';
widgetData.dataProviderObject = 'cr.Customer';
```

### Use `ql` When:
- Need to join multiple entities
- Require calculated fields or aggregations
- Complex cross-entity filtering

```typescript
widgetData.dataSource = 'ql';
widgetData.dataProvider = 'list';
widgetData.dataProviderObject = 'analytics.customerStats';
widgetData.dataProviderListRequest = qlRequest;
```

### Use `entity.groupBy` When:
- Need aggregated statistics
- Grouping by attributes
- Dashboard charts/metrics

```typescript
widgetData.dataSource = 'entity.groupBy';
widgetData.dataProvider = 'list';
widgetData.dataProviderObject = 'bm.SalesOrder';
// MUST configure groupBy on request
```

### Use `transient` When:
- Data already in memory
- Temporary or calculated data
- Preview before saving

```typescript
widgetData.dataSource = 'transient';
widgetData.dataProvider = 'transient'; // MUST match
widgetData.dataTransient = [
    { id: 1, name: 'Item 1', value: 100 }
];
```

---

## Governance Rules

### AI Javadoc (G001-G004)

| Rule | Requirement | Severity |
|------|-------------|----------|
| G001 | AI Javadoc MUST be present | ERROR |
| G002 | Status: "in progress" or "confirmed" | ERROR |
| G003 | SubType: DataProvider/DataSource/WidgetConfig | ERROR |
| G004 | Reason: descriptive (min 15 chars) | ERROR |

### Valid Combinations (G101-G102)

| Rule | Requirement | Severity |
|------|-------------|----------|
| G101 | dataSource MUST be valid value | ERROR |
| G102 | dataSource/dataProvider MUST be valid combination | ERROR |

### Required Properties (G201-G203)

| Rule | Requirement | Severity |
|------|-------------|----------|
| G201 | dataSource MUST be set | ERROR |
| G202 | dataProvider MUST be set | ERROR |
| G203 | dataProviderObject MUST be set for entity/ql/report/os | ERROR |

### Request Objects (G301-G302)

| Rule | Requirement | Severity |
|------|-------------|----------|
| G301 | `ql` dataSource requires QlRequest | WARNING |
| G302 | `entity.groupBy` requires GroupBy configuration | WARNING |

### Transient (G401-G402)

| Rule | Requirement | Severity |
|------|-------------|----------|
| G401 | transient dataSource requires transient dataProvider | ERROR |
| G402 | transient MUST provide data via dataTransient | ERROR |

### Anti-Patterns (G501-G503)

| Rule | Requirement | Severity |
|------|-------------|----------|
| G501 | No direct CoreDpImpl instantiation | ERROR |
| G502 | No post-init dataSource modification | WARNING |
| G503 | No empty/null dataProviderObject | ERROR |

---

## Scripts (MANDATORY)

### check-dp.js (VALIDATION)

```bash
node .claude/skills/data-provider/scripts/check-dp.js <path>
```

**Output:**
```json
{
  "status": "PASSED | FAILED",
  "checkedFiles": number,
  "violations": [{ "ruleId": "G001", "file": "...", "description": "..." }]
}
```

### fix-dp.js (AUTO-FIX)

```bash
node .claude/skills/data-provider/scripts/fix-dp.js --dry-run <path>
node .claude/skills/data-provider/scripts/fix-dp.js <path>
```

**Safe Fixes:** AI Javadoc completion
**Unsafe (manual):** Combination errors, missing properties

---

## Post-Implementation Validation (MANDATORY)

After generating ANY Data Provider configuration, Claude **MUST** run:

```bash
node .claude/skills/data-provider/scripts/check-dp.js <path>
```

Development **MUST NOT** proceed until violations are resolved.

---

## DO's and DON'Ts

### DO's (MANDATORY)

| DO | Reason |
|----|--------|
| Set all three required properties | Prevents runtime errors |
| Use valid combinations only | Invalid combinations fail |
| Provide appropriate request objects | Required for complex queries |
| Match transient source with transient provider | Architectural requirement |
| Include AI Javadoc | Governance requirement |
| Run validation after implementation | Catches errors early |

### DON'Ts (PROHIBITED)

| DON'T | Reason |
|-------|--------|
| Use invalid combinations | Runtime errors |
| Forget dataProviderObject | Silent failures |
| Instantiate CoreDpImpl directly | Breaks architecture |
| Modify DP config after init without refresh | Changes ignored |
| Generate DP config without AI Javadoc | Governance violation |

---

## Knowledge Sources

- `reference.md` - Architecture details, pitfalls, runtime operations, imports
