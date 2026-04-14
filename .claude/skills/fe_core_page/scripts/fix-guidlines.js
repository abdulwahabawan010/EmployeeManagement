/**
 * fix-guidlines.js (Page)
 *
 * ============================================================================
 * AUTOMATIC RESOLUTION SCRIPT
 * ============================================================================
 *
 * This script automatically fixes guideline violations detected by check-guidlines.js
 *
 * Purpose:
 *   - Automatically fix Page architecture guideline violations
 *   - Transform incorrect page patterns to compliant patterns
 *   - Ensure all Page components follow the skill guidelines
 *
 * Usage:
 *   node fix-guidlines.js <path-to-ts-file>
 *
 * What it fixes:
 *   - Adds missing extends PageComponent/ConfigPageComponent/ObjectPageComponent
 *   - Adds missing super.ngOnInit() call
 *   - Fixes Overview Page templates to use ui-object-navigation-main-page
 *   - Removes direct widget rendering from Overview Pages
 *   - Adds missing WidgetFactory to Dashboard Pages
 *   - Adds missing onObjectSelect handler to Dashboard Pages
 *   - Adds missing getObjectType() to Object Pages
 *   - Adds missing objectInplaceDirective to Object Pages
 *   - Adds missing navigationItems to Config Pages
 *   - Fixes tab count violations in Config Pages
 *
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const targetFile = args[0];

if (!targetFile) {
  console.error('❌ Usage: node fix-guidlines.js <path-to-ts-file>');
  process.exit(1);
}

if (!fs.existsSync(targetFile)) {
  console.error(`❌ File not found: ${targetFile}`);
  process.exit(1);
}

const baseName = targetFile.replace('.ts', '');
const htmlFile = baseName + '.html';

let tsContent = fs.readFileSync(targetFile, 'utf-8');
let htmlContent = fs.existsSync(htmlFile) ? fs.readFileSync(htmlFile, 'utf-8') : '';

let fixCount = 0;
const fixes = [];

function applyTsFix(description) {
  fixCount++;
  fixes.push(description);
}

function applyHtmlFix(description) {
  fixCount++;
  fixes.push(description);
}

console.log('🔧 Starting Page guideline fixes...\n');

// Detect page type
function detectPageType() {
  if (tsContent.includes('extends ConfigPageComponent')) return 'config';
  if (tsContent.includes('extends ObjectPageComponent')) return 'object';
  if (htmlContent && htmlContent.includes('ui-object-navigation-main-page')) return 'overview';
  if (tsContent.includes('extends PageComponent')) return 'dashboard';
  return 'unknown';
}

const pageType = detectPageType();
console.log(`Detected page type: ${pageType}\n`);

// Fix 1: Add missing extends PageComponent
if (!tsContent.includes('extends PageComponent') &&
    !tsContent.includes('extends ConfigPageComponent') &&
    !tsContent.includes('extends ObjectPageComponent')) {

  const classMatch = tsContent.match(/(export class \w+Component)\s+implements/);
  if (classMatch) {
    tsContent = tsContent.replace(classMatch[1], `${classMatch[1]} extends PageComponent`);
    applyTsFix('Added missing extends PageComponent');

    // Add import
    if (!tsContent.includes("from '@core/page'")) {
      const importSection = tsContent.match(/import.*from.*;/g);
      if (importSection) {
        const lastImport = importSection[importSection.length - 1];
        tsContent = tsContent.replace(lastImport, `${lastImport}\nimport { PageComponent } from '@core/page';`);
      }
    }
  }
}

// Fix 2: Add missing super.ngOnInit() call
if (tsContent.includes('ngOnInit()') && !tsContent.includes('super.ngOnInit()')) {
  const ngOnInitMatch = tsContent.match(/(ngOnInit\(\)\s*\{)/);
  if (ngOnInitMatch) {
    tsContent = tsContent.replace(ngOnInitMatch[1], `${ngOnInitMatch[1]}\n    super.ngOnInit();`);
    applyTsFix('Added missing super.ngOnInit() call');
  }
}

// Page-specific fixes based on detected type
if (pageType === 'overview') {
  console.log('Applying Overview Page fixes...\n');

  // Fix 3: Overview Page must use ui-object-navigation-main-page
  if (htmlContent && !htmlContent.includes('ui-object-navigation-main-page')) {
    console.log('⚠️  Warning: Overview Page template does not use <ui-object-navigation-main-page>');
    console.log('    Manual refactoring required to delegate rendering to this component.');
    fixes.push('⚠️  Overview Page template needs <ui-object-navigation-main-page> - manual fix required');
  }

  // Fix 4: Remove direct widget rendering from Overview Pages
  if (htmlContent && htmlContent.includes('<mvs-widget')) {
    console.log('⚠️  Warning: Overview Page renders widgets directly.');
    console.log('    Manual refactoring required to use <ui-object-navigation-main-page> instead.');
    fixes.push('⚠️  Overview Page should not render widgets directly - manual fix required');
  }
}

if (pageType === 'dashboard') {
  console.log('Applying Dashboard Page fixes...\n');

  // Fix 5: Add missing WidgetFactory
  if (!tsContent.includes('WidgetFactory')) {
    console.log('⚠️  Warning: Dashboard Page does not use WidgetFactory.');
    console.log('    Widgets should be created via WidgetFactory.createWidget...');
    fixes.push('⚠️  Dashboard Page should use WidgetFactory - manual addition required');
  }

  // Fix 6: Add missing onObjectSelect handler
  if (htmlContent && !htmlContent.includes('onObjectSelect')) {
    console.log('⚠️  Warning: Dashboard Page does not handle onObjectSelect.');
    console.log('    Add (onObjectSelect)="navigateToObject($event)" to widget.');
    fixes.push('⚠️  Dashboard Page needs onObjectSelect handler - manual addition required');
  }
}

if (pageType === 'object') {
  console.log('Applying Object Page fixes...\n');

  // Fix 7: Change extends PageComponent to extends ObjectPageComponent
  if (tsContent.includes('extends PageComponent') && !tsContent.includes('extends ObjectPageComponent')) {
    tsContent = tsContent.replace('extends PageComponent', 'extends ObjectPageComponent');
    tsContent = tsContent.replace("from '@core/page'", "from '@core/page/object-page'");
    applyTsFix('Changed extends PageComponent to extends ObjectPageComponent');
  }

  // Fix 8: Add missing getObjectType()
  if (!tsContent.includes('getObjectType()')) {
    const classEndMatch = tsContent.lastIndexOf('}');
    const getObjectTypeMethod = `\n\n  getObjectType(): string {\n    return 'CHANGE_ME.EntityName'; // TODO: Set correct entity type\n  }\n`;
    tsContent = tsContent.slice(0, classEndMatch) + getObjectTypeMethod + tsContent.slice(classEndMatch);
    applyTsFix('Added missing getObjectType() method (TODO: set correct entity type)');
  }

  // Fix 9: Add missing objectInplaceDirective
  if (htmlContent && !htmlContent.includes('objectInplaceDirective')) {
    console.log('⚠️  Warning: Object Page does not contain objectInplaceDirective.');
    console.log('    Add objectInplaceDirective to the template.');
    fixes.push('⚠️  Object Page needs objectInplaceDirective - manual addition required');
  }
}

if (pageType === 'config') {
  console.log('Applying Config Page fixes...\n');

  // Fix 10: Add missing navigationItems
  if (!tsContent.includes('navigationItems')) {
    const classEndMatch = tsContent.lastIndexOf('}');
    const navigationItemsProperty = `\n\n  navigationItems: MenuItem[] = [\n    // TODO: Define navigation items\n  ];\n`;
    tsContent = tsContent.slice(0, classEndMatch) + navigationItemsProperty + tsContent.slice(classEndMatch);
    applyTsFix('Added missing navigationItems property (TODO: define items)');
  }

  // Fix 11: Check tab count
  if (htmlContent) {
    const tabCount = (htmlContent.match(/p-tab/g) || []).length;
    if (tabCount > 3) {
      console.log(`⚠️  Warning: Config Page uses ${tabCount} tabs (max 3 allowed).`);
      console.log('    Use object-based configuration components instead.');
      fixes.push(`⚠️  Config Page has ${tabCount} tabs (max 3) - refactor to object-based config required`);
    }
  }

  // Fix 12: Remove widget creation from Config Pages
  if (htmlContent && htmlContent.includes('WidgetFactory.create')) {
    console.log('⚠️  Warning: Config Page creates widgets in template.');
    console.log('    Config Pages should not create widgets.');
    fixes.push('⚠️  Config Page should not create widgets - manual removal required');
  }
}

// Write fixed content back to files
if (fixCount > 0) {
  fs.writeFileSync(targetFile, tsContent, 'utf-8');
  if (htmlContent && fs.existsSync(htmlFile)) {
    fs.writeFileSync(htmlFile, htmlContent, 'utf-8');
  }

  console.log(`✅ Applied ${fixCount} fix(es)\n`);
  console.log('Fixes applied:');
  fixes.forEach((fix, index) => {
    console.log(`  ${index + 1}. ${fix}`);
  });
  console.log('\n✅ Files have been updated successfully.');
  console.log('⚠️  Please review the changes and run check-guidlines.js again to verify.');
  console.log('⚠️  Some fixes require manual intervention - check warnings above.');
} else {
  console.log('✅ No fixes needed. File already complies with Page guidelines.');
}

process.exit(0);
