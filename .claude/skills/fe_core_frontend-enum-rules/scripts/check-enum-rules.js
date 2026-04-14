#!/usr/bin/env node

/**
 * Frontend Enum Rules Validation Script
 *
 * This script scans TypeScript files for enum definitions and detects
 * violations of the frontend enum rules defined in SKILL.md.
 *
 * Violations detected:
 * - Explicit string assignments (e.g., MEMBER = 'MEMBER')
 * - Explicit numeric assignments (e.g., MEMBER = 1)
 * - Mixed assignment styles
 * - Computed or dynamic values
 *
 * Usage:
 *   node check-enum-rules.js [directory]
 *
 * Exit codes:
 *   0 - No violations found
 *   1 - Violations detected
 *   2 - Script error
 */

const fs = require('fs');
const path = require('path');

const VIOLATIONS = [];

/**
 * Patterns that indicate enum rule violations
 */
const VIOLATION_PATTERNS = [
  {
    name: 'explicit-string-assignment',
    description: 'Explicit string value assignment',
    // Matches: MEMBER = 'value' or MEMBER = "value"
    regex: /^\s*(\w+)\s*=\s*['"`][^'"`]*['"`]\s*,?\s*$/,
  },
  {
    name: 'explicit-numeric-assignment',
    description: 'Explicit numeric value assignment',
    // Matches: MEMBER = 123
    regex: /^\s*(\w+)\s*=\s*-?\d+\s*,?\s*$/,
  },
  {
    name: 'template-literal-assignment',
    description: 'Template literal or computed value assignment',
    // Matches: MEMBER = `template` or MEMBER = expression
    regex: /^\s*(\w+)\s*=\s*`[^`]*`\s*,?\s*$/,
  },
  {
    name: 'variable-reference-assignment',
    description: 'Variable reference assignment',
    // Matches: MEMBER = someVariable or MEMBER = SOME_CONST
    regex: /^\s*(\w+)\s*=\s*[a-zA-Z_][a-zA-Z0-9_]*\s*,?\s*$/,
  },
];

/**
 * Extract enum blocks from TypeScript content
 */
function extractEnums(content, filePath) {
  const enums = [];
  const enumRegex = /(?:export\s+)?(?:const\s+)?enum\s+(\w+)\s*\{([^}]*)\}/g;

  let match;
  while ((match = enumRegex.exec(content)) !== null) {
    const enumName = match[1];
    const enumBody = match[2];
    const startIndex = match.index;

    // Calculate line number
    const linesBeforeEnum = content.substring(0, startIndex).split('\n');
    const startLine = linesBeforeEnum.length;

    enums.push({
      name: enumName,
      body: enumBody,
      startLine,
      filePath,
    });
  }

  return enums;
}

/**
 * Check an enum body for violations
 */
function checkEnumForViolations(enumInfo) {
  const { name, body, startLine, filePath } = enumInfo;
  const lines = body.split('\n');
  const violations = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
      return;
    }

    // Check against each violation pattern
    for (const pattern of VIOLATION_PATTERNS) {
      if (pattern.regex.test(trimmedLine)) {
        violations.push({
          type: pattern.name,
          description: pattern.description,
          enumName: name,
          line: startLine + index,
          content: trimmedLine,
          filePath,
        });
        break; // Only report first matching violation per line
      }
    }
  });

  return violations;
}

/**
 * Get all TypeScript files in a directory recursively
 */
function getTypeScriptFiles(dir, files = []) {
  // Skip node_modules, dist, build directories
  const skipDirs = ['node_modules', 'dist', 'build', '.git', '.next', 'coverage'];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!skipDirs.includes(entry.name)) {
          getTypeScriptFiles(fullPath, files);
        }
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}: ${error.message}`);
  }

  return files;
}

/**
 * Format violation for output
 */
function formatViolation(violation) {
  return [
    '',
    `  VIOLATION: ${violation.description}`,
    `  File: ${violation.filePath}`,
    `  Line: ${violation.line}`,
    `  Enum: ${violation.enumName}`,
    `  Code: ${violation.content}`,
    `  Rule: Enums MUST NOT use explicit assignments`,
  ].join('\n');
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const targetDir = args[0] || process.cwd();

  console.log('');
  console.log('======================================');
  console.log('  Frontend Enum Rules Validator');
  console.log('======================================');
  console.log('');
  console.log(`Scanning: ${targetDir}`);
  console.log('');

  // Check if target exists
  if (!fs.existsSync(targetDir)) {
    console.error(`Error: Directory does not exist: ${targetDir}`);
    process.exit(2);
  }

  // Get all TypeScript files
  const files = getTypeScriptFiles(targetDir);

  if (files.length === 0) {
    console.log('No TypeScript files found.');
    console.log('');
    process.exit(0);
  }

  console.log(`Found ${files.length} TypeScript file(s)`);
  console.log('');

  let totalEnums = 0;
  const allViolations = [];

  // Process each file
  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const enums = extractEnums(content, filePath);

      totalEnums += enums.length;

      for (const enumInfo of enums) {
        const violations = checkEnumForViolations(enumInfo);
        allViolations.push(...violations);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}: ${error.message}`);
    }
  }

  console.log(`Checked ${totalEnums} enum(s)`);
  console.log('');

  // Report results
  if (allViolations.length === 0) {
    console.log('STATUS: PASSED');
    console.log('');
    console.log('All enums comply with frontend enum rules.');
    console.log('');
    process.exit(0);
  } else {
    console.log('STATUS: FAILED');
    console.log('');
    console.log(`Found ${allViolations.length} violation(s):`);

    for (const violation of allViolations) {
      console.log(formatViolation(violation));
    }

    console.log('');
    console.log('--------------------------------------');
    console.log('HOW TO FIX:');
    console.log('--------------------------------------');
    console.log('');
    console.log('Remove explicit assignments from enum members.');
    console.log('');
    console.log('WRONG:');
    console.log('  export enum MyEnum {');
    console.log("    MEMBER = 'MEMBER',");
    console.log('  }');
    console.log('');
    console.log('CORRECT:');
    console.log('  export enum MyEnum {');
    console.log('    MEMBER,');
    console.log('  }');
    console.log('');
    console.log('See: .claude/skills/frontend-enum-rules/SKILL.md');
    console.log('');

    process.exit(1);
  }
}

// Run
main();
