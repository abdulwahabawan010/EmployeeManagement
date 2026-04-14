#!/usr/bin/env node

/**
 * AI:
 * Status: "confirmed"
 * Type: ObjectBaseComponent
 * SubType: FixScript
 * Reason: Script to auto-fix OBC violations - outputs JSON ONLY
 */

/**
 * OBC Auto-Fix Script (MANDATORY)
 *
 * ============================================================================
 * PURPOSE
 * ============================================================================
 *
 * Automatically fixes safe OBC violations detected by check-obc.js.
 * Outputs JSON ONLY for deterministic, script-driven workflow.
 *
 * ============================================================================
 * USAGE
 * ============================================================================
 *
 *   node fix-obc.js [--dry-run] <path> [<path> ...]
 *
 * Options:
 *   --dry-run   Show what would be fixed without making changes
 *
 * Paths can be:
 *   - Single file: ./component.ts
 *   - Multiple files: ./a.ts ./b.ts
 *   - Directory: ./object-components (scans *.ts files)
 *
 * ============================================================================
 * SAFE FIXES (AUTO-APPLIED)
 * ============================================================================
 *
 * G1.x: AI Javadoc
 *   - Adds complete AI Javadoc if file has partial AI: marker
 *   - Completes missing fields (Status, Type, SubType, Reason)
 *
 * G4.1: Missing super.ngOnInit()
 *   - Adds super.ngOnInit() call at start of ngOnInit()
 *
 * G4.4: Missing super.ngOnDestroy()
 *   - Adds super.ngOnDestroy() call at start of ngOnDestroy()
 *
 * G4.6: Missing super.ngOnChanges()
 *   - Adds super.ngOnChanges(changes) call at start of ngOnChanges()
 *
 * G6.2: Simple *ngIf/*ngFor conversion
 *   - Converts simple *ngIf to @if (no else/then)
 *   - Converts simple *ngFor to @for with track
 *
 * ============================================================================
 * UNSAFE FIXES (REQUIRE MANUAL REVIEW)
 * ============================================================================
 *
 * G2.x: File location issues (requires file move)
 * G3.x: Inheritance issues (structural change)
 * G4.2: Missing onObjectChanged() (requires implementation)
 * G4.3: refreshObject() in onObjectChanged() (logic change)
 * G4.5: Constructor super() (structural change)
 * G5.x: Navigation issues (context-dependent)
 * G6.1: Template guards (context-dependent)
 * G7.x: Dirty state (context-dependent)
 *
 * ============================================================================
 * OUTPUT FORMAT
 * ============================================================================
 *
 * {
 *   "status": "SUCCESS | PARTIAL | NO_CHANGES",
 *   "dryRun": boolean,
 *   "processedFiles": number,
 *   "fixedFiles": [
 *     {
 *       "file": "relative/path.ts",
 *       "fixes": [{ "ruleId": "G4.1", "description": "..." }]
 *     }
 *   ],
 *   "skipped": [
 *     {
 *       "file": "relative/path.ts",
 *       "issues": [{ "ruleId": "G4.2", "reason": "..." }]
 *     }
 *   ],
 *   "errors": []
 * }
 *
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================

const VALID_SUBTYPES = ['EntityDetail', 'ConsultantView', 'WizardCreate', 'MultiStepCreate'];

// ============================================
// RESULT TRACKING
// ============================================

let processedFiles = 0;
let fixedFiles = [];
let skippedFiles = [];
let errors = [];
let dryRun = false;

// ============================================
// UTILITY FUNCTIONS
// ============================================

function isClaudeGenerated(content) {
  return /\/\*\*[\s\S]*?\*\s*AI:/.test(content);
}

function hasCompleteAiJavadoc(content) {
  return /\/\*\*[\s\S]*?\*\s*AI:[\s\S]*?Status:[\s\S]*?Type:[\s\S]*?SubType:[\s\S]*?Reason:[\s\S]*?\*\//.test(content);
}

function getBaseClassType(content) {
  if (content.includes('extends ObjectBaseModeComponent')) return 'OBMC';
  if (content.includes('extends ObjectBaseComponent')) return 'OBC';
  return 'UNKNOWN';
}

function extractClassName(content) {
  const classMatch = content.match(/export\s+class\s+(\w+)/);
  return classMatch ? classMatch[1] : 'Component';
}

function extractEntityName(className) {
  const entityMatch = className.match(/^(\w+?)(?:Detail|Object|Component|Create)?Component$/);
  return entityMatch ? entityMatch[1] : 'Entity';
}

// ============================================
// AI JAVADOC GENERATION
// ============================================

function generateAiJavadoc(content, filePath) {
  const className = extractClassName(content);
  const entity = extractEntityName(className);

  return `/**
 * AI:
 * Status: "in progress"
 * Type: ObjectBaseComponent
 * SubType: EntityDetail
 * Reason: ${entity} detail component for displaying ${entity.toLowerCase()} information
 */`;
}

// ============================================
// SAFE FIXES
// ============================================

const FIXES = {
  // G1.x: Complete AI Javadoc (only for files with partial AI: marker)
  'G1.x-ai-javadoc': {
    canFix: (content) => {
      return isClaudeGenerated(content) && !hasCompleteAiJavadoc(content);
    },
    fix: (content, filePath) => {
      const javadoc = generateAiJavadoc(content, filePath);
      const pattern = /\/\*\*[\s\S]*?\*\s*AI:[\s\S]*?\*\//;
      if (pattern.test(content)) {
        return content.replace(pattern, javadoc);
      }
      return content;
    },
    description: 'Completed AI Javadoc template'
  },

  // G4.1: Add super.ngOnInit()
  'G4.1-super-ngoninit': {
    canFix: (content) => {
      // Match ngOnInit with optional return type: ngOnInit(): void { or ngOnInit() {
      const ngOnInitMatch = content.match(/ngOnInit\s*\(\s*\)[^{]*{/);
      return ngOnInitMatch && !content.includes('super.ngOnInit()');
    },
    fix: (content) => {
      // Pattern handles: ngOnInit(): void { or ngOnInit() {
      const pattern = /(ngOnInit\s*\(\s*\)[^{]*{)(\s*)/;
      return content.replace(pattern, '$1\n    super.ngOnInit();$2');
    },
    description: 'Added super.ngOnInit() call'
  },

  // G4.4: Add super.ngOnDestroy()
  'G4.4-super-ngondestroy': {
    canFix: (content) => {
      // Match ngOnDestroy with optional return type
      const ngOnDestroyMatch = content.match(/ngOnDestroy\s*\(\s*\)[^{]*{/);
      return ngOnDestroyMatch && !content.includes('super.ngOnDestroy()');
    },
    fix: (content) => {
      const pattern = /(ngOnDestroy\s*\(\s*\)[^{]*{)(\s*)/;
      return content.replace(pattern, '$1\n    super.ngOnDestroy();$2');
    },
    description: 'Added super.ngOnDestroy() call'
  },

  // G4.6: Add super.ngOnChanges()
  'G4.6-super-ngonchanges': {
    canFix: (content) => {
      // Match ngOnChanges with parameters and optional return type
      const ngOnChangesMatch = content.match(/ngOnChanges\s*\([^)]*\)[^{]*{/);
      return ngOnChangesMatch && !content.includes('super.ngOnChanges(');
    },
    fix: (content) => {
      // Find parameter name used
      const paramMatch = content.match(/ngOnChanges\s*\(([^)]*)\)/);
      const param = paramMatch && paramMatch[1].trim() ? paramMatch[1].split(':')[0].trim() : 'changes';
      const pattern = /(ngOnChanges\s*\([^)]*\)[^{]*{)(\s*)/;
      return content.replace(pattern, `$1\n    super.ngOnChanges(${param});$2`);
    },
    description: 'Added super.ngOnChanges() call'
  }
};

// ============================================
// TEMPLATE FIXES
// ============================================

const TEMPLATE_FIXES = {
  // G6.2: Simple *ngIf to @if conversion
  'G6.2-ngif-to-if': {
    canFix: (content) => {
      // Only fix simple *ngIf without else/then
      return content.includes('*ngIf') && !content.match(/\*ngIf="[^"]*;\s*(else|then)/);
    },
    fix: (content) => {
      let fixed = content;

      // Match simple *ngIf on self-closing tags
      fixed = fixed.replace(/<(\w+)([^>]*)\*ngIf="([^";]+)"([^>]*)\/>/g, (match, tag, before, condition, after) => {
        return `@if (${condition.trim()}) {\n  <${tag}${before}${after}/>\n}`;
      });

      // Match simple *ngIf on elements (single line, no nested elements)
      fixed = fixed.replace(/<(\w+)([^>]*)\*ngIf="([^";]+)"([^>]*)>([^<]*)<\/\1>/g, (match, tag, before, condition, after, content) => {
        if (content.includes('<')) return match; // Skip nested
        return `@if (${condition.trim()}) {\n  <${tag}${before}${after}>${content}</${tag}>\n}`;
      });

      return fixed;
    },
    description: 'Converted simple *ngIf to @if'
  },

  // G6.2: Simple *ngFor to @for conversion
  'G6.2-ngfor-to-for': {
    canFix: (content) => {
      return content.includes('*ngFor');
    },
    fix: (content) => {
      let fixed = content;

      // Match simple *ngFor="let item of items"
      fixed = fixed.replace(/<(\w+)([^>]*)\*ngFor="let\s+(\w+)\s+of\s+([^";]+)"([^>]*)>/g, (match, tag, before, item, collection, after) => {
        const col = collection.trim();
        return `@for (${item} of ${col}; track ${item}) {\n  <${tag}${before}${after}>`;
      });

      return fixed;
    },
    description: 'Converted simple *ngFor to @for'
  }
};

// ============================================
// UNSAFE RULES (SKIPPED)
// ============================================

function detectUnsafeIssues(content, filePath) {
  const issues = [];
  const baseClass = getBaseClassType(content);

  // G2.1: Not in object-components
  if (!filePath.includes('object-components')) {
    issues.push({ ruleId: 'G2.1', reason: 'File not in object-components/ - requires manual move' });
  }

  // G3.1: Not extending OBC
  if (!content.includes('extends ObjectBaseComponent') && !content.includes('extends ObjectBaseModeComponent')) {
    // Check if extending another component (valid for extension pattern)
    const extendsMatch = content.match(/extends\s+(\w+Component)/);
    if (!extendsMatch) {
      issues.push({ ruleId: 'G3.1', reason: 'Not extending ObjectBaseComponent - requires manual fix' });
    }
  }

  // G3.2: Not implementing OnInit
  if (!content.includes('implements') || !content.includes('OnInit')) {
    issues.push({ ruleId: 'G3.2', reason: 'Not implementing OnInit - requires manual fix' });
  }

  // G4.2: Missing onObjectChanged (OBC only)
  if (baseClass === 'OBC' && !content.includes('onObjectChanged')) {
    issues.push({ ruleId: 'G4.2', reason: 'Missing onObjectChanged() - requires manual implementation' });
  }

  // G4.3: refreshObject in onObjectChanged
  const onObjectChangedMatch = content.match(/onObjectChanged\s*\([^)]*\)\s*[:{][^}]*refreshObject\s*\(/s);
  if (onObjectChangedMatch) {
    issues.push({ ruleId: 'G4.3', reason: 'refreshObject() in onObjectChanged() - requires manual removal' });
  }

  // G4.5: Missing super() in constructor
  if (content.includes('constructor(') && !content.includes('super(')) {
    issues.push({ ruleId: 'G4.5', reason: 'Constructor missing super() - requires manual fix' });
  }

  return issues;
}

// ============================================
// FILE PROCESSING
// ============================================

function fixFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    errors.push({ file: path.relative(process.cwd(), filePath), error: `Cannot read file: ${e.message}` });
    return;
  }

  // Skip if not an OBC component
  const isObc = content.includes('ObjectBaseComponent') ||
                content.includes('ObjectBaseModeComponent') ||
                (content.includes('extends') && content.includes('Component') && content.includes('onObjectChanged'));

  if (!isObc) {
    return;
  }

  processedFiles++;
  const relativePath = path.relative(process.cwd(), filePath);

  let modifiedContent = content;
  const appliedFixes = [];

  // Apply TypeScript fixes
  for (const [ruleId, fix] of Object.entries(FIXES)) {
    if (fix.canFix(modifiedContent)) {
      modifiedContent = fix.fix(modifiedContent, filePath);
      appliedFixes.push({ ruleId: ruleId.split('-')[0], description: fix.description });
    }
  }

  // Try to find and fix template
  const templateMatch = content.match(/templateUrl:\s*['"]\.\/([^'"]+)['"]/);
  if (templateMatch) {
    const templatePath = path.join(path.dirname(filePath), templateMatch[1]);
    try {
      let templateContent = fs.readFileSync(templatePath, 'utf8');
      let templateModified = false;

      for (const [ruleId, fix] of Object.entries(TEMPLATE_FIXES)) {
        if (fix.canFix(templateContent)) {
          const newContent = fix.fix(templateContent);
          if (newContent !== templateContent) {
            templateContent = newContent;
            templateModified = true;
            appliedFixes.push({
              ruleId: ruleId.split('-')[0],
              description: fix.description,
              templateFile: path.relative(process.cwd(), templatePath)
            });
          }
        }
      }

      if (templateModified && !dryRun) {
        fs.writeFileSync(templatePath, templateContent, 'utf8');
      }
    } catch (e) {
      // Template not accessible, skip
    }
  }

  // Write TypeScript file if modified
  if (appliedFixes.length > 0 && modifiedContent !== content && !dryRun) {
    try {
      fs.writeFileSync(filePath, modifiedContent, 'utf8');
    } catch (e) {
      errors.push({ file: relativePath, error: `Cannot write file: ${e.message}` });
      return;
    }
  }

  // Check for unsafe issues
  const unsafeIssues = detectUnsafeIssues(content, filePath);

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
// MAIN EXECUTION
// ============================================

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(JSON.stringify({
      status: 'HELP',
      usage: 'node fix-obc.js [--dry-run] <path> [<path> ...]',
      options: {
        '--dry-run': 'Show what would be fixed without making changes'
      },
      safeFixes: {
        'G1.x': 'AI Javadoc - completes partial Javadoc',
        'G4.1': 'super.ngOnInit() - adds missing call',
        'G4.4': 'super.ngOnDestroy() - adds missing call',
        'G4.6': 'super.ngOnChanges() - adds missing call',
        'G6.2': '*ngIf/*ngFor - converts simple patterns to @if/@for'
      },
      unsafeFixes: {
        'G2.x': 'File location issues - requires manual move',
        'G3.x': 'Inheritance issues - structural change',
        'G4.2': 'Missing onObjectChanged() - requires implementation',
        'G4.3': 'refreshObject() in onObjectChanged() - logic change',
        'G4.5': 'Constructor super() - structural change',
        'G5.x': 'Navigation issues - context-dependent',
        'G6.1': 'Template guards - context-dependent',
        'G7.x': 'Dirty state - context-dependent'
      }
    }, null, 2));
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

  // Process all provided paths
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

  // Output JSON result
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
