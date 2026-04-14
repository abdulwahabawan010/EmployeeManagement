#!/usr/bin/env node

/**
 * Query Language (QL) Validator
 *
 * Validates Java files against QL standards for query building.
 * Reports violations with exact line:column location.
 *
 * Usage:
 *   node check-ql.js <file-or-directory>
 *   node check-ql.js --json <file-or-directory>
 *   node check-ql.js --list-rules
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    FILE_PATTERNS: {
        java: /\.java$/,
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

function usesQueryBuilder(content) {
    return content.includes('getEntityQueryBuilder') ||
        content.includes('EntityQueryBuilder') ||
        content.includes('genericDataService');
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

const validationRules = [
    // QL-001: Use getEntityQueryBuilder()
    {
        id: 'QL-001',
        name: 'Use getEntityQueryBuilder()',
        description: 'Queries should use GenericDataService.getEntityQueryBuilder() method',
        category: 'query-builder',
        fixable: false,
        validate: (content, filePath) => {
            if (!usesQueryBuilder(content)) return { pass: true };

            // Check for createQuery or createNativeQuery which bypass the query builder
            const createQueryMatch = findWithLocation(content, /entityManager\.createQuery\s*\(/);
            if (createQueryMatch) {
                // Allow in very specific cases (check if it's a custom query service)
                if (!filePath.includes('Repository') && !filePath.includes('Dao')) {
                    return {
                        pass: false,
                        message: 'Prefer getEntityQueryBuilder() over entityManager.createQuery()',
                        line: createQueryMatch.line,
                        column: createQueryMatch.column,
                    };
                }
            }

            return { pass: true };
        },
    },

    // QL-002: Use addSorting() for Sorting
    {
        id: 'QL-002',
        name: 'Use addSorting() for Sorting',
        description: 'Use addSorting(field, boolean) for ordering - true=ASC, false=DESC',
        category: 'sorting',
        fixable: false,
        validate: (content, filePath) => {
            if (!usesQueryBuilder(content)) return { pass: true };

            // Check for proper addSorting usage
            const sortingMatches = findAllWithLocation(content, /\.addSorting\s*\(\s*([^,)]+)\s*,\s*([^)]+)\s*\)/);

            for (const match of sortingMatches) {
                const secondArg = match.groups[1].trim();

                // Second argument should be boolean (true/false)
                if (secondArg !== 'true' && secondArg !== 'false' && !secondArg.includes('boolean')) {
                    return {
                        pass: false,
                        message: `addSorting() second argument should be boolean (true=ASC, false=DESC), got: ${secondArg}`,
                        line: match.line,
                        column: match.column,
                    };
                }
            }

            return { pass: true };
        },
    },

    // QL-003: No addOrderAsc()
    {
        id: 'QL-003',
        name: 'No addOrderAsc()',
        description: 'addOrderAsc() does not exist - use addSorting(field, true)',
        category: 'sorting',
        fixable: true,
        validate: (content, filePath) => {
            const ascMatch = findWithLocation(content, /\.addOrderAsc\s*\(/);
            if (ascMatch) {
                return {
                    pass: false,
                    message: 'addOrderAsc() does not exist - use addSorting(field, true) for ascending order',
                    line: ascMatch.line,
                    column: ascMatch.column,
                };
            }

            return { pass: true };
        },
    },

    // QL-004: No addOrderDesc()
    {
        id: 'QL-004',
        name: 'No addOrderDesc()',
        description: 'addOrderDesc() does not exist - use addSorting(field, false)',
        category: 'sorting',
        fixable: true,
        validate: (content, filePath) => {
            const descMatch = findWithLocation(content, /\.addOrderDesc\s*\(/);
            if (descMatch) {
                return {
                    pass: false,
                    message: 'addOrderDesc() does not exist - use addSorting(field, false) for descending order',
                    line: descMatch.line,
                    column: descMatch.column,
                };
            }

            return { pass: true };
        },
    },

    // QL-005: Use Metamodel Attributes
    {
        id: 'QL-005',
        name: 'Use Metamodel Attributes',
        description: 'Use metamodel attributes (Entity_.FIELD) instead of string field names',
        category: 'filtering',
        fixable: false,
        validate: (content, filePath) => {
            if (!usesQueryBuilder(content)) return { pass: true };

            // Check for addViaEntity with string literals instead of metamodel
            const stringLiteralMatches = findAllWithLocation(content, /\.addViaEntity\s*\(\s*"([^"]+)"/);

            for (const match of stringLiteralMatches) {
                const fieldName = match.groups[0];
                return {
                    pass: false,
                    message: `Use metamodel attribute (Entity_.${fieldName.toUpperCase()}) instead of string "${fieldName}"`,
                    line: match.line,
                    column: match.column,
                };
            }

            return { pass: true };
        },
    },

    // QL-006: Query Builder Chain Pattern
    {
        id: 'QL-006',
        name: 'Query Builder Chain Pattern',
        description: 'Query builder should follow pattern: builder → add* → build → execute',
        category: 'query-builder',
        fixable: false,
        validate: (content, filePath) => {
            if (!usesQueryBuilder(content)) return { pass: true };

            // Check for getEntityQueryBuilder without build() call
            const builderMatches = findAllWithLocation(content, /getEntityQueryBuilder\s*\([^)]*\)/);

            for (const match of builderMatches) {
                // Find the statement containing this call
                const statementEnd = content.indexOf(';', match.index);
                const statement = content.substring(match.index, statementEnd);

                // Check if it eventually calls build() or is stored for later
                const varAssignment = content.substring(content.lastIndexOf('\n', match.index), match.index);

                if (!statement.includes('.build()') && !varAssignment.includes('=')) {
                    // Not a chained call and not assigned to variable
                    return {
                        pass: false,
                        message: 'Query builder should be chained with .build().execute() or assigned to variable',
                        line: match.line,
                        column: match.column,
                    };
                }
            }

            return { pass: true };
        },
    },

    // QL-007: No Hardcoded SQL
    {
        id: 'QL-007',
        name: 'No Hardcoded SQL',
        description: 'Avoid hardcoded SQL strings - use query builder',
        category: 'query-builder',
        fixable: false,
        validate: (content, filePath) => {
            // Skip repository files where native queries might be acceptable
            if (filePath.includes('Repository')) return { pass: true };

            // Check for obvious SQL patterns
            const sqlPatterns = [
                /"\s*SELECT\s+.*\s+FROM\s+/i,
                /"\s*UPDATE\s+.*\s+SET\s+/i,
                /"\s*DELETE\s+FROM\s+/i,
                /"\s*INSERT\s+INTO\s+/i,
            ];

            for (const pattern of sqlPatterns) {
                const match = findWithLocation(content, pattern);
                if (match) {
                    return {
                        pass: false,
                        message: 'Avoid hardcoded SQL strings - use query builder instead',
                        line: match.line,
                        column: match.column,
                    };
                }
            }

            return { pass: true };
        },
    },
];

// ============================================================================
// VALIDATOR CLASS
// ============================================================================

class QLValidator {
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

        // Skip files that don't use query features
        if (!usesQueryBuilder(content) && !content.includes('createQuery')) {
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
        console.log(c.bold + '║              Query Language Validation Report                  ║' + c.reset);
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
            console.log(c.green + c.bold + '✓ All files comply with QL standards!' + c.reset);
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
Query Language (QL) Validator

Validates Java files against QL standards for query building.
Reports violations with exact line:column location.

Usage:
  node check-ql.js [options] <path...>

Options:
  -h, --help       Show help
  -v, --verbose    Show passed files and details
  -j, --json       Output as JSON
  --category CAT   Only check rules in category
  --list-rules     List all validation rules

Categories:
  query-builder, sorting, filtering

Examples:
  node check-ql.js backend/src/main/java/
  node check-ql.js --category sorting backend/src/
  node check-ql.js --json backend/ > report.json
`);
}

function printRules() {
    console.log('\nQL Validation Rules:\n');
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

    const validator = new QLValidator(options);
    validator.validate(paths);

    const exitCode = validator.printResults();
    process.exit(exitCode);
}

if (require.main === module) {
    main();
}

module.exports = { QLValidator, validationRules, CONFIG };
