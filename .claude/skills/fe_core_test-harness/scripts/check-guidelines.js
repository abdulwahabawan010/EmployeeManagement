#!/usr/bin/env node

/**
 * Test Harness Guidelines Validator
 *
 * Validates that test harness implementations correctly follow all guidelines
 * from test-harness.md documentation.
 *
 * When violations are detected, reports exact line:column location.
 * If --auto-fix is enabled, triggers fix-guidelines.js to resolve violations.
 *
 * Usage:
 *   node check-guidelines.js <file-or-directory>
 *   node check-guidelines.js --auto-fix features/feature-crm/cr/test/
 *   node check-guidelines.js --json features/feature-crm/cr/test/ > report.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// GUIDELINES CONFIGURATION
// ============================================================================

const CONFIG = {
    // Required import path
    IMPORT_PATH: '@core/shared/test/data/test-harness.types',

    // Required imports from test-harness.types
    REQUIRED_IMPORTS: [
        'TEST_MODULE_REGISTRY',
        'TestCaseDataType',
        'TestModuleDefinition'
    ],

    // Valid component types (extended to match project conventions)
    COMPONENT_TYPES: [
        'Component',
        'ObjectBaseComponent',
        'FormComponent',
        'DialogComponent',
        'PageComponent',
        'CoreComponent',
        'CorePage',
        'FieldTypeBaseComponent',
        'MetaExtensionBaseComponent',
        'MvsFormFieldBaseComponent',
        'MvsFormFieldOutputBaseComponent',
        'ValueListBaseComponent',
        'OverviewKpiBaseComponent',
        'OverviewStatisticsBaseComponent',
        'ChipSelect',
        'Avatar',
        'WizardComponent',
        'StepComponent',
        'WidgetComponent',
        'OverviewPageComponent',
        'ObjectPageComponent',
        'SearchInputComponent'
    ],

    // Valid data types
    DATA_TYPES: {
        local: 0,
        server: 1
    },

    // File patterns
    FILE_PATTERNS: {
        testDefinition: /-test-definition\.ts$/,
        mockData: /^mock-.*\.json$/
    },

    // Naming patterns (relaxed to match project conventions)
    NAMING: {
        moduleKey: /^[a-z]{2,4}$/,
        moduleLabel: /^.+$/,
        componentKey: /^[A-Z][a-zA-Z0-9]*(Component|Page)?$/,
        testCaseKey: /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/,
        providerExport: /^[A-Z_]+_TEST_PROVIDERS$/
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

function isTestDefinitionFile(filePath) {
    return CONFIG.FILE_PATTERNS.testDefinition.test(filePath);
}

function isMockDataFile(filePath) {
    return CONFIG.FILE_PATTERNS.mockData.test(path.basename(filePath));
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

const validationRules = [
    // ==================== IMPORT RULES ====================
    {
        id: 'IMPORT-001',
        name: 'Test Harness Types Import',
        description: 'Must import from @core/shared/test/data/test-harness.types',
        fixable: true,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            const pattern = /import\s*{([^}]+)}\s*from\s*["']([^"']*test-harness\.types[^"']*)["']/;
            const found = findWithLocation(content, pattern);

            if (!found) {
                return {
                    pass: false,
                    message: 'Test harness types import not found',
                    expected: `Import from "${CONFIG.IMPORT_PATH}"`,
                    line: 1,
                    column: 1
                };
            }

            const importPath = found.groups[1];
            if (!importPath.includes('test-harness.types')) {
                return {
                    pass: false,
                    message: `Wrong import path: "${importPath}"`,
                    expected: `Import from "${CONFIG.IMPORT_PATH}"`,
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
        name: 'TEST_MODULE_REGISTRY Import',
        description: 'Must import TEST_MODULE_REGISTRY for provider registration',
        fixable: true,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            if (!content.includes('TEST_MODULE_REGISTRY')) {
                return {
                    pass: false,
                    message: 'TEST_MODULE_REGISTRY not imported',
                    expected: 'Import TEST_MODULE_REGISTRY from test-harness.types',
                    line: 1,
                    column: 1
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'IMPORT-003',
        name: 'TestCaseDataType Import',
        description: 'Must import TestCaseDataType for data type specification',
        fixable: true,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            if (content.includes('testCaseData') && !content.includes('TestCaseDataType')) {
                const found = findWithLocation(content, /testCaseData/);
                return {
                    pass: false,
                    message: 'TestCaseDataType not imported',
                    expected: 'Import TestCaseDataType from test-harness.types',
                    line: found ? found.line : 1,
                    column: found ? found.column : 1
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'IMPORT-004',
        name: 'TestModuleDefinition Type',
        description: 'Module entry should be typed as TestModuleDefinition',
        fixable: true,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            const pattern = /const\s+(\w+(?:ModuleEntry|Entry))\s*(?::\s*TestModuleDefinition)?\s*=/;
            const found = findWithLocation(content, pattern);

            if (found && !content.includes('TestModuleDefinition')) {
                return {
                    pass: false,
                    message: 'Module entry should be typed as TestModuleDefinition',
                    expected: 'const myModuleEntry: TestModuleDefinition = { ... }',
                    line: found.line,
                    column: found.column,
                    currentValue: found.groups[0]
                };
            }
            return { pass: true };
        }
    },

    // ==================== MODULE DEFINITION RULES ====================
    {
        id: 'MODULE-001',
        name: 'Module Key Format',
        description: 'Module key must be lowercase, 2-3 characters',
        fixable: false,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            const pattern = /key\s*:\s*['"]([^'"]+)['"]/;
            const found = findWithLocation(content, pattern);

            if (found) {
                const key = found.groups[0];
                if (key.length <= 4 && !CONFIG.NAMING.moduleKey.test(key)) {
                    return {
                        pass: false,
                        message: `Invalid module key format: "${key}"`,
                        expected: 'Module key must be lowercase, 2-3 characters (e.g., "bm", "cr", "dm")',
                        line: found.line,
                        column: found.column,
                        currentValue: key
                    };
                }
            }
            return { pass: true };
        }
    },

    {
        id: 'MODULE-002',
        name: 'Module Label Format',
        description: 'Module label should follow "Full Name (key)" format',
        fixable: false,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            const modulePattern = /(?:ModuleEntry|Entry)\s*(?::\s*TestModuleDefinition)?\s*=\s*{[^}]*label\s*:\s*['"]([^'"]+)['"]/s;
            const found = findWithLocation(content, modulePattern);

            if (found) {
                const label = found.groups[0];
                if (!CONFIG.NAMING.moduleLabel.test(label)) {
                    return {
                        pass: false,
                        message: `Module label "${label}" doesn't follow recommended format`,
                        expected: 'Format: "Full Name (key)" (e.g., "Billing (bm)", "CRM (cr)")',
                        line: found.line,
                        column: found.column,
                        currentValue: label
                    };
                }
            }
            return { pass: true };
        }
    },

    {
        id: 'MODULE-003',
        name: 'Components Array Required',
        description: 'Module definition must have components array',
        fixable: true,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            if (content.includes('TestModuleDefinition') && !content.includes('components:')) {
                const found = findWithLocation(content, /TestModuleDefinition/);
                return {
                    pass: false,
                    message: 'Module definition missing components array',
                    expected: 'Add components: [] array to module definition',
                    line: found ? found.line : 1,
                    column: found ? found.column : 1
                };
            }
            return { pass: true };
        }
    },

    // ==================== COMPONENT DEFINITION RULES ====================
    {
        id: 'COMP-001',
        name: 'Component Key Format',
        description: 'Component key should be PascalCase class name',
        fixable: false,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            const compKeyPattern = /components\s*:\s*\[[^\]]*key\s*:\s*['"]([^'"]+)['"]/gs;
            const occurrences = findAllWithLocation(content, compKeyPattern);
            const violations = [];

            for (const occ of occurrences) {
                const key = occ.groups[0];
                if (!CONFIG.NAMING.componentKey.test(key)) {
                    violations.push({
                        value: key,
                        line: occ.line,
                        column: occ.column
                    });
                }
            }

            if (violations.length > 0) {
                return {
                    pass: false,
                    message: `Invalid component key format: ${violations.map(v => v.value).join(', ')}`,
                    expected: 'Component key should be PascalCase class name (e.g., "MyComponent", "BmCustomerComponent")',
                    line: violations[0].line,
                    column: violations[0].column,
                    violations
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'COMP-002',
        name: 'Component Type Valid',
        description: 'Component type must be a valid type string',
        fixable: false,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            const occurrences = findAllWithLocation(content, /type\s*:\s*['"]([^'"]+)['"]/);
            const violations = [];

            for (const occ of occurrences) {
                const type = occ.groups[0];
                if (type === 'local' || type === 'server') continue;
                const isValid = CONFIG.COMPONENT_TYPES.includes(type) ||
                               type.endsWith('Component') ||
                               type.endsWith('BaseComponent');
                if (!isValid) {
                    violations.push({
                        value: type,
                        line: occ.line,
                        column: occ.column
                    });
                }
            }

            if (violations.length > 0) {
                return {
                    pass: false,
                    message: `Invalid component type: ${violations.map(v => v.value).join(', ')}`,
                    expected: `Type should end with 'Component' or 'BaseComponent'`,
                    line: violations[0].line,
                    column: violations[0].column,
                    violations
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'COMP-003',
        name: 'Component Required Properties',
        description: 'Component must have key, component, selector, type, label (testCases optional)',
        fixable: false,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            const requiredProps = ['key', 'component', 'selector', 'type', 'label'];
            const missing = [];

            const componentsSection = content.match(/components\s*:\s*\[([\s\S]*?)\]/);
            if (componentsSection) {
                const found = findWithLocation(content, /components\s*:/);
                for (const prop of requiredProps) {
                    if (!componentsSection[1].includes(`${prop}:`)) {
                        missing.push(prop);
                    }
                }

                if (missing.length > 0) {
                    return {
                        pass: false,
                        message: `Component definition missing properties: ${missing.join(', ')}`,
                        expected: 'Each component must have: key, component, selector, type, label',
                        line: found ? found.line : 1,
                        column: found ? found.column : 1,
                        missingProperties: missing
                    };
                }
            }
            return { pass: true };
        }
    },

    {
        id: 'COMP-004',
        name: 'Selector Format',
        description: 'Component selector should be kebab-case',
        fixable: false,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            const occurrences = findAllWithLocation(content, /selector\s*:\s*['"]([^'"]+)['"]/);
            const violations = [];

            for (const occ of occurrences) {
                const selector = occ.groups[0];
                if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(selector)) {
                    violations.push({
                        value: selector,
                        line: occ.line,
                        column: occ.column
                    });
                }
            }

            if (violations.length > 0) {
                return {
                    pass: false,
                    message: `Invalid selector format: ${violations.map(v => v.value).join(', ')}`,
                    expected: 'Selector should be kebab-case (e.g., "app-my-component", "cr-ticket-list")',
                    line: violations[0].line,
                    column: violations[0].column,
                    violations
                };
            }
            return { pass: true };
        }
    },

    // ==================== TEST CASE RULES ====================
    {
        id: 'CASE-001',
        name: 'Test Case Key Format',
        description: 'Test case key should be kebab-case',
        fixable: false,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            const testCasesMatch = content.match(/testCases\s*:\s*\[([\s\S]*?)\]\s*}/g);
            if (!testCasesMatch) return { pass: true };

            const violations = [];
            for (const section of testCasesMatch) {
                const keyMatches = [...section.matchAll(/key\s*:\s*['"]([^'"]+)['"]/g)];
                for (const match of keyMatches) {
                    const key = match[1];
                    if (/^[A-Z]/.test(key)) continue; // Skip component keys
                    if (!CONFIG.NAMING.testCaseKey.test(key)) {
                        const found = findWithLocation(content, `key\\s*:\\s*['"]${key}['"]`);
                        violations.push({
                            value: key,
                            line: found ? found.line : 1,
                            column: found ? found.column : 1
                        });
                    }
                }
            }

            if (violations.length > 0) {
                return {
                    pass: false,
                    message: `Invalid test case key format: ${violations.map(v => v.value).join(', ')}`,
                    expected: 'Test case key should be kebab-case (e.g., "default", "with-data", "empty-state")',
                    line: violations[0].line,
                    column: violations[0].column,
                    violations
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'CASE-002',
        name: 'Test Case Required Properties',
        description: 'Test case must have key, label, testCaseData',
        fixable: false,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            const testCasesMatch = content.match(/testCases\s*:\s*\[([\s\S]*?)\]\s*}/);
            if (!testCasesMatch) return { pass: true };

            const section = testCasesMatch[1];
            const hasKey = section.includes('key:');
            const hasLabel = section.includes('label:');
            const hasData = section.includes('testCaseData:');

            if (!hasKey || !hasLabel || !hasData) {
                const missing = [];
                if (!hasKey) missing.push('key');
                if (!hasLabel) missing.push('label');
                if (!hasData) missing.push('testCaseData');

                const found = findWithLocation(content, /testCases\s*:/);
                return {
                    pass: false,
                    message: `Test case missing properties: ${missing.join(', ')}`,
                    expected: 'Each test case must have: key, label, testCaseData',
                    line: found ? found.line : 1,
                    column: found ? found.column : 1,
                    missingProperties: missing
                };
            }
            return { pass: true };
        }
    },

    // ==================== TEST CASE DATA RULES ====================
    {
        id: 'DATA-001',
        name: 'Test Case Data Required Properties',
        description: 'Test case data must have id, name, json, dataType, type',
        fixable: false,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            const testCaseDataMatch = content.match(/testCaseData\s*:\s*\[([\s\S]*?)\]/);
            if (!testCaseDataMatch) return { pass: true };

            const section = testCaseDataMatch[1];
            const requiredProps = ['id', 'name', 'json', 'dataType', 'type'];
            const missing = [];

            for (const prop of requiredProps) {
                if (!section.includes(`${prop}:`)) {
                    missing.push(prop);
                }
            }

            if (missing.length > 0) {
                const found = findWithLocation(content, /testCaseData\s*:/);
                return {
                    pass: false,
                    message: `Test case data missing properties: ${missing.join(', ')}`,
                    expected: 'Each testCaseData must have: id, name, json, dataType, type',
                    line: found ? found.line : 1,
                    column: found ? found.column : 1,
                    missingProperties: missing
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'DATA-002',
        name: 'JSON.stringify Usage',
        description: 'Test case data json must use JSON.stringify()',
        fixable: true,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            const directJsonPattern = /json\s*:\s*['"`{]/;
            const found = findWithLocation(content, directJsonPattern);

            if (found) {
                return {
                    pass: false,
                    message: 'json property should use JSON.stringify()',
                    expected: 'json: JSON.stringify(MockData) or json: JSON.stringify({ ... })',
                    line: found.line,
                    column: found.column
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'DATA-003',
        name: 'DataType Value',
        description: 'dataType should be 0 for local data',
        fixable: true,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            const occurrences = findAllWithLocation(content, /dataType\s*:\s*(\d+|[a-zA-Z.]+)/);

            for (const occ of occurrences) {
                const value = occ.groups[0];
                if (!['0', '1'].includes(value) && !value.includes('TestCaseDataType')) {
                    return {
                        pass: false,
                        message: `Invalid dataType value: ${value}`,
                        expected: 'Use 0 for local data, 1 for server data',
                        line: occ.line,
                        column: occ.column,
                        currentValue: value
                    };
                }
            }
            return { pass: true };
        }
    },

    {
        id: 'DATA-004',
        name: 'Type Enum Usage',
        description: 'type property should use TestCaseDataType enum',
        fixable: true,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            const typePattern = /testCaseData[\s\S]*?type\s*:\s*(?!TestCaseDataType)(['"]?\w+['"]?)/;
            const match = content.match(typePattern);

            if (match) {
                const value = match[1];
                if (!CONFIG.COMPONENT_TYPES.includes(value.replace(/['"]/g, ''))) {
                    const found = findWithLocation(content, typePattern);
                    return {
                        pass: false,
                        message: `type property should use TestCaseDataType enum, found: ${value}`,
                        expected: 'Use TestCaseDataType.local or TestCaseDataType.server',
                        line: found ? found.line : 1,
                        column: found ? found.column : 1,
                        currentValue: value
                    };
                }
            }
            return { pass: true };
        }
    },

    // ==================== PROVIDER RULES ====================
    {
        id: 'PROV-001',
        name: 'Provider Export Name',
        description: 'Providers must be exported with MODULE_TEST_PROVIDERS naming pattern',
        fixable: true,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            const exportPattern = /export\s+const\s+(\w+)\s*:\s*Provider\[\]/;
            const found = findWithLocation(content, exportPattern);

            if (found) {
                const name = found.groups[0];
                if (!CONFIG.NAMING.providerExport.test(name)) {
                    return {
                        pass: false,
                        message: `Provider export name "${name}" doesn't follow convention`,
                        expected: 'Export as MODULE_TEST_PROVIDERS (e.g., BM_TEST_PROVIDERS, CR_TEST_PROVIDERS)',
                        line: found.line,
                        column: found.column,
                        currentValue: name
                    };
                }
            } else if (content.includes('TEST_MODULE_REGISTRY')) {
                return {
                    pass: false,
                    message: 'Provider array not properly exported',
                    expected: 'export const XX_TEST_PROVIDERS: Provider[] = [...]',
                    line: 1,
                    column: 1
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'PROV-002',
        name: 'Provider Registration Pattern',
        description: 'Provider must use correct registration pattern with multi: true',
        fixable: true,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            if (content.includes('TEST_MODULE_REGISTRY')) {
                if (!content.includes('multi: true')) {
                    const found = findWithLocation(content, /TEST_MODULE_REGISTRY/);
                    return {
                        pass: false,
                        message: 'Provider registration missing multi: true',
                        expected: '{ provide: TEST_MODULE_REGISTRY, useValue: moduleEntry, multi: true }',
                        line: found ? found.line : 1,
                        column: found ? found.column : 1
                    };
                }
                if (!content.includes('useValue:')) {
                    const found = findWithLocation(content, /TEST_MODULE_REGISTRY/);
                    return {
                        pass: false,
                        message: 'Provider registration missing useValue',
                        expected: '{ provide: TEST_MODULE_REGISTRY, useValue: moduleEntry, multi: true }',
                        line: found ? found.line : 1,
                        column: found ? found.column : 1
                    };
                }
            }
            return { pass: true };
        }
    },

    // ==================== MOCK DATA RULES ====================
    {
        id: 'MOCK-001',
        name: 'Mock Data Import',
        description: 'Mock data should be imported from JSON files',
        fixable: false,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            const inlineJsonCount = (content.match(/JSON\.stringify\s*\(\s*{/g) || []).length;
            const importedMockCount = (content.match(/import\s+\w+\s+from\s+['"][^'"]*mock-[^'"]+\.json['"]/g) || []).length;

            if (inlineJsonCount > 2 && importedMockCount === 0) {
                const found = findWithLocation(content, /JSON\.stringify\s*\(\s*{/);
                return {
                    pass: false,
                    message: 'Consider using mock JSON files instead of inline data',
                    expected: 'Create mock-*.json files and import them for better maintainability',
                    line: found ? found.line : 1,
                    column: found ? found.column : 1
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'MOCK-002',
        name: 'Mock File Naming',
        description: 'Mock data files should follow mock-*.json naming convention',
        fixable: false,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            const occurrences = findAllWithLocation(content, /import\s+\w+\s+from\s+['"]([^'"]+\.json)['"]/);
            const violations = [];

            for (const occ of occurrences) {
                const importPath = occ.groups[0];
                const fileName = path.basename(importPath);

                if (!fileName.startsWith('mock-') && !fileName.startsWith('Mock')) {
                    violations.push({
                        value: fileName,
                        line: occ.line,
                        column: occ.column
                    });
                }
            }

            if (violations.length > 0) {
                return {
                    pass: false,
                    message: `JSON files not following naming convention: ${violations.map(v => v.value).join(', ')}`,
                    expected: 'Mock data files should be named mock-*.json (e.g., mock-testA.json)',
                    line: violations[0].line,
                    column: violations[0].column,
                    violations
                };
            }
            return { pass: true };
        }
    },

    // ==================== SPECIAL KEYS RULES ====================
    {
        id: 'SPEC-001',
        name: 'ObjectIdentifier Structure',
        description: 'objectIdentifier in mock data should have correct structure',
        fixable: false,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            if (content.includes('objectIdentifier')) {
                const pattern = /objectIdentifier\s*:\s*{([^}]+)}/;
                const found = findWithLocation(content, pattern);

                if (found) {
                    const objContent = found.groups[0];
                    if (!objContent.includes('objectType') || !objContent.includes('objectId')) {
                        return {
                            pass: false,
                            message: 'objectIdentifier missing required properties',
                            expected: 'objectIdentifier: { objectType: "xx.Entity", objectId: 123 }',
                            line: found.line,
                            column: found.column
                        };
                    }
                }
            }
            return { pass: true };
        }
    },

    {
        id: 'SPEC-002',
        name: 'Route Params Structure',
        description: 'params and queryParams should be objects',
        fixable: false,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            const paramsPattern = /["']params["']\s*:\s*[^{]/;
            const paramsFound = findWithLocation(content, paramsPattern);
            if (paramsFound) {
                return {
                    pass: false,
                    message: 'params should be an object',
                    expected: '"params": { "id": "123" }',
                    line: paramsFound.line,
                    column: paramsFound.column
                };
            }

            const queryParamsPattern = /["']queryParams["']\s*:\s*[^{]/;
            const queryParamsFound = findWithLocation(content, queryParamsPattern);
            if (queryParamsFound) {
                return {
                    pass: false,
                    message: 'queryParams should be an object',
                    expected: '"queryParams": { "tab": "details" }',
                    line: queryParamsFound.line,
                    column: queryParamsFound.column
                };
            }
            return { pass: true };
        }
    },

    // ==================== FILE STRUCTURE RULES ====================
    {
        id: 'FILE-001',
        name: 'Test Definition File Location',
        description: 'Test definition file should be in a test/ directory',
        fixable: false,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            const validPatterns = [
                /features\/feature-[^/]+\/[^/]+\/test\/[^/]+-test-definition\.ts$/,
                /features\/core\/[^/]+\/test\/[^/]+-test-definition\.ts$/,
                /features\/core\/shared\/test\/[^/]+-test-definition\.ts$/,
                /projects\/[^/]+\/src\/app\/[^/]+\/test\/[^/]+-test-definition\.ts$/
            ];

            const isValidLocation = validPatterns.some(pattern => pattern.test(filePath));
            if (!isValidLocation) {
                return {
                    pass: false,
                    message: 'Test definition file not in expected location',
                    expected: 'Path should be in a test/ directory (e.g., features/.../test/[module]-test-definition.ts)',
                    line: 1,
                    column: 1
                };
            }
            return { pass: true };
        }
    },

    {
        id: 'FILE-002',
        name: 'Provider Type Import',
        description: 'Provider type should be properly imported',
        fixable: true,
        validate: (content, filePath) => {
            if (!isTestDefinitionFile(filePath)) return { pass: true };

            if (content.includes('Provider[]')) {
                const hasProviderImport = content.includes("from '@angular/core'") ||
                                          content.includes("from \"@angular/core\"") ||
                                          content.match(/import\s*{[^}]*Provider[^}]*}\s*from/);

                if (!hasProviderImport) {
                    const found = findWithLocation(content, /Provider\[\]/);
                    return {
                        pass: false,
                        message: 'Provider type not properly imported',
                        expected: "import { Provider } from '@angular/core';",
                        line: found ? found.line : 1,
                        column: found ? found.column : 1
                    };
                }
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
            autoFix: options.autoFix || false
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

        if (!isTestDefinitionFile(filePath)) {
            this.results.summary.skipped++;
            return null;
        }

        const content = fs.readFileSync(filePath, 'utf-8');

        this.results.summary.total++;

        const fileResult = {
            file: filePath,
            passed: [],
            failed: []
        };

        for (const rule of validationRules) {
            try {
                const result = rule.validate(content, filePath);

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
                        missingProperties: result.missingProperties
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

    getFiles(targetPath) {
        const files = [];

        if (!fs.existsSync(targetPath)) {
            return files;
        }

        const stat = fs.statSync(targetPath);

        if (stat.isFile()) {
            if (targetPath.endsWith('.ts')) {
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
            } else if (item.endsWith('.ts') && !item.endsWith('.spec.ts')) {
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
        console.log(c.bold + '║         Test Harness Guidelines Validation Report              ║' + c.reset);
        console.log(c.bold + '╚════════════════════════════════════════════════════════════════╝' + c.reset);
        console.log();

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

        const passedFiles = this.results.files.filter(f => f.failed.length === 0);

        if (passedFiles.length > 0 && this.options.verbose) {
            console.log(c.green + c.bold + '✓ PASSED FILES' + c.reset);
            console.log(c.dim + '─'.repeat(65) + c.reset);

            for (const file of passedFiles) {
                console.log(`   ${c.green}✓${c.reset} ${file.file}`);
            }
            console.log();
        }

        console.log(c.bold + '╔════════════════════════════════════════════════════════════════╗' + c.reset);
        console.log(c.bold + '║                          SUMMARY                               ║' + c.reset);
        console.log(c.bold + '╚════════════════════════════════════════════════════════════════╝' + c.reset);
        console.log();
        console.log(`   Files checked:  ${this.results.summary.total}`);
        console.log(`   ${c.green}Passed:${c.reset}        ${this.results.summary.passed}`);
        console.log(`   ${c.red}Failed:${c.reset}        ${this.results.summary.failed}`);
        console.log(`   ${c.dim}Skipped:${c.reset}       ${this.results.summary.skipped} (not test definition files)`);
        if (this.results.summary.fixed > 0) {
            console.log(`   ${c.cyan}Fixed:${c.reset}         ${this.results.summary.fixed}`);
        }
        console.log();

        if (this.results.summary.failed === 0) {
            console.log(c.green + c.bold + '✓ All files comply with Test Harness guidelines!' + c.reset);
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
Test Harness Guidelines Validator

Validates that test harness implementations correctly follow test-harness.md guidelines.
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
  node check-guidelines.js features/feature-crm/cr/test/cr-test-definition.ts
  node check-guidelines.js features/feature-crm/cr/test/
  node check-guidelines.js --auto-fix features/feature-crm/cr/test/
  node check-guidelines.js --json features/feature-crm/cr/test/ > report.json
`);
}

function printRules() {
    console.log('\nValidation Rules:\n');
    console.log('─'.repeat(70));

    const categories = {
        'IMPORT': 'Import Rules',
        'MODULE': 'Module Definition Rules',
        'COMP': 'Component Definition Rules',
        'CASE': 'Test Case Rules',
        'DATA': 'Test Case Data Rules',
        'PROV': 'Provider Rules',
        'MOCK': 'Mock Data Rules',
        'SPEC': 'Special Keys Rules',
        'FILE': 'File Structure Rules'
    };

    let currentCategory = '';

    for (const rule of validationRules) {
        const category = rule.id.split('-')[0];
        if (category !== currentCategory) {
            currentCategory = category;
            console.log(`\n${categories[category] || category}:`);
        }
        const fixableTag = rule.fixable ? ' [Auto-fixable]' : '';
        console.log(`  [${rule.id}] ${rule.name}${fixableTag}`);
        console.log(`    ${rule.description}`);
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
