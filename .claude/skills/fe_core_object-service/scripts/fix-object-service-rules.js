#!/usr/bin/env node

/**
 * Object Service Auto-Fix Script
 *
 * ============================================================================
 * PURPOSE
 * ============================================================================
 * Automatically fixes deterministic violations in Claude-generated Object Service files.
 * Works in conjunction with check-guidelines.js validator.
 *
 * ============================================================================
 * MODULE SCOPING
 * ============================================================================
 * When given a directory, only processes files matching module prefix patterns:
 * - sp-*.ts (Service Provisioning)
 * - cr-*.ts (CRM)
 * - tm-*.ts (Time Management)
 * - mvs-*.ts (MVS Core)
 * - [module-prefix]-*.ts
 *
 * ============================================================================
 * USAGE
 * ============================================================================
 * Fix single file:
 *   node fix-object-service-rules.js ./project.service.ts
 *
 * Fix all files in directory:
 *   node fix-object-service-rules.js ./src/app/sp/services
 *
 * Preview changes without writing:
 *   node fix-object-service-rules.js ./src/app/sp/services --dry-run
 *
 * ============================================================================
 * OUTPUT FORMAT
 * ============================================================================
 * JSON ONLY - No other output:
 * {
 *   "fixedFiles": [
 *     {
 *       "path": "path/to/file.ts",
 *       "fixes": ["Added getObjectComponent() method", "Added onChangedObject emit"]
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
 *       "error": "Unable to determine file type"
 *     }
 *   ]
 * }
 *
 * ============================================================================
 * DETERMINISTIC FIXES
 * ============================================================================
 * The script automatically fixes:
 *
 * SERVICES:
 * - Missing @Injectable() decorator
 * - Missing getObjectComponent(mode) method
 * - Missing MvsCrudModeEnum.create handling
 * - Missing component return statements
 * - Missing getObjectLabels() method (optional)
 * - Missing getObjectIcon() method (optional)
 *
 * CREATE COMPONENTS:
 * - Missing @Output() onChangedObject
 * - Missing @Output() onCancelObject
 * - Missing this.onChangedObject.emit() call
 * - Missing this.initialized = true
 * - Missing isDirty tracking
 * - Missing onComponentDirty.emit()
 *
 * VIEW COMPONENTS:
 * - Missing super.ngOnInit() calls
 * - Missing super.ngOnChanges() calls
 * - Missing super.ngOnDestroy() calls
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
 * Check if file matches module prefix pattern
 */
function matchesModulePrefix(fileName) {
  // Match patterns like: sp-*, cr-*, tm-*, mvs-*, etc.
  return /^[a-z]{2,4}-.*\.ts$/.test(fileName);
}

/**
 * Detect file type
 */
function detectFileType(content, fileName) {
  if (fileName.includes('.service.ts') || /extends\s+MvsCrudService/.test(content)) {
    return 'service';
  }

  if (fileName.includes('create-object') ||
      (fileName.includes('create') && /extends\s+ObjectBaseComponent/.test(content)) ||
      (/onChangedObject/.test(content) && /extends\s+ObjectBaseComponent/.test(content))) {
    return 'create-component';
  }

  if (/extends\s+ObjectBaseComponent/.test(content)) {
    return 'view-component';
  }

  return 'unknown';
}

/**
 * Fix service violations
 */
