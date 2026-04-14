#!/usr/bin/env node

/**
 * MvsCoreService Guideline Validator
 *
 * Outputs JSON. Invokes fix-guidelines.js automatically.
 * Exit code 0 = pass, 1 = fail
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SKILL_NAME = 'mvs-core-service';
const FIX_SCRIPT = path.resolve(__dirname, 'fix-guidelines.js');

// Auto-fixable rules (handled by fix-guidelines.js)
const AUTO_FIXABLE_RULES = new Set(['ETA1']);

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

function usesMvsCoreService(content) {
  return /MvsCoreService/.test(content) ||
         /getCrudService\s*[<(]/.test(content) ||
         /getObjectComponent\s*\(/.test(content);
}

function validateFile(filePath, content) {
  const violations = [];
  const relativePath = path.relative(process.cwd(), filePath);

  if (!usesMvsCoreService(content)) {
    return violations;
  }

  // INJ3: Check for hardcoded entity types used multiple times
  const getCrudServiceCalls = content.match(/getCrudService\s*[<(][^)]*\)/g) || [];
  const entityTypes = new Map();

  for (const call of getCrudServiceCalls) {
    const typeMatch = call.match(/['"]([^'"]+)['"]/);
    if (typeMatch) {
      const type = typeMatch[1];
      entityTypes.set(type, (entityTypes.get(type) || 0) + 1);
    }
  }

  for (const [type, count] of entityTypes.entries()) {
    if (count >= 3) {
      violations.push({
        file: relativePath,
        rule: 'INJ3',
        message: `Entity type "${type}" used ${count} times - consider injecting specific service`,
        autoFixable: false
      });
      filesWithErrors.add(filePath);
    }
  }

  // SR1: getCrudService() return must be checked for null
  const crudServiceCalls = content.match(/getCrudService\s*[<(][^)]*\)/g) || [];
  for (const call of crudServiceCalls) {
    const afterCall = content.substring(content.indexOf(call) + call.length, content.indexOf(call) + call.length + 200);
    if (!/if\s*\(/.test(afterCall) && !/\?\.\w/.test(afterCall) && !/!\s*===?\s*null/.test(afterCall)) {
      violations.push({
        file: relativePath,
        rule: 'SR1',
        message: 'getCrudService() return must be checked for null before use',
        autoFixable: false
      });
      filesWithErrors.add(filePath);
      break;
    }
  }

  // CR1: getObjectComponent() must receive MvsCrudModeEnum
  const componentCalls = content.match(/getObjectComponent\s*\([^)]*\)/g) || [];
  for (const call of componentCalls) {
    if (!/MvsCrudModeEnum\.\w+/.test(call) && !/mode\s*[:,]/.test(call)) {
      violations.push({
        file: relativePath,
        rule: 'CR1',
        message: 'getObjectComponent() must receive MvsCrudModeEnum as mode parameter',
        autoFixable: false
      });
      filesWithErrors.add(filePath);
      break;
    }
  }

  // CR2: getObjectComponent() return must be checked for null
  for (const call of componentCalls) {
    const afterCall = content.substring(content.indexOf(call) + call.length, content.indexOf(call) + call.length + 200);
    if (!/if\s*\(/.test(afterCall) && !/\?\.\w/.test(afterCall)) {
      violations.push({
        file: relativePath,
        rule: 'CR2',
        message: 'getObjectComponent() return must be checked for null before use',
        autoFixable: false
      });
      filesWithErrors.add(filePath);
      break;
    }
  }

  // ETA1: Entity type alias pattern validation
  const aliasMatches = content.match(/['"]([a-zA-Z]+\.[a-zA-Z]+)['"]/g) || [];
  for (const match of aliasMatches) {
    const alias = match.replace(/['"]/g, '');
    if (!/^[a-z]+\.[A-Z][a-zA-Z]*$/.test(alias)) {
      violations.push({
        file: relativePath,
        rule: 'ETA1',
        message: `Entity alias "${alias}" must follow pattern {module}.{EntityName}`,
        autoFixable: true
      });
      filesWithErrors.add(filePath);
      break;
    }
  }

  // MA1: getObjectTypeId() must be handled as async
  if (/getObjectTypeId\s*\([^)]*\)/.test(content)) {
    if (!/\.subscribe\s*\(/.test(content) && !/\.pipe\s*\(/.test(content) && !/async/.test(content)) {
      violations.push({
        file: relativePath,
        rule: 'MA1',
        message: 'getObjectTypeId() returns Observable - must handle as async',
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
  let filesWithMvsCoreService = 0;

  for (const filePath of tsFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      if (usesMvsCoreService(content)) {
        filesWithMvsCoreService++;
        const violations = validateFile(filePath, content);
        allViolations = allViolations.concat(violations);
      }

      filesChecked++;
    } catch (err) {
      // Silent error handling
    }
  }

  return { allViolations, filesChecked, filesWithMvsCoreService };
}

function run() {
  const targetPath = process.argv[2] || process.cwd();
  let searchDir = targetPath;

  if (fs.existsSync(path.join(searchDir, 'src'))) {
    searchDir = path.join(searchDir, 'src');
  } else if (fs.existsSync(path.join(searchDir, 'features'))) {
    searchDir = path.join(searchDir, 'features');
  }

  let { allViolations, filesChecked, filesWithMvsCoreService } = runValidation(searchDir);

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
    filesWithMvsCoreService = revalidation.filesWithMvsCoreService;
  }

  const result = {
    skill: SKILL_NAME,
    status: allViolations.length === 0 ? 'pass' : 'fail',
    violations: allViolations,
    summary: {
      filesChecked: filesChecked,
      filesWithMvsCoreService: filesWithMvsCoreService,
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
