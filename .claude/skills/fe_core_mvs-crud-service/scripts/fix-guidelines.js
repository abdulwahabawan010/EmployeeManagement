#!/usr/bin/env node

/**
 * MvsCrudService Guideline Auto-Fixer
 *
 * Applies ONLY safe, deterministic, mechanical fixes.
 * Never guesses intent. Never modifies logic or semantics.
 *
 * Usage: node fix-guidelines.js <path-to-file>
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const targetFile = args[0];

if (!targetFile) {
  console.error('Usage: node fix-guidelines.js <path-to-file>');
  process.exit(1);
}

if (!fs.existsSync(targetFile)) {
  console.error(`File not found: ${targetFile}`);
  process.exit(1);
}

let content = fs.readFileSync(targetFile, 'utf-8');
let fixCount = 0;

// Fix: Add MvsCrudService import if missing
if (/extends\s+MvsCrudService/.test(content)) {
  if (!content.includes("from '@features/core/shared/service/crud/mvs-crud.service'") &&
      !content.includes("from 'features/core/shared/service/crud/mvs-crud.service'")) {
    const importSection = content.match(/import.*from.*;/g);
    if (importSection && !importSection.some(imp => imp.includes('MvsCrudService'))) {
      const lastImport = importSection[importSection.length - 1];
      const newImport = "import { MvsCrudService } from '@features/core/shared/service/crud/mvs-crud.service';";
      content = content.replace(lastImport, `${lastImport}\n${newImport}`);
      fixCount++;
    }
  }
}

// Fix: Add FilterCriteria import if used but missing
if (/FilterCriteria\.create/.test(content)) {
  if (!content.includes("from '@features/core/shared/filter/api/filter.criteria'") &&
      !content.includes("from 'features/core/shared/filter/api/filter.criteria'")) {
    const importSection = content.match(/import.*from.*;/g);
    if (importSection && !importSection.some(imp => imp.includes('FilterCriteria'))) {
      const lastImport = importSection[importSection.length - 1];
      const newImport = "import { FilterCriteria } from '@features/core/shared/filter/api/filter.criteria';";
      content = content.replace(lastImport, `${lastImport}\n${newImport}`);
      fixCount++;
    }
  }
}

// Fix: Add Sorting import if used but missing
if (/new\s+Sorting\s*\(/.test(content)) {
  if (!content.includes("from 'features/core/shared/misc/sorting'") &&
      !content.includes("from '@features/core/shared/misc/sorting'")) {
    const importSection = content.match(/import.*from.*;/g);
    if (importSection && !importSection.some(imp => imp.includes('Sorting'))) {
      const lastImport = importSection[importSection.length - 1];
      const newImport = "import { Sorting } from 'features/core/shared/misc/sorting';";
      content = content.replace(lastImport, `${lastImport}\n${newImport}`);
      fixCount++;
    }
  }
}

// Fix: Add PagingDto import if used but missing
if (/PagingDto\.create/.test(content)) {
  if (!content.includes("from '@features/core/shared/dto/model/paging.dto'") &&
      !content.includes("from 'features/core/shared/dto/model/paging.dto'")) {
    const importSection = content.match(/import.*from.*;/g);
    if (importSection && !importSection.some(imp => imp.includes('PagingDto'))) {
      const lastImport = importSection[importSection.length - 1];
      const newImport = "import { PagingDto } from '@features/core/shared/dto/model/paging.dto';";
      content = content.replace(lastImport, `${lastImport}\n${newImport}`);
      fixCount++;
    }
  }
}

// Fix: Add ObjectRequestList import if used but missing
if (/ObjectRequestList\.createBasic/.test(content)) {
  if (!content.includes("from '@features/core/shared/dto/object/request/object-request-list'") &&
      !content.includes("from 'features/core/shared/dto/object/request/object-request-list'")) {
    const importSection = content.match(/import.*from.*;/g);
    if (importSection && !importSection.some(imp => imp.includes('ObjectRequestList'))) {
      const lastImport = importSection[importSection.length - 1];
      const newImport = "import { ObjectRequestList } from '@features/core/shared/dto/object/request/object-request-list';";
      content = content.replace(lastImport, `${lastImport}\n${newImport}`);
      fixCount++;
    }
  }
}

// Fix: Add DtoList import if used but missing
if (/DtoList</.test(content)) {
  if (!content.includes("from '@features/core/shared/dto/dto.list'") &&
      !content.includes("from 'features/core/shared/dto/dto.list'")) {
    const importSection = content.match(/import.*from.*;/g);
    if (importSection && !importSection.some(imp => imp.includes('DtoList'))) {
      const lastImport = importSection[importSection.length - 1];
      const newImport = "import { DtoList } from '@features/core/shared/dto/dto.list';";
      content = content.replace(lastImport, `${lastImport}\n${newImport}`);
      fixCount++;
    }
  }
}

// Write fixed content back to file
if (fixCount > 0) {
  fs.writeFileSync(targetFile, content, 'utf-8');
}

process.exit(0);
