---
name: object-base-component
description: Code examples for ObjectBaseComponent patterns with templates
---

# ObjectBaseComponent Examples

For governance rules, see `SKILL.md`. For technical reference, see `reference.md`.

---

## 1. Basic OBC

**Path:** `feature-power/lg/component/object-components/logic-object-component/lg-logic-object.component.ts`

```typescript
@Component({
    selector: 'mvs-lg-logic-object-component',
    templateUrl: './lg-logic-object.component.html',
    standalone: false
})
export class LgLogicObjectComponent
    extends ObjectBaseComponent implements OnInit, OnChanges, OnDestroy {

    ngOnInit() {
        super.ngOnInit();
    }

    onObjectChanged() {
        this.setPageTitle(this.dto.name);
    }

    ngOnChanges(changes: SimpleChanges) {
        super.ngOnChanges(changes);
        if (!this.initialized) { return; }
    }

    ngOnDestroy() {
        super.ngOnDestroy();
    }
}
```

---

## 2. OBC Template with UI Mode Switching

**Path:** `lg-logic-object.component.html`

```html
@if (initialized && dto) {
    @if (uiMode == 'side') {
        <mvs-lg-logic-object-component-side
            [objectIdentifier]="objectIdentifier"
            [dto]="dto"
            [uiMode]="uiMode"
            (onNavigationItems)="handleNavigationItems($event)"
        ></mvs-lg-logic-object-component-side>
    } @else {
        <mvs-lg-logic-object-component-full
            [objectIdentifier]="objectIdentifier"
            [dto]="dto"
            [uiMode]="uiMode"
            (onNavigationItems)="handleNavigationItems($event)"
            (onBreadcrumbItems)="handleBreadcrumbItems($event)"
        ></mvs-lg-logic-object-component-full>
    }
}
```

---

## 3. Full View Component (OBMC)

**Path:** `view/lg-logic-object-component-full/lg-logic-object-full.component.ts`

```typescript
@Component({
    selector: 'mvs-lg-logic-object-component-full',
    templateUrl: 'lg-logic-object-full.component.html',
    standalone: false
})
export class LgLogicObjectFullComponent extends LgLogicObjectBaseComponent implements OnInit {

    loadSideBarMenuItems() {
        this.navigationItems = [
            {
                label: 'Logic',
                action: 'Logic',
                tooltip: 'Logic',
                icon: 'fa-regular fa-square-code',
                toggleable: false,
                default: true
            },
            {
                label: 'TestCases',
                action: 'TestCases',
                tooltip: 'Test Cases',
                icon: 'fa-regular fa-flask-vial',
                toggleable: false,
                default: false
            },
        ];

        this.activeNavigationItem = this.navigationItems[0];
        this.handleNavigationItemsChange();
    }
}
```

**Template:** `lg-logic-object-full.component.html`

```html
@if (initialized && dto) {
    @if (activeNavigationItem.action === 'Logic') {
        <div class="grid mt-5">
            <div class="col-12 p-0 lg:col-3">
                <!-- Sidebar with imports/exports -->
                <mvs-lg-variables
                    *ngIf="dto?.id"
                    [variableProviderService]="logicImportService"
                    alias="lg.LogicImport"
                    title="Logic Imports"
                    [contentProviderId]="dto.id"
                ></mvs-lg-variables>
            </div>
            <div class="min-h-screen p-0 col-12 lg:col-9">
                <!-- Main content with code editor -->
                <mvs-code-mirror-editor
                    [editorContent]="script"
                    [logicLanguage]="dto.logicLanguage"
                    (contentChanged)="onContentChange($event)"
                ></mvs-code-mirror-editor>
            </div>
        </div>
    }
    @if (activeNavigationItem.action === 'TestCases') {
        <mvs-lg-test-case [logicId]="objectIdentifier.objectId"></mvs-lg-test-case>
    }
}
```

---

## 4. Side View Component (OBMC)

**Path:** `view/lg-logic-object-component-side/lg-logic-object-side.component.ts`

```typescript
@Component({
    selector: 'mvs-lg-logic-object-component-side',
    templateUrl: 'lg-logic-object-side.component.html',
    standalone: false
})
export class LgLogicObjectSideComponent extends LgLogicObjectBaseComponent implements OnInit {

    loadSideBarMenuItems() {
        this.navigationItems = [
            {
                label: 'logic',
                action: 'logic',
                icon: 'fa-regular fa-square-code',
                tooltip: 'Logic',
                default: true
            },
            {
                label: 'testen',
                action: 'testen',
                icon: 'fa-regular fa-flask-vial',
                tooltip: 'Testen'
            },
            {
                label: 'imports',
                action: 'imports',
                icon: 'fa-regular fa-file-import',
                tooltip: 'Imports'
            },
            {
                label: 'exports',
                action: 'exports',
                icon: 'fa-regular fa-file-export',
                tooltip: 'Exports'
            },
        ];

        this.activeNavigationItem = this.navigationItems[0];
        this.handleNavigationItemsChange();
    }
}
```

**Template:** `lg-logic-object-side.component.html`

```html
@if (initialized) {
    <div class="grid">
        <div class="col-12">
            @if (activeNavigationItem.action === 'logic') {
                <mvs-code-mirror-editor
                    [editorContent]="script"
                    [logicLanguage]="dto.logicLanguage"
                    (contentChanged)="onContentChange($event)"
                ></mvs-code-mirror-editor>
            }
            @if (activeNavigationItem.action === 'imports') {
                <mvs-lg-variables
                    [variableProviderService]="logicImportService"
                    alias="lg.LogicImport"
                    title="Logic Imports"
                    [contentProviderId]="dto.id"
                ></mvs-lg-variables>
            }
            @if (activeNavigationItem.action === 'exports') {
                <mvs-lg-variables
                    [variableProviderService]="logicExportService"
                    alias="lg.LogicExport"
                    title="Logic Exports"
                    [contentProviderId]="dto.id"
                ></mvs-lg-variables>
            }
            @if (activeNavigationItem.action === 'testen') {
                <mvs-lg-test-case [screen]="'sm'" [logicId]="objectIdentifier.objectId"></mvs-lg-test-case>
            }
        </div>
    </div>
}
```

