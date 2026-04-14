#!/usr/bin/env node

/**
 * Input Component Auto-Fix Script
 *
 * ============================================================================
 * PURPOSE
 * ============================================================================
 * Automatically fixes deterministic violations in Claude-generated Input Component files.
 * Works in conjunction with check-guidelines.js validator.
 *
 * ============================================================================
 * MODULE SCOPING
 * ============================================================================
 * When given a directory, only processes files matching input component patterns:
 * - mvs-form-field-*.component.ts
 *
 * ============================================================================
 * USAGE
 * ============================================================================
 * Fix single file:
 *   node fix-input-component-rules.js ./mvs-form-field-custom.component.ts
 *
 * Fix all files in directory:
 *   node fix-input-component-rules.js ./src/app/shared/form/fields
 *
 * Preview changes without writing:
 *   node fix-input-component-rules.js ./src/app/shared/form/fields --dry-run
 *
 * ============================================================================
 * OUTPUT FORMAT
 * ============================================================================
 * JSON ONLY - No other output:
 * {
 *   "fixedFiles": [
 *     {
 *       "path": "path/to/file.ts",
 *       "fixes": ["Added super.ngOnInit() call", "Added handleFieldChange() method"]
 *     }
 *   ],
 *   "skippedFiles": [
 *     {
 *       "path": "path/to/file.ts",
 *       "reason": "No violations found"
 *     }
 *   ],
 *   "errors": [
 *     {
 *       "path": "path/to/file.ts",
 *       "error": "Unable to parse component"
 *     }
 *   ]
 * }
 *
 * ============================================================================
 * DETERMINISTIC FIXES
 * ============================================================================
 * The script automatically fixes:
 *
 * COMPONENT STRUCTURE:
 * - Missing @Component() decorator
 * - Missing extends MvsFormFieldBaseComponent
 * - Incorrect selector pattern
 *
 * LIFECYCLE METHODS:
 * - Missing super.ngOnInit() calls
 * - Missing super.ngOnChanges() calls
 * - Missing super.ngOnDestroy() calls
 * - Missing refreshComponent() call in ngOnInit
 *
 * REQUIRED METHODS:
 * - Missing refreshComponent() method
 * - Missing handleFieldChange() method
 * - Missing onChange.emit() in handleFieldChange
 *
 * REQUIRED PATTERNS:
 * - Missing this.initialized = true
 *
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// Results tracking
const results = {
  fixedFiles: [],
  skippedFiles: [],
  errors: []
};

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const inputPath = args.find(arg => !arg.startsWith('--'));

if (!inputPath) {
  console.error(JSON.stringify({
    fixedFiles: [],
    skippedFiles: [],
    errors: [{ path: null, error: 'No input path provided' }]
  }, null, 2));
  process.exit(1);
}

/**
 * Check if file matches input component pattern
 */
function matchesInputComponentPattern(fileName) {
  return /^mvs-form-field-.*\.component\.ts$/.test(fileName);
}

/**
 * Detect if file is an input component
 */
function isInputComponent(content, fileName) {
  return (
    /extends\s+MvsFormFieldBaseComponent/.test(content) ||
    matchesInputComponentPattern(fileName)
  );
}

/**
 * Fix input component violations
 */
