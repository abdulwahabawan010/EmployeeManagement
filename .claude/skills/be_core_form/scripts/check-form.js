#!/usr/bin/env node

/**
 * Form Implementation Validator
 *
 * Validates Java FormObject files against form implementation standards.
 * Reports violations with exact line:column location.
 *
 * Usage:
 *   node check-form.js <file-or-directory>
 *   node check-form.js --json <file-or-directory>
 *   node check-form.js --list-rules
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    FILE_PATTERNS: {
        java: /\.java$/,
        form: /Form\.java$/,
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

function isFormObjectFile(content) {
    return content.includes('extends FormObjectAbstract') ||
        content.includes('FormObjectAbstract<');
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

const validationRules = [
    // FORM-001: Extends FormObjectAbstract
    {
        id: 'FORM-001',
        name: 'Extends FormObjectAbstract',
        description: 'FormObject class must extend FormObjectAbstract<EntityType>',
        category: 'structure',
        fixable: false,
        validate: (content, filePath) => {
            // Only check files that look like form files
            if (!CONFIG.FILE_PATTERNS.form.test(filePath) && !content.includes('FormObject')) {
                return { pass: true };
            }

            // If it's a form file, check for proper inheritance
            if (CONFIG.FILE_PATTERNS.form.test(filePath)) {
                if (!content.includes('extends FormObjectAbstract')) {
                    const classMatch = findWithLocation(content, /public\s+class\s+(\w+)/);
                    return {
                        pass: false,
                        message: 'FormObject class must extend FormObjectAbstract<EntityType>',
                        line: classMatch ? classMatch.line : 1,
                        column: classMatch ? classMatch.column : 1,
                    };
                }
            }

            return { pass: true };
        },
    },

    // FORM-002: Has @Component Annotation
    {
        id: 'FORM-002',
        name: 'Has @Component Annotation',
        description: 'FormObject class must have @Component annotation',
        category: 'structure',
        fixable: true,
        validate: (content, filePath) => {
            if (!isFormObjectFile(content)) return { pass: true };

            if (!content.includes('@Component')) {
                const classMatch = findWithLocation(content, /public\s+class\s+\w+/);
                return {
                    pass: false,
                    message: 'FormObject class must have @Component annotation',
                    line: classMatch ? classMatch.line : 1,
                    column: classMatch ? classMatch.column : 1,
                };
            }

            return { pass: true };
        },
    },

    // FORM-003: Correct Package Location
    {
        id: 'FORM-003',
        name: 'Correct Package Location',
        description: 'FormObject class must be in {module}/access/form/ package',
        category: 'structure',
        fixable: false,
        validate: (content, filePath) => {
            if (!isFormObjectFile(content)) return { pass: true };

            // Check file path or package declaration
            const packageMatch = content.match(/package\s+([^;]+);/);
            if (packageMatch) {
                const packagePath = packageMatch[1];
                if (!packagePath.includes('.access.form') && !packagePath.includes('.form.')) {
                    const pkgLocation = findWithLocation(content, /package\s+/);
                    return {
                        pass: false,
                        message: `FormObject should be in access/form package, found: ${packagePath}`,
                        line: pkgLocation ? pkgLocation.line : 1,
                        column: pkgLocation ? pkgLocation.column : 1,
                    };
                }
            }

            return { pass: true };
        },
    },

    // FORM-004: Lifecycle Method Signatures
    {
        id: 'FORM-004',
        name: 'Lifecycle Method Signatures',
        description: 'Lifecycle methods must have correct signatures (FormObject, Entity)',
        category: 'lifecycle',
        fixable: false,
        validate: (content, filePath) => {
            if (!isFormObjectFile(content)) return { pass: true };

            const lifecycleMethods = ['preLoad', 'postLoad', 'preSave', 'postSave'];

            for (const method of lifecycleMethods) {
                const methodPattern = new RegExp(`(public|protected)\\s+void\\s+${method}\\s*\\(([^)]*)\\)`);
                const methodMatch = content.match(methodPattern);

                if (methodMatch) {
                    const params = methodMatch[2];

                    // Check if parameters include FormObject
                    if (!params.includes('FormObject')) {
                        const location = findWithLocation(content, methodPattern);
                        return {
                            pass: false,
                            message: `${method}() must have FormObject as first parameter`,
                            line: location ? location.line : 1,
                            column: location ? location.column : 1,
                        };
                    }
                }
            }

            return { pass: true };
        },
    },

    // FORM-005: Uses FormHelper
    {
        id: 'FORM-005',
        name: 'Uses FormHelper',
        description: 'Form field manipulation should use FormHelper utility methods',
        category: 'usage',
        fixable: false,
        validate: (content, filePath) => {
            if (!isFormObjectFile(content)) return { pass: true };

            // Check for direct field manipulation that should use FormHelper
            const directManipulation = findWithLocation(content, /formObject\.getFields\(\)\.get\(/);
            if (directManipulation) {
                return {
                    pass: false,
                    message: 'Use FormHelper methods instead of direct field access via getFields().get()',
                    line: directManipulation.line,
                    column: directManipulation.column,
                };
            }

            return { pass: true };
        },
    },

    // FORM-006: FormHelper Method Exists
    {
        id: 'FORM-006',
        name: 'FormHelper Method Exists',
        description: 'FormHelper methods called must exist',
        category: 'usage',
        fixable: false,
        validate: (content, filePath) => {
            if (!isFormObjectFile(content)) return { pass: true };

            // Known FormHelper methods
            const validMethods = [
                'setFieldVisible',
                'setFieldRequired',
                'setFieldReadOnly',
                'setFieldValue',
                'getFieldValue',
                'setFieldOptions',
                'getField',
                'hideField',
                'showField',
                'disableField',
                'enableField',
            ];

            // Find FormHelper method calls
            const helperCalls = findAllWithLocation(content, /FormHelper\.(\w+)\s*\(/);

            for (const call of helperCalls) {
                const methodName = call.groups[0];
                if (!validMethods.some(m => methodName.startsWith(m.replace(/([A-Z])/g, '').toLowerCase()) || m === methodName)) {
                    // This is a heuristic check - the method might still be valid
                    // Just flag suspicious ones
                    if (!methodName.startsWith('set') && !methodName.startsWith('get') && !methodName.startsWith('is')) {
                        return {
                            pass: false,
                            message: `FormHelper.${methodName}() may not exist - verify method name`,
                            line: call.line,
                            column: call.column,
                        };
                    }
                }
            }

            return { pass: true };
        },
    },

    // FORM-007: Override Annotation
    {
        id: 'FORM-007',
        name: 'Override Annotation',
        description: 'Lifecycle methods should have @Override annotation',
        category: 'lifecycle',
        fixable: true,
        validate: (content, filePath) => {
            if (!isFormObjectFile(content)) return { pass: true };

            const lifecycleMethods = ['preLoad', 'postLoad', 'preSave', 'postSave'];

            for (const method of lifecycleMethods) {
                const methodPattern = new RegExp(`(public|protected)\\s+void\\s+${method}\\s*\\(`);
                const methodMatch = content.match(methodPattern);

                if (methodMatch) {
                    // Check if @Override is present before this method
                    const methodIndex = content.indexOf(methodMatch[0]);
                    const beforeMethod = content.substring(Math.max(0, methodIndex - 50), methodIndex);

                    if (!beforeMethod.includes('@Override')) {
                        const location = findWithLocation(content, methodPattern);
                        return {
                            pass: false,
                            message: `${method}() should have @Override annotation`,
                            line: location ? location.line : 1,
                            column: location ? location.column : 1,
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

class FormValidator {
    constructor(options = {}) {
        this.options = {
            verbose: options.verbose || false,
            json: options.json || false,
            category: options.category || null,
        };
        this.results = {
            files: [],
            summary: { total: 0, passed: 0, failed: 0, skipped: 0 },
        };
    }

    validateFile(filePath) {
        if (!fs.existsSync(filePath)) return null;
        if (!CONFIG.FILE_PATTERNS.java.test(filePath)) {
            this.results.summary.skipped++;
            return null;
        }

        const content = fs.readFileSync(filePath, 'utf-8');

        // Skip files that aren't form files
        if (!isFormObjectFile(content) && !CONFIG.FILE_PATTERNS.form.test(filePath)) {
            this.results.summary.skipped++;
            return null;
        }

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
            if (CONFIG.FILE_PATTERNS.java.test(targetPath)) {
                return [targetPath];
            }
            return files;
        }

        const items = fs.readdirSync(targetPath);

        for (const item of items) {
            if (item.startsWith('.') || item === 'node_modules' || item === 'target' || item === 'build') continue;

            const fullPath = path.join(targetPath, item);
            const itemStat = fs.statSync(fullPath);

            if (itemStat.isDirectory()) {
                files.push(...this.getFiles(fullPath));
            } else if (CONFIG.FILE_PATTERNS.java.test(item)) {
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
        console.log(c.bold + '║            Form Implementation Validation Report               ║' + c.reset);
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

        console.log(c.bold + '╔════════════════════════════════════════════════════════════════╗' + c.reset);
        console.log(c.bold + '║                          SUMMARY                               ║' + c.reset);
        console.log(c.bold + '╚════════════════════════════════════════════════════════════════╝' + c.reset);
        console.log();
        console.log(`   Files checked:  ${this.results.summary.total}`);
        console.log(`   ${c.green}Passed:${c.reset}        ${this.results.summary.passed}`);
        console.log(`   ${c.red}Failed:${c.reset}        ${this.results.summary.failed}`);
        console.log(`   ${c.dim}Skipped:${c.reset}       ${this.results.summary.skipped}`);
        console.log();

        if (this.results.summary.failed === 0) {
            console.log(c.green + c.bold + '✓ All form files comply with implementation standards!' + c.reset);
            console.log();
            return 0;
        } else {
            console.log(c.red + c.bold + `✗ ${this.results.summary.failed} file(s) have violations` + c.reset);
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
Form Implementation Validator

Validates Java FormObject files against form implementation standards.
Reports violations with exact line:column location.

Usage:
  node check-form.js [options] <path...>

Options:
  -h, --help       Show help
  -v, --verbose    Show passed files and details
  -j, --json       Output as JSON
  --category CAT   Only check rules in category
  --list-rules     List all validation rules

Categories:
  structure, lifecycle, usage

Examples:
  node check-form.js backend/src/main/java/
  node check-form.js --category lifecycle backend/src/
  node check-form.js --json backend/ > report.json
`);
}

function printRules() {
    console.log('\nForm Validation Rules:\n');
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
        category,
    };

    const paths = args.filter(arg => !arg.startsWith('-'));

    if (paths.length === 0) {
        console.error('Error: No path specified');
        process.exit(1);
    }

    const validator = new FormValidator(options);
    validator.validate(paths);

    const exitCode = validator.printResults();
    process.exit(exitCode);
}

if (require.main === module) {
    main();
}

module.exports = { FormValidator, validationRules, CONFIG };
