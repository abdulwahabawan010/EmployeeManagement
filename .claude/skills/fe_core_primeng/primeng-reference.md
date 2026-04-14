# PrimeNG Implementation Guide

## Table of Contents

1. [Setup & Configuration](#setup--configuration)
2. [Theme Configuration (Klaus Preset)](#theme-configuration-klaus-preset)
3. [Module Imports Strategy](#module-imports-strategy)
4. [Core Components Usage](#core-components-usage)
5. [Form Integration Patterns](#form-integration-patterns)
6. [Service Integration](#service-integration)
7. [Widget System Integration](#widget-system-integration)
8. [Base Class Integration](#base-class-integration)
9. [Styling Guidelines](#styling-guidelines)
10. [Common Patterns](#common-patterns)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Setup & Configuration

### 1. Global PrimeNG Configuration

**File:** `/projects/shell-alpha/src/app/app.module.ts`

```typescript
import { providePrimeNG } from 'primeng/config';
import { MessageService, ConfirmationService } from 'primeng/api';
import { KlausPreset } from './Klaus-preset';
import { MvsConfigService } from '@core/shared/service/mvs-config.service';

@NgModule({
  imports: [
    // ... other imports
  ],
  providers: [
    providePrimeNG({
      theme: {
        preset: KlausPreset,           // Custom brand theme
        options: {
          darkModeSelector: false      // Disable dark mode selector
        }
      },
      ripple: true,                    // Enable ripple effect globally
      translation: MvsConfigService.germanConfig  // German localization
    }),
    MessageService,                    // For toast notifications
    ConfirmationService               // For confirmation dialogs
  ]
})
export class AppModule { }
```

**Key Configuration Options:**

| Option | Value | Purpose |
|--------|-------|---------|
| `theme.preset` | `KlausPreset` | Custom brand colors and design tokens |
| `theme.options.darkModeSelector` | `false` | Disable automatic dark mode |
| `ripple` | `true` | Enable ripple effect on buttons and interactive elements |
| `translation` | `MvsConfigService.germanConfig` | German language for all PrimeNG components |

### 2. Shared Module Setup (v20 Syntax)

**File:** `/features/core/shared/shared.module.ts`

```typescript
import { NgModule } from '@angular/core';

// Import all commonly used PrimeNG v20 modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';  // ✅ v20: was CalendarModule
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { PanelModule } from 'primeng/panel';
import { AccordionModule } from 'primeng/accordion';
import { TabsModule } from 'primeng/tabs';  // ✅ v20: was TabViewModule
import { ChipModule } from 'primeng/chip';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PopoverModule } from 'primeng/popover';
import { DrawerModule } from 'primeng/drawer';
import { TreeSelectModule } from 'primeng/treeselect';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { FileUploadModule } from 'primeng/fileupload';
import { ContextMenuModule } from 'primeng/contextmenu';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';  // ✅ v20: Skeleton loader
import { FieldsetModule } from 'primeng/fieldset';
import { DividerModule } from 'primeng/divider';
import { AvatarModule } from 'primeng/avatar';
import { RippleModule } from 'primeng/ripple';

const PRIMENG_MODULES = [
  TableModule,
  ButtonModule,
  DialogModule,
  SelectModule,
  DatePickerModule,          // ✅ v20: was CalendarModule
  InputTextModule,
  ToastModule,
  ConfirmDialogModule,
  ToolbarModule,
  PanelModule,
  AccordionModule,
  TabsModule,                // ✅ v20: was TabViewModule
  ChipModule,
  BadgeModule,
  TooltipModule,
  ProgressSpinnerModule,
  PopoverModule,
  DrawerModule,
  TreeSelectModule,
  MultiSelectModule,
  CheckboxModule,
  RadioButtonModule,
  InputNumberModule,
  InputTextareaModule,
  ToggleButtonModule,
  FileUploadModule,
  ContextMenuModule,
  MessageModule,
  SkeletonModule,            // ✅ v20: Skeleton loader
  FieldsetModule,
  DividerModule,
  AvatarModule,
  RippleModule
];

@NgModule({
  imports: PRIMENG_MODULES,
  exports: PRIMENG_MODULES
})
export class SharedModule { }
```

**Benefits of Shared Module Approach:**

- Import once, use everywhere in the application
- Consistent version across all features
- Easier to update (change imports in one place)
- Smaller feature module import lists

### 3. Feature Module Setup

For feature-specific PrimeNG components not in shared module:

```typescript
// Example: /features/feature-bm/bm/bm.module.ts
import { ChartModule } from 'primeng/chart';
import { TimelineModule } from 'primeng/timeline';

@NgModule({
  imports: [
    SharedModule,      // Gets common PrimeNG modules
    ChartModule,       // Feature-specific module
    TimelineModule     // Feature-specific module
  ]
})
export class BmModule { }
```

---

## Theme Configuration (Klaus Preset)

### 1. Custom Theme Definition

**File:** `/projects/shell-alpha/src/app/Klaus-preset.ts`

```typescript
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const KlausPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{primary.50}',
            100: '{primary.100}',
            200: '{primary.200}',
            300: '{primary.300}',
            400: '{primary.400}',
            500: '{primary.500}',
            600: '{primary.600}',
            700: '{primary.700}',
            800: '{primary.800}',
            900: '{primary.900}',
            950: '{primary.950}'
        },
        colorScheme: {
            light: {
                primary: {
                    color: '{primary.900}',
                    contrastColor: '#ffffff',
                    hoverColor: '{primary.700}',
                    activeColor: '{primary.800}'
                },
                highlight: {
                    background: '{primary.900}',
                    focusBackground: '{primary.700}',
                    color: '#ffffff',
                    focusColor: '#ffffff'
                },
                surface: {
                    0: '#ffffff',
                    50: '{slate.50}',
                    100: '{slate.100}',
                    200: '{slate.200}',
                    300: '{slate.300}',
                    400: '{slate.400}',
                    500: '{slate.500}',
                    600: '{slate.600}',
                    700: '{slate.700}',
                    800: '{slate.800}',
                    900: '{slate.900}',
                    950: '{slate.950}'
                }
            },
            dark: {
                primary: {
                    color: '{primary.300}',
                    contrastColor: '#0f172a',
                    hoverColor: '{primary.200}',
                    activeColor: '{primary.100}'
                },
                highlight: {
                    background: '{primary.300}',
                    focusBackground: '{primary.200}',
                    color: '#0f172a',
                    focusColor: '#0f172a'
                },
                surface: {
                    0: '#ffffff',
                    50: '{zinc.50}',
                    100: '{zinc.100}',
                    200: '{zinc.200}',
                    300: '{zinc.300}',
                    400: '{zinc.400}',
                    500: '{zinc.500}',
                    600: '{zinc.600}',
                    700: '{zinc.700}',
                    800: '{zinc.800}',
                    900: '{zinc.900}',
                    950: '{zinc.950}'
                }
            }
        }
    }
});
```

### 2. Theme Token Usage

**CSS Variables Generated by Klaus Preset:**

```css
/* Primary Colors */
--primary-color: #1e293b;           /* primary.900 */
--primary-contrast-color: #ffffff;
--primary-hover-color: #334155;     /* primary.700 */
--primary-active-color: #1e293b;    /* primary.800 */

/* Surface Colors */
--surface-0: #ffffff;
--surface-50: #f8fafc;
--surface-100: #f1f5f9;
--surface-200: #e2e8f0;
--surface-300: #cbd5e1;
--surface-400: #94a3b8;
--surface-500: #64748b;
--surface-600: #475569;
--surface-700: #334155;
--surface-800: #1e293b;
--surface-900: #0f172a;

/* Text Colors */
--text-color: var(--surface-900);
--text-color-secondary: var(--surface-600);
--text-color-muted: var(--surface-500);
```

**Using Theme Tokens in Templates:**

```html
<!-- Use CSS variables for dynamic theming -->
<div style="background-color: var(--surface-100); color: var(--text-color)">
  Content
</div>

<!-- Use PrimeFlex utility classes that reference theme -->
<div class="surface-100 text-color">
  Content uses theme tokens automatically
</div>
```

**Using Theme Tokens in Component SCSS:**

```scss
.my-custom-component {
  background-color: var(--surface-0);
  border: 1px solid var(--surface-300);
  color: var(--text-color);

  &:hover {
    background-color: var(--surface-50);
  }
}

.my-button {
  background-color: var(--primary-color);
  color: var(--primary-contrast-color);

  &:hover {
    background-color: var(--primary-hover-color);
  }
}
```

### 3. Customizing Individual Components

**Global Component Overrides:**

```scss
// In global styles.scss
:root {
  --p-button-padding-y: 0.75rem;
  --p-button-padding-x: 1.25rem;
  --p-button-border-radius: 0.5rem;

  --p-inputtext-padding-y: 0.75rem;
  --p-inputtext-padding-x: 1rem;

  --p-dialog-border-radius: 0.75rem;
  --p-dialog-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

---

## Module Imports Strategy

### Import Specific Modules

Import only the specific modules you need:

```typescript
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
```

### Feature Module Pattern

```typescript
// Feature module: /features/feature-crm/cr/cr.module.ts
import { NgModule } from '@angular/core';
import { SharedModule } from '@core/shared/shared.module';  // Includes common PrimeNG modules

// Import only feature-specific PrimeNG modules
import { ChartModule } from 'primeng/chart';

@NgModule({
  imports: [
    SharedModule,    // Gets Table, Button, Dialog, etc. automatically
    ChartModule      // Feature-specific: Charts only used in CRM module
  ],
  declarations: [
    // ... components
  ]
})
export class CrModule { }
```

### Lazy Loading with PrimeNG

```typescript
// Route configuration
{
  path: 'reports',
  loadChildren: () => import('./reports/reports.module').then(m => m.ReportsModule)
}
```

**Reports Module (Lazy Loaded):**

```typescript
@NgModule({
  imports: [
    SharedModule,     // Common PrimeNG components
    ChartModule,      // Only loaded when reports route is accessed
    TimelineModule
  ]
})
export class ReportsModule { }
```

---

## Core Components Usage

### 1. Data Table (p-table)

**Basic Table:**

```html
<p-table [value]="customers" [paginator]="true" [rows]="10">
  <ng-template pTemplate="header">
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Status</th>
    </tr>
  </ng-template>

  <ng-template pTemplate="body" let-customer>
    <tr>
      <td>{{ customer.name }}</td>
      <td>{{ customer.email }}</td>
      <td>{{ customer.status }}</td>
    </tr>
  </ng-template>
</p-table>
```

**Advanced Table with Lazy Loading (Our Pattern):**

```typescript
// Component: mvs-table.component.ts
import { Component, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { MessageService } from 'primeng/api';

export class MvsTableComponent {
  @ViewChild('mvsTable') mvsTable: Table;

  entries: any[] = [];
  fields: UiTableField[] = [];
  ready: boolean = false;
  busy: boolean = false;

  refreshData(event: any) {
    const filterCriteria = this.getFilterCriteria(event.filters);
    const sortings = event.sortField
      ? [new Sorting(event.sortField, event.sortOrder === 1)]
      : [];

    const request = new DtoListRequest(
      event.first / event.rows + 1,  // Page number
      event.rows,                     // Page size
      sortings,
      filterCriteria
    );

    this.busy = true;
    this.dataProvider.getData(request).subscribe({
      next: (resp) => {
        this.entries = resp.entries;
        this.totalRecords = resp.totalCount;
        this.busy = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Data could not be loaded',
          detail: error.message
        });
        this.busy = false;
      }
    });
  }
}
```

```html
<!-- Template: mvs-table.component.html -->
<p-table #mvsTable
         [value]="entries"
         [lazy]="true"
         (onLazyLoad)="refreshData($event)"
         [paginator]="true"
         [rows]="25"
         [totalRecords]="totalRecords"
         [loading]="busy"
         styleClass="p-datatable-gridlines p-datatable-striped"
         [scrollable]="true">

  <!-- Caption with actions -->
  <ng-template pTemplate="caption">
    <div class="flex justify-content-between align-items-center">
      <h2 class="m-0">{{ tableTitle }}</h2>
      <div class="flex gap-2">
        <p-button icon="fa-regular fa-gear"
                 styleClass="p-button-outlined"
                 (onClick)="showTableConfig()"></p-button>
        <p-button icon="fa-regular fa-download"
                 styleClass="p-button-outlined"
                 (onClick)="exportToCSV()"></p-button>
      </div>
    </div>
  </ng-template>

  <!-- Header with sorting and filtering -->
  <ng-template pTemplate="header">
    <tr>
      <ng-container *ngFor="let field of fields">
        <th *ngIf="field.visible"
            pSortableColumn="{{field.id}}"
            [ngStyle]="field.uiStyles">
          <div class="flex justify-content-between align-items-center">
            {{ field.uiLabel }}
            <p-sortIcon field="{{field.id}}"></p-sortIcon>
            <p-columnFilter type="text"
                          field="{{field.id}}"
                          display="menu"></p-columnFilter>
          </div>
        </th>
      </ng-container>
      <th *ngIf="hasRowActions" style="width: 100px">Actions</th>
    </tr>
  </ng-template>

  <!-- Body -->
  <ng-template pTemplate="body" let-entry>
    <tr class="p-selectable-row">
      <ng-container *ngFor="let field of fields">
        <td *ngIf="field.visible" [ngStyle]="field.uiStyles">
          {{ entry[field.id] }}
        </td>
      </ng-container>

      <td *ngIf="hasRowActions">
        <p-button *ngFor="let action of rowActions"
                 icon="{{ action.icon }}"
                 styleClass="p-button-text p-button-icon-only"
                 pTooltip="{{ action.label }}"
                 (onClick)="onRowAction(action, entry)"></p-button>
      </td>
    </tr>
  </ng-template>

  <!-- Empty message -->
  <ng-template pTemplate="emptymessage">
    <tr>
      <td [attr.colspan]="fields.length + (hasRowActions ? 1 : 0)" class="text-center p-5">
        <i class="fa-regular fa-inbox" style="font-size: 3rem; color: var(--text-color-secondary);"></i>
        <p class="mt-3 text-color-secondary">No data found</p>
      </td>
    </tr>
  </ng-template>
</p-table>
```

**Table Configuration Dialog:**

```html
<p-dialog header="Table Configuration"
         [(visible)]="displayTableConfig"
         [style]="{width: '50vw', height: '50vw'}"
         [modal]="true">

  <p-accordion>
    <p-accordionPanel header="Fields and Order">
      <p-table [value]="fields" [reorderableColumns]="true">
        <ng-template pTemplate="header">
          <tr>
            <th style="width: 3rem"></th>
            <th>Field</th>
            <th style="width: 8rem">Visible</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-field let-index="rowIndex">
          <tr [pReorderableRow]="index">
            <td><i class="fa-regular fa-bars" pReorderableRowHandle></i></td>
            <td>{{ field.uiLabel }}</td>
            <td><p-checkbox [(ngModel)]="field.visible" binary="true"></p-checkbox></td>
          </tr>
        </ng-template>
      </p-table>
    </p-accordionPanel>
  </p-accordion>

  <ng-template #footer>
    <p-button label="Close"
             icon="fa-regular fa-times"
             (onClick)="displayTableConfig = false"></p-button>
    <p-button label="Save"
             icon="fa-regular fa-check"
             (onClick)="saveTableConfig()"></p-button>
  </ng-template>
</p-dialog>
```

### 2. Buttons (p-button)

**Basic Button:**

```html
<p-button label="Click Me"
         icon="fa-solid fa-check"
         (onClick)="handleClick()"></p-button>
```

**Button Variants:**

```html
<!-- Primary (default) -->
<p-button label="Primary"></p-button>

<!-- Outlined -->
<p-button label="Outlined" styleClass="p-button-outlined"></p-button>

<!-- Text Button -->
<p-button label="Text" styleClass="p-button-text"></p-button>

<!-- Severity Variants -->
<p-button label="Success" severity="success"></p-button>
<p-button label="Info" severity="info"></p-button>
<p-button label="Warn" severity="warn"></p-button>
<p-button label="Danger" severity="danger"></p-button>
<p-button label="Help" severity="help"></p-button>
<p-button label="Contrast" severity="contrast"></p-button>

<!-- Icon Only -->
<p-button icon="fa-regular fa-pencil" styleClass="p-button-icon-only"></p-button>

<!-- Rounded -->
<p-button icon="fa-regular fa-star" styleClass="p-button-rounded"></p-button>

<!-- Disabled -->
<p-button label="Disabled" [disabled]="true"></p-button>

<!-- Loading State -->
<p-button label="Loading" [loading]="busy" (onClick)="save()"></p-button>
```

**Common Pattern - Action Buttons:**

```html
<div class="flex gap-2">
  <p-button label="Save"
           icon="fa-solid fa-check"
           [loading]="busy"
           (onClick)="save()"></p-button>

  <p-button label="Cancel"
           icon="fa-solid fa-times"
           styleClass="p-button-outlined"
           (onClick)="cancel()"></p-button>
</div>
```

### 3. Dialogs (p-dialog)

**Basic Dialog:**

```typescript
export class MyComponent {
  displayDialog: boolean = false;

  showDialog() {
    this.displayDialog = true;
  }

  closeDialog() {
    this.displayDialog = false;
  }
}
```

```html
<p-button label="Open Dialog" (onClick)="showDialog()"></p-button>

<p-dialog header="Dialog Title"
         [(visible)]="displayDialog"
         [modal]="true"
         [style]="{width: '50vw'}"
         [breakpoints]="{'960px': '75vw', '640px': '100vw'}">

  <p>Dialog content goes here</p>

  <ng-template #footer>
    <p-button label="Close"
             icon="fa-solid fa-times"
             (onClick)="closeDialog()"
             styleClass="p-button-text"></p-button>
    <p-button label="Save"
             icon="fa-solid fa-check"
             (onClick)="save()"></p-button>
  </ng-template>
</p-dialog>
```

**Dialog with Custom Header:**

```html
<p-dialog [(visible)]="displayDialog"
         [style]="{width: '600px', height: '600px'}"
         [maximizable]="true">

  <ng-template #header>
    <div class="flex justify-content-between align-items-center w-full">
      <span class="font-semibold text-xl">Custom Header</span>
      <p-toggleButton [(ngModel)]="viewMode"
                     onLabel="HTML View"
                     offLabel="PDF View"></p-toggleButton>
    </div>
  </ng-template>

  <!-- Content based on toggle -->
  <ng-container *ngIf="viewMode">
    <div>HTML View Content</div>
  </ng-container>
  <ng-container *ngIf="!viewMode">
    <object [data]="pdfSource" type="application/pdf"></object>
  </ng-container>
</p-dialog>
```

### 4. Dropdowns/Select (p-select)

**Basic Select:**

```typescript
export class MyComponent {
  selectedCity: any;
  cities = [
    { label: 'New York', value: 'NY' },
    { label: 'London', value: 'LDN' },
    { label: 'Paris', value: 'PRS' }
  ];
}
```

```html
<p-select [(ngModel)]="selectedCity"
         [options]="cities"
         optionLabel="label"
         optionValue="value"
         placeholder="Select a city"></p-select>
```

**Select with Filtering:**

```html
<p-select [(ngModel)]="selectedCountry"
         [options]="countries"
         [filter]="true"
         [autofocusFilter]="true"
         filterBy="label"
         optionLabel="label"
         placeholder="Search countries">
</p-select>
```

**Our MvsFormField Pattern:**

```typescript
// mvs-form-field-select-dropdown.component.ts
@Component({
  selector: 'mvs-form-field-select',
  template: `
    <div [formGroup]="formGroup">
      <p-select
        #dropdownField
        (onChange)="handleFieldChange($event)"
        [filter]="!readOnly"
        [autofocusFilter]="true"
        [formControlName]="formField.id"
        [inputId]="formField.id"
        [options]="entries"
        [readonly]="readOnly || disabled"
        [showClear]="!readOnly"
        [class.ng-invalid]="formGroup.controls[formField.id]?.invalid"
        [styleClass]="getFieldStyleClass()"
        filterBy="label"
        optionLabel="label"
        optionValue="key"
        placeholder="auswählen"
        appendTo="body">
      </p-select>
    </div>
  `
})
export class MvsFormFieldSelectDropdownComponent extends MvsFormFieldBaseComponent {
  @ViewChild('dropdownField') dropdownField!: Select;

  entries: MvsFormValueListEntryDto[];

  getFieldStyleClass(): string {
    let classes = 'w-full';
    if (this.disabled || this.readOnly) {
      classes += ' custom-field-disabled';
    }
    if (this.hasChanged) {
      classes += ' change-indicator-border';
    }
    return classes;
  }
}
```

### 5. Date Picker (p-datePicker)

**Basic Date Picker:**

```html
<p-datePicker [(ngModel)]="selectedDate"
             dateFormat="dd.mm.yy"
             [showIcon]="true"></p-datePicker>
```

**Date Picker with Min/Max:**

```html
<p-datePicker [(ngModel)]="selectedDate"
             [minDate]="minDate"
             [maxDate]="maxDate"
             dateFormat="dd.mm.yy"></p-datePicker>
```

**Our Advanced Pattern with Helper Shortcuts:**

```typescript
// mvs-form-field-date-picker.component.ts
export class MvsFormFieldDatePickerComponent extends MvsFormFieldBaseComponent {
  @ViewChild("op", {static: true}) optionsPanel: Popover;
  @ViewChild('calendarField') calendarField!: DatePicker;

  date: Date;
  minDate?: Date;
  maxDate?: Date;
  monthsFromDate: number = 12;

  setCurrentDate(): void {
    this.date = new Date();
    this.handleDateFieldChange(this.date);
    this.optionsPanel.hide();
  }

  setTomorrowDate(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.date = tomorrow;
    this.handleDateFieldChange(this.date);
    this.optionsPanel.hide();
  }

  customerYearFromStartDate(years: number): void {
    const startDate = this.formGroup.value['startDate'];
    if (!startDate) return;

    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + years);
    this.date = endDate;
    this.handleDateFieldChange(this.date);
  }
}
```

```html
<div>
  <div class="flex">
    <div class="p-inputgroup">
      <p-datePicker
        #calendarField
        [(ngModel)]="date"
        [readonlyInput]="readOnly"
        [disabled]="readOnly || disabled"
        [showIcon]="false"
        [minDate]="minDate"
        [maxDate]="maxDate"
        (onSelect)="handleDateFieldChange($event)"
        dateFormat="dd.mm.yy"
        appendTo="body"
        [class.ng-invalid]="formGroup.controls[formField.id]?.invalid">
      </p-datePicker>

      <span *ngIf="date"
           class="p-inputgroup-addon cursor-pointer"
           (click)="clearDate()">
        <i class="fa-regular fa-xmark"></i>
      </span>

      <span class="p-inputgroup-addon cursor-pointer"
           (click)="optionsPanel.toggle($event)">
        <i class="fa-solid fa-abacus"></i>
      </span>
    </div>
  </div>

  <!-- Quick shortcuts for end date -->
  <ng-container *ngIf="formGroup.value['startDate'] && formField.id == 'endDate'">
    <div class="flex gap-3 m-1">
      <span class="cursor-pointer text-primary underline"
           (click)="customerYearFromStartDate(1)">1 Jahr</span>
      <span class="cursor-pointer text-primary underline"
           (click)="customerYearFromStartDate(2)">2 Jahre</span>
      <span class="cursor-pointer text-primary underline"
           (click)="customerYearFromStartDate(3)">3 Jahre</span>
      <span class="cursor-pointer text-primary underline"
           (click)="customerYearFromStartDate(5)">5 Jahre</span>
    </div>
  </ng-container>
</div>

<!-- Popover with advanced date options -->
<p-popover #op [style]="{width: '300px'}">
  <p class="cursor-pointer p-2 hover:surface-100" (click)="setCurrentDate()">
    Heute
  </p>
  <p class="cursor-pointer p-2 hover:surface-100" (click)="setTomorrowDate()">
    Morgen
  </p>
  <p class="cursor-pointer p-2 hover:surface-100" (click)="setFirstOfNextMonth()">
    1. nächsten Monat
  </p>

  <ng-container *ngIf="formGroup.value['startDate'] && formField.id == 'endDate'">
    <p-divider></p-divider>
    <div class="flex align-items-center gap-2 p-2">
      <p-inputNumber [(ngModel)]="monthsFromDate"
                    [min]="1"
                    [max]="120"
                    inputId="monthsFromDate"></p-inputNumber>
      <span class="cursor-pointer text-primary" (click)="monthsFromStartDate()">
        Monate seit dem Startdatum
      </span>
    </div>
  </ng-container>
</p-popover>
```

### 6. Multi-Select (p-multiselect)

```html
<p-multiselect [(ngModel)]="selectedCategories"
              [options]="categories"
              optionLabel="label"
              optionValue="value"
              [filter]="true"
              placeholder="Select categories"
              [maxSelectedLabels]="3"
              [showClear]="true">
</p-multiselect>
```

### 7. Tree Select (p-treeselect)

**Used in Condition Builder:**

```typescript
export class ConditionBuilderComponent {
  cascadeNodes: TreeNode[];
  selectedNode: any;

  onTreeSelectNodeSelect(criteria: any, menuType: string, event: any): void {
    const selectedNode = event.node;
    criteria.attribute = selectedNode.data;
    criteria.attributeLabel = selectedNode.label;
  }

  onNodeExpand(event: any): void {
    if (event.node && event.node.children.length === 0) {
      // Lazy load children
      this.loadChildren(event.node);
    }
  }
}
```

```html
<p-treeSelect
  style="min-width: 13rem"
  styleClass="w-full"
  [options]="cascadeNodes"
  (onNodeExpand)="onNodeExpand($event)"
  (onNodeSelect)="onTreeSelectNodeSelect(criteria, 'attributeItems', $event)"
  [(ngModel)]="criteria"
  [filter]="true"
  optionLabel="field"
  placeholder="Select Attribute"
  appendTo="body">
</p-treeSelect>
```

### 8. Toast Notifications (p-toast)

**Template (Add once in app.component.html):**

```html
<p-toast position="top-right"></p-toast>
```

**Service Usage:**

```typescript
import { MessageService } from 'primeng/api';

export class MyComponent {
  constructor(private messageService: MessageService) {}

  showSuccess(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Operation completed successfully'
    });
  }

  showError(): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Operation failed'
    });
  }

  showWarning(): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Please review your input'
    });
  }

  showInfo(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Info',
      detail: 'New updates available'
    });
  }

  showCustom(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Custom Toast',
      detail: 'Custom message here',
      life: 5000,        // Auto-close after 5 seconds
      sticky: false,     // Not sticky
      closable: true     // Show close button
    });
  }
}
```

### 9. Confirmation Dialog (p-confirmDialog)

**Template (Add once in app.component.html):**

```html
<p-confirmDialog></p-confirmDialog>
```

**Service Usage:**

```typescript
import { ConfirmationService } from 'primeng/api';

