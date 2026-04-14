#!/usr/bin/env node

/**
 * DTO Guideline Validator
 *
 * Outputs JSON. Invokes fix-guidelines.js automatically.
 * Exit code 0 = pass, 1 = fail
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SKILL_NAME = 'dto';
const FIX_SCRIPT = path.resolve(__dirname, 'fix-guidelines.js');

// Auto-fixable rules (handled by fix-guidelines.js)
const AUTO_FIXABLE_RULES = new Set(['EN4', 'E1', 'A2']);

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

function isDtoFile(filePath) {
  return filePath.endsWith('.dto.ts');
}

function isEnumFile(filePath) {
  return filePath.endsWith('.enum.ts');
}

function isEntityDto(filePath, content) {
  return filePath.includes('/entity/') ||
         filePath.includes('/dto/entity/') ||
         /extends\s+DtoDetail/.test(content);
}

function isApiDto(filePath) {
  return filePath.includes('/api/') || filePath.includes('/dto/api/');
}

function validateFile(filePath, content) {
  const violations = [];
  const relativePath = path.relative(process.cwd(), filePath);
  const fileName = path.basename(filePath);

  if (isDtoFile(filePath)) {
    const extendsDtoDetail = /extends\s+DtoDetail/.test(content);
    const isInterface = /export\s+interface\s+\w+Dto/.test(content);
    const isClass = /export\s+class\s+\w+Dto/.test(content);

    if (isEntityDto(filePath, content)) {
      if (!extendsDtoDetail && isClass) {
        violations.push({
          file: relativePath,
          rule: 'E1',
          message: 'Entity DTO class must extend DtoDetail',
          autoFixable: true
        });
        filesWithErrors.add(filePath);
      }

      if (isInterface && !isClass && extendsDtoDetail) {
        violations.push({
          file: relativePath,
          rule: 'E2',
          message: 'Entity DTOs must be class, not interface',
          autoFixable: false
        });
        filesWithErrors.add(filePath);
      }

      if (!/^[a-z][a-z0-9-]*\.dto\.ts$/.test(fileName)) {
        violations.push({
          file: relativePath,
          rule: 'E6',
          message: 'Entity DTO file must be named <entity-name>.dto.ts',
          autoFixable: false
        });
        filesWithErrors.add(filePath);
      }

      const classMatch = content.match(/export\s+class\s+(\w+)/);
      if (classMatch && !/^[A-Z][a-zA-Z0-9]*Dto$/.test(classMatch[1])) {
        violations.push({
          file: relativePath,
          rule: 'E7',
          message: 'Entity DTO class must be named <EntityName>Dto',
          autoFixable: false
        });
        filesWithErrors.add(filePath);
      }
    }

    if (isApiDto(filePath)) {
      if (isClass && !isInterface) {
        violations.push({
          file: relativePath,
          rule: 'A1',
          message: 'API DTOs must be interface, not class',
          autoFixable: false
        });
        filesWithErrors.add(filePath);
      }

      if (extendsDtoDetail) {
        violations.push({
          file: relativePath,
          rule: 'A2',
          message: 'API DTOs must NOT extend DtoDetail',
          autoFixable: true
        });
        filesWithErrors.add(filePath);
      }
    }

    const anyTypeMatches = content.match(/:\s*any\b/g);
    if (anyTypeMatches && anyTypeMatches.length > 0) {
      violations.push({
        file: relativePath,
        rule: 'B5',
        message: `"any" type used ${anyTypeMatches.length} time(s)`,
        autoFixable: false
      });
      filesWithErrors.add(filePath);
    }
  }

  if (isEnumFile(filePath)) {
    if (!filePath.includes('/enum/') && !filePath.includes('/dto/enum/')) {
      violations.push({
        file: relativePath,
        rule: 'EN1',
        message: 'Enum file must be in model/dto/enum/',
        autoFixable: false
      });
      filesWithErrors.add(filePath);
    }

    if (!/^[a-z][a-z0-9-]*\.enum\.ts$/.test(fileName)) {
      violations.push({
        file: relativePath,
        rule: 'EN2',
        message: 'Enum file must be named <enum-name>.enum.ts',
        autoFixable: false
      });
      filesWithErrors.add(filePath);
    }

    const enumMatch = content.match(/export\s+enum\s+(\w+)/);
    if (enumMatch && !/^[A-Z][a-zA-Z0-9]*Enum$/.test(enumMatch[1])) {
      violations.push({
        file: relativePath,
        rule: 'EN3',
        message: 'Enum must be named <EnumName>Enum',
        autoFixable: false
      });
      filesWithErrors.add(filePath);
    }

    const explicitAssignments = content.match(/\w+\s*=\s*['"][^'"]+['"]/g);
    if (explicitAssignments && explicitAssignments.length > 0) {
      violations.push({
        file: relativePath,
        rule: 'EN4',
        message: 'Enum values must not use explicit string assignments',
        autoFixable: true
      });
      filesWithErrors.add(filePath);
    }

    const numericAssignments = content.match(/\w+\s*=\s*\d+/g);
    if (numericAssignments && numericAssignments.length > 0) {
      violations.push({
        file: relativePath,
        rule: 'EN4',
        message: 'Enum values must not use explicit numeric assignments',
        autoFixable: true
      });
      filesWithErrors.add(filePath);
    }

    const enumBodyMatch = content.match(/enum\s+\w+\s*\{([^}]+)\}/);
    if (enumBodyMatch) {
      const enumBody = enumBodyMatch[1];
      const enumValues = enumBody.match(/\b([A-Za-z_][A-Za-z0-9_]*)\b(?=\s*[,=}])/g);

      if (enumValues) {
        const hasAllCaps = enumValues.every(v => /^[A-Z_0-9]+$/.test(v));
        const hasAllLower = enumValues.every(v => /^[a-z_0-9]+$/.test(v));
        const hasMixedCase = enumValues.some(v => /^[A-Z][a-z]/.test(v) || /^[a-z]+[A-Z]/.test(v));

        if (!hasAllCaps && !hasAllLower) {
          if (hasMixedCase) {
            violations.push({
              file: relativePath,
              rule: 'EN6',
              message: 'Enum values must not use PascalCase or camelCase',
              autoFixable: false
            });
            filesWithErrors.add(filePath);
          } else {
            violations.push({
              file: relativePath,
              rule: 'EN5',
              message: 'Enum values must use consistent casing (ALL_CAPS or all_lowercase)',
              autoFixable: false
            });
            filesWithErrors.add(filePath);
          }
        }
      }
    }
  }

  return violations;
}

function runValidation(searchDir) {
  filesWithErrors.clear();

  const tsFiles = findTsFiles(searchDir);
  let allViolations = [];
  let filesChecked = 0;
  let dtoFilesChecked = 0;
  let enumFilesChecked = 0;

  for (const filePath of tsFiles) {
    try {
      if (isDtoFile(filePath) || isEnumFile(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');

        if (isDtoFile(filePath)) dtoFilesChecked++;
        if (isEnumFile(filePath)) enumFilesChecked++;

        const violations = validateFile(filePath, content);
        allViolations = allViolations.concat(violations);
      }

      filesChecked++;
    } catch (err) {
      // Silent error handling
    }
  }

  return { allViolations, filesChecked, dtoFilesChecked, enumFilesChecked };
}

function run() {
  const targetPath = process.argv[2] || process.cwd();
  let searchDir = targetPath;

  if (fs.existsSync(path.join(searchDir, 'src'))) {
    searchDir = path.join(searchDir, 'src');
  } else if (fs.existsSync(path.join(searchDir, 'features'))) {
    searchDir = path.join(searchDir, 'features');
  }

  let { allViolations, filesChecked, dtoFilesChecked, enumFilesChecked } = runValidation(searchDir);

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
    dtoFilesChecked = revalidation.dtoFilesChecked;
    enumFilesChecked = revalidation.enumFilesChecked;
  }

  const result = {
    skill: SKILL_NAME,
    status: allViolations.length === 0 ? 'pass' : 'fail',
    violations: allViolations,
    summary: {
      filesChecked: filesChecked,
      dtoFiles: dtoFilesChecked,
      enumFiles: enumFilesChecked,
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
