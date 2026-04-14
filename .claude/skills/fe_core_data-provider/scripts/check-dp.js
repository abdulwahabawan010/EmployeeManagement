#!/usr/bin/env node

/**
 * AI:
 * Status: "confirmed"
 * Type: Component
 * SubType: ValidationScript
 * Reason: Script to validate Data Provider configurations - outputs JSON ONLY
 */

/**
 * Data Provider Validation Script (MANDATORY)
 *
 * ============================================================================
 * PURPOSE
 * ============================================================================
 *
 * Validates Data Provider configurations against governance rules.
 * Outputs JSON ONLY for deterministic, script-driven validation.
 *
 * ============================================================================
 * USAGE
 * ============================================================================
 *
 *   node check-dp.js <path> [<path> ...]
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
  G001: 'G001-ai-javadoc',
  G002: 'G002-status-field',
  G003: 'G003-subtype-field',
  G004: 'G004-reason-field',
  // Valid Combinations
  G101: 'G101-valid-datasource',
  G102: 'G102-valid-combination',
  // Required Properties
  G201: 'G201-datasource-set',
  G202: 'G202-dataprovider-set',
  G203: 'G203-dataproviderobject-set',
  // Request Objects
  G301: 'G301-ql-request',
  G302: 'G302-groupby-config',
  // Transient
  G401: 'G401-transient-combination',
  G402: 'G402-transient-data',
  // Anti-patterns
  G501: 'G501-no-direct-instantiation',
  G502: 'G502-no-post-init-modification',
  G503: 'G503-no-empty-object'
};

// Valid combinations from SKILL.md
const VALID_COMBINATIONS = {
  'entity': 'list',
  'entity.groupBy': 'list',
  'ql': 'list',
  'transient': 'transient',
  'report': 'list',
  'os': 'list'
};

// Data sources requiring dataProviderObject
const REQUIRES_OBJECT = ['entity', 'entity.groupBy', 'ql', 'report', 'os'];

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
    if (typeof searchStr === 'string' && lines[i].includes(searchStr)) return i + 1;
    if (searchStr instanceof RegExp && searchStr.test(lines[i])) return i + 1;
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

function hasDpConfig(content) {
  return content && (
    content.includes('dataSource') ||
    content.includes('dataProvider') ||
    content.includes('WidgetData') ||
    content.includes('CoreDp')
  );
}

// ============================================
// VALIDATION RULES
// ============================================

function checkAiJavadoc(content, filePath) {
  const javadocPattern = /\/\*\*[\s\S]*?\*\s*AI:[\s\S]*?\*\//;
  const javadocMatch = content.match(javadocPattern);

  if (!javadocMatch) {
    addViolation(RULES.G001, filePath, 1, 'Missing AI Javadoc block');
    return;
  }

  const javadoc = javadocMatch[0];
  const javadocLine = findLineNumber(content, '* AI:');

  // Status
  if (!javadoc.match(/Status:\s*["'](in progress|confirmed)["']/)) {
    addViolation(RULES.G002, filePath, javadocLine, 'Status must be "in progress" or "confirmed"');
  }

  // SubType
  if (!javadoc.match(/SubType:\s*(DataProvider|DataSource|WidgetConfig)/)) {
    addViolation(RULES.G003, filePath, javadocLine, 'SubType must be DataProvider, DataSource, or WidgetConfig');
  }

  // Reason
  const reasonMatch = javadoc.match(/Reason:\s*(.+)/);
  if (!reasonMatch || reasonMatch[1].trim().length < 15) {
    addViolation(RULES.G004, filePath, javadocLine, 'Reason must be descriptive (min 15 chars)');
  }
}

function checkValidCombinations(content, filePath) {
  const sourceMatches = [...content.matchAll(/(\w+)\.dataSource\s*=\s*['"`]([^'"`]+)['"`]/g)];

  sourceMatches.forEach(match => {
    const varName = match[1];
    const dataSource = match[2];
    const line = findLineNumber(content, match[0]);

    // Check if dataSource is valid
    if (!VALID_COMBINATIONS.hasOwnProperty(dataSource)) {
      addViolation(RULES.G101, filePath, line, `Invalid dataSource "${dataSource}"`);
      return;
    }

    // Find corresponding dataProvider
    const providerRegex = new RegExp(`${varName}\\.dataProvider\\s*=\\s*['"\`]([^'"\`]+)['"\`]`);
    const providerMatch = content.match(providerRegex);

    if (providerMatch) {
      const dataProvider = providerMatch[1];
      const expectedProvider = VALID_COMBINATIONS[dataSource];

      if (dataProvider !== expectedProvider) {
        addViolation(
          RULES.G102,
          filePath,
          line,
          `Invalid combination: ${dataSource}+${dataProvider} (expected ${expectedProvider})`
        );
      }
    }
  });
}

function checkRequiredProperties(content, filePath) {
  const sourceMatches = [...content.matchAll(/(\w+)\.dataSource\s*=\s*['"`]([^'"`]+)['"`]/g)];

  sourceMatches.forEach(match => {
    const varName = match[1];
    const dataSource = match[2];
    const line = findLineNumber(content, match[0]);

    // Check for dataProvider
    const providerRegex = new RegExp(`${varName}\\.dataProvider\\s*=`);
    if (!providerRegex.test(content)) {
      addViolation(RULES.G202, filePath, line, `Missing dataProvider for ${varName}`);
    }

    // Check for dataProviderObject
    if (REQUIRES_OBJECT.includes(dataSource)) {
      const objectRegex = new RegExp(`${varName}\\.dataProviderObject\\s*=\\s*['"\`]([^'"\`]+)['"\`]`);
      const objectMatch = content.match(objectRegex);

      if (!objectMatch) {
        addViolation(RULES.G203, filePath, line, `Missing dataProviderObject for ${dataSource}`);
      } else if (objectMatch[1].trim() === '') {
        addViolation(RULES.G503, filePath, line, `Empty dataProviderObject for ${dataSource}`);
      }
    }
  });
}

function checkRequestObjects(content, filePath) {
  const sourceMatches = [...content.matchAll(/(\w+)\.dataSource\s*=\s*['"`]([^'"`]+)['"`]/g)];

  sourceMatches.forEach(match => {
    const varName = match[1];
    const dataSource = match[2];
    const line = findLineNumber(content, match[0]);

    // QL requires QlRequest
    if (dataSource === 'ql') {
      const hasQlRequest = content.includes('QlRequest') ||
                          new RegExp(`${varName}\\.dataProviderListRequest`).test(content);
      if (!hasQlRequest) {
        addViolation(RULES.G301, filePath, line, 'ql dataSource typically requires QlRequest');
      }
    }

    // entity.groupBy requires GroupBy configuration
    if (dataSource === 'entity.groupBy') {
      const hasGroupBy = content.includes('ObjectRequestListGroupBy') ||
                        content.includes('setGroupBy');
      if (!hasGroupBy) {
        addViolation(RULES.G302, filePath, line, 'entity.groupBy requires GroupBy configuration');
      }
    }
  });
}

function checkTransientData(content, filePath) {
  const transientMatches = [...content.matchAll(/(\w+)\.dataSource\s*=\s*['"`]transient['"`]/g)];

  transientMatches.forEach(match => {
    const varName = match[1];
    const line = findLineNumber(content, match[0]);

    // Check for correct dataProvider
    const providerRegex = new RegExp(`${varName}\\.dataProvider\\s*=\\s*['"\`]([^'"\`]+)['"\`]`);
    const providerMatch = content.match(providerRegex);

    if (providerMatch && providerMatch[1] !== 'transient') {
      addViolation(RULES.G401, filePath, line, `transient dataSource requires transient dataProvider`);
    }

    // Check for transient data provision
    const hasData = new RegExp(`${varName}\\.(?:dataTransient|setTransientData)\\s*[=(]`).test(content);
    if (!hasData) {
      addViolation(RULES.G402, filePath, line, `transient dataSource without data provision`);
    }
  });
}

function checkAntiPatterns(content, filePath) {
  // Direct CoreDpImpl instantiation
  const directInstantiationPatterns = [
    /\.dataProvider\s*=\s*new\s+CoreDpImpl/,
    /new\s+CoreDpImplList\s*\(/,
    /new\s+CoreDpImplTransient\s*\(/
  ];

  directInstantiationPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      const line = findLineNumber(content, pattern);
      addViolation(RULES.G501, filePath, line, 'Direct CoreDpImpl instantiation not allowed');
    }
  });

  // Post-init modification
  const postInitPatterns = [
    /setTimeout\s*\([^)]*\.dataSource\s*=/,
    /\.subscribe\s*\([^)]*\.dataSource\s*=/,
    /\.then\s*\([^)]*\.dataSource\s*=/
  ];

  postInitPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      const line = findLineNumber(content, pattern);
      addViolation(RULES.G502, filePath, line, 'Post-init dataSource modification may not take effect');
    }
  });

  // Empty dataProviderObject
  const emptyPatterns = [
    /\.dataProviderObject\s*=\s*['"]\s*['"]/,
    /\.dataProviderObject\s*=\s*``/,
    /\.dataProviderObject\s*=\s*null/,
    /\.dataProviderObject\s*=\s*undefined/
  ];

  emptyPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      const line = findLineNumber(content, pattern);
      addViolation(RULES.G503, filePath, line, 'Empty/null dataProviderObject');
    }
  });
}

// ============================================
// FILE PROCESSING
// ============================================

function validateFile(filePath) {
  const content = readFile(filePath);
  if (!content) return;

  // Skip if no DP-related code
  if (!hasDpConfig(content)) {
    return;
  }

  checkedFiles++;

  // Run all checks
  checkAiJavadoc(content, filePath);
  checkValidCombinations(content, filePath);
  checkRequiredProperties(content, filePath);
  checkRequestObjects(content, filePath);
  checkTransientData(content, filePath);
  checkAntiPatterns(content, filePath);
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
Data Provider Validation Script
================================

Usage:
  node check-dp.js <path> [<path> ...]

Output:
  JSON with status, checkedFiles count, and violations array

Rules validated:
  G001-G004: AI Javadoc (presence, status, subtype, reason)
  G101-G102: Valid combinations
  G201-G203: Required properties
  G301-G302: Request objects
  G401-G402: Transient handling
  G501-G503: Anti-patterns

Examples:
  node check-dp.js ./customer-widget.component.ts
  node check-dp.js ./src/features/customer/
`);
    process.exit(0);
  }

  // Process all paths
  for (const inputPath of args) {
    if (!inputPath.startsWith('--')) {
      processPath(inputPath);
    }
  }

  // Filter out WARNING-level violations for status determination
  const errors = violations.filter(v =>
    !v.ruleId.startsWith('G301') &&
    !v.ruleId.startsWith('G302') &&
    !v.ruleId.startsWith('G502')
  );

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
