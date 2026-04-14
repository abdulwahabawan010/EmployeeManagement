#!/usr/bin/env node

/**
 * Entity Architecture Validator
 *
 * Validates Java entity files against entity architecture standards.
 * Reports violations with exact line:column location.
 *
 * Usage:
 *   node check-entity.js <file-or-directory>
 *   node check-entity.js --json <file-or-directory>
 *   node check-entity.js --list-rules
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    FILE_PATTERNS: {
        java: /\.java$/,
        entity: /\.java$/,
    },

    // Module codes that are valid prefixes
    VALID_MODULE_CODES: [
        'am', 'as', 'bm', 'ce', 'cf', 'cm', 'cp', 'cr', 'dm', 'eu', 'ex',
        'ha', 'hb', 'hc', 'im', 'jb', 'lg', 'lm', 'ns', 'ol', 'pc', 'rp',
        'si', 'te', 'tm', 'ui', 'um', 'wf', 'co', 'au', 'se'
    ],
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

function isEntityFile(content) {
    return /@Entity\s*\(/.test(content);
}

function isEnumFile(content) {
    return /public\s+enum\s+\w+/.test(content);
}

function getBaseClass(content) {
    const match = content.match(/extends\s+(\w+)/);
    return match ? match[1] : null;
}

function toSnakeCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .toLowerCase();
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

const validationRules = [
    // ENTITY-001: Entity Name Prefix
    {
        id: 'ENTITY-001',
        name: 'Entity Name Prefix',
        description: 'Entity name must be prefixed with module code: @Entity(name = "{moduleCode}{EntityName}")',
        category: 'naming',
        fixable: false,
        validate: (content, filePath) => {
            if (!isEntityFile(content)) return { pass: true };

            const entityMatch = findWithLocation(content, /@Entity\s*\(\s*name\s*=\s*"(\w+)"/);
            if (!entityMatch) {
                const atEntityMatch = findWithLocation(content, /@Entity/);
                return {
                    pass: false,
                    message: '@Entity annotation must specify name attribute',
                    line: atEntityMatch ? atEntityMatch.line : 1,
                    column: atEntityMatch ? atEntityMatch.column : 1,
                };
            }

            const entityName = entityMatch.groups[0];

            // Check if starts with valid module code (2-3 lowercase letters followed by uppercase)
            const prefixMatch = entityName.match(/^([a-z]{2,3})([A-Z])/);
            if (!prefixMatch) {
                return {
                    pass: false,
                    message: `Entity name "${entityName}" must start with module code prefix (e.g., "tmTicket", "crCustomer")`,
                    line: entityMatch.line,
                    column: entityMatch.column,
                };
            }

            const moduleCode = prefixMatch[1];
            if (!CONFIG.VALID_MODULE_CODES.includes(moduleCode)) {
                return {
                    pass: false,
                    message: `Entity name "${entityName}" uses unknown module code "${moduleCode}"`,
                    line: entityMatch.line,
                    column: entityMatch.column,
                };
            }

            return { pass: true };
        },
    },

    // ENTITY-002: Sequence Naming Convention
    {
        id: 'ENTITY-002',
        name: 'Sequence Naming Convention',
        description: 'Sequence must use full name format: {module}_id_{entity_name_snake_case}',
        category: 'naming',
        fixable: false,
        validate: (content, filePath) => {
            if (!isEntityFile(content)) return { pass: true };

            const sequenceMatches = findAllWithLocation(content, /@SequenceGenerator\s*\([^)]*sequenceName\s*=\s*"([^"]+)"/);

            for (const match of sequenceMatches) {
                const sequenceName = match.groups[0];

                // Check format: {module}_id_{entity_snake_case}
                const formatMatch = sequenceName.match(/^([a-z]{2,3})_id_([a-z_]+)$/);
                if (!formatMatch) {
                    return {
                        pass: false,
                        message: `Sequence name "${sequenceName}" must follow format: {module}_id_{entity_snake_case}`,
                        line: match.line,
                        column: match.column,
                    };
                }

                // Check for abbreviations (common anti-pattern)
                const entityPart = formatMatch[2];
                if (entityPart.length < 4 && !['user', 'role', 'log', 'job', 'run'].includes(entityPart)) {
                    return {
                        pass: false,
                        message: `Sequence name "${sequenceName}" appears to be abbreviated - use full entity name`,
                        line: match.line,
                        column: match.column,
                    };
                }
            }

            return { pass: true };
        },
    },

    // ENTITY-003: No @OneToMany Relationships
    {
        id: 'ENTITY-003',
        name: 'No @OneToMany Relationships',
        description: '@OneToMany relationships are forbidden - use queries instead',
        category: 'relationships',
        fixable: false,
        validate: (content, filePath) => {
            if (!isEntityFile(content)) return { pass: true };

            const oneToManyMatch = findWithLocation(content, /@OneToMany/);
            if (oneToManyMatch) {
                return {
                    pass: false,
                    message: '@OneToMany relationships are forbidden - use queries from the child entity instead',
                    line: oneToManyMatch.line,
                    column: oneToManyMatch.column,
                };
            }

            return { pass: true };
        },
    },

    // ENTITY-004: FetchType.LAZY Required
    {
        id: 'ENTITY-004',
        name: 'FetchType.LAZY Required',
        description: 'All relationships must use FetchType.LAZY',
        category: 'relationships',
        fixable: true,
        validate: (content, filePath) => {
            if (!isEntityFile(content)) return { pass: true };

            // Check @ManyToOne
            const manyToOneMatches = findAllWithLocation(content, /@ManyToOne\s*(\([^)]*\))?/);
            for (const match of manyToOneMatches) {
                const annotation = match.match;
                if (!annotation.includes('fetch') || !annotation.includes('LAZY')) {
                    // Check if LAZY is specified elsewhere in the annotation
                    if (!annotation.includes('FetchType.LAZY')) {
                        return {
                            pass: false,
                            message: '@ManyToOne must specify fetch = FetchType.LAZY',
                            line: match.line,
                            column: match.column,
                        };
                    }
                }
            }

            // Check for EAGER fetch type
            const eagerMatch = findWithLocation(content, /FetchType\.EAGER/);
            if (eagerMatch) {
                return {
                    pass: false,
                    message: 'FetchType.EAGER is forbidden - use FetchType.LAZY',
                    line: eagerMatch.line,
                    column: eagerMatch.column,
                };
            }

            return { pass: true };
        },
    },

    // ENTITY-005: Enum Implements AlphaBaseEnum
    {
        id: 'ENTITY-005',
        name: 'Enum Implements AlphaBaseEnum',
        description: 'All enums must implement AlphaBaseEnum interface',
        category: 'enums',
        fixable: false,
        validate: (content, filePath) => {
            if (!isEnumFile(content)) return { pass: true };

            const enumMatch = findWithLocation(content, /public\s+enum\s+(\w+)/);
            if (!enumMatch) return { pass: true };

            if (!content.includes('implements AlphaBaseEnum')) {
                return {
                    pass: false,
                    message: `Enum must implement AlphaBaseEnum interface`,
                    line: enumMatch.line,
                    column: enumMatch.column,
                };
            }

            return { pass: true };
        },
    },

    // ENTITY-006: Enum Uses ORDINAL
    {
        id: 'ENTITY-006',
        name: 'Enum Uses ORDINAL',
        description: 'Enum fields must use @Enumerated(EnumType.ORDINAL)',
        category: 'enums',
        fixable: true,
        validate: (content, filePath) => {
            if (!isEntityFile(content)) return { pass: true };

            // Find @Enumerated annotations
            const enumeratedMatches = findAllWithLocation(content, /@Enumerated\s*\(\s*EnumType\.(\w+)\s*\)/);

            for (const match of enumeratedMatches) {
                const enumType = match.groups[0];
                if (enumType !== 'ORDINAL') {
                    return {
                        pass: false,
                        message: `@Enumerated must use EnumType.ORDINAL, not EnumType.${enumType}`,
                        line: match.line,
                        column: match.column,
                    };
                }
            }

            return { pass: true };
        },
    },

    // ENTITY-007: Enum Values Have @UiEnumValueInfo
    {
        id: 'ENTITY-007',
        name: 'Enum Values Have @UiEnumValueInfo',
        description: 'All enum values must have @UiEnumValueInfo annotation with label',
        category: 'enums',
        fixable: false,
        validate: (content, filePath) => {
            if (!isEnumFile(content)) return { pass: true };

            // Count enum values
            const enumBodyMatch = content.match(/enum\s+\w+[^{]*\{([^}]+)\}/s);
            if (!enumBodyMatch) return { pass: true };

            const enumBody = enumBodyMatch[1];

            // Count values (lines that end with comma or are last value before semicolon)
            const valueLines = enumBody.split('\n')
                .map(l => l.trim())
                .filter(l => l && !l.startsWith('//') && !l.startsWith('@') && !l.startsWith('*'));

            // Count @UiEnumValueInfo annotations
            const uiEnumValueInfoCount = (content.match(/@UiEnumValueInfo/g) || []).length;

            // Get actual enum value count (rough estimate)
            const enumValueMatches = enumBody.match(/^\s*[a-z_]+\s*(,|;|\()/gim);
            const estimatedValueCount = enumValueMatches ? enumValueMatches.length : 0;

            if (uiEnumValueInfoCount < estimatedValueCount && estimatedValueCount > 0) {
                const enumMatch = findWithLocation(content, /public\s+enum/);
                return {
                    pass: false,
                    message: `Enum has ${estimatedValueCount} values but only ${uiEnumValueInfoCount} @UiEnumValueInfo annotations`,
                    line: enumMatch ? enumMatch.line : 1,
                    column: enumMatch ? enumMatch.column : 1,
                };
            }

            return { pass: true };
        },
    },

    // ENTITY-008: Allocation Size Configuration
    {
        id: 'ENTITY-008',
        name: 'Allocation Size Configuration',
        description: 'Config entities use allocationSize=1, runtime entities use allocationSize=50',
        category: 'sequence',
        fixable: true,
        validate: (content, filePath) => {
            if (!isEntityFile(content)) return { pass: true };

            const baseClass = getBaseClass(content);
            const isConfigEntity = baseClass === 'ConfigurableEntity';
            const isRuntimeEntity = baseClass === 'AuditableEntity';

            const allocationMatch = findWithLocation(content, /allocationSize\s*=\s*(\d+)/);
            if (!allocationMatch) return { pass: true };

            const allocationSize = parseInt(allocationMatch.groups[0], 10);

            if (isConfigEntity && allocationSize !== 1) {
                return {
                    pass: false,
                    message: `ConfigurableEntity must use allocationSize = 1, not ${allocationSize}`,
                    line: allocationMatch.line,
                    column: allocationMatch.column,
                };
            }

            if (isRuntimeEntity && allocationSize !== 50) {
                return {
                    pass: false,
                    message: `AuditableEntity must use allocationSize = 50, not ${allocationSize}`,
                    line: allocationMatch.line,
                    column: allocationMatch.column,
                };
            }

            return { pass: true };
        },
    },

    // ENTITY-009: Extends Base Class
    {
        id: 'ENTITY-009',
        name: 'Extends Base Class',
        description: 'Entities must extend AuditableEntity or ConfigurableEntity',
        category: 'structure',
        fixable: false,
        validate: (content, filePath) => {
            if (!isEntityFile(content)) return { pass: true };

            const baseClass = getBaseClass(content);
            const validBaseClasses = ['AuditableEntity', 'ConfigurableEntity', 'BaseEntity'];

            if (!baseClass) {
                const classMatch = findWithLocation(content, /public\s+class\s+\w+/);
                return {
                    pass: false,
                    message: 'Entity must extend a base class (AuditableEntity or ConfigurableEntity)',
                    line: classMatch ? classMatch.line : 1,
                    column: classMatch ? classMatch.column : 1,
                };
            }

            if (!validBaseClasses.includes(baseClass)) {
                const extendsMatch = findWithLocation(content, /extends\s+\w+/);
                return {
                    pass: false,
                    message: `Entity extends "${baseClass}" - should extend AuditableEntity or ConfigurableEntity`,
                    line: extendsMatch ? extendsMatch.line : 1,
                    column: extendsMatch ? extendsMatch.column : 1,
                };
            }

            return { pass: true };
        },
    },

    // ENTITY-010: Sequence Generator Configuration
    {
        id: 'ENTITY-010',
        name: 'Sequence Generator Configuration',
        description: 'ID field must have proper @GeneratedValue and @SequenceGenerator',
        category: 'sequence',
        fixable: false,
        validate: (content, filePath) => {
            if (!isEntityFile(content)) return { pass: true };

            // Check for @Id annotation
            const idMatch = findWithLocation(content, /@Id\s/);
            if (!idMatch) return { pass: true }; // May inherit from base class

            // Check for SEQUENCE strategy
            const generatedValueMatch = findWithLocation(content, /@GeneratedValue\s*\([^)]*strategy\s*=\s*GenerationType\.(\w+)/);
            if (generatedValueMatch && generatedValueMatch.groups[0] !== 'SEQUENCE') {
                return {
                    pass: false,
                    message: `@GeneratedValue must use GenerationType.SEQUENCE, not ${generatedValueMatch.groups[0]}`,
                    line: generatedValueMatch.line,
                    column: generatedValueMatch.column,
                };
            }

            // Check that generator name matches in @GeneratedValue and @SequenceGenerator
            const generatorInGV = content.match(/@GeneratedValue\s*\([^)]*generator\s*=\s*"([^"]+)"/);
            const generatorInSG = content.match(/@SequenceGenerator\s*\([^)]*name\s*=\s*"([^"]+)"/);

            if (generatorInGV && generatorInSG && generatorInGV[1] !== generatorInSG[1]) {
                const sgMatch = findWithLocation(content, /@SequenceGenerator/);
                return {
                    pass: false,
                    message: `Generator name mismatch: @GeneratedValue uses "${generatorInGV[1]}" but @SequenceGenerator uses "${generatorInSG[1]}"`,
                    line: sgMatch ? sgMatch.line : 1,
                    column: sgMatch ? sgMatch.column : 1,
                };
            }

            return { pass: true };
        },
    },
];

// ============================================================================
// VALIDATOR CLASS
// ============================================================================

class EntityValidator {
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

        // Skip non-entity/non-enum files
        if (!isEntityFile(content) && !isEnumFile(content)) {
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
        console.log(c.bold + '║            Entity Architecture Validation Report               ║' + c.reset);
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
            console.log(c.green + c.bold + '✓ All entities comply with architecture standards!' + c.reset);
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
Entity Architecture Validator

Validates Java entity files against entity architecture standards.
Reports violations with exact line:column location.

Usage:
  node check-entity.js [options] <path...>

Options:
  -h, --help       Show help
  -v, --verbose    Show passed files and details
  -j, --json       Output as JSON
  --category CAT   Only check rules in category
  --list-rules     List all validation rules

Categories:
  naming, relationships, enums, sequence, structure

Examples:
  node check-entity.js backend/src/main/java/
  node check-entity.js --category enums backend/src/
  node check-entity.js --json backend/ > report.json
`);
}

function printRules() {
    console.log('\nEntity Validation Rules:\n');
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

    const validator = new EntityValidator(options);
    validator.validate(paths);

    const exitCode = validator.printResults();
    process.exit(exitCode);
}

if (require.main === module) {
    main();
}

module.exports = { EntityValidator, validationRules, CONFIG };
