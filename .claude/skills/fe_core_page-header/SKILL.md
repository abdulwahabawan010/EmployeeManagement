---
name: fe_core_page-header
description: "Frontend: Expert guidance on the Page Header system for rendering page-level headers outside the content area. Use when creating new page components, refactoring existing inline headers to use the page header area, or implementing sticky/flush headers. Covers component mode, template mode, PageHeaderConfig, and migration steps."
---

# Page Header System

## Overview

The **Page Header System** provides a dedicated header area in `AppMainComponent` that renders **outside** the padded content area (`.layout-content`). This ensures page headers render flush against the layout edges with no unwanted padding or margin gaps.

Every page component that needs a header **MUST** use this system. Inline headers inside page templates are **FORBIDDEN** for new implementations.

```
LAYOUT STRUCTURE:
+--------------------------------------+
| Topbar (4rem)                        |
+------+-------------------------------+
| nav  | PAGE HEADER AREA (flush)      |  <-- rendered by <mvs-page-header>
| items|  (no padding, no margin)      |
|      +-------------------------------+
|      | .layout-content (px-5, pt-5)  |  <-- router-outlet content
|      |   page body content           |
+------+-------------------------------+
```

---

## When to Use This Skill

Use this skill when:

- **Creating a new page component** that needs a header (config header, custom header, inline HTML header)
- **Refactoring an existing page** that renders a header inline inside its template (e.g., `<mvs-config-header>` directly in the page HTML)
- **Migrating legacy headers** to the centralized page header area
- **Debugging header positioning** issues (gaps, padding, sticky not working)

## When This Skill Does NOT Apply

- Components that are NOT pages (regular components, object components)
- Headers that are part of widget content or card content (not page-level headers)

---

## Architecture

### How It Works

1. `<mvs-page-header>` is placed in `app.main.component.html` **before** the content area
2. `MvsPageHeaderComponent` subscribes to `pageService.pageChange` and `pageService.pageDestroyed$`
3. When a page activates, `MvsPageHeaderComponent` calls `page.getPageHeaderConfig()`
4. If the page returns a `PageHeaderConfig`, the header renders; otherwise nothing is shown
5. When a page is destroyed, the header is cleared

**Communication pattern:** Pull-only. The `MvsPageHeaderComponent` pulls config from the page. There is NO push mechanism. Pages do NOT write to any service property.

### Key Files

| File | Purpose |
|------|---------|
| `features/core/shared/service/page/page-header-config.interface.ts` | `PageHeaderConfig` interface definition |
| `features/core/shared/components/page-header/mvs-page-header.component.ts` | Self-contained component that renders the header |
| `features/core/shared/components/page-header/mvs-page-header.component.html` | Template supporting component and template modes |
| `features/core/shared/components/page-header/mvs-page-header.component.scss` | Styles (`:host { display: contents }`, sticky, shadow) |
| `features/core/shared/mvs-page/page.component.ts` | Base class with default `getPageHeaderConfig()` and `@ViewChild('headerTemplate')` |

---

## PageHeaderConfig Interface

```typescript
import {TemplateRef, Type} from "@angular/core";

export interface PageHeaderConfig {
  component?: Type<any>;       // Angular component class to render dynamically
  inputs?: Record<string, any>; // Inputs to pass to the dynamic component
  templateRef?: TemplateRef<any>; // Alternative: render an ng-template from the page
  sticky?: boolean;             // If true, header sticks below topbar on scroll
  styleClass?: string;          // Additional CSS class on the header wrapper div
}
```

### Property Reference

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `component` | `Type<any>` | `undefined` | The Angular component class to render. Use when a reusable header component exists (e.g., `MvsConfigHeaderComponent`, `CrCustomerHeaderComponent`). |
| `inputs` | `Record<string, any>` | `undefined` | Key-value map of `@Input()` bindings for the dynamic component. Keys must match the component's `@Input()` property names exactly. |
| `templateRef` | `TemplateRef<any>` | `undefined` | Reference to an `<ng-template #headerTemplate>` defined in the page's HTML. Use when the header is custom HTML that doesn't warrant a separate component. |
| `sticky` | `boolean` | `false` | When `true`, the header sticks below the topbar (`top: 4rem`) during scroll. |
| `styleClass` | `string` | `''` | Additional CSS class(es) applied to the header wrapper `<div>`. |

