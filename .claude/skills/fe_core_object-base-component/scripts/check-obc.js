#!/usr/bin/env node

/**
 * OBC Validation Script (MANDATORY)
 *
 * ============================================================================
 * PURPOSE
 * ============================================================================
 *
 * Validates ObjectBaseComponent files against governance rules.
 * Outputs JSON ONLY for deterministic, script-driven validation.
 *
 * ============================================================================
 * USAGE
 * ============================================================================
 *
 *   node check-obc.js <path> [<path> ...]
 *
 * Paths can be:
 *   - Single file: ./component.ts
 *   - Multiple files: ./a.ts ./b.ts
 *   - Directory: ./object-components (scans *.ts files)
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
 *       "ruleId": "string",
 *       "file": "relative/path.ts",
 *       "line": number,
 *       "description": "short",
 *       "code": "single line only",
 *       "severity": "error | warning"
 *     }
 *   ]
 * }
 *
 * ============================================================================
 * RULES VALIDATED
 * ============================================================================
 *
 * CRITICAL (errors - must fix):
 * G3.x: Inheritance (extends ObjectBaseComponent, implements OnInit)
 * G4.x: Lifecycle (super calls, onObjectChanged, no refreshObject in onObjectChanged)
 *
 * IMPORTANT (warnings - should fix):
 * G5.x: Navigation (navigationItems declared, events emitted, correct import)
 * G6.x: Template (initialized && dto guards, Angular 17+ control flow)
 * G7.x: Dirty State (markAsDirty called)
 *
 * INFO (suggestions):
 * G2.x: File Structure (object-components/ recommended location)
 *
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================

const RULES = {
  // File Structure (INFO - suggestions)
  G2_1: 'G2.1-object-components-directory',
  G2_3: 'G2.3-separate-template',
  G2_4: 'G2.4-separate-styles',
  // Inheritance (CRITICAL)
  G3_1: 'G3.1-extends-obc',
  G3_2: 'G3.2-implements-oninit',
  // Lifecycle (CRITICAL)
  G4_1: 'G4.1-super-ngoninit',
  G4_2: 'G4.2-onobjectchanged',
  G4_3: 'G4.3-no-refresh-in-onobjectchanged',
  G4_4: 'G4.4-super-ngondestroy',
  G4_5: 'G4.5-super-constructor',
  G4_6: 'G4.6-super-ngonchanges',
  // Navigation (IMPORTANT)
  G5_1: 'G5.1-navigationitems-declared',
  G5_2: 'G5.2-onnavigationitems-emitted',
  G5_4: 'G5.4-correct-import-path',
  G5_5: 'G5.5-action-not-route',
  // Template (IMPORTANT)
  G6_1: 'G6.1-template-guards',
  G6_2: 'G6.2-angular17-control-flow',
  // Dirty State (IMPORTANT)
  G7_1: 'G7.1-markAsDirty'
};

// ============================================
// RESULT TRACKING
// ============================================

let violations = [];
let checkedFiles = 0;

function addViolation(ruleId, file, line, description, code, severity = 'error') {
  violations.push({
    ruleId,
    file: path.relative(process.cwd(), file),
    line,
    description,
    code: code ? code.trim().substring(0, 100) : '',
    severity
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

function getLineContent(content, lineNum) {
  const lines = content.split('\n');
  return lines[lineNum - 1] || '';
}

// ============================================
// VALIDATION RULES
// ============================================

/**
 * G2.x: File structure validation (INFO - suggestions)
 */
function checkFileStructure(content, filePath) {
  // G2.1: Recommend object-components directory (info only)
  if (!filePath.includes('object-components')) {
    addViolation(RULES.G2_1, filePath, 1, 'OBC should be in object-components/ directory (recommended)', '', 'info');
  }

  // G2.3: Must have separate template file (templateUrl, not inline template)
  if (content.includes('template:') && content.includes('`')) {
    const line = findLineNumber(content, 'template:');
    addViolation(RULES.G2_3, filePath, line, 'Must use templateUrl with separate file (no inline templates)', getLineContent(content, line), 'warning');
  }

  // G2.4: Must have separate styles file
  if (content.includes('styles:') && content.includes('`')) {
    const line = findLineNumber(content, 'styles:');
    addViolation(RULES.G2_4, filePath, line, 'Must use styleUrls with separate file (no inline styles)', getLineContent(content, line), 'warning');
  }
}

/**
 * G3.x: Inheritance validation (CRITICAL)
 */
