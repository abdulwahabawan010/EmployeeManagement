#!/usr/bin/env node

/**
 * AI:
 * Status: "confirmed"
 * Type: Component
 * SubType: GenerationScript
 * Reason: Script to generate CRUD page code - outputs JSON for deterministic generation
 */

/**
 * CRUD Page Creation Script (MANDATORY)
 *
 * ============================================================================
 * PURPOSE
 * ============================================================================
 *
 * Generates CRUD page code following governance rules.
 * AI MUST use this script - never manually assemble CRUD pages.
 *
 * ============================================================================
 * USAGE
 * ============================================================================
 *
 *   node create-crud.js --type=<type> --entity=<Entity> --alias=<alias> [options]
 *
 * Required:
 *   --type      : create | edit | create-child | combined
 *   --entity    : Entity name in PascalCase (e.g., Customer)
 *   --alias     : Entity type alias (e.g., cr.Customer)
 *
 * For create-child:
 *   --parent      : Parent entity name
 *   --parentAlias : Parent entity alias
 *
 * Optional:
 *   --output    : Output format: code, json (default: code)
 *
 */

const fs = require('fs');
const path = require('path');

// ============================================
// ARGUMENT PARSING
// ============================================

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      args[key] = value;
    }
  });
  return args;
}

// ============================================
// UTILITIES
// ============================================

function toKebabCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function toCamelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function generateJavadoc(subType, entity, reason) {
  return `/**
 * AI:
 * Status: "in progress"
 * Type: Page
 * SubType: ${subType}
 * Reason: ${reason}
 */`;
}

function generateHtmlJavadoc(subType, entity, reason) {
  return `<!--
  AI:
  Status: "in progress"
  Type: Page
  SubType: ${subType}
  Reason: ${reason}
-->`;
}

function generateInlineComment(entity, mode, parent = null) {
  if (parent) {
    return `<!-- AI: CRUD Object Component for ${entity} ${mode} with ${parent} context (foreign key pre-filled) -->`;
  }
  return `<!-- AI: CRUD Object Component for ${entity} ${mode} -->`;
}

// ============================================
// GENERATORS
// ============================================

function generateCreatePage(entity, alias) {
  const kebab = toKebabCase(entity);
  const camel = toCamelCase(entity);
  const reason = `${entity} creation page using CRUD Object Component for new ${camel} registration`;

  const ts = `${generateJavadoc('CreatePage', entity, reason)}

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  ObjectChangeInformation,
  ObjectChangeInformationActionEnum
} from 'features/core/shared/logic/object-change-information';

@Component({
  selector: '${kebab}-create-page',
  templateUrl: './${kebab}-create-page.component.html',
  styleUrls: ['./${kebab}-create-page.component.scss'],
  standalone: false
})
export class ${entity}CreatePageComponent {

  constructor(private router: Router) {}

  handle${entity}Created(event: ObjectChangeInformation): void {
    if (event.action === ObjectChangeInformationActionEnum.created) {
      this.router.navigate(['/${kebab}', event.after.id]);
    }
  }
}
`;

  const html = `${generateHtmlJavadoc('CreatePage', entity, reason)}

<div class="page-container">
  <h2>Create ${entity}</h2>

  ${generateInlineComment(entity, 'creation')}
  <mvs-crud-object
    [objectType]="'${alias}'"
    (onChangedObject)="handle${entity}Created($event)">
  </mvs-crud-object>
</div>
`;

  const scss = `.page-container {
  padding: 1rem;
}
`;

  return { ts, html, scss, baseName: `${kebab}-create-page` };
}

function generateEditPage(entity, alias) {
  const kebab = toKebabCase(entity);
  const camel = toCamelCase(entity);
  const reason = `${entity} edit page using CRUD Object Component with navigation guard`;

  const ts = `${generateJavadoc('EditPage', entity, reason)}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ObjectChangeInformation,
  ObjectChangeInformationActionEnum
} from 'features/core/shared/logic/object-change-information';

@Component({
  selector: '${kebab}-edit-page',
  templateUrl: './${kebab}-edit-page.component.html',
  styleUrls: ['./${kebab}-edit-page.component.scss'],
  standalone: false
})
export class ${entity}EditPageComponent implements OnInit {

  ${camel}Id: number;
  formDirty: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.${camel}Id = +this.route.snapshot.params['id'];
  }

  handle${entity}Updated(event: ObjectChangeInformation): void {
    switch (event.action) {
      case ObjectChangeInformationActionEnum.updated:
        this.formDirty = false;
        break;
      case ObjectChangeInformationActionEnum.deleted:
        this.router.navigate(['/${kebab}s']);
        break;
    }
  }

  canDeactivate(): boolean {
    if (this.formDirty) {
      return confirm('You have unsaved changes. Leave anyway?');
    }
    return true;
  }
}
`;

  const html = `${generateHtmlJavadoc('EditPage', entity, reason)}

<div class="page-container">
  <h2>Edit ${entity}</h2>

  @if (${camel}Id) {
    ${generateInlineComment(entity, 'editing')}
    <mvs-crud-object
      [objectType]="'${alias}'"
      [objectId]="${camel}Id"
      (onChangedObject)="handle${entity}Updated($event)"
      (onFormDirty)="formDirty = $event">
    </mvs-crud-object>
  }
</div>
`;

  const scss = `.page-container {
  padding: 1rem;
}
`;

  return { ts, html, scss, baseName: `${kebab}-edit-page` };
}

