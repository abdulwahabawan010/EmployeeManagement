#!/usr/bin/env node

/**
 * AI:
 * Status: "confirmed"
 * Type: Widget
 * SubType: ValidationScript
 * Reason: Script to validate existing widgets - outputs JSON ONLY
 */

/**
 * Widget Validation Script (MANDATORY)
 *
 * ============================================================================
 * PURPOSE
 * ============================================================================
 *
 * Validates existing widgets against governance rules.
 * Outputs JSON ONLY for deterministic, script-driven validation.
 *
 * ============================================================================
 * USAGE
 * ============================================================================
 *
 *   node check-widget.js <path> [<path> ...]
 *
 * Paths can be:
 *   - Single file: ./src/component.ts
 *   - Multiple files: ./src/a.ts ./src/b.ts
 *   - Directory: ./src/features (scans *.ts files)
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
 *       "code": "single line only"
 *     }
 *   ]
 * }
 *
 * ============================================================================
 * RULES VALIDATED
 * ============================================================================
 *
 * WIDGET-001: WidgetFactory usage required (no direct WidgetData instantiation)
 * WIDGET-002: Widget alias naming convention (<module>.<feature>.<entity>.<type>.<variant>)
 * WIDGET-003: Valid dataSource/dataProvider combinations
 * WIDGET-004: AI Javadoc required above each widget creation
 * WIDGET-005: Minimal configuration (warns on over-configuration)
 * WIDGET-006: Transient data source requires data
 *
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================

const RULES = {
  WIDGET_001: 'WIDGET-001',  // WidgetFactory usage
  WIDGET_002: 'WIDGET-002',  // Alias naming
  WIDGET_003: 'WIDGET-003',  // Data provider config
  WIDGET_004: 'WIDGET-004',  // AI Javadoc
  WIDGET_005: 'WIDGET-005',  // Minimal config
  WIDGET_006: 'WIDGET-006'   // Transient data
};

const ALIAS_MIN_SEGMENTS = 3;
const ALIAS_ANTI_PATTERNS = [
  /^widget\d*$/i,
  /^myWidget$/i,
  /^test.*$/i,
  /^table\d*$/i,
  /^list\d*$/i,
  /^[a-z]+Widget$/i
];

const VALID_DATA_SOURCES = ['entity', 'entity.groupBy', 'ql', 'transient', 'report', 'os'];
const VALID_DATA_PROVIDERS = ['list', 'transient'];
const VALID_COMBINATIONS = {
  'entity': 'list',
  'entity.groupBy': 'list',
  'ql': 'list',
  'transient': 'transient',
  'report': 'list',
  'os': 'list'
};

const MAX_PARAMS_WARNING = 5;

// ============================================
// RESULT TRACKING
// ============================================

let violations = [];
let checkedFiles = 0;

function addViolation(ruleId, file, line, description, code) {
  violations.push({
    ruleId,
    file: path.relative(process.cwd(), file),
    line,
    description,
    code: code ? code.trim().substring(0, 100) : ''
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
 * WIDGET-001: WidgetFactory usage required
 */
