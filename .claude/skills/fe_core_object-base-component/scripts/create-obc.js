#!/usr/bin/env node

/**
 * OBC Creation Script
 *
 * Generates ObjectBaseComponent code following governance rules.
 * Outputs JSON ONLY for deterministic, script-driven workflow.
 *
 * Usage:
 *   node create-obc.js --entity <entity> --module <module> [options]
 *
 * Required:
 *   --entity    Entity name (PascalCase): Customer, Invoice, SprintTicket
 *   --module    Module alias (2-4 lowercase): cr, bm, sp
 *
 * Optional:
 *   --nav       Include navigation: true/false (default: false)
 *   --widgets   Include widget examples: true/false (default: false)
 *
 * Output: JSON with generated files
 */

const fs = require('fs');
const path = require('path');

// ============================================
// VALIDATION
// ============================================

function validateEntity(entity) {
  if (!entity || entity.length < 2) {
    return { valid: false, error: `Invalid entity '${entity}'. Must be a valid entity name.` };
  }
  if (!/^[A-Z][a-zA-Z]*$/.test(entity)) {
    return { valid: false, error: `Invalid entity '${entity}'. Must be PascalCase.` };
  }
  return { valid: true };
}

function validateModule(module) {
  if (!module || module.length < 2) {
    return { valid: false, error: `Invalid module '${module}'. Must be a valid module alias.` };
  }
  if (!/^[a-z]{2,4}$/.test(module)) {
    return { valid: false, error: `Invalid module '${module}'. Must be 2-4 lowercase letters.` };
  }
  return { valid: true };
}

// ============================================
// CODE GENERATION
// ============================================

function toKebabCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function toCamelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function generateImports(includeNav, includeWidgets) {
  let imports = `import { Component, OnInit, OnDestroy } from '@angular/core';
import { ObjectBaseComponent } from 'features/core/shared/object/mvs-object-base/object-base.component';
import { MvsCoreService } from 'features/core/shared/service/mvs-core.service';
import { MvsMessageService } from 'features/core/shared/service/message/mvs-message.service';
import { ObserverService } from 'features/core/shared/object/service/observer.service';
import { ConfirmationService } from 'primeng/api';`;

  if (includeNav) {
    imports += `
import { UiMode } from 'features/core/shared/object/mvs-object-base/type/ui-mode.type';
import { NavigationItem } from 'features/core/shared/dto/navigation/navigation-item';`;
  }

  if (includeWidgets) {
    imports += `
import { WidgetFactory } from 'features/core/shared/widget/service/widget.factory';
import { WidgetData } from 'features/core/shared/widget/widget-data';
import { FilterCriteria } from 'features/core/shared/filter/api/filter.criteria';
import { Sorting } from 'features/core/shared/misc/sorting';
import { DtoImportObjectContext } from 'features/core/shared/dto/dto.import.object.context';`;
  }

  return imports;
}

function generateComponent(options) {
  const { entity, module, includeNav, includeWidgets } = options;
  const kebabEntity = toKebabCase(entity);
  const camelEntity = toCamelCase(entity);

  const imports = generateImports(includeNav, includeWidgets);

  let classBody = '';

  if (includeNav) {
    classBody += `
  navigationItems: NavigationItem[];
`;
  }

  if (includeWidgets) {
    classBody += `
  relatedWidget: WidgetData;
`;
  }

  classBody += `
  onObjectChanged(): void {
    this.setPageTitle(\`\${this.dto.name} - ${entity}\`);`;

  if (includeNav) {
    classBody += `

    this.navigationItems = this.getNavigation(this.uiMode);
    this.onNavigationItems.emit(this.navigationItems);`;
  }

  if (includeWidgets) {
    classBody += `

    this.createRelatedWidget();`;
  }

  classBody += `
  }`;

  if (includeNav) {
    classBody += `

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

  handleActiveNavigationItemsChange(item: NavigationItem): void {
    this.activeNavigationItem = item;
    this.activeNavigationItemsChange.emit(item);
  }`;
  }

  if (includeWidgets) {
    classBody += `

  createRelatedWidget(): void {
    const filters = [
      FilterCriteria.create('e.${camelEntity}Id', FilterCriteria.cOperatorEqual, this.dto.id)
    ];

    this.relatedWidget = WidgetFactory.createWidgetTableEntityQl(
      '${module}.${camelEntity}.\${this.dto.id}.related.table',
      'Related Items',
      '${module}.RelatedEntity',
      'No related items found',
      filters,
      [],
      false
    );

    this.relatedWidget.importObjectContext =
      DtoImportObjectContext.createFromObjectIdentifier(this.objectIdentifier);
  }`;
  }

  classBody += `

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }`;

  return `${imports}

@Component({
  selector: '${module}-${kebabEntity}-detail',
  templateUrl: './${kebabEntity}-detail.component.html',
  styleUrls: ['./${kebabEntity}-detail.component.scss'],
  standalone: false
})
export class ${entity}DetailComponent extends ObjectBaseComponent implements OnInit, OnDestroy {

  constructor(
    protected coreService: MvsCoreService,
    protected messageService: MvsMessageService,
    protected confirmationService: ConfirmationService,
    protected observerService: ObserverService
  ) {
    super(coreService, messageService, confirmationService, observerService);
  }
${classBody}
}`;
}

