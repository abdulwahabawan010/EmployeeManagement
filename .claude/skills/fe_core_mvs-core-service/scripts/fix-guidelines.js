#!/usr/bin/env node

/**
 * MvsCoreService Guideline Auto-Fixer
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

// Fix ETA1: Fix entity alias casing pattern (module.EntityName)
// Pattern: 'Module.Entity' -> 'module.Entity' (lowercase module)
const aliasPattern = /(['"])([A-Z][a-z]+)\.([A-Z][a-zA-Z]*)(['"])/g;
let match;
while ((match = aliasPattern.exec(content)) !== null) {
  const [fullMatch, q1, modulePart, entityPart, q2] = match;
  const fixedModule = modulePart.toLowerCase();
  const replacement = `${q1}${fixedModule}.${entityPart}${q2}`;
  if (fullMatch !== replacement) {
    content = content.replace(fullMatch, replacement);
    fixCount++;
  }
}

// Fix: Add MvsCoreService import if missing
if (/MvsCoreService/.test(content) || /getCrudService/.test(content)) {
  if (!content.includes("from '@features/core/shared/service/mvs-core.service'") &&
      !content.includes("from 'features/core/shared/service/mvs-core.service'")) {
    const importSection = content.match(/import.*from.*;/g);
    if (importSection) {
      const lastImport = importSection[importSection.length - 1];
      const newImport = "import { MvsCoreService } from '@features/core/shared/service/mvs-core.service';";
      if (!content.includes('MvsCoreService') || !content.includes("from")) {
        // Only add if truly missing
        if (!importSection.some(imp => imp.includes('MvsCoreService'))) {
          content = content.replace(lastImport, `${lastImport}\n${newImport}`);
          fixCount++;
        }
      }
    }
  }
}

// Fix: Add MvsCrudModeEnum import if getObjectComponent is used
if (/getObjectComponent\s*\(/.test(content) && /MvsCrudModeEnum/.test(content)) {
  if (!content.includes("from '@features/core/shared/service/crud/mvs-crud-mode.enum'") &&
      !content.includes("from 'features/core/shared/service/crud/mvs-crud-mode.enum'")) {
    const importSection = content.match(/import.*from.*;/g);
    if (importSection && !importSection.some(imp => imp.includes('MvsCrudModeEnum'))) {
      const lastImport = importSection[importSection.length - 1];
      const newImport = "import { MvsCrudModeEnum } from '@features/core/shared/service/crud/mvs-crud-mode.enum';";
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