**Rule:** You must provide either `component` OR `templateRef`, never both. If both are provided, `templateRef` takes precedence.

---

## Two Approaches

### Approach 1: Component Mode

Use when a **reusable header component** already exists or should be created.

**When to use:**
- Config pages using `MvsConfigHeaderComponent`
- Object pages with dedicated header components (e.g., `CrCustomerHeaderComponent`)
- Any case where the header is self-contained and reusable

**Implementation:**

```typescript
// In your page component (e.g., ticket-type.page.ts)
import {PageHeaderConfig} from "../../../../../core/shared/service/page/page-header-config.interface";
import {MvsConfigHeaderComponent} from "../../../../../core/shared/components/mvs-config-header/mvs-config-header.component";

export class TicketTypePage extends ConfigPageComponent implements OnInit {

    getPageHeaderConfig(): PageHeaderConfig {
        return {
            component: MvsConfigHeaderComponent,
            inputs: {
                header: 'Ticket Konfiguartion',
                categoryTypeMode: 'ticket',
                icon: 'fa-light fa-cards-blank'
            },
        };
    }
}
```

**Template:** No header markup needed in the page HTML. The header renders automatically via `<mvs-page-header>`.

---

### Approach 2: Template Mode

Use when the header is **custom inline HTML** specific to one page and doesn't justify creating a separate component.

**When to use:**
- Page has a custom header layout with page-specific data bindings
- Header content is complex but only used in one place
- Header needs direct access to the page's properties and methods

**Implementation:**

```typescript
// In your page component (e.g., cm-contract.page.ts)
import {PageHeaderConfig} from "../../../../../core/shared/service/page/page-header-config.interface";

export class CmContractPage extends ObjectPageComponent implements OnInit, OnDestroy, OnChanges {

    // NOTE: @ViewChild('headerTemplate') is already defined in PageComponent base class
    // Do NOT redeclare it in your page component

    getPageHeaderConfig(): PageHeaderConfig {
        if (!this.objectIdentifier?.objectId) return null;
        return {
            templateRef: this.headerTemplate,
            sticky: true,
        };
    }
}
```

**Template (page HTML):**

```html
<!-- MUST be placed OUTSIDE any *ngIf blocks so @ViewChild resolves immediately -->
<ng-template #headerTemplate>
    <!-- Use *ngIf INSIDE the template for conditional content -->
    <ng-container *ngIf="contractDto">
        <div class="flex justify-content-between w-full align-items-center surface-0 px-4 py-3">
            <!-- your custom header content here -->
        </div>
    </ng-container>
</ng-template>

<!-- Rest of the page content (inside *ngIf as usual) -->
<ng-container *ngIf="objectIdentifier && contractDto">
    <!-- page body -->
</ng-container>
```

**CRITICAL RULE:** The `<ng-template #headerTemplate>` MUST be at the **top level** of the template file, **outside** any `*ngIf`, `@if`, `*ngFor`, or `@for` blocks. If placed inside a conditional block, `@ViewChild({ static: true })` cannot resolve it and the header will not display.

**Conditional content inside the template:** Use `*ngIf` or `@if` **inside** the `<ng-template>` to guard against null data. The template itself is always available, but its inner content renders conditionally.

---

## Base Class Support

`PageComponent` (the base class for all pages) provides:

```typescript
// Already defined in PageComponent - do NOT redeclare in subclasses
@ViewChild('headerTemplate', { static: true }) headerTemplate: TemplateRef<any>;

// Default implementation returns null (no header)
getPageHeaderConfig(): PageHeaderConfig {
    return null;
}
```

- **`headerTemplate`**: Automatically available in every page component. Define `<ng-template #headerTemplate>` in your page HTML and reference `this.headerTemplate` in `getPageHeaderConfig()`.
- **`getPageHeaderConfig()`**: Override this method to provide header configuration. Return `null` to show no header (the default).

**MUST NOT** redeclare `@ViewChild('headerTemplate')` in subclasses. It is inherited from `PageComponent`.

---

## Mandatory Rules

