#!/usr/bin/env node

/**
 * Navigation Service Guidelines Validator
 *
 * Validates that implementations using MvsObjectNavigationService
 * correctly follow all guidelines from navigation-service.md
 *
 * When violations are detected, reports exact line:column location.
 * If --auto-fix is enabled, triggers fix-guidelines.js to resolve violations.
 *
 * Usage:
 *   node check-guidelines.js <file-or-directory>
 *   node check-guidelines.js --auto-fix src/app/features/my-module/
 *   node check-guidelines.js --json src/app/my-component.ts
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// GUIDELINES CONFIGURATION
// ============================================================================

const CONFIG = {
    // Required import paths (must match exactly)
    IMPORTS: {
        'MvsObjectNavigationService': 'features/core/shared/navigation/mvs-object-navigation.service',
        'MvsObjectNavigationEntry': 'features/core/shared/navigation/mvs-object-navigation-entry',
        'MvsObjectNavigationActionEnum': 'features/core/shared/navigation/mvs-object-navigation-action-enum',
        'MvsObjectNavigationProviderGeneric': 'features/core/shared/navigation/impl/mvs-object-navigation-provider-generic',
        'MvsObjectNavigationProviderOb': 'features/core/shared/navigation/impl/mvs-object-navigation-provider-ob',
        'ObjectIdentifier': 'features/core/shared/basic/object-identifier'
    },

    // Valid navigation locations
    LOCATIONS: ['main', 'right', 'left', 'bottom', 'dialog'],

    // Valid UI modes
    MODES: ['full', 'side', 'mini-side', 'inline', 'consultant'],

    // Required mode for each location
    LOCATION_MODES: {
        'main': 'full',
        'right': 'side',
        'left': 'side',
        'bottom': 'side',
        'dialog': 'full'
    },

    // Valid action enum values
    ACTIONS: {
        'any': 0,
        'create': 1,
        'edit': 2,
        'display': 3,
        'run': 4
    }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get line and column number for a match in content
 */
function getLineColumn(content, index) {
    const lines = content.substring(0, index).split('\n');
    return {
        line: lines.length,
        column: lines[lines.length - 1].length + 1
    };
}

/**
 * Find all occurrences of a pattern with line numbers
 */
function findAllWithLocation(content, pattern) {
    const results = [];
    let match;
    const regex = new RegExp(pattern, 'g');

    while ((match = regex.exec(content)) !== null) {
        const location = getLineColumn(content, match.index);
        results.push({
            match: match[0],
            groups: match.slice(1),
            index: match.index,
            ...location
        });
    }

    return results;
}

/**
 * Find first occurrence with line number
 */
