#!/usr/bin/env node

/**
 * AI:
 * Status: "confirmed"
 * Type: Widget
 * SubType: GenerationScript
 * Reason: Script to generate widget code via WidgetFactory - PRIMARY mechanism for widget creation
 */

/**
 * Widget Creation Script (MANDATORY)
 *
 * ============================================================================
 * PURPOSE
 * ============================================================================
 *
 * This script is the ONLY mechanism for generating widgets.
 * It ensures all widgets are created via WidgetFactory methods.
 * AI MUST use this script - never manually assemble widgets.
 *
 * ============================================================================
 * USAGE
 * ============================================================================
 *
 *   node create-widget.js --type <type> --alias <alias> --entity <entity> [options]
 *
 * Required:
 *   --type      Widget type: table, list, data, form, object, selectable, treeTable, category
 *   --alias     Widget alias: <module>.<feature>.<entity>.<type>.<variant>
 *   --entity    Entity name: e.g., cr.Customer, bm.Invoice
 *
 * Optional:
 *   --name      Display name (default: derived from entity)
 *   --noDataText  Empty state text (default: "No data found")
 *   --filters   JSON array of filter objects
 *   --sortings  JSON array of sorting objects
 *   --resolveFk Enable FK text resolution (default: false)
 *   --objectId  Object ID for data/form/object widgets
 *   --output    Output format: code, json (default: code)
 *
 * ============================================================================
 * EXAMPLES
 * ============================================================================
 *
 *   # Table widget
 *   node create-widget.js --type table --alias cr.customer.list.table --entity cr.Customer
 *
 *   # Data widget with objectId
 *   node create-widget.js --type data --alias cr.customer.detail.data --entity cr.Customer --objectId 123
 *
 *   # List with filters
 *   node create-widget.js --type list --alias cr.customer.active.list --entity cr.Customer \
 *     --filters '[{"field":"e.status","op":"=","value":"ACTIVE"}]'
 *
 * ============================================================================
 * OUTPUT
 * ============================================================================
 *
 * Outputs TypeScript code with:
 * - AI Javadoc block
 * - WidgetFactory method call
 * - Proper imports
 *
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================

const VALID_TYPES = ['table', 'list', 'data', 'form', 'object', 'selectable', 'treeTable', 'listWithDetail', 'category', 'chart', 'transient'];

const TYPE_TO_FACTORY_METHOD = {
  'table': 'createWidgetTableEntityQl',
  'list': 'createWidgetListEntityQl',
  'data': 'createWidgetEntityData',
  'form': 'createWidgetForm',
  'object': 'createWidgetObject',
  'selectable': 'createWidgetSelectableEntityQl',
  'treeTable': 'createWidgetTreeTableEntityQl',
  'listWithDetail': 'createWidgetListWithDetailEntity',
  'category': 'createWidgetGroupBy',
  'chart': 'createWidgetGroupBy',
  'transient': 'createWidgetTransient'
};

const ALIAS_MIN_SEGMENTS = 3;

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
// VALIDATION
// ============================================

function validateAlias(alias) {
  const segments = alias.split('.');
  if (segments.length < ALIAS_MIN_SEGMENTS) {
    return {
      valid: false,
      error: `Alias '${alias}' has ${segments.length} segment(s), minimum is ${ALIAS_MIN_SEGMENTS}. Use format: <module>.<feature>.<entity>.<type>.<variant>`
    };
  }

  const antiPatterns = [
    /^widget\d*$/i,
    /^myWidget$/i,
    /^test.*$/i,
    /^table\d*$/i,
    /^list\d*$/i
  ];

  for (const pattern of antiPatterns) {
    if (pattern.test(alias)) {
      return {
        valid: false,
        error: `Alias '${alias}' matches anti-pattern. Use descriptive format: <module>.<feature>.<entity>.<type>.<variant>`
      };
    }
  }

  return { valid: true };
}

function validateType(type) {
  if (!VALID_TYPES.includes(type)) {
    return {
      valid: false,
      error: `Invalid type '${type}'. Valid types: ${VALID_TYPES.join(', ')}`
    };
  }
  return { valid: true };
}

function validateEntity(entity) {
  if (!entity || !entity.includes('.')) {
    return {
      valid: false,
      error: `Invalid entity '${entity}'. Must be in format: <module>.<Entity> (e.g., cr.Customer)`
    };
  }
  return { valid: true };
}

// ============================================
// CODE GENERATION
// ============================================

function generateJavadoc(type, alias, entity) {
  const entityName = entity.split('.').pop();
  return `/**
 * AI:
 * Status: "in progress"
 * Type: Widget
 * SubType: Runtime
 * Reason: ${entityName} ${type} widget for displaying ${entityName.toLowerCase()} data
 */`;
}

function generateImports() {
  return `import { WidgetFactory } from 'features/core/shared/widget/service/widget.factory';
