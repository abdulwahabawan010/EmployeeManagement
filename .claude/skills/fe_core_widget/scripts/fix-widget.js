#!/usr/bin/env node

/**
 * AI:
 * Status: "confirmed"
 * Type: Widget
 * SubType: AutoFixScript
 * Reason: Script to automatically fix common widget governance violations
 */

/**
 * Widget Auto-Fix Script (MANDATORY)
 *
 * ============================================================================
 * PURPOSE
 * ============================================================================
 *
 * Automatically fixes common widget governance violations.
 * Works with check-widget.js output for deterministic fixes.
 *
 * ============================================================================
 * USAGE
 * ============================================================================
 *
 *   # Fix violations from check-widget.js output
 *   node check-widget.js ./src | node fix-widget.js --stdin
 *
 *   # Fix specific file
 *   node fix-widget.js <file-path>
 *
 *   # Dry run (show what would be fixed)
 *   node fix-widget.js <file-path> --dry-run
 *
 * ============================================================================
 * FIXABLE RULES
 * ============================================================================
 *
 * WIDGET-004: Add missing AI Javadoc above widget creation
 * WIDGET-005: Remove unnecessary parameter calls (interactive)
 *
 * NON-FIXABLE (require manual intervention):
 * WIDGET-001: Direct WidgetData instantiation (needs context)
 * WIDGET-002: Alias naming (needs business knowledge)
 * WIDGET-003: Data provider config (needs context)
 * WIDGET-006: Transient data (needs data source)
 *
 * ============================================================================
 * OUTPUT FORMAT
 * ============================================================================
 *
 * {
 *   "status": "SUCCESS | PARTIAL | FAILED",
 *   "fixedCount": number,
 *   "unfixableCount": number,
 *   "fixes": [
 *     {
 *       "ruleId": "string",
 *       "file": "path.ts",
 *       "line": number,
 *       "action": "description"
 *     }
 *   ],
 *   "unfixable": [
 *     {
 *       "ruleId": "string",
 *       "file": "path.ts",
 *       "line": number,
 *       "reason": "why not fixable"
 *     }
 *   ]
 * }
 *
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ============================================
// CONFIGURATION
// ============================================

const FIXABLE_RULES = ['WIDGET-004', 'WIDGET-005'];
const NON_FIXABLE_RULES = ['WIDGET-001', 'WIDGET-002', 'WIDGET-003', 'WIDGET-006'];

// ============================================
// RESULT TRACKING
// ============================================

let fixes = [];
let unfixable = [];
let dryRun = false;

// ============================================
// AI JAVADOC GENERATION
// ============================================

function generateJavadocForLine(line) {
  // Extract alias from WidgetFactory call
  const aliasMatch = line.match(/WidgetFactory\.\w+\s*\(\s*['"`]([^'"`]+)['"`]/);
  const alias = aliasMatch ? aliasMatch[1] : 'unknown';

  // Extract entity from alias or line
  const segments = alias.split('.');
  const entityGuess = segments.length >= 3 ? segments[2] : 'entity';

  // Determine widget type from factory method
  let widgetType = 'Runtime';
  if (line.includes('createWidgetForm') || line.includes('createWidgetObject')) {
    widgetType = 'Form';
  } else if (line.includes('createWidgetEntityData') || line.includes('createWidgetDataQl')) {
    widgetType = 'Data';
  }

  return `/**
 * AI:
 * Status: "in progress"
 * Type: Widget
 * SubType: ${widgetType}
 * Reason: ${entityGuess} widget for displaying ${entityGuess.toLowerCase()} data
 */`;
}

// ============================================
// FIX FUNCTIONS
// ============================================

/**
 * Fix WIDGET-004: Add missing AI Javadoc
 */
function fixMissingJavadoc(filePath, lineNum, code) {
  if (dryRun) {
    fixes.push({
      ruleId: 'WIDGET-004',
      file: filePath,
      line: lineNum,
      action: 'Would add AI Javadoc above widget creation'
    });
    return true;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Find the actual line (0-indexed)
    const targetLine = lineNum - 1;

    // Generate Javadoc
    const javadoc = generateJavadocForLine(lines[targetLine]);

    // Find proper indentation
    const indent = lines[targetLine].match(/^(\s*)/)[1];

    // Insert Javadoc above the widget line
    const javadocLines = javadoc.split('\n').map(l => indent + l);
    lines.splice(targetLine, 0, ...javadocLines);

    // Write back
    fs.writeFileSync(filePath, lines.join('\n'));

    fixes.push({
      ruleId: 'WIDGET-004',
      file: filePath,
      line: lineNum,
      action: 'Added AI Javadoc above widget creation'
    });

    return true;
  } catch (err) {
    unfixable.push({
      ruleId: 'WIDGET-004',
      file: filePath,
      line: lineNum,
      reason: `File operation failed: ${err.message}`
    });
    return false;
  }
}

/**
 * Handle non-fixable violations
 */
function handleNonFixable(violation) {
  const reasons = {
    'WIDGET-001': 'Direct WidgetData instantiation requires manual conversion to WidgetFactory',
    'WIDGET-002': 'Alias naming requires business context to determine proper format',
    'WIDGET-003': 'Data provider configuration requires understanding of data source',
    'WIDGET-006': 'Transient data source requires actual data to be provided'
  };

  unfixable.push({
    ruleId: violation.ruleId,
    file: violation.file,
    line: violation.line,
    reason: reasons[violation.ruleId] || 'Manual intervention required'
  });
}

// ============================================
// FILE PROCESSING
// ============================================

function processViolations(violations) {
  // Group violations by file
  const byFile = {};
  for (const v of violations) {
    if (!byFile[v.file]) byFile[v.file] = [];
    byFile[v.file].push(v);
  }

  // Process each file (in reverse line order to preserve line numbers)
  for (const file of Object.keys(byFile)) {
    const fileViolations = byFile[file].sort((a, b) => b.line - a.line);

    for (const violation of fileViolations) {
      if (FIXABLE_RULES.includes(violation.ruleId)) {
        if (violation.ruleId === 'WIDGET-004') {
          fixMissingJavadoc(violation.file, violation.line, violation.code);
        } else if (violation.ruleId === 'WIDGET-005') {
          // Over-configuration is a warning, not auto-fixed
          unfixable.push({
            ruleId: violation.ruleId,
            file: violation.file,
            line: violation.line,
            reason: 'Over-configuration requires manual review of which params to remove'
          });
        }
      } else {
        handleNonFixable(violation);
      }
    }
  }
}

function scanFileForViolations(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const violations = [];

  // Find widget creations without Javadoc
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('WidgetFactory.')) {
      // Check for Javadoc above
      let hasJavadoc = false;
      for (let j = i - 1; j >= Math.max(0, i - 15); j--) {
        const checkLine = lines[j].trim();
        if (checkLine.includes('* AI:') || checkLine.includes('AI-JAVADOC') || checkLine.includes('@widget')) {
          hasJavadoc = true;
          break;
        }
        if (checkLine && !checkLine.startsWith('*') && !checkLine.startsWith('/*') && !checkLine.startsWith('//')) {
          break;
        }
      }

      if (!hasJavadoc) {
        violations.push({
          ruleId: 'WIDGET-004',
          file: filePath,
          line: i + 1,
          code: line.trim()
        });
      }
    }
  }

  return violations;
}

// ============================================
// STDIN PROCESSING
// ============================================

async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on('line', (line) => {
      data += line + '\n';
    });

    rl.on('close', () => {
      resolve(data.trim());
    });

    rl.on('error', reject);
  });
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const useStdin = args.includes('--stdin');
  dryRun = args.includes('--dry-run');
  const filePaths = args.filter(a => !a.startsWith('--'));

  // Help
  if (args.includes('--help') || (filePaths.length === 0 && !useStdin)) {
    console.log(`
