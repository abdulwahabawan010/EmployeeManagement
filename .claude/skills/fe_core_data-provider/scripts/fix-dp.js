#!/usr/bin/env node

/**
 * AI:
 * Status: "confirmed"
 * Type: Component
 * SubType: FixScript
 * Reason: Script to auto-fix Data Provider violations - outputs JSON ONLY
 */

/**
 * Data Provider Auto-Fix Script
 *
 * ============================================================================
 * PURPOSE
 * ============================================================================
 *
 * Automatically fixes safe DP violations detected by check-dp.js.
 * Outputs JSON ONLY for deterministic, script-driven workflow.
 *
 * ============================================================================
 * USAGE
 * ============================================================================
 *
 *   node fix-dp.js [--dry-run] <path> [<path> ...]
 *
 * ============================================================================
 * SAFE FIXES (AUTO-APPLIED)
 * ============================================================================
 *
 * G001-G004: AI Javadoc
 *   - Adds or completes AI Javadoc in TS files
 *
 * ============================================================================
 * UNSAFE FIXES (REQUIRE MANUAL REVIEW)
 * ============================================================================
 *
 * G101-G102: Valid combinations
 * G201-G203: Required properties
 * G301-G302: Request objects
 * G401-G402: Transient handling
 * G501-G503: Anti-patterns
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

function hasDpConfig(content) {
  return content && (
    content.includes('dataSource') ||
    content.includes('dataProvider') ||
    content.includes('WidgetData')
  );
}

function hasAiJavadoc(content) {
  return /\/\*\*[\s\S]*?\*\s*AI:/.test(content);
}

function hasCompleteAiJavadoc(content) {
  return /\/\*\*[\s\S]*?\*\s*AI:[\s\S]*?Status:[\s\S]*?Type:[\s\S]*?SubType:[\s\S]*?Reason:[\s\S]*?\*\//.test(content);
}

// ============================================
// AI JAVADOC GENERATION
// ============================================

function generateAiJavadoc() {
  return `/**
 * AI:
 * Status: "in progress"
 * Type: Service
 * SubType: WidgetConfig
 * Reason: Configured data provider for widget data fetching
 */`;
}

// ============================================
// SAFE FIXES
// ============================================

const FIXES = {
  'G001-ai-javadoc': {
    canFix: (content) => {
      return hasDpConfig(content) && !hasAiJavadoc(content);
    },
    fix: (content, filePath) => {
      // Find first import or start of file
      const importMatch = content.match(/^import .+;$/m);
      if (importMatch) {
        const insertIndex = content.indexOf(importMatch[0]) + importMatch[0].length;
        return content.slice(0, insertIndex) + '\n\n' + generateAiJavadoc() + '\n' + content.slice(insertIndex);
      }
      // Add at beginning
      return generateAiJavadoc() + '\n\n' + content;
    },
    description: 'Added AI Javadoc block'
  },

  'G001-complete-javadoc': {
    canFix: (content) => {
      return hasDpConfig(content) && hasAiJavadoc(content) && !hasCompleteAiJavadoc(content);
    },
    fix: (content, filePath) => {
      const javadoc = generateAiJavadoc();
      const pattern = /\/\*\*[\s\S]*?\*\s*AI:[\s\S]*?\*\//;
      if (pattern.test(content)) {
        return content.replace(pattern, javadoc);
      }
      return content;
    },
    description: 'Completed AI Javadoc template'
  }
};

// ============================================
// UNSAFE RULES (SKIPPED)
// ============================================

function detectUnsafeIssues(content, filePath) {
  const issues = [];

  // Check for combination issues
  const sourceMatches = [...content.matchAll(/(\w+)\.dataSource\s*=\s*['"`]([^'"`]+)['"`]/g)];

  sourceMatches.forEach((match, i) => {
    const varName = match[1];
    const dataSource = match[2];

    // Check for missing dataProviderObject
    const objectRegex = new RegExp(`${varName}\\.dataProviderObject\\s*=`);
    if (!objectRegex.test(content) && ['entity', 'ql', 'report', 'os'].includes(dataSource)) {
      issues.push({ ruleId: 'G203', reason: `${varName} missing dataProviderObject` });
    }

    // Check for transient issues
    if (dataSource === 'transient') {
      const hasData = new RegExp(`${varName}\\.(?:dataTransient|setTransientData)`).test(content);
      if (!hasData) {
        issues.push({ ruleId: 'G402', reason: `${varName} transient without data` });
      }
    }
  });

  // Check for anti-patterns
  if (/new\s+CoreDpImpl/.test(content)) {
    issues.push({ ruleId: 'G501', reason: 'Direct CoreDpImpl instantiation' });
  }

  return issues;
}

// ============================================
// FILE PROCESSING
// ============================================

function fixFile(filePath) {
  const content = readFile(filePath);
  if (!content) {
    errors.push({ file: path.relative(process.cwd(), filePath), error: 'Cannot read file' });
    return;
  }

  // Skip if not using DP
  if (!hasDpConfig(content)) {
    return;
  }

  processedFiles++;
  const relativePath = path.relative(process.cwd(), filePath);

  let modifiedContent = content;
  const appliedFixes = [];

  // Apply safe fixes
  for (const [ruleId, fix] of Object.entries(FIXES)) {
    if (fix.canFix(modifiedContent)) {
      modifiedContent = fix.fix(modifiedContent, filePath);
      appliedFixes.push({ ruleId: ruleId.split('-')[0], description: fix.description });
    }
  }

  // Write file if modified
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
// MAIN
// ============================================

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Data Provider Auto-Fix Script
==============================

Usage:
  node fix-dp.js [--dry-run] <path> [<path> ...]

Options:
  --dry-run   Show what would be fixed without making changes

Safe fixes (auto-applied):
  G001-G004: AI Javadoc completion

Unsafe (skipped, requires manual review):
  G101-G102: Valid combinations
  G201-G203: Required properties
  G301-G302: Request objects
  G401-G402: Transient handling
  G501-G503: Anti-patterns

Examples:
  node fix-dp.js --dry-run ./customer-widget.component.ts
  node fix-dp.js ./src/features/customer/
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
