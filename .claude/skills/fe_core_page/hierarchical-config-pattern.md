# Hierarchical Configuration Pattern

## Overview

This document is the **canonical implementation guide** for complex configuration entities. It provides full code examples for implementing the Complex Configuration Entity Rule.

> **Rule Reference:** See [SKILL.md](SKILL.md) for the rule definition and decision matrix.

---

## ⚠️ COMPLEX CONFIGURATION ENTITY RULE

**Violations are ARCHITECTURAL ERRORS. See [SKILL.md](SKILL.md) for complete rule.**

**Quick Summary:**
- **2+ child entities** → MUST use ObjectComponent + Object Page navigation
- **FORBIDDEN:** Flat tabs for children, inline master-detail, missing ObjectComponent

---

## Canonical Example: DunningType

```
Config Page (Simple Table Only):
┌─────────────────────────────────────────────────────────────────┐
│ Simple Table Widget: bd.DunningType                             │
│ ├─ Standard Dunning  → [Click opens Object Page]               │
│ ├─ Premium Dunning   → [Click opens Object Page]               │
│ └─ Express Dunning   → [Click opens Object Page]               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ User clicks row
                              ▼
Object Page (DunningTypeObjectComponent):
┌─────────────────────────────────────────────────────────────────┐
│ ┌───────────────┬─────────────────────────────────────────────┐ │
│ │ Left Nav      │ Content Area                                │ │
│ │ ├ Overview    │ Levels (filtered by this DunningType)       │ │
│ │ ├ Levels ◄    │ ┌─────────────────────────────────────────┐ │ │
│ │ ├ Charges     │ │ Level 1 | 30 days | Reminder           │ │ │
│ │ ├ Actions     │ │ Level 2 | 60 days | Warning            │ │ │
│ │ └ Stop        │ └─────────────────────────────────────────┘ │ │
│ └───────────────┴─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Requirements

| Requirement | Status |
|-------------|--------|
| ObjectComponent exists for root entity | **MANDATORY** |
| ObjectComponent registered via `getObjectComponent()` | **MANDATORY** |
| Config Page uses simple table widget | **MANDATORY** |
| Click row opens Object Page via navigation | **MANDATORY** |
| ObjectComponent has left navigation | **MANDATORY** |
| Child widgets filtered by parent FK | **MANDATORY** |
| Flat tabs for children in Config Page | **FORBIDDEN** |
| Inline master-detail in Config Page | **FORBIDDEN** |

---

## Implementation Guide

### Step 1: Create ObjectComponent (MANDATORY for Complex Entities)

**File:** `<module>/component/object/<entity>-object/<entity>-object.component.ts`

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ObjectBaseComponent } from '@core/shared/object/mvs-object-base/object-base.component';
import { WidgetData } from '@core/shared/widget/widget-data';
import { WidgetFactory } from '@core/shared/widget/service/widget.factory';
import { FilterCriteria } from '@core/shared/filter/api/filter.criteria';
import { ObjectRequestList } from '@core/shared/dto/object/request/object-request-list';
import { NavigationItem } from '@core/shared/navigation/navigation-item';

@Component({
    selector: 'dunning-type-object',
    templateUrl: './dunning-type-object.component.html',
    standalone: false
})
export class DunningTypeObjectComponent extends ObjectBaseComponent implements OnInit, OnDestroy {

    // MANDATORY: Left navigation sections for child entities
    navigationItems: NavigationItem[] = [
        { label: 'Overview', action: 'overview', icon: 'fa fa-info-circle', toggleable: false, default: true },
        { label: 'Levels', action: 'levels', icon: 'fa fa-layer-group', toggleable: false, default: false },
        { label: 'Charges', action: 'charges', icon: 'fa fa-dollar-sign', toggleable: false, default: false },
        { label: 'Actions', action: 'actions', icon: 'fa fa-bolt', toggleable: false, default: false },
        { label: 'Start Conditions', action: 'start', icon: 'fa fa-play', toggleable: false, default: false },
        { label: 'Stop Conditions', action: 'stop', icon: 'fa fa-stop', toggleable: false, default: false }
    ];

    // Child widgets - filtered by parent
    levelsWidget: WidgetData;
    chargesWidget: WidgetData;
    actionsWidget: WidgetData;

    ngOnInit(): void {
        super.ngOnInit();
    }

    /**
     * MANDATORY: Called when the parent object changes.
     * Creates all child widgets filtered by this parent entity.
     */
    onObjectChanged(): void {
        this.createChildWidgets();
    }

    private createChildWidgets(): void {
        const dunningTypeId = this.objectIdentifier.objectId;

        // MANDATORY: Filter by parent FK using relationship name
        const dunningTypeFilter = FilterCriteria.create(
            'dunningType',  // Relationship name (NOT 'e.dunningTypeId')
            FilterCriteria.cOperatorEqual,
            dunningTypeId
        );

        this.levelsWidget = WidgetFactory.createWidgetTableEntity(
            'bd.dunning-type.config.levels.table',
            'Dunning Levels',
            'bd.DunningTypeLevel',
            'No levels configured',
            ObjectRequestList.createBasic(true, [dunningTypeFilter], [])
        );

        this.chargesWidget = WidgetFactory.createWidgetTableEntity(
            'bd.dunning-type.config.charges.table',
            'Dunning Charges',
            'bd.DunningTypeCharge',
            'No charges configured',
            ObjectRequestList.createBasic(true, [dunningTypeFilter], [])
        );

        // ... similar for other child entities
    }

    ngOnDestroy(): void {
        super.ngOnDestroy();
    }
}
```