export class MyComponent {
  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  confirmDelete(item: any): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this item?',
      header: 'Confirm Deletion',
      icon: 'fa-regular fa-triangle-exclamation',
      accept: () => {
        this.deleteItem(item);
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Item deleted successfully'
        });
      },
      reject: () => {
        // User cancelled
      }
    });
  }

  confirmSave(): void {
    this.confirmationService.confirm({
      message: 'Do you want to save changes?',
      header: 'Unsaved Changes',
      icon: 'fa-regular fa-info-circle',
      acceptLabel: 'Yes, Save',
      rejectLabel: 'No, Discard',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.save();
      },
      reject: () => {
        this.discard();
      }
    });
  }
}
```

### 10. Progress Spinner (p-progressSpinner)

```html
<!-- Simple spinner -->
<p-progressSpinner *ngIf="busy"></p-progressSpinner>

<!-- Custom styled spinner -->
<p-progressSpinner *ngIf="busy"
                  [style]="{width: '50px', height: '50px'}"
                  styleClass="custom-spinner"
                  strokeWidth="8"
                  fill="var(--surface-ground)">
</p-progressSpinner>

<!-- Overlay spinner -->
<div class="spinner-overlay" *ngIf="busy">
  <p-progressSpinner></p-progressSpinner>
</div>
```

```scss
.spinner-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
```

### 11. Chips (p-chip)

**Basic Chips:**

```html
<p-chip label="Technology"></p-chip>
<p-chip label="Sports" icon="fa-regular fa-star"></p-chip>
<p-chip label="Remove" [removable]="true"></p-chip>
```

**Our Chip Select Pattern:**

```html
<div class="flex gap-3 overflow-auto align-items-center">
  @for (option of visibleOptions; track option.id) {
    <p-chip
      [styleClass]="selectedOptions[option.id]
        ? 'chip-select-item bg-primary-100 text-primary border-primary-500'
        : 'chip-select-item surface-200 border-300'"
      (click)="toggleOption(option)">

      <i *ngIf="option.icon" class="{{ option.icon }} text-sm ml-1"></i>
      <span class="mx-2">{{ option.label }}</span>
      <p-badge *ngIf="option.count" [value]="option.count" class="mx-1"></p-badge>
    </p-chip>
  }

  <!-- Show more button -->
  <p-chip *ngIf="options.length > visibleCount"
         styleClass="chip-select-item"
         (click)="popover.toggle($event)">
    <span class="mx-2">Show All</span>
    <i class="fa-solid fa-angle-down text-sm ml-1"></i>
  </p-chip>
