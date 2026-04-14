#!/usr/bin/env node

/**
 * MvsCrudService Guideline Validator
 *
 * Outputs JSON. Invokes fix-guidelines.js automatically.
 * Exit code 0 = pass, 1 = fail
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SKILL_NAME = 'mvs-crud-service';
const FIX_SCRIPT = path.resolve(__dirname, 'fix-guidelines.js');

// Auto-fixable rules: import additions only
// SC1, SC3, SC4, LIST1, LIST3, LIST4, LIST5, OBS2, ERR1, INJ1 are NOT auto-fixable
const AUTO_FIXABLE_RULES = new Set([]);

const filesWithErrors = new Set();
const filesAttemptedFix = new Set();
const filesFailedFix = new Set();

function findTsFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!entry.name.includes('node_modules') && !entry.name.startsWith('.')) {
        findTsFiles(fullPath, files);
      }
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

function isEntityServiceFile(content, filePath) {
  return /extends\s+MvsCrudService/.test(content) ||
         (filePath.includes('.service.ts') && /MvsCrudService/.test(content));
}

function usesCrudOperations(content) {
  return /\.(list|get|create|update|delete|deleteSoft)\s*\(/.test(content);
}

function validateFile(filePath, content) {
  const violations = [];
  const relativePath = path.relative(process.cwd(), filePath);

  // SC1: Entity services must extend MvsCrudService
  if (filePath.includes('.service.ts') && /class\s+\w+Service/.test(content)) {
    if (usesCrudOperations(content) || /Injectable/.test(content)) {
      if (/class\s+\w+Service\s*{/.test(content) && !isEntityServiceFile(content, filePath)) {
        if (/baseUrl/.test(content) || /apiUrl/.test(content) || /http\.\w+/.test(content)) {
          violations.push({
            file: relativePath,
            rule: 'SC1',
            message: 'Entity service class should extend MvsCrudService',
            autoFixable: false
          });
          filesWithErrors.add(filePath);
        }
      }
    }
  }

  // SC3: Constructor must call super(http, apiUrl)
  if (isEntityServiceFile(content, filePath)) {
    if (/constructor\s*\([^)]*\)\s*{/.test(content)) {
      if (!/super\s*\(\s*http\s*,/.test(content)) {
        violations.push({
          file: relativePath,
          rule: 'SC3',
          message: 'Constructor must call super(http, apiUrl)',
          autoFixable: false
        });
        filesWithErrors.add(filePath);
      }
    }

    // SC4: API URL format
    if (!/MvsCrudService\.baseUrl\s*\+\s*['"]\/\w+\/\w+['"]/.test(content)) {
      if (/super\s*\(\s*http\s*,/.test(content)) {
        violations.push({
          file: relativePath,
          rule: 'SC4',
          message: 'API URL should use MvsCrudService.baseUrl + "/module/entities"',
          autoFixable: false
        });
        filesWithErrors.add(filePath);
      }
    }
  }

  // LIST1: list() must receive ObjectRequestList
  const listCalls = content.match(/\.list\s*\([^)]*\)/g);
  if (listCalls) {
    for (const call of listCalls) {
      if (!/\.list\s*\(\s*(request|\w+Request|ObjectRequestList)/.test(call)) {
        if (!/\.list\s*\(\s*\)/.test(call)) {
          violations.push({
            file: relativePath,
            rule: 'LIST1',
            message: 'list() should receive ObjectRequestList as parameter',
            autoFixable: false
          });
          filesWithErrors.add(filePath);
          break;
        }
      }
    }
  }

  // LIST3: Filters must use FilterCriteria.create()
  if (/createBasic\s*\([^,]+,\s*\[(?!\s*\])/.test(content)) {
    if (!/FilterCriteria\.create\s*\(/.test(content)) {
      violations.push({
        file: relativePath,
        rule: 'LIST3',
        message: 'Filters must use FilterCriteria.create()',
        autoFixable: false
      });
      filesWithErrors.add(filePath);
    }
  }

  // LIST4: Sortings must use new Sorting()
  if (/createBasic\s*\([^,]+,\s*[^,]+,\s*\[(?!\s*\])/.test(content)) {
    if (!/new\s+Sorting\s*\(/.test(content)) {
      violations.push({
        file: relativePath,
        rule: 'LIST4',
        message: 'Sortings must use new Sorting()',
        autoFixable: false
      });
      filesWithErrors.add(filePath);
    }
  }

  // LIST5: Pagination must use PagingDto.create()
  if (/\.paging\s*=/.test(content)) {
    if (!/PagingDto\.create\s*\(/.test(content)) {
      violations.push({
        file: relativePath,
        rule: 'LIST5',
        message: 'Pagination must use PagingDto.create(page, size)',
        autoFixable: false
      });
      filesWithErrors.add(filePath);
    }
  }

  // OBS2: list() callback must be typecast
  const listSubscribes = content.match(/\.list\s*\([^)]*\)[^]*?\.subscribe\s*\(\s*\{?[^}]*next:\s*\([^)]*\)/g);
  if (listSubscribes) {
    for (const match of listSubscribes) {
      if (!/DtoList<\w+Dto>/.test(match)) {
        violations.push({
          file: relativePath,
          rule: 'OBS2',
          message: 'list() subscribe callback must be typecast to DtoList<EntityDto>',
          autoFixable: false
        });
        filesWithErrors.add(filePath);
        break;
      }
    }
  }

  // ERR1: CRUD operations should have error callbacks
  const crudCalls = content.match(/\.(list|get|create|update|delete)\s*\([^)]*\)\s*\.\s*subscribe\s*\(/g);
  if (crudCalls) {
    const hasErrorHandlers = /\.subscribe\s*\(\s*\{[^}]*error:/.test(content) ||
                              /\.subscribe\s*\([^,]+,\s*[^,)]+\)/.test(content) ||
                              /catchError/.test(content);

    if (!hasErrorHandlers && crudCalls.length > 0) {
      violations.push({
        file: relativePath,
        rule: 'ERR1',
        message: 'CRUD operations should have error callbacks',
        autoFixable: false
      });
      filesWithErrors.add(filePath);
    }
  }

  // INJ1: MvsCrudService must not be injected directly
  if (/private\s+\w+:\s*MvsCrudService[^a-zA-Z]/.test(content)) {
    if (!/extends\s+MvsCrudService/.test(content)) {
      violations.push({
        file: relativePath,
        rule: 'INJ1',
        message: 'MvsCrudService must NOT be injected directly (abstract)',
        autoFixable: false
      });
      filesWithErrors.add(filePath);
    }
  }

  return violations;
}

function runValidation(searchDir) {
  filesWithErrors.clear();

  const tsFiles = findTsFiles(searchDir);
  let allViolations = [];
  let filesChecked = 0;
  let serviceFiles = 0;

  for (const filePath of tsFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      if (isEntityServiceFile(content, filePath) || usesCrudOperations(content)) {
        serviceFiles++;
        const violations = validateFile(filePath, content);
        allViolations = allViolations.concat(violations);
      }

      filesChecked++;
    } catch (err) {
      // Silent error handling
    }
  }

  return { allViolations, filesChecked, serviceFiles };
}

function run() {
  const targetPath = process.argv[2] || process.cwd();
  let searchDir = targetPath;

  if (fs.existsSync(path.join(searchDir, 'src'))) {
    searchDir = path.join(searchDir, 'src');
  } else if (fs.existsSync(path.join(searchDir, 'features'))) {
    searchDir = path.join(searchDir, 'features');
  }

  let { allViolations, filesChecked, serviceFiles } = runValidation(searchDir);

  // Track files before fix attempt
  const filesToFix = new Set(filesWithErrors);

  if (filesToFix.size > 0 && fs.existsSync(FIX_SCRIPT)) {
    for (const file of filesToFix) {
      filesAttemptedFix.add(file);
      try {
        execSync(`node "${FIX_SCRIPT}" "${file}"`, { stdio: 'pipe' });
      } catch (e) {
        filesFailedFix.add(file);
      }
    }

    // Re-validate after fixes
    const revalidation = runValidation(searchDir);
    allViolations = revalidation.allViolations;
    filesChecked = revalidation.filesChecked;
    serviceFiles = revalidation.serviceFiles;
  }

  const result = {
    skill: SKILL_NAME,
    status: allViolations.length === 0 ? 'pass' : 'fail',
    violations: allViolations,
    summary: {
      filesChecked: filesChecked,
      serviceFiles: serviceFiles,
      violationCount: allViolations.length,
      filesAttemptedFix: filesAttemptedFix.size,
      filesFailedFix: filesFailedFix.size,
      autoFixableViolations: allViolations.filter(v => v.autoFixable).length,
      validationOnlyViolations: allViolations.filter(v => !v.autoFixable).length
    }
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(allViolations.length === 0 ? 0 : 1);
}

run();
