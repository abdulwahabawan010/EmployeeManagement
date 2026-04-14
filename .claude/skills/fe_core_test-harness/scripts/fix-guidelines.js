#!/usr/bin/env node

/**
 * Test Harness Guidelines Auto-Fixer
 *
 * Automatically resolves guideline violations detected by check-guidelines.js.
 * Receives violation data via stdin (JSON) and applies fixes to files.
 *
 * Usage:
 *   node check-guidelines.js --json <path> | node fix-guidelines.js
 *   node fix-guidelines.js < violations.json
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    IMPORT_PATH: '@core/shared/test/data/test-harness.types',
    REQUIRED_IMPORTS: ['TEST_MODULE_REGISTRY', 'TestCaseDataType', 'TestModuleDefinition']
};

// ============================================================================
// FIX HANDLERS
// ============================================================================

const fixHandlers = {
    /**
     * Fix test harness types import path
     */
    'IMPORT-001': (content, violation) => {
        const pattern = /import\s*{([^}]+)}\s*from\s*["'][^"']*test-harness\.types[^"']*["']/;
        const match = content.match(pattern);
        if (match) {
            const imports = match[1];
            const newImport = `import {${imports}} from '${CONFIG.IMPORT_PATH}'`;
            return content.replace(pattern, newImport);
        }
        return content;
    },

    /**
     * Add TEST_MODULE_REGISTRY import
     */
    'IMPORT-002': (content, violation) => {
        if (content.includes('TEST_MODULE_REGISTRY')) return content;

        // Check if there's an existing test-harness.types import
        const existingImportPattern = /import\s*{([^}]+)}\s*from\s*['"]([^'"]*test-harness\.types[^'"]*)["']/;
        const match = content.match(existingImportPattern);

        if (match) {
            const imports = match[1];
            if (!imports.includes('TEST_MODULE_REGISTRY')) {
                const newImports = imports.trim() + ', TEST_MODULE_REGISTRY';
                return content.replace(existingImportPattern, `import {${newImports}} from '${match[2]}'`);
            }
        } else {
            // Add new import
            const lastImportMatch = content.match(/^(import\s+.*;\s*\n)+/m);
            if (lastImportMatch) {
                const insertPos = lastImportMatch.index + lastImportMatch[0].length;
                const importStatement = `import { TEST_MODULE_REGISTRY, TestModuleDefinition, TestCaseDataType } from '${CONFIG.IMPORT_PATH}';\n`;
                return content.slice(0, insertPos) + importStatement + content.slice(insertPos);
            }
        }
        return content;
    },

    /**
     * Add TestCaseDataType import
     */
    'IMPORT-003': (content, violation) => {
        if (content.includes('TestCaseDataType')) return content;

        const existingImportPattern = /import\s*{([^}]+)}\s*from\s*['"]([^'"]*test-harness\.types[^'"]*)["']/;
        const match = content.match(existingImportPattern);

        if (match) {
            const imports = match[1];
            if (!imports.includes('TestCaseDataType')) {
                const newImports = imports.trim() + ', TestCaseDataType';
                return content.replace(existingImportPattern, `import {${newImports}} from '${match[2]}'`);
            }
        }
        return content;
    },

    /**
     * Add TestModuleDefinition type annotation
     */
    'IMPORT-004': (content, violation) => {
        if (!violation.currentValue) return content;

        const varName = violation.currentValue;

        // Add type annotation
        const pattern = new RegExp(`const\\s+${varName}\\s*=`);
        if (pattern.test(content)) {
            content = content.replace(pattern, `const ${varName}: TestModuleDefinition =`);
        }

        // Ensure TestModuleDefinition is imported
        if (!content.includes('TestModuleDefinition')) {
            const existingImportPattern = /import\s*{([^}]+)}\s*from\s*['"]([^'"]*test-harness\.types[^'"]*)["']/;
            const match = content.match(existingImportPattern);

            if (match) {
                const imports = match[1];
                const newImports = imports.trim() + ', TestModuleDefinition';
                content = content.replace(existingImportPattern, `import {${newImports}} from '${match[2]}'`);
            }
        }

        return content;
    },

    /**
     * Add components array to module definition
     */
    'MODULE-003': (content, violation) => {
        // Find module definition and add components array if missing
        const moduleDefPattern = /(const\s+\w+(?:ModuleEntry|Entry)\s*:\s*TestModuleDefinition\s*=\s*{[^}]*)(})/;
        const match = content.match(moduleDefPattern);

        if (match && !match[1].includes('components:')) {
            return content.replace(moduleDefPattern, '$1,\n    components: []\n$2');
        }
        return content;
    },

    /**
     * Wrap json value with JSON.stringify
     */
    'DATA-002': (content, violation) => {
        // Replace direct string/object assignment with JSON.stringify
        // json: '{...}' -> json: JSON.stringify({...})
        content = content.replace(/json\s*:\s*'(\{[^']*\})'/g, 'json: JSON.stringify($1)');
        content = content.replace(/json\s*:\s*"(\{[^"]*\})"/g, 'json: JSON.stringify($1)');
        content = content.replace(/json\s*:\s*`(\{[^`]*\})`/g, 'json: JSON.stringify($1)');

        return content;
    },

    /**
     * Fix dataType value
     */
    'DATA-003': (content, violation) => {
        if (violation.currentValue) {
            // Replace invalid dataType value with 0
            const pattern = new RegExp(`dataType\\s*:\\s*${violation.currentValue}\\b`);
            content = content.replace(pattern, 'dataType: 0');
        }
        return content;
    },

    /**
     * Fix type enum usage
     */
    'DATA-004': (content, violation) => {
        if (violation.currentValue) {
            const value = violation.currentValue.replace(/['"]/g, '');

            // Replace with TestCaseDataType.local
            if (value === 'local' || value === '0') {
                content = content.replace(
                    /type\s*:\s*(['"]?local['"]?|0)\b(?!\s*})/g,
                    'type: TestCaseDataType.local'
                );
            } else if (value === 'server' || value === '1') {
                content = content.replace(
                    /type\s*:\s*(['"]?server['"]?|1)\b(?!\s*})/g,
                    'type: TestCaseDataType.server'
                );
            }

            // Ensure TestCaseDataType is imported
            if (!content.includes('TestCaseDataType')) {
                const existingImportPattern = /import\s*{([^}]+)}\s*from\s*['"]([^'"]*test-harness\.types[^'"]*)["']/;
                const match = content.match(existingImportPattern);

                if (match) {
                    const imports = match[1];
                    const newImports = imports.trim() + ', TestCaseDataType';
                    content = content.replace(existingImportPattern, `import {${newImports}} from '${match[2]}'`);
                }
            }
        }
        return content;
    },

    /**
     * Fix provider export name
     */
    'PROV-001': (content, violation) => {
        if (violation.currentValue) {
            const oldName = violation.currentValue;

            // Try to extract module key from file path or content
            let moduleKey = '';
            const keyMatch = content.match(/key\s*:\s*['"]([a-z]{2,4})['"]/);
            if (keyMatch) {
                moduleKey = keyMatch[1].toUpperCase();
            }

            if (moduleKey) {
                const newName = `${moduleKey}_TEST_PROVIDERS`;

                // Replace export declaration
                content = content.replace(
                    new RegExp(`export\\s+const\\s+${oldName}\\s*:`),
                    `export const ${newName}:`
                );
            }
        }
        return content;
    },

    /**
     * Add multi: true to provider registration
     */
    'PROV-002': (content, violation) => {
        // Add multi: true if missing
        if (content.includes('TEST_MODULE_REGISTRY') && !content.includes('multi: true')) {
            content = content.replace(
                /{\s*provide\s*:\s*TEST_MODULE_REGISTRY\s*,\s*useValue\s*:\s*(\w+)\s*}/g,
                '{ provide: TEST_MODULE_REGISTRY, useValue: $1, multi: true }'
            );
        }

        // Add useValue if missing
        if (content.includes('TEST_MODULE_REGISTRY') && !content.includes('useValue')) {
            // Find the module entry variable name
            const entryMatch = content.match(/const\s+(\w+(?:ModuleEntry|Entry))\s*:/);
            if (entryMatch) {
                const entryName = entryMatch[1];
                content = content.replace(
                    /{\s*provide\s*:\s*TEST_MODULE_REGISTRY\s*}/g,
                    `{ provide: TEST_MODULE_REGISTRY, useValue: ${entryName}, multi: true }`
                );
            }
        }

        return content;
    },

    /**
     * Add Provider import from @angular/core
     */
    'FILE-002': (content, violation) => {
        if (content.includes('Provider[]')) {
            // Check if @angular/core import exists
            const angularCorePattern = /import\s*{([^}]*)}\s*from\s*['"]@angular\/core['"]/;
            const match = content.match(angularCorePattern);

            if (match) {
                // Add Provider to existing import
                const imports = match[1];
                if (!imports.includes('Provider')) {
                    const newImports = imports.trim() + ', Provider';
                    content = content.replace(angularCorePattern, `import {${newImports}} from '@angular/core'`);
                }
            } else {
                // Add new @angular/core import
                const lastImportMatch = content.match(/^(import\s+.*;\s*\n)+/m);
                if (lastImportMatch) {
                    const insertPos = lastImportMatch.index + lastImportMatch[0].length;
                    const importStatement = `import { Provider } from '@angular/core';\n`;
                    content = content.slice(0, insertPos) + importStatement + content.slice(insertPos);
                }
            }
        }
        return content;
    }
};

// ============================================================================
// FIXER CLASS
// ============================================================================

class GuidelinesFixer {
    constructor() {
        this.fixedCount = 0;
        this.skippedCount = 0;
        this.errors = [];
    }

    fixFile(filePath, failures) {
        if (!fs.existsSync(filePath)) {
            this.errors.push({ file: filePath, error: 'File not found' });
            return false;
        }

        let content = fs.readFileSync(filePath, 'utf-8');
        const originalContent = content;
        const fixedRules = [];
        const skippedRules = [];

        for (const failure of failures) {
            if (!failure.fixable) {
                skippedRules.push(failure.id);
                continue;
            }

            const handler = fixHandlers[failure.id];
            if (handler) {
                try {
                    const newContent = handler(content, failure);
                    if (newContent !== content) {
                        content = newContent;
                        fixedRules.push(failure.id);
                    } else {
                        skippedRules.push(failure.id);
                    }
                } catch (error) {
                    this.errors.push({
                        file: filePath,
                        rule: failure.id,
                        error: error.message
                    });
                    skippedRules.push(failure.id);
                }
            } else {
                skippedRules.push(failure.id);
            }
        }

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf-8');
            this.fixedCount += fixedRules.length;
            return { fixed: fixedRules, skipped: skippedRules };
        }

        this.skippedCount += skippedRules.length;
        return { fixed: [], skipped: skippedRules };
    }

    processViolations(violations) {
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
        console.log(c.bold + '║             Test Harness Auto-Fix Report                       ║' + c.reset);
        console.log(c.bold + '╚════════════════════════════════════════════════════════════════╝' + c.reset);
        console.log();

        for (const fileResult of violations.files) {
            if (fileResult.failed.length === 0) continue;

            console.log(c.bold + '📄 ' + fileResult.file + c.reset);

            const result = this.fixFile(fileResult.file, fileResult.failed);

            if (result.fixed.length > 0) {
                console.log(`   ${c.green}✓ Fixed:${c.reset} ${result.fixed.join(', ')}`);
            }
            if (result.skipped.length > 0) {
                console.log(`   ${c.yellow}⚠ Skipped:${c.reset} ${result.skipped.join(', ')}`);
            }
            console.log();
        }

        // Summary
        console.log(c.bold + '─'.repeat(65) + c.reset);
        console.log();
        console.log(`   ${c.green}Fixed:${c.reset}   ${this.fixedCount} violation(s)`);
        console.log(`   ${c.yellow}Skipped:${c.reset} ${this.skippedCount} violation(s)`);

        if (this.errors.length > 0) {
            console.log(`   ${c.red}Errors:${c.reset}  ${this.errors.length}`);
            for (const err of this.errors) {
                console.log(`     - ${err.file}: ${err.error}`);
            }
        }
        console.log();
    }
}

// ============================================================================
// CLI
// ============================================================================

function main() {
    let input = '';

    // Read JSON from stdin
    process.stdin.setEncoding('utf8');

    process.stdin.on('readable', () => {
        let chunk;
        while ((chunk = process.stdin.read()) !== null) {
            input += chunk;
        }
    });

    process.stdin.on('end', () => {
        if (!input.trim()) {
            console.error('Error: No input provided. Use: node check-guidelines.js --json <path> | node fix-guidelines.js');
            process.exit(1);
        }

        try {
            const violations = JSON.parse(input);
            const fixer = new GuidelinesFixer();
            fixer.processViolations(violations);
        } catch (error) {
            console.error('Error parsing input:', error.message);
            process.exit(1);
        }
    });
}

if (require.main === module) {
    main();
}

module.exports = { GuidelinesFixer, fixHandlers };