</div>
```

### 12. Popover (p-popover)

```html
<p-button (click)="popover.toggle($event)" label="Show Options"></p-button>

<p-popover #popover [style]="{width: '300px'}">
  <div class="p-3">
    <h3>Options</h3>
    <p-divider></p-divider>
    <p class="cursor-pointer p-2 hover:surface-100" (click)="option1()">Option 1</p>
    <p class="cursor-pointer p-2 hover:surface-100" (click)="option2()">Option 2</p>
    <p class="cursor-pointer p-2 hover:surface-100" (click)="option3()">Option 3</p>
  </div>
</p-popover>
```

### 13. Sidebar/Drawer (p-drawer)

```html
<p-button (click)="visible = true" label="Open Sidebar"></p-button>

<p-drawer [(visible)]="visible"
         [position]="'right'"
         [blockScroll]="true"
         [styleClass]="'layout-rightmenu p-sidebar-sm'">

  <ng-template #header>
    <span class="font-semibold text-xl">Sidebar Title</span>
  </ng-template>

  <div class="p-3">
    <!-- Sidebar content -->
  </div>
</p-drawer>
```

**Our App Right Menu Pattern:**

```html
<p-drawer [(visible)]="appMain.rightMenuActive"
         [position]="app.isRTL ? 'left' : 'right'"
         [blockScroll]="true"
         [styleClass]="'layout-rightmenu p-sidebar-sm fs-small py-4 px-3'">

  <div class="flex flex-column gap-3">
    <p-button variant="text"
             styleClass="w-full justify-content-start"
             (onClick)="openAction1()">
      <i class="fa-regular fa-link mr-2"></i>
      <span>Action 1</span>
    </p-button>

    <p-button variant="text"
             styleClass="w-full justify-content-start"
             (onClick)="openAction2()">
      <i class="fa-regular fa-ticket mr-2"></i>
      <span>Action 2</span>
    </p-button>
  </div>
</p-drawer>
```

---

## PrimeNG v20 Component Reference

This section provides comprehensive examples for all commonly used PrimeNG v20 components with updated syntax that must be followed.

### Input Components (v20 Syntax)

#### 1. InputText (p-inputText)

**Module Import:**
```typescript
import { InputTextModule } from 'primeng/inputtext';
```

**Basic Usage:**
```html
<!-- Basic input -->
<input type="text" pInputText placeholder="Enter text" />

<!-- With FormControl -->
<input type="text" pInputText formControlName="username" />

<!-- With ngModel -->
<input type="text" pInputText [(ngModel)]="value" />

<!-- Disabled -->
<input type="text" pInputText [disabled]="true" value="Disabled" />

<!-- With validation classes -->
<input type="text"
       pInputText
       formControlName="email"
       [class.ng-invalid]="form.get('email')?.invalid && form.get('email')?.touched" />