### Rule 1: All New Pages MUST Use This System

Every new page component that needs a header MUST implement `getPageHeaderConfig()`. Rendering headers directly in the page template is **FORBIDDEN**.

```
FORBIDDEN (inline header):
<div>
    <mvs-config-header header="My Config" icon="fa-light fa-gear"></mvs-config-header>
    <!-- page content -->
</div>

CORRECT (page header system):
// In TypeScript:
getPageHeaderConfig(): PageHeaderConfig {
    return {
        component: MvsConfigHeaderComponent,
        inputs: { header: 'My Config', icon: 'fa-light fa-gear' },
    };
}

// In HTML (no header markup needed):
<div>
    <!-- page content only -->
</div>
```

### Rule 2: Remove Margin and Padding from Migrated Headers

When migrating an existing inline header to the page header system, you **MUST** remove any outer margin or padding from the header component or the wrapper div that was compensating for the content area's padding.

The page header area has **zero margin and zero padding** by design. If the original header had styles like `mx-5`, `mt-3`, `p-4`, `margin: 0 -1.5rem`, or similar spacing hacks to counteract the content area padding, these MUST be removed.

**Check these locations when migrating:**
1. The header component's own SCSS file (e.g., `.my-header { margin: ... }`)
2. The page template's wrapper div around the header (e.g., `<div class="mx-5">`)
3. The page SCSS file for sticky header styles (e.g., `.sticky-header { ... }`)
4. Any negative margins used to "break out" of the content area padding

**Example cleanup:**

```scss
// BEFORE (inside content area, compensating for padding)
.my-header {
    margin: 0 -1.25rem;  // negative margin hack
    padding: 1rem 1.25rem;
}

// AFTER (in page header area, no compensation needed)
.my-header {
    padding: 1rem 1.25rem;  // only keep intentional internal padding
}
```

### Rule 3: Sticky Is Handled by the System

When using `sticky: true` in `PageHeaderConfig`, the page header system handles sticky positioning automatically (`position: sticky; top: 4rem; z-index: 10`).

**MUST NOT** add custom sticky CSS in the page or header component. Remove any existing sticky styles when migrating:

```scss
// REMOVE these from page/header SCSS:
.cr-customer-sticky-header {
    position: sticky;
    top: 4rem;
    z-index: 10;
}
```

### Rule 4: Guard Against Null Data

For **Object Pages** where data loads asynchronously, return `null` from `getPageHeaderConfig()` when the required data is not yet available:

```typescript
getPageHeaderConfig(): PageHeaderConfig {
    // Return null until the object is loaded
    if (!this.objectIdentifier?.objectId) return null;

    return {
        component: MyHeaderComponent,
        inputs: { id: this.objectIdentifier.objectId },
        sticky: true,
    };
}
```

For **Config Pages** where header data is static (title, icon), you can return the config unconditionally:

```typescript
getPageHeaderConfig(): PageHeaderConfig {
    return {
        component: MvsConfigHeaderComponent,
        inputs: {
            header: 'My Configuration',
            categoryTypeMode: 'system',
            icon: 'fa-light fa-gear'
        },
    };
}
```

---

## Migration Guide: Converting Existing Inline Headers

When refactoring a page that currently renders a header inline, follow these steps:

### Step 1: Identify the Current Header

Claude MUST automatically detect the header portion of a page template. **Do NOT ask the user which part is the header.** Analyze the template and identify it using the following rules.

**Detection Strategy — Read the page HTML template and look for these patterns (in priority order):**

1. **`<mvs-config-header>` tag** — This is ALWAYS a header. It is the most common pattern in config pages.
   ```html
   <mvs-config-header header="..." [categoryTypeMode]="'...'" icon="..."></mvs-config-header>
   ```

2. **Known header component selectors** — Any component with `header` in the selector name that appears at the top of the template body:
   - `<cr-customer-header>`, `<cm-contract-header>`, `<*-header>` (module-specific headers)
   - These are always the first meaningful element inside the page's root wrapper

