#!/usr/bin/env node

/**
 * Navigation Service Guidelines Auto-Fixer
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
    IMPORTS: {
        'MvsObjectNavigationService': '"features/core/shared/navigation/mvs-object-navigation.service"',
        'MvsObjectNavigationEntry': '"features/core/shared/navigation/mvs-object-navigation-entry"',
        'MvsObjectNavigationActionEnum': '"features/core/shared/navigation/mvs-object-navigation-action-enum"',
        'MvsObjectNavigationProviderGeneric': '"features/core/shared/navigation/impl/mvs-object-navigation-provider-generic"',
        'ObjectIdentifier': '"features/core/shared/basic/object-identifier"'
    },
    ACTIONS: {
        0: 'any',
        1: 'create',
        2: 'edit',
        3: 'display',
        4: 'run'
    },
    LOCATION_MODES: {
        'main': 'full',
        'right': 'side',
        'left': 'side',
        'bottom': 'side',
        'dialog': 'full'
    }
};

// ============================================================================
// FIX HANDLERS
// ============================================================================

const fixHandlers = {
    /**
     * Fix import path violations
     */
    'IMPORT-001': (content, violation) => {
        // Fix MvsObjectNavigationService import path
        const pattern = /import\s*{([^}]*MvsObjectNavigationService[^}]*)}\s*from\s*["'][^"']+["']/;
        const match = content.match(pattern);
        if (match) {
            const imports = match[1];
            const newImport = `import {${imports}} from ${CONFIG.IMPORTS['MvsObjectNavigationService']}`;
            return content.replace(pattern, newImport);
        }
        return content;
    },

    'IMPORT-002': (content, violation) => {
        // Fix MvsObjectNavigationEntry import path
        const pattern = /import\s*{([^}]*MvsObjectNavigationEntry[^}]*)}\s*from\s*["'][^"']+["']/;
        const match = content.match(pattern);
        if (match) {
            const imports = match[1];
            const newImport = `import {${imports}} from ${CONFIG.IMPORTS['MvsObjectNavigationEntry']}`;
            return content.replace(pattern, newImport);
        }
        return content;
    },

    'IMPORT-003': (content, violation) => {
        // Fix MvsObjectNavigationActionEnum import path
        const pattern = /import\s*{([^}]*MvsObjectNavigationActionEnum[^}]*)}\s*from\s*["'][^"']+["']/;
        const match = content.match(pattern);
        if (match) {
            const imports = match[1];
            const newImport = `import {${imports}} from ${CONFIG.IMPORTS['MvsObjectNavigationActionEnum']}`;
            return content.replace(pattern, newImport);
        }
        return content;
    },

    'IMPORT-004': (content, violation) => {
        // Fix ObjectIdentifier import or add missing import
        const pattern = /import\s*{([^}]*\bObjectIdentifier\b[^}]*)}\s*from\s*["'][^"']+["']/;
        const match = content.match(pattern);
        if (match) {
            const imports = match[1];
            const newImport = `import {${imports}} from ${CONFIG.IMPORTS['ObjectIdentifier']}`;
            return content.replace(pattern, newImport);
        } else {
            // Add missing import after the last import statement
            const lastImportMatch = content.match(/^(import\s+.*;\s*\n)+/m);
            if (lastImportMatch) {
                const insertPos = lastImportMatch.index + lastImportMatch[0].length;
                const importStatement = `import { ObjectIdentifier } from ${CONFIG.IMPORTS['ObjectIdentifier']};\n`;
                return content.slice(0, insertPos) + importStatement + content.slice(insertPos);
            }
        }
        return content;
    },

    /**
     * Fix injection modifier
     */
    'INJECT-001': (content, violation) => {
        // Change private/public to protected for navigation service injection
        const patterns = [
            /(private\s+)(\w+\s*:\s*MvsObjectNavigationService)/,
            /(public\s+)(\w+\s*:\s*MvsObjectNavigationService)/,
            /(\s+)(\w+\s*:\s*MvsObjectNavigationService)/  // No modifier
        ];

        for (const pattern of patterns) {
            if (pattern.test(content)) {
                return content.replace(pattern, 'protected $2');
            }
        }
        return content;
    },

    /**
     * Fix service variable name
     */
    'INJECT-002': (content, violation) => {
        if (violation.currentValue && violation.currentValue !== 'navigationService') {
            const oldName = violation.currentValue;
            // Replace in constructor
            content = content.replace(
                new RegExp(`protected\\s+${oldName}\\s*:\\s*MvsObjectNavigationService`),
                'protected navigationService: MvsObjectNavigationService'
            );
            // Replace all usages (this.oldName -> this.navigationService)
            content = content.replace(
                new RegExp(`this\\.${oldName}(?=\\.)`, 'g'),
                'this.navigationService'
            );
        }
        return content;
    },

    /**
     * Fix provider initialization
     */
    'INIT-001': (content, violation) => {
        // Check if setNavigationProvider exists but not in ngOnInit
        if (content.includes('setNavigationProvider')) {
            // Move to ngOnInit - complex refactoring, skip for now
            return content;
        }

        // Add setNavigationProvider to ngOnInit
        const ngOnInitPattern = /(ngOnInit\s*\([^)]*\)\s*(?::\s*void\s*)?{)/;
        const match = content.match(ngOnInitPattern);
        if (match) {
            const insertCode = '\n    this.navigationService.setNavigationProvider(new MvsObjectNavigationProviderGeneric());';
            return content.replace(ngOnInitPattern, `$1${insertCode}`);
        }

        return content;
    },

    /**
     * Fix mode-location consistency
     */
    'NAV-003': (content, violation) => {
        if (violation.violations) {
            for (const v of violation.violations) {
                if (v.varName && v.currentMode && v.expectedMode) {
                    // Replace mode assignment
                    const pattern = new RegExp(`(${v.varName}\\.mode\\s*=\\s*)['"]${v.currentMode}['"]`);
                    content = content.replace(pattern, `$1'${v.expectedMode}'`);
                }
            }
        }
        return content;
    },

    /**
     * Fix sidebar close pattern
     */
    'NAV-004': (content, violation) => {
        // Replace undefined with null
        content = content.replace(/\.navigateTo\s*\(\s*undefined\s*,/g, '.navigateTo(null,');
        // Replace {} with null
        content = content.replace(/\.navigateTo\s*\(\s*\{\s*\}\s*,/g, '.navigateTo(null,');
        return content;
    },

    /**
     * Fix navigation entry creation
     */
    'ENTRY-001': (content, violation) => {
        // This is a complex refactoring - new MvsObjectNavigationEntry() -> createNavigationEntry()
        // Requires understanding constructor parameters
        console.log('    Note: ENTRY-001 requires manual refactoring from new MvsObjectNavigationEntry() to createNavigationEntry()');
        return content;
    },

    /**
     * Fix action enum usage
     */
    'ENTRY-002': (content, violation) => {
        if (violation.currentValue !== undefined && violation.suggestedEnum) {
            const numValue = violation.currentValue;
            const enumValue = violation.suggestedEnum;

            // Replace numeric value in createNavigationEntry
            content = content.replace(
                new RegExp(`(createNavigationEntry\\s*\\([^)]*,\\s*)${numValue}(\\s*\\))`),
                `$1MvsObjectNavigationActionEnum.${enumValue}$2`
            );

            // Replace direct assignment
            content = content.replace(
                new RegExp(`(\\.action\\s*=\\s*)${numValue}\\b`),
                `$1MvsObjectNavigationActionEnum.${enumValue}`
            );

            // Ensure import exists
            if (!content.includes('MvsObjectNavigationActionEnum')) {
                const lastImportMatch = content.match(/^(import\s+.*;\s*\n)+/m);
                if (lastImportMatch) {
                    const insertPos = lastImportMatch.index + lastImportMatch[0].length;
                    const importStatement = `import { MvsObjectNavigationActionEnum } from ${CONFIG.IMPORTS['MvsObjectNavigationActionEnum']};\n`;
                    content = content.slice(0, insertPos) + importStatement + content.slice(insertPos);
                }
            }
        }
        return content;
    },

    /**
     * Fix subscription cleanup - add takeUntilDestroyed
     */
    'SUB-001': (content, violation) => {
        // Add DestroyRef injection if not present
        if (!content.includes('DestroyRef')) {
            const constructorPattern = /(constructor\s*\()([^)]*\))/;
            const match = content.match(constructorPattern);
            if (match) {
                const params = match[2];
                if (params.trim() === ')') {
                    content = content.replace(constructorPattern, '$1private destroyRef = inject(DestroyRef))');
                } else {
                    content = content.replace(constructorPattern, '$1private destroyRef = inject(DestroyRef), $2');
                }
            }

            // Add imports
            if (!content.includes("from '@angular/core'")) {
                content = `import { DestroyRef, inject } from '@angular/core';\n` + content;
            } else {
                content = content.replace(
                    /import\s*{([^}]*)}\s*from\s*['"]@angular\/core['"]/,
                    (match, imports) => {
                        const importList = imports.split(',').map(i => i.trim());
                        if (!importList.includes('DestroyRef')) importList.push('DestroyRef');
                        if (!importList.includes('inject')) importList.push('inject');
                        return `import { ${importList.join(', ')} } from '@angular/core'`;
                    }
                );
            }

            // Add takeUntilDestroyed import
            if (!content.includes('takeUntilDestroyed')) {
                const lastImportMatch = content.match(/^(import\s+.*;\s*\n)+/m);
                if (lastImportMatch) {
                    const insertPos = lastImportMatch.index + lastImportMatch[0].length;
                    const importStatement = `import { takeUntilDestroyed } from '@angular/core/rxjs-interop';\n`;
                    content = content.slice(0, insertPos) + importStatement + content.slice(insertPos);
                }
            }
        }

        // Add takeUntilDestroyed to subscriptions
        content = content.replace(
            /(getNavigationBehaviourSubject\s*\([^)]+\))\s*\.subscribe\s*\(/g,
            '$1.pipe(takeUntilDestroyed(this.destroyRef)).subscribe('
        );

        return content;
    },

    /**
     * Fix OnDestroy implementation
     */
    'SUB-002': (content, violation) => {
        // Add OnDestroy to implements
        const implementsPattern = /(export\s+class\s+\w+\s+)implements\s+([^{]+)/;
        const noImplementsPattern = /(export\s+class\s+\w+\s+)({)/;

        if (implementsPattern.test(content)) {
            if (!content.includes('OnDestroy')) {
                content = content.replace(implementsPattern, '$1implements $2, OnDestroy');
            }
        } else if (noImplementsPattern.test(content)) {
            content = content.replace(noImplementsPattern, '$1implements OnDestroy $2');
        }

        // Add OnDestroy import
        if (!content.includes('OnDestroy')) {
            content = content.replace(
                /import\s*{([^}]*)}\s*from\s*['"]@angular\/core['"]/,
                (match, imports) => {
                    const importList = imports.split(',').map(i => i.trim());
                    if (!importList.includes('OnDestroy')) importList.push('OnDestroy');
                    return `import { ${importList.join(', ')} } from '@angular/core'`;
                }
            );
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
        console.log(c.bold + '║          Navigation Service Auto-Fix Report                    ║' + c.reset);
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
