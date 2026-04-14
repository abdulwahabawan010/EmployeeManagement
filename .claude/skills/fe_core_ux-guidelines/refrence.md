# ALPHA SYSTEM

ALPHA is an enterprise business management platform built on Angular 20.
It is designed to manage customers, contracts, dunning/debt collection, workflows (BPMN), documents, addresses, and scheduling in a single integrated system.
The platform targets internal business users (admins, back office, managers) and external consultants with different access needs.
It supports full customer and contract lifecycle management, configuration-heavy modules, and complex business workflows.
ALPHA uses a widget-based UI architecture to display and manage entity data efficiently.
A multi-mode UI system (full, side, consultant) adapts screens and actions based on user roles.
Power users get full CRUD and configuration access, while consultants see a simplified, task-focused interface.
Role-based navigation and permissions ensure security and usability.

---

# UI & Frontend Development Guidelines
(PrimeNG + PrimeFlex Standard)

## 1. Purpose of This Document

This document defines mandatory UI and frontend development standards for ALPHA SYSTEM.

Its purpose is to ensure:

- Consistency across all modules
- Predictable layouts and behavior
- Minimal UI debt
- Clean, maintainable frontend code

**These are rules, not suggestions.**

---

## 2. Platform Context

### 2.1 Application Type

ALPHA SYSTEM is an enterprise ERP-style web application used by:

- Agents
- Back-office users
- Operations and admin teams

Users work with:

- Contracts
- Customers
- Documents
- Payments
- Workflows
- System configurations

Users are not designers or technical experts and often work under time pressure.

### 2.2 Platform Priority & Screen Sizes

#### Screen Size Targets

- **Minimum desktop**: 1065 × 768 px → must fully work, no horizontal scroll
- **Standard desktop**: 1280 × 800 px
- **Large desktop**: 1440 px width and above
- **Tablet (secondary)**: 768–1024 px

#### Priority Order

1. Desktop / Laptop (Primary)
2. Tablet-like widths (Secondary)
3. Mobile (Not a target platform)

**This is not a mobile-first system.**

#### Responsiveness Philosophy

Responsiveness exists to:

- Support side panels
- Support dialogs
- Support embedded components
- Allow layout reuse

Responsiveness does NOT exist to:

- Design mobile-only layouts
- Optimize phone usage

---

## 3. Core Frontend Technology Stack

### 3.1 Mandatory UI Frameworks

ALPHA SYSTEM frontend uses only:

- **Angular**: 20
- **PrimeNG**: 20.2 (UI components)
- **PrimeFlex**: 4 (layout, spacing, grid, utilities)

All UI code must be compatible with these versions.

### 3.2 Component Usage Rule (Very Important)

**All UI components MUST come from PrimeNG**

❌ **Not allowed:**

- Custom buttons
- Custom dropdowns
- Custom tables
- Custom modals

✅ **Allowed (Commonly Used):**

- `p-button`
- `p-select`
- `p-table`
- `p-dialog`
- `p-inputText`
- `p-checkbox`
- `p-radioButton`
- `p-panel`
- `p-popover`
- `p-accordion`
- `p-tabView`
- `p-message`
- `p-spinner`
- `p-skelton`

If PrimeNG does not provide a component:

1. Check PrimeNG alternatives or configuration
2. Propose a reusable PrimeNG-styled solution
3. Creating anything custom if it's clearly mentioned in the requirements

---

## 4. Color System Rules (PrimeNG + PrimeFlex)

### 4.1 Core Rule

- Always use PrimeFlex color tokens
- Never use HEX, RGB, or custom color values

❌ **Not allowed:**

```css
color: #ff0000;
background: rgb(0, 120, 255);
```

✅ **Allowed:**

```html
<p class="text-red-500"></p>
<div class="bg-blue-50"></div>
<span class="text-green-600"></span>
```

### 4.2 Background Color Rules