### Step 2: Register ObjectComponent in Entity Service (MANDATORY)

**File:** `<module>/service/api/<entity>.service.ts`

```typescript
import { Type } from '@angular/core';
import { MvsCrudModeEnum } from '@core/shared/service/crud/mvs-crud-mode.enum';
import { DunningTypeObjectComponent } from '../../component/object/dunning-type-object/dunning-type-object.component';

// In the entity service class:
getObjectComponent(mode?: MvsCrudModeEnum): Type<any> {
    if (mode !== MvsCrudModeEnum.create) {
        return DunningTypeObjectComponent;  // MANDATORY registration
    }
    return null;  // Use default form for create
}
```

### Step 3: Config Page with Simple Table Widget ONLY (MANDATORY)

**File:** `<module>/page/<module>-config/<module>-config.page.ts`

```typescript
@Component({
    selector: 'bd-config-page',
    templateUrl: './bd-config.page.html',
    standalone: false
})
export class BdConfigPage extends ConfigPageComponent implements OnInit, OnDestroy {

    defaultLabel: string = "Billing Configuration";

    navigationItems: NavigationItem[] = [
        { label: 'Dunning Types', action: 'dunning-types', tooltip: 'Dunning Types', icon: 'fa fa-gavel', toggleable: false, default: true },
        { label: 'AI Agents', action: 'artificial-agents', tooltip: 'AI Agents', icon: 'fa fa-robot', toggleable: false, default: false }
    ];

    // CORRECT: Declarative widget configuration - navigation handles detail view
    widgets: {[key: string]: WidgetConfigInterface} = {
        dunningTypeWidget: {
            alias: 'bd.config.dunning.type',
            label: 'Dunning Types',
            entity: 'bd.DunningType',
            widgetData: null  // Simple table, navigation handles detail
        },
        aiAgentWidget: {
            alias: 'bd.config.ai.agent',
            label: 'AI Agents',
            entity: 'bd.DunningArtificialAgent',
            widgetData: null
        }
    };

    // Standard ConfigPage lifecycle methods...
}
```

### Step 4: Config Page Template (Simple Table Only)

**File:** `<module>-config.page.html`

```html
@if (initialized) {
    <mvs-config-header header="Billing Configuration" categoryTypeMode="technical"></mvs-config-header>

    <!-- Navigation handles section switching -->
    <ng-container *ngIf="activeNavigationItem?.action == 'dunning-types'">
        <div class="surface-card p-3 border-round shadow-1">
            @if (widgets['dunningTypeWidget']?.widgetData) {
                <!-- Simple table widget - click opens Object Page automatically -->
                <mvs-widget [widgetData]="widgets['dunningTypeWidget'].widgetData"></mvs-widget>
            }
        </div>
    </ng-container>

    <ng-container *ngIf="activeNavigationItem?.action == 'artificial-agents'">
        <div class="surface-card p-3 border-round shadow-1">
            @if (widgets['aiAgentWidget']?.widgetData) {
                <mvs-widget [widgetData]="widgets['aiAgentWidget'].widgetData"></mvs-widget>
            }
        </div>
    </ng-container>
}
```