function fixService(content, fileName) {
  let modified = content;
  const fixes = [];

  // Fix 1: Add @Injectable() decorator if missing
  if (!/@Injectable\s*\(/.test(modified)) {
    const classMatch = modified.match(/(export\s+class\s+\w+)/);
    if (classMatch) {
      modified = modified.replace(
        classMatch[1],
        `@Injectable({ providedIn: 'root' })\n${classMatch[1]}`
      );
      fixes.push('Added @Injectable() decorator');
    }
  }

  // Fix 2: Add getObjectComponent() method if missing
  if (!/getObjectComponent\s*\([^)]*\)\s*[:{]/.test(modified)) {
    // Extract service class name and derive component name
    const serviceNameMatch = modified.match(/class\s+(\w+)Service/);
    if (serviceNameMatch) {
      const baseName = serviceNameMatch[1];
      const modulePrefix = fileName.split('-')[0]; // e.g., 'sp' from 'sp-project.service.ts'
      const componentName = `${modulePrefix.charAt(0).toUpperCase() + modulePrefix.slice(1)}${baseName}Component`;
      const createComponentName = `${modulePrefix.charAt(0).toUpperCase() + modulePrefix.slice(1)}CreateObject${baseName}Component`;

      // Find constructor end to insert after it
      const constructorMatch = modified.match(/constructor\s*\([^)]*\)\s*\{[^}]*\}/s);
      if (constructorMatch) {
        const insertPoint = modified.indexOf(constructorMatch[0]) + constructorMatch[0].length;
        const method = `

  getObjectComponent(mode: MvsCrudModeEnum = MvsCrudModeEnum.update): Type<any> {
    if (mode === MvsCrudModeEnum.create) {
      return ${createComponentName};
    }
    return ${componentName};
  }`;
        modified = modified.slice(0, insertPoint) + method + modified.slice(insertPoint);
        fixes.push('Added getObjectComponent() method');
        fixes.push('Added MvsCrudModeEnum.create handling');
      }
    }
  } else {
    // Fix 3: Add MvsCrudModeEnum.create handling if missing
    if (!/MvsCrudModeEnum\.create/.test(modified)) {
      const getObjectComponentMatch = modified.match(/(getObjectComponent[^{]*\{)([^}]*)/s);
      if (getObjectComponentMatch) {
        const serviceNameMatch = modified.match(/class\s+(\w+)Service/);
        if (serviceNameMatch) {
          const baseName = serviceNameMatch[1];
          const modulePrefix = fileName.split('-')[0];
          const createComponentName = `${modulePrefix.charAt(0).toUpperCase() + modulePrefix.slice(1)}CreateObject${baseName}Component`;

          const methodBody = getObjectComponentMatch[2];
          const insertPoint = modified.indexOf(getObjectComponentMatch[1]) + getObjectComponentMatch[1].length;
          const createHandler = `
    if (mode === MvsCrudModeEnum.create) {
      return ${createComponentName};
    }`;
          modified = modified.slice(0, insertPoint) + createHandler + modified.slice(insertPoint);
          fixes.push('Added MvsCrudModeEnum.create handling');
        }
      }
    }
  }

  // Fix 4: Add getObjectLabels() if missing (optional but recommended)
  if (!/getObjectLabels\s*\(\s*\)\s*[:{]/.test(modified)) {
    const serviceNameMatch = modified.match(/class\s+(\w+)Service/);
    if (serviceNameMatch) {
      const baseName = serviceNameMatch[1];
      const singular = baseName;
      const plural = baseName + 's';

      // Find a good insertion point (after getObjectComponent)
      const getObjectComponentMatch = modified.match(/getObjectComponent[^}]*\}[^}]*\}/s);
      if (getObjectComponentMatch) {
        const insertPoint = modified.indexOf(getObjectComponentMatch[0]) + getObjectComponentMatch[0].length;
        const method = `

  getObjectLabels(): string[] {
    return ['${singular}', '${plural}'];
  }`;
        modified = modified.slice(0, insertPoint) + method + modified.slice(insertPoint);
        fixes.push('Added getObjectLabels() method');
      }
    }
  }

  return { modified, fixes };
}

/**
 * Fix create component violations
 */