3. **Top-level decorative/informational div BEFORE the main content** — A `<div>` that:
   - Appears as the **first child** (or first meaningful child) inside the root element
   - Contains **title/heading elements** (`<h1>`–`<h6>`, or text interpolation like `{{ dto?.name }}`)
   - Contains **icons** (`<i class="fa-...">`, `<img>` for logos)
   - Contains **metadata** (status badges, breadcrumbs, subtitle text)
   - Has **styling classes** suggesting a banner/bar: `surface-0`, `bg-primary`, `shadow-1`, gradients, `sticky`, `flex justify-content-between align-items-center`
   - Does NOT contain widgets (`<mvs-widget>`), forms, tables, or main content

4. **Sticky-positioned elements at the top** — Any element with CSS classes or inline styles for sticky positioning (`position: sticky`, `sticky-header`, `*-sticky-*`) that appears before the main content area.

**What is NOT a header:**
- Tab bars (`<p-tabs>`, `<p-tablist>`) — these are navigation, not headers
- Widget containers (`<mvs-widget>`)
- Form areas
- Content that appears AFTER tabs or the main body

**Decision flow:**
```
READ page HTML template
  │
  ├─ Contains <mvs-config-header>?
  │    └─ YES → That's the header. Use Component Mode with MvsConfigHeaderComponent.
  │
  ├─ Contains <*-header> component at the top?
  │    └─ YES → That's the header. Use Component Mode with that component class.
  │
  ├─ First child div has title/icon/metadata but no widgets/forms?
  │    └─ YES → That's the header. Use Template Mode with #headerTemplate.
  │
  └─ No header found?
       └─ Page has no header. No migration needed. Do NOT add getPageHeaderConfig().
```

**After identification, extract the header's properties:**
- For `<mvs-config-header>`: read `header`, `icon`, `categoryTypeMode`, `description`, `links`, `parentNavigationRoute` attribute values
- For custom header components: read all `[input]` bindings and `*ngIf` conditions
- For HTML blocks: note the full HTML content, any data bindings, and event handlers

**Examples of correctly identified headers:**

```html
<!-- IDENTIFIED: <mvs-config-header> → Component Mode -->
<div class="bg-white">
    <mvs-config-header header="Vertragskonfiguration" [categoryTypeMode]="'contract'"
                       icon="fa-light fa-cards-blank">        ← THIS IS THE HEADER
    </mvs-config-header>
    <p-tabs ...>                                               ← This is NOT the header
        <!-- content -->
    </p-tabs>
</div>

<!-- IDENTIFIED: Custom component → Component Mode -->
<ng-container *ngIf="objectIdentifier && customerDto">
    <cr-customer-header [customerId]="objectIdentifier.objectId">   ← THIS IS THE HEADER
    </cr-customer-header>
    <div class="grid">                                              ← This is NOT the header
        <!-- content -->
    </div>
</ng-container>

<!-- IDENTIFIED: Inline HTML block → Template Mode -->
<ng-container *ngIf="objectIdentifier && contractDto">
    <div class="flex justify-content-between w-full align-items-center surface-0 px-4 py-3">
        <i class="fa-2x {{contractDto.contractTypeDto.image}}"></i>     ← THIS BLOCK
        <h5>{{ contractDto.contractTypeDto?.name }}</h5>                  IS THE HEADER
    </div>
    <div class="grid">                                              ← This is NOT the header
        <!-- content -->
    </div>
</ng-container>

<!-- NO HEADER: Page with only content, no decorative top bar -->
<div>
    <p-tabs ...>                    ← Tabs are NOT headers
        <!-- content -->
    </p-tabs>
</div>
```

### Step 2: Choose the Approach

| Current Pattern | Recommended Approach | Reason |
|-----------------|---------------------|--------|
| `<mvs-config-header>` inline | **Component mode** | `MvsConfigHeaderComponent` is reusable; just pass inputs |
| Dedicated header component (e.g., `<cr-customer-header>`) | **Component mode** | Component already exists; pass its inputs |
| Custom HTML block (not reused elsewhere) | **Template mode** | No component to reference; use `#headerTemplate` |

### Step 3: Add `getPageHeaderConfig()` Override

**Component mode:**

