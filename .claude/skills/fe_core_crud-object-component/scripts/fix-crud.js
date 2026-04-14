#!/usr/bin/env node

/**
 * AI:
 * Status: "confirmed"
 * Type: Component
 * SubType: FixScript
 * Reason: Script to auto-fix CRUD violations - outputs JSON ONLY
 */

/**
 * CRUD Component Auto-Fix Script
 *
 * ============================================================================
 * PURPOSE
 * ============================================================================
 *
 * Automatically fixes safe CRUD violations detected by check-crud.js.
 * Outputs JSON ONLY for deterministic, script-driven workflow.
 *
 * ============================================================================
 * USAGE
 * ============================================================================
 *
 *   node fix-crud.js [--dry-run] <path> [<path> ...]
 *
 * ============================================================================
 * SAFE FIXES (AUTO-APPLIED)
 * ============================================================================
 *
 * G001-G007: AI Javadoc
 *   - Adds or completes AI Javadoc in TS files
 *   - Adds AI Javadoc to HTML templates
 *
 * G301-G302: Imports
 *   - Adds missing ObjectChangeInformation import
 *   - Adds missing DtoImportObjectContext import
 *
 * ============================================================================
 * UNSAFE FIXES (REQUIRE MANUAL REVIEW)
 * ============================================================================
 *
 * G101-G102: Required bindings (template structure)
 * G201-G202: Event handler implementation
 * G401: Template guards
 * G501-G503: Best practices
 *
 */

const fs = require('fs');
const path = require('path');

// ============================================
// RESULT TRACKING
// ============================================

let processedFiles = 0;
let fixedFiles = [];
let skippedFiles = [];
let errors = [];
let dryRun = false;

// ============================================
// UTILITIES
// ============================================

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function extractClassName(content) {
  const match = content.match(/export\s+class\s+(\w+)/);
  return match ? match[1] : 'Component';
}

function extractEntityName(className) {
  const match = className.match(/^(\w+?)(?:Create|Edit|Page)?(?:Page)?Component$/);
  return match ? match[1] : 'Entity';
}

function isClaudeGenerated(content) {
  return /\/\*\*[\s\S]*?\*\s*AI:/.test(content);
}

function hasCompleteAiJavadoc(content) {
  return /\/\*\*[\s\S]*?\*\s*AI:[\s\S]*?Status:[\s\S]*?Type:[\s\S]*?SubType:[\s\S]*?Reason:[\s\S]*?\*\//.test(content);
}

function getTemplateInfo(tsPath, tsContent) {
  const templateUrlMatch = tsContent.match(/templateUrl\s*:\s*['"]([^'"]+)['"]/);
  if (templateUrlMatch) {
    const templatePath = path.resolve(path.dirname(tsPath), templateUrlMatch[1]);
    return { content: readFile(templatePath), path: templatePath };
  }
  return { content: null, path: null };
}

function usesCrudComponent(content) {
  return content && (
    content.includes('<mvs-crud-object') ||
    content.includes('ObjectChangeInformation') ||
    content.includes('onChangedObject')
  );
}

// ============================================
// AI JAVADOC GENERATION
// ============================================

function generateTsJavadoc(content) {
  const className = extractClassName(content);
  const entity = extractEntityName(className);

  let subType = 'CrudIntegration';
  if (className.includes('CreatePage') || className.toLowerCase().includes('create')) {
    subType = 'CreatePage';
  } else if (className.includes('EditPage') || className.toLowerCase().includes('edit')) {
    subType = 'EditPage';
  } else if (className.includes('Page')) {
    subType = 'CreateEditPage';
  }

  return `/**
 * AI:
 * Status: "in progress"
 * Type: Page
 * SubType: ${subType}
 * Reason: ${entity} ${subType === 'CreatePage' ? 'creation' : subType === 'EditPage' ? 'edit' : 'CRUD'} page using CRUD Object Component
 */`;
}

function generateHtmlJavadoc(entity, subType) {
  return `<!--
  AI:
  Status: "in progress"
  Type: Page
  SubType: ${subType}
  Reason: ${entity} ${subType === 'CreatePage' ? 'creation' : subType === 'EditPage' ? 'edit' : 'CRUD'} page template
-->`;
}

// ============================================
// IMPORT GENERATION
// ============================================

const IMPORT_OBJECT_CHANGE_INFO = `import {
  ObjectChangeInformation,
  ObjectChangeInformationActionEnum
} from 'features/core/shared/logic/object-change-information';`;