function fixInputComponent(content, fileName) {
  let modified = content;
  const fixes = [];

  // Fix 1: Add @Component() decorator if missing
  if (!/@Component\s*\(/.test(modified)) {
    const classMatch = modified.match(/(export\s+class\s+(\w+))/);
    if (classMatch) {
      const className = classMatch[2];
      // Derive selector from class name
      const selector = className
        .replace(/Component$/, '')
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '');

      modified = modified.replace(
        classMatch[1],
        `@Component({\n  selector: '${selector}',\n  templateUrl: './${fileName.replace('.ts', '.html')}',\n  standalone: false\n})\n${classMatch[1]}`
      );
      fixes.push('Added @Component() decorator');
    }
  }

  // Fix 2: Ensure extends MvsFormFieldBaseComponent
  if (!/extends\s+MvsFormFieldBaseComponent/.test(modified)) {
    const extendsMatch = modified.match(/class\s+\w+\s+(extends\s+\w+)?/);
    if (extendsMatch) {
      if (extendsMatch[1]) {
        // Replace existing extends
        modified = modified.replace(
          extendsMatch[1],
          'extends MvsFormFieldBaseComponent'
        );
        fixes.push('Changed base class to MvsFormFieldBaseComponent');
      } else {
        // Add extends clause
        modified = modified.replace(
          /class\s+\w+/,
          match => `${match} extends MvsFormFieldBaseComponent`
        );
        fixes.push('Added extends MvsFormFieldBaseComponent');
      }
    }
  }

  // Fix 3: Add super.ngOnInit() if missing
  if (/ngOnInit\s*\(\s*\)\s*[:{]/.test(modified) && !/super\.ngOnInit\s*\(\s*\)/.test(modified)) {
    const ngOnInitMatch = modified.match(/(ngOnInit\s*\(\s*\)\s*[:{]\s*)/);
    if (ngOnInitMatch) {
      const insertPoint = modified.indexOf(ngOnInitMatch[1]) + ngOnInitMatch[1].length;
      const superCall = `
    super.ngOnInit();`;
      modified = modified.slice(0, insertPoint) + superCall + modified.slice(insertPoint);
      fixes.push('Added super.ngOnInit() call');
    }
  }

  // Fix 4: Add refreshComponent() call in ngOnInit if missing
  if (/ngOnInit\s*\(\s*\)\s*[:{]/.test(modified)) {
    const refreshInOnInitPattern = /ngOnInit[\s\S]*?this\.refreshComponent\s*\(\s*\)/;
    if (!refreshInOnInitPattern.test(modified)) {
      // Find the end of ngOnInit method (before this.initialized = true if it exists)
      const ngOnInitMatch = modified.match(/(ngOnInit\s*\(\s*\)\s*[:{][\s\S]*?)(this\.initialized\s*=\s*true)/);
      if (ngOnInitMatch) {
        const insertPoint = modified.indexOf(ngOnInitMatch[2]);
        const refreshCall = `    this.refreshComponent();\n    `;
        modified = modified.slice(0, insertPoint) + refreshCall + modified.slice(insertPoint);
        fixes.push('Added refreshComponent() call in ngOnInit()');
      } else {
        // Try to insert before closing brace
        const ngOnInitEndMatch = modified.match(/(ngOnInit\s*\(\s*\)\s*[:{][\s\S]*?)(^\s*\})/m);
        if (ngOnInitEndMatch) {
          const insertPoint = modified.indexOf(ngOnInitEndMatch[2]);
          const refreshCall = `    this.refreshComponent();\n  `;
          modified = modified.slice(0, insertPoint) + refreshCall + modified.slice(insertPoint);
          fixes.push('Added refreshComponent() call in ngOnInit()');
        }
      }
    }
  }

  // Fix 5: Add super.ngOnChanges() if missing
  if (/ngOnChanges\s*\([^)]*\)\s*[:{]/.test(modified) && !/super\.ngOnChanges\s*\(/.test(modified)) {
    const ngOnChangesMatch = modified.match(/(ngOnChanges\s*\([^)]*\)\s*[:{]\s*)/);
    if (ngOnChangesMatch) {
      const insertPoint = modified.indexOf(ngOnChangesMatch[1]) + ngOnChangesMatch[1].length;
      const superCall = `
    super.ngOnChanges(changes);`;
      modified = modified.slice(0, insertPoint) + superCall + modified.slice(insertPoint);
      fixes.push('Added super.ngOnChanges() call');
    }
  }

  // Fix 6: Add super.ngOnDestroy() if missing
  if (/ngOnDestroy\s*\(\s*\)\s*[:{]/.test(modified) && !/super\.ngOnDestroy\s*\(\s*\)/.test(modified)) {
    const ngOnDestroyMatch = modified.match(/(ngOnDestroy\s*\(\s*\)\s*[:{]\s*)/);
    if (ngOnDestroyMatch) {
      const insertPoint = modified.indexOf(ngOnDestroyMatch[1]) + ngOnDestroyMatch[1].length;
      const superCall = `
    super.ngOnDestroy();`;
      modified = modified.slice(0, insertPoint) + superCall + modified.slice(insertPoint);
      fixes.push('Added super.ngOnDestroy() call');
    }
  }

  // Fix 7: Add refreshComponent() method if missing
  if (!/refreshComponent\s*\(\s*\)\s*[:{]/.test(modified)) {
    // Find a good insertion point (after ngOnDestroy or ngOnChanges if they exist)
    const insertAfterPatterns = [
      /ngOnDestroy[\s\S]*?\n\s*\}/,
      /ngOnChanges[\s\S]*?\n\s*\}/,
      /ngOnInit[\s\S]*?\n\s*\}/
    ];

    let insertPoint = -1;
    for (const pattern of insertAfterPatterns) {
      const match = modified.match(pattern);
      if (match) {
        insertPoint = modified.indexOf(match[0]) + match[0].length;
        break;
      }
    }

    if (insertPoint !== -1) {
      const method = `

  override refreshComponent() {
    // Initialize or refresh component state
    // Example: Load value lists, set default values, etc.
  }`;
      modified = modified.slice(0, insertPoint) + method + modified.slice(insertPoint);
      fixes.push('Added refreshComponent() method');
    }
  }

  // Fix 8: Add handleFieldChange() method if missing
  if (!/handleFieldChange\s*\([^)]*\)\s*[:{]/.test(modified)) {
    // Find a good insertion point (after refreshComponent if it exists)
    const insertAfterPatterns = [
      /refreshComponent[\s\S]*?\n\s*\}/,
      /ngOnDestroy[\s\S]*?\n\s*\}/,
      /ngOnChanges[\s\S]*?\n\s*\}/,
      /ngOnInit[\s\S]*?\n\s*\}/
    ];

    let insertPoint = -1;
    for (const pattern of insertAfterPatterns) {
      const match = modified.match(pattern);
      if (match) {
        insertPoint = modified.indexOf(match[0]) + match[0].length;
        break;
      }
    }

    if (insertPoint !== -1) {
      const method = `

  override handleFieldChange(event: any) {
    // Handle field value changes
    // Example: Trim text, format numbers, etc.
    this.onChange.emit(event);
  }`;
      modified = modified.slice(0, insertPoint) + method + modified.slice(insertPoint);
      fixes.push('Added handleFieldChange() method');
    }
  } else {
    // Fix 9: Ensure handleFieldChange emits onChange
    if (!/handleFieldChange[\s\S]*?this\.onChange\.emit/.test(modified)) {
      const handleFieldChangeMatch = modified.match(/(handleFieldChange[\s\S]*?)(^\s*\})/m);
      if (handleFieldChangeMatch) {
        const insertPoint = modified.indexOf(handleFieldChangeMatch[2]);
        const emit = `    this.onChange.emit(event);\n  `;
        modified = modified.slice(0, insertPoint) + emit + modified.slice(insertPoint);
        fixes.push('Added onChange.emit() in handleFieldChange()');
      }
    }
  }

  // Fix 10: Add this.initialized = true if missing
  if (!/this\.initialized\s*=\s*true/.test(modified)) {
    // Try to add it in ngOnInit if it exists
    const ngOnInitMatch = modified.match(/(ngOnInit[\s\S]*?)(^\s*\})/m);
    if (ngOnInitMatch) {
      const insertPoint = modified.indexOf(ngOnInitMatch[2]);
      const initialization = `    this.initialized = true;\n  `;
      modified = modified.slice(0, insertPoint) + initialization + modified.slice(insertPoint);
      fixes.push('Added this.initialized = true in ngOnInit()');
    }
  }

  return { modified, fixes };
}