```typescript
import {PageHeaderConfig} from "../path/to/page-header-config.interface";
import {MvsConfigHeaderComponent} from "../path/to/mvs-config-header.component";

// In your page class:
getPageHeaderConfig(): PageHeaderConfig {
    return {
        component: MvsConfigHeaderComponent,
        inputs: {
            header: 'My Config Title',
            categoryTypeMode: 'ticket',
            icon: 'fa-light fa-cards-blank'
        },
    };
}
```

**Template mode:**

```typescript
import {PageHeaderConfig} from "../path/to/page-header-config.interface";

// In your page class:
getPageHeaderConfig(): PageHeaderConfig {
    if (!this.objectIdentifier?.objectId) return null;
    return {
        templateRef: this.headerTemplate,
        sticky: true,
    };
}
```

### Step 4: Update the HTML Template

**Component mode:** Remove the inline header tag entirely.

```html
<!-- BEFORE -->
<div class="bg-white">
    <mvs-config-header header="Ticket Konfiguartion" [categoryTypeMode]="'ticket'"
                       icon="fa-light fa-cards-blank">
    </mvs-config-header>
    <p-tabs ...>
        <!-- content -->
    </p-tabs>
</div>

<!-- AFTER -->
<div class="bg-white">
    <p-tabs ...>
        <!-- content -->
    </p-tabs>
</div>
```

**Template mode:** Move the header HTML into an `<ng-template #headerTemplate>` at the top of the file, outside any `*ngIf`:

```html
<!-- BEFORE -->
<ng-container *ngIf="objectIdentifier && dto">
    <div class="my-header px-4 py-3">
        <h5>{{ dto.name }}</h5>
    </div>
    <!-- page content -->
</ng-container>

<!-- AFTER -->
<ng-template #headerTemplate>
    <ng-container *ngIf="dto">
        <div class="my-header px-4 py-3">
            <h5>{{ dto.name }}</h5>
        </div>
    </ng-container>
</ng-template>

<ng-container *ngIf="objectIdentifier && dto">
    <!-- page content (no header) -->
</ng-container>
```

### Step 5: Clean Up Styles

1. **Remove sticky CSS** from the page's SCSS file (sticky is handled by `PageHeaderConfig.sticky`)
2. **Remove negative margins** that were compensating for the content area padding
3. **Remove outer wrapper margins** that were added for spacing inside the content area
4. **Keep only intentional internal padding** within the header itself

### Step 6: Add Required Imports

```typescript
import {PageHeaderConfig} from "../path/to/page-header-config.interface";
// For component mode only:
import {MvsConfigHeaderComponent} from "../path/to/mvs-config-header.component";
// Or whatever header component you're using
```

---

## MvsConfigHeaderComponent Inputs Reference

When using component mode with `MvsConfigHeaderComponent`, these are the available inputs:

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `header` | `string` | `''` | Header title text |
| `icon` | `string` | `''` | FontAwesome icon class |
| `description` | `string` | `''` | Description text below the header |
| `categoryTypeMode` | `string` | `'ticket'` | Color theme. Options: `'cross'`, `'technical'`, `'system'`, `'ticket'`, `'call'`, `'channel'`, `'notification'`, `'document'`, `'contract'`, `'workflow'`, `'contractInsurance'`, `'person'`, `'household'`, `'configuration'` |
| `links` | `MenuItem[]` | `[]` | Navigation links displayed in the header |
| `parentNavigationRoute` | `string` | `''` | Route for parent navigation link |

---

## Complete Examples

### Example 1: Config Page with MvsConfigHeaderComponent (Component Mode)

```typescript
// ticket-type.page.ts
import {PageHeaderConfig} from "../../../../../core/shared/service/page/page-header-config.interface";
import {MvsConfigHeaderComponent} from "../../../../../core/shared/components/mvs-config-header/mvs-config-header.component";

@Component({
    selector: 'mvs-ticket-type-page',
    templateUrl: './ticket-type.page.html',
    styleUrls: ['./ticket-type.page.scss'],
    standalone: false
})
export class TicketTypePage extends ConfigPageComponent implements OnInit {

    getPageHeaderConfig(): PageHeaderConfig {
        return {
            component: MvsConfigHeaderComponent,
            inputs: {
                header: 'Ticket Konfiguartion',
                categoryTypeMode: 'ticket',
                icon: 'fa-light fa-cards-blank'
            },
        };
    }
}
```

