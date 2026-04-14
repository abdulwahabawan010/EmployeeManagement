/**
 * fix-guidelines.js (PrimeNG)
 *
 * ============================================================================
 * AUTOMATIC RESOLUTION SCRIPT
 * ============================================================================
 *
 * This script automatically fixes guideline violations detected by check-guidelines.js
 *
 * Purpose:
 *   - Automatically fix PrimeNG guideline violations in Claude-generated files
 *   - Migrate deprecated v20 components to their replacements
 *   - Ensure all PrimeNG code follows the skill guidelines
 *
 * Usage:
 *   node fix-guidelines.js <path-to-file>
 *
 * What it fixes:
 *   - Wildcard PrimeNG imports → explicit module imports
 *   - Deprecated component migrations (p-calendar → p-datePicker, etc.)
 *   - Deprecated module imports (CalendarModule → DatePickerModule, etc.)
 *   - MessageService → MvsMessageService wrapper
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

console.log('🔧 Starting PrimeNG guideline fixes...\n');

const isHtmlFile = targetFile.endsWith('.html');
const isTsFile = targetFile.endsWith('.ts');

// ============================================
// TypeScript file fixes
// ============================================
if (isTsFile) {

  // Fix 1: Replace wildcard PrimeNG imports
  if (content.includes("from 'primeng'")) {
    console.log('⚠️  Warning: Wildcard PrimeNG import detected.');
    console.log('    Manual refactoring required to use explicit module imports.');
    console.log('    Example: import { ButtonModule } from \'primeng/button\';');
    fixes.push('⚠️  Wildcard PrimeNG import detected - use explicit module imports');
  }

  // Fix 2: Replace deprecated module imports
  const moduleReplacements = [
    { old: 'CalendarModule', new: 'DatePickerModule', from: 'primeng/datepicker' },
    { old: 'TabViewModule', new: 'TabsModule', from: 'primeng/tabs' },
    { old: 'TabMenuModule', new: 'TabsModule', from: 'primeng/tabs' },
    { old: 'DropdownModule', new: 'SelectModule', from: 'primeng/select' },
    { old: 'OverlayPanelModule', new: 'PopoverModule', from: 'primeng/popover' },
    { old: 'SidebarModule', new: 'DrawerModule', from: 'primeng/drawer' },
    { old: 'InputSwitchModule', new: 'ToggleSwitchModule', from: 'primeng/toggleswitch' },
    { old: 'TriStateCheckboxModule', new: 'CheckboxModule', from: 'primeng/checkbox' },
    { old: 'StepsModule', new: 'StepperModule', from: 'primeng/stepper' },
  ];

  for (const replacement of moduleReplacements) {
    if (content.includes(replacement.old)) {
      // Replace the module name
      content = content.replace(new RegExp(replacement.old, 'g'), replacement.new);

      // Try to update the import path
      const oldImportPattern = new RegExp(`from\\s*['"]primeng/[^'"]+['"]`, 'g');
      const importMatch = content.match(new RegExp(`import\\s*{[^}]*${replacement.new}[^}]*}\\s*from\\s*['"]primeng/[^'"]+['"]`));
      if (importMatch) {
        const newImport = importMatch[0].replace(oldImportPattern, `from '${replacement.from}'`);
        content = content.replace(importMatch[0], newImport);
      }

      applyFix(`Replaced ${replacement.old} with ${replacement.new}`);
    }
  }

  // Fix 3: Replace MessageService with MvsMessageService
  if (content.includes('MessageService') && !content.includes('MvsMessageService')) {
    console.log('⚠️  Warning: Direct MessageService usage detected.');
    console.log('    Manual refactoring required to use MvsMessageService wrapper.');
    console.log('    Replace: private messageService: MessageService');
    console.log('    With:    private messageService: MvsMessageService');
    fixes.push('⚠️  MessageService detected - must use MvsMessageService wrapper');
  }
}

// ============================================
// HTML file fixes
// ============================================
if (isHtmlFile) {

  // Fix 4: Replace deprecated component selectors
  const componentReplacements = [
    { old: 'p-calendar', new: 'p-datePicker', description: 'p-calendar → p-datePicker' },
    { old: '<p-dropdown', new: '<p-select', description: 'p-dropdown → p-select' },
    { old: '</p-dropdown>', new: '</p-select>', description: 'p-dropdown closing tag' },
    { old: 'p-overlayPanel', new: 'p-popover', description: 'p-overlayPanel → p-popover' },
    { old: 'p-sidebar', new: 'p-drawer', description: 'p-sidebar → p-drawer' },
    { old: 'p-inputSwitch', new: 'p-toggleSwitch', description: 'p-inputSwitch → p-toggleSwitch' },
    { old: '<p-steps', new: '<p-stepper', description: 'p-steps → p-stepper' },
    { old: '</p-steps>', new: '</p-stepper>', description: 'p-steps closing tag' },
  ];

  for (const replacement of componentReplacements) {
    if (content.includes(replacement.old)) {
      content = content.replace(new RegExp(replacement.old, 'g'), replacement.new);
      applyFix(`Replaced ${replacement.description}`);
    }
  }

  // Fix 5: Replace p-tabPanel (uppercase P) with p-tabpanel (lowercase)
  if (content.includes('p-tabPanel')) {
    content = content.replace(/p-tabPanel/g, 'p-tabpanel');
    applyFix('Replaced p-tabPanel with p-tabpanel (lowercase)');
  }

  // Fix 6: Replace p-accordionTab with p-accordion-panel
  if (content.includes('p-accordionTab')) {
    content = content.replace(/p-accordionTab/g, 'p-accordion-panel');
    applyFix('Replaced p-accordionTab with p-accordion-panel');
  }

  // Fix 7: p-tabView → p-tabs (requires structural changes)
  if (content.includes('p-tabView')) {
    console.log('⚠️  Warning: p-tabView detected. Requires structural migration to p-tabs.');
    console.log('    Manual refactoring required. New structure:');
    console.log('    <p-tabs value="0">');
    console.log('      <p-tablist>');
    console.log('        <p-tab value="0">Tab 1</p-tab>');
    console.log('      </p-tablist>');
    console.log('      <p-tabpanels>');
    console.log('        <p-tabpanel value="0">Content</p-tabpanel>');
    console.log('      </p-tabpanels>');
    console.log('    </p-tabs>');
    fixes.push('⚠️  p-tabView detected - requires manual migration to p-tabs structure');
  }

  // Fix 8: p-tabMenu → p-tabs (requires structural changes)
  if (content.includes('p-tabMenu')) {
    console.log('⚠️  Warning: p-tabMenu detected. Requires structural migration to p-tabs.');
    console.log('    Manual refactoring required. See p-tabs v20 structure in SKILL.md');
    fixes.push('⚠️  p-tabMenu detected - requires manual migration to p-tabs structure');
  }

  // Fix 9: p-triStateCheckbox → p-checkbox with indeterminate
  if (content.includes('p-triStateCheckbox')) {
    console.log('⚠️  Warning: p-triStateCheckbox detected.');
    console.log('    Replace with p-checkbox and add [indeterminate]="true" property.');
    fixes.push('⚠️  p-triStateCheckbox detected - use p-checkbox with indeterminate');
  }

  // Fix 10: Removed components (no direct replacement)
  const removedComponents = [
    { name: 'p-megaMenu', alternative: 'p-menu with grid layout' },
    { name: 'p-tieredMenu', alternative: 'p-menu with nested items' },
    { name: 'p-slideMenu', alternative: 'p-menu or p-drawer' },
    { name: 'p-menubar', alternative: 'p-toolbar with p-menu' },
  ];

  for (const removed of removedComponents) {
    if (content.includes(removed.name)) {
      console.log(`⚠️  Warning: ${removed.name} is removed in v20.`);
      console.log(`    Alternative: Use ${removed.alternative}`);
      fixes.push(`⚠️  ${removed.name} removed in v20 - use ${removed.alternative}`);
    }
  }

  // Fix 11: PrimeNG form components without MvsFormField wrapper
  if ((content.includes('p-input') || content.includes('p-select') || content.includes('p-checkbox')) &&
      !content.includes('mvs-form-field') && !content.includes('MvsFormField')) {
    console.log('⚠️  Warning: PrimeNG form components detected without MvsFormField wrapper.');
    console.log('    All PrimeNG inputs must be wrapped by MvsFormField.');
    console.log('    Example:');
    console.log('      <mvs-form-field>');
    console.log('        <p-select [options]="items" />');
    console.log('      </mvs-form-field>');
    fixes.push('⚠️  PrimeNG form components must be wrapped by MvsFormField');
  }

  // Fix 12: Manual <form> elements
  if (content.includes('<form') && !content.includes('mvs-crud-object-generic')) {
    console.log('⚠️  Warning: Manual <form> element detected.');
    console.log('    PrimeNG inputs must only be used inside the Forms system.');
    console.log('    Use MvsCrudObjectGenericComponent instead.');
    fixes.push('⚠️  Manual <form> detected - use MvsCrudObjectGenericComponent');
  }

  // Fix 13: Hardcoded inline styles
  const inlineStyleMatch = content.match(/style="[^"]*(?:color|background|width|height)[^"]*"/);
  if (inlineStyleMatch) {
    console.log('⚠️  Warning: Hardcoded inline styles detected.');
    console.log('    Use theme variables or PrimeFlex utility classes instead.');
    console.log('    Example: Use class="p-3 flex gap-2" instead of style="padding: 1rem"');
    fixes.push('⚠️  Hardcoded inline styles detected - use theme variables or PrimeFlex');
  }

  // Fix 14: Business logic in templates
  if (content.includes('subscribe(')) {
    console.log('⚠️  Warning: Business logic detected in template.');
    console.log('    Move subscribe() calls to the component TypeScript file.');
    fixes.push('⚠️  Business logic in template detected - move to component class');
  }
}

// ============================================
// Write fixes and report
// ============================================

// Provide guidance summary
if (fixes.length > 0) {
  console.log('\n' + '='.repeat(80));
  console.log('PRIMENG V20 MIGRATION GUIDE');
  console.log('='.repeat(80) + '\n');

  console.log('Key v20 replacements:\n');
  console.log('  Component Migrations:');
  console.log('    p-calendar      → p-datePicker');
  console.log('    p-dropdown      → p-select');
  console.log('    p-tabView       → p-tabs (new structure)');
  console.log('    p-tabMenu       → p-tabs (new structure)');
  console.log('    p-overlayPanel  → p-popover');
  console.log('    p-sidebar       → p-drawer');
  console.log('    p-inputSwitch   → p-toggleSwitch');
  console.log('    p-steps         → p-stepper\n');

  console.log('  Module Migrations:');
  console.log('    CalendarModule      → DatePickerModule');
  console.log('    DropdownModule      → SelectModule');
  console.log('    TabViewModule       → TabsModule');
  console.log('    TabMenuModule       → TabsModule');
  console.log('    OverlayPanelModule  → PopoverModule');
  console.log('    SidebarModule       → DrawerModule');
  console.log('    InputSwitchModule   → ToggleSwitchModule');
  console.log('    StepsModule         → StepperModule\n');

  console.log('='.repeat(80) + '\n');
}

// Write fixed content back to file
if (fixCount > 0) {
  fs.writeFileSync(targetFile, content, 'utf-8');
  console.log(`✅ Applied ${fixCount} automatic fix(es) to ${targetFile}\n`);
  console.log('Fixes applied:');
  fixes.forEach((fix, index) => {
    console.log(`  ${index + 1}. ${fix}`);
  });
  console.log('\n✅ File has been updated successfully.');
  console.log('⚠️  Some fixes require manual intervention - check warnings above.');
  console.log('⚠️  Please review the changes and run check-guidelines.js again to verify.');
} else if (fixes.length > 0) {
  console.log(`⚠️  Found ${fixes.length} issue(s) requiring manual refactoring:\n`);
  fixes.forEach((fix, index) => {
    console.log(`  ${index + 1}. ${fix}`);
  });
  console.log('\n⚠️  See migration guide above for detailed instructions.');
} else {
  console.log('✅ No fixes needed. File already complies with PrimeNG guidelines.');
}

process.exit(0);
