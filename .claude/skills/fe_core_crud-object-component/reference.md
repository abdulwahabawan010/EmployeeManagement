# CRUD Object Component API Reference

This document provides a complete reference for all input properties, output events, and required imports for the CRUD Object Component system.

## Architecture Overview

CRUD Object Component is a **system of cooperating components**:

| Component | File Path | Role |
|-----------|-----------|------|
| `MvsCrudObjectComponent` | `features/core/shared/crud/components/mvs-crud-object/` | Entry point, dynamic component loader |
| `MvsCrudObjectInterfaceComponent` | `features/core/shared/logic/form/logic/` | Base contract, lifecycle event hooks |
| `MvsCrudObjectGenericComponent` | `features/core/shared/crud/components/mvs-crud-object-generic/` | Default CRUD logic handler |
| `MvsCrudObjectFormComponent` | `features/core/shared/crud/components/mvs-crud-object-form/` | Form presentation layer |
| `MvsCrudService` | `features/core/shared/service/crud/mvs-crud.service.ts` | Abstract data access layer |

---

## Input Properties

### Required Properties

| Property | Type | Required | Purpose |
|----------|------|----------|---------|
| `objectType` | `string` | **Yes** | Entity type alias (e.g., `"cr.Customer"`) |

### Conditional Properties

| Property | Type | Required | Purpose |
|----------|------|----------|---------|
| `objectId` | `number` | Edit mode | Entity ID (present = updateMode, absent = createMode) |
| `importObjectContext` | `DtoImportObjectContext` | Child objects | Parent object context for foreign key pre-fill |

### Optional Properties

| Property | Type | Default | Purpose |
|----------|------|---------|---------|
| `defaultCreateDto` | `DtoDetail` | `null` | Pre-filled values for create mode |
| `formControlOverwrite` | `MvsFormControlOverwrite` | `null` | Override specific form controls |
| `widgetLayoutConfig` | `WidgetConfigDto` | `null` | Widget configuration for embedded widgets |
| `readonly` | `boolean` | `false` | Disable all editing |
| `disabled` | `boolean` | `false` | Disable form controls |
| `enableBack` | `boolean` | `false` | Show back button |
| `formFooterButtons` | `WidgetHelperButton[]` | `null` | Custom footer buttons |
| `sgUseCaseId` | `number` | `null` | Smart guide use case ID |
| `formMode` | `FormModeEnum` | `REGULAR` | Form mode (REGULAR, SMART, SMART_CONFIG) |
| `forceHideModes` | `boolean` | `false` | Hide mode selector |
| `autoSaveMode` | `boolean` | `false` | Enable autosave |
| `formFooterCustomButtons` | `FormFooterButton[]` | `null` | Custom action buttons |

---

## Output Events

### Required Events

| Event | Type | When Emitted | Purpose |
|-------|------|--------------|---------|
| `onChangedObject` | `ObjectChangeInformation` | After create/update/delete | **MUST HANDLE** - Notify parent of CRUD result |

### Optional Events

| Event | Type | When Emitted | Purpose |
|-------|------|--------------|---------|
| `lifecycleEvents` | `MvsFormEvent` | Throughout lifecycle | Extension points for custom logic |
| `onBackEvent` | `void` | Back button clicked | Navigate back |
| `onFooterButtonClick` | `WidgetHelperButtonEvent` | Custom button clicked | Handle custom actions |
| `onFormDirty` | `boolean` | Form dirty state changes | Track unsaved changes |
| `onFormChange` | `DtoDetail` | Form values change | React to form edits |
| `onFormTargetFocus` | `FormSmartGuideFocusEvent` | Form field focused | Smart guide integration |

---

## ObjectChangeInformation Interface

```typescript
interface ObjectChangeInformation {
  objectType: string;                        // "cr.Customer"
  action: ObjectChangeInformationActionEnum; // created | updated | deleted
  before: DtoDetail | null;                  // DTO before change (update only)
  after: DtoDetail | null;                   // DTO after change (create/update)
}

enum ObjectChangeInformationActionEnum {
  created = 'created',
  updated = 'updated',
  deleted = 'deleted'
}
```

### Action Values

| Action | `before` | `after` | Description |
|--------|----------|---------|-------------|
| `created` | `null` | Created DTO | New object created |
| `updated` | Previous DTO | Updated DTO | Existing object modified |
| `deleted` | Deleted DTO | `null` | Object removed |

---

## Required Imports

### Standard CRUD Component Usage

```typescript
// Angular core
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

// Event types (ALWAYS import when using CRUD Object Component)
import {
  ObjectChangeInformation,
  ObjectChangeInformationActionEnum
} from 'features/core/shared/logic/object-change-information';
```

### With Parent Context (Child Objects)

```typescript
// Context types (for parent context)
import { DtoImportObjectContext } from 'features/core/shared/dto/dto.import.object.context';
import { ObjectIdentifier } from 'features/core/shared/basic/object-identifier';
```