function checkFactoryUsage(content, filePath) {
  const directInstantiation = content.match(/new\s+WidgetData\s*\(/g);
  const usesFactory = content.includes('WidgetFactory.');

  if (directInstantiation && !usesFactory) {
    const line = findLineNumber(content, 'new WidgetData(');
    addViolation(
      RULES.WIDGET_001,
      filePath,
      line,
      'Direct WidgetData instantiation without WidgetFactory',
      getLineContent(content, line)
    );
  }
}

/**
 * WIDGET-002: Widget alias naming convention
 */
function checkAliasNaming(content, filePath) {
  const aliasPatterns = [
    /WidgetFactory\.\w+\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /idAlias\s*[=:]\s*['"`]([^'"`]+)['"`]/g
  ];

  const aliases = new Set();
  aliasPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      aliases.add(match[1]);
    }
  });

  aliases.forEach(alias => {
    const line = findLineNumber(content, alias);

    // Check anti-patterns
    for (const antiPattern of ALIAS_ANTI_PATTERNS) {
      if (antiPattern.test(alias)) {
        addViolation(
          RULES.WIDGET_002,
          filePath,
          line,
          `Invalid alias '${alias}' - use format: <module>.<feature>.<entity>.<type>.<variant>`,
          getLineContent(content, line)
        );
        return;
      }
    }

    // Check segment count
    const segments = alias.split('.');
    if (segments.length < ALIAS_MIN_SEGMENTS) {
      addViolation(
        RULES.WIDGET_002,
        filePath,
        line,
        `Alias '${alias}' has ${segments.length} segment(s), minimum is ${ALIAS_MIN_SEGMENTS}`,
        getLineContent(content, line)
      );
    }
  });
}

/**
 * WIDGET-003: Valid dataSource/dataProvider combinations
 */
function checkDataProviderConfig(content, filePath) {
  const dataSourceMatch = content.match(/\.dataSource\s*=\s*['"`]([^'"`]+)['"`]/);
  const dataProviderMatch = content.match(/\.dataProvider\s*=\s*['"`]([^'"`]+)['"`]/);

  if (dataSourceMatch) {
    const dataSource = dataSourceMatch[1];
    const line = findLineNumber(content, dataSourceMatch[0]);

    if (!VALID_DATA_SOURCES.includes(dataSource)) {
      addViolation(
        RULES.WIDGET_003,
        filePath,
        line,
        `Invalid dataSource '${dataSource}'`,
        getLineContent(content, line)
      );
    }
  }

  if (dataProviderMatch) {
    const dataProvider = dataProviderMatch[1];
    const line = findLineNumber(content, dataProviderMatch[0]);

    if (!VALID_DATA_PROVIDERS.includes(dataProvider)) {
      addViolation(
        RULES.WIDGET_003,
        filePath,
        line,
        `Invalid dataProvider '${dataProvider}'`,
        getLineContent(content, line)
      );
    }
  }

  // Check combination validity
  if (dataSourceMatch && dataProviderMatch) {
    const ds = dataSourceMatch[1];
    const dp = dataProviderMatch[1];
    if (VALID_COMBINATIONS[ds] && VALID_COMBINATIONS[ds] !== dp) {
      const line = findLineNumber(content, dataSourceMatch[0]);
      addViolation(
        RULES.WIDGET_003,
        filePath,
        line,
        `Invalid combination: '${ds}' requires '${VALID_COMBINATIONS[ds]}', got '${dp}'`,
        getLineContent(content, line)
      );
    }
  }
}

/**
 * WIDGET-004: AI Javadoc required above each widget creation
 */
function checkJavadoc(content, filePath) {
  const lines = content.split('\n');
  const widgets = [];

  // Find all widget creations (skip commented lines)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip commented lines
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*')) {
      continue;
    }

    if (line.includes('WidgetFactory.')) {
      const aliasMatch = line.match(/WidgetFactory\.\w+\s*\(\s*['"`]([^'"`]+)['"`]/);
      widgets.push({
        line: i + 1,
        alias: aliasMatch ? aliasMatch[1] : null,
        code: line.trim()
      });
    }
  }

  // Check each widget for Javadoc above it (or above enclosing method)
  widgets.forEach(widget => {
    let foundJavadoc = false;

    // Search up to 25 lines above (to find Javadoc above enclosing method)
    for (let i = widget.line - 2; i >= Math.max(0, widget.line - 27); i--) {
      const line = lines[i].trim();

      // Check for AI Javadoc markers
      if (line.includes('* AI:') || line.includes('*AI:') ||
          line.includes('AI-JAVADOC') || line.includes('@widget') ||
          line.includes('@status')) {
        foundJavadoc = true;
        break;
      }

      // Stop at class declaration (we've gone too far)
      if (line.startsWith('export class') || line.startsWith('class ')) {
        break;
      }
    }

    if (!foundJavadoc) {
      const aliasInfo = widget.alias ? ` (${widget.alias})` : '';
      addViolation(
        RULES.WIDGET_004,
        filePath,
        widget.line,
        `Missing AI Javadoc above widget creation${aliasInfo}`,
        widget.code
      );
    }
  });
}

/**
 * WIDGET-005: Minimal configuration (warns on over-configuration)
 */
function checkMinimalConfig(content, filePath) {
  const setParamMatches = content.match(/\.setParamValue\s*\(/g);
  const paramCount = setParamMatches ? setParamMatches.length : 0;

  if (paramCount > MAX_PARAMS_WARNING) {
    // Find first setParamValue line
    const line = findLineNumber(content, '.setParamValue(');
    addViolation(
      RULES.WIDGET_005,
      filePath,
      line,
      `Over-configuration: ${paramCount} params set, exceeds recommended ${MAX_PARAMS_WARNING}`,
      getLineContent(content, line)
    );
  }
}

/**
 * WIDGET-006: Transient data source requires data
 */
function checkTransientData(content, filePath) {
  const hasTransientSource = content.includes("dataSource = 'transient'") ||
                             content.includes('dataSource = "transient"');

  if (hasTransientSource) {
    const hasDataSet = content.includes('setTransientData') ||
                       content.includes('dataTransient');

    if (!hasDataSet) {
      const line = findLineNumber(content, 'transient');
      addViolation(
        RULES.WIDGET_006,
        filePath,
        line,
        'Transient dataSource used but no data provided',
        getLineContent(content, line)
      );
    }
  }
}

// ============================================
// FILE PROCESSING
// ============================================

function validateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Skip if no widget-related code
    if (!content.includes('WidgetFactory') &&
        !content.includes('WidgetData') &&
        !content.includes('idAlias')) {
      return;
    }

    checkedFiles++;

    // Run all checks
    checkFactoryUsage(content, filePath);
    checkAliasNaming(content, filePath);
    checkDataProviderConfig(content, filePath);
    checkJavadoc(content, filePath);
    checkMinimalConfig(content, filePath);
    checkTransientData(content, filePath);
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
      // Skip node_modules and hidden directories
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
Widget Validation Script
========================

Usage:
  node check-widget.js <path> [<path> ...]

Paths can be:
  - Single file: ./src/component.ts
  - Multiple files: ./src/a.ts ./src/b.ts
  - Directory: ./src/features (scans *.ts files)

Output:
  JSON with status, checkedFiles count, and violations array

Rules validated:
  WIDGET-001: WidgetFactory usage required
  WIDGET-002: Widget alias naming convention
  WIDGET-003: Valid dataSource/dataProvider combinations
  WIDGET-004: AI Javadoc required above widget creation
  WIDGET-005: Minimal configuration (warns on over-configuration)
  WIDGET-006: Transient data source requires data

Examples:
  node check-widget.js ./src/app/customer/customer.component.ts
  node check-widget.js ./src/features/crm ./src/features/billing
`);
    process.exit(0);
  }

  // Process all provided paths
  for (const inputPath of args) {
    if (!inputPath.startsWith('--')) {
      processPath(inputPath);
    }
  }

  // Output JSON result
  const result = {
    status: violations.length === 0 ? 'PASSED' : 'FAILED',
    checkedFiles,
    violations
  };

  console.log(JSON.stringify(result, null, 2));

  process.exit(violations.length === 0 ? 0 : 1);
}

main();
