#!/usr/bin/env node
/**
 * Frontend Enum Rules Auto-Fix Script
 *
 * Automatically fixes SAFE enum violations by converting explicit assignments
 * to implicit enum members.
 *
 * Usage:
 *   node fix-enum-rules.js [--dry-run] <path> [<path> ...]
 *
 * Path types:
 *   - Single file:      path/to/file.enum.ts
 *   - Enum directory:   path/to/model/dto/enum
 *   - Module root:      path/to/sp (contains sp.module.ts)
 *
 * Safe fixes:
 *   - explicit-string-assignment: MEMBER = 'MEMBER' -> MEMBER
 *   - explicit-numeric-assignment: MEMBER = 1 -> MEMBER
 *
 * Unsafe (skipped):
 *   - template-literal-assignment
 *   - variable-reference-assignment
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

// Fixable patterns (safe to auto-fix)
const FIXABLE_PATTERNS = [
  {
    id: 'explicit-string-assignment',
    // Matches: MEMBER = 'VALUE' or MEMBER = "VALUE"
    regex: /^(\s*)(\w+)\s*=\s*['"][^'"]*['"]\s*(,?)\s*$/,
    fix: (match) => `${match[1]}${match[2]}${match[3]}`
  },
  {
    id: 'explicit-numeric-assignment',
    // Matches: MEMBER = 123 or MEMBER = -123
    regex: /^(\s*)(\w+)\s*=\s*-?\d+\s*(,?)\s*$/,
    fix: (match) => `${match[1]}${match[2]}${match[3]}`
  }
];

// Unfixable patterns (require manual review)
const UNFIXABLE_PATTERNS = [
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

  if (fs.existsSync(current) && fs.statSync(current).isFile()) {
    current = path.dirname(current);
  }

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
      const moduleRoot = findModuleRoot(resolved);
      if (moduleRoot && isInEnumDirectory(resolved, moduleRoot)) {
        result.files.push(resolved);
      } else if (!moduleRoot) {
        result.errors.push(`No module root found for: ${inputPath}`);
      } else {
        result.errors.push(`File not in enum directory: ${inputPath}`);
      }
    } else if (stat.isDirectory()) {
      const entries = fs.readdirSync(resolved);
      const hasModuleFile = entries.some(e => e.endsWith('.module.ts') && !e.includes('.routing.'));

      if (hasModuleFile) {
        const enumFiles = getEnumFilesInModule(resolved);
        result.files.push(...enumFiles);
      } else {
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

  result.files = [...new Set(result.files)];
  return result;
}

/**
 * Check if line has unfixable violation
 */
function hasUnfixableViolation(line) {
  for (const pattern of UNFIXABLE_PATTERNS) {
    if (pattern.regex.test(line)) {
      return pattern.id;
    }
  }
  return null;
}

/**
 * Try to fix a line
 */
function tryFixLine(line) {
  for (const pattern of FIXABLE_PATTERNS) {
    const match = line.match(pattern.regex);
    if (match) {
      return {
        fixed: true,
        result: pattern.fix(match),
        rule: pattern.id
      };
    }
  }
  return { fixed: false, result: line, rule: null };
}

/**
 * Fix enum content
 */
function fixEnumContent(content) {
  const lines = content.split('\n');
  let modified = false;
  let hasUnfixable = false;
  const unfixableReasons = [];

  // Track if we're inside an enum
  let inEnum = false;
  let braceDepth = 0;

  const fixedLines = lines.map((line, index) => {
    // Detect enum start
    if (/(?:export\s+)?(?:const\s+)?enum\s+\w+\s*\{/.test(line)) {
      inEnum = true;
      braceDepth = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      return line;
    }

    // Track braces
    if (inEnum) {
      braceDepth += (line.match(/\{/g) || []).length;
      braceDepth -= (line.match(/\}/g) || []).length;

      if (braceDepth <= 0) {
        inEnum = false;
        return line;
      }

      // Skip comments and empty lines
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        return line;
      }

      // Check for unfixable violations first
      const unfixable = hasUnfixableViolation(trimmed);
      if (unfixable) {
        hasUnfixable = true;
        unfixableReasons.push(`Line ${index + 1}: ${unfixable}`);
        return line;
      }

      // Try to fix
      const fixResult = tryFixLine(line);
      if (fixResult.fixed) {
        modified = true;
        return fixResult.result;
      }
    }

    return line;
  });

  return {
    content: fixedLines.join('\n'),
    modified,
    hasUnfixable,
    unfixableReasons
  };
}

/**
 * Fix a single file
 */
function fixFile(filePath, dryRun) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = fixEnumContent(content);

    if (result.hasUnfixable) {
      return {
        status: 'skipped',
        reason: `Contains unfixable violations: ${result.unfixableReasons.join('; ')}`
      };
    }

    if (!result.modified) {
      return { status: 'unchanged' };
    }

    if (!dryRun) {
      fs.writeFileSync(filePath, result.content, 'utf-8');
    }

    return { status: 'fixed' };
  } catch (e) {
    return { status: 'error', reason: e.message };
  }
}

/**
 * Main fix function
 */
function fix(inputPaths, dryRun) {
  const resolved = resolveInputPaths(inputPaths);
  const fixedFiles = [];
  const skippedFiles = [];
  const errors = [...resolved.errors];

  for (const filePath of resolved.files) {
    const result = fixFile(filePath, dryRun);
    const relativePath = path.relative(process.cwd(), filePath);

    switch (result.status) {
      case 'fixed':
        fixedFiles.push(relativePath);
        break;
      case 'skipped':
        skippedFiles.push({ file: relativePath, reason: result.reason });
        break;
      case 'error':
        errors.push(`${relativePath}: ${result.reason}`);
        break;
      // 'unchanged' - do nothing
    }
  }

  return {
    dryRun,
    fixedFiles,
    skippedFiles,
    errors: errors.length > 0 ? errors : undefined
  };
}

// Parse arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const paths = args.filter(a => a !== '--dry-run');

if (paths.length === 0) {
  console.log(JSON.stringify({
    dryRun: false,
    fixedFiles: [],
    skippedFiles: [],
    errors: ['Usage: node fix-enum-rules.js [--dry-run] <path> [<path> ...]']
  }, null, 2));
  process.exit(2);
}

const result = fix(paths, dryRun);
console.log(JSON.stringify(result, null, 2));
process.exit(result.errors ? 1 : 0);