```

**Full Width Input:**
```html
<div class="p-fluid">
  <label for="fullwidth">Full Width</label>
  <input id="fullwidth" type="text" pInputText placeholder="Full width input" />
</div>
```

**Input Group:**
```html
<div class="p-inputgroup">
  <span class="p-inputgroup-addon">
    <i class="fa-regular fa-user"></i>
  </span>
  <input type="text" pInputText placeholder="Username" />
</div>

<div class="p-inputgroup">
  <span class="p-inputgroup-addon">https://</span>
  <input type="text" pInputText placeholder="Website" />
  <span class="p-inputgroup-addon">.com</span>
</div>

<div class="p-inputgroup">
  <input type="text" pInputText placeholder="Price" />
  <span class="p-inputgroup-addon">€</span>
</div>
```

#### 2. InputNumber (p-inputNumber)

**Module Import:**
```typescript
import { InputNumberModule } from 'primeng/inputnumber';
```

**Basic Usage:**
```html
<!-- Basic number input -->
<p-inputNumber [(ngModel)]="value"></p-inputNumber>

<!-- With min/max -->
<p-inputNumber [(ngModel)]="value"
               [min]="0"
               [max]="100"></p-inputNumber>

<!-- Decimal -->
<p-inputNumber [(ngModel)]="value"
               [minFractionDigits]="2"
               [maxFractionDigits]="2"></p-inputNumber>

<!-- Currency -->
<p-inputNumber [(ngModel)]="price"
               mode="currency"
               currency="EUR"
               locale="de-DE"></p-inputNumber>

<!-- Percentage -->
<p-inputNumber [(ngModel)]="percentage"
               [suffix]="' %'"
               [min]="0"
               [max]="100"></p-inputNumber>

<!-- With buttons -->
<p-inputNumber [(ngModel)]="value"
               [showButtons]="true"
               buttonLayout="horizontal"
               spinnerMode="horizontal"
               inputId="horizontal"
               decrementButtonClass="p-button-danger"
               incrementButtonClass="p-button-success"
               incrementButtonIcon="fa-solid fa-plus"
               decrementButtonIcon="fa-solid fa-minus"></p-inputNumber>

<!-- Vertical buttons -->
<p-inputNumber [(ngModel)]="value"
               [showButtons]="true"
               buttonLayout="vertical"
               spinnerMode="vertical"
               decrementButtonClass="p-button-secondary"
               incrementButtonClass="p-button-secondary"
               incrementButtonIcon="fa-solid fa-plus"
               decrementButtonIcon="fa-solid fa-minus"></p-inputNumber>
```

**With FormControl:**
```html
<p-inputNumber formControlName="quantity"
               [min]="1"
               [max]="999"
               [showButtons]="true"></p-inputNumber>
```

#### 3. Calendar / DatePicker (p-datePicker) - v20 Updated

**⚠️ IMPORTANT: In PrimeNG v20, `p-calendar` has been renamed to `p-datePicker`**

**Module Import:**
```typescript
import { DatePickerModule } from 'primeng/datepicker';
```

**Basic Usage:**
```html
<p-datePicker [(ngModel)]="date"></p-datePicker>
```

**Common Patterns:**
```html
<!-- Basic date picker -->
<p-datePicker [(ngModel)]="date"
              dateFormat="dd.mm.yy"></p-datePicker>

<!-- With icon -->
<p-datePicker [(ngModel)]="date"
              [showIcon]="true"
              iconDisplay="input"
              dateFormat="dd.mm.yy"></p-datePicker>

<!-- Min/Max dates -->
<p-datePicker [(ngModel)]="date"
              [minDate]="minDate"
              [maxDate]="maxDate"
              dateFormat="dd.mm.yy"></p-datePicker>

<!-- Month/Year picker -->
<p-datePicker [(ngModel)]="date"
              view="month"
              dateFormat="mm/yy"></p-datePicker>

<!-- Date range -->
<p-datePicker [(ngModel)]="dates"
              selectionMode="range"
              [readonlyInput]="true"
              dateFormat="dd.mm.yy"></p-datePicker>

<!-- Multiple dates -->
<p-datePicker [(ngModel)]="dates"
              selectionMode="multiple"
              [readonlyInput]="true"
              dateFormat="dd.mm.yy"></p-datePicker>

<!-- Inline -->
<p-datePicker [(ngModel)]="date"
              [inline]="true"
              dateFormat="dd.mm.yy"></p-datePicker>

<!-- Time picker -->
<p-datePicker [(ngModel)]="datetime"
              [showTime]="true"
              [hourFormat]="24"
              dateFormat="dd.mm.yy"></p-datePicker>

<!-- Disabled -->
<p-datePicker [(ngModel)]="date"
              [disabled]="true"
              dateFormat="dd.mm.yy"></p-datePicker>

<!-- Readonly input -->
<p-datePicker [(ngModel)]="date"
              [readonlyInput]="true"
              dateFormat="dd.mm.yy"></p-datePicker>
```

**With FormControl:**
```html
<p-datePicker formControlName="birthDate"
              [showIcon]="true"
              dateFormat="dd.mm.yy"
              placeholder="Select date"
              appendTo="body"></p-datePicker>
```

#### 4. Checkbox (p-checkbox)

**Module Import:**
```typescript
import { CheckboxModule } from 'primeng/checkbox';
```

**Basic Usage:**
```html
<!-- Binary checkbox -->
<p-checkbox [(ngModel)]="checked"
            [binary]="true"
            inputId="binary"></p-checkbox>
<label for="binary" class="ml-2">Accept terms</label>

<!-- Multiple checkboxes -->
<div class="flex flex-column gap-3">
  <div class="flex align-items-center">
    <p-checkbox [(ngModel)]="cities"
                name="city"
                value="New York"
                inputId="ny"></p-checkbox>
    <label for="ny" class="ml-2">New York</label>
  </div>
  <div class="flex align-items-center">
    <p-checkbox [(ngModel)]="cities"
                name="city"
                value="London"
                inputId="ldn"></p-checkbox>
    <label for="ldn" class="ml-2">London</label>
  </div>
  <div class="flex align-items-center">
    <p-checkbox [(ngModel)]="cities"
                name="city"
                value="Paris"
                inputId="prs"></p-checkbox>
    <label for="prs" class="ml-2">Paris</label>
  </div>
</div>

<!-- Disabled -->
<p-checkbox [(ngModel)]="checked"
            [binary]="true"
            [disabled]="true"
            inputId="disabled"></p-checkbox>

<!-- With FormControl -->
<p-checkbox formControlName="agree"
            [binary]="true"
            inputId="agree"></p-checkbox>
```

#### 5. RadioButton (p-radioButton)

**Module Import:**
```typescript
import { RadioButtonModule } from 'primeng/radiobutton';
```

**Basic Usage:**
```html
<!-- Radio button group -->
<div class="flex flex-column gap-3">
  <div class="flex align-items-center">
    <p-radioButton [(ngModel)]="selectedCategory"
                   name="category"
                   value="Technology"
                   inputId="tech"></p-radioButton>
    <label for="tech" class="ml-2">Technology</label>
  </div>
  <div class="flex align-items-center">
    <p-radioButton [(ngModel)]="selectedCategory"
                   name="category"
                   value="Sports"
                   inputId="sports"></p-radioButton>
    <label for="sports" class="ml-2">Sports</label>
  </div>
  <div class="flex align-items-center">
    <p-radioButton [(ngModel)]="selectedCategory"
                   name="category"
                   value="Entertainment"
                   inputId="ent"></p-radioButton>
    <label for="ent" class="ml-2">Entertainment</label>
  </div>
</div>

<!-- Disabled -->
<p-radioButton [(ngModel)]="selectedCategory"
               name="category"
               value="Technology"
               [disabled]="true"
               inputId="disabled"></p-radioButton>

<!-- With FormControl -->
<div class="flex flex-column gap-3" [formGroup]="form">
  <div class="flex align-items-center">
    <p-radioButton formControlName="paymentMethod"
                   value="credit"
                   inputId="credit"></p-radioButton>
    <label for="credit" class="ml-2">Credit Card</label>
  </div>
  <div class="flex align-items-center">
    <p-radioButton formControlName="paymentMethod"
                   value="debit"
                   inputId="debit"></p-radioButton>
    <label for="debit" class="ml-2">Debit Card</label>
  </div>
</div>
```

### Layout Components (v20 Syntax)

#### 6. Panel (p-panel)

**Module Import:**
```typescript
import { PanelModule } from 'primeng/panel';
```

**Basic Usage:**
```html
<!-- Basic panel -->
<p-panel header="Panel Header">
  <p>Panel content goes here</p>
</p-panel>

<!-- Toggleable panel -->
<p-panel header="Toggleable Panel" [toggleable]="true">
  <p>This panel can be collapsed</p>
</p-panel>

<!-- Collapsed by default -->
<p-panel header="Filters"
         [toggleable]="true"
         [collapsed]="true">
  <p>Filter content</p>
</p-panel>

<!-- Custom header -->
<p-panel>
  <ng-template #header>
    <div class="flex align-items-center gap-2">
      <i class="fa-regular fa-calendar"></i>
      <span class="font-bold">Custom Header</span>
    </div>
  </ng-template>
  <p>Content with custom header</p>
</p-panel>

<!-- Custom footer -->
<p-panel header="Form Panel">
  <p>Form fields here</p>

  <ng-template #footer>
    <div class="flex gap-2">
      <p-button label="Save" icon="fa-solid fa-check"></p-button>
      <p-button label="Cancel"
                icon="fa-solid fa-times"
                styleClass="p-button-outlined"></p-button>
    </div>
  </ng-template>
</p-panel>

<!-- With icons -->
<p-panel header="Panel with Icons" [toggleable]="true">
  <ng-template #icons>
    <button pButton
            icon="fa-regular fa-cog"
            class="p-panel-header-icon"
            (click)="openSettings()"></button>
    <button pButton
            icon="fa-regular fa-refresh"
            class="p-panel-header-icon"
            (click)="refresh()"></button>
  </ng-template>
  <p>Panel content</p>
</p-panel>
```

#### 7. Accordion (p-accordion)

**Module Import:**
```typescript
import { AccordionModule } from 'primeng/accordion';
```

**Basic Usage (v20 Syntax):**
```html
<!-- Basic accordion -->
<p-accordion>
  <p-accordionPanel header="Header 1">
    <p>Content 1</p>
  </p-accordionPanel>
  <p-accordionPanel header="Header 2">
    <p>Content 2</p>
  </p-accordionPanel>
  <p-accordionPanel header="Header 3">
    <p>Content 3</p>
  </p-accordionPanel>
</p-accordion>

<!-- Multiple panels open -->
<p-accordion [multiple]="true">
  <p-accordionPanel header="Header 1">
    <p>Content 1</p>
  </p-accordionPanel>
  <p-accordionPanel header="Header 2">
    <p>Content 2</p>
  </p-accordionPanel>
