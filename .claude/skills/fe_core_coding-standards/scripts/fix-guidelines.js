#!/usr/bin/env node

/**
 * Coding Standards Guidelines Auto-Fixer
 *
 * Automatically resolves violations detected by check-guidelines.js.
 * Receives violation data via stdin (JSON) and applies fixes to files.
 *
 * IMPORTANT:
 * - Fixes ONLY violations reported by check-guidelines.js
 * - Idempotent (safe to run multiple times)
 * - Never guesses intent
 * - Never changes public APIs
 *
 * Usage:
 *   node check-guidelines.js --json <path> | node fix-guidelines.js
 *   node fix-guidelines.js < violations.json
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// FIX HANDLERS
// ============================================================================

const fixHandlers = {
    /**
     * STYLE-001: Fix indentation (tabs to 4 spaces)
     */
    'STYLE-001': (content, violation) => {
        // Replace tabs with 4 spaces
        content = content.replace(/\t/g, '    ');

        // This is a partial fix - manual review may be needed for complex cases
        return content;
    },

    /**
     * STYLE-002: Fix quote style (double to single)
     */
    'STYLE-002': (content, violation) => {
        // Replace double quotes with single quotes for simple strings
        // Be careful not to replace in template literals or strings containing single quotes
        content = content.replace(/"([^"'\\]*(?:\\.[^"'\\]*)*)"/g, (match, inner) => {
            // Skip if contains single quote or is in a decorator/import
            if (inner.includes("'")) return match;
            return `'${inner}'`;
        });

        return content;
    },

    /**
     * STYLE-007: Add missing semicolons
     */
    'STYLE-007': (content, violation) => {
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Skip lines that don't need semicolons
            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') ||
                trimmed.startsWith('*') || /^[{})\]]$/.test(trimmed) ||
                trimmed.endsWith('{') || trimmed.endsWith(',') ||
                trimmed.startsWith('@') || trimmed.startsWith('import') ||
                trimmed.startsWith('export')) continue;

            // Add semicolon to statements that need it
            if (/^(const|let|var|return|throw)\s/.test(trimmed) &&
                !trimmed.endsWith(';') && !trimmed.endsWith('{')) {
                lines[i] = line.replace(/\s*$/, ';');
            }
        }

        return lines.join('\n');
    },

    /**
     * STYLE-009: Remove multiple consecutive empty lines
     */
    'STYLE-009': (content, violation) => {
        // Replace 3+ newlines with 2 newlines
        return content.replace(/\n{3,}/g, '\n\n');
    },

    /**
     * STYLE-010: Remove trailing whitespace
     */
    'STYLE-010': (content, violation) => {
        const lines = content.split('\n');
        const fixed = lines.map(line => line.replace(/\s+$/, ''));
        return fixed.join('\n');
    },

    /**
     * STYLE-011: Ensure file ends with single newline
     */
    'STYLE-011': (content, violation) => {
        // Remove all trailing newlines and add exactly one
        return content.replace(/\n*$/, '\n');
    },

    /**
     * NAME-011: Add $ suffix to Observable variables
     */
    'NAME-011': (content, violation) => {
        if (violation.currentValue) {
            const oldName = violation.currentValue;
            const newName = oldName + '$';

            // Replace variable declaration
            content = content.replace(
                new RegExp(`(${oldName})\\s*:\\s*(Observable|BehaviorSubject|Subject|ReplaySubject)<`),
                `${newName}: $2<`
            );

            // Replace all usages (be careful with partial matches)
            content = content.replace(
                new RegExp(`\\b${oldName}\\b(?!\\$)`, 'g'),
                newName
            );
        }
        return content;
    },

    /**
     * BOUND-005: Fix internal package imports
     */
    'BOUND-005': (content, violation) => {
        // Common fixes for internal imports
        const fixes = {
            'rxjs/internal/Observable': 'rxjs',
            'rxjs/internal/operators/': 'rxjs/operators',
            '@angular/core/src/': '@angular/core',
        };

        for (const [wrong, correct] of Object.entries(fixes)) {
            content = content.replace(new RegExp(wrong.replace(/\//g, '\\/'), 'g'), correct);
        }

        return content;
    },

    /**
     * BOUND-008: Convert deep relative imports to absolute paths
     * Note: This is a partial fix and may need manual review
     */
    'BOUND-008': (content, violation) => {
        // This fix is complex and depends on project structure
        // Only adding a note for now - manual fix recommended
        console.log(`    Note: BOUND-008 requires manual fix for: ${violation.message}`);
        return content;
    },

    /**
     * TMPL-010: Add standalone: false to component decorator
     */
    'TMPL-010': (content, violation) => {
        // Find @Component decorator
        const componentMatch = content.match(/@Component\s*\(\s*\{/);
        if (componentMatch) {
            // Check if standalone already exists
            if (content.includes('standalone:')) {
                // Replace standalone: true with standalone: false
                content = content.replace(/standalone\s*:\s*true/, 'standalone: false');
            } else {
                // Find the first property in the decorator and add standalone: false before it
                const decoratorIndex = componentMatch.index + componentMatch[0].length;
                const beforeDecorator = content.substring(0, decoratorIndex);
                const afterDecorator = content.substring(decoratorIndex);

                // Add standalone: false after the opening brace
                const insertPoint = afterDecorator.search(/\s*\w+\s*:/);
                if (insertPoint !== -1) {
                    const whitespace = afterDecorator.substring(0, insertPoint);
                    const rest = afterDecorator.substring(insertPoint);
                    content = beforeDecorator + whitespace + '\n    standalone: false,' + rest;
                }
            }
        }
        return content;
    },
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
            return { fixed: [], skipped: failures.map(f => f.id) };
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
                        error: error.message,
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
            dim: '\x1b[2m',
        };

        console.log();
        console.log(c.bold + '╔════════════════════════════════════════════════════════════════╗' + c.reset);
        console.log(c.bold + '║            Coding Standards Auto-Fix Report                    ║' + c.reset);
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

        // Re-run validation advice
        if (this.fixedCount > 0) {
            console.log(c.dim + 'Run check-guidelines.js again to verify all fixes were applied correctly.' + c.reset);
            console.log();
        }
    }
}

// ============================================================================
// CLI
// ============================================================================

function printHelp() {
    console.log(`
Coding Standards Guidelines Auto-Fixer

Automatically resolves violations detected by check-guidelines.js.
Receives violation data via stdin (JSON) and applies fixes to files.

Usage:
  node check-guidelines.js --json <path> | node fix-guidelines.js
  node fix-guidelines.js < violations.json

Behavior:
  - Fixes ONLY violations reported by check-guidelines.js
  - Idempotent (safe to run multiple times)
  - Never guesses intent
  - Never changes public APIs

Example:
  node check-guidelines.js --json src/app/ | node fix-guidelines.js
`);
}

function main() {
    const args = process.argv.slice(2);

    if (args.includes('-h') || args.includes('--help')) {
        printHelp();
        process.exit(0);
    }

    let input = '';

    process.stdin.setEncoding('utf8');

    process.stdin.on('readable', () => {
        let chunk;
        while ((chunk = process.stdin.read()) !== null) {
            input += chunk;
        }
    });

    process.stdin.on('end', () => {
        if (!input.trim()) {
            console.error('Error: No input provided.');
            console.error('Usage: node check-guidelines.js --json <path> | node fix-guidelines.js');
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
