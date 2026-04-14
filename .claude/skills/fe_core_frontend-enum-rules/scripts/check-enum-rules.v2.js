#!/usr/bin/env node
/**
 * Frontend Enum Rules Validation Script (v2)
 *
 * Module-scoped enum validation with JSON-only output.
 *
 * Usage:
 *   node check-enum-rules.v2.js <path> [<path> ...]
 *
 * Path types:
 *   - Single file:      path/to/file.enum.ts
 *   - Enum directory:   path/to/model/dto/enum
 *   - Module root:      path/to/sp (contains sp.module.ts)
 *
 * Output: JSON only (no prose, no banners)
 */

const fs = require('fs');
const path = require('path');

// Valid enum directories within a module
const ENUM_DIRECTORIES = [
  'model/dto/enum',
  'model/private-domain/enum',
  'model/protected-domain/enum',
  'model/public-domain/enum'
];

// Violation patterns
const VIOLATION_PATTERNS = [
  {
    id: 'explicit-string-assignment',
    regex: /^\s*(\w+)\s*=\s*['"][^'"]*['"]\s*,?\s*$/
  },
  {
    id: 'explicit-numeric-assignment',
    regex: /^\s*(\w+)\s*=\s*-?\d+\s*,?\s*$/
  },
  {
    id: 'template-literal-assignment',
    regex: /^\s*(\w+)\s*=\s*`[^`]*`\s*,?\s*$/
  },
  {
    id: 'variable-reference-assignment',
    regex: /^\s*(\w+)\s*=\s*[a-zA-Z_][a-zA-Z0-9_.]*\s*,?\s*$/
  }
];

/**
 * Find module root by looking for *.module.ts file
 */
function findModuleRoot(startPath) {
  let current = path.resolve(startPath);

  // If it's a file, start from its directory
  if (fs.existsSync(current) && fs.statSync(current).isFile()) {
    current = path.dirname(current);
  }

  // Walk up directory tree
  while (current !== path.parse(current).root) {
    try {
      const entries = fs.readdirSync(current);
      const moduleFile = entries.find(e => e.endsWith('.module.ts') && !e.includes('.routing.'));
      if (moduleFile) {
        return current;
      }
    } catch (e) {
      // Continue searching
    }
    current = path.dirname(current);
  }

  return null;
}

/**
 * Get enum files within module scope
 */
function getEnumFilesInModule(moduleRoot) {
  const files = [];

  for (const enumDir of ENUM_DIRECTORIES) {
    const fullPath = path.join(moduleRoot, enumDir);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      collectTsFiles(fullPath, files);
    }
  }

  return files;
}

/**
 * Collect .ts files recursively
 */
function collectTsFiles(dir, files) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        collectTsFiles(fullPath, files);
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // Skip inaccessible directories
  }
}

/**
 * Check if path is within valid enum directory
 */
function isInEnumDirectory(filePath, moduleRoot) {
  const relativePath = path.relative(moduleRoot, filePath);
  return ENUM_DIRECTORIES.some(ed => relativePath.startsWith(ed));
}

/**
 * Resolve input paths to enum files
 */
function resolveInputPaths(inputPaths) {
  const result = { files: [], errors: [] };

  for (const inputPath of inputPaths) {
    const resolved = path.resolve(inputPath);

    if (!fs.existsSync(resolved)) {
      result.errors.push(`Path not found: ${inputPath}`);
      continue;
    }

    const stat = fs.statSync(resolved);

    if (stat.isFile()) {
      // Single file - validate it's in an enum directory
      const moduleRoot = findModuleRoot(resolved);
      if (moduleRoot && isInEnumDirectory(resolved, moduleRoot)) {
        result.files.push(resolved);
      } else if (!moduleRoot) {
        result.errors.push(`No module root found for: ${inputPath}`);
      } else {
        result.errors.push(`File not in enum directory: ${inputPath}`);
      }
    } else if (stat.isDirectory()) {
      // Check if it's a module root (has *.module.ts)
      const entries = fs.readdirSync(resolved);
      const hasModuleFile = entries.some(e => e.endsWith('.module.ts') && !e.includes('.routing.'));

      if (hasModuleFile) {
        // It's a module root - get all enum files
        const enumFiles = getEnumFilesInModule(resolved);
        result.files.push(...enumFiles);
      } else {
        // It's an enum directory - find module root and validate scope
        const moduleRoot = findModuleRoot(resolved);
        if (moduleRoot && isInEnumDirectory(resolved, moduleRoot)) {
          collectTsFiles(resolved, result.files);
        } else if (!moduleRoot) {
          result.errors.push(`No module root found for: ${inputPath}`);
        } else {
          result.errors.push(`Directory not in enum scope: ${inputPath}`);
        }
      }
    }
  }

  // Deduplicate files
  result.files = [...new Set(result.files)];
  return result;
}

/**
 * Extract enums from file content
 */
function extractEnums(content, filePath) {
  const enums = [];
  const enumRegex = /(?:export\s+)?(?:const\s+)?enum\s+(\w+)\s*\{([^}]*)\}/g;

  let match;
  while ((match = enumRegex.exec(content)) !== null) {
    const startLine = content.substring(0, match.index).split('\n').length;
    enums.push({
      name: match[1],
      body: match[2],
      startLine,
      filePath
    });
  }

  return enums;
}

/**
 * Check enum for violations
 */
function checkEnum(enumInfo) {
  const violations = [];
  const lines = enumInfo.body.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and comments
    if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
      continue;
    }

    for (const pattern of VIOLATION_PATTERNS) {
      if (pattern.regex.test(line)) {
        violations.push({
          file: enumInfo.filePath,
          enum: enumInfo.name,
          line: enumInfo.startLine + i,
          rule: pattern.id,
          code: line
        });
        break;
      }
    }
  }

  return violations;
}

/**
 * Main validation function
 */
function validate(inputPaths) {
  const resolved = resolveInputPaths(inputPaths);
  const violations = [];
  let checkedFiles = 0;

  for (const filePath of resolved.files) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const enums = extractEnums(content, filePath);

      if (enums.length > 0) {
        checkedFiles++;
        for (const enumInfo of enums) {
          violations.push(...checkEnum(enumInfo));
        }
      }
    } catch (e) {
      resolved.errors.push(`Error reading ${filePath}: ${e.message}`);
    }
  }

  // Make paths relative for cleaner output
  const cwd = process.cwd();
  const relativeViolations = violations.map(v => ({
    ...v,
    file: path.relative(cwd, v.file)
  }));

  return {
    status: violations.length === 0 ? 'PASSED' : 'FAILED',
    checkedFiles,
    violations: relativeViolations,
    ...(resolved.errors.length > 0 ? { errors: resolved.errors } : {})
  };
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(JSON.stringify({
    status: 'ERROR',
    checkedFiles: 0,
    violations: [],
    errors: ['Usage: node check-enum-rules.v2.js <path> [<path> ...]']
  }, null, 2));
  process.exit(2);
}

const result = validate(args);
console.log(JSON.stringify(result, null, 2));
process.exit(result.status === 'PASSED' ? 0 : 1);