### With Default Values

```typescript
// Data types
import { DtoDetail } from 'features/core/shared/dto/dto.detail';
```

### For Custom CRUD Components (Advanced)

```typescript
// Base class for entity-specific CRUD components
import { MvsCrudObjectInterfaceComponent } from 'features/core/shared/logic/form/logic/mvs-crud-object-interface.component';

// Lifecycle events
import { MvsFormEventCrudAction } from 'features/core/shared/logic/form/logic/mvs-form-event-crud-action';
import { MvsFormEventDtoToForm } from 'features/core/shared/logic/form/logic/mvs-form-event-dto-to-form';
import { MvsFormEventFormToDto } from 'features/core/shared/logic/form/logic/mvs-form-event-form-to-dto';
```

---

## DtoImportObjectContext Usage

### Creating Context from Parent

```typescript
// Create context from parent identifier
const parentIdentifier = new ObjectIdentifier("cr.Customer", this.customerId);
this.parentContext = DtoImportObjectContext.createFromObjectIdentifier(parentIdentifier);
```

### Using Context in Template

```html
<mvs-crud-object
  [objectType]="'bm.Invoice'"
  [importObjectContext]="parentContext"
  (onChangedObject)="handleCreated($event)">
</mvs-crud-object>
```

### Effect of Context

| Without Context | With Context |
|-----------------|--------------|
| Foreign key dropdown shows all options | Foreign key pre-filled with parent |
| User must manually select parent | Parent automatically set |
| Risk of orphaned records | Guaranteed parent association |

---

## Form Mode Enum

```typescript
enum FormModeEnum {
  REGULAR = 'REGULAR',       // Standard form mode
  SMART = 'SMART',           // Smart guide enabled
  SMART_CONFIG = 'SMART_CONFIG' // Smart guide configuration mode
}
```

---

## Mode Detection

The component automatically detects mode based on `objectId`:

| objectId | Mode | Behavior |
|----------|------|----------|
| Not provided | Create Mode | Empty form for new entity |
| Provided | Update Mode | Loads existing entity for editing |

---

## Event Handler Implementation

### Minimal Handler (Required)

```typescript
handleCrudComplete(event: ObjectChangeInformation): void {
  if (event.action === ObjectChangeInformationActionEnum.created) {
    // Navigate to detail view
    this.router.navigate(['/entity', event.after.id]);
  }
}
```

### Full Handler (Recommended)

```typescript
handleCrudComplete(event: ObjectChangeInformation): void {
  switch (event.action) {
    case ObjectChangeInformationActionEnum.created:
      console.log('Created:', event.after);
      this.router.navigate(['/entity', event.after.id]);
      break;

    case ObjectChangeInformationActionEnum.updated:
      console.log('Updated:', event.after);
      this.dto = event.after;
      break;

    case ObjectChangeInformationActionEnum.deleted:
      console.log('Deleted');
      this.router.navigate(['/entities']);
      break;
  }
}
```

---

## Dirty State Tracking

### Template

```html
<mvs-crud-object
  [objectType]="'cr.Customer'"
  (onFormDirty)="formDirty = $event">
</mvs-crud-object>
```

### Component

```typescript
formDirty: boolean = false;

canDeactivate(): boolean {
  if (this.formDirty) {
    return confirm('You have unsaved changes. Leave anyway?');
  }
  return true;
}
```

### Route Guard

```typescript
// In routing module
{
  path: 'customer/:id/edit',
  component: CustomerEditPageComponent,
  canDeactivate: [CanDeactivateGuard]
}
```

---

## Common Binding Combinations

### Create Mode

```html
<mvs-crud-object
  [objectType]="'cr.Customer'"
  (onChangedObject)="handleCreated($event)">
</mvs-crud-object>
```

### Edit Mode

```html
@if (entityId) {
  <mvs-crud-object
    [objectType]="'cr.Customer'"
    [objectId]="entityId"
    (onChangedObject)="handleUpdated($event)"
    (onFormDirty)="formDirty = $event">
  </mvs-crud-object>
}
```

### Child Create with Parent Context

```html
@if (parentContext) {
  <mvs-crud-object
    [objectType]="'bm.Invoice'"
    [importObjectContext]="parentContext"
    (onChangedObject)="handleCreated($event)">
  </mvs-crud-object>
}
```

### Create with Defaults

```html
<mvs-crud-object
  [objectType]="'bm.Invoice'"
  [defaultCreateDto]="defaultValues"
  (onChangedObject)="handleCreated($event)">
</mvs-crud-object>
```

### Autosave Mode

```html
<mvs-crud-object
  [objectType]="'cr.Customer'"
  [objectId]="entityId"
  [autoSaveMode]="true"
  (onChangedObject)="handleAutoSaved($event)">
</mvs-crud-object>
```
