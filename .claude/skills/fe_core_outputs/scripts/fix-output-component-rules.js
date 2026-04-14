#!/usr/bin/env node

/**
 * Output Component Auto-Fix Script
 *
 * ============================================================================
 * PURPOSE
 * ============================================================================
 * Automatically fixes deterministic violations in Claude-generated Output Component files.
 * Works in conjunction with check-guidelines.js validator.
 *
 * ============================================================================
 * MODULE SCOPING
 * ============================================================================
 * When given a directory, only processes files matching output component patterns:
 * - mvs-form-control-output-*.component.ts
 * - mvs-form-control-*.component.ts
 * - *-output-*.component.ts
 *
 * ============================================================================
 * USAGE
 * ============================================================================
 * Fix single file:
 *   node fix-output-component-rules.js ./mvs-form-control-output-custom.component.ts
 *
 * Fix all files in directory:
 *   node fix-output-component-rules.js ./src/app/shared/form/output
 *
 * Preview changes without writing:
 *   node fix-output-component-rules.js ./src/app/shared/form/output --dry-run
 *
 * ============================================================================
 * OUTPUT FORMAT
 * ============================================================================
 * JSON ONLY - No other output:
 * {
 *   "fixedFiles": [
 *     {
 *       "path": "path/to/file.ts",
 *       "fixes": ["Added refreshComponent() method", "Added super.ngOnInit() call"]
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
 * - Missing extends MvsFormFieldOutputBaseComponent
 * - Incorrect selector pattern
 *
 * LIFECYCLE METHODS:
 * - Missing super.ngOnInit() calls
 * - Missing super.ngOnDestroy() calls
 * - Missing ngOnChanges implementation with value handling
 * - Missing refreshComponent() call in ngOnInit
 *
 * REQUIRED METHODS:
 * - Missing refreshComponent() method
 *
 * REQUIRED PATTERNS:
 * - Missing this.initialized = true
 * - Missing null/undefined value handling
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
 * Check if file matches output component pattern
 */
function matchesOutputComponentPattern(fileName) {
  return (
    fileName.includes('output') && fileName.endsWith('.component.ts') ||
    /^mvs-form-control-output-.*\.component\.ts$/.test(fileName) ||
    /^mvs-form-control-.*\.component\.ts$/.test(fileName)
  );
}

/**
 * Detect if file is an output component
 */
function isOutputComponent(content, fileName) {
  return (
    /extends\s+MvsFormFieldOutputBaseComponent/.test(content) ||
    matchesOutputComponentPattern(fileName)
  );
}

/**
 * Fix output component violations
 */
