#!/usr/bin/env node

/**
 * AI:
 * Status: "confirmed"
 * Type: Component
 * SubType: ValidationScript
 * Reason: Script to validate CRUD components - outputs JSON ONLY
 */

/**
 * CRUD Component Validation Script (MANDATORY)
 *
 * ============================================================================
 * PURPOSE
 * ============================================================================
 *
 * Validates CRUD Object Component usage against governance rules.
 * Outputs JSON ONLY for deterministic, script-driven validation.
 *
 * ============================================================================
 * USAGE
 * ============================================================================
 *
 *   node check-crud.js <path> [<path> ...]
 *
 * ============================================================================
 * OUTPUT FORMAT
 * ============================================================================
 *
 * {
 *   "status": "PASSED | FAILED",
 *   "checkedFiles": number,
 *   "violations": [
 *     {
 *       "ruleId": "G001",
 *       "file": "relative/path.ts",
 *       "line": number,
 *       "description": "short"
 *     }
 *   ]
 * }
 *
 */

const fs = require('fs');
const path = require('path');

// ============================================
// RULES
// ============================================

const RULES = {
  // AI Javadoc
  G001: 'G001-ai-javadoc-ts',
  G002: 'G002-status-field',
  G003: 'G003-type-field',
  G004: 'G004-subtype-field',
  G005: 'G005-reason-field',
  G006: 'G006-ai-javadoc-html',
  G007: 'G007-html-fields',
  G008: 'G008-inline-comment',
  // Required Bindings
  G101: 'G101-objectType-required',
  G102: 'G102-onChangedObject-required',
  // Event Handler
  G201: 'G201-handler-exists',
  G202: 'G202-handler-checks-action',
  // Imports
  G301: 'G301-import-ObjectChangeInformation',
  G302: 'G302-import-DtoImportObjectContext',
  // Template Guards
  G401: 'G401-template-guard',
  // Best Practices
  G501: 'G501-dirty-tracking',
  G502: 'G502-canDeactivate',
  G503: 'G503-no-duplicate-crud',
  // Anti-patterns
  G601: 'G601-no-readonly'
};

// ============================================
// RESULT TRACKING
// ============================================

let violations = [];
let checkedFiles = 0;

function addViolation(ruleId, file, line, description) {
  violations.push({
    ruleId,
    file: path.relative(process.cwd(), file),
    line,
    description
  });
}

function findLineNumber(content, searchStr) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchStr)) {
      return i + 1;
    }
  }
  return 0;
}

// ============================================
// FILE UTILITIES
// ============================================

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function getTemplateContent(tsPath, tsContent) {
  const templateUrlMatch = tsContent.match(/templateUrl\s*:\s*['"]([^'"]+)['"]/);
  if (templateUrlMatch) {
    const templatePath = path.resolve(path.dirname(tsPath), templateUrlMatch[1]);
    return { content: readFile(templatePath), path: templatePath };
  }
  const inlineMatch = tsContent.match(/template\s*:\s*`([^`]+)`/s);
  return inlineMatch ? { content: inlineMatch[1], path: null } : { content: null, path: null };
}

function usesCrudComponent(content) {
  return content && (
    content.includes('<mvs-crud-object') ||
    content.includes('ObjectChangeInformation') ||
    content.includes('onChangedObject')
  );
}

// ============================================
// VALIDATION RULES
// ============================================

function checkTsJavadoc(content, filePath) {
  const javadocPattern = /\/\*\*[\s\S]*?\*\s*AI:[\s\S]*?\*\//;
  const javadocMatch = content.match(javadocPattern);

  if (!javadocMatch) {
    addViolation(RULES.G001, filePath, 1, 'Missing AI Javadoc block');
    return;
  }

  const javadoc = javadocMatch[0];
  const javadocLine = findLineNumber(content, '* AI:');

  // Status
  if (!javadoc.match(/Status:\s*"(in progress|confirmed)"/)) {
    addViolation(RULES.G002, filePath, javadocLine, 'Status must be "in progress" or "confirmed"');
  }

  // Type
  if (!javadoc.match(/Type:\s*(Page|Component)/)) {
    addViolation(RULES.G003, filePath, javadocLine, 'Type must be Page or Component');
  }

  // SubType
  if (!javadoc.match(/SubType:\s*(CreatePage|EditPage|CreateEditPage|CrudIntegration)/)) {
    addViolation(RULES.G004, filePath, javadocLine, 'Invalid SubType for CRUD component');
  }

  // Reason
  const reasonMatch = javadoc.match(/Reason:\s*(.+)/);
  if (!reasonMatch || reasonMatch[1].trim().length < 15) {
    addViolation(RULES.G005, filePath, javadocLine, 'Reason must be descriptive (min 15 chars)');
  }
}

function checkHtmlJavadoc(templateContent, templatePath, filePath) {
  if (!templateContent) return;

  const htmlJavadocPattern = /<!--[\s\S]*?AI:[\s\S]*?-->/;
  const htmlJavadocMatch = templateContent.match(htmlJavadocPattern);

  if (!htmlJavadocMatch) {
    addViolation(RULES.G006, templatePath || filePath, 1, 'Missing AI Javadoc in HTML');
    return;
  }

  const htmlJavadoc = htmlJavadocMatch[0];
  const hasAllFields = htmlJavadoc.includes('Status:') &&
                       htmlJavadoc.includes('Type:') &&
                       htmlJavadoc.includes('SubType:') &&
                       htmlJavadoc.includes('Reason:');

  if (!hasAllFields) {
    addViolation(RULES.G007, templatePath || filePath, 1, 'HTML Javadoc missing fields');
  }
}

function checkInlineComments(templateContent, templatePath, filePath) {
  if (!templateContent || !templateContent.includes('<mvs-crud-object')) return;

  const crudUsages = templateContent.match(/<mvs-crud-object[^>]*>/g) || [];

  crudUsages.forEach((usage, index) => {
    const usageIndex = templateContent.indexOf(usage);
    const beforeUsage = templateContent.substring(Math.max(0, usageIndex - 200), usageIndex);

    if (!beforeUsage.includes('<!-- AI:') && !beforeUsage.includes('<!--AI:')) {
      const line = findLineNumber(templateContent, usage);
      addViolation(RULES.G008, templatePath || filePath, line, `Missing inline AI comment above mvs-crud-object #${index + 1}`);
    }
  });
}