function fixCreateComponent(content, fileName) {
  let modified = content;
  const fixes = [];

  // Fix 1: Add @Output() onChangedObject if missing
  if (!/@Output\(\)\s*onChangedObject/.test(modified)) {
    const classBodyMatch = modified.match(/(export\s+class\s+\w+[^{]*\{)/s);
    if (classBodyMatch) {
      const insertPoint = modified.indexOf(classBodyMatch[1]) + classBodyMatch[1].length;
      const output = `
  @Output() onChangedObject = new EventEmitter<ObjectChangeEvent>();`;
      modified = modified.slice(0, insertPoint) + output + modified.slice(insertPoint);
      fixes.push('Added @Output() onChangedObject');
    }
  }

  // Fix 2: Add @Output() onCancelObject if missing
  if (!/@Output\(\)\s*onCancelObject/.test(modified)) {
    const onChangedObjectMatch = modified.match(/(@Output\(\)\s*onChangedObject[^\n]*)/);
    if (onChangedObjectMatch) {
      const insertPoint = modified.indexOf(onChangedObjectMatch[1]) + onChangedObjectMatch[1].length;
      const output = `
  @Output() onCancelObject = new EventEmitter<void>();`;
      modified = modified.slice(0, insertPoint) + output + modified.slice(insertPoint);
      fixes.push('Added @Output() onCancelObject');
    }
  }

  // Fix 3: Add this.onChangedObject.emit() if missing in save methods
  if (!/this\.onChangedObject\.emit\s*\(/.test(modified)) {
    // Find save/create/submit method
    const saveMethodMatch = modified.match(/((save|create|submit)\w*\s*\([^)]*\)\s*\{[\s\S]*?)(this\.messageService\.showSuccess[\s\S]*?;)/i);
    if (saveMethodMatch) {
      const insertPoint = modified.indexOf(saveMethodMatch[3]) + saveMethodMatch[3].length;

      // Try to determine entity type from file name
      const entityMatch = fileName.match(/create-object-(\w+)\.component/);
      const entityName = entityMatch ? entityMatch[1].charAt(0).toUpperCase() + entityMatch[1].slice(1) : 'Entity';
      const modulePrefix = fileName.split('-')[0];
      const objectType = `${modulePrefix}.${entityName}`;

      const emit = `

      this.onChangedObject.emit({
        objectType: '${objectType}',
        action: 'created',
        after: result
      });`;
      modified = modified.slice(0, insertPoint) + emit + modified.slice(insertPoint);
      fixes.push('Added this.onChangedObject.emit() call');
    }
  }

  // Fix 4: Add this.initialized = true if missing
  if (!/this\.initialized\s*=\s*true/.test(modified)) {
    const ngOnInitMatch = modified.match(/(ngOnInit\s*\(\s*\)\s*[:{][^}]*)(super\.ngOnInit\s*\(\s*\)\s*;)/s);
    if (ngOnInitMatch) {
      // Find end of ngOnInit method
      const methodStart = modified.indexOf(ngOnInitMatch[0]);
      const methodBody = ngOnInitMatch[0];
      let braceCount = 0;
      let inMethod = false;
      let insertPoint = methodStart;

      for (let i = methodStart; i < modified.length; i++) {
        if (modified[i] === '{') {
          inMethod = true;
          braceCount++;
        } else if (modified[i] === '}') {
          braceCount--;
          if (inMethod && braceCount === 0) {
            insertPoint = i;
            break;
          }
        }
      }

      const initialization = `
    this.initialized = true;
  `;
      modified = modified.slice(0, insertPoint) + initialization + modified.slice(insertPoint);
      fixes.push('Added this.initialized = true');
    }
  }

  // Fix 5: Add isDirty tracking in form change handlers
  if (!/this\.isDirty\s*=/.test(modified)) {
    const onFieldChangeMatch = modified.match(/(onFieldChange\s*\(\s*\)\s*\{)/);
    if (onFieldChangeMatch) {
      const insertPoint = modified.indexOf(onFieldChangeMatch[1]) + onFieldChangeMatch[1].length;
      const tracking = `
    this.isDirty = true;
    this.onComponentDirty.emit(true);`;
      modified = modified.slice(0, insertPoint) + tracking + modified.slice(insertPoint);
      fixes.push('Added isDirty tracking');
    }
  }

  // Fix 6: Add onComponentDirty.emit() if missing
  if (!/this\.onComponentDirty\.emit/.test(modified) && /this\.isDirty\s*=\s*true/.test(modified)) {
    const isDirtyMatch = modified.match(/(this\.isDirty\s*=\s*true\s*;)/);
    if (isDirtyMatch) {
      const insertPoint = modified.indexOf(isDirtyMatch[1]) + isDirtyMatch[1].length;
      const emit = `
    this.onComponentDirty.emit(true);`;
      modified = modified.slice(0, insertPoint) + emit + modified.slice(insertPoint);
      fixes.push('Added onComponentDirty.emit()');
    }
  }

  return { modified, fixes };
}

/**
 * Fix view component violations
 */
function fixViewComponent(content, fileName) {
  let modified = content;
  const fixes = [];

  // Fix 1: Add super.ngOnInit() if missing
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

  // Fix 2: Add super.ngOnChanges() if missing
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

  // Fix 3: Add super.ngOnDestroy() if missing
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

  // Fix 4: Add this.initialized = true if missing
  if (!/this\.initialized\s*=\s*true/.test(modified)) {
    const ngOnInitMatch = modified.match(/(ngOnInit\s*\(\s*\)\s*[:{][^}]*super\.ngOnInit[^;]*;)/s);
    if (ngOnInitMatch) {
      const insertPoint = modified.indexOf(ngOnInitMatch[1]) + ngOnInitMatch[1].length;
      const initialization = `
    this.initialized = true;`;
      modified = modified.slice(0, insertPoint) + initialization + modified.slice(insertPoint);
      fixes.push('Added this.initialized = true');
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
    const fileType = detectFileType(content, fileName);

    if (fileType === 'unknown') {
      results.skippedFiles.push({
        path: filePath,
        reason: 'Unable to determine file type (not a service or ObjectBaseComponent)'
      });
      return;
    }

    let result;
    switch (fileType) {
      case 'service':
        result = fixService(content, fileName);
        break;
      case 'create-component':
        result = fixCreateComponent(content, fileName);
        break;
      case 'view-component':
        result = fixViewComponent(content, fileName);
        break;
      default:
        results.skippedFiles.push({
          path: filePath,
          reason: 'Unknown file type'
        });
        return;
    }

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
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        // Only process files matching module prefix pattern
        if (matchesModulePrefix(entry.name)) {
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
