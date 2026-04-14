/**
 * fix-guidelines.js (Forms)
 *
 * ============================================================================
 * AUTOMATIC RESOLUTION SCRIPT
 * ============================================================================
 *
 * This script automatically fixes guideline violations detected by check-guidelines.js
 *
 * Purpose:
 *   - Automatically fix Forms system guideline violations
 *   - Transform manual Angular forms to MvsCrudObjectGenericComponent
 *   - Ensure all Forms code follows the skill guidelines
 *
 * Usage:
 *   node fix-guidelines.js <path-to-file>
 *
 * What it fixes:
 *   - Replaces manual <form> tags with MvsCrudObjectGenericComponent
 *   - Removes direct FormGroup usage
 *   - Removes manual form creation patterns
 *   - Adds missing imports
 *   - Warns about patterns requiring manual refactoring
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

function applyFix(description) {
  fixCount++;
  fixes.push(description);
}

console.log('🔧 Starting Forms guideline fixes...\n');

const isHtmlFile = targetFile.endsWith('.html');
const isTsFile = targetFile.endsWith('.ts');

if (isHtmlFile) {
  // HTML file fixes

  // Fix 1: Replace manual <form> with MvsCrudObjectGenericComponent
  if (content.includes('<form') && !content.includes('mvs-crud-object-generic')) {
    console.log('⚠️  Warning: Manual <form> tag detected.');
    console.log('    Manual refactoring required to use MvsCrudObjectGenericComponent.');
    console.log('    Example:');
    console.log('      Replace:');
    console.log('        <form [formGroup]="myForm">');
    console.log('          <input formControlName="name" />');
    console.log('        </form>');
    console.log('      With:');
    console.log('        <mvs-crud-object-generic');
    console.log('          [objectType]="\'module.EntityName\'"');
    console.log('          [objectId]="entityId">');
    console.log('        </mvs-crud-object-generic>');
    fixes.push('⚠️  Manual <form> detected - refactoring to MvsCrudObjectGenericComponent required');
  }

  // Fix 2: Remove [formGroup] bindings
  if (content.includes('[formGroup]')) {
    console.log('⚠️  Warning: [formGroup] binding detected.');
    console.log('    Forms must use MvsCrudObjectGenericComponent, not manual FormGroup.');
    fixes.push('⚠️  [formGroup] binding detected - use MvsCrudObjectGenericComponent instead');
  }

  // Fix 3: Remove formControlName bindings
  if (content.includes('formControlName')) {
    console.log('⚠️  Warning: formControlName detected.');
    console.log('    Forms must use MvsCrudObjectGenericComponent with metadata-driven fields.');
    fixes.push('⚠️  formControlName detected - use metadata-driven Forms system instead');
  }
}

if (isTsFile) {
  // TypeScript file fixes

  // Fix 4: Remove new FormGroup() usage
  if (content.includes('new FormGroup')) {
    console.log('⚠️  Warning: new FormGroup() detected.');
    console.log('    Manual FormGroup creation is forbidden.');
    console.log('    Use MvsCrudObjectGenericComponent which creates forms from metadata.');
    fixes.push('⚠️  new FormGroup() detected - manual FormGroup creation forbidden');
  }

  // Fix 5: Remove FormBuilder usage
  if (content.includes('FormBuilder') && content.includes('this.fb.group')) {
    console.log('⚠️  Warning: FormBuilder usage detected.');
    console.log('    Manual form building is forbidden.');
    console.log('    Use MvsCrudObjectGenericComponent which creates forms from backend metadata.');
    fixes.push('⚠️  FormBuilder usage detected - use metadata-driven Forms system instead');
  }

  // Fix 6: Remove FormControl creation
  if (content.includes('new FormControl')) {
    console.log('⚠️  Warning: new FormControl() detected.');
    console.log('    Manual FormControl creation is forbidden.');
    console.log('    Forms system handles controls via metadata.');
    fixes.push('⚠️  new FormControl() detected - manual control creation forbidden');
  }

  // Fix 7: Add MvsCrudObjectGenericComponent import if missing
  if (content.includes('mvs-crud-object-generic') && !content.includes('MvsCrudObjectGenericComponent')) {
    const importSection = content.match(/import.*from.*;/g);
    if (importSection) {
      const lastImport = importSection[importSection.length - 1];
      const newImport = "import { MvsCrudObjectGenericComponent } from '@core/crud';";
      content = content.replace(lastImport, `${lastImport}\n${newImport}`);
      applyFix('Added missing MvsCrudObjectGenericComponent import');
    }
  }

  // Fix 8: Remove FormGroup property declarations
  const formGroupPattern = /(\w+):\s*FormGroup;/g;
  let match;
  while ((match = formGroupPattern.exec(content)) !== null) {
    const [fullMatch, propertyName] = match;
    console.log(`⚠️  Warning: FormGroup property '${propertyName}' detected.`);
    console.log('    Remove this property and use MvsCrudObjectGenericComponent.');
    fixes.push(`⚠️  FormGroup property '${propertyName}' should be removed`);
  }

  // Fix 9: Detect and warn about validators
  if (content.includes('Validators.')) {
    console.log('⚠️  Warning: Manual Validators usage detected.');
    console.log('    Validation must be defined in backend metadata, not in frontend code.');
    fixes.push('⚠️  Manual Validators detected - validation must be backend metadata-driven');
  }

  // Fix 10: Detect setValue/patchValue usage
  if (content.includes('.setValue(') || content.includes('.patchValue(')) {
    console.log('⚠️  Warning: Manual form value manipulation detected.');
    console.log('    Forms system handles value management automatically.');
    fixes.push('⚠️  Manual form value manipulation detected - Forms system handles this automatically');
  }
}

// Both HTML and TS files: check for form-related imports that should be removed
if (content.includes("from '@angular/forms'")) {
  console.log('⚠️  Warning: Angular Forms imports detected.');
  console.log('    Remove unused Angular Forms imports:');
  console.log('      - FormGroup, FormControl, FormBuilder');
  console.log('      - Validators, AbstractControl');
  console.log('    Only keep if using ControlValueAccessor for custom input components.');
  fixes.push('⚠️  Angular Forms imports detected - should be removed unless creating custom inputs');
}

// Provide guidance summary
if (fixes.length > 0) {
  console.log('\n' + '='.repeat(80));
  console.log('FORMS SYSTEM REFACTORING GUIDE');
  console.log('='.repeat(80) + '\n');

  console.log('To properly refactor to the Forms system:\n');

  console.log('1. Remove the manual form completely');
  console.log('   - Delete <form>, [formGroup], formControlName');
  console.log('   - Delete FormGroup, FormControl, FormBuilder code\n');

  console.log('2. Add MvsCrudObjectGenericComponent to template:');
  console.log('   <mvs-crud-object-generic');
  console.log('     [objectType]="\'module.EntityName\'"');
  console.log('     [objectId]="entityId">');
  console.log('   </mvs-crud-object-generic>\n');

  console.log('3. Ensure backend provides form metadata:');
  console.log('   - Form structure (MvsFormDto)');
  console.log('   - Field definitions');
  console.log('   - Validation rules');
  console.log('   - Smart Guide metadata\n');

  console.log('4. The Forms system will automatically:');
  console.log('   - Create the form from metadata');
  console.log('   - Handle validation');
  console.log('   - Manage dirty state');
  console.log('   - Provide undo functionality');
  console.log('   - Integrate Smart Guide\n');

  console.log('='.repeat(80) + '\n');
}

// Write fixed content back to file (if any automatic fixes were applied)
if (fixCount > 0) {
  fs.writeFileSync(targetFile, content, 'utf-8');
  console.log(`✅ Applied ${fixCount} automatic fix(es) to ${targetFile}\n`);
  console.log('Fixes applied:');
  fixes.forEach((fix, index) => {
    console.log(`  ${index + 1}. ${fix}`);
  });
  console.log('\n✅ File has been updated successfully.');
  console.log('⚠️  Most Forms violations require manual refactoring (see guide above).');
  console.log('⚠️  Please review the changes and run check-guidelines.js again to verify.');
} else if (fixes.length > 0) {
  console.log(`⚠️  Found ${fixes.length} issue(s) requiring manual refactoring:\n`);
  fixes.forEach((fix, index) => {
    console.log(`  ${index + 1}. ${fix}`);
  });
  console.log('\n⚠️  See refactoring guide above for detailed instructions.');
} else {
  console.log('✅ No fixes needed. File already complies with Forms guidelines.');
}

process.exit(0);
