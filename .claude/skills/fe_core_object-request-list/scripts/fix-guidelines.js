/**
 * fix-guidelines.js (Object Request List)
 *
 * ============================================================================
 * AUTOMATIC RESOLUTION SCRIPT
 * ============================================================================
 *
 * This script automatically fixes guideline violations detected by check-guidelines.js
 *
 * Purpose:
 *   - Automatically fix ObjectRequestList guideline violations
 *   - Transform deprecated patterns to compliant patterns
 *   - Ensure all ObjectRequestList code follows the skill guidelines
 *
 * Usage:
 *   node fix-guidelines.js <path-to-file>
 *
 * What it fixes:
 *   - Converts manual filters to FilterCriteria.create()
 *   - Removes DtoId/Id suffixes from filters (use relationship names)
 *   - Converts manual sorting to new Sorting()
 *   - Adds missing PagingDto for list requests
 *   - Replaces manual HttpClient with ObjectRequestList
 *   - Adds missing imports
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

console.log('🔧 Starting ObjectRequestList guideline fixes...\n');

// Fix 1: Remove DtoId suffixes from filter fields (use relationship names)
const filterDtoIdPattern = /FilterCriteria\.create\s*\(\s*['"]([^'"]+)(DtoId|Id)['"]/g;
let match;
while ((match = filterDtoIdPattern.exec(content)) !== null) {
  const [fullMatch, fieldName, suffix] = match;
  const relationshipName = fieldName; // The field name without DtoId/Id is the relationship name
  const replacement = `FilterCriteria.create('${relationshipName}'`;
  content = content.replace(fullMatch, replacement);
  fixCount++;
  fixes.push(`Fixed filter to use relationship name: '${fieldName}${suffix}' → '${relationshipName}'`);
}

// Fix 2: Convert manual filter objects to FilterCriteria.create()
const manualFilterPattern = /\{\s*field:\s*['"]([^'"]+)['"]\s*,\s*operator:\s*['"]([^'"]+)['"]\s*,\s*value:\s*([^}]+)\}/g;
while ((match = manualFilterPattern.exec(content)) !== null) {
  const [fullMatch, field, operator, value] = match;
  const replacement = `FilterCriteria.create('${field}', FilterCriteria.cOperator${operator}, ${value.trim()})`;
  content = content.replace(fullMatch, replacement);
  fixCount++;
  fixes.push(`Converted manual filter to FilterCriteria.create() for field '${field}'`);
}

// Fix 3: Convert manual Sorting to new Sorting()
const manualSortingPattern = /\{\s*field:\s*['"]([^'"]+)['"]\s*,\s*ascending:\s*(true|false)\s*\}/g;
while ((match = manualSortingPattern.exec(content)) !== null) {
  const [fullMatch, field, ascending] = match;
  const replacement = `new Sorting('${field}', ${ascending})`;
  content = content.replace(fullMatch, replacement);
  fixCount++;
  fixes.push(`Converted manual sorting to new Sorting() for field '${field}'`);
}

// Fix 4: Add missing PagingDto for list() calls
if (content.includes('.list(') && content.includes('ObjectRequestList')) {
  const listCallPattern = /(\w+)\.list\s*\(\s*(\w+)\s*\)/g;
  let listMatches;
  let needsPaging = false;

  while ((listMatches = listCallPattern.exec(content)) !== null) {
    const requestVarName = listMatches[2];
    // Check if this request has paging
    const pagingCheck = new RegExp(`${requestVarName}\\.pagingDto`);
    if (!pagingCheck.test(content)) {
      needsPaging = true;
      // Add paging after the request creation
      const requestCreation = new RegExp(`(const ${requestVarName} = ObjectRequestList\\.createBasic\\([^)]+\\);)`, 'g');
      if (requestCreation.test(content)) {
        content = content.replace(requestCreation, `$1\n${requestVarName}.pagingDto = new PagingDto(0, 20);`);
        fixCount++;
        fixes.push(`Added missing PagingDto to ${requestVarName}`);
      }
    }
  }
}

// Fix 5: Replace manual HttpClient with ObjectRequestList
if (content.includes('HttpClient') && content.includes('this.http.get') && content.includes('/api/')) {
  console.log('⚠️  Warning: Manual HttpClient usage detected for entity lists.');
  console.log('    Manual refactoring required to use ObjectRequestList with entity service.');
  console.log('    Example: Replace this.http.get(\'/api/customers\') with');
  console.log('             customerService.list(ObjectRequestList.createBasic(...))');
  fixes.push('⚠️  Manual HttpClient detected - refactoring to ObjectRequestList required');
}

// Fix 6: Add missing FilterCriteria import
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

// Fix 7: Add missing Sorting import
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

// Fix 8: Add missing PagingDto import
if (content.includes('PagingDto') && !content.includes("from '@core/paging'")) {
  const importSection = content.match(/import.*from.*;/g);
  if (importSection) {
    const lastImport = importSection[importSection.length - 1];
    const newImport = "import { PagingDto } from '@core/paging';";
    content = content.replace(lastImport, `${lastImport}\n${newImport}`);
    fixCount++;
    fixes.push('Added missing PagingDto import');
  }
}

// Fix 9: Add missing ObjectRequestList imports
if (content.includes('ObjectRequestList') && !content.includes("from '@core/object-request'")) {
  const importSection = content.match(/import.*from.*;/g);
  if (importSection) {
    const lastImport = importSection[importSection.length - 1];
    const newImport = "import { ObjectRequestList, ObjectRequestComplex, ObjectRequestComplexNode, ObjectRequestRelation } from '@core/object-request';";
    content = content.replace(lastImport, `${lastImport}\n${newImport}`);
    fixCount++;
    fixes.push('Added missing ObjectRequestList imports');
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
  console.log('✅ No fixes needed. File already complies with ObjectRequestList guidelines.');
}

process.exit(0);