</p-accordion>

<!-- With active index -->
<p-accordion [activeIndex]="0">
  <p-accordionPanel header="Header 1">
    <p>Content 1 - Open by default</p>
  </p-accordionPanel>
  <p-accordionPanel header="Header 2">
    <p>Content 2</p>
  </p-accordionPanel>
</p-accordion>

<!-- Disabled panel -->
<p-accordion>
  <p-accordionPanel header="Active Panel">
    <p>Active content</p>
  </p-accordionPanel>
  <p-accordionPanel header="Disabled Panel" [disabled]="true">
    <p>This panel is disabled</p>
  </p-accordionPanel>
</p-accordion>

<!-- Custom header template -->
<p-accordion>
  <p-accordionPanel>
    <p-accordion-header>
      <div class="flex align-items-center gap-2">
        <i class="fa-regular fa-user"></i>
        <span class="font-bold">User Information</span>
        <p-badge value="2" severity="info"></p-badge>
      </div>
    </p-accordion-header>
    <p-accordion-content>
    <p>User content here</p>
    </p-accordion-content>
  </p-accordionPanel>
</p-accordion>
```

#### 8. Tabs (p-tabs) - v20 Updated

**⚠️ IMPORTANT: In PrimeNG v20, `p-tabView` and `p-tabPanel` have been renamed to `p-tabs` and `p-tabPanel`**

**Module Import:**
```typescript
import { TabsModule } from 'primeng/tabs';
```

**Basic Usage:**
```html
<p-tabs value="0">
  <p-tablist>
    <p-tab value="0">Tab 1</p-tab>
    <p-tab value="1">Tab 2</p-tab>
    <p-tab value="2">Tab 3</p-tab>
  </p-tablist>
  <p-tabpanels>
    <p-tabpanel value="0">
      <p>Tab 1 Content</p>
    </p-tabpanel>
    <p-tabpanel value="1">
      <p>Tab 2 Content</p>
    </p-tabpanel>
    <p-tabpanel value="2">
      <p>Tab 3 Content</p>
    </p-tabpanel>
  </p-tabpanels>
</p-tabs>

<!-- With active index binding -->
<p-tabs [(value)]="activeTab">
  <p-tablist>
    <p-tab value="0">Overview</p-tab>
    <p-tab value="1">Details</p-tab>
    <p-tab value="2">Settings</p-tab>
  </p-tablist>
  <p-tabpanels>
    <p-tabpanel value="0">
      <p>Overview content</p>
    </p-tabpanel>
    <p-tabpanel value="1">
      <p>Details content</p>
    </p-tabpanel>
    <p-tabpanel value="2">
      <p>Settings content</p>
    </p-tabpanel>
  </p-tabpanels>
</p-tabs>

<!-- Scrollable tabs -->
<p-tabs value="0" [scrollable]="true">
  <p-tablist>
    <p-tab value="0">Tab 1</p-tab>
    <p-tab value="1">Tab 2</p-tab>
    <p-tab value="2">Tab 3</p-tab>
    <p-tab value="3">Tab 4</p-tab>
    <p-tab value="4">Tab 5</p-tab>
  </p-tablist>
  <p-tabpanels>
    <p-tabpanel value="0"><p>Content 1</p></p-tabpanel>
    <p-tabpanel value="1"><p>Content 2</p></p-tabpanel>
    <p-tabpanel value="2"><p>Content 3</p></p-tabpanel>
    <p-tabpanel value="3"><p>Content 4</p></p-tabpanel>
    <p-tabpanel value="4"><p>Content 5</p></p-tabpanel>
  </p-tabpanels>
</p-tabs>

<!-- With icons -->
<p-tabs value="0">
  <p-tablist>
    <p-tab value="0">
      <i class="fa-regular fa-home mr-2"></i>
      Home
    </p-tab>
    <p-tab value="1">
      <i class="fa-regular fa-user mr-2"></i>
      Profile
    </p-tab>
    <p-tab value="2">
      <i class="fa-regular fa-cog mr-2"></i>
      Settings
    </p-tab>
  </p-tablist>
  <p-tabpanels>
    <p-tabpanel value="0"><p>Home content</p></p-tabpanel>
    <p-tabpanel value="1"><p>Profile content</p></p-tabpanel>
    <p-tabpanel value="2"><p>Settings content</p></p-tabpanel>
  </p-tabpanels>
</p-tabs>

<!-- Disabled tab -->
<p-tabs value="0">
  <p-tablist>
    <p-tab value="0">Active Tab</p-tab>
    <p-tab value="1" [disabled]="true">Disabled Tab</p-tab>
    <p-tab value="2">Another Tab</p-tab>
  </p-tablist>
  <p-tabpanels>
    <p-tabpanel value="0"><p>Active content</p></p-tabpanel>
    <p-tabpanel value="1"><p>Disabled content</p></p-tabpanel>
    <p-tabpanel value="2"><p>Another content</p></p-tabpanel>
  </p-tabpanels>
</p-tabs>
```

**Component TypeScript:**
```typescript
export class MyComponent {
  activeTab: string = '0';

  onTabChange(event: any): void {
    console.log('Active tab:', event.index);
  }
}
```

### Overlay Components (v20 Syntax)

#### 9. Popover (p-popover)

**Module Import:**
```typescript
import { PopoverModule } from 'primeng/popover';
```

**Basic Usage:**
```html
<!-- Basic popover -->
<p-button (click)="popover.toggle($event)" label="Show Popover"></p-button>

<p-popover #popover>
  <div class="p-3">
    <p>Popover content goes here</p>
  </div>
</p-popover>

<!-- With custom width -->
<p-button (click)="menu.toggle($event)" label="Options"></p-button>

<p-popover #menu [style]="{width: '300px'}">
  <div class="flex flex-column gap-2 p-3">
    <p-button label="Option 1"
              styleClass="p-button-text w-full justify-content-start"
              (onClick)="menu.hide()"></p-button>
    <p-button label="Option 2"
              styleClass="p-button-text w-full justify-content-start"
              (onClick)="menu.hide()"></p-button>
    <p-button label="Option 3"
              styleClass="p-button-text w-full justify-content-start"
              (onClick)="menu.hide()"></p-button>
  </div>
</p-popover>

<!-- Date picker helper popover (from our pattern) -->
<p-button (click)="dateHelpers.toggle($event)"
          icon="fa-regular fa-calendar"
          styleClass="p-button-outlined"></p-button>

<p-popover #dateHelpers [style]="{width: '250px'}">
  <div class="flex flex-column gap-2 p-3">
    <p class="cursor-pointer hover:surface-100 p-2" (click)="setToday(); dateHelpers.hide()">
      Today
    </p>
    <p class="cursor-pointer hover:surface-100 p-2" (click)="setTomorrow(); dateHelpers.hide()">
      Tomorrow
    </p>
    <p class="cursor-pointer hover:surface-100 p-2" (click)="setNextWeek(); dateHelpers.hide()">
      Next Week
    </p>
  </div>
</p-popover>
```

### Feedback Components (v20 Syntax)

#### 10. Message (p-message)

**Module Import:**
```typescript
import { MessageModule } from 'primeng/message';
```

**Basic Usage:**
```html
<!-- Info message -->
<p-message severity="info"
           text="This is an information message"></p-message>

<!-- Success message -->
<p-message severity="success"
           text="Operation completed successfully"></p-message>

<!-- Warning message -->
<p-message severity="warn"
           text="Please review your input"></p-message>

<!-- Error message -->
<p-message severity="error"
           text="An error occurred"></p-message>

<!-- With summary -->
<p-message severity="info"
           summary="Info"
           text="This is an information message with summary"></p-message>

<!-- Closable -->
<p-message severity="warn"
           text="This message can be closed"
           [closable]="true"></p-message>

<!-- Multiple messages -->
<div class="flex flex-column gap-2">
  <p-message severity="success" text="Item saved successfully"></p-message>
  <p-message severity="info" text="Don't forget to submit"></p-message>
</div>

<!-- Inline with form field -->
<div class="field">
  <label for="email">Email</label>
  <input id="email" type="email" pInputText formControlName="email" />
  <p-message *ngIf="form.get('email')?.invalid && form.get('email')?.touched"
             severity="error"
             text="Please enter a valid email"></p-message>
</div>
```

#### 11. Spinner / Progress Spinner (p-progressSpinner) - v20

**⚠️ IMPORTANT: Use `p-progressSpinner` (not `p-spinner`)**

**Module Import:**
```typescript
import { ProgressSpinnerModule } from 'primeng/progressspinner';
```

**Basic Usage:**
```html
<!-- Basic spinner -->
<p-progressSpinner *ngIf="loading"></p-progressSpinner>

<!-- Custom size -->
<p-progressSpinner [style]="{width: '50px', height: '50px'}"
                  *ngIf="loading"></p-progressSpinner>

<!-- Custom stroke width -->
<p-progressSpinner strokeWidth="8"
                  *ngIf="loading"></p-progressSpinner>

<!-- Custom colors -->
<p-progressSpinner [style]="{width: '50px', height: '50px'}"
                  strokeWidth="4"
                  fill="var(--surface-ground)"
                  animationDuration="1s"
                  *ngIf="loading"></p-progressSpinner>

<!-- Centered on page -->
<div class="flex justify-content-center align-items-center"
     style="min-height: 200px"
     *ngIf="loading">
  <p-progressSpinner></p-progressSpinner>
</div>

<!-- Overlay spinner -->
<div class="spinner-overlay" *ngIf="busy">
  <p-progressSpinner></p-progressSpinner>
</div>
```

**Overlay Spinner CSS:**
```scss
.spinner-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
```

#### 12. Skeleton (p-skeleton)

**Module Import:**
```typescript
import { SkeletonModule } from 'primeng/skeleton';
```

**Basic Usage:**
```html
<!-- Rectangle skeleton -->
<p-skeleton width="100%" height="2rem"></p-skeleton>

<!-- Circle skeleton -->
<p-skeleton shape="circle" size="4rem"></p-skeleton>

<!-- Multiple skeletons for card -->
<div class="p-card">
  <div class="flex mb-3">
    <p-skeleton shape="circle" size="4rem" styleClass="mr-2"></p-skeleton>
    <div style="flex: 1">
      <p-skeleton width="100%" styleClass="mb-2"></p-skeleton>
      <p-skeleton width="75%"></p-skeleton>
    </div>
  </div>
  <p-skeleton width="100%" height="150px"></p-skeleton>
  <div class="flex justify-content-between mt-3">
    <p-skeleton width="4rem" height="2rem"></p-skeleton>
    <p-skeleton width="4rem" height="2rem"></p-skeleton>
  </div>
</div>