function generateCreateChildPage(entity, alias, parent, parentAlias) {
  const kebab = toKebabCase(entity);
  const camel = toCamelCase(entity);
  const parentKebab = toKebabCase(parent);
  const parentCamel = toCamelCase(parent);
  const reason = `${entity} creation component with ${parent} context for foreign key pre-fill`;

  const ts = `${generateJavadoc('CrudIntegration', entity, reason)}

import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import {
  ObjectChangeInformation,
  ObjectChangeInformationActionEnum
} from 'features/core/shared/logic/object-change-information';
import { DtoImportObjectContext } from 'features/core/shared/dto/dto.import.object.context';
import { ObjectIdentifier } from 'features/core/shared/basic/object-identifier';

@Component({
  selector: '${parentKebab}-${kebab}-create',
  templateUrl: './${parentKebab}-${kebab}-create.component.html',
  styleUrls: ['./${parentKebab}-${kebab}-create.component.scss'],
  standalone: false
})
export class ${parent}${entity}CreateComponent implements OnInit {

  @Input() ${parentCamel}Id: number;

  ${parentCamel}Context: DtoImportObjectContext;
  showCreate${entity}: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    if (this.${parentCamel}Id) {
      const ${parentCamel}Identifier = new ObjectIdentifier('${parentAlias}', this.${parentCamel}Id);
      this.${parentCamel}Context = DtoImportObjectContext.createFromObjectIdentifier(${parentCamel}Identifier);
    }
  }

  openCreate${entity}(): void {
    this.showCreate${entity} = true;
  }

  handle${entity}Created(event: ObjectChangeInformation): void {
    if (event.action === ObjectChangeInformationActionEnum.created) {
      this.showCreate${entity} = false;
    }
  }

  cancelCreate(): void {
    this.showCreate${entity} = false;
  }
}
`;

  const html = `${generateHtmlJavadoc('CrudIntegration', entity, reason)}

<div class="${kebab}-create-container">
  <button pButton label="Create ${entity}" icon="pi pi-plus" (click)="openCreate${entity}()"></button>

  @if (showCreate${entity} && ${parentCamel}Context) {
    <div class="create-form-container">
      ${generateInlineComment(entity, 'creation', parent)}
      <mvs-crud-object
        [objectType]="'${alias}'"
        [importObjectContext]="${parentCamel}Context"
        (onChangedObject)="handle${entity}Created($event)">
      </mvs-crud-object>

      <button pButton label="Cancel" class="p-button-secondary" (click)="cancelCreate()"></button>
    </div>
  }
</div>
`;

  const scss = `.${kebab}-create-container {
  padding: 1rem;
}

.create-form-container {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
}
`;

  return { ts, html, scss, baseName: `${parentKebab}-${kebab}-create` };
}