import { WidgetData } from 'features/core/shared/widget/widget-data';
import { FilterCriteria } from 'features/core/shared/filter/api/filter.criteria';
import { Sorting } from 'features/core/shared/misc/sorting';`;
}

function generateWidgetCode(options) {
  const { type, alias, entity, name, noDataText, filters, sortings, resolveFk, objectId } = options;
  const factoryMethod = TYPE_TO_FACTORY_METHOD[type];
  const entityName = entity.split('.').pop();
  const displayName = name || entityName + 's';
  const emptyText = noDataText || 'No data found';

  let code = '';
  const javadoc = generateJavadoc(type, alias, entity);

  // Variable declaration
  const varName = alias.split('.').slice(-2).join('').replace(/[.-]/g, '') + 'Widget';

  if (type === 'data' || type === 'form' || type === 'object') {
    // Single record widgets
    const objId = objectId || 0;
    code = `${javadoc}
this.${varName} = WidgetFactory.${factoryMethod}(
  '${alias}',
  '${displayName}',
  '${entity}',
  ${objId}
);`;
  } else if (type === 'category' || type === 'chart') {
    // GroupBy widgets
    code = `${javadoc}
this.${varName} = WidgetFactory.${factoryMethod}(
  '${alias}',
  '${displayName}',
  '${type}',
  'entity.groupBy',
  '${entity}',
  'fieldCategory',  // TODO: Set category field
  'fieldCategoryCount',  // TODO: Set count field
  [],  // filters
  'groupingAttribute',  // TODO: Set grouping attribute
  'attributeLabel'  // TODO: Set attribute label
);`;
  } else if (type === 'transient') {
    // Transient data widgets (in-memory, no backend)
    code = `${javadoc}
this.${varName} = WidgetFactory.${factoryMethod}(
  '${alias}',
  '${displayName}',
  'list',  // uiComponent: 'list', 'table', 'data'
  'transient',  // dataProvider
  'transient',  // dataSource
  '${entity}',  // dataProviderObject
  [  // dataTransient - TODO: Replace with actual data
    { id: 1, name: 'Sample Item 1' },
    { id: 2, name: 'Sample Item 2' }
  ]
);`;
  } else {
    // List-based widgets (table, list, selectable, treeTable, listWithDetail)
    let filterCode = '[]';
    let sortingCode = '[]';

    if (filters) {
      try {
        const filterArray = JSON.parse(filters);
        filterCode = `[\n    ${filterArray.map(f =>
          `FilterCriteria.create('${f.field}', FilterCriteria.cOperatorEqual, ${JSON.stringify(f.value)})`
        ).join(',\n    ')}\n  ]`;
      } catch (e) {
        filterCode = '[]  // TODO: Add filters';
      }
    }

    if (sortings) {
      try {
        const sortingArray = JSON.parse(sortings);
        sortingCode = `[\n    ${sortingArray.map(s =>
          `new Sorting('${s.field}', ${s.asc !== false})`
        ).join(',\n    ')}\n  ]`;
      } catch (e) {
        sortingCode = '[]  // TODO: Add sortings';
      }
    }

    const resolveFkValue = resolveFk === 'true' || resolveFk === true ? 'true' : 'false';

    if (type === 'listWithDetail') {
      code = `${javadoc}