<!-- Table skeleton -->
<div class="p-card">
  <p-skeleton width="100%" height="2rem" styleClass="mb-2"></p-skeleton>
  <p-skeleton width="100%" height="2rem" styleClass="mb-2"></p-skeleton>
  <p-skeleton width="100%" height="2rem" styleClass="mb-2"></p-skeleton>
  <p-skeleton width="100%" height="2rem" styleClass="mb-2"></p-skeleton>
  <p-skeleton width="100%" height="2rem"></p-skeleton>
</div>

<!-- List skeleton -->
<ul class="list-none p-0 m-0">
  <li class="mb-3" *ngFor="let i of [1,2,3,4,5]">
    <div class="flex">
      <p-skeleton shape="circle" size="3rem" styleClass="mr-2"></p-skeleton>
      <div style="flex: 1">
        <p-skeleton width="100%" styleClass="mb-2"></p-skeleton>
        <p-skeleton width="75%"></p-skeleton>
      </div>
    </div>
  </li>
</ul>

<!-- DataTable skeleton -->
<div class="p-card">
  <div class="flex justify-content-between mb-3">
    <p-skeleton width="10rem" height="3rem"></p-skeleton>
    <p-skeleton width="8rem" height="3rem"></p-skeleton>
  </div>
  <p-skeleton width="100%" height="500px"></p-skeleton>
  <div class="flex justify-content-between mt-3">
    <p-skeleton width="10rem" height="2rem"></p-skeleton>
    <p-skeleton width="10rem" height="2rem"></p-skeleton>
  </div>
</div>

<!-- With animation control -->
<p-skeleton width="100%" height="2rem" animation="none"></p-skeleton>
<p-skeleton width="100%" height="2rem" animation="wave"></p-skeleton>
```

**Conditional Rendering Pattern:**
```html
<ng-container *ngIf="!loading; else skeleton">
  <!-- Actual content -->
  <div class="p-card">
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
  </div>
</ng-container>

<ng-template #skeleton>
  <!-- Skeleton placeholder -->
  <div class="p-card">
    <p-skeleton width="200px" height="2rem" styleClass="mb-3"></p-skeleton>
    <p-skeleton width="100%" height="1rem" styleClass="mb-2"></p-skeleton>
    <p-skeleton width="100%" height="1rem" styleClass="mb-2"></p-skeleton>
    <p-skeleton width="75%" height="1rem"></p-skeleton>
  </div>
</ng-template>
```

#### 13. chip (p-chip)

**Module Import:**
```typescript
import { ChipModule } from 'primeng/chip';
```

```html
<p-chip label="Technology"></p-chip>
<p-chip label="Sports" icon="fa-regular fa-star"></p-chip>
<p-chip label="Remove" [removable]="true"></p-chip>
```

#### 14. table (p-table)

**Module Import:**
```typescript
import { TableModule } from 'primeng/table';
```
```html
<p-table [value]="users">
  <ng-template pTemplate="header">
    <tr>
      <th>Name</th>
      <th>Email</th>
    </tr>
  </ng-template>

  <ng-template pTemplate="body" let-user>
    <tr>
      <td>{{ user.name }}</td>
      <td>{{ user.email }}</td>
    </tr>
  </ng-template>
</p-table>
```

#### 15. button (p-button)

**Module Import:**
```typescript
import { ButtonModule } from 'primeng/button';
```
```html
<p-button label="Save"></p-button>
<p-button label="Delete" severity="danger"></p-button>
<p-button icon="fa-solid fa-check" label="Confirm"></p-button>
```

#### 16. dialog (p-dialog)

**Module Import:**
```typescript
import { DialogModule } from 'primeng/dialog';
```
```html
<p-dialog header="User Details" [(visible)]="visible" modal="true">
  <p>This is dialog content</p>
</p-dialog>
```

#### 17. select (p-select)

**Module Import:**
```typescript
import { SelectModule } from 'primeng/select';
```
```html
<p-select
  [options]="cities"
  optionLabel="name"
  placeholder="Select City"
  [(ngModel)]="selectedCity">
</p-select>
```

#### 18. multiSelect (p-multiSelect)

**Module Import:**
```typescript
import { MultiSelectModule } from 'primeng/multiselect';
```
```html
<p-multiSelect
  [options]="skills"
  optionLabel="name"
  placeholder="Select Skills"
  [(ngModel)]="selectedSkills">
</p-multiSelect>
```

#### 19. badge (p-badge)

**Module Import:**
```typescript
import { BadgeModule } from 'primeng/badge';
```
```html
<p-badge value="New" severity="success"></p-badge>
```

#### 20. avatar (p-avatar)

**Module Import:**
```typescript
import { AvatarModule } from 'primeng/avatar';
```
```html
<p-avatar label="A"></p-avatar>
<p-avatar icon="fa-regular fa-user"></p-avatar>
<p-avatar image="https://primefaces.org/cdn/primeng/images/demo/avatar/amyelsner.png"></p-avatar>
```

---

## Form Integration Patterns

### MvsFormField Architecture

Our application wraps PrimeNG form components in a standardized `MvsFormField` pattern:

```
MvsFormFieldBaseComponent (Abstract base)
├── MvsFormFieldSelectDropdownComponent → p-select
├── MvsFormFieldDatePickerComponent → p-datePicker
├── MvsFormFieldTextFieldComponent → p-inputText
├── MvsFormFieldNumberComponent → p-inputNumber
├── MvsFormFieldTextAreaComponent → p-inputTextarea
├── MvsFormFieldCheckboxComponent → p-checkbox
├── MvsFormFieldMultiSelectComponent → p-multiselect
└── MvsFormFieldTreeSelectComponent → p-treeselect
```

### Base Component Structure

```typescript
// mvs-form-field-base.component.ts
export abstract class MvsFormFieldBaseComponent implements OnInit, OnChanges, OnDestroy {
  @Input() formGroup: FormGroup;
  @Input() formField: MvsFormFieldDto;
  @Input() readOnly: boolean = false;
  @Input() disabled: boolean = false;

  @Output() fieldChange = new EventEmitter<any>();
  @Output() componentDirty = new EventEmitter<boolean>();

  hasChanged: boolean = false;
  initialized: boolean = false;

  ngOnInit(): void {
    this.initComponent();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) return;
    this.refreshComponent();
  }

  abstract initComponent(): void;
  abstract refreshComponent(): void;

  handleFieldChange(event: any): void {
    this.hasChanged = true;
    this.fieldChange.emit(event);
    this.componentDirty.emit(true);
  }

  ngOnDestroy(): void {
    // Cleanup
  }
}
```

### Example Wrapper: Select Dropdown

```typescript
// mvs-form-field-select-dropdown.component.ts
@Component({
  selector: 'mvs-form-field-select',
  template: `
    <div [formGroup]="formGroup">
      <label [for]="formField.id" *ngIf="formField.label">
        {{ formField.label }}
        <span *ngIf="formField.required" class="text-red-500">*</span>
      </label>

      <p-select
        #dropdownField
        (onChange)="handleFieldChange($event)"
        [filter]="!readOnly"
        [autofocusFilter]="true"
        [formControlName]="formField.id"
        [inputId]="formField.id"
        [options]="entries"
        [readonly]="readOnly || disabled"
        [showClear]="!readOnly && !formField.required"
        [class.ng-invalid]="isInvalid()"
        [styleClass]="getFieldStyleClass()"
        filterBy="label"
        optionLabel="label"
        optionValue="key"
        [placeholder]="formField.placeholder || 'auswählen'"
        appendTo="body">
      </p-select>

      <small *ngIf="isInvalid() && formGroup.controls[formField.id]?.touched"
            class="text-red-500">
        {{ getErrorMessage() }}
      </small>
    </div>
  `,
  standalone: false
})
export class MvsFormFieldSelectDropdownComponent extends MvsFormFieldBaseComponent {
  @ViewChild('dropdownField') dropdownField!: Select;

  entries: MvsFormValueListEntryDto[] = [];

  initComponent(): void {
    this.loadOptions();
    this.initialized = true;
  }

  refreshComponent(): void {
    this.loadOptions();
  }

  loadOptions(): void {
    if (this.formField.valueListId) {
      this.valueListService.getValueList(this.formField.valueListId).subscribe({
        next: (entries) => {
          this.entries = entries;
        },
        error: (error) => {
          console.error('Failed to load options', error);
        }
      });
    }
  }

  getFieldStyleClass(): string {
    let classes = 'w-full';
    if (this.disabled || this.readOnly) {
      classes += ' custom-field-disabled';
    }
    if (this.hasChanged) {
      classes += ' change-indicator-border';
    }
    return classes;
  }

  isInvalid(): boolean {
    const control = this.formGroup.controls[this.formField.id];
    return control?.invalid && control?.touched;
  }

  getErrorMessage(): string {
    const control = this.formGroup.controls[this.formField.id];
    if (control?.errors?.['required']) {
      return 'This field is required';
    }
    // ... other validations
    return 'Invalid value';
  }
}
```

### Usage in Forms

```typescript
// customer-form.component.ts
export class CustomerFormComponent extends MvsFormComponent {
  formDto: MvsFormDto;
  formGroup: FormGroup;

  ngOnInit(): void {
    this.buildForm();
  }

  buildForm(): void {
    this.formDto = {
      fields: [
        {
          id: 'name',
          label: 'Customer Name',
          type: 'text',
          required: true,
          placeholder: 'Enter name'
        },
        {
          id: 'status',
          label: 'Status',
          type: 'dropdown',
          valueListId: 'customer-status',
          required: true
        },
        {
          id: 'birthDate',
          label: 'Birth Date',
          type: 'date',
          required: false
        }
      ]
    };

    this.formGroup = this.buildFormGroup(this.formDto);
  }

  buildFormGroup(formDto: MvsFormDto): FormGroup {
    const group: any = {};

    for (const field of formDto.fields) {
      const validators = [];
      if (field.required) {
        validators.push(Validators.required);
      }
      group[field.id] = new FormControl(null, validators);
    }

    return new FormGroup(group);
  }

  save(): void {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill all required fields'
      });
      return;
    }

    const formData = this.formGroup.value;
    this.customerService.save(formData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Customer saved successfully'
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save customer'
        });
      }
    });
  }
}
```

```html
<!-- customer-form.component.html -->
<form [formGroup]="formGroup" (ngSubmit)="save()">
  <div class="grid p-fluid">
    <ng-container *ngFor="let field of formDto.fields">
      <div class="col-12 md:col-6">
        <!-- Dynamic field rendering -->
        <mvs-form-field-text *ngIf="field.type === 'text'"
                            [formGroup]="formGroup"
                            [formField]="field"
                            [readOnly]="readOnly"
                            (fieldChange)="onFieldChange($event)">
        </mvs-form-field-text>

        <mvs-form-field-select *ngIf="field.type === 'dropdown'"
                              [formGroup]="formGroup"
                              [formField]="field"
                              [readOnly]="readOnly"
                              (fieldChange)="onFieldChange($event)">
        </mvs-form-field-select>

        <mvs-form-field-date-picker *ngIf="field.type === 'date'"
                                   [formGroup]="formGroup"
                                   [formField]="field"
                                   [readOnly]="readOnly"
                                   (fieldChange)="onFieldChange($event)">
        </mvs-form-field-date-picker>
      </div>
    </ng-container>
  </div>

  <div class="flex gap-2 mt-4">
    <p-button type="submit"
             label="Save"
             icon="fa-solid fa-check"
             [loading]="busy"></p-button>
    <p-button type="button"
             label="Cancel"
             icon="fa-solid fa-times"
             styleClass="p-button-outlined"
             (click)="cancel()"></p-button>
  </div>
