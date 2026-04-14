#!/usr/bin/env node

/**
 * Core Architecture Validator
 *
 * Validates Java files against core architecture standards for controllers and services.
 * Reports violations with exact line:column location.
 *
 * Usage:
 *   node check-documentation.js <file-or-directory>
 *   node check-documentation.js --json <file-or-directory>
 *   node check-documentation.js --list-rules
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    FILE_PATTERNS: {
        java: /\.java$/,
        controller: /Controller\.java$/,
        service: /Service\.java$/,
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

function isControllerFile(content, filePath) {
    return CONFIG.FILE_PATTERNS.controller.test(filePath) ||
        content.includes('@RestController') ||
        content.includes('@Controller');
}

function isServiceFile(content, filePath) {
    return CONFIG.FILE_PATTERNS.service.test(filePath) ||
        content.includes('@Service');
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

const validationRules = [
    // DOC-001: No genericDataService.find() in Controllers
    {
        id: 'DOC-001',
        name: 'No genericDataService.find() in Controllers',
        description: 'Controllers must not use genericDataService.find() - use genericObjectService.getObjectAccess() instead',
        category: 'controller',
        fixable: false,
        validate: (content, filePath) => {
            if (!isControllerFile(content, filePath)) return { pass: true };

            const findMatch = findWithLocation(content, /genericDataService\.find\s*\(/);
            if (findMatch) {
                return {
                    pass: false,
                    message: 'Controllers must not use genericDataService.find() - use genericObjectService.getObjectAccess() instead',
                    line: findMatch.line,
                    column: findMatch.column,
                };
            }

            return { pass: true };
        },
    },

    // DOC-002: No genericDataService.findById() in Controllers
    {
        id: 'DOC-002',
        name: 'No genericDataService.findById() in Controllers',
        description: 'Controllers must not use genericDataService.findById() - use genericObjectService.getObjectAccess() instead',
        category: 'controller',
        fixable: false,
        validate: (content, filePath) => {
            if (!isControllerFile(content, filePath)) return { pass: true };

            const findMatch = findWithLocation(content, /genericDataService\.findById\s*\(/);
            if (findMatch) {
                return {
                    pass: false,
                    message: 'Controllers must not use genericDataService.findById() - use genericObjectService.getObjectAccess() instead',
                    line: findMatch.line,
                    column: findMatch.column,
                };
            }

            return { pass: true };
        },
    },

    // DOC-003: checkAccess() Required After getObjectAccess()
    {
        id: 'DOC-003',
        name: 'checkAccess() Required After getObjectAccess()',
        description: 'After getObjectAccess(), checkAccess() must be called before using the entity',
        category: 'controller',
        fixable: false,
        validate: (content, filePath) => {
            if (!isControllerFile(content, filePath)) return { pass: true };

            // Find getObjectAccess calls
            const getAccessMatches = findAllWithLocation(content, /(\w+)\s*=\s*genericObjectService\.getObjectAccess\s*\(/);

            for (const match of getAccessMatches) {
                const varName = match.groups[0];

                // Find the method body containing this call
                const methodStart = content.lastIndexOf('{', match.index);
                const methodEnd = content.indexOf('}', match.index);
                const methodBody = content.substring(match.index, methodEnd);

                // Check if checkAccess is called on this variable
                const checkAccessPattern = new RegExp(`${varName}\\.checkAccess\\s*\\(`);
                if (!checkAccessPattern.test(methodBody)) {
                    return {
                        pass: false,
                        message: `${varName}.checkAccess() must be called after getObjectAccess()`,
                        line: match.line,
                        column: match.column,
                    };
                }
            }

            return { pass: true };
        },
    },

    // DOC-004: No genericDataService.save()
    {
        id: 'DOC-004',
        name: 'No genericDataService.save()',
        description: 'genericDataService.save() does not exist - use entityManager.persist() or entityManager.merge()',
        category: 'service',
        fixable: false,
        validate: (content, filePath) => {
            const saveMatch = findWithLocation(content, /genericDataService\.save\s*\(/);
            if (saveMatch) {
                return {
                    pass: false,
                    message: 'genericDataService.save() does not exist - use entityManager.persist() for new entities or entityManager.merge() for existing',
                    line: saveMatch.line,
                    column: saveMatch.column,
                };
            }

            return { pass: true };
        },
    },

    // DOC-005: No addOrderAsc()
    {
        id: 'DOC-005',
        name: 'No addOrderAsc()',
        description: 'addOrderAsc() does not exist - use addSorting(field, true) for ascending',
        category: 'query',
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

    // DOC-006: No addOrderDesc()
    {
        id: 'DOC-006',
        name: 'No addOrderDesc()',
        description: 'addOrderDesc() does not exist - use addSorting(field, false) for descending',
        category: 'query',
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

    // DOC-007: Use entityManager.persist() for New Entities
    {
        id: 'DOC-007',
        name: 'Use entityManager.persist() for New Entities',
        description: 'New entities should use entityManager.persist(), not repository.save()',
        category: 'service',
        fixable: false,
        validate: (content, filePath) => {
            if (!isServiceFile(content, filePath)) return { pass: true };

            // Check for repository.save() pattern which might indicate wrong usage
            const repoSaveMatch = findWithLocation(content, /repository\.save\s*\(\s*new\s+\w+/);
            if (repoSaveMatch) {
                return {
                    pass: false,
                    message: 'For new entities, prefer entityManager.persist() over repository.save()',
                    line: repoSaveMatch.line,
                    column: repoSaveMatch.column,
                };
            }

            return { pass: true };
        },
    },

    // DOC-008: Controller Returns DTO
    {
        id: 'DOC-008',
        name: 'Controller Returns DTO',
        description: 'Controller methods should return DTOs, not entities',
        category: 'controller',
        fixable: false,
        validate: (content, filePath) => {
            if (!isControllerFile(content, filePath)) return { pass: true };

            // Look for public methods that return entity types (heuristic)
            const methodMatches = findAllWithLocation(content, /public\s+([\w<>]+)\s+\w+\s*\([^)]*\)\s*\{/);

            for (const match of methodMatches) {
                const returnType = match.groups[0];

                // Skip common DTO/Response types
                if (returnType.includes('Dto') ||
                    returnType.includes('Response') ||
                    returnType.includes('Result') ||
                    returnType === 'void' ||
                    returnType === 'String' ||
                    returnType === 'Long' ||
                    returnType === 'Boolean' ||
                    returnType.includes('List<') ||
                    returnType.includes('Map<') ||
                    returnType.includes('Optional<') ||
                    returnType.includes('ResponseEntity')) {
                    continue;
                }

                // Check for entity-like return types (ends with common entity suffixes)
                // This is a heuristic - entities typically don't end with Dto, Response, etc.
                if (/^[A-Z][a-zA-Z]+$/.test(returnType) &&
                    !returnType.endsWith('Dto') &&
                    !returnType.endsWith('Request') &&
                    !returnType.endsWith('Response')) {
                    // Additional check: does the file import this as an entity?
                    const entityImport = content.includes(`import.*entity.*${returnType}`);
                    if (entityImport) {
                        return {
                            pass: false,
                            message: `Controller method returns "${returnType}" which appears to be an entity - should return a DTO`,
                            line: match.line,
                            column: match.column,
                        };
                    }
                }
            }

            return { pass: true };
        },
    },

    // DOC-009: GenericObjectService for Entity Access
    {
        id: 'DOC-009',
        name: 'GenericObjectService for Entity Access',
        description: 'Controllers should use GenericObjectService for entity access with authorization',
        category: 'controller',
        fixable: false,
        validate: (content, filePath) => {
            if (!isControllerFile(content, filePath)) return { pass: true };

            // Check if controller has any @GetMapping with id parameter but no getObjectAccess
            const getMappingMatches = findAllWithLocation(content, /@GetMapping\s*\(\s*["']\/?\{(\w+)\}["']\s*\)/);

            for (const match of getMappingMatches) {
                const paramName = match.groups[0];

                // Find the method after this annotation
                const methodStart = content.indexOf('{', match.index);
                const methodEnd = findMethodEnd(content, methodStart);
                const methodBody = content.substring(methodStart, methodEnd);

                // Check if getObjectAccess is used
                if (!methodBody.includes('getObjectAccess') && !methodBody.includes('checkAccess')) {
                    // Check if it's using genericDataService directly
                    if (methodBody.includes('genericDataService') || methodBody.includes('repository.find')) {
                        return {
                            pass: false,
                            message: `Controller method should use genericObjectService.getObjectAccess() for entity access with authorization`,
                            line: match.line,
                            column: match.column,
                        };
                    }
                }
            }

            return { pass: true };
        },
    },

    // DOC-010: Service Should Not Return DTOs
    {
        id: 'DOC-010',
        name: 'Service Should Not Return DTOs',
        description: 'Services must not return DTO classes (with Dto suffix) - DTOs should only be used in controllers',
        category: 'service',
        fixable: false,
        validate: (content, filePath) => {
            if (!isServiceFile(content, filePath)) return { pass: true };

            // Look for public methods that return types ending with Dto
            const methodMatches = findAllWithLocation(content, /public\s+([\w<>,\s]+)\s+\w+\s*\([^)]*\)\s*\{/g);

            for (const match of methodMatches) {
                const returnType = match.groups[0].trim();

                // Check if return type contains Dto (but not in generic like List<SomeDto>)
                if (returnType.endsWith('Dto') || /Dto\s*>/.test(returnType) || /List<\w*Dto>/.test(returnType)) {
                    return {
                        pass: false,
                        message: `Service method returns "${returnType}" which is a DTO. Services should return internal objects (records, entities), not DTOs. DTO conversion should happen in the controller.`,
                        line: match.line,
                        column: match.column,
                    };
                }
            }

            return { pass: true };
        },
    },

    // DOC-011: Service Should Not Accept DTOs
    {
        id: 'DOC-011',
        name: 'Service Should Not Accept DTOs',
        description: 'Services must not accept DTO classes (with Dto suffix) as parameters - convert to internal objects first',
        category: 'service',
        fixable: false,
        validate: (content, filePath) => {
            if (!isServiceFile(content, filePath)) return { pass: true };

            // Look for public methods with Dto parameters
            const methodMatches = findAllWithLocation(content, /public\s+[\w<>,\s]+\s+\w+\s*\(([^)]*)\)\s*\{/g);

            for (const match of methodMatches) {
                const params = match.groups[0];

                // Check if any parameter type ends with Dto
                if (/\w+Dto\s+\w+/.test(params) || /List<\w*Dto>/.test(params)) {
                    return {
                        pass: false,
                        message: `Service method accepts DTO parameter. Services should accept internal objects, not DTOs. DTO conversion should happen in the controller.`,
                        line: match.line,
                        column: match.column,
                    };
                }
            }

            return { pass: true };
        },
    },

    // DOC-012: External IDs Must Have Access Check
    {
        id: 'DOC-012',
        name: 'External IDs Must Have Access Check',
        description: 'Controller endpoints with ID parameters (@RequestParam, @PathVariable) must check access via getObjectAccess()',
        category: 'controller',
        fixable: false,
        validate: (content, filePath) => {
            if (!isControllerFile(content, filePath)) return { pass: true };

            // Find endpoints with @RequestParam containing "id" or "Id" (case-insensitive for id at end)
            const requestParamMatches = findAllWithLocation(
                content,
                /@RequestParam[^)]*\)\s*(?:List<Long>|Long|Set<Long>)\s+(\w*[Ii]ds?\w*)/g
            );

            for (const match of requestParamMatches) {
                const paramName = match.groups[0];

                // Find the method body
                const methodStart = content.indexOf('{', match.index);
                if (methodStart === -1) continue;

                const methodEnd = findMethodEnd(content, methodStart);
                const methodBody = content.substring(methodStart, methodEnd);

                // Check if the method has access check for this parameter
                const hasAccessCheck = methodBody.includes('getObjectAccess') &&
                    methodBody.includes('checkAccess');

                // Also check if the parameter is used in a loop with access check
                const hasLoopAccessCheck = /for\s*\([^)]*\s+\w+\s*:\s*\w+\)[\s\S]*?getObjectAccess[\s\S]*?checkAccess/.test(methodBody);

                if (!hasAccessCheck && !hasLoopAccessCheck) {
                    return {
                        pass: false,
                        message: `External ID parameter "${paramName}" is not validated with access check. All external IDs must be checked via genericObjectService.getObjectAccess() and checkAccess().`,
                        line: match.line,
                        column: match.column,
                    };
                }
            }

            return { pass: true };
        },
    },

    // DOC-013: Record with Dto Suffix Detected
    {
        id: 'DOC-013',
        name: 'Internal Records Should Not Have Dto Suffix',
        description: 'Internal records used by services should not have Dto suffix - Dto suffix is reserved for API boundary DTOs',
        category: 'service',
        fixable: false,
        validate: (content, filePath) => {
            // Check for records with Dto suffix in service files or model/records directory
            if (!filePath.includes('/services/') && !filePath.includes('/model/records/')) {
                return { pass: true };
            }

            // Look for record definitions with Dto suffix
            const recordMatch = findWithLocation(content, /public\s+record\s+(\w+Dto)\s*\(/);

            if (recordMatch) {
                return {
                    pass: false,
                    message: `Record "${recordMatch.groups[0]}" has Dto suffix but is in services/records directory. Internal records should not have Dto suffix. Rename to "${recordMatch.groups[0].replace(/Dto$/, 'Data')}" or similar.`,
                    line: recordMatch.line,
                    column: recordMatch.column,
                };
            }

            return { pass: true };
        },
    },
];

function findMethodEnd(content, startIndex) {
    let braceCount = 0;
    let i = startIndex;
    let started = false;

    while (i < content.length) {
        if (content[i] === '{') {
            braceCount++;
            started = true;
        } else if (content[i] === '}') {
            braceCount--;
            if (started && braceCount === 0) {
                return i;
            }
        }
        i++;
    }
    return content.length;
}

// ============================================================================
// VALIDATOR CLASS
// ============================================================================

class DocumentationValidator {
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

        // Only validate controllers and services
        if (!isControllerFile(content, filePath) && !isServiceFile(content, filePath)) {
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
        console.log(c.bold + '║           Core Architecture Validation Report                  ║' + c.reset);
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
            console.log(c.green + c.bold + '✓ All files comply with core architecture standards!' + c.reset);
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
Core Architecture Validator

Validates Java controller and service files against core architecture standards.
Reports violations with exact line:column location.

Usage:
  node check-documentation.js [options] <path...>

Options:
  -h, --help       Show help
  -v, --verbose    Show passed files and details
  -j, --json       Output as JSON
  --category CAT   Only check rules in category
  --list-rules     List all validation rules

Categories:
  controller, service, query

Examples:
  node check-documentation.js backend/src/main/java/
  node check-documentation.js --category controller backend/src/
  node check-documentation.js --json backend/ > report.json
`);
}

function printRules() {
    console.log('\nCore Architecture Validation Rules:\n');
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

    const validator = new DocumentationValidator(options);
    validator.validate(paths);

    const exitCode = validator.printResults();
    process.exit(exitCode);
}

if (require.main === module) {
    main();
}

module.exports = { DocumentationValidator, validationRules, CONFIG };