function checkRequiredBindings(templateContent, templatePath, filePath) {
  if (!templateContent || !templateContent.includes('<mvs-crud-object')) return;

  const crudUsages = templateContent.match(/<mvs-crud-object[^>]*>/g) || [];

  crudUsages.forEach((usage, index) => {
    const line = findLineNumber(templateContent, usage);

    if (!usage.includes('[objectType]')) {
      addViolation(RULES.G101, templatePath || filePath, line, `Missing [objectType] on mvs-crud-object #${index + 1}`);
    }

    if (!usage.includes('(onChangedObject)')) {
      addViolation(RULES.G102, templatePath || filePath, line, `Missing (onChangedObject) on mvs-crud-object #${index + 1}`);
    }
  });
}

function checkEventHandler(tsContent, templateContent, filePath) {
  if (!templateContent || !templateContent.includes('(onChangedObject)')) return;

  const handlerMatch = templateContent.match(/\(onChangedObject\)\s*=\s*["']([^"'(]+)/);
  if (!handlerMatch) return;

  const handlerName = handlerMatch[1].trim();

  if (!tsContent.includes(handlerName)) {
    addViolation(RULES.G201, filePath, 1, `Handler '${handlerName}' not found`);
    return;
  }

  // Check if handler checks action
  const handlerRegex = new RegExp(`${handlerName}[\\s\\S]*?{([\\s\\S]*?)}`, 'm');
  const handlerBodyMatch = tsContent.match(handlerRegex);

  if (handlerBodyMatch) {
    const body = handlerBodyMatch[1];
    const checksAction = body.includes('.action') ||
                         body.includes('action ===') ||
                         body.includes('ObjectChangeInformationActionEnum');

    if (!checksAction) {
      const line = findLineNumber(tsContent, handlerName);
      addViolation(RULES.G202, filePath, line, 'Handler should check event.action');
    }
  }
}

function checkImports(tsContent, templateContent, filePath) {
  const usesEvents = templateContent && templateContent.includes('(onChangedObject)');
  const usesContext = templateContent && templateContent.includes('[importObjectContext]');

  if (usesEvents && !tsContent.includes('ObjectChangeInformation')) {
    addViolation(RULES.G301, filePath, 1, 'Missing import: ObjectChangeInformation');
  }

  if (usesContext && !tsContent.includes('DtoImportObjectContext')) {
    addViolation(RULES.G302, filePath, 1, 'Missing import: DtoImportObjectContext');
  }
}

function checkTemplateGuards(templateContent, templatePath, filePath) {
  if (!templateContent || !templateContent.includes('<mvs-crud-object')) return;

  const crudUsages = templateContent.match(/<mvs-crud-object[^>]*>/g) || [];

  crudUsages.forEach((usage, index) => {
    if (usage.includes('[objectId]')) {
      const usageIndex = templateContent.indexOf(usage);
      const beforeUsage = templateContent.substring(Math.max(0, usageIndex - 300), usageIndex);

      if (!beforeUsage.includes('@if')) {
        const line = findLineNumber(templateContent, usage);
        addViolation(RULES.G401, templatePath || filePath, line, 'Edit mode should be wrapped in @if guard');
      }
    }
  });
}

function checkBestPractices(tsContent, templateContent, filePath) {
  // Dirty tracking
  if (templateContent && templateContent.includes('<mvs-crud-object') && !templateContent.includes('(onFormDirty)')) {
    addViolation(RULES.G501, filePath, 1, 'Consider using (onFormDirty) for dirty tracking');
  }

  // canDeactivate
  if (templateContent && templateContent.includes('(onFormDirty)') && !tsContent.includes('canDeactivate')) {
    addViolation(RULES.G502, filePath, 1, 'Consider implementing canDeactivate');
  }

  // Duplicate CRUD logic
  if (templateContent && templateContent.includes('<mvs-crud-object')) {
    if (tsContent.includes('crudService.create') ||
        tsContent.includes('crudService.update') ||
        tsContent.includes('crudService.delete')) {
      const line = findLineNumber(tsContent, 'crudService.');
      addViolation(RULES.G503, filePath, line, 'Found manual CRUD calls - let component handle this');
    }
  }

  // readonly misuse
  if (templateContent && templateContent.includes('[readonly]="true"')) {
    const line = findLineNumber(templateContent, '[readonly]');
    addViolation(RULES.G601, filePath, line, 'Use ObjectBaseComponent for read-only views');
  }
}

// ============================================
// FILE PROCESSING
// ============================================

function validateFile(filePath) {
  const tsContent = readFile(filePath);
  if (!tsContent) return;

  const template = getTemplateContent(filePath, tsContent);
  const templateContent = template.content;

  // Skip if not using CRUD component
  if (!usesCrudComponent(tsContent) && !usesCrudComponent(templateContent)) {
    return;
  }

  checkedFiles++;

  // Run all checks
  checkTsJavadoc(tsContent, filePath);
  checkHtmlJavadoc(templateContent, template.path, filePath);
  checkInlineComments(templateContent, template.path, filePath);
  checkRequiredBindings(templateContent, template.path, filePath);
  checkEventHandler(tsContent, templateContent, filePath);
  checkImports(tsContent, templateContent, filePath);
  checkTemplateGuards(templateContent, template.path, filePath);
  checkBestPractices(tsContent, templateContent, filePath);
}

function processPath(inputPath) {
  const resolvedPath = path.resolve(inputPath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(JSON.stringify({
      status: 'ERROR',
      error: `Path not found: ${inputPath}`
    }));
    process.exit(2);
  }

  const stat = fs.statSync(resolvedPath);

  if (stat.isFile()) {
    if (resolvedPath.endsWith('.ts') && !resolvedPath.endsWith('.spec.ts')) {
      validateFile(resolvedPath);
    }
  } else if (stat.isDirectory()) {
    scanDirectory(resolvedPath);
  }
}

function scanDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
        validateFile(fullPath);
      }
    }
  }
}

// ============================================
// MAIN
// ============================================

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
CRUD Component Validation Script
=================================

Usage:
  node check-crud.js <path> [<path> ...]

Output:
  JSON with status, checkedFiles count, and violations array

Rules validated:
  G001-G008: AI Javadoc (TS and HTML)
  G101-G102: Required bindings
  G201-G202: Event handler
  G301-G302: Imports
  G401: Template guards
  G501-G503: Best practices
  G601: Anti-patterns

Examples:
  node check-crud.js ./customer-create-page.component.ts
  node check-crud.js ./src/features/cr/page/
`);
    process.exit(0);
  }

  // Process all paths
  for (const inputPath of args) {
    if (!inputPath.startsWith('--')) {
      processPath(inputPath);
    }
  }

  // Filter out INFO-level violations (G501, G502)
  const errors = violations.filter(v => !v.ruleId.startsWith('G50'));

  // Output JSON result
  const result = {
    status: errors.length === 0 ? 'PASSED' : 'FAILED',
    checkedFiles,
    violations
  };

  console.log(JSON.stringify(result, null, 2));

  process.exit(errors.length === 0 ? 0 : 1);
}

main();
