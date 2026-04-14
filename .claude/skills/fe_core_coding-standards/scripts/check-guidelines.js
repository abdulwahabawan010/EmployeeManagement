#!/usr/bin/env node

/**
 * Coding Standards Guidelines Validator
 *
 * Validates files against all coding standards rules defined in guidelines/*.md
 * Reports violations with exact line:column location.
 * NEVER modifies files - use fix-guidelines.js for auto-fixing.
 *
 * Usage:
 *   node check-guidelines.js <file-or-directory>
 *   node check-guidelines.js --auto-fix <file-or-directory>
 *   node check-guidelines.js --json <file-or-directory>
 *   node check-guidelines.js --list-rules
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    INDENT_SIZE: 4,
    MAX_LINE_LENGTH: 120,
    QUOTE_STYLE: 'single',

    FILE_PATTERNS: {
        typescript: /\.ts$/,
        spec: /\.spec\.ts$/,
        enum: /\.enum\.ts$/,
        component: /\.component\.ts$/,
        service: /\.service\.ts$/,
        dto: /-dto\.ts$/,
        interface: /\.interface\.ts$/,
    },

    DIRECTORY_PATTERNS: {
        protectedComponents: /protected-components/,
        publicComponents: /public-components/,
        model: /\/model\//,
        dto: /\/model\/dto\//,
        enum: /\/model\/enum\//,
        service: /\/service\//,
        component: /\/component\//,
        test: /\/test\//,
        featureModule: /features\/feature-[^/]+/,
        coreModule: /features\/core/,
    },

    NAMING: {
        kebabCase: /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/,
        pascalCase: /^[A-Z][a-zA-Z0-9]*$/,
        camelCase: /^[a-z][a-zA-Z0-9]*$/,
        screamingSnakeCase: /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/,
    },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getLineColumn(content, index) {
    const lines = content.substring(0, index).split('\n');
    return {
        line: lines.length,
        column: lines[lines.length - 1].length + 1,
    };
}

function findWithLocation(content, pattern) {
    const regex = new RegExp(pattern);
    const match = content.match(regex);
    if (!match) return null;

    const index = content.indexOf(match[0]);
    return {
        match: match[0],
        groups: match.slice(1),
        index,
        ...getLineColumn(content, index),
    };
}

function findAllWithLocation(content, pattern) {
    const results = [];
    const regex = new RegExp(pattern, 'g');
    let match;

    while ((match = regex.exec(content)) !== null) {
        results.push({
            match: match[0],
            groups: match.slice(1),
            index: match.index,
            ...getLineColumn(content, match.index),
        });
    }

    return results;
}

function countOccurrences(content, pattern) {
    const matches = content.match(new RegExp(pattern, 'g'));
    return matches ? matches.length : 0;
}

function getImports(content) {
    const imports = [];
    const pattern = /import\s*(?:{([^}]+)}|(\w+))\s*from\s*['"]([^'"]+)['"]/g;
    let match;

    while ((match = pattern.exec(content)) !== null) {
        imports.push({
            namedImports: match[1] ? match[1].split(',').map(s => s.trim()) : [],
            defaultImport: match[2] || null,
            path: match[3],
            ...getLineColumn(content, match.index),
        });
    }

    return imports;
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

const validationRules = [
    // ==================== STRUCTURE RULES ====================
    {
        id: 'STRUCT-001',
        name: 'One Enum Per File',
        description: 'Each enum must be in its own dedicated file',
        category: 'structure',
        fixable: true,
        validate: (content, filePath) => {
            const enumCount = countOccurrences(content, /\bexport\s+enum\s+\w+/g);
            if (enumCount > 1) {
                const found = findWithLocation(content, /\bexport\s+enum\s+\w+/);
                return {
                    pass: false,
                    message: `File contains ${enumCount} enums (maximum 1 allowed)`,
                    line: found ? found.line : 1,
                    column: found ? found.column : 1,
                };
            }
            return { pass: true };
        },
    },

    {
        id: 'STRUCT-002',
        name: 'One Interface Per File',
        description: 'Each interface must be in its own dedicated file',
        category: 'structure',
        fixable: true,
        validate: (content, filePath) => {
            const interfaceCount = countOccurrences(content, /\bexport\s+interface\s+\w+/g);
            if (interfaceCount > 1) {
                const found = findWithLocation(content, /\bexport\s+interface\s+\w+/);
                return {
                    pass: false,
                    message: `File contains ${interfaceCount} interfaces (maximum 1 allowed)`,
                    line: found ? found.line : 1,
                    column: found ? found.column : 1,
                };
            }
            return { pass: true };
        },
    },

    {
        id: 'STRUCT-008',
        name: 'File Naming Matches Content',
        description: 'File name must match the primary export name',
        category: 'structure',
        fixable: false,
        validate: (content, filePath) => {
            const fileName = path.basename(filePath, '.ts');

            // Check for class export
            const classMatch = content.match(/export\s+class\s+(\w+)/);
            if (classMatch) {
                const className = classMatch[1];
                const expectedFileName = className
                    .replace(/([a-z])([A-Z])/g, '$1-$2')
                    .toLowerCase();

                // Allow some flexibility in naming
                const normalizedFileName = fileName.replace(/\.(component|service|enum|pipe|directive|guard|resolver|dto|interface)$/, '');
                const normalizedExpected = expectedFileName.replace(/-(component|service|enum|pipe|directive|guard|resolver|dto|interface)$/, '');

                if (normalizedFileName !== normalizedExpected && !fileName.includes(normalizedExpected)) {
                    return {
                        pass: false,
                        message: `File name "${fileName}" does not match class "${className}"`,
                        line: 1,
                        column: 1,
                    };
                }
            }

            return { pass: true };
        },
    },

    // ==================== NAMING RULES ====================
    {
        id: 'NAME-001',
        name: 'File Naming Convention',
        description: 'Files must use kebab-case with appropriate suffix',
        category: 'naming',
        fixable: false,
        validate: (content, filePath) => {
            const fileName = path.basename(filePath);
            const nameWithoutExt = fileName.replace(/\.ts$/, '');

            // Check for invalid characters
            if (/[A-Z]/.test(nameWithoutExt.split('.')[0])) {
                return {
                    pass: false,
                    message: `File name "${fileName}" contains uppercase letters`,
                    line: 1,
                    column: 1,
                };
            }

            if (/_/.test(nameWithoutExt)) {
                return {
                    pass: false,
                    message: `File name "${fileName}" contains underscores (use kebab-case)`,
                    line: 1,
                    column: 1,
                };
            }

            return { pass: true };
        },
    },

    {
        id: 'NAME-002',
        name: 'Component Class Naming',
        description: 'Component classes must use PascalCase and end with Component',
        category: 'naming',
        fixable: false,
        validate: (content, filePath) => {
            if (!CONFIG.FILE_PATTERNS.component.test(filePath)) return { pass: true };

            const match = findWithLocation(content, /export\s+class\s+(\w+)/);
            if (match) {
                const className = match.groups[0];
                if (!className.endsWith('Component')) {
                    return {
                        pass: false,
                        message: `Component class "${className}" must end with "Component"`,
                        line: match.line,
                        column: match.column,
                    };
                }
                if (!CONFIG.NAMING.pascalCase.test(className)) {
                    return {
                        pass: false,
                        message: `Component class "${className}" must use PascalCase`,
                        line: match.line,
                        column: match.column,
                    };
                }
            }

            return { pass: true };
        },
    },

    {
        id: 'NAME-003',
        name: 'Service Class Naming',
        description: 'Service classes must use PascalCase and end with Service',
        category: 'naming',
        fixable: false,
        validate: (content, filePath) => {
            if (!CONFIG.FILE_PATTERNS.service.test(filePath)) return { pass: true };

            const match = findWithLocation(content, /export\s+class\s+(\w+)/);
            if (match) {
                const className = match.groups[0];
                if (!className.endsWith('Service')) {
                    return {
                        pass: false,
                        message: `Service class "${className}" must end with "Service"`,
                        line: match.line,
                        column: match.column,
                    };
                }
            }

            return { pass: true };
        },
    },

    {
        id: 'NAME-004',
        name: 'Enum Naming',
        description: 'Enums must use PascalCase and end with Enum',
        category: 'naming',
        fixable: false,
        validate: (content, filePath) => {
            const matches = findAllWithLocation(content, /export\s+enum\s+(\w+)/);

            for (const match of matches) {
                const enumName = match.groups[0];
                if (!enumName.endsWith('Enum')) {
                    return {
                        pass: false,
                        message: `Enum "${enumName}" must end with "Enum"`,
                        line: match.line,
                        column: match.column,
                    };
                }
            }

            return { pass: true };
        },
    },

    {
        id: 'NAME-005',
        name: 'Interface Naming',
        description: 'Interfaces must use PascalCase without I prefix',
        category: 'naming',
        fixable: false,
        validate: (content, filePath) => {
            const matches = findAllWithLocation(content, /export\s+interface\s+(\w+)/);

            for (const match of matches) {
                const interfaceName = match.groups[0];
                if (interfaceName.startsWith('I') && /^I[A-Z]/.test(interfaceName)) {
                    return {
                        pass: false,
                        message: `Interface "${interfaceName}" must not use "I" prefix`,
                        line: match.line,
                        column: match.column,
                    };
                }
            }

            return { pass: true };
        },
    },

    {
        id: 'NAME-011',
        name: 'Observable Naming',
        description: 'Observable variables must end with $ suffix',
        category: 'naming',
        fixable: true,
        validate: (content, filePath) => {
            const pattern = /(\w+)\s*:\s*(?:Observable|BehaviorSubject|Subject|ReplaySubject)<[^>]+>/g;
            const matches = findAllWithLocation(content, pattern);

            for (const match of matches) {
                const varName = match.groups[0];
                if (!varName.endsWith('$')) {
                    return {
                        pass: false,
                        message: `Observable variable "${varName}" must end with "$" suffix`,
                        line: match.line,
                        column: match.column,
                        currentValue: varName,
                    };
                }
            }

            return { pass: true };
        },
    },

    // ==================== STYLE RULES ====================
    {
        id: 'STYLE-001',
        name: 'Indentation',
        description: 'Use 4 spaces for indentation',
        category: 'style',
        fixable: true,
        validate: (content, filePath) => {
            const lines = content.split('\n');

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                // Check for tabs
                if (/^\t/.test(line)) {
                    return {
                        pass: false,
                        message: 'Tab character found (use 4 spaces)',
                        line: i + 1,
                        column: 1,
                    };
                }

                // Check for non-4-space indentation
                const leadingSpaces = line.match(/^( +)/);
                if (leadingSpaces && leadingSpaces[1].length % 4 !== 0) {
                    return {
                        pass: false,
                        message: `Indentation is ${leadingSpaces[1].length} spaces (must be multiple of 4)`,
                        line: i + 1,
                        column: 1,
                    };
                }
            }

            return { pass: true };
        },
    },

    {
        id: 'STYLE-002',
        name: 'Quote Style',
        description: 'Use single quotes for strings',
        category: 'style',
        fixable: true,
        validate: (content, filePath) => {
            // Find double-quoted strings that are not in template literals
            const doubleQuotes = findAllWithLocation(content, /"([^"\\]|\\.)*"/);

            for (const match of doubleQuotes) {
                // Skip if it's inside a template literal or contains single quote
                if (match.match.includes("'")) continue;

                // Skip decorators and imports (Angular uses double quotes in decorators sometimes)
                const lineStart = content.lastIndexOf('\n', match.index) + 1;
                const lineContent = content.substring(lineStart, match.index);
                if (/@/.test(lineContent) || /import/.test(lineContent)) continue;

                return {
                    pass: false,
                    message: 'Use single quotes instead of double quotes',
                    line: match.line,
                    column: match.column,
                };
            }

            return { pass: true };
        },
    },

    {
        id: 'STYLE-004',
        name: 'Maximum Line Length',
        description: 'Maximum line length is 120 characters',
        category: 'style',
        fixable: false,
        validate: (content, filePath) => {
            const lines = content.split('\n');

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].length > CONFIG.MAX_LINE_LENGTH) {
                    return {
                        pass: false,
                        message: `Line exceeds ${CONFIG.MAX_LINE_LENGTH} characters (${lines[i].length})`,
                        line: i + 1,
                        column: CONFIG.MAX_LINE_LENGTH + 1,
                    };
                }
            }

            return { pass: true };
        },
    },

    {
        id: 'STYLE-007',
        name: 'Semicolons',
        description: 'Always use semicolons at end of statements',
        category: 'style',
        fixable: true,
        validate: (content, filePath) => {
            const lines = content.split('\n');

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                // Skip empty lines, comments, block openers/closers
                if (!line || line.startsWith('//') || line.startsWith('/*') ||
                    line.startsWith('*') || /^[{})\]]$/.test(line) ||
                    line.endsWith('{') || line.endsWith(',') ||
                    line.startsWith('@') || line.startsWith('import') ||
                    line.startsWith('export')) continue;

                // Check for statements that should end with semicolon
                if (/^(const|let|var|return|throw)\s/.test(line) && !line.endsWith(';') && !line.endsWith('{')) {
                    return {
                        pass: false,
                        message: 'Missing semicolon at end of statement',
                        line: i + 1,
                        column: line.length + 1,
                    };
                }
            }

            return { pass: true };
        },
    },

    {
        id: 'STYLE-009',
        name: 'No Multiple Empty Lines',
        description: 'Maximum one consecutive empty line',
        category: 'style',
        fixable: true,
        validate: (content, filePath) => {
            const found = findWithLocation(content, /\n\n\n/);
            if (found) {
                return {
                    pass: false,
                    message: 'Multiple consecutive empty lines found',
                    line: found.line,
                    column: 1,
                };
            }
            return { pass: true };
        },
    },

    {
        id: 'STYLE-010',
        name: 'No Trailing Whitespace',
        description: 'No trailing whitespace at end of lines',
        category: 'style',
        fixable: true,
        validate: (content, filePath) => {
            const lines = content.split('\n');

            for (let i = 0; i < lines.length; i++) {
                if (/\s+$/.test(lines[i])) {
                    return {
                        pass: false,
                        message: 'Trailing whitespace found',
                        line: i + 1,
                        column: lines[i].trimEnd().length + 1,
                    };
                }
            }

            return { pass: true };
        },
    },

    {
        id: 'STYLE-011',
        name: 'File Ends with Newline',
        description: 'Files must end with a single newline character',
        category: 'style',
        fixable: true,
        validate: (content, filePath) => {
            if (!content.endsWith('\n')) {
                const lines = content.split('\n');
                return {
                    pass: false,
                    message: 'File does not end with newline',
                    line: lines.length,
                    column: lines[lines.length - 1].length + 1,
                };
            }
            if (content.endsWith('\n\n')) {
                const lines = content.split('\n');
                return {
                    pass: false,
                    message: 'File ends with multiple newlines',
                    line: lines.length - 1,
                    column: 1,
                };
            }
            return { pass: true };
        },
    },

    // ==================== DTO RULES ====================
    {
        id: 'DTO-001',
        name: 'DTO Files in dto Directory',
        description: 'All DTO classes must be located in model/dto/ directory',
        category: 'dto',
        fixable: false,
        validate: (content, filePath) => {
            if (!CONFIG.FILE_PATTERNS.dto.test(filePath)) return { pass: true };

            if (!CONFIG.DIRECTORY_PATTERNS.dto.test(filePath)) {
                return {
                    pass: false,
                    message: 'DTO file must be in model/dto/ directory',
                    line: 1,
                    column: 1,
                };
            }
            return { pass: true };
        },
    },

    {
        id: 'DTO-002',
        name: 'Enums in enum Directory',
        description: 'All enum types must be located in model/enum/ directory',
        category: 'dto',
        fixable: false,
        validate: (content, filePath) => {
            if (!CONFIG.FILE_PATTERNS.enum.test(filePath)) return { pass: true };

            if (!CONFIG.DIRECTORY_PATTERNS.enum.test(filePath)) {
                return {
                    pass: false,
                    message: 'Enum file must be in model/enum/ directory',
                    line: 1,
                    column: 1,
                };
            }
            return { pass: true };
        },
    },

    // ==================== BOUNDARY RULES ====================
    {
        id: 'BOUND-001',
        name: 'Protected Components Never Exported',
        description: 'Components in protected-components/ must never be imported outside their module',
        category: 'boundaries',
        fixable: false,
        validate: (content, filePath) => {
            const imports = getImports(content);

            for (const imp of imports) {
                if (CONFIG.DIRECTORY_PATTERNS.protectedComponents.test(imp.path)) {
                    // Check if import is from outside the module
                    const importModuleMatch = imp.path.match(/features\/feature-([^/]+)/);
                    const currentModuleMatch = filePath.match(/features\/feature-([^/]+)/);

                    if (importModuleMatch && currentModuleMatch &&
                        importModuleMatch[1] !== currentModuleMatch[1]) {
                        return {
                            pass: false,
                            message: `Cannot import from protected-components of another module: ${imp.path}`,
                            line: imp.line,
                            column: imp.column,
                        };
                    }
                }
            }

            return { pass: true };
        },
    },

    {
        id: 'BOUND-005',
        name: 'No Importing from node_modules Internals',
        description: 'Import from package root, not internal paths',
        category: 'boundaries',
        fixable: true,
        validate: (content, filePath) => {
            const imports = getImports(content);

            for (const imp of imports) {
                if (imp.path.includes('/internal/') || imp.path.includes('/src/')) {
                    return {
                        pass: false,
                        message: `Import from package internal path: ${imp.path}`,
                        line: imp.line,
                        column: imp.column,
                    };
                }
            }

            return { pass: true };
        },
    },

    {
        id: 'BOUND-008',
        name: 'No Relative Imports Across Module Boundaries',
        description: 'Use absolute paths when importing across module boundaries',
        category: 'boundaries',
        fixable: true,
        validate: (content, filePath) => {
            const imports = getImports(content);
            const currentModule = filePath.match(/features\/(feature-[^/]+|core)/);

            if (!currentModule) return { pass: true };

            for (const imp of imports) {
                if (imp.path.startsWith('.')) {
                    // Count parent directory traversals
                    const parentCount = (imp.path.match(/\.\.\//g) || []).length;

                    // If going up more than 3 levels, likely crossing module boundary
                    if (parentCount > 3) {
                        return {
                            pass: false,
                            message: `Deep relative import may cross module boundary: ${imp.path}`,
                            line: imp.line,
                            column: imp.column,
                        };
                    }
                }
            }

            return { pass: true };
        },
    },

    {
        id: 'BOUND-011',
        name: 'Production Code Cannot Import from Spec Files',
        description: 'Production code must not import from .spec.ts files',
        category: 'boundaries',
        fixable: false,
        validate: (content, filePath) => {
            if (CONFIG.FILE_PATTERNS.spec.test(filePath)) return { pass: true };

            const imports = getImports(content);

            for (const imp of imports) {
                if (imp.path.includes('.spec')) {
                    return {
                        pass: false,
                        message: `Production code imports from spec file: ${imp.path}`,
                        line: imp.line,
                        column: imp.column,
                    };
                }
            }

            return { pass: true };
        },
    },

    // ==================== TEST RULES ====================
    {
        id: 'TEST-001',
        name: 'Test File Co-location',
        description: 'Test files must be co-located with the file they test',
        category: 'testing',
        fixable: false,
        validate: (content, filePath) => {
            if (!CONFIG.FILE_PATTERNS.spec.test(filePath)) return { pass: true };

            const sourceFile = filePath.replace('.spec.ts', '.ts');
            const sourceFileExists = fs.existsSync(sourceFile);

            if (!sourceFileExists) {
                return {
                    pass: false,
                    message: `Test file not co-located with source file`,
                    line: 1,
                    column: 1,
                };
            }

            return { pass: true };
        },
    },

    {
        id: 'TEST-002',
        name: 'Test File Naming',
        description: 'Test files must use .spec.ts suffix',
        category: 'testing',
        fixable: false,
        validate: (content, filePath) => {
            const fileName = path.basename(filePath);

            // Check for .test.ts files (should be .spec.ts)
            if (fileName.endsWith('.test.ts')) {
                return {
                    pass: false,
                    message: 'Test file uses .test.ts suffix (should be .spec.ts)',
                    line: 1,
                    column: 1,
                };
            }

            return { pass: true };
        },
    },

    {
        id: 'TEST-005',
        name: 'Test Case Naming',
        description: 'Test case names must start with "should"',
        category: 'testing',
        fixable: false,
        validate: (content, filePath) => {
            if (!CONFIG.FILE_PATTERNS.spec.test(filePath)) return { pass: true };

            const itMatches = findAllWithLocation(content, /it\s*\(\s*['"]([^'"]+)['"]/);

            for (const match of itMatches) {
                const testName = match.groups[0];
                if (!testName.startsWith('should')) {
                    return {
                        pass: false,
                        message: `Test case "${testName}" must start with "should"`,
                        line: match.line,
                        column: match.column,
                    };
                }
            }

            return { pass: true };
        },
    },

    // ==================== ARCHITECTURE RULES ====================
    {
        id: 'ARCH-002',
        name: 'Core Module Independence',
        description: 'Core module must not import from feature modules',
        category: 'architecture',
        fixable: false,
        validate: (content, filePath) => {
            if (!CONFIG.DIRECTORY_PATTERNS.coreModule.test(filePath)) return { pass: true };

            const imports = getImports(content);

            for (const imp of imports) {
                if (CONFIG.DIRECTORY_PATTERNS.featureModule.test(imp.path)) {
                    return {
                        pass: false,
                        message: `Core module imports from feature module: ${imp.path}`,
                        line: imp.line,
                        column: imp.column,
                    };
                }
            }

            return { pass: true };
        },
    },

    {
        id: 'ARCH-004',
        name: 'Layer Separation',
        description: 'Components must not directly access HttpClient',
        category: 'architecture',
        fixable: false,
        validate: (content, filePath) => {
            if (!CONFIG.FILE_PATTERNS.component.test(filePath)) return { pass: true };

            const httpClientMatch = findWithLocation(content, /HttpClient/);
            if (httpClientMatch) {
                return {
                    pass: false,
                    message: 'Component directly uses HttpClient (use service layer)',
                    line: httpClientMatch.line,
                    column: httpClientMatch.column,
                };
            }

            return { pass: true };
        },
    },

    // ==================== TEMPLATE RULES ====================
    {
        id: 'TMPL-009',
        name: 'Selector Naming Convention',
        description: 'Component selectors must follow module prefix pattern',
        category: 'templates',
        fixable: false,
        validate: (content, filePath) => {
            if (!CONFIG.FILE_PATTERNS.component.test(filePath)) return { pass: true };

            const selectorMatch = findWithLocation(content, /selector:\s*['"]([^'"]+)['"]/);
            if (selectorMatch) {
                const selector = selectorMatch.groups[0];

                // Check for missing prefix (should be xx-component-name)
                if (!/^[a-z]{2,4}-[a-z][a-z0-9-]+$/.test(selector)) {
                    return {
                        pass: false,
                        message: `Selector "${selector}" must use module prefix pattern (e.g., cr-component-name, mvs-component-name)`,
                        line: selectorMatch.line,
                        column: selectorMatch.column,
                    };
                }

                // Check for 'app-' prefix (should not be used)
                if (selector.startsWith('app-')) {
                    return {
                        pass: false,
                        message: `Selector "${selector}" should not use 'app-' prefix, use module prefix instead`,
                        line: selectorMatch.line,
                        column: selectorMatch.column,
                    };
                }
            }

            return { pass: true };
        },
    },

    {
        id: 'TMPL-010',
        name: 'Standalone Flag',
        description: 'All components must explicitly set standalone: false',
        category: 'templates',
        fixable: true,
        validate: (content, filePath) => {
            if (!CONFIG.FILE_PATTERNS.component.test(filePath)) return { pass: true };

            const componentMatch = findWithLocation(content, /@Component\s*\(\s*\{/);
            if (componentMatch) {
                // Check if standalone: false is explicitly set
                const decoratorEndIndex = content.indexOf('})', componentMatch.index);
                const decoratorContent = content.substring(componentMatch.index, decoratorEndIndex);

                if (!decoratorContent.includes('standalone')) {
                    return {
                        pass: false,
                        message: 'Component must explicitly set standalone: false',
                        line: componentMatch.line,
                        column: componentMatch.column,
                    };
                }

                if (decoratorContent.includes('standalone: true')) {
                    return {
                        pass: false,
                        message: 'Component must set standalone: false (not true)',
                        line: componentMatch.line,
                        column: componentMatch.column,
                    };
                }
            }

            return { pass: true };
        },
    },

    {
        id: 'TMPL-011',
        name: 'Required Lifecycle Methods',
        description: 'Components must implement OnInit, OnChanges, OnDestroy interfaces',
        category: 'templates',
        fixable: false,
        validate: (content, filePath) => {
            if (!CONFIG.FILE_PATTERNS.component.test(filePath)) return { pass: true };

            const classMatch = findWithLocation(content, /export\s+class\s+\w+[^{]*\{/);
            if (classMatch) {
                const classDeclaration = classMatch.match;

                // Check for implements clause
                if (!classDeclaration.includes('implements')) {
                    return {
                        pass: false,
                        message: 'Component must implement OnInit, OnChanges, OnDestroy interfaces',
                        line: classMatch.line,
                        column: classMatch.column,
                    };
                }

                // Check for required interfaces
                const requiredInterfaces = ['OnInit', 'OnChanges', 'OnDestroy'];
                for (const iface of requiredInterfaces) {
                    if (!classDeclaration.includes(iface)) {
                        return {
                            pass: false,
                            message: `Component must implement ${iface} interface`,
                            line: classMatch.line,
                            column: classMatch.column,
                        };
                    }
                }
            }

            return { pass: true };
        },
    },

    {
        id: 'TMPL-012',
        name: 'Initialization Pattern',
        description: 'Components must call initComponent() in ngOnInit()',
        category: 'templates',
        fixable: false,
        validate: (content, filePath) => {
            if (!CONFIG.FILE_PATTERNS.component.test(filePath)) return { pass: true };

            // Check if component has ngOnInit
            const ngOnInitMatch = findWithLocation(content, /ngOnInit\s*\(\s*\)\s*[:{]/);
            if (ngOnInitMatch) {
                // Find the body of ngOnInit
                const startIndex = content.indexOf('{', ngOnInitMatch.index);
                let braceCount = 1;
                let endIndex = startIndex + 1;

                while (braceCount > 0 && endIndex < content.length) {
                    if (content[endIndex] === '{') braceCount++;
                    if (content[endIndex] === '}') braceCount--;
                    endIndex++;
                }

                const ngOnInitBody = content.substring(startIndex, endIndex);

                // Check if initComponent is called (unless it's a base class extension)
                const extendsBase = content.includes('extends ObjectBaseComponent') ||
                    content.includes('extends ObjectPageComponent') ||
                    content.includes('extends MvsDashboardPage') ||
                    content.includes('extends PageComponent');

                if (!extendsBase && !ngOnInitBody.includes('initComponent')) {
                    return {
                        pass: false,
                        message: 'ngOnInit() must call initComponent()',
                        line: ngOnInitMatch.line,
                        column: ngOnInitMatch.column,
                    };
                }
            }

            return { pass: true };
        },
    },

    {
        id: 'TMPL-003',
        name: 'Object Base Component Structure',
        description: 'Object components must extend ObjectBaseComponent and implement onObjectChanged()',
        category: 'templates',
        fixable: false,
        validate: (content, filePath) => {
            if (!CONFIG.FILE_PATTERNS.component.test(filePath)) return { pass: true };

            // Check if this is an object component (extends ObjectBaseComponent)
            if (content.includes('extends ObjectBaseComponent')) {
                // Must have onObjectChanged method
                if (!content.includes('onObjectChanged')) {
                    const classMatch = findWithLocation(content, /extends\s+ObjectBaseComponent/);
                    return {
                        pass: false,
                        message: 'Component extending ObjectBaseComponent must implement onObjectChanged()',
                        line: classMatch ? classMatch.line : 1,
                        column: classMatch ? classMatch.column : 1,
                    };
                }

                // ngOnDestroy must call super.ngOnDestroy()
                const ngOnDestroyMatch = findWithLocation(content, /ngOnDestroy\s*\(\s*\)\s*[:{]/);
                if (ngOnDestroyMatch) {
                    const startIndex = content.indexOf('{', ngOnDestroyMatch.index);
                    let braceCount = 1;
                    let endIndex = startIndex + 1;

                    while (braceCount > 0 && endIndex < content.length) {
                        if (content[endIndex] === '{') braceCount++;
                        if (content[endIndex] === '}') braceCount--;
                        endIndex++;
                    }

                    const ngOnDestroyBody = content.substring(startIndex, endIndex);

                    if (!ngOnDestroyBody.includes('super.ngOnDestroy')) {
                        return {
                            pass: false,
                            message: 'ngOnDestroy() must call super.ngOnDestroy() when extending ObjectBaseComponent',
                            line: ngOnDestroyMatch.line,
                            column: ngOnDestroyMatch.column,
                        };
                    }
                }
            }

            return { pass: true };
        },
    },

    {
        id: 'TMPL-004',
        name: 'Object Page Structure',
        description: 'Object pages must extend ObjectPageComponent and implement getObjectType()',
        category: 'templates',
        fixable: false,
        validate: (content, filePath) => {
            // Check if this is a page file
            if (!filePath.includes('.page.ts')) return { pass: true };

            // Check if extends ObjectPageComponent
            if (content.includes('extends ObjectPageComponent')) {
                // Must have getObjectType method
                if (!content.includes('getObjectType')) {
                    const classMatch = findWithLocation(content, /extends\s+ObjectPageComponent/);
                    return {
                        pass: false,
                        message: 'Page extending ObjectPageComponent must implement getObjectType()',
                        line: classMatch ? classMatch.line : 1,
                        column: classMatch ? classMatch.column : 1,
                    };
                }

                // Must have defaultLabel property
                if (!content.includes('defaultLabel')) {
                    const classMatch = findWithLocation(content, /extends\s+ObjectPageComponent/);
                    return {
                        pass: false,
                        message: 'Page extending ObjectPageComponent must define defaultLabel property',
                        line: classMatch ? classMatch.line : 1,
                        column: classMatch ? classMatch.column : 1,
                    };
                }
            }

            return { pass: true };
        },
    },

    {
        id: 'TMPL-005',
        name: 'Dashboard Page Structure',
        description: 'Dashboard pages must extend MvsDashboardPage',
        category: 'templates',
        fixable: false,
        validate: (content, filePath) => {
            // Check if this is a dashboard file
            if (!filePath.includes('dashboard') || !filePath.includes('.page.ts')) return { pass: true };

            // Should extend MvsDashboardPage
            if (!content.includes('extends MvsDashboardPage')) {
                const classMatch = findWithLocation(content, /export\s+class\s+\w+/);
                return {
                    pass: false,
                    message: 'Dashboard page must extend MvsDashboardPage',
                    line: classMatch ? classMatch.line : 1,
                    column: classMatch ? classMatch.column : 1,
                };
            }

            // Must have defaultLabel property
            if (!content.includes('defaultLabel')) {
                const classMatch = findWithLocation(content, /extends\s+MvsDashboardPage/);
                return {
                    pass: false,
                    message: 'Dashboard page must define defaultLabel property',
                    line: classMatch ? classMatch.line : 1,
                    column: classMatch ? classMatch.column : 1,
                };
            }

            // ngOnInit must call super.ngOnInit()
            const ngOnInitMatch = findWithLocation(content, /ngOnInit\s*\(\s*\)\s*[:{]/);
            if (ngOnInitMatch) {
                const startIndex = content.indexOf('{', ngOnInitMatch.index);
                let braceCount = 1;
                let endIndex = startIndex + 1;

                while (braceCount > 0 && endIndex < content.length) {
                    if (content[endIndex] === '{') braceCount++;
                    if (content[endIndex] === '}') braceCount--;
                    endIndex++;
                }

                const ngOnInitBody = content.substring(startIndex, endIndex);

                if (!ngOnInitBody.includes('super.ngOnInit')) {
                    return {
                        pass: false,
                        message: 'ngOnInit() must call super.ngOnInit() when extending MvsDashboardPage',
                        line: ngOnInitMatch.line,
                        column: ngOnInitMatch.column,
                    };
                }
            }

            return { pass: true };
        },
    },

    {
        id: 'TMPL-006',
        name: 'Overview Page Structure',
        description: 'Overview pages must extend PageComponent',
        category: 'templates',
        fixable: false,
        validate: (content, filePath) => {
            // Check if this is an overview file
            if (!filePath.includes('overview') || CONFIG.FILE_PATTERNS.spec.test(filePath)) return { pass: true };

            // Should extend PageComponent
            if (content.includes('@Component') && !content.includes('extends PageComponent')) {
                // Skip if it extends another base class
                if (content.includes('extends ObjectBaseComponent') ||
                    content.includes('extends ObjectPageComponent') ||
                    content.includes('extends MvsDashboardPage')) {
                    return { pass: true };
                }

                const classMatch = findWithLocation(content, /export\s+class\s+\w+/);
                return {
                    pass: false,
                    message: 'Overview page must extend PageComponent',
                    line: classMatch ? classMatch.line : 1,
                    column: classMatch ? classMatch.column : 1,
                };
            }

            // If extends PageComponent, check for required patterns
            if (content.includes('extends PageComponent')) {
                // Must have defaultLabel property
                if (!content.includes('defaultLabel')) {
                    const classMatch = findWithLocation(content, /extends\s+PageComponent/);
                    return {
                        pass: false,
                        message: 'Overview page must define defaultLabel property',
                        line: classMatch ? classMatch.line : 1,
                        column: classMatch ? classMatch.column : 1,
                    };
                }

                // ngOnInit must call super.ngOnInit()
                const ngOnInitMatch = findWithLocation(content, /ngOnInit\s*\(\s*\)\s*[:{]/);
                if (ngOnInitMatch) {
                    const startIndex = content.indexOf('{', ngOnInitMatch.index);
                    let braceCount = 1;
                    let endIndex = startIndex + 1;

                    while (braceCount > 0 && endIndex < content.length) {
                        if (content[endIndex] === '{') braceCount++;
                        if (content[endIndex] === '}') braceCount--;
                        endIndex++;
                    }

                    const ngOnInitBody = content.substring(startIndex, endIndex);

                    if (!ngOnInitBody.includes('super.ngOnInit')) {
                        return {
                            pass: false,
                            message: 'ngOnInit() must call super.ngOnInit() when extending PageComponent',
                            line: ngOnInitMatch.line,
                            column: ngOnInitMatch.column,
                        };
                    }
                }
            }

            return { pass: true };
        },
    },
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
            category: options.category || null,
        };
        this.results = {
            files: [],
            summary: { total: 0, passed: 0, failed: 0, skipped: 0, fixed: 0 },
        };
    }

    validateFile(filePath) {
        if (!fs.existsSync(filePath)) return null;
        if (!CONFIG.FILE_PATTERNS.typescript.test(filePath)) {
            this.results.summary.skipped++;
            return null;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        this.results.summary.total++;

        const fileResult = {
            file: filePath,
            passed: [],
            failed: [],
        };

        const rulesToRun = this.options.category
            ? validationRules.filter(r => r.category === this.options.category)
            : validationRules;

        for (const rule of rulesToRun) {
            try {
                const result = rule.validate(content, filePath);

                if (result.pass) {
                    fileResult.passed.push({ id: rule.id, name: rule.name });
                } else {
                    fileResult.failed.push({
                        id: rule.id,
                        name: rule.name,
                        description: rule.description,
                        category: rule.category,
                        message: result.message,
                        line: result.line || 1,
                        column: result.column || 1,
                        fixable: rule.fixable,
                        currentValue: result.currentValue,
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
        if (!fs.existsSync(targetPath)) return files;

        const stat = fs.statSync(targetPath);

        if (stat.isFile()) {
            if (CONFIG.FILE_PATTERNS.typescript.test(targetPath)) {
                return [targetPath];
            }
            return files;
        }

        const items = fs.readdirSync(targetPath);

        for (const item of items) {
            if (item.startsWith('.') || item === 'node_modules' || item === 'dist') continue;

            const fullPath = path.join(targetPath, item);
            const itemStat = fs.statSync(fullPath);

            if (itemStat.isDirectory()) {
                files.push(...this.getFiles(fullPath));
            } else if (CONFIG.FILE_PATTERNS.typescript.test(item)) {
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
        if (this.results.summary.failed === 0) return;

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
                cwd: __dirname,
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
            dim: '\x1b[2m',
        };

        console.log();
        console.log(c.bold + '╔════════════════════════════════════════════════════════════════╗' + c.reset);
        console.log(c.bold + '║          Coding Standards Validation Report                    ║' + c.reset);
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
        console.log(`   ${c.dim}Skipped:${c.reset}       ${this.results.summary.skipped}`);
        if (this.results.summary.fixed > 0) {
            console.log(`   ${c.cyan}Fixed:${c.reset}         ${this.results.summary.fixed}`);
        }
        console.log();

        if (this.results.summary.failed === 0) {
            console.log(c.green + c.bold + '✓ All files comply with Coding Standards!' + c.reset);
            console.log();
            return 0;
        } else {
            console.log(c.red + c.bold + `✗ ${this.results.summary.failed} file(s) have violations` + c.reset);
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
Coding Standards Guidelines Validator

Validates files against all coding standards rules.
Reports violations with exact line:column location.
NEVER modifies files - use --auto-fix to trigger fix script.

Usage:
  node check-guidelines.js [options] <path...>

Options:
  -h, --help       Show help
  -v, --verbose    Show passed files and details
  -j, --json       Output as JSON
  --auto-fix       Automatically fix violations
  --category CAT   Only check rules in category
  --list-rules     List all validation rules

Categories:
  structure, naming, style, dto, boundaries, testing, architecture, templates

Examples:
  node check-guidelines.js src/app/
  node check-guidelines.js --auto-fix features/feature-crm/
  node check-guidelines.js --category style src/app/
  node check-guidelines.js --json src/app/ > report.json
`);
}

function printRules() {
    console.log('\nValidation Rules:\n');
    console.log('─'.repeat(70));

    const categories = {};
    for (const rule of validationRules) {
        if (!categories[rule.category]) {
            categories[rule.category] = [];
        }
        categories[rule.category].push(rule);
    }

    for (const [category, rules] of Object.entries(categories)) {
        console.log(`\n${category.toUpperCase()}:`);
        for (const rule of rules) {
            const fixableTag = rule.fixable ? ' [Auto-fixable]' : '';
            console.log(`  [${rule.id}] ${rule.name}${fixableTag}`);
            console.log(`    ${rule.description}`);
        }
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

    const categoryIndex = args.indexOf('--category');
    let category = null;
    if (categoryIndex !== -1 && args[categoryIndex + 1]) {
        category = args[categoryIndex + 1];
        args.splice(categoryIndex, 2);
    }

    const options = {
        verbose: args.includes('-v') || args.includes('--verbose'),
        json: args.includes('-j') || args.includes('--json'),
        autoFix: args.includes('--auto-fix'),
        category,
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