function checkInheritance(content, filePath) {
  // G3.1: Must extend ObjectBaseComponent or ObjectBaseModeComponent
  const extendsObc = content.includes('extends ObjectBaseComponent') ||
                     content.includes('extends ObjectBaseModeComponent');

  if (!extendsObc) {
    // Check if it extends another OBC (which is valid for extension pattern)
    const extendsMatch = content.match(/extends\s+(\w+Component)/);
    if (!extendsMatch) {
      addViolation(RULES.G3_1, filePath, 1, 'Must extend ObjectBaseComponent or ObjectBaseModeComponent', '', 'error');
    }
  }

  // G3.2: Should implement OnInit (warning, not error)
  if (!content.includes('implements') || !content.includes('OnInit')) {
    const classLine = findLineNumber(content, 'export class');
    addViolation(RULES.G3_2, filePath, classLine, 'Should implement OnInit interface', getLineContent(content, classLine), 'warning');
  }
}

/**
 * G4.x: Lifecycle validation (CRITICAL)
 */
function checkLifecycle(content, filePath) {
  // G4.1: super.ngOnInit() called if ngOnInit exists
  if (content.includes('ngOnInit(') || content.includes('ngOnInit ()')) {
    if (!content.includes('super.ngOnInit()')) {
      const line = findLineNumber(content, 'ngOnInit');
      addViolation(RULES.G4_1, filePath, line, 'Must call super.ngOnInit() when overriding ngOnInit', getLineContent(content, line), 'error');
    }
  }

  // G4.2: onObjectChanged implemented (for OBC, not OBMC)
  if (content.includes('extends ObjectBaseComponent')) {
    if (!content.includes('onObjectChanged(') && !content.includes('onObjectChanged ()')) {
      addViolation(RULES.G4_2, filePath, 1, 'Must implement onObjectChanged() method', '', 'error');
    }
  }

  // G4.3: No refreshObject in onObjectChanged (CRITICAL - causes infinite loop)
  const onObjectChangedMatch = content.match(/onObjectChanged\s*\([^)]*\)\s*[:{][^}]*refreshObject\s*\(/s);
  if (onObjectChangedMatch) {
    const line = findLineNumber(content, 'refreshObject');
    addViolation(RULES.G4_3, filePath, line, 'NEVER call refreshObject() inside onObjectChanged() - causes infinite loop', getLineContent(content, line), 'error');
  }

  // G4.4: super.ngOnDestroy() called if ngOnDestroy exists
  if (content.includes('ngOnDestroy(') || content.includes('ngOnDestroy ()')) {
    if (!content.includes('super.ngOnDestroy()')) {
      const line = findLineNumber(content, 'ngOnDestroy');
      addViolation(RULES.G4_4, filePath, line, 'Must call super.ngOnDestroy() when overriding ngOnDestroy', getLineContent(content, line), 'error');
    }
  }

  // G4.5: Constructor calls super()
  if (content.includes('constructor(')) {
    if (!content.includes('super(')) {
      const line = findLineNumber(content, 'constructor');
      addViolation(RULES.G4_5, filePath, line, 'Constructor must call super()', getLineContent(content, line), 'error');
    }
  }

  // G4.6: super.ngOnChanges() called if ngOnChanges exists
  if (content.includes('ngOnChanges(') || content.includes('ngOnChanges ()')) {
    if (!content.includes('super.ngOnChanges(')) {
      const line = findLineNumber(content, 'ngOnChanges');
      addViolation(RULES.G4_6, filePath, line, 'Must call super.ngOnChanges(changes) when overriding ngOnChanges', getLineContent(content, line), 'warning');
    }
  }
}

/**
 * G5.x: Navigation validation (only if navigation is used)
 */
function checkNavigation(content, filePath) {
  const usesNavigation = content.includes('NavigationItem') ||
                         content.includes('navigationItems') ||
                         content.includes('getNavigation');

  if (!usesNavigation) return; // Skip if no navigation

  // G5.1: navigationItems declared
  if (!content.includes('navigationItems:') && !content.includes('navigationItems =')) {
    addViolation(RULES.G5_1, filePath, 1, 'Must declare navigationItems property when using navigation', '', 'warning');
  }

  // G5.2: onNavigationItems emitted
  if (!content.includes('onNavigationItems.emit')) {
    addViolation(RULES.G5_2, filePath, 1, 'Must emit onNavigationItems when navigation items are set', '', 'warning');
  }

  // G5.4: Correct import path
  if (content.includes('NavigationItem')) {
    const wrongImport = content.includes("from 'features/core/shared/navigation/navigation-item'");
    if (wrongImport) {
      const line = findLineNumber(content, 'NavigationItem');
      addViolation(RULES.G5_4, filePath, line, "Wrong import path. Use 'features/core/shared/dto/navigation/navigation-item'", '', 'error');
    }
  }

  // G5.5: Must use 'action' not 'route' in NavigationItem
  if (content.includes('route:') && content.includes('NavigationItem')) {
    const line = findLineNumber(content, 'route:');
    addViolation(RULES.G5_5, filePath, line, "NavigationItem uses 'action' property, NOT 'route'", getLineContent(content, line), 'error');
  }
}

