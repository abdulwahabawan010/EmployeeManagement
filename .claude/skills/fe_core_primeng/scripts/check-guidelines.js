/**
 * check-guidelines.js (PrimeNG)
 *
 * ============================================================================
 * IMPORTANT: ONLY FOR CLAUDE-GENERATED FILES
 * ============================================================================
 *
 * Enforces correct usage of PrimeNG according to the PrimeNG skill definition.
 * This script is intended to be executed on a virtual machine or CI environment.
 *
 * ============================================================================
 * AUTO-FIX WORKFLOW
 * ============================================================================
 *
 * This script will automatically:
 * 1. Scan for guideline violations
 * 2. Run fix-guidelines.js on files with errors
 * 3. Re-validate after fixing
 *
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC_DIR = path.resolve(process.cwd(), 'src');
const FIX_SCRIPT = path.resolve(__dirname, 'fix-guidelines.js');

const filesWithErrors = new Set();

function error(msg, file) {
    console.error(`❌ PRIMENG ERROR: ${msg}`);
    if (file) filesWithErrors.add(file);
}

function check(condition, msg, file) {
    if (!condition) error(msg, file);
}

function scan(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true })
        .flatMap(e =>
            e.isDirectory() ? scan(path.join(dir, e.name)) :
                (e.name.endsWith('.ts') || e.name.endsWith('.html')) ? [path.join(dir, e.name)] : []
        );
}

function runValidation() {
    filesWithErrors.clear();

    scan(SRC_DIR).forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');

        // Wildcard imports are forbidden
        check(
            !content.includes("from 'primeng'"),
            `${file}: Wildcard PrimeNG imports are forbidden. Use explicit module imports. See primeNG-skill.md`,
            file
        );

        // ============================================
        // Deprecated PrimeNG v20 components
        // ============================================

        // Calendar → DatePicker
        check(
            !content.includes('p-calendar'),
            `${file}: p-calendar is deprecated. Use p-datePicker. See primeNG-skill.md`,
            file
        );
        check(
            !content.includes('CalendarModule'),
            `${file}: CalendarModule is deprecated. Use DatePickerModule. See primeNG-skill.md`,
            file
        );

        // TabView → Tabs
        check(
            !content.includes('p-tabView'),
            `${file}: p-tabView is deprecated. Use p-tabs. See primeNG-skill.md`,
            file
        );
        check(
            !content.includes('TabViewModule'),
            `${file}: TabViewModule is deprecated. Use TabsModule. See primeNG-skill.md`,
            file
        );

        // TabMenu → Tabs (CRITICAL - was missing!)
        check(
            !content.includes('p-tabMenu'),
            `${file}: p-tabMenu is deprecated in v20. Use p-tabs with p-tablist. See primeNG-skill.md`,
            file
        );
        check(
            !content.includes('TabMenuModule'),
            `${file}: TabMenuModule is deprecated. Use TabsModule. See primeNG-skill.md`,
            file
        );

        // Dropdown → Select
        check(
            !content.includes('<p-dropdown'),
            `${file}: p-dropdown is deprecated in v20. Use p-select. See primeNG-skill.md`,
            file
        );
        check(
            !content.includes('DropdownModule'),
            `${file}: DropdownModule is deprecated. Use SelectModule. See primeNG-skill.md`,
            file
        );

        // OverlayPanel → Popover
        check(
            !content.includes('p-overlayPanel'),
            `${file}: p-overlayPanel is deprecated in v20. Use p-popover. See primeNG-skill.md`,
            file
        );
        check(
            !content.includes('OverlayPanelModule'),
            `${file}: OverlayPanelModule is deprecated. Use PopoverModule. See primeNG-skill.md`,
            file
        );

        // Sidebar → Drawer
        check(
            !content.includes('p-sidebar'),
            `${file}: p-sidebar is deprecated in v20. Use p-drawer. See primeNG-skill.md`,
            file
        );
        check(
            !content.includes('SidebarModule'),
            `${file}: SidebarModule is deprecated. Use DrawerModule. See primeNG-skill.md`,
            file
        );

        // InputSwitch → ToggleSwitch
        check(
            !content.includes('p-inputSwitch'),
            `${file}: p-inputSwitch is deprecated in v20. Use p-toggleSwitch. See primeNG-skill.md`,
            file
        );
        check(
            !content.includes('InputSwitchModule'),
            `${file}: InputSwitchModule is deprecated. Use ToggleSwitchModule. See primeNG-skill.md`,
            file
        );

        // TriStateCheckbox → Checkbox with indeterminate
        check(
            !content.includes('p-triStateCheckbox'),
            `${file}: p-triStateCheckbox is deprecated. Use p-checkbox with indeterminate. See primeNG-skill.md`,
            file
        );
        check(
            !content.includes('TriStateCheckboxModule'),
            `${file}: TriStateCheckboxModule is deprecated. Use CheckboxModule. See primeNG-skill.md`,
            file
        );

        // Steps → Stepper
        check(
            !content.includes('<p-steps'),
            `${file}: p-steps is deprecated in v20. Use p-stepper. See primeNG-skill.md`,
            file
        );
        check(
            !content.includes('StepsModule'),
            `${file}: StepsModule is deprecated. Use StepperModule. See primeNG-skill.md`,
            file
        );

        // Old TabPanel syntax (uppercase P)
        check(
            !content.includes('<p-tabPanel'),
            `${file}: p-tabPanel (uppercase P) is deprecated. Use p-tabpanel (lowercase). See primeNG-skill.md`,
            file
        );

        // Old AccordionTab syntax
        check(
            !content.includes('p-accordionTab'),
            `${file}: p-accordionTab is deprecated. Use p-accordion-panel. See primeNG-skill.md`,
            file
        );

        // ============================================
        // Removed components in v20 (no direct replacement)
        // ============================================
        check(
            !content.includes('p-megaMenu'),
            `${file}: p-megaMenu is removed in v20. Use p-menu with grid layout. See primeNG-skill.md`,
            file
        );
        check(
            !content.includes('p-tieredMenu'),
            `${file}: p-tieredMenu is removed in v20. Use p-menu with nested items. See primeNG-skill.md`,
            file
        );
        check(
            !content.includes('p-slideMenu'),
            `${file}: p-slideMenu is removed in v20. Use p-menu or p-drawer. See primeNG-skill.md`,
            file
        );
        check(
            !content.includes('p-menubar'),
            `${file}: p-menubar is removed in v20. Use p-toolbar with p-menu. See primeNG-skill.md`,
            file
        );

        // Forms integration rules
        if (content.includes('p-input') || content.includes('p-select') || content.includes('p-checkbox')) {
            check(
                content.includes('mvs-form-field') || content.includes('MvsFormField'),
                `${file}: PrimeNG form components must be wrapped by MvsFormField. See primeNG-skill.md`,
                file
            );
        }

        // Manual form creation forbidden
        check(
            !content.includes('<form') || content.includes('mvs-crud-object-generic'),
            `${file}: Manual <form> detected. PrimeNG inputs must only be used inside the Forms system. See primeNG-skill.md`,
            file
        );

        // Hardcoded inline styles forbidden
        check(
            !content.match(/style=\".*(color|background|width|height)/),
            `${file}: Hardcoded inline styles detected. Use theme variables or PrimeFlex. See primeNG-skill.md`,
            file
        );

        // MessageService usage must be wrapped
        if (content.includes('MessageService')) {
            check(
                content.includes('MvsMessageService'),
                `${file}: MessageService must be wrapped by MvsMessageService. See primeNG-skill.md`,
                file
            );
        }

        // Business logic in templates forbidden
        if (file.endsWith('.html')) {
            check(
                !content.includes('subscribe('),
                `${file}: Business logic detected in template. UI components must not contain business logic. See primeNG-skill.md`,
                file
            );
        }
    });

    return filesWithErrors.size;
}

// Initial validation
console.log('🔍 Running PrimeNG guideline validation...\n');
let errorCount = runValidation();

if (errorCount > 0) {
    console.log(`\n🔧 Found ${errorCount} file(s) with errors. Running auto-fix...\n`);

    // Run fix-guidelines.js for each file with errors
    for (const file of filesWithErrors) {
        console.log(`\n📄 Fixing: ${file}`);
        try {
            execSync(`node "${FIX_SCRIPT}" "${file}"`, { stdio: 'inherit' });
        } catch (e) {
            console.error(`Failed to fix ${file}: ${e.message}`);
        }
    }

    // Re-validate after fixing
    console.log('\n🔍 Re-validating after fixes...\n');
    errorCount = runValidation();

    if (errorCount > 0) {
        console.log(`\n⚠️  ${errorCount} file(s) still have errors after auto-fix.`);
        console.log('Manual intervention may be required for the remaining issues.');
    }
}

if (errorCount === 0) {
    console.log('\n✅ PrimeNG guideline check completed - all files pass!');
} else {
    console.log('\n⚠️  PrimeNG guideline check completed with warnings.');
    process.exit(1);
}