---

## ⚠️ DEPRECATED: Pattern B (Master-Detail)

**IMPORTANT: Master-detail pattern is NO LONGER ACCEPTABLE for complex configuration entities.**

### Why Master-Detail is FORBIDDEN for Complex Entities

| Problem | Impact |
|---------|--------|
| Violates navigation consistency | Users expect Object Page for entity detail |
| Duplicates responsibility | Config Page should not render detail views |
| Loses architectural benefits | No left navigation, inconsistent UX |
| Creates maintenance burden | Two patterns for the same problem |
| Prevents proper URL handling | Cannot deep-link to specific entity |

### If ObjectComponent Does Not Exist

**You MUST create it.** There is NO alternative.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Q: What if my complex entity doesn't have an ObjectComponent?               │
│                                                                             │
│ A: CREATE ONE. This is MANDATORY. There are NO exceptions.                  │
│                                                                             │
│    Steps:                                                                   │
│    1. Create ObjectComponent extending ObjectBaseComponent                  │
│    2. Add left navigation for child entity types                            │
│    3. Create filtered child widgets in onObjectChanged()                    │
│    4. Register via getObjectComponent() in entity service                   │
│    5. Config Page uses simple table widget                                  │
│                                                                             │
│    Master-detail pattern is NOT a substitute for missing ObjectComponent.   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Anti-Patterns (FORBIDDEN - ARCHITECTURAL ERRORS)

### Anti-Pattern 1: Flat Tabs for Complex Entity Children

```typescript
// WRONG - ARCHITECTURAL ERROR - Will be rejected in code review
widgets: {
    dunningTypeWidget: { entity: 'bd.DunningType' },
    dunningTypeLevelWidget: { entity: 'bd.DunningTypeLevel' },  // FORBIDDEN!
    dunningTypeChargeWidget: { entity: 'bd.DunningTypeCharge' }, // FORBIDDEN!
}
```

**Why it's forbidden:** Child entities shown without parent context. User cannot see which DunningType the levels belong to. Manual FK filtering required.

### Anti-Pattern 2: Inline Master-Detail for Complex Entity

```html
<!-- WRONG - ARCHITECTURAL ERROR - Will be rejected in code review -->
<div class="col-4">
    <mvs-widget [widgetData]="masterWidget" (onObjectSelect)="onSelect($event)">
</div>
<div class="col-8">
    <dunning-type-object [objectIdentifier]="selected">  <!-- FORBIDDEN! -->
</div>
```

**Why it's forbidden:** Bypasses navigation system. ObjectComponent should open via Object Page navigation, not inline rendering.

### Anti-Pattern 3: Missing ObjectComponent for Complex Entity

```typescript
// WRONG - ARCHITECTURAL ERROR - Will be rejected in code review
class DunningTypeService extends MvsCrudService {
    getObjectComponent(mode?: MvsCrudModeEnum): Type<any> {
        return null;  // FORBIDDEN! Complex entity MUST have ObjectComponent
    }
}
```

**Why it's forbidden:** Complex entities with 2+ children MUST have ObjectComponent. There are no exceptions.

### Anti-Pattern 4: ObjectComponent Without Left Navigation

```typescript
// WRONG - ARCHITECTURAL ERROR - Will be rejected in code review
export class DunningTypeObjectComponent extends ObjectBaseComponent {
    // Missing navigationItems!
    // Child entities not accessible via navigation
}
```

**Why it's forbidden:** Users cannot navigate between child entity types. Left navigation is MANDATORY for complex entity ObjectComponents.

---

## Summary

| Entity Type | Child Count | Implementation |
|-------------|-------------|----------------|
| Simple config entity | 0-1 | Simple ConfigPage with tabs allowed |
| Complex config entity | 2+ | Simple table → Object Page → ObjectComponent with left nav |

**Code Review:** See [acceptance.md](acceptance.md) for complete acceptance criteria, rule IDs, and checklist.

**The Complex Configuration Entity Rule is NON-NEGOTIABLE. There are NO exceptions.**