/**
 * G6.x: Template validation
 */
function checkTemplate(content, filePath, templatePath) {
  // Try to read the template file
  let templateContent = '';
  if (templatePath && fs.existsSync(templatePath)) {
    try {
      templateContent = fs.readFileSync(templatePath, 'utf8');
    } catch (e) {
      // Template file not readable
    }
  }

  if (templateContent) {
    // G6.1: Must have @if (initialized && dto) guards
    if (!templateContent.includes('@if (initialized && dto)') &&
        !templateContent.includes('@if(initialized && dto)') &&
        !templateContent.includes('*ngIf="initialized && dto"')) {
      addViolation(RULES.G6_1, templatePath || filePath, 1, 'Template should have @if (initialized && dto) guard', '', 'warning');
    }

    // G6.2: Should use Angular 17+ control flow
    if (templateContent.includes('*ngIf') || templateContent.includes('*ngFor')) {
      const line = templateContent.includes('*ngIf')
        ? findLineNumber(templateContent, '*ngIf')
        : findLineNumber(templateContent, '*ngFor');
      addViolation(RULES.G6_2, templatePath || filePath, line, 'Should use Angular 17+ control flow (@if, @for) instead of *ngIf/*ngFor', '', 'info');
    }
  }
}

// ============================================
// FILE PROCESSING
// ============================================

function validateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Skip if not an OBC component (check for common OBC indicators)
    const isObc = content.includes('ObjectBaseComponent') ||
                  content.includes('ObjectBaseModeComponent') ||
                  (content.includes('extends') && content.includes('Component') && content.includes('onObjectChanged'));

    if (!isObc) {
      return;
    }

    checkedFiles++;

    // Run all checks
    checkFileStructure(content, filePath);
    checkInheritance(content, filePath);
    checkLifecycle(content, filePath);
    checkNavigation(content, filePath);

    // Try to find and check template file
    const templateMatch = content.match(/templateUrl:\s*['"]\.\/([^'"]+)['"]/);
    if (templateMatch) {
      const templatePath = path.join(path.dirname(filePath), templateMatch[1]);
      checkTemplate(content, filePath, templatePath);
    }
  } catch (err) {
    // File read error - skip silently
  }
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
// MAIN EXECUTION
// ============================================

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
OBC Validation Script
=====================

Usage:
  node check-obc.js <path> [<path> ...]

Paths can be:
  - Single file: ./component.ts
  - Multiple files: ./a.ts ./b.ts
  - Directory: ./object-components (scans *.ts files)

Output:
  JSON with status, checkedFiles count, and violations array

Rules validated:
  CRITICAL (errors):
    G3.x: Inheritance (extends OBC, implements OnInit)
    G4.x: Lifecycle (super calls, onObjectChanged)

  IMPORTANT (warnings):
    G5.x: Navigation (when used)
    G6.x: Template (guards, Angular 17+ control flow)

  INFO (suggestions):
    G2.x: File location (object-components/ recommended)

Examples:
  node check-obc.js ./customer-detail.component.ts
  node check-obc.js ./object-components/
`);
    process.exit(0);
  }

  // Process all provided paths
  for (const inputPath of args) {
    if (!inputPath.startsWith('--')) {
      processPath(inputPath);
    }
  }

  // Count errors vs warnings
  const errors = violations.filter(v => v.severity === 'error');
  const warnings = violations.filter(v => v.severity === 'warning');
  const infos = violations.filter(v => v.severity === 'info');

  // Output JSON result
  const result = {
    status: errors.length === 0 ? 'PASSED' : 'FAILED',
    checkedFiles,
    summary: {
      errors: errors.length,
      warnings: warnings.length,
      info: infos.length
    },
    violations
  };

  console.log(JSON.stringify(result, null, 2));

  process.exit(errors.length === 0 ? 0 : 1);
}

main();