/**
 * Process single file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);

    if (!isInputComponent(content, fileName)) {
      results.skippedFiles.push({
        path: filePath,
        reason: 'Not an input component (does not extend MvsFormFieldBaseComponent)'
      });
      return;
    }

    const result = fixInputComponent(content, fileName);

    if (result.fixes.length === 0) {
      results.skippedFiles.push({
        path: filePath,
        reason: 'No violations found'
      });
      return;
    }

    // Write back to file unless dry-run
    if (!dryRun) {
      fs.writeFileSync(filePath, result.modified, 'utf-8');
    }

    results.fixedFiles.push({
      path: filePath,
      fixes: result.fixes
    });

  } catch (error) {
    results.errors.push({
      path: filePath,
      error: error.message
    });
  }
}

/**
 * Process directory recursively
 */
function processDirectory(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          processDirectory(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.component.ts')) {
        // Only process files matching input component pattern
        if (matchesInputComponentPattern(entry.name)) {
          processFile(fullPath);
        }
      }
    }
  } catch (error) {
    results.errors.push({
      path: dirPath,
      error: error.message
    });
  }
}

/**
 * Main execution
 */
function main() {
  const resolvedPath = path.resolve(inputPath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(JSON.stringify({
      fixedFiles: [],
      skippedFiles: [],
      errors: [{ path: resolvedPath, error: 'Path does not exist' }]
    }, null, 2));
    process.exit(1);
  }

  const stat = fs.statSync(resolvedPath);

  if (stat.isDirectory()) {
    processDirectory(resolvedPath);
  } else if (stat.isFile()) {
    processFile(resolvedPath);
  } else {
    results.errors.push({
      path: resolvedPath,
      error: 'Path is neither a file nor a directory'
    });
  }

  // Output JSON only
  console.log(JSON.stringify(results, null, 2));

  // Exit with error code if there were errors
  process.exit(results.errors.length > 0 ? 1 : 0);
}

main();