function generateTemplate(options) {
  const { entity, includeNav } = options;

  let navContent = '';
  if (includeNav) {
    navContent = `
    @if (activeNavigationItem?.action === 'details') {
      <div class="details-section">
        <div class="grid">
          <div class="col-12 md:col-6">
            <div class="field">
              <label>Name</label>
              <p>{{ dto.name }}</p>
            </div>
          </div>
        </div>
      </div>
    }

    @if (activeNavigationItem?.action === 'related') {
      <div class="related-section">
        <mvs-widget [widgetData]="relatedWidget"></mvs-widget>
      </div>
    }`;
  } else {
    navContent = `
    <div class="details-section">
      <div class="grid">
        <div class="col-12 md:col-6">
          <div class="field">
            <label>Name</label>
            <p>{{ dto.name }}</p>
          </div>
        </div>
      </div>
    </div>`;
  }

  return `@if (initialized && dto) {
  <div class="${toKebabCase(entity)}-detail">

    <div class="header flex justify-content-between align-items-center mb-3">
      <h2 class="m-0">{{ dto.name }}</h2>
    </div>
${navContent}

  </div>
} @else if (busy) {
  <div class="flex justify-content-center p-5">
    <p-progressSpinner></p-progressSpinner>
  </div>
} @else {
  <p-message severity="info" text="No ${entity.toLowerCase()} data available"></p-message>
}`;
}

function generateStyles(entity) {
  return `.${toKebabCase(entity)}-detail {
  .header {
    padding: 1rem;
    border-bottom: 1px solid var(--surface-border);
  }

  .details-section,
  .related-section {
    padding: 1rem;
  }

  .field {
    margin-bottom: 1rem;

    label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--text-color-secondary);
    }
  }
}`;
}

function generateDirectoryPath(module, entity) {
  const kebabEntity = toKebabCase(entity);
  return `frontend/features/feature-<area>/${module}/component/object-components/${kebabEntity}-object-component/`;
}

// ============================================
// ARGUMENT PARSING
// ============================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[i + 1];
      if (value && !value.startsWith('--')) {
        options[key] = value;
        i++;
      } else {
        options[key] = true;
      }
    }
  }

  return options;
}

// ============================================
// MAIN EXECUTION
// ============================================

function main() {
  const options = parseArgs();

  // Help
  if (options.help) {
    console.log(JSON.stringify({
      status: 'HELP',
      usage: 'node create-obc.js --entity <entity> --module <module> [--nav true] [--widgets true]',
      required: {
        entity: 'Entity name (PascalCase): Customer, Invoice',
        module: 'Module alias (2-4 lowercase): cr, bm'
      },
      optional: {
        nav: 'Include navigation (default: false)',
        widgets: 'Include widget examples (default: false)'
      }
    }, null, 2));
    process.exit(0);
  }

  // Validate required parameters
  const validationErrors = [];

  if (!options.entity) {
    validationErrors.push('Missing required parameter: --entity');
  } else {
    const entityValidation = validateEntity(options.entity);
    if (!entityValidation.valid) validationErrors.push(entityValidation.error);
  }

  if (!options.module) {
    validationErrors.push('Missing required parameter: --module');
  } else {
    const moduleValidation = validateModule(options.module);
    if (!moduleValidation.valid) validationErrors.push(moduleValidation.error);
  }

  if (validationErrors.length > 0) {
    console.log(JSON.stringify({
      status: 'ERROR',
      errors: validationErrors
    }, null, 2));
    process.exit(1);
  }

  // Parse boolean options
  const includeNav = options.nav === 'true' || options.nav === true;
  const includeWidgets = options.widgets === 'true' || options.widgets === true;

  const genOptions = {
    entity: options.entity,
    module: options.module,
    includeNav,
    includeWidgets
  };

  const kebabEntity = toKebabCase(options.entity);

  // Generate JSON output
  const output = {
    status: 'SUCCESS',
    entity: options.entity,
    module: options.module,
    options: {
      nav: includeNav,
      widgets: includeWidgets
    },
    directory: generateDirectoryPath(options.module, options.entity),
    files: [
      {
        filename: `${kebabEntity}-detail.component.ts`,
        content: generateComponent(genOptions)
      },
      {
        filename: `${kebabEntity}-detail.component.html`,
        content: generateTemplate(genOptions)
      },
      {
        filename: `${kebabEntity}-detail.component.scss`,
        content: generateStyles(options.entity)
      }
    ],
    nextSteps: [
      'Create directory at specified path',
      'Create the three files with provided content',
      'Register component in module declarations',
      'Implement getObjectComponent() in entity service',
      'Run: node check-obc.js <path-to-component.ts>'
    ]
  };

  console.log(JSON.stringify(output, null, 2));
  process.exit(0);
}

main();
