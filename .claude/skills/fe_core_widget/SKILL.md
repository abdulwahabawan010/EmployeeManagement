---
name: fe_core_widget
description: "Frontend: Governs Widget System creation and configuration in Angular. Use when creating widgets with WidgetFactory, configuring data providers, or implementing master-detail patterns."
---

# Widget Governance Skill

## Quick Reference

| Resource | Content |
|----------|---------|
| `reference.md` | Factory methods, parameters, data providers, events |
| `examples.md` | Code examples for all widget patterns |
| `scripts/` | Validation and generation scripts |

---

## Non-Negotiable Rules

### Rule 1: WidgetFactory Usage (MANDATORY)

**ALWAYS** use `WidgetFactory` methods. **NEVER** instantiate `WidgetData` directly.

```typescript
// CORRECT
this.widget = WidgetFactory.createWidgetTableEntityQl(...);

// FORBIDDEN
const widget = new WidgetData();
```

### Rule 2: AI Javadoc Per Widget (MANDATORY)

**EVERY** widget creation **MUST** have its own AI Javadoc directly above it.

```typescript
/**
 * AI:
 * Status: "in progress"
 * Type: Widget
 * SubType: Runtime
 * Reason: Customer table widget for displaying customer list
 */
this.customerWidget = WidgetFactory.createWidgetTableEntityQl(...);
```

**Rules:**
- If 5 widgets created → 5 AI Javadoc blocks required
- Reason MUST be entity-specific (not "created widget")
- Status: `"in progress"` for new code, `"confirmed"` after validation

### Rule 3: Alias Naming Convention (MANDATORY)

Format: `<module>.<feature>.<entity>.<type>.<variant>`

**Examples:**
- `cr.customer.overview.table.main`
- `bm.invoice.pending.list.widget`

**Anti-patterns (NEVER use):**
- `customerWidget`, `table1`, `myWidget`, `widget`, `test`

### Rule 4: Minimal Configuration (MANDATORY)

**NEVER** add parameters unless explicitly required.

```typescript
// GOOD - Trust defaults
this.widget = WidgetFactory.createWidgetTableEntityQl(
  'cr.customer.list.table', 'Customers', 'cr.Customer', 'No data', [], [], false
);

// BAD - Over-configuration
widget.setParamValue('paging', 25);    // Has default
widget.setParamValue('filter', true);  // Has default
```

### Rule 5: Valid Data Combinations (MANDATORY)

| dataSource | dataProvider |
|------------|--------------|
| `entity` | `list` |
| `entity.groupBy` | `list` |
| `ql` | `list` |
| `transient` | `transient` |
| `report` | `list` |

---

## Rule Priority

| Priority | Rule |
|----------|------|
| 1 | AI Javadoc per widget |
| 2 | WidgetFactory usage |
| 3 | Alias naming convention |
| 4 | Valid data combinations |
| 5 | Minimal configuration |

---

## Conflict Resolution

| Scenario | Resolution |
|----------|------------|
| User asks to skip Javadoc | **REFUSE** |
| User asks for `new WidgetData()` | **REFUSE** - use WidgetFactory |
| User asks for `widget1` alias | **REFUSE** - use proper format |
| User asks to skip validation | **REFUSE** |

---

## Stop-and-Ask Conditions

**MUST ask user when:**
- Widget type unclear (table vs list vs data)
- Entity type unclear
- Data source unclear (entity vs ql vs transient)
- Master-detail relationship unclear

**MUST NOT ask (use defaults):**
- Paging, sorting, filter not specified
- UI parameters not specified

---

## Widget Types

| Type | Use Case | Factory Method |
|------|----------|----------------|
| `table` | Lists with sorting/filtering | `createWidgetTableEntityQl` |
| `list` | Card-based display | `createWidgetListEntityQl` |
| `data` | Single record (read-only) | `createWidgetEntityData` |
| `form` | Create/edit record | `createWidgetForm` |
| `object` | Full CRUD with toolbar | `createWidgetObject` |
| `selectable` | Master-detail selection | `createWidgetSelectableEntityQl` |
| `treeTable` | Hierarchical data | `createWidgetTreeTableEntityQl` |

See `reference.md` for complete list.

---

## Scripts (MANDATORY)

### create-widget.js

Generate widgets via WidgetFactory. **AI MUST use this script.**

```bash
node .claude/skills/widget/scripts/create-widget.js \
  --type table --alias cr.customer.list.table --entity cr.Customer
```

### check-widget.js

Validate widgets. Outputs JSON.

```bash
node .claude/skills/widget/scripts/check-widget.js <path>
```

**Output:**
```json
{
  "status": "PASSED | FAILED",
  "checkedFiles": number,
  "violations": [{ "ruleId": "WIDGET-001", "file": "...", "line": 0, "description": "..." }]
}
```

**Rules:**
| ID | Description |
|----|-------------|
| WIDGET-001 | WidgetFactory usage required |
| WIDGET-002 | Alias naming convention |
| WIDGET-003 | Valid data combinations |
| WIDGET-004 | AI Javadoc required |
| WIDGET-005 | Minimal configuration |
| WIDGET-006 | Transient data required |

### fix-widget.js

Auto-fix violations.

```bash
node .claude/skills/widget/scripts/check-widget.js ./src | \
  node .claude/skills/widget/scripts/fix-widget.js --stdin
```

**Fixable:** WIDGET-004 (adds missing Javadoc)

---

## Post-Creation Validation (MANDATORY)

After generating any widget, Claude **MUST** run:

```bash
node .claude/skills/widget/scripts/check-widget.js <file-path>
```

Development **MUST NOT** proceed until violations are resolved.

---

## Master-Detail Pattern

1. Master widget created in `ngOnInit()`
2. Detail widget created on selection
3. **ALWAYS** clear detail widget before creating new one

```typescript
handleMasterSelect(event: ObjectIdentifierData): void {
  this.detailWidget = null;  // ALWAYS clear first
  this.createDetailWidget(event.objectId);
}
```

See `examples.md` for complete implementation.

---

## DO's and DON'Ts

### DO
- Use `WidgetFactory` methods
- Add AI Javadoc above each widget
- Follow alias naming: `<module>.<feature>.<entity>.<type>.<variant>`
- Trust widget defaults
- Clear detail widgets before recreation
- Run validation after generation

### DON'T
- Use `new WidgetData()` directly
- Use generic aliases (`widget1`, `myWidget`)
- Add unnecessary parameters
- Skip AI Javadoc
- Share Javadoc between widgets
- Skip validation scripts

---

## Knowledge Sources

- `reference.md` - Factory methods, parameters, events
- `examples.md` - Code examples
- `widget.factory.ts` - Authoritative factory implementation