- **Application shell**: light gray (#f7f7f7)
- **Content containers**: always white (surface-0)
- **Cards / panels / sections**: no background colors

Background colors are used only for:

- Semantic status
- Disabled / unavailable sections

### 4.3 Semantic Colors (Status-Based Only)

| Purpose | Background | Text |
|---------|------------|------|
| Info | `bg-blue-50` | `text-blue-700` / `800` |
| Success | `bg-green-50` | `text-green-700` |
| Warning | `bg-yellow-50` | `text-yellow-700` |
| Error | `bg-red-50` | `text-red-700` |

### 4.4 Buttons & Types

**Button styles:**

- Primary button → `bg-primary` (background-color: #0073a5)
- Outlined / text → `text-primary`
- Disabled → `surface-200/300` + `text-700`

**Button types:**

- Primary Action Button
- Secondary Action Button
- Tertiary (Text) Button
- Destructive Button
- Icon Button
- Toggle Button

❌ **No custom button colors allowed**

### 4.5 Common Color Tokens

| Purpose | PrimeFlex Class |
|---------|----------------|
| Primary text | `text-primary` (#0073a5) / `text-blue-800` |
| Secondary text | `text-gray-600` |
| Muted text | `text-gray-500` |
| Success | `text-green-600`, `bg-green-50` |
| Warning | `text-yellow-600`, `bg-yellow-50` |
| Error | `text-red-600`, `bg-red-50` |
| Info | `text-blue-600`, `bg-blue-50` |

---

## 5. Typography Rules

### 5.1 Base Typography

- **Font family**: Roboto
- **Default size**: `text-base` (implicit)
- **Default weight**: `font-normal`

### 5.2 Headings & Emphasis

| Usage | Class |
|-------|-------|
| Page title | `text-2xl font-bold` |
| Section title | `text-xl font-semibold` |
| Sub-section title | `text-lg font-semibold`/`font-medium` |
| Labels | `text-base` / `text-lg font-medium` |
| Helper text | `text-sm` / `text-base` |

**Example:**

```html
<h3 class="text-xl font-semibold">Section Title</h3>
<p class="text-sm text-gray-600">Helper text</p>
```

---

## 6. Action Button Placement

### Layout Pattern

Use `justify-content-between` when both sides exist.

- **Left side** → icon-only utility actions
- **Right side** → grouped main action buttons

### Left Side – Icon Utility Actions

Used for:

- Delete form
- Fetch history
- Info / help

**Rules:**

- Icon-only
- Never primary
- Not grouped with main actions

```
[ 🗑 ] [ 🕘 ] [ ℹ ]        Cancel   Save
```

### Right Side – Action Group

**Rules:**

- Buttons are grouped
- Group is right-aligned
- One primary action only
- Primary action is last

```
Cancel   Save | (Save & Close)
```

**Example:**

```
[ 🗑 ] [ 🕘 ] [ ℹ ]        Cancel   Save
```

### Scrollable Pages / Sections

**Rule:**

Primary action must always be accessible

**Allowed:**

- Sticky footer. Eg: dialog (actions right-aligned)
- Fixed bottom action bar

**Example:**

Tables / timelines has sticky bottom with "Show more" action instead of having actions at the end of the page

---

## 7. Shadows & Border Radius

### 7.1 Shadows

- `shadow-none` → preferred (bcz we have white content on light gray body background)
- `shadow-1` → rare

❌ `shadow-2+` not allowed
❌ Custom shadows not allowed
✔ **Exception:** `var(--box-shadow-light)` for custom class if shadow is required.

### 7.2 Border Radius

**Allowed:**

- `border-round-md`
- `border-round-lg` (preferred)

**Used for:**

- Cards
- Panels
- Containers

❌ **No custom radius values**

---

## 8. Spacing Rules

### 8.1 General Principle

Spacing is handled only via PrimeFlex utilities.

### 8.2 Grid-Based Layouts

- Use `grid`, `col-*`
- Columns include padding
- Avoid extra horizontal padding

### 8.3 Vertical Spacing

| Scenario | Class |
|----------|-------|
| Major sections | `mb-4` / `mb-5` |
| Between cards | `mb-3` |
| Inside cards | `p-3` |
| Dense areas | `p-2` |

### 8.4 Non-Grid Layouts

Use:

- `p-*` → padding
- `m-*` → margin
- `gap-*` → spacing

---

## 9. HTML Structure & Custom CSS Policy

### 9.1 Rule

99% of layouts must use PrimeNG + PrimeFlex only

Use utilities like:

- `flex`
- `grid`
- `col-*`
- `align-items-center`
- `justify-content-between`
- `gap-*`
- `w-full`, `h-full`

### 9.2 Why Custom CSS Is Avoided

- Cleaner UI
- Faster development
- Fewer regressions
- Easier maintenance
- Consistent behavior

### 9.3 When Custom CSS Is Allowed (Rare)

**Examples:**

- Generic table header styling
- Custom collapsible sidebar width
- Behavior not achievable with PrimeFlex

**Rules:**

- Must be documented
- Must be reusable
- Must use prefix (e.g: module name)

### 9.4 Global Custom CSS Pattern

```css
.alpha-table-header .table .th {
  background-color: var(--surface-100);
}
```

---

## 10. Grid System & Responsiveness

### 10.1 Standard Grid (Viewport-Based)

```html
<div class="grid">
  <div class="col-12 md:col-6 lg:col-4"></div>
</div>
```

**Used for:**

- Full-page layouts

---

## 11. Container-Based Responsiveness (Special Rule)

### Why

Components appear in:

- Full page
- Sidebars
- Dialogs
- Embedded panels

Viewport-based responsiveness is insufficient.

### How

Wrap component with:

```html
<div class="alpha-responsive-container">
  <!-- component -->
</div>
```

Breakpoints respond to container width, not viewport.

### When to Use

| Scenario | Use |
|----------|-----|
| Dialog | ✅ |
| Sidebar | ✅ |
| Embedded | ✅ |
| Full page | ❌ |

---

## 12. Icons (FontAwesome Rules)

- **Font Awesome only**
- **Default**: `fa-regular`
- `fa-solid` only for:
    - State
    - Importance
    - Visibility issues
    - Active state

### 12.1 Mandatory Icon Mappings

The following icon mappings are fixed and must be used consistently across ALPHA SYSTEM.

#### Home

**Icon:**

```html
<i class="fa-regular fa-house"></i>
```

#### Ticket

**Normal state:**

```html
<i class="fa-regular fa-ticket"></i>
```

**Active / Selected state:**

```html
<i class="fa-solid fa-ticket"></i>
```

#### User

**Icon:**

```html
<i class="fa-regular fa-user"></i>
```

#### Add / Plus

**Icon:**

```html
<i class="fa-solid fa-plus"></i>
```

**Reason:**
Regular version has very thin strokes.
Solid improves clarity and click affordance.

#### Chevron (Up / Down)

**Icons:**

```html
<i class="fa-solid fa-chevron-up"></i>
<i class="fa-solid fa-chevron-down"></i>
```

**Reason:**
Navigation indicators must be highly visible.
Regular chevrons are too thin.

#### Attachments

**Icon:**

```html
<i class="fa-regular fa-paperclip-vertical"></i>
```

#### Comments / Messages

**Icon:**

```html
<i class="fa-regular fa-comments"></i>
```

**Note:**
Solid comment icons are filled.
We prefer unfilled (regular) icons for content indicators.

---

## 13. Mandatory Data States (Empty, Busy)

Every data-driven UI component (tables, lists, cards, dashboards, forms with async data) MUST explicitly handle the following states:

| State | Mandatory UI |
|-------|-------------|
| Loading | Skeletons |
| Ready (data exists) | Normal UI |
| Empty (no data) | Empty state |
| Error | Error message |
| Action in progress | Busy indicator |

❌ **Skipping any state is not allowed.**

### 13.1 Loading State (Skeletons – Mandatory)

**Rules:**

- Skeletons MUST be shown while data is loading
- Skeletons MUST match the final layout
- Skeletons MUST NOT be replaced by spinners for data loading

✅ **DO**

```html
<p-skeleton width="100%" height="2rem"></p-skeleton>
```

❌ **DO NOT**

- Blank screens
- Spinners for data fetching
- Delayed rendering without feedback

📌 **Golden Rule**

No data will appear without a visible loading state.

### 13.2 Busy State (Actions in Progress – Mandatory)

Busy states are required when a user triggers an action.

**Rules:**

- Show loading indicator on the triggering element
- Do not block the entire page unless action is critical
- Disable repeated actions while busy

✅ **DO**

```html
<p-button label="Save" [loading]="true"></p-button>

<p-progress-spinner ariaLabel="loading" />
```

❌ **DO NOT**

- Show global spinners for local actions
- Allow double submission
- Hide feedback

### 13.3 Empty State (No Data – Mandatory)

(Reference existing Empty State Guidelines)

**Rules:**

- Empty state must appear when data returns empty
- Must not reuse skeletons
- Must not show spinners

### 13.4 Error State (Mandatory)

**Rules:**

- Errors must be visible and contextual
- Use `p-message` for inline errors
- Use dialogs only for blocking failures

❌ **Never fail silently**

### 13.5 State Transition Rule

UI must clearly transition between states:

```
Loading → Ready
Loading → Empty
Loading → Error
Ready → Busy → Ready
```

Transitions must never be ambiguous.

If any item fails → AI must reject output.

---

## 14. Error Handling & Messages

- **Dialog (`p-dialog`)** → major / blocking
- **Toast (`MessageService`)** → feedback
- **In-content (`p-message`)** → guidance

**Quick rule:**

```
Dialog = major
Toast = feedback
In-content = guidance
```

---

## 15. Forms – Definition & UX Rules

- Clear structure
- Group related fields
- Group heading above fields

**Mandatory fields:**

```html
<label>Email <span class="text-red-600">*</span></label>
```

**Disabled / Read-only:**

- Grayed
- Not editable
- Still readable

**Validation:**

- Inline or `p-message`
- Toast for submit result
- No dialogs for validation

---

## 16. Feedback & System Transparency

**Define expectations:**

Users must always understand:

- Where they are
- What they are working on
- What will happen next

System state must never be ambiguous

**Example:**

"The system must always make the current state and next possible actions clear."

---

## 17. Date & Time Formatting Rules

### Date Format (Mandatory)

All dates must follow this format:

```
DD.MM.YYYY
```

**Example:**

```
26.07.2024
```

This format is used:

- Across all dashboards
- In tables
- In forms
- In detail views
- In config pages

**No alternative date formats are allowed.**

### 17.1 Date + Time Format (When Required)

When time is required, append it after the date:

```
DD.MM.YYYY HH:mm
```

**Example:**

```
26.07.2024 14:35
```

- Use 24-hour format
- No AM / PM

### Rules

- Dates must be locale-independent
- Always show leading zeros
- Never use:
    - `YYYY-MM-DD`
    - `MM/DD/YYYY`
    - Textual months (e.g. "Jul")

### Usage Guidance

- **Tables** → always formatted
- **Forms** → formatted display, date picker for input
- **Filters** → date picker, formatted output
- **Logs / history** → date + time

### Golden Rule

**One system. One date format. No exceptions.**

---

## 18. File Upload Patterns (UX Guidelines)

### Purpose

File upload must be:

- Clear
- Predictable
- Safe
- Self-explanatory

Users Must always know:

- What they can upload
- How large it can be
- What is happening during upload
- Why an upload failed (if it did)

### 18.1 Upload Zone (Mandatory)

File upload areas MUST provide:

- Drag-and-drop support
- Click to browse
- Visible accepted formats
- Visible maximum file size

**Rules:**

- Upload zone must be clearly identifiable
- Do not hide constraints in tooltips only
- Use PrimeNG file upload components

**Example (UX):**

```
Drag & drop files here or click to browse
Accepted: PDF, JPG, PNG • Max size: 10 MB
```

### 18.2 Upload Progress (Mandatory)

During upload, the UI MUST show:

- File name
- Progress bar
- Upload status
- Option to cancel (while uploading)

**Rules:**

- Progress must be per file
- Do not block the whole page
- Cancel must stop the upload immediately

### 18.3 Validation (Client-Side First)

Validation MUST happen before upload starts.

**Required Checks:**

- File type (format)
- File size

**Error Handling:**

- Show clear, human-readable messages
- Errors must be shown near the upload area

**Examples:**

- "File type not supported. Please upload a PDF."
- "File size exceeds 10 MB limit."

❌ **No technical error messages**
❌ **No silent failures**

### 18.4 Accepted Formats

Accepted formats MUST be:

- Explicitly listed

**Example:**

```
Accepted formats: PDF, DOCX, JPG, PNG
```

### 18.5 UX Rules Summary

- Always show constraints upfront
- Always show progress
- Always validate client-side
- Always explain errors clearly

### 18.6 Golden Rule

**Users must never guess why an upload failed or what is allowed.**

---

## 19. Empty State Guidelines

### Purpose

Empty states explain why no data is visible and what the user can do next.

An empty state must:

- Reduce confusion
- Guide the user
- Never feel like an error (unless it is one)

### When to Show an Empty State

Use an empty state when:

- No data exists yet
- Filters return no results
- A list/table is intentionally empty
- User has not completed required setup

### What an Empty State Must Contain

**Mandatory elements:**

- Clear message (what's missing)
- Reason or context (why it's empty)
- Next step guidance (what to do)

**Optional:**

- Subtle icon (Font Awesome regular)
- Secondary action (if applicable)

### Empty State vs Loading vs Error

- **Loading** → Skeletons
- **Error** → `p-message` / dialog / toast
- **No data** → Empty state

❌ **Do not use spinners for empty states**
❌ **Do not use error messages for "no data"**

### Placement Rules

- **Tables** → inside table body area
- **Dashboards** → inside data section
- **Forms** → inline informational message

Empty states must preserve layout (no page jumps).

### Examples

- "No tickets found for the selected filter."
- "No data available yet."
- "Create your first configuration to get started."
- "Adjust filters to see results."

### What NOT to Do

❌ Blank white screens
❌ Technical messages
❌ Aggressive call-to-actions
❌ Primary actions that force workflow

### Golden Rule

**Empty state = guidance, not failure.**

---

## 19. PrimeNG Only Component Rule (Hard Stop)

### ✅ DO

- Use PrimeNG components exclusively for all UI elements.
- Wrap logic and layout around PrimeNG components, never replace them.
- Use PrimeNG properties, templates, and slots for customization.

### ❌ DO NOT (Strictly Forbidden)

| Forbidden Action | Reason |
|-----------------|--------|
| `<button>` | Must always be `p-button` |
| `<select>` | Must always be `p-select` |
| `<input type="text">` | Must be `p-inputText` |
| Custom modal implementation | Must be `p-dialog` |
| Custom table | Must be `p-table` |
| Custom checkbox/radio | Must be `p-checkbox` / `p-radioButton` |

❌ **AI MUST NEVER generate raw HTML form controls.**

### 19.1 Mandatory PrimeNG Mapping Table (AI Reference)

AI must resolve intent → PrimeNG component using the following mapping.

| UI Intent | MUST Use |
|-----------|----------|
| Primary action | `p-button severity="primary"` |
| Secondary action | `p-button severity="secondary"` |
| Destructive action | `p-button severity="danger"` |
| select | `p-select` |
| Text input | `p-inputText` |
| Numeric input | `p-inputNumber` |
| Date input | `p-calendar` |
| Toggle | `p-inputSwitch` |
| Modal | `p-dialog` |
| Table | `p-table` |
| Loading | `p-spinner` |
| Inline message | `p-message` |
| Toast | `MessageService` |

❌ **If a UI element cannot be mapped, AI must explicitly state why and request approval.**

### 19.3 Forbidden "Visual Substitution" Rule

AI must not simulate PrimeNG behavior using HTML or CSS.

❌ **Examples (Invalid Output)**

```html
<div class="fake-dialog">...</div>
<button class="primary-btn">Save</button>
```

✅ **Correct**

```html
<p-dialog header="Edit Contract"></p-dialog>
<p-button label="Save" severity="primary"></p-button>
```

### 19.4 Layout Enforcement Rule (PrimeFlex First)

#### ✅ DO

Use:
- `grid`, `col-*`, `flex`, `gap-*`, `align-items-*`
- `w-full`, `h-full`, `justify-content-between`

#### ❌ DO NOT

| Not Allowed | Why |
|-------------|-----|
| Custom CSS for spacing | PrimeFlex exists |
| Inline styles | Breaks consistency |
| Tailwind / Bootstrap | Forbidden frameworks |

If layout is not possible via PrimeFlex → AI must flag it explicitly.

### 19.5 Button Construction Rules (AI MUST FOLLOW)

❌ **INVALID**

```html
<button class="btn-primary">Save</button>
```

✅ **VALID**

```html
<p-button label="Save" severity="primary" icon="fa-solid fa-save"></p-button>
```

**Mandatory Rules:**

- One `severity="primary"` only
- Primary action must be last
- Icon buttons → `p-button` with icon only

### 19.6 Dialog Rules (Strict)

#### ❌ DO NOT

- Create modal overlays manually
- Position dialogs using CSS hacks
- Add custom headers

#### ✅ DO

```html
<p-dialog
  header="Edit Customer"
  [modal]="true"
  [draggable]="false"
  [resizable]="false">
</p-dialog>
```

### 19.7 Table Rules (Non-Negotiable)

#### ❌ DO NOT

- Create tables using `<table>`
- Simulate pagination manually

#### ✅ DO

```html
<p-table
  [value]="contracts"
  [paginator]="true"
  [rows]="10">
</p-table>
```

**Mandatory:**

- `p-table`
- Built-in pagination
- Skeleton rows while loading

### 19.8 PrimeNG Validation Rule

#### ❌ INVALID

- Browser validation
- Custom error spans
- Alerts for form errors

#### ✅ VALID

- `p-message`
- Inline validation
- Toast on submit result

### 19.9 AI Output Validation Checklist (MANDATORY)

AI must internally verify the following before responding:

- ☑ No raw `<button>`, `<input>`, `<select>`
- ☑ All components are PrimeNG
- ☑ All spacing via PrimeFlex
- ☑ No HEX / RGB colors
- ☑ Font Awesome icons only
- ☑ Only one primary action
- ☑ Correct date format (DD.MM.YYYY)
- ☑ Skeletons for loading
- ☑ Empty states implemented
- ☑ Role-based actions respected

**If any item fails → AI must reject its own output.**

### 19.10 Violation Handling Rule

If a business requirement conflicts with PrimeNG rules, AI must:

1. Clearly state the conflict
2. Reference the violated rule
3. Propose a PrimeNG-compliant alternative

❌ **AI must NOT silently break rules to "make it work".**

---

## 20. Layout & Styling Enforcement Rules (Mandatory)

### 20.1 PrimeFlex Is the Only Allowed Layout System

**Rule:**

All layout, spacing, alignment, sizing, and flex/grid behavior MUST be implemented using PrimeFlex utility classes.

**This includes:**

- Flexbox
- Grid
- Spacing
- Padding
- Margin
- Alignment
- Width / Height
- Border
- Shadow
- Visibility helpers

### 20.2 Custom CSS Classes for Layout Are Forbidden

#### DO NOT

Create custom CSS classes for:

- `display`
- `flex-direction`
- `gap`
- `padding`
- `margin`
- `width` / `height`
- Alignment
- Border
- shadow

❌ **Forbidden**

```css
.page-container {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border: 1px solid lightgray;
}
```

✅ **Required**

```html
<div class="flex flex-column p-3 gap-2 h-full border-1 border-300"></div>
```

### 20.3 When Custom CSS Is Allowed (Very Limited)

Custom CSS classes are allowed ONLY for:

**Visual styling not covered by PrimeFlex:**

- Custom width/height. eg: 300px;
- Brand-specific visuals

**Component-specific behavior:**

- Animations
- Transitions
- Canvas / charts
- Third-party integration overrides

🚫 **Never for layout**

### 20.4 Utility-First Over Semantic Classes (Mandatory)

**Rule:**

Prefer PrimeFlex utility classes over semantic container classes.

❌ **Avoid**

```html
<div class="kanban-container"></div>
```

✅ **Use**

```html
<div class="flex flex-column gap-3 p-3"></div>
```

If semantic meaning is required:

- Use data attributes
- Or Angular component selectors, not CSS layout classes

### 20.5 No Inline Styles, No Raw CSS Values

❌ **Forbidden**

```html
<div style="padding: 16px; display: flex;"></div>
```

❌ **Forbidden**

```css
padding: 1rem;
margin: 8px;
gap: 12px;
```

✅ **Required**

```html
<div class="p-3 m-2 gap-2 flex"></div>
```

### 20.6 AI Output Validation Rule (Critical)

Any AI-generated UI code must pass this checklist:

- ☑ No `display: flex`
- ☑ No `flex-direction`
- ☑ No `padding/margin` in custom CSS
- ☑ No `border/shadow` in custom css
- ☑ Uses PrimeFlex classes only
- ☑ Matches existing Alpha System patterns

**If not → output is invalid**

> "Do not create custom CSS classes for layout, spacing, margin/padding, border/shadow or flex/grid behavior. Always use PrimeFlex utility classes instead. Any solution using raw CSS for layout is invalid."

> "Any AI-generated UI or frontend code that violates PrimeNG or PrimeFlex rules defined in this document must be considered invalid and rejected."

---

## 21. Final Golden Rules

1. **PrimeNG only**
2. **PrimeFlex first**
3. **No HEX / RGB**
3. **Font Awesome icons only**
4. **Desktop-first**
5. **Reusable components**
6. **Predictable UX over creativity**
7. **One date format only** – always use DD.MM.YYYY
8. **File uploads must be explicit** – show allowed formats, max size, progress, and clear errors
9. **Empty state = guidance, not failure**
 