function findWithLocation(content, pattern) {
    const regex = new RegExp(pattern);
    const match = content.match(regex);

    if (!match) return null;

    const index = content.indexOf(match[0]);
    const location = getLineColumn(content, index);

    return {
        match: match[0],
        groups: match.slice(1),
        index,
        ...location
    };
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

const validationRules = [
    {
        id: 'IMPORT-001',
        name: 'MvsObjectNavigationService Import',
        description: 'MvsObjectNavigationService must be imported from navigation service file',
        fixable: true,
        validate: (content) => {
            if (!content.includes('MvsObjectNavigationService')) return { pass: true };

            const pattern = /import\s*{[^}]*MvsObjectNavigationService[^}]*}\s*from\s*["']([^"']+)["']/;
            const found = findWithLocation(content, pattern);

            if (!found) {
                return {
                    pass: false,
                    message: 'MvsObjectNavigationService import not found',
                    line: 1,
                    column: 1
                };
            }

            const importPath = found.groups[0];
            if (!importPath.includes('mvs-object-navigation.service') &&
                !importPath.includes('alpha-object-navigation.service')) {
                return {
                    pass: false,
                    message: `Wrong import path: "${importPath}"`,
                    expected: `Import from file containing "mvs-object-navigation.service"`,
                    line: found.line,
                    column: found.column,
                    currentValue: importPath
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'IMPORT-002',
        name: 'MvsObjectNavigationEntry Import',
        description: 'MvsObjectNavigationEntry must be imported from navigation entry file',
        fixable: true,
        validate: (content) => {
            if (!content.includes('MvsObjectNavigationEntry')) return { pass: true };

            const pattern = /import\s*{[^}]*MvsObjectNavigationEntry[^}]*}\s*from\s*["']([^"']+)["']/;
            const found = findWithLocation(content, pattern);

            if (!found) {
                return {
                    pass: false,
                    message: 'MvsObjectNavigationEntry import not found',
                    line: 1,
                    column: 1
                };
            }

            const importPath = found.groups[0];
            if (!importPath.includes('mvs-object-navigation-entry')) {
                return {
                    pass: false,
                    message: `Wrong import path: "${importPath}"`,
                    expected: `Import from file containing "mvs-object-navigation-entry"`,
                    line: found.line,
                    column: found.column,
                    currentValue: importPath
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'IMPORT-003',
        name: 'MvsObjectNavigationActionEnum Import',
        description: 'MvsObjectNavigationActionEnum must be imported from action enum file',
        fixable: true,
        validate: (content) => {
            if (!content.includes('MvsObjectNavigationActionEnum')) return { pass: true };

            const pattern = /import\s*{[^}]*MvsObjectNavigationActionEnum[^}]*}\s*from\s*["']([^"']+)["']/;
            const found = findWithLocation(content, pattern);

            if (!found) {
                return {
                    pass: false,
                    message: 'MvsObjectNavigationActionEnum import not found',
                    line: 1,
                    column: 1
                };
            }

            const importPath = found.groups[0];
            if (!importPath.includes('mvs-object-navigation-action-enum')) {
                return {
                    pass: false,
                    message: `Wrong import path: "${importPath}"`,
                    expected: `Import from file containing "mvs-object-navigation-action-enum"`,
                    line: found.line,
                    column: found.column,
                    currentValue: importPath
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'IMPORT-004',
        name: 'ObjectIdentifier Import',
        description: 'ObjectIdentifier must be imported when used',
        fixable: true,
        validate: (content) => {
            const usagePattern = /new\s+ObjectIdentifier|:\s*ObjectIdentifier\b|ObjectIdentifier\./;
            if (!usagePattern.test(content)) return { pass: true };

            const pattern = /import\s*{[^}]*\bObjectIdentifier\b[^}]*}\s*from\s*["']([^"']+)["']/;
            const found = findWithLocation(content, pattern);

            if (!found) {
                const usageFound = findWithLocation(content, usagePattern.source);
                return {
                    pass: false,
                    message: 'ObjectIdentifier used but import not found',
                    line: usageFound ? usageFound.line : 1,
                    column: usageFound ? usageFound.column : 1
                };
            }

            const importPath = found.groups[0];
            if (!importPath.includes('object-identifier')) {
                return {
                    pass: false,
                    message: `Wrong import path: "${importPath}"`,
                    expected: `Import from file containing "object-identifier"`,
                    line: found.line,
                    column: found.column,
                    currentValue: importPath
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'INJECT-001',
        name: 'Service Injection Modifier',
        description: 'MvsObjectNavigationService must be injected with "protected" modifier',
        fixable: true,
        validate: (content) => {
            if (!content.includes('MvsObjectNavigationService')) return { pass: true };

            const pattern = /constructor\s*\([^)]*MvsObjectNavigationService[^)]*\)/s;
            const constructorFound = findWithLocation(content, pattern);
            if (!constructorFound) return { pass: true };

            const injectionPattern = /(private|public|protected)?\s*(\w+)\s*:\s*MvsObjectNavigationService/;
            const match = constructorFound.match.match(injectionPattern);

            if (!match) {
                return {
                    pass: false,
                    message: 'Service injection pattern not found',
                    line: constructorFound.line,
                    column: constructorFound.column
                };
            }

            const modifier = match[1];
            if (modifier !== 'protected') {
                const modifierIndex = constructorFound.match.indexOf(match[0]);
                const loc = getLineColumn(content, constructorFound.index + modifierIndex);
                return {
                    pass: false,
                    message: `Service injected with "${modifier || 'no'}" modifier`,
                    expected: 'Must use "protected" modifier: protected navigationService: MvsObjectNavigationService',
                    line: loc.line,
                    column: loc.column,
                    currentValue: modifier || ''
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'INJECT-002',
        name: 'Service Variable Name',
        description: 'Navigation service variable should be named "navigationService"',
        fixable: true,
        validate: (content) => {
            if (!content.includes('MvsObjectNavigationService')) return { pass: true };

            const pattern = /protected\s+(\w+)\s*:\s*MvsObjectNavigationService/;
            const found = findWithLocation(content, pattern);

            if (found && found.groups[0] !== 'navigationService') {
                return {
                    pass: false,
                    message: `Service variable named "${found.groups[0]}"`,
                    expected: 'Recommended name: "navigationService"',
                    line: found.line,
                    column: found.column,
                    currentValue: found.groups[0]
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'INIT-001',
        name: 'Provider Initialization',
        description: 'Navigation provider must be set in ngOnInit',
        fixable: true,
        validate: (content) => {
            const usesNavigation = content.includes('.navigateTo(') ||
                                   content.includes('.handleObjectNavigation(') ||
                                   content.includes('.addOverlay(');

            if (!usesNavigation) return { pass: true };

            if (!content.includes('setNavigationProvider')) {
                const navUsage = findWithLocation(content, /\.(navigateTo|handleObjectNavigation|addOverlay)\s*\(/);
                return {
                    pass: false,
                    message: 'setNavigationProvider() not called',
                    expected: 'Call in ngOnInit: this.navigationService.setNavigationProvider(new MvsObjectNavigationProviderGeneric())',
                    line: navUsage ? navUsage.line : 1,
                    column: navUsage ? navUsage.column : 1
                };
            }

            const ngOnInitPattern = /ngOnInit\s*\([^)]*\)[^{]*{([^}]*(?:{[^}]*}[^}]*)*)}/s;
            const ngOnInitMatch = content.match(ngOnInitPattern);
            if (ngOnInitMatch && !ngOnInitMatch[0].includes('setNavigationProvider')) {
                const found = findWithLocation(content, /setNavigationProvider/);
                return {
                    pass: false,
                    message: 'setNavigationProvider() not in ngOnInit',
                    expected: 'Must be called inside ngOnInit method',
                    line: found ? found.line : 1,
                    column: found ? found.column : 1
                };
            }

            return { pass: true };
        }
    },

    {
        id: 'NAV-001',
        name: 'Valid Navigation Location',
        description: 'navigateTo() must use valid location strings',
        fixable: true,
        validate: (content) => {
            const occurrences = findAllWithLocation(content, /\.navigateTo\s*\([^,]+,\s*['"]([^'"]+)['"]\)/);
            const violations = [];

            for (const occ of occurrences) {
                const location = occ.groups[0];
                if (!CONFIG.LOCATIONS.includes(location)) {
                    violations.push({
                        value: location,
                        line: occ.line,
                        column: occ.column
                    });
                }
            }

            if (violations.length > 0) {
                return {
                    pass: false,
                    message: `Invalid locations used: ${violations.map(v => v.value).join(', ')}`,
                    expected: `Valid locations: ${CONFIG.LOCATIONS.join(', ')}`,
                    line: violations[0].line,
                    column: violations[0].column,
                    violations
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'NAV-002',
        name: 'Valid UI Mode',
        description: 'Entry mode must use valid mode strings',
        fixable: true,
        validate: (content) => {
            const occurrences = findAllWithLocation(content, /\.mode\s*=\s*['"]([^'"]+)['"]/);
            const violations = [];

            for (const occ of occurrences) {
                const mode = occ.groups[0];
                if (!CONFIG.MODES.includes(mode)) {
                    violations.push({
                        value: mode,
                        line: occ.line,
                        column: occ.column
                    });
                }
            }

            if (violations.length > 0) {
                return {
                    pass: false,
                    message: `Invalid modes used: ${violations.map(v => v.value).join(', ')}`,
                    expected: `Valid modes: ${CONFIG.MODES.join(', ')}`,
                    line: violations[0].line,
                    column: violations[0].column,
                    violations
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'NAV-003',
        name: 'Mode-Location Consistency',
        description: 'Entry mode must match navigation location (side for sidebars, full for main/dialog)',
        fixable: true,
        validate: (content) => {
            const modeOccurrences = findAllWithLocation(content, /(\w+)\.mode\s*=\s*['"](\w+)['"]/);
            const navOccurrences = findAllWithLocation(content, /\.navigateTo\s*\(\s*(\w+)\s*,\s*['"](\w+)['"]\)/);

            const modeMap = {};
            for (const occ of modeOccurrences) {
                modeMap[occ.groups[0]] = { mode: occ.groups[1], line: occ.line, column: occ.column };
            }

            const violations = [];
            for (const occ of navOccurrences) {
                const varName = occ.groups[0];
                const location = occ.groups[1];
                const expectedMode = CONFIG.LOCATION_MODES[location];
                const actualModeInfo = modeMap[varName];

                if (actualModeInfo && expectedMode && actualModeInfo.mode !== expectedMode) {
                    violations.push({
                        message: `${varName} has mode "${actualModeInfo.mode}" but navigates to "${location}" (expects "${expectedMode}")`,
                        line: actualModeInfo.line,
                        column: actualModeInfo.column,
                        varName,
                        currentMode: actualModeInfo.mode,
                        expectedMode,
                        location
                    });
                }
            }

            if (violations.length > 0) {
                return {
                    pass: false,
                    message: violations.map(v => v.message).join('; '),
                    expected: 'Sidebars (right/left/bottom) use "side" mode, main/dialog use "full" mode',
                    line: violations[0].line,
                    column: violations[0].column,
                    violations
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'NAV-004',
        name: 'Sidebar Close Pattern',
        description: 'Closing sidebar must use navigateTo(null, location)',
        fixable: true,
        validate: (content) => {
            const undefinedPattern = findWithLocation(content, /\.navigateTo\s*\(\s*undefined\s*,/);
            if (undefinedPattern) {
                return {
                    pass: false,
                    message: 'Using undefined to close sidebar',
                    expected: 'Use null: this.navigationService.navigateTo(null, "right")',
                    line: undefinedPattern.line,
                    column: undefinedPattern.column,
                    currentValue: 'undefined'
                };
            }

            const emptyObjPattern = findWithLocation(content, /\.navigateTo\s*\(\s*\{\s*\}\s*,/);
            if (emptyObjPattern) {
                return {
                    pass: false,
                    message: 'Using empty object to close sidebar',
                    expected: 'Use null: this.navigationService.navigateTo(null, "right")',
                    line: emptyObjPattern.line,
                    column: emptyObjPattern.column,
                    currentValue: '{}'
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'NAV-005',
        name: 'BehaviorSubject Location',
        description: 'getNavigationBehaviourSubject() must use valid location',
        fixable: true,
        validate: (content) => {
            const occurrences = findAllWithLocation(content, /getNavigationBehaviourSubject\s*\(\s*['"]([^'"]+)['"]\s*\)/);
            const violations = [];

            for (const occ of occurrences) {
                const location = occ.groups[0];
                if (!CONFIG.LOCATIONS.includes(location)) {
                    violations.push({
                        value: location,
                        line: occ.line,
                        column: occ.column
                    });
                }
            }

            if (violations.length > 0) {
                return {
                    pass: false,
                    message: `Invalid locations in getNavigationBehaviourSubject: ${violations.map(v => v.value).join(', ')}`,
                    expected: `Valid locations: ${CONFIG.LOCATIONS.join(', ')}`,
                    line: violations[0].line,
                    column: violations[0].column,
                    violations
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'ENTRY-001',
        name: 'Navigation Entry Creation',
        description: 'Must use MvsObjectNavigationEntry.createNavigationEntry()',
        fixable: true,
        validate: (content) => {
            const found = findWithLocation(content, /new\s+MvsObjectNavigationEntry\s*\(/);
            if (found) {
                return {
                    pass: false,
                    message: 'Creating MvsObjectNavigationEntry with "new" keyword',
                    expected: 'Use static factory: MvsObjectNavigationEntry.createNavigationEntry(...)',
                    line: found.line,
                    column: found.column
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'ENTRY-002',
        name: 'Action Enum Usage',
        description: 'Navigation action must use MvsObjectNavigationActionEnum, not numeric values',
        fixable: true,
        validate: (content) => {
            const occurrences = findAllWithLocation(content, /createNavigationEntry\s*\([^)]*,\s*([0-4])\s*\)/);

            for (const occ of occurrences) {
                const numValue = parseInt(occ.groups[0]);
                const enumName = Object.entries(CONFIG.ACTIONS).find(([k, v]) => v === numValue)?.[0];
                return {
                    pass: false,
                    message: `Using numeric action value: ${numValue}`,
                    expected: `Use enum: MvsObjectNavigationActionEnum.${enumName || 'any'}`,
                    line: occ.line,
                    column: occ.column,
                    currentValue: numValue,
                    suggestedEnum: enumName || 'any'
                };
            }

            const directAssign = findWithLocation(content, /\.action\s*=\s*([0-4])\b/);
            if (directAssign) {
                const numValue = parseInt(directAssign.groups[0]);
                const enumName = Object.entries(CONFIG.ACTIONS).find(([k, v]) => v === numValue)?.[0];
                return {
                    pass: false,
                    message: 'Assigning numeric value to action property',
                    expected: `Use MvsObjectNavigationActionEnum.${enumName || 'any'}`,
                    line: directAssign.line,
                    column: directAssign.column,
                    currentValue: numValue,
                    suggestedEnum: enumName || 'any'
                };
            }

            return { pass: true };
        }
    },

    {
        id: 'SUB-001',
        name: 'Subscription Cleanup',
        description: 'Navigation subscriptions must be unsubscribed in ngOnDestroy',
        fixable: true,
        validate: (content) => {
            const hasSubscription = content.includes('getNavigationBehaviourSubject') &&
                                    content.includes('.subscribe(');

            if (!hasSubscription) return { pass: true };

            const hasCleanup = (content.includes('ngOnDestroy') && content.includes('.unsubscribe()')) ||
                              content.includes('takeUntilDestroyed') ||
                              content.includes('takeUntil(') ||
                              content.includes('DestroyRef');

            if (!hasCleanup) {
                const subFound = findWithLocation(content, /getNavigationBehaviourSubject[^;]*\.subscribe\s*\(/);
                return {
                    pass: false,
                    message: 'Subscription not cleaned up',
                    expected: 'Unsubscribe in ngOnDestroy or use takeUntilDestroyed()',
                    line: subFound ? subFound.line : 1,
                    column: subFound ? subFound.column : 1
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'SUB-002',
        name: 'OnDestroy Implementation',
        description: 'Component with subscriptions must implement OnDestroy',
        fixable: true,
        validate: (content) => {
            const hasSubscription = content.includes('getNavigationBehaviourSubject') &&
                                    content.includes('.subscribe(');

            if (!hasSubscription) return { pass: true };

            if (content.includes('takeUntilDestroyed')) return { pass: true };

            if (!content.includes('implements') || !content.includes('OnDestroy')) {
                const classFound = findWithLocation(content, /export\s+class\s+\w+/);
                return {
                    pass: false,
                    message: 'Component does not implement OnDestroy',
                    expected: 'Add OnDestroy to implements: export class MyComponent implements OnInit, OnDestroy',
                    line: classFound ? classFound.line : 1,
                    column: classFound ? classFound.column : 1
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'DIRTY-001',
        name: 'Dirty State for Forms',
        description: 'Components with forms should implement dirty state tracking',
        fixable: false,
        validate: (content) => {
            const hasForm = content.includes('FormGroup') ||
                           content.includes('[(ngModel)]') ||
                           content.includes('formControlName');
            const hasNavService = content.includes('MvsObjectNavigationService');

            if (!hasForm || !hasNavService) return { pass: true };

            const hasDirtyHandling = content.includes('setDirty(') || content.includes('getDirtyState(');

            if (!hasDirtyHandling) {
                const formFound = findWithLocation(content, /FormGroup|formControlName|\[\(ngModel\)\]/);
                return {
                    pass: false,
                    message: 'Form component without dirty state tracking',
                    expected: 'Use setDirty() on form changes and getDirtyState() before navigation',
                    line: formFound ? formFound.line : 1,
                    column: formFound ? formFound.column : 1
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'OVERLAY-001',
        name: 'Overlay Management',
        description: 'Components that add overlays should handle removal',
        fixable: false,
        validate: (content) => {
            const addOverlayFound = findWithLocation(content, /\.addOverlay\s*\(/);

            if (!addOverlayFound) return { pass: true };

            const hasRemoveOverlay = content.includes('.removeLastOverlay(') ||
                                     content.includes('.clearOverlay(');

            if (!hasRemoveOverlay) {
                return {
                    pass: false,
                    message: 'Overlay added but no removal handling',
                    expected: 'Implement overlay removal with removeLastOverlay() or clearOverlay()',
                    line: addOverlayFound.line,
                    column: addOverlayFound.column
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'CLICK-001',
        name: 'Object Click Handler',
        description: 'Object click handlers should use handleObjectNavigation() for Ctrl+Click support',
        fixable: false,
        validate: (content) => {
            const clickPattern = /\(\s*event\s*:\s*MouseEvent[^)]*\)[^{]*{[^}]*new\s+ObjectIdentifier/s;
            const hasClickWithObject = content.match(clickPattern);
            const hasHandleObjectNav = content.includes('handleObjectNavigation');

            if (hasClickWithObject && !hasHandleObjectNav) {
                const found = findWithLocation(content, /\(\s*event\s*:\s*MouseEvent/);
                return {
                    pass: false,
                    message: 'Click handler creates ObjectIdentifier but does not use handleObjectNavigation',
                    expected: 'Use handleObjectNavigation(objectId, event) for automatic Ctrl+Click handling',
                    line: found ? found.line : 1,
                    column: found ? found.column : 1
                };
            }
            return { pass: true };
        }
    }
];

// ============================================================================
// VALIDATOR CLASS
// ============================================================================

class GuidelinesValidator {
    constructor(options = {}) {
        this.options = {
            verbose: options.verbose || false,
            json: options.json || false,
            autoFix: options.autoFix || false,
            strict: options.strict || false
        };
        this.results = {
            files: [],
            summary: { total: 0, passed: 0, failed: 0, skipped: 0, fixed: 0 }
        };
    }

    validateFile(filePath) {
        if (!fs.existsSync(filePath)) {
            return null;
        }

        const content = fs.readFileSync(filePath, 'utf-8');

        // Skip files that don't use navigation service
        if (!this.usesNavigationService(content)) {
            this.results.summary.skipped++;
            return null;
        }

        this.results.summary.total++;

        const fileResult = {
            file: filePath,
            passed: [],
            failed: []
        };

        for (const rule of validationRules) {
            try {
                const result = rule.validate(content);

                if (result.pass) {
                    fileResult.passed.push({
                        id: rule.id,
                        name: rule.name
                    });
                } else {
                    fileResult.failed.push({
                        id: rule.id,
                        name: rule.name,
                        description: rule.description,
                        message: result.message,
                        expected: result.expected,
                        line: result.line || 1,
                        column: result.column || 1,
                        fixable: rule.fixable,
                        currentValue: result.currentValue,
                        violations: result.violations,
                        suggestedEnum: result.suggestedEnum
                    });
                }
            } catch (error) {
                if (this.options.verbose) {
                    console.error(`Error in rule ${rule.id}: ${error.message}`);
                }
            }
        }

        if (fileResult.failed.length === 0) {
            this.results.summary.passed++;
        } else {
            this.results.summary.failed++;
        }

        return fileResult;
    }

    usesNavigationService(content) {
        return content.includes('MvsObjectNavigationService') ||
               content.includes('MvsObjectNavigationEntry') ||
               content.includes('handleObjectNavigation') ||
               content.includes('navigateTo(');
    }

    getFiles(targetPath) {
        const files = [];

        if (!fs.existsSync(targetPath)) {
            return files;
        }

        const stat = fs.statSync(targetPath);

        if (stat.isFile()) {
            if (targetPath.endsWith('.ts') && !targetPath.endsWith('.spec.ts')) {
                return [targetPath];
            }
            return files;
        }

        const items = fs.readdirSync(targetPath);

        for (const item of items) {
            if (item.startsWith('.') || item === 'node_modules') continue;

            const fullPath = path.join(targetPath, item);
            const itemStat = fs.statSync(fullPath);

            if (itemStat.isDirectory()) {
                files.push(...this.getFiles(fullPath));
            } else if (item.endsWith('.ts') && !item.endsWith('.spec.ts') && !item.endsWith('.d.ts')) {
                files.push(fullPath);
            }
        }

        return files;
    }

    validate(paths) {
        const allFiles = [];

        for (const p of paths) {
            allFiles.push(...this.getFiles(path.resolve(p)));
        }

        for (const file of allFiles) {
            const result = this.validateFile(file);
            if (result) {
                this.results.files.push(result);
            }
        }

        return this.results;
    }

    runAutoFix() {
        if (this.results.summary.failed === 0) {
            return;
        }

        const fixScriptPath = path.join(__dirname, 'fix-guidelines.js');

        if (!fs.existsSync(fixScriptPath)) {
            console.error('\nAuto-fix script not found: ' + fixScriptPath);
            return;
        }

        // Pass violations to fix script via JSON
        const violationsJson = JSON.stringify(this.results);

        try {
            execSync(`node "${fixScriptPath}"`, {
                input: violationsJson,
                stdio: ['pipe', 'inherit', 'inherit'],
                cwd: __dirname
            });
            this.results.summary.fixed = this.results.summary.failed;
        } catch (error) {
            console.error('\nAuto-fix failed:', error.message);
        }
    }

    printResults() {
        if (this.options.json) {
            console.log(JSON.stringify(this.results, null, 2));
            return this.results.summary.failed > 0 ? 1 : 0;
        }

        const c = {
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            cyan: '\x1b[36m',
            reset: '\x1b[0m',
            bold: '\x1b[1m',
            dim: '\x1b[2m'
        };

        console.log();
        console.log(c.bold + '╔════════════════════════════════════════════════════════════════╗' + c.reset);
        console.log(c.bold + '║       Navigation Service Guidelines Validation Report          ║' + c.reset);
        console.log(c.bold + '╚════════════════════════════════════════════════════════════════╝' + c.reset);
        console.log();

        // Show failed files with details
        const failedFiles = this.results.files.filter(f => f.failed.length > 0);

        if (failedFiles.length > 0) {
            console.log(c.red + c.bold + '✗ VALIDATION FAILURES' + c.reset);
            console.log(c.dim + '─'.repeat(65) + c.reset);

            for (const file of failedFiles) {
                console.log();
                console.log(c.bold + '📄 ' + file.file + c.reset);

                for (const failure of file.failed) {
                    console.log();
                    console.log(`   ${c.red}✗ [${failure.id}] ${failure.name}${c.reset}`);
                    console.log(`     ${c.cyan}Location:${c.reset} Line ${failure.line}, Column ${failure.column}`);
                    console.log(`     ${c.yellow}Issue:${c.reset} ${failure.message}`);
                    if (failure.expected) {
                        console.log(`     ${c.green}Fix:${c.reset} ${failure.expected}`);
                    }
                    if (failure.fixable) {
                        console.log(`     ${c.dim}[Auto-fixable]${c.reset}`);
                    }
                }
            }
            console.log();
        }

        // Show passed files
        const passedFiles = this.results.files.filter(f => f.failed.length === 0);

        if (passedFiles.length > 0 && this.options.verbose) {
            console.log(c.green + c.bold + '✓ PASSED FILES' + c.reset);
            console.log(c.dim + '─'.repeat(65) + c.reset);

            for (const file of passedFiles) {
                console.log(`   ${c.green}✓${c.reset} ${file.file}`);
            }
            console.log();
        }

        // Summary
        console.log(c.bold + '╔════════════════════════════════════════════════════════════════╗' + c.reset);
        console.log(c.bold + '║                          SUMMARY                               ║' + c.reset);
        console.log(c.bold + '╚════════════════════════════════════════════════════════════════╝' + c.reset);
        console.log();
        console.log(`   Files checked:  ${this.results.summary.total}`);
        console.log(`   ${c.green}Passed:${c.reset}        ${this.results.summary.passed}`);
        console.log(`   ${c.red}Failed:${c.reset}        ${this.results.summary.failed}`);
        console.log(`   ${c.dim}Skipped:${c.reset}       ${this.results.summary.skipped} (no navigation service usage)`);
        if (this.results.summary.fixed > 0) {
            console.log(`   ${c.cyan}Fixed:${c.reset}         ${this.results.summary.fixed}`);
        }
        console.log();

        if (this.results.summary.failed === 0) {
            console.log(c.green + c.bold + '✓ All files comply with Navigation Service guidelines!' + c.reset);
            console.log();
            return 0;
        } else {
            console.log(c.red + c.bold + `✗ ${this.results.summary.failed} file(s) have guideline violations` + c.reset);
            if (!this.options.autoFix) {
                console.log(c.dim + '  Run with --auto-fix to automatically resolve fixable issues' + c.reset);
            }
            console.log();
            return 1;
        }
    }
}

// ============================================================================
// CLI
// ============================================================================

function printHelp() {
    console.log(`
Navigation Service Guidelines Validator

Validates that implementations correctly follow navigation-service.md guidelines.
Reports violations with exact line:column location.
Can automatically fix violations when --auto-fix is enabled.

Usage:
  node check-guidelines.js [options] <path...>

Options:
  -h, --help      Show help
  -v, --verbose   Show passed files and details
  -j, --json      Output as JSON (for programmatic use)
  --auto-fix      Automatically fix violations using fix-guidelines.js
  --list-rules    List all validation rules

Examples:
  node check-guidelines.js src/app/my-component.ts
  node check-guidelines.js src/app/features/my-module/
  node check-guidelines.js --auto-fix src/app/features/my-module/
  node check-guidelines.js --json src/app/my-component.ts > report.json
`);
}

function printRules() {
    console.log('\nValidation Rules:\n');
    console.log('─'.repeat(70));

    for (const rule of validationRules) {
        const fixableTag = rule.fixable ? ' [Auto-fixable]' : '';
        console.log(`\n[${rule.id}] ${rule.name}${fixableTag}`);
        console.log(`  ${rule.description}`);
    }
    console.log();
}

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
        printHelp();
        process.exit(0);
    }

    if (args.includes('--list-rules')) {
        printRules();
        process.exit(0);
    }

    const options = {
        verbose: args.includes('-v') || args.includes('--verbose'),
        json: args.includes('-j') || args.includes('--json'),
        autoFix: args.includes('--auto-fix')
    };

    const paths = args.filter(arg => !arg.startsWith('-'));

    if (paths.length === 0) {
        console.error('Error: No path specified');
        process.exit(1);
    }

    const validator = new GuidelinesValidator(options);
    validator.validate(paths);

    // Run auto-fix if enabled and there are failures
    if (options.autoFix && validator.results.summary.failed > 0) {
        validator.runAutoFix();
    }

    const exitCode = validator.printResults();
    process.exit(exitCode);
}

if (require.main === module) {
    main();
}

module.exports = { GuidelinesValidator, validationRules, CONFIG };