### Example 2: Object Page with Dedicated Header Component (Component Mode)

```typescript
// cr-customer-object.page.ts
import {PageHeaderConfig} from "../../../../../core/shared/service/page/page-header-config.interface";
import {CrCustomerHeaderComponent} from "../../../component/protected-components/cr-customer/component/cr-customer-header/cr-customer-header.component";

@Component({ ... })
export class CrCustomerObjectPage extends ObjectPageComponent implements OnInit, OnDestroy, OnChanges {

    getPageHeaderConfig(): PageHeaderConfig {
        if (!this.objectIdentifier?.objectId) return null;
        return {
            component: CrCustomerHeaderComponent,
            inputs: { customerId: this.objectIdentifier.objectId },
            sticky: true,
        };
    }
}
```

### Example 3: Object Page with Inline HTML Header (Template Mode)

```typescript
// cm-contract.page.ts
import {PageHeaderConfig} from "../../../../../core/shared/service/page/page-header-config.interface";

@Component({ ... })
export class CmContractPage extends ObjectPageComponent implements OnInit, OnDestroy, OnChanges {

    // headerTemplate is inherited from PageComponent - do NOT redeclare

    getPageHeaderConfig(): PageHeaderConfig {
        if (!this.objectIdentifier?.objectId) return null;
        return {
            templateRef: this.headerTemplate,
            sticky: true,
        };
    }
}
```

```html
<!-- cm-contract.page.html -->

<!-- Template MUST be outside any *ngIf -->
<ng-template #headerTemplate>
    <ng-container *ngIf="contractDto">
        <div class="flex justify-content-between w-full align-items-center surface-0 px-4 py-3">
            <div class="flex align-items-center">
                <i *ngIf="contractDto.contractTypeDto?.image"
                   class="fa-2x {{contractDto.contractTypeDto.image}}"></i>
                <div class="mr-5">
                    <h5 class="mb-0">{{ contractDto.contractTypeDto?.name }}</h5>
                </div>
            </div>
        </div>
    </ng-container>
</ng-template>

<!-- Page body content -->
<ng-container *ngIf="objectIdentifier && contractDto">
    <!-- ... -->
</ng-container>
```

---

## Anti-Patterns (FORBIDDEN)

| Anti-Pattern | Why It's Wrong | Correct Alternative |
|-------------|----------------|---------------------|
| Rendering `<mvs-config-header>` directly in page HTML | Header renders inside padded content area, creating visual gaps | Use component mode with `getPageHeaderConfig()` |
| Rendering any header component inline in page template | Same issue — header is inside `.layout-content` padding | Use component mode |
| Adding custom sticky CSS in page SCSS | Conflicts with system-managed sticky behavior | Use `sticky: true` in `PageHeaderConfig` |
| Using negative margins to "break out" of content padding | Fragile hack that breaks across layouts | Use the page header area (zero padding by design) |
| Redeclaring `@ViewChild('headerTemplate')` in a subclass | Already defined in `PageComponent` base class | Remove the duplicate — it's inherited |
| Placing `<ng-template #headerTemplate>` inside `*ngIf` | `@ViewChild({ static: true })` cannot resolve inside conditional blocks | Place template at the top level of the file |
| Using both `component` and `templateRef` in the same config | Ambiguous — `templateRef` wins but intent is unclear | Use one or the other |

---

## Enforcement

This skill is **MANDATORY** for:

1. **All new page components** — MUST use `getPageHeaderConfig()` for headers
2. **All page refactoring tasks** — When touching a page that has an inline header, migrate it to use the page header system
3. **Code review** — Inline headers in page templates are grounds for rejection

| Violation | Classification |
|-----------|----------------|
| New page with inline header | **SKILL VIOLATION** |
| Missing `getPageHeaderConfig()` when page has a header | **SKILL VIOLATION** |
| Custom sticky CSS when `sticky: true` is available | **SKILL VIOLATION** |
| Redeclared `@ViewChild('headerTemplate')` in subclass | **SKILL VIOLATION** |
| `<ng-template #headerTemplate>` inside `*ngIf` | **BUG** — header will not render |
| Outer margin/padding not removed during migration | **SKILL VIOLATION** |