const IMPORT_CONTEXT = `import { DtoImportObjectContext } from 'features/core/shared/dto/dto.import.object.context';
import { ObjectIdentifier } from 'features/core/shared/basic/object-identifier';`;

// ============================================
// SAFE FIXES
// ============================================

const FIXES = {
  'G001-ai-javadoc': {
    canFix: (content) => {
      return isClaudeGenerated(content) && !hasCompleteAiJavadoc(content);
    },
    fix: (content, filePath) => {
      const javadoc = generateTsJavadoc(content);
      const pattern = /\/\*\*[\s\S]*?\*\s*AI:[\s\S]*?\*\//;
      if (pattern.test(content)) {
        return content.replace(pattern, javadoc);
      }
      return content;
    },
    description: 'Completed AI Javadoc template'
  },

  'G301-import-ObjectChangeInformation': {
    canFix: (content, template) => {
      const usesEvents = template && template.includes('(onChangedObject)');
      return usesEvents && !content.includes('ObjectChangeInformation');
    },
    fix: (content) => {
      // Find last import line
      const importMatch = content.match(/^import .+;$/gm);
      if (importMatch) {
        const lastImport = importMatch[importMatch.length - 1];
        return content.replace(lastImport, lastImport + '\n' + IMPORT_OBJECT_CHANGE_INFO);
      }
      // Add at beginning
      return IMPORT_OBJECT_CHANGE_INFO + '\n\n' + content;
    },
    description: 'Added ObjectChangeInformation import'
  },

  'G302-import-DtoImportObjectContext': {
    canFix: (content, template) => {
      const usesContext = template && template.includes('[importObjectContext]');
      return usesContext && !content.includes('DtoImportObjectContext');
    },
    fix: (content) => {
      const importMatch = content.match(/^import .+;$/gm);
      if (importMatch) {
        const lastImport = importMatch[importMatch.length - 1];
        return content.replace(lastImport, lastImport + '\n' + IMPORT_CONTEXT);
      }
      return IMPORT_CONTEXT + '\n\n' + content;
    },
    description: 'Added DtoImportObjectContext import'
  }
};

const TEMPLATE_FIXES = {
  'G006-html-javadoc': {
    canFix: (templateContent) => {
      return templateContent &&
             templateContent.includes('<mvs-crud-object') &&
             !templateContent.match(/<!--[\s\S]*?AI:[\s\S]*?-->/);
    },
    fix: (templateContent, entity, subType) => {
      const javadoc = generateHtmlJavadoc(entity, subType);
      return javadoc + '\n\n' + templateContent;
    },
    description: 'Added AI Javadoc to HTML template'
  }
};

// ============================================
// UNSAFE RULES (SKIPPED)
// ============================================