</form>
```

---

## Service Integration

### MessageService Wrapper

```typescript
// mvs-message.service.ts
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class MvsMessageService {

  constructor(private messageService: MessageService) {}

  showSuccess(detail: string, summary: string = 'Success'): void {
    this.messageService.add({
      severity: 'success',
      summary,
      detail,
      life: 3000
    });
  }

  showError(detail: string, summary: string = 'Error'): void {
    this.messageService.add({
      severity: 'error',
      summary,
      detail,
      life: 5000
    });
  }

  showWarning(detail: string, summary: string = 'Warning'): void {
    this.messageService.add({
      severity: 'warn',
      summary,
      detail,
      life: 4000
    });
  }

  showInfo(detail: string, summary: string = 'Info'): void {
    this.messageService.add({
      severity: 'info',
      summary,
      detail,
      life: 3000
    });
  }

  showSuccessMessage(summary: string, detail: string): void {
    this.showSuccess(detail, summary);
  }

  showErrorMessage(summary: string, detail: string): void {
    this.showError(detail, summary);
  }

  clear(): void {
    this.messageService.clear();
  }
}
```

### ConfirmationService Integration

```typescript
// mvs-navigation.service.ts (excerpt)
export class MvsObjectNavigationService {

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  navigateAway(targetRoute: string, component: any): void {
    if (component.isDirty) {
      this.confirmationService.confirm({
        message: 'You have unsaved changes. Do you want to save before leaving?',
        header: 'Unsaved Changes',
        icon: 'fa-regular fa-triangle-exclamation',
        acceptLabel: 'Save',
        rejectLabel: 'Discard',
        accept: () => {
          component.save().subscribe(() => {
            this.router.navigate([targetRoute]);
          });
        },
        reject: () => {
          this.router.navigate([targetRoute]);
        }
      });
    } else {
      this.router.navigate([targetRoute]);
    }
  }
}
```

---

## Widget System Integration

### Widget with PrimeNG Components

```typescript
// widget.component.ts
export class WidgetComponent implements OnInit {
  @Input() widgetConfig: WidgetConfig;

  displayType: 'table' | 'list' | 'card' | 'chart';
  data: any[];

  ngOnInit(): void {
    this.loadWidgetData();
  }

  loadWidgetData(): void {
    this.widgetService.getData(this.widgetConfig).subscribe({
      next: (data) => {
        this.data = data;
      }
    });
  }
}
```

```html
<!-- widget.component.html -->
<p-panel [header]="widgetConfig.title" [toggleable]="true">
  <!-- Table Display -->
  <p-table *ngIf="displayType === 'table'"
          [value]="data"
          [paginator]="true"
          [rows]="10">
    <ng-template pTemplate="header">
      <tr>
        <th *ngFor="let col of widgetConfig.columns">{{ col.label }}</th>
      </tr>
    </ng-template>
    <ng-template pTemplate="body" let-item>
      <tr>
        <td *ngFor="let col of widgetConfig.columns">{{ item[col.field] }}</td>
      </tr>
    </ng-template>
  </p-table>

  <!-- Card Display -->
  <div *ngIf="displayType === 'card'" class="grid">
    <div *ngFor="let item of data" class="col-12 md:col-6 lg:col-4">
      <p-card [header]="item.title">
        <p>{{ item.description }}</p>
      </p-card>
    </div>
  </div>

  <!-- Chart Display -->
  <p-chart *ngIf="displayType === 'chart'"
          [type]="widgetConfig.chartType"
          [data]="chartData"></p-chart>
</p-panel>
```

---

## Base Class Integration

### PageComponent with PrimeNG

```typescript
// customer-overview.page.ts
export class CustomerOverviewPage extends PageComponent implements OnInit {

  customers: Customer[] = [];
  busy: boolean = false;

  constructor(
    private customerService: CustomerService,
    private messageService: MvsMessageService
  ) {
    super();
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.initComponent();
  }

  initComponent(): void {
    this.loadCustomers();
    this.initialized = true;
  }

  loadCustomers(): void {
    this.busy = true;
    this.customerService.list().subscribe({
      next: (customers) => {
        this.customers = customers;
        this.busy = false;
      },
      error: (error) => {
        this.messageService.showError('Failed to load customers');
        this.busy = false;
      }
    });
  }
}
```

```html
<!-- customer-overview.page.html -->
<div class="page-container">
  <p-toolbar>
    <ng-template pTemplate="left">
      <h2 class="m-0">Customers</h2>
    </ng-template>
    <ng-template pTemplate="right">
      <p-button label="New Customer"
               icon="fa-solid fa-plus"
               (onClick)="createCustomer()"></p-button>
    </ng-template>
  </p-toolbar>

  <p-table [value]="customers"
          [loading]="busy"
          [paginator]="true"
          [rows]="25"
          styleClass="mt-3">
    <!-- Table content -->
  </p-table>
</div>
```

---

## Styling Guidelines

### 1. CSS Class Priority

**Prefer (in order):**

1. **PrimeNG Built-in Classes:** `p-button-outlined`, `p-datatable-gridlines`
2. **PrimeFlex Utilities:** `flex`, `justify-content-between`, `p-3`, `mb-2`
3. **Tailwind Utilities:** `bg-primary-100`, `text-sm`
4. **Component SCSS:** Only when absolutely necessary

### 2. PrimeFlex Layout Classes

**Flexbox:**

```html
<div class="flex justify-content-between align-items-center gap-3">
  <div>Left</div>
  <div>Right</div>
</div>
```

**Grid:**

```html
<div class="grid">
  <div class="col-12 md:col-6 lg:col-4">Column 1</div>
  <div class="col-12 md:col-6 lg:col-4">Column 2</div>
  <div class="col-12 md:col-6 lg:col-4">Column 3</div>
</div>
```

**Spacing:**

```html
<div class="p-3 m-2 mt-4 mb-0">
  <!-- p-3 = padding 1rem -->
  <!-- m-2 = margin 0.5rem -->
  <!-- mt-4 = margin-top 1.5rem -->
  <!-- mb-0 = margin-bottom 0 -->
</div>
```

### 3. Responsive Design

```html
<!-- Hide on mobile, show on desktop -->
<div class="hidden md:flex">Desktop only</div>

<!-- Show on mobile, hide on desktop -->
<div class="flex md:hidden">Mobile only</div>

<!-- Responsive columns -->
<div class="grid">
  <div class="col-12 md:col-6 lg:col-3">
    Responsive column
  </div>
</div>
```

### 4. Component Style Classes

```html
<!-- Button styles -->
<p-button styleClass="p-button-outlined p-button-success"></p-button>

<!-- Table styles -->
<p-table styleClass="p-datatable-gridlines p-datatable-striped"></p-table>

<!-- Dialog styles -->
<p-dialog styleClass="custom-dialog"></p-dialog>
```

### 5. Custom SCSS (When Necessary)

```scss
// customer-overview.page.scss
.page-container {
  padding: 1.5rem;
  background-color: var(--surface-0);

  .custom-toolbar {
    border-radius: 0.5rem;
    background: var(--surface-50);
    margin-bottom: 1rem;
  }
}
```

---

## Common Patterns

### 1. CRUD Page Pattern

```typescript
export class EntityCRUDPage extends PageComponent {
  entities: Entity[] = [];
  selectedEntity: Entity | null = null;
  displayDialog: boolean = false;
  isEditMode: boolean = false;
  busy: boolean = false;

  constructor(
    private entityService: EntityService,
    private messageService: MvsMessageService,
    private confirmationService: ConfirmationService
  ) {
    super();
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.loadEntities();
  }

  loadEntities(): void {
    this.busy = true;
    this.entityService.list().subscribe({
      next: (entities) => {
        this.entities = entities;
        this.busy = false;
      },
      error: () => {
        this.messageService.showError('Failed to load data');
        this.busy = false;
      }
    });
  }

  openCreateDialog(): void {
    this.selectedEntity = this.getEmptyEntity();
    this.isEditMode = false;
    this.displayDialog = true;
  }

  openEditDialog(entity: Entity): void {
    this.selectedEntity = { ...entity };
    this.isEditMode = true;
    this.displayDialog = true;
  }

  save(): void {
    if (!this.selectedEntity) return;

    this.busy = true;
    const operation = this.isEditMode
      ? this.entityService.update(this.selectedEntity)
      : this.entityService.create(this.selectedEntity);

    operation.subscribe({
      next: () => {
        this.messageService.showSuccess(
          this.isEditMode ? 'Updated successfully' : 'Created successfully'
        );
        this.loadEntities();
        this.closeDialog();
        this.busy = false;
      },
      error: () => {
        this.messageService.showError('Operation failed');
        this.busy = false;
      }
    });
  }

  confirmDelete(entity: Entity): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this item?',
      header: 'Confirm Delete',
      icon: 'fa-regular fa-triangle-exclamation',
      accept: () => {
        this.delete(entity);
      }
    });
  }

  delete(entity: Entity): void {
    this.busy = true;
    this.entityService.delete(entity.id).subscribe({
      next: () => {
        this.messageService.showSuccess('Deleted successfully');
        this.loadEntities();
        this.busy = false;
      },
      error: () => {
        this.messageService.showError('Delete failed');
        this.busy = false;
      }
    });
  }

  closeDialog(): void {
    this.displayDialog = false;
    this.selectedEntity = null;
  }

  getEmptyEntity(): Entity {
    return { /* empty object */ };
  }
}
```

```html
<div class="page-container">
  <p-toolbar>
    <ng-template pTemplate="left">
      <h2>Entities</h2>
    </ng-template>
    <ng-template pTemplate="right">
      <p-button label="New"
               icon="fa-solid fa-plus"
               (onClick)="openCreateDialog()"></p-button>
    </ng-template>
  </p-toolbar>

  <p-table [value]="entities"
          [loading]="busy"
          [paginator]="true"
          [rows]="25"
          styleClass="mt-3">
    <ng-template pTemplate="header">
      <tr>
        <th>Name</th>
        <th>Status</th>
        <th style="width: 100px">Actions</th>
      </tr>
    </ng-template>

    <ng-template pTemplate="body" let-entity>
      <tr>
        <td>{{ entity.name }}</td>
        <td>{{ entity.status }}</td>
        <td>
          <p-button icon="fa-regular fa-pencil"
                   styleClass="p-button-text p-button-icon-only"
                   (onClick)="openEditDialog(entity)"></p-button>
          <p-button icon="fa-regular fa-trash"
                   styleClass="p-button-text p-button-icon-only p-button-danger"
                   (onClick)="confirmDelete(entity)"></p-button>
        </td>
      </tr>
    </ng-template>
  </p-table>

  <p-dialog header="{{ isEditMode ? 'Edit' : 'Create' }} Entity"
           [(visible)]="displayDialog"
           [modal]="true"
           [style]="{width: '600px'}">

    <div class="p-fluid">
      <div class="field">
        <label for="name">Name</label>
        <input id="name" type="text" pInputText [(ngModel)]="selectedEntity.name" />
      </div>
    </div>

    <ng-template #footer>
      <p-button label="Cancel"
               icon="fa-solid fa-times"
               (onClick)="closeDialog()"
               styleClass="p-button-text"></p-button>
      <p-button label="Save"
               icon="fa-solid fa-check"
               [loading]="busy"
               (onClick)="save()"></p-button>
    </ng-template>
  </p-dialog>