---

## 5. Shared Base Component (OBMC)

**Path:** `view/lg-logic-object-base.component.ts`

```typescript
@Component({
    selector: 'mvs-lg-logic-object-component-base',
    template: '',
    standalone: false
})
export class LgLogicObjectBaseComponent extends ObjectBaseModeComponent implements OnInit {

    dto: LogicDto;
    script: string;

    constructor(
        protected route: ActivatedRoute,
        protected logicService: LogicService
    ) {
        super(route);
    }

    ngOnInit() {
        this.loadSideBarMenuItems();
        super.ngOnInit();

        if (this.dto) {
            this.onObjectChanged();
        } else {
            this.loadData();
        }
        this.initialized = true;
    }

    loadData() {
        this.logicService.get(this.objectIdentifier.objectId).subscribe((res: LogicDto) => {
            this.dto = res;
            this.onObjectChanged();
        });
    }

    loadSideBarMenuItems() {
        // Override in subclasses
    }

    onObjectChanged() {
        this.script = this.dto.script;
    }

    handleNavigationItemsChange(): void {
        this.onNavigationItems.emit(this.navigationItems);
    }
}
```

---

## 6. Service Registration

**Path:** `feature-power/lg/service/api/logic.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class LogicService extends MvsCrudService {

    constructor(protected http: HttpClient) {
        super(http, MvsCrudService.baseUrl + '/lg/logics');
    }

    getObjectComponent(mode?: MvsCrudModeEnum): Type<any> {
        if (mode !== MvsCrudModeEnum.create) {
            return LgLogicObjectComponent;
        }
        return null;
    }
}
```

---

## 7. Constructor Pattern

```typescript
constructor(
    protected coreService: MvsCoreService,
    protected messageService: MvsMessageService,
    protected confirmationService: ConfirmationService,
    protected observerService: ObserverService
) {
    super(coreService, messageService, confirmationService, observerService);
}
```

---

## 8. Navigation with Widget

```typescript
onObjectChanged(): void {
    this.setPageTitle(`${this.dto.name} - Entity`);

    this.navigationItems = this.getNavigation(this.uiMode);
    this.onNavigationItems.emit(this.navigationItems);

    this.createWidgets();
}

override getNavigation(uiMode: UiMode): NavigationItem[] {
    if (uiMode === 'side' || uiMode === 'mini-side') {
        return [
            { label: 'Details', action: 'details', icon: 'fa-regular fa-info-circle', default: true }
        ];
    }
    return [
        { label: 'Details', action: 'details', icon: 'fa-regular fa-info-circle', default: true },
        { label: 'Related', action: 'related', icon: 'fa-regular fa-link' }
    ];
}

createWidgets(): void {
    const filters = [
        FilterCriteria.create('e.entityId', FilterCriteria.cOperatorEqual, this.dto.id)
    ];

    this.relatedWidget = WidgetFactory.createWidgetTableEntityQl(
        `entity.${this.dto.id}.related`,
        'Related Items',
        'module.RelatedEntity',
        'No items found',
        filters,
        [new Sorting('e.name', false)],
        false
    );

    this.relatedWidget.importObjectContext =
        DtoImportObjectContext.createFromObjectIdentifier(this.objectIdentifier);
}
```

---

## 9. Dirty State

```typescript
updateProperty(value: string): void {
    this.dto.property = value;
    this.markAsDirty();
}

save(): void {
    if (!this.isDirty) return;

    this.crudService.update(this.dto).subscribe(
        (saved) => {
            this.dto = saved;
            this.isDirty = false;
            this.messageService.showSuccessMessage('Success', 'Saved');
        },
        (error) => {
            this.messageService.showErrorMessage('Error', 'Save failed');
        }
    );
}
```

---

## 10. Template with Dirty State

```html
@if (initialized && dto) {
    <div class="header">
        <h2>{{ dto.name }}</h2>
        <button
            pButton
            label="Save"
            [disabled]="!isDirty"
            (click)="save()">
        </button>
    </div>

    <input
        type="text"
        [(ngModel)]="dto.name"
        (ngModelChange)="markAsDirty()">
}
```

---

## 11. viewType Handling

**Service:**
```typescript
getObjectComponent(mode?: MvsCrudModeEnum, viewType?: any): Type<any> {
    if (mode === MvsCrudModeEnum.create) return null;
    if (viewType === 'consultant') return EntityConsultantComponent;
    if (viewType === 'mini') return EntityMiniComponent;
    return EntityObjectComponent;
}
```

**OBC:**
```typescript
onObjectChanged(): void {
    if (this.viewType === 'sp' && this.params?.sprintId) {
        this.loadSprintContext(this.params.sprintId);
    }
}
```

---

## Codebase Examples

| Entity | OBC Path |
|--------|----------|
| Logic | `feature-power/lg/component/object-components/logic-object-component/` |
| CalculationLogicType | `feature-power/lg/component/object-components/calculation-logic-type-object-component/` |
| Import | `feature-integration/im/component/object-components/object-component/` |
| Report | `feature-power/rp/component/protected-components/rp-report-component/` |