function detectUnsafeIssues(tsContent, templateContent, filePath) {
  const issues = [];

  // G101-G102: Missing bindings
  if (templateContent && templateContent.includes('<mvs-crud-object')) {
    const crudUsages = templateContent.match(/<mvs-crud-object[^>]*>/g) || [];
    crudUsages.forEach((usage, i) => {
      if (!usage.includes('[objectType]')) {
        issues.push({ ruleId: 'G101', reason: `mvs-crud-object #${i+1} missing [objectType]` });
      }
      if (!usage.includes('(onChangedObject)')) {
        issues.push({ ruleId: 'G102', reason: `mvs-crud-object #${i+1} missing (onChangedObject)` });
      }
    });
  }

  // G201: Missing handler
  if (templateContent && templateContent.includes('(onChangedObject)')) {
    const handlerMatch = templateContent.match(/\(onChangedObject\)\s*=\s*["']([^"'(]+)/);
    if (handlerMatch && !tsContent.includes(handlerMatch[1])) {
      issues.push({ ruleId: 'G201', reason: `Handler '${handlerMatch[1]}' not found` });
    }
  }

  // G401: Missing template guard
  if (templateContent && templateContent.includes('[objectId]')) {
    const crudUsages = templateContent.match(/<mvs-crud-object[^>]*\[objectId\][^>]*>/g) || [];
    crudUsages.forEach((usage, i) => {
      const usageIndex = templateContent.indexOf(usage);
      const beforeUsage = templateContent.substring(Math.max(0, usageIndex - 300), usageIndex);
      if (!beforeUsage.includes('@if')) {
        issues.push({ ruleId: 'G401', reason: `Edit mode mvs-crud-object #${i+1} not wrapped in @if` });
      }
    });
  }

  return issues;
}

// ============================================
// FILE PROCESSING
// ============================================

function fixFile(filePath) {
  const tsContent = readFile(filePath);
  if (!tsContent) {
    errors.push({ file: path.relative(process.cwd(), filePath), error: 'Cannot read file' });
    return;
  }

  const template = getTemplateInfo(filePath, tsContent);

  // Skip if not using CRUD component
  if (!usesCrudComponent(tsContent) && !usesCrudComponent(template.content)) {
    return;
  }

  processedFiles++;
  const relativePath = path.relative(process.cwd(), filePath);

  let modifiedContent = tsContent;
  const appliedFixes = [];

  // Apply TypeScript fixes
  for (const [ruleId, fix] of Object.entries(FIXES)) {
    if (fix.canFix(modifiedContent, template.content)) {
      modifiedContent = fix.fix(modifiedContent, filePath);
      appliedFixes.push({ ruleId: ruleId.split('-')[0], description: fix.description });
    }
  }

  // Apply template fixes
  if (template.content && template.path) {
    let templateContent = template.content;
    let templateModified = false;

    const className = extractClassName(tsContent);
    const entity = extractEntityName(className);
    let subType = 'CrudIntegration';
    if (className.includes('Create')) subType = 'CreatePage';
    else if (className.includes('Edit')) subType = 'EditPage';

    for (const [ruleId, fix] of Object.entries(TEMPLATE_FIXES)) {
      if (fix.canFix(templateContent)) {
        templateContent = fix.fix(templateContent, entity, subType);
        templateModified = true;
        appliedFixes.push({
          ruleId: ruleId.split('-')[0],
          description: fix.description,
          templateFile: path.relative(process.cwd(), template.path)
        });
      }
    }

    if (templateModified && !dryRun) {
      fs.writeFileSync(template.path, templateContent, 'utf8');
    }
  }

  // Write TypeScript file if modified
  if (appliedFixes.length > 0 && modifiedContent !== tsContent && !dryRun) {
    try {
      fs.writeFileSync(filePath, modifiedContent, 'utf8');
    } catch (e) {
      errors.push({ file: relativePath, error: `Cannot write file: ${e.message}` });
      return;
    }
  }

  // Check for unsafe issues
  const unsafeIssues = detectUnsafeIssues(tsContent, template.content, filePath);

  // Record results
  if (appliedFixes.length > 0) {
    fixedFiles.push({ file: relativePath, fixes: appliedFixes });
  }

  if (unsafeIssues.length > 0) {
    skippedFiles.push({ file: relativePath, issues: unsafeIssues });
  }
}

function processPath(inputPath) {
  const resolvedPath = path.resolve(inputPath);

  if (!fs.existsSync(resolvedPath)) {
    errors.push({ file: inputPath, error: 'Path not found' });
    return;
  }

  const stat = fs.statSync(resolvedPath);

  if (stat.isFile()) {
    if (resolvedPath.endsWith('.ts') && !resolvedPath.endsWith('.spec.ts')) {
      fixFile(resolvedPath);
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
        fixFile(fullPath);
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
CRUD Component Auto-Fix Script
===============================

Usage:
  node fix-crud.js [--dry-run] <path> [<path> ...]

Options:
  --dry-run   Show what would be fixed without making changes

Safe fixes (auto-applied):
  G001-G007: AI Javadoc completion
  G301-G302: Missing imports

Unsafe (skipped, requires manual review):
  G101-G102: Required bindings
  G201-G202: Event handler implementation
  G401: Template guards

Examples:
  node fix-crud.js --dry-run ./customer-create-page.component.ts
  node fix-crud.js ./src/features/cr/page/
`);
    process.exit(0);
  }

  const paths = [];
  for (const arg of args) {
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (!arg.startsWith('--')) {
      paths.push(arg);
    }
  }

  if (paths.length === 0) {
    console.log(JSON.stringify({
      status: 'ERROR',
      error: 'No paths provided'
    }, null, 2));
    process.exit(2);
  }

  // Process paths
  for (const inputPath of paths) {
    processPath(inputPath);
  }

  // Determine status
  let status = 'NO_CHANGES';
  if (fixedFiles.length > 0 && skippedFiles.length === 0) {
    status = 'SUCCESS';
  } else if (fixedFiles.length > 0 && skippedFiles.length > 0) {
    status = 'PARTIAL';
  } else if (skippedFiles.length > 0) {
    status = 'SKIPPED';
  }

  // Output JSON
  const result = {
    status,
    dryRun,
    processedFiles,
    fixedFiles,
    skipped: skippedFiles,
    errors
  };

  console.log(JSON.stringify(result, null, 2));

  process.exit(errors.length > 0 ? 1 : 0);
}

main();