this.${varName} = WidgetFactory.createWidgetListWithDetailEntity(
  '${alias}',
  '${displayName}',
  '${entity}',
  '${emptyText}',
  ObjectRequestList.createBasic(true, ${filterCode}, ${sortingCode})
);`;
    } else {
      code = `${javadoc}
this.${varName} = WidgetFactory.${factoryMethod}(
  '${alias}',
  '${displayName}',
  '${entity}',
  '${emptyText}',
  ${filterCode},
  ${sortingCode},
  ${resolveFkValue}
);`;
    }
  }

  return code;
}

function generateFullComponent(options) {
  const imports = generateImports();
  const widgetCode = generateWidgetCode(options);

  return `${imports}

// Widget variable declaration
${options.alias.split('.').slice(-2).join('').replace(/[.-]/g, '')}Widget: WidgetData;

// In ngOnInit() or initialization method:
${widgetCode}`;
}

// ============================================
// MAIN EXECUTION
// ============================================

function main() {
  const options = parseArgs();

  // Help
  if (options.help || Object.keys(options).length === 0) {
    console.log(`
Widget Creation Script (MANDATORY)
==================================

Usage:
  node create-widget.js --type <type> --alias <alias> --entity <entity> [options]

Required:
  --type      Widget type: ${VALID_TYPES.join(', ')}
  --alias     Widget alias: <module>.<feature>.<entity>.<type>.<variant>
  --entity    Entity name: e.g., cr.Customer, bm.Invoice

Optional:
  --name      Display name (default: derived from entity)
  --noDataText  Empty state text (default: "No data found")
  --filters   JSON array of filter objects
  --sortings  JSON array of sorting objects
  --resolveFk Enable FK text resolution (default: false)
  --objectId  Object ID for data/form/object widgets
  --output    Output format: code, json (default: code)

Examples:
  # Table widget
  node create-widget.js --type table --alias cr.customer.list.table --entity cr.Customer

  # Data widget with objectId
  node create-widget.js --type data --alias cr.customer.detail.data --entity cr.Customer --objectId 123

  # List with filters
  node create-widget.js --type list --alias cr.customer.active.list --entity cr.Customer \\
    --filters '[{"field":"e.status","op":"=","value":"ACTIVE"}]'
`);
    process.exit(0);
  }

  // Validate required parameters
  const errors = [];

  if (!options.type) {
    errors.push('Missing required parameter: --type');
  } else {
    const typeValidation = validateType(options.type);
    if (!typeValidation.valid) errors.push(typeValidation.error);
  }

  if (!options.alias) {
    errors.push('Missing required parameter: --alias');
  } else {
    const aliasValidation = validateAlias(options.alias);
    if (!aliasValidation.valid) errors.push(aliasValidation.error);
  }

  if (!options.entity) {
    errors.push('Missing required parameter: --entity');
  } else {
    const entityValidation = validateEntity(options.entity);
    if (!entityValidation.valid) errors.push(entityValidation.error);
  }

  if (errors.length > 0) {
    console.error('VALIDATION ERRORS:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  // Generate output
  if (options.output === 'json') {
    const output = {
      status: 'SUCCESS',
      type: options.type,
      alias: options.alias,
      entity: options.entity,
      factoryMethod: TYPE_TO_FACTORY_METHOD[options.type],
      code: generateWidgetCode(options),
      imports: generateImports()
    };
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log('\n' + '='.repeat(60));
    console.log('WIDGET CODE GENERATED');
    console.log('='.repeat(60));
    console.log(generateFullComponent(options));
    console.log('\n' + '='.repeat(60));
    console.log('INSTRUCTIONS:');
    console.log('1. Add imports to your component file');
    console.log('2. Add widget variable declaration to class');
    console.log('3. Add widget creation code to ngOnInit()');
    console.log('4. Run: node check-widget.js <your-file.ts>');
    console.log('='.repeat(60) + '\n');
  }

  process.exit(0);
}

main();
