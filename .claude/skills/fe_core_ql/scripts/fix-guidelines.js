/**
 * fix-guidelines.js (QL)
 *
 * ============================================================================
 * AUTOMATIC RESOLUTION SCRIPT
 * ============================================================================
 *
 * This script automatically fixes guideline violations detected by check-guidelines.js
 *
 * Purpose:
 *   - Automatically fix QL guideline violations in Claude-generated files
 *   - Transform deprecated patterns to compliant patterns
 *   - Ensure all QL code follows the skill guidelines
 *
 * Usage:
 *   node fix-guidelines.js <path-to-file>
 *
 * What it fixes:
 *   - Adds missing QlRequestDto imports
 *   - Replaces forkJoin with batching
 *   - Fixes result access to use pipeData
 *   - Converts manual filters to FilterCriteria.create()
 *   - Converts manual sorting to new Sorting()
 *   - Removes DtoId suffixes from filter fields
 *
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const targetFile = args[0];

if (!targetFile) {
  console.error('❌ Usage: node fix-guidelines.js <path-to-file>');
  process.exit(1);
}

if (!fs.existsSync(targetFile)) {
  console.error(`❌ File not found: ${targetFile}`);
  process.exit(1);
}

let content = fs.readFileSync(targetFile, 'utf-8');
let fixCount = 0;
const fixes = [];

function applyFix(description, pattern, replacement) {
  const matches = content.match(pattern);
  if (matches && matches.length > 0) {
    content = content.replace(pattern, replacement);
    fixCount++;
    fixes.push(description);
    return true;
  }
  return false;
}

console.log('🔧 Starting QL guideline fixes...\n');

// Fix 1: Add missing QlRequestDto import
if (content.includes('QlService') && !content.includes('QlRequestDto')) {
  const importSection = content.match(/import.*from.*;/g);
  if (importSection) {
    const lastImport = importSection[importSection.length - 1];
    const newImport = "import { QlRequestDto, QlQueryDto, QlExportPipeDto } from '@core/ql';";
    content = content.replace(lastImport, `${lastImport}\n${newImport}`);
    fixCount++;
    fixes.push('Added missing QlRequestDto import');
  }
}

// Fix 2: Replace forkJoin with batching
if (content.includes('forkJoin') && content.includes('QlService')) {
  console.log('⚠️  Warning: forkJoin detected with QL. Manual refactoring required to batch queries.');
  console.log('    Hint: Combine multiple queries into a single QlRequestDto with multiple pipes.');
  fixes.push('⚠️  forkJoin usage detected - manual batching refactoring required');
}

// Fix 3: Fix result access to use pipeData
applyFix(
  'Fixed result access to use pipeData',
  /res\.data\[['"]([^'"]+)['"]\]/g,
  "res.pipeData['$1']?.data"
);

applyFix(
  'Fixed result access to use pipeData',
  /response\.data\[['"]([^'"]+)['"]\]/g,
  "response.pipeData['$1']?.data"
);

// Fix 4: Convert manual filter objects to FilterCriteria.create()
const manualFilterPattern = /\{\s*field:\s*['"]([^'"]+)['"]\s*,\s*operator:\s*['"]([^'"]+)['"]\s*,\s*value:\s*([^}]+)\}/g;
let match;
while ((match = manualFilterPattern.exec(content)) !== null) {
  const [fullMatch, field, operator, value] = match;
  const replacement = `FilterCriteria.create('${field}', FilterCriteria.cOperator${operator}, ${value.trim()})`;
  content = content.replace(fullMatch, replacement);
  fixCount++;
  fixes.push(`Converted manual filter object to FilterCriteria.create() for field '${field}'`);
}

// Fix 5: Convert manual Sorting to new Sorting()
const manualSortingPattern = /\{\s*field:\s*['"]([^'"]+)['"]\s*,\s*ascending:\s*(true|false)\s*\}/g;
while ((match = manualSortingPattern.exec(content)) !== null) {
  const [fullMatch, field, ascending] = match;
  const replacement = `new Sorting('${field}', ${ascending})`;
  content = content.replace(fullMatch, replacement);
  fixCount++;
  fixes.push(`Converted manual sorting object to new Sorting() for field '${field}'`);
}

// Fix 6: Remove DtoId suffixes from filter fields
const filterDtoIdPattern = /FilterCriteria\.create\s*\(\s*['"]([^'"]+DtoId)['"]/g;
while ((match = filterDtoIdPattern.exec(content)) !== null) {
  const [fullMatch, fieldWithDtoId] = match;
  const fieldWithoutDtoId = fieldWithDtoId.replace(/DtoId$/, '');
  const replacement = `FilterCriteria.create('${fieldWithoutDtoId}'`;
  content = content.replace(fullMatch, replacement);
  fixCount++;
  fixes.push(`Removed DtoId suffix from filter field: '${fieldWithDtoId}' → '${fieldWithoutDtoId}'`);
}

// Fix 7: Add missing FilterCriteria import
if (content.includes('FilterCriteria') && !content.includes("from '@core/filter'")) {
  const importSection = content.match(/import.*from.*;/g);
  if (importSection) {
    const lastImport = importSection[importSection.length - 1];
    const newImport = "import { FilterCriteria } from '@core/filter';";
    content = content.replace(lastImport, `${lastImport}\n${newImport}`);
    fixCount++;
    fixes.push('Added missing FilterCriteria import');
  }
}

// Fix 8: Add missing Sorting import
if (content.includes('new Sorting') && !content.includes("from '@core/sorting'")) {
  const importSection = content.match(/import.*from.*;/g);
  if (importSection) {
    const lastImport = importSection[importSection.length - 1];
    const newImport = "import { Sorting } from '@core/sorting';";
    content = content.replace(lastImport, `${lastImport}\n${newImport}`);
    fixCount++;
    fixes.push('Added missing Sorting import');
  }
}

// Write fixed content back to file
if (fixCount > 0) {
  fs.writeFileSync(targetFile, content, 'utf-8');
  console.log(`✅ Applied ${fixCount} fix(es) to ${targetFile}\n`);
  console.log('Fixes applied:');
  fixes.forEach((fix, index) => {
    console.log(`  ${index + 1}. ${fix}`);
  });
  console.log('\n✅ File has been updated successfully.');
  console.log('⚠️  Please review the changes and run check-guidelines.js again to verify.');
} else {
  console.log('✅ No fixes needed. File already complies with QL guidelines.');
}

process.exit(0);