</div>
```

### 2. Filter Panel Pattern

```html
<p-panel header="Filters" [toggleable]="true" [collapsed]="true">
  <div class="grid p-fluid">
    <div class="col-12 md:col-4">
      <label for="nameFilter">Name</label>
      <input id="nameFilter" type="text" pInputText [(ngModel)]="filters.name" />
    </div>

    <div class="col-12 md:col-4">
      <label for="statusFilter">Status</label>
      <p-select id="statusFilter"
               [(ngModel)]="filters.status"
               [options]="statusOptions"></p-select>
    </div>

    <div class="col-12 md:col-4">
      <label for="dateFilter">Date Range</label>
      <p-datePicker id="dateFilter"
                   [(ngModel)]="filters.dateRange"
                   selectionMode="range"></p-datePicker>
    </div>
  </div>

  <div class="flex gap-2 mt-3">
    <p-button label="Apply"
             icon="fa-solid fa-search"
             (onClick)="applyFilters()"></p-button>
    <p-button label="Clear"
             icon="fa-solid fa-times"
             styleClass="p-button-outlined"
             (onClick)="clearFilters()"></p-button>
  </div>
</p-panel>
```

### 3. Master-Detail Pattern

```html
<div class="grid">
  <!-- Master list -->
  <div class="col-12 lg:col-4">
    <p-table [value]="customers"
            [selection]="selectedCustomer"
            (onRowSelect)="onCustomerSelect($event)"
            selectionMode="single"
            styleClass="p-datatable-sm">
      <!-- Table content -->
    </p-table>
  </div>

  <!-- Detail panel -->
  <div class="col-12 lg:col-8">
    <p-panel header="Customer Details" *ngIf="selectedCustomer">
      <div class="grid p-fluid">
        <div class="col-12 md:col-6">
          <label>Name</label>
          <input type="text" pInputText [(ngModel)]="selectedCustomer.name" />
        </div>
        <!-- More fields -->
      </div>

      <div class="flex gap-2 mt-3">
        <p-button label="Save"
                 icon="fa-solid fa-check"
                 [loading]="busy"
                 (onClick)="saveCustomer()"></p-button>
      </div>
    </p-panel>

    <p-panel *ngIf="!selectedCustomer">
      <div class="text-center p-5">
        <i class="fa-solid fa-arrow-left" style="font-size: 3rem; color: var(--text-color-secondary);"></i>
        <p class="mt-3 text-color-secondary">Select a customer to view details</p>
      </div>
    </p-panel>
  </div>
</div>
```

---

## Best Practices

### 1. Module Imports

**Best Practices:**
- Import only the specific modules you need
- Use SharedModule for common PrimeNG modules
- Import feature-specific modules in feature modules
- Import from specific packages, not the entire library
- Centralize common imports to avoid duplication

### 2. Performance

✅ **Do:**
- Use lazy loading for tables with large datasets
- Use virtual scrolling for very long lists
- Implement OnPush change detection when possible
- Use `appendTo="body"` for dropdowns/dialogs to avoid overflow issues
- Use pagination for large datasets
- Implement virtual scrolling for rendering large lists efficiently
- Avoid nesting heavy components inside loops

### 3. Styling

**Best Practices:**
- Use theme tokens (CSS variables) for colors
- Use PrimeFlex for layout and spacing
- Override styles using component styleClass
- Scope custom SCSS to component
- Maintain consistency with the Klaus Preset theme

### 4. Accessibility

**Best Practices:**
- Provide labels for form fields
- Use semantic HTML
- Add ARIA attributes when needed
- Test keyboard navigation
- Ensure color contrast meets WCAG standards
- Maintain focus indicators
- Include text labels alongside icons
- Support screen readers

### 5. User Experience

**Best Practices:**
- Show loading indicators for async operations
- Provide feedback for user actions (toasts, confirmations)
- Handle empty states gracefully
- Implement proper error handling
- Add confirmation for destructive actions
- Provide clear error messages

### 6. Form Validation

**Best Practices:**
- Validate on both frontend and backend
- Show clear error messages
- Mark required fields
- Disable submit button when form is invalid
- Use Reactive Forms for complex forms
- Show validation errors after user interaction

---

## Troubleshooting

### Common Issues & Solutions

#### 1. Dropdown Options Not Showing

**Problem:** Dropdown menu is cut off or hidden

**Solution:** Add `appendTo="body"` to the dropdown

```html
<p-select [options]="items" appendTo="body"></p-select>
```

#### 2. Table Not Loading Data

**Problem:** Table shows "No data found" even when data exists

**Solution:** Ensure `[value]` binding is correct and data is an array

```html
<p-table [value]="customers">  <!-- Must be an array -->
```

#### 3. Dialog Not Closing

**Problem:** Dialog remains visible after setting `visible = false`

**Solution:** Use two-way binding `[(visible)]`

```html
<p-dialog [(visible)]="displayDialog">  <!-- Note the banana-in-a-box -->
```

#### 4. Date Picker Format Issues

**Problem:** Date displays in wrong format

**Solution:** Set `dateFormat` attribute

```html
<p-datePicker dateFormat="dd.mm.yy"></p-datePicker>  <!-- German format -->
```

#### 5. Theme Not Applied

**Problem:** Components don't use Klaus preset colors

**Solution:** Ensure `providePrimeNG` is in app.module providers

```typescript
// app.module.ts
providers: [providePrimeNG({ theme: { preset: KlausPreset } })]
```

#### 6. Toast Messages Not Appearing

**Problem:** MessageService.add() doesn't show toast

**Solution:**
1. Add `<p-toast></p-toast>` to app.component.html
2. Ensure MessageService is provided in root

```typescript
@Injectable({ providedIn: 'root' })
export class MvsMessageService {
  constructor(private messageService: MessageService) {}
}
```

#### 7. Icons Not Showing

**Problem:** PrimeIcons or FontAwesome icons not rendering

**Solution:**
- For PrimeIcons: Ensure `primeicons.css` is imported in styles
- For FontAwesome: Ensure FontAwesome package is installed and imported
- Preffered FontAwesome icons only

```scss
// styles.scss
@import "primeicons/primeicons.css";
```

#### 8. Lazy Loading Table Performance

**Problem:** Table is slow with lazy loading

**Solution:**
1. Implement backend pagination
2. Use virtual scrolling for very long lists
3. Debounce filter input

```typescript
refreshData(event: any) {
  // Backend should handle pagination
  const request = new DtoListRequest(
    event.first / event.rows + 1,  // Page
    event.rows,                     // Size
    sortings,
    filterCriteria
  );
  // ...
}
```

---

## Quick Reference

### PrimeNG v20 Component Examples

**Module Imports:**

```typescript
import { DatePickerModule } from 'primeng/datepicker';
import { TabsModule } from 'primeng/tabs';
import { SelectModule } from 'primeng/select';
```

**Component Usage:**

```html
<!-- DatePicker -->
<p-datePicker [(ngModel)]="date"></p-datePicker>

<!-- Tabs Structure -->
<p-tabs value="0">
  <p-tablist>
    <p-tab value="0">Tab 1</p-tab>
  </p-tablist>
  <p-tabpanels>
    <p-tabpanel value="0">Content</p-tabpanel>
  </p-tabpanels>
</p-tabs>

<!-- Select Dropdown -->
<p-select [options]="items" [(ngModel)]="selectedItem"></p-select>
```

### Most Used Components (v20)

| Component | Module | Common Use Case |
|-----------|--------|-----------------|
| `<p-table>` | `TableModule` | Data tables with pagination/filtering |
| `<p-button>` | `ButtonModule` | Action buttons |
| `<p-dialog>` | `DialogModule` | Modal dialogs, forms |
| `<p-select>` | `SelectModule` | Dropdowns, single selection |
| `<p-datePicker>` | `DatePickerModule` | Date selection |
| `<p-inputText>` | `InputTextModule` | Text inputs |
| `<p-inputNumber>` | `InputNumberModule` | Number inputs |
| `<p-checkbox>` | `CheckboxModule` | Checkboxes |
| `<p-radioButton>` | `RadioButtonModule` | Radio buttons |
| `<p-toast>` | `ToastModule` | Notifications |
| `<p-confirmDialog>` | `ConfirmDialogModule` | Confirmation prompts |
| `<p-multiselect>` | `MultiSelectModule` | Multiple selection |
| `<p-panel>` | `PanelModule` | Collapsible sections |
| `<p-accordion>` | `AccordionModule` | Collapsible panels |
| `<p-tabs>` | `TabsModule` | Tabs with tab list and panels |
| `<p-popover>` | `PopoverModule` | Popup overlays |
| `<p-message>` | `MessageModule` | Inline messages |
| `<p-progressSpinner>` | `ProgressSpinnerModule` | Loading indicators |
| `<p-skeleton>` | `SkeletonModule` | Loading placeholders |
| `<p-chip>` | `ChipModule` | Tags, selections |
| `<p-badge>` | `BadgeModule` | Counters, status |

### PrimeFlex Quick Reference

| Class | Description |
|-------|-------------|
| `flex` | Display flex |
| `grid` | Display grid |
| `justify-content-between` | Justify content space-between |
| `align-items-center` | Align items center |
| `gap-2` | Gap 0.5rem |
| `p-3` | Padding 1rem |
| `m-2` | Margin 0.5rem |
| `mt-4` | Margin-top 1.5rem |
| `col-12` | Full width column |
| `md:col-6` | Half width on medium+ screens |
| `lg:col-4` | One-third width on large+ screens |

---

**External Resources:**

- [PrimeNG Official Documentation](https://v20.primeng.org/)
- [PrimeFlex Documentation](https://primeflex.org/)
- [PrimeNG GitHub](https://github.com/primefaces/primeng)