function fixOutputComponent(content, fileName) {
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

  // Fix 2: Ensure extends MvsFormFieldOutputBaseComponent
  if (!/extends\s+MvsFormFieldOutputBaseComponent/.test(modified)) {
    const extendsMatch = modified.match(/class\s+\w+\s+(extends\s+\w+)?/);
    if (extendsMatch) {
      if (extendsMatch[1]) {
        // Replace existing extends
        modified = modified.replace(
          extendsMatch[1],
          'extends MvsFormFieldOutputBaseComponent'
        );
        fixes.push('Changed base class to MvsFormFieldOutputBaseComponent');
      } else {
        // Add extends clause
        modified = modified.replace(
          /class\s+\w+/,
          match => `${match} extends MvsFormFieldOutputBaseComponent`
        );
        fixes.push('Added extends MvsFormFieldOutputBaseComponent');
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
      // Find the end of ngOnInit method
      const ngOnInitMatch = modified.match(/(ngOnInit\s*\(\s*\)\s*[:{][\s\S]*?)(^\s*\})/m);
      if (ngOnInitMatch) {
        const insertPoint = modified.indexOf(ngOnInitMatch[2]);
        const refreshCall = `    this.refreshComponent();\n  `;
        modified = modified.slice(0, insertPoint) + refreshCall + modified.slice(insertPoint);
        fixes.push('Added refreshComponent() call in ngOnInit()');
      }
    }
  }

  // Fix 5: Add ngOnChanges implementation if missing
  if (!/ngOnChanges\s*\([^)]*\)\s*[:{]/.test(modified)) {
    const ngOnInitMatch = modified.match(/(ngOnInit[\s\S]*?\n\s*\})/);
    if (ngOnInitMatch) {
      const insertPoint = modified.indexOf(ngOnInitMatch[1]) + ngOnInitMatch[1].length;
      const ngOnChanges = `

  override ngOnChanges(changes: SimpleChanges) {
    if (changes['value']) {
      this.refreshComponent();
    }
  }`;
      modified = modified.slice(0, insertPoint) + ngOnChanges + modified.slice(insertPoint);
      fixes.push('Added ngOnChanges() method with value change handling');
    }
  } else {
    // Fix 6: Ensure ngOnChanges handles value changes
    const valueChangePattern = /ngOnChanges[\s\S]*?(changes\[['"]value['"]\]|this\.refreshComponent)/;
    if (!valueChangePattern.test(modified)) {
      const ngOnChangesMatch = modified.match(/(ngOnChanges\s*\([^)]*\)\s*[:{]\s*)/);
      if (ngOnChangesMatch) {
        const insertPoint = modified.indexOf(ngOnChangesMatch[1]) + ngOnChangesMatch[1].length;
        const valueHandler = `
    if (changes['value']) {
      this.refreshComponent();
    }`;
        modified = modified.slice(0, insertPoint) + valueHandler + modified.slice(insertPoint);
        fixes.push('Added value change handling in ngOnChanges()');
      }
    }
  }

  // Fix 7: Add super.ngOnDestroy() if missing
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

  // Fix 8: Add refreshComponent() method if missing
  if (!/refreshComponent\s*\(\s*\)\s*[:{]/.test(modified)) {
    // Find a good insertion point (after ngOnChanges or ngOnDestroy if they exist)
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
    if (!this.value || this.value === '-') {
      this.initialized = true;
      return;
    }

    // TODO: Add value formatting logic here
    // Example: this.formattedValue = this.formatValue(this.value);

    this.initialized = true;
  }`;
      modified = modified.slice(0, insertPoint) + method + modified.slice(insertPoint);
      fixes.push('Added refreshComponent() method');
    }
  }

  // Fix 9: Add this.initialized = true if missing
  if (!/this\.initialized\s*=\s*true/.test(modified)) {
    // Try to add it in refreshComponent if it exists
    const refreshComponentMatch = modified.match(/(refreshComponent[\s\S]*?)(^\s*\})/m);
    if (refreshComponentMatch) {
      const insertPoint = modified.indexOf(refreshComponentMatch[2]);
      const initialization = `    this.initialized = true;\n  `;
      modified = modified.slice(0, insertPoint) + initialization + modified.slice(insertPoint);
      fixes.push('Added this.initialized = true in refreshComponent()');
    }
  }

  // Fix 10: Add null/undefined handling in refreshComponent if missing
  const refreshComponentExists = /refreshComponent\s*\(\s*\)\s*[:{]/.test(modified);
  if (refreshComponentExists) {
    const nullCheckPatterns = [
      /!this\.value/,
      /this\.value\s*===\s*null/,
      /this\.value\s*===\s*undefined/,
      /this\.value\s*==\s*null/,
      /this\.value\s*===\s*['"]-['"]/
    ];

    const hasNullCheck = nullCheckPatterns.some(pattern => {
      const refreshMatch = modified.match(/refreshComponent[\s\S]*?\n\s*\}/);
      return refreshMatch && pattern.test(refreshMatch[0]);
    });

    if (!hasNullCheck) {
      const refreshMatch = modified.match(/(refreshComponent\s*\(\s*\)\s*[:{]\s*)/);
      if (refreshMatch) {
        const insertPoint = modified.indexOf(refreshMatch[1]) + refreshMatch[1].length;
        const nullCheck = `
    if (!this.value || this.value === '-') {
      return;
    }
`;
        modified = modified.slice(0, insertPoint) + nullCheck + modified.slice(insertPoint);
        fixes.push('Added null/undefined value handling');
      }
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

    if (!isOutputComponent(content, fileName)) {
      results.skippedFiles.push({
        path: filePath,
        reason: 'Not an output component (does not extend MvsFormFieldOutputBaseComponent)'
      });
      return;
    }

    const result = fixOutputComponent(content, fileName);

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
        // Only process files matching output component pattern
        if (matchesOutputComponentPattern(entry.name)) {
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
