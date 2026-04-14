#!/usr/bin/env node

/**
 * DTO Guideline Auto-Fixer
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

function isEntityDto(filePath, content) {
  return filePath.includes('/entity/') ||
         filePath.includes('/dto/entity/') ||
         /extends\s+DtoDetail/.test(content);
}

// Fix EN4: Remove explicit string assignments from enums
// Pattern: VALUE = 'VALUE' -> VALUE
const enumStringAssignments = /(\b[A-Z_][A-Z_0-9]*)\s*=\s*['"][^'"]+['"]/g;
let match;
while ((match = enumStringAssignments.exec(content)) !== null) {
  const [fullMatch, valueName] = match;
  content = content.replace(fullMatch, valueName);
  fixCount++;
}

// Fix EN4: Remove explicit numeric assignments from enums
// Pattern: VALUE = 0 -> VALUE
const enumNumericAssignments = /(\b[A-Z_][A-Z_0-9]*)\s*=\s*\d+/g;
while ((match = enumNumericAssignments.exec(content)) !== null) {
  const [fullMatch, valueName] = match;
  content = content.replace(fullMatch, valueName);
  fixCount++;
}

// Fix E1: Add DtoDetail import if missing for entity DTOs
if (isEntityDto(targetFile, content)) {
  if (/extends\s+DtoDetail/.test(content) || /export\s+class\s+\w+Dto/.test(content)) {
    if (!content.includes("from 'features/core/shared/dto/dto.detail'") &&
        !content.includes('from "features/core/shared/dto/dto.detail"') &&
        !content.includes("from '@core/dto/dto.detail'")) {
      const importSection = content.match(/import.*from.*;/g);
      if (importSection) {
        const lastImport = importSection[importSection.length - 1];
        const newImport = "import { DtoDetail } from 'features/core/shared/dto/dto.detail';";
        content = content.replace(lastImport, `${lastImport}\n${newImport}`);
        fixCount++;
      }
    }
  }
}

// Fix A2: Remove extends DtoDetail from API DTOs
if (targetFile.includes('/api/') || targetFile.includes('/dto/api/')) {
  if (/export\s+interface\s+\w+Dto\s+extends\s+DtoDetail/.test(content)) {
    content = content.replace(/(\s+extends\s+DtoDetail)/, '');
    fixCount++;
  }
}

// Write fixed content back to file
if (fixCount > 0) {
  fs.writeFileSync(targetFile, content, 'utf-8');
}

process.exit(0);