function generateCombinedPage(entity, alias) {
  const kebab = toKebabCase(entity);
  const camel = toCamelCase(entity);
  const reason = `${entity} combined create/edit page with automatic mode detection`;

  const ts = `${generateJavadoc('CreateEditPage', entity, reason)}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ObjectChangeInformation,
  ObjectChangeInformationActionEnum
} from 'features/core/shared/logic/object-change-information';

@Component({
  selector: '${kebab}-page',
  templateUrl: './${kebab}-page.component.html',
  styleUrls: ['./${kebab}-page.component.scss'],
  standalone: false
})
export class ${entity}PageComponent implements OnInit {

  ${camel}Id: number | null = null;
  formDirty: boolean = false;
  isCreateMode: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      this.${camel}Id = +idParam;
      this.isCreateMode = false;
    }
  }

  get pageTitle(): string {
    return this.isCreateMode ? 'Create ${entity}' : 'Edit ${entity}';
  }

  handle${entity}Changed(event: ObjectChangeInformation): void {
    switch (event.action) {
      case ObjectChangeInformationActionEnum.created:
        this.router.navigate(['/${kebab}', event.after.id]);
        break;
      case ObjectChangeInformationActionEnum.updated:
        this.formDirty = false;
        break;
      case ObjectChangeInformationActionEnum.deleted:
        this.router.navigate(['/${kebab}s']);
        break;
    }
  }

  canDeactivate(): boolean {
    if (this.formDirty) {
      return confirm('You have unsaved changes. Leave anyway?');
    }
    return true;
  }
}
`;

  const html = `${generateHtmlJavadoc('CreateEditPage', entity, reason)}

<div class="page-container">
  <h2>{{ pageTitle }}</h2>

  @if (isCreateMode) {
    ${generateInlineComment(entity, 'creation (create mode)')}
    <mvs-crud-object
      [objectType]="'${alias}'"
      (onChangedObject)="handle${entity}Changed($event)"
      (onFormDirty)="formDirty = $event">
    </mvs-crud-object>
  } @else if (${camel}Id) {
    ${generateInlineComment(entity, 'editing (edit mode)')}
    <mvs-crud-object
      [objectType]="'${alias}'"
      [objectId]="${camel}Id"
      (onChangedObject)="handle${entity}Changed($event)"
      (onFormDirty)="formDirty = $event">
    </mvs-crud-object>
  }
</div>
`;

  const scss = `.page-container {
  padding: 1rem;
}
`;

  return { ts, html, scss, baseName: `${kebab}-page` };
}

// ============================================
// MAIN
// ============================================

function main() {
  const args = parseArgs();

  if (!args.type || !args.entity || !args.alias) {
    console.log(`
CRUD Page Creation Script
=========================

Usage:
  node create-crud.js --type=<type> --entity=<Entity> --alias=<alias> [options]

Required:
  --type        : create | edit | create-child | combined
  --entity      : Entity name (e.g., Customer)
  --alias       : Entity alias (e.g., cr.Customer)

For create-child:
  --parent      : Parent entity name
  --parentAlias : Parent entity alias

Optional:
  --output      : code | json (default: code)

Examples:
  node create-crud.js --type=create --entity=Customer --alias=cr.Customer
  node create-crud.js --type=edit --entity=Invoice --alias=bm.Invoice
  node create-crud.js --type=create-child --entity=Invoice --alias=bm.Invoice --parent=Customer --parentAlias=cr.Customer
  node create-crud.js --type=combined --entity=Contract --alias=cm.Contract
`);
    process.exit(args.type ? 1 : 0);
  }

  let files;

  switch (args.type) {
    case 'create':
      files = generateCreatePage(args.entity, args.alias);
      break;
    case 'edit':
      files = generateEditPage(args.entity, args.alias);
      break;
    case 'create-child':
      if (!args.parent || !args.parentAlias) {
        console.error('Error: --parent and --parentAlias required for create-child');
        process.exit(1);
      }
      files = generateCreateChildPage(args.entity, args.alias, args.parent, args.parentAlias);
      break;
    case 'combined':
      files = generateCombinedPage(args.entity, args.alias);
      break;
    default:
      console.error(`Error: Unknown type '${args.type}'`);
      process.exit(1);
  }

  if (args.output === 'json') {
    console.log(JSON.stringify({
      status: 'SUCCESS',
      type: args.type,
      entity: args.entity,
      alias: args.alias,
      files: {
        component: files.ts,
        template: files.html,
        styles: files.scss
      },
      baseName: files.baseName
    }, null, 2));
  } else {
    console.log('\n' + '='.repeat(70));
    console.log('CRUD PAGE CODE GENERATED');
    console.log('='.repeat(70));

    console.log(`\n${'─'.repeat(70)}`);
    console.log(`FILE: ${files.baseName}.component.ts`);
    console.log('─'.repeat(70));
    console.log(files.ts);

    console.log(`\n${'─'.repeat(70)}`);
    console.log(`FILE: ${files.baseName}.component.html`);
    console.log('─'.repeat(70));
    console.log(files.html);

    console.log(`\n${'─'.repeat(70)}`);
    console.log(`FILE: ${files.baseName}.component.scss`);
    console.log('─'.repeat(70));
    console.log(files.scss);

    console.log('\n' + '='.repeat(70));
    console.log('Run: node check-crud.js <path-to-component.ts>');
    console.log('='.repeat(70) + '\n');
  }

  process.exit(0);
}

main();
