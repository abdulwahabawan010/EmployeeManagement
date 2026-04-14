#!/usr/bin/env node

/**
 * Validate All OBCs Script
 *
 * Scans a directory recursively, validates all ObjectBaseComponent files.
 * Outputs JSON ONLY for deterministic, script-driven workflow.
 *
 * Usage:
 *   node validate-all-obcs.js <directory>
 *
 * Output: JSON with validation results
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================

const RULES = {
  G2_1: { id: 'G2.1', desc: 'OBC in object-components/ directory', severity: 'info' },
  G2_3: { id: 'G2.3', desc: 'Separate template file', severity: 'warning' },
  G2_4: { id: 'G2.4', desc: 'Separate styles file', severity: 'warning' },
  G1_1: { id: 'G1.1', desc: 'Extends ObjectBaseComponent', severity: 'error' },
  G1_2: { id: 'G1.2', desc: 'Implements OnInit', severity: 'warning' },
  G2_1: { id: 'G2.1', desc: 'super.ngOnInit()', severity: 'error' },
  G2_2: { id: 'G2.2', desc: 'super.ngOnDestroy()', severity: 'error' },
  G2_3: { id: 'G2.3', desc: 'super.ngOnChanges()', severity: 'warning' },
  G2_4: { id: 'G2.4', desc: 'onObjectChanged()', severity: 'error' },
  G2_5: { id: 'G2.5', desc: 'No refreshObject in onObjectChanged', severity: 'error' },
  G3_1: { id: 'G3.1', desc: 'Template guards', severity: 'warning' },
  G3_2: { id: 'G3.2', desc: 'Angular 17+ control flow', severity: 'info' },
  G4_1: { id: 'G4.1', desc: 'getObjectComponent()', severity: 'error' },
  G6_1: { id: 'G6.1', desc: 'navigationItems declared', severity: 'warning' },
  G6_2: { id: 'G6.2', desc: 'onNavigationItems emitted', severity: 'warning' },
  G6_3: { id: 'G6.3', desc: 'action not route', severity: 'error' },
  G6_4: { id: 'G6.4', desc: 'Correct import path', severity: 'error' }
};

// ============================================
// RESULT TRACKING
// ============================================

let allResults = [];
let totalFiles = 0;
let passedFiles = 0;
let failedFiles = 0;

// ============================================
// UTILITIES
// ============================================

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
// VALIDATION FUNCTIONS
// ============================================

function validateFile(filePath) {
  const violations = [];

  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Skip if not an OBC component
    const isObc = content.includes('ObjectBaseComponent') ||
                  content.includes('ObjectBaseModeComponent') ||
                  (content.includes('extends') && content.includes('Component') && content.includes('onObjectChanged'));

    if (!isObc) {
      return null;
    }

    totalFiles++;

    // G8.1: File location (info)
    if (!filePath.includes('object-components')) {
      violations.push({
        ruleId: 'G8.1',
        description: 'OBC not in object-components/ directory',
        severity: 'info',
        line: 1
      });
    }

    // G2.3: Inline template
    if (content.includes('template:') && content.includes('`')) {
      violations.push({
        ruleId: 'G3.4',
        description: 'Inline template - use separate .html file',
        severity: 'warning',
        line: findLineNumber(content, 'template:')
      });
    }

    // G1.1: Inheritance
    const extendsObc = content.includes('extends ObjectBaseComponent') ||
                       content.includes('extends ObjectBaseModeComponent');
    if (!extendsObc) {
      const extendsMatch = content.match(/extends\s+(\w+Component)/);
      if (!extendsMatch) {
        violations.push({
          ruleId: 'G1.1',
          description: 'Not extending ObjectBaseComponent',
          severity: 'error',
          line: findLineNumber(content, 'export class')
        });
      }
    }

    // G1.2: Implements OnInit
    if (!content.includes('implements') || !content.includes('OnInit')) {
      violations.push({
        ruleId: 'G1.2',
        description: 'Not implementing OnInit',
        severity: 'warning',
        line: findLineNumber(content, 'export class')
      });
    }

    // G2.1: super.ngOnInit()
    if (content.includes('ngOnInit(') || content.includes('ngOnInit ()')) {
      if (!content.includes('super.ngOnInit()')) {
        violations.push({
          ruleId: 'G2.1',
          description: 'Missing super.ngOnInit()',
          severity: 'error',
          line: findLineNumber(content, 'ngOnInit')
        });
      }
    }

    // G2.2: super.ngOnDestroy()
    if (content.includes('ngOnDestroy(') || content.includes('ngOnDestroy ()')) {
      if (!content.includes('super.ngOnDestroy()')) {
        violations.push({
          ruleId: 'G2.2',
          description: 'Missing super.ngOnDestroy()',
          severity: 'error',
          line: findLineNumber(content, 'ngOnDestroy')
        });
      }
    }

    // G2.3: super.ngOnChanges()
    if (content.includes('ngOnChanges(') || content.includes('ngOnChanges ()')) {
      if (!content.includes('super.ngOnChanges(')) {
        violations.push({
          ruleId: 'G2.3',
          description: 'Missing super.ngOnChanges()',
          severity: 'warning',
          line: findLineNumber(content, 'ngOnChanges')
        });
      }
    }

    // G2.4: onObjectChanged (OBC only)
    if (content.includes('extends ObjectBaseComponent')) {
      if (!content.includes('onObjectChanged(') && !content.includes('onObjectChanged ()')) {
        violations.push({
          ruleId: 'G2.4',
          description: 'Missing onObjectChanged()',
          severity: 'error',
          line: 1
        });
      }
    }

    // G2.5: refreshObject in onObjectChanged
    const onObjectChangedMatch = content.match(/onObjectChanged\s*\([^)]*\)\s*[:{][^}]*refreshObject\s*\(/s);
    if (onObjectChangedMatch) {
      violations.push({
        ruleId: 'G2.5',
        description: 'refreshObject() in onObjectChanged() causes infinite loop',
        severity: 'error',
        line: findLineNumber(content, 'refreshObject')
      });
    }

    // G1.3: Constructor super()
    if (content.includes('constructor(')) {
      if (!content.includes('super(')) {
        violations.push({
          ruleId: 'G1.3',
          description: 'Constructor missing super()',
          severity: 'error',
          line: findLineNumber(content, 'constructor')
        });
      }
    }

    // Navigation checks
    const usesNavigation = content.includes('NavigationItem') ||
                           content.includes('navigationItems') ||
                           content.includes('getNavigation');

    if (usesNavigation) {
      // G6.1: navigationItems declared
      if (!content.includes('navigationItems:') && !content.includes('navigationItems =')) {
        violations.push({
          ruleId: 'G6.1',
          description: 'Missing navigationItems property',
          severity: 'warning',
          line: 1
        });
      }

      // G6.2: onNavigationItems emitted
      if (!content.includes('onNavigationItems.emit')) {
        violations.push({
          ruleId: 'G6.2',
          description: 'Not emitting onNavigationItems',
          severity: 'warning',
          line: 1
        });
      }

      // G6.4: Wrong import path
      if (content.includes("from 'features/core/shared/navigation/navigation-item'")) {
        violations.push({
          ruleId: 'G6.4',
          description: 'Wrong NavigationItem import path',
          severity: 'error',
          line: findLineNumber(content, 'NavigationItem')
        });
      }

      // G6.3: route instead of action
      if (content.includes('route:') && content.includes('NavigationItem')) {
        violations.push({
          ruleId: 'G6.3',
          description: 'Using route instead of action in NavigationItem',
          severity: 'error',
          line: findLineNumber(content, 'route:')
        });
      }
    }

    // Template checks
    const templateMatch = content.match(/templateUrl:\s*['"]\.\/([^'"]+)['"]/);
    if (templateMatch) {
      const templatePath = path.join(path.dirname(filePath), templateMatch[1]);
      if (fs.existsSync(templatePath)) {
        const templateContent = fs.readFileSync(templatePath, 'utf8');

        // G3.1: Template guards
        if (!templateContent.includes('@if (initialized && dto)') &&
            !templateContent.includes('@if(initialized && dto)') &&
            !templateContent.includes('*ngIf="initialized && dto"')) {
          violations.push({
            ruleId: 'G3.1',
            description: 'Missing @if (initialized && dto) guard',
            severity: 'warning',
            line: 1,
            file: path.relative(process.cwd(), templatePath)
          });
        }

        // G3.2: Angular 17+ control flow
        if (templateContent.includes('*ngIf') || templateContent.includes('*ngFor')) {
          violations.push({
            ruleId: 'G3.2',
            description: 'Using *ngIf/*ngFor instead of @if/@for',
            severity: 'info',
            line: findLineNumber(templateContent, '*ng'),
            file: path.relative(process.cwd(), templatePath)
          });
        }
      }
    }

    const errors = violations.filter(v => v.severity === 'error');
    const hasFailed = errors.length > 0;

    if (hasFailed) {
      failedFiles++;
    } else {
      passedFiles++;
    }

    return {
      file: path.relative(process.cwd(), filePath),
      status: hasFailed ? 'FAILED' : 'PASSED',
      errors: errors.length,
      warnings: violations.filter(v => v.severity === 'warning').length,
      info: violations.filter(v => v.severity === 'info').length,
      violations
    };

  } catch (err) {
    return null;
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
        const result = validateFile(fullPath);
        if (result) {
          allResults.push(result);
        }
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
    console.log(JSON.stringify({
      status: 'HELP',
      usage: 'node validate-all-obcs.js <directory>',
      description: 'Validates all OBCs in a directory recursively',
      output: 'JSON with validation results for each OBC'
    }, null, 2));
    process.exit(0);
  }

  // Find directory argument
  const directory = args.find(a => !a.startsWith('--'));

  if (!directory) {
    console.log(JSON.stringify({
      status: 'ERROR',
      error: 'No directory specified'
    }, null, 2));
    process.exit(1);
  }

  const resolvedPath = path.resolve(directory);

  if (!fs.existsSync(resolvedPath)) {
    console.log(JSON.stringify({
      status: 'ERROR',
      error: `Directory not found: ${directory}`
    }, null, 2));
    process.exit(1);
  }

  // Scan and validate
  scanDirectory(resolvedPath);

  // Output JSON result
  const output = {
    status: failedFiles > 0 ? 'FAILED' : 'PASSED',
    summary: {
      total: totalFiles,
      passed: passedFiles,
      failed: failedFiles
    },
    failed: allResults.filter(r => r.status === 'FAILED'),
    passed: allResults.filter(r => r.status === 'PASSED')
  };

  console.log(JSON.stringify(output, null, 2));
  process.exit(failedFiles > 0 ? 1 : 0);
}

main();