Widget Auto-Fix Script
======================

Usage:
  # Fix violations from check-widget.js output
  node check-widget.js ./src | node fix-widget.js --stdin

  # Fix specific file
  node fix-widget.js <file-path>

  # Dry run (show what would be fixed)
  node fix-widget.js <file-path> --dry-run

Fixable Rules:
  WIDGET-004: Add missing AI Javadoc above widget creation

Non-Fixable (require manual intervention):
  WIDGET-001: Direct WidgetData instantiation
  WIDGET-002: Alias naming convention
  WIDGET-003: Data provider configuration
  WIDGET-005: Over-configuration (review required)
  WIDGET-006: Transient data source

Options:
  --stdin     Read check-widget.js JSON output from stdin
  --dry-run   Show what would be fixed without making changes
  --help      Show this help message
`);
    process.exit(0);
  }

  let violations = [];

  if (useStdin) {
    // Read JSON from stdin
    try {
      const input = await readStdin();
      const parsed = JSON.parse(input);
      violations = parsed.violations || [];
    } catch (err) {
      console.error(JSON.stringify({
        status: 'ERROR',
        error: `Failed to parse stdin: ${err.message}`
      }));
      process.exit(2);
    }
  } else {
    // Scan provided files
    for (const filePath of filePaths) {
      const resolvedPath = path.resolve(filePath);
      if (fs.existsSync(resolvedPath) && resolvedPath.endsWith('.ts')) {
        violations.push(...scanFileForViolations(resolvedPath));
      }
    }
  }

  if (violations.length === 0) {
    console.log(JSON.stringify({
      status: 'SUCCESS',
      message: 'No violations to fix',
      fixedCount: 0,
      unfixableCount: 0,
      fixes: [],
      unfixable: []
    }, null, 2));
    process.exit(0);
  }

  // Process violations
  processViolations(violations);

  // Determine status
  let status = 'SUCCESS';
  if (unfixable.length > 0 && fixes.length === 0) {
    status = 'FAILED';
  } else if (unfixable.length > 0) {
    status = 'PARTIAL';
  }

  // Output result
  const result = {
    status,
    fixedCount: fixes.length,
    unfixableCount: unfixable.length,
    fixes,
    unfixable
  };

  console.log(JSON.stringify(result, null, 2));

  process.exit(unfixable.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(JSON.stringify({
    status: 'ERROR',
    error: err.message
  }));
  process.exit(2);
});
