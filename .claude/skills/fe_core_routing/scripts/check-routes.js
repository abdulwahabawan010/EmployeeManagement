#!/usr/bin/env node

/**
 * Route Validation Script
 *
 * Validates that route files comply with the frontend routing architecture:
 * - Route paths are prefixed with module code
 * - Only Page components are routed
 * - SubRoutes function is properly named
 * - Component names match route prefix
 *
 * Usage:
 *   node check-routes.js <path-to-route-file>
 *   node check-routes.js ./frontend/features/feature-bm/bd/bd.route.ts
 *
 * Or validate all route files:
 *   node check-routes.js --all
 */

const fs = require('fs');
const path = require('path');

// Rule IDs
const RULES = {
    ROUTE_001: 'ROUTE-001', // Route path missing module prefix
    ROUTE_002: 'ROUTE-002', // Component is not a Page
    ROUTE_003: 'ROUTE-003', // SubRoutes function incorrectly named
    ROUTE_004: 'ROUTE-004', // Route file in wrong location
    ROUTE_005: 'ROUTE-005', // Route prefix doesn't match file's module
    ROUTE_006: 'ROUTE-006', // Page component prefix doesn't match route prefix
    ROUTE_007: 'ROUTE-007', // Route path has leading slash
};

/**
 * Extract module alias from filename
 * e.g., 'bd.route.ts' -> 'bd'
 */
function extractModuleAlias(filePath) {
    const filename = path.basename(filePath);
    const match = filename.match(/^([a-z]{2})\.route\.ts$/);
    return match ? match[1] : null;
}

/**
 * Convert module alias to PascalCase
 * e.g., 'bd' -> 'Bd'
 */
function toPascalCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Parse route definitions from file content
 */
function parseRoutes(content) {
    const routes = [];

    // Match route objects: {path: '...', component: ...}
    const routeRegex = /\{\s*path\s*:\s*['"]([^'"]+)['"]\s*,\s*component\s*:\s*(\w+)\s*\}/g;
    let match;

    // Find line numbers for each route
    const lines = content.split('\n');

    while ((match = routeRegex.exec(content)) !== null) {
        const routePath = match[1];
        const component = match[2];

        // Find line number
        const beforeMatch = content.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;

        routes.push({
            path: routePath,
            component: component,
            line: lineNumber
        });
    }

    return routes;
}

/**
 * Check if SubRoutes function is correctly named
 */
function checkSubRoutesFunction(content, moduleAlias) {
    const expectedName = `${toPascalCase(moduleAlias)}SubRoutes`;
    const functionRegex = /export\s+function\s+(\w+)\s*\(\s*\)\s*:\s*Routes/;
    const match = content.match(functionRegex);

    if (!match) {
        return {
            found: false,
            actual: null,
            expected: expectedName
        };
    }

    return {
        found: true,
        actual: match[1],
        expected: expectedName,
        isCorrect: match[1] === expectedName
    };
}

/**
 * Validate a single route file
 */
function validateRouteFile(filePath) {
    const violations = [];

    // Check file exists
    if (!fs.existsSync(filePath)) {
        return {
            status: 'ERROR',
            file: filePath,
            error: 'File not found'
        };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const moduleAlias = extractModuleAlias(filePath);

    if (!moduleAlias) {
        violations.push({
            ruleId: RULES.ROUTE_004,
            line: 0,
            description: `Invalid route file name. Expected format: '<module-alias>.route.ts'`,
            suggestion: `Rename file to match pattern like 'bd.route.ts'`
        });

        return {
            status: 'FAILED',
            file: filePath,
            moduleAlias: null,
            violations
        };
    }

    // Check SubRoutes function naming
    const functionCheck = checkSubRoutesFunction(content, moduleAlias);
    if (functionCheck.found && !functionCheck.isCorrect) {
        // Find line number of function
        const lines = content.split('\n');
        let funcLine = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(`function ${functionCheck.actual}`)) {
                funcLine = i + 1;
                break;
            }
        }

        violations.push({
            ruleId: RULES.ROUTE_003,
            line: funcLine,
            description: `SubRoutes function named '${functionCheck.actual}' instead of '${functionCheck.expected}'`,
            suggestion: `Rename to '${functionCheck.expected}'`
        });
    }

    // Parse and validate routes
    const routes = parseRoutes(content);

    for (const route of routes) {
        const { path: routePath, component, line } = route;

        // ROUTE-007: Check for leading slash
        if (routePath.startsWith('/')) {
            violations.push({
                ruleId: RULES.ROUTE_007,
                line,
                description: `Route path '${routePath}' has leading slash`,
                suggestion: `Remove leading slash: '${routePath.substring(1)}'`
            });
        }

        // ROUTE-001: Check module prefix
        const expectedPrefix = `${moduleAlias}/`;
        const cleanPath = routePath.startsWith('/') ? routePath.substring(1) : routePath;

        if (!cleanPath.startsWith(expectedPrefix)) {
            violations.push({
                ruleId: RULES.ROUTE_001,
                line,
                description: `Route path '${routePath}' missing module prefix '${moduleAlias}/'`,
                suggestion: `Change to '${moduleAlias}/${cleanPath}'`
            });
        }

        // ROUTE-002: Check component is a Page
        if (component.endsWith('Component')) {
            const suggestedName = component.replace(/Component$/, 'Page');
            violations.push({
                ruleId: RULES.ROUTE_002,
                line,
                description: `Component '${component}' is not a Page (ends with 'Component')`,
                suggestion: `Rename to '${suggestedName}'`
            });
        } else if (!component.endsWith('Page')) {
            violations.push({
                ruleId: RULES.ROUTE_002,
                line,
                description: `Component '${component}' should end with 'Page'`,
                suggestion: `Rename to '${component}Page'`
            });
        }

        // ROUTE-005: Check route prefix matches module
        const pathPrefix = cleanPath.split('/')[0];
        if (pathPrefix !== moduleAlias) {
            violations.push({
                ruleId: RULES.ROUTE_005,
                line,
                description: `Route prefix '${pathPrefix}' doesn't match module '${moduleAlias}'`,
                suggestion: `Change route to start with '${moduleAlias}/'`
            });
        }

        // ROUTE-006: Check component prefix matches route prefix
        if (component.endsWith('Page')) {
            const expectedComponentPrefix = toPascalCase(moduleAlias);
            if (!component.startsWith(expectedComponentPrefix)) {
                const actualPrefix = component.match(/^([A-Z][a-z]+)/)?.[1] || '';
                violations.push({
                    ruleId: RULES.ROUTE_006,
                    line,
                    description: `Page component '${component}' prefix '${actualPrefix}' doesn't match route module '${moduleAlias}'`,
                    suggestion: `Component should start with '${expectedComponentPrefix}'`
                });
            }
        }
    }

    return {
        status: violations.length === 0 ? 'PASSED' : 'FAILED',
        file: filePath,
        moduleAlias,
        routeCount: routes.length,
        violations
    };
}

/**
 * Find all route files in the frontend directory
 */
function findAllRouteFiles(baseDir) {
    const routeFiles = [];

    function searchDir(dir) {
        if (!fs.existsSync(dir)) return;

        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                searchDir(fullPath);
            } else if (entry.isFile() && entry.name.match(/^[a-z]{2}\.route\.ts$/)) {
                routeFiles.push(fullPath);
            }
        }
    }

    searchDir(baseDir);
    return routeFiles;
}

/**
 * Main function
 */
function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage:');
        console.log('  node check-routes.js <path-to-route-file>');
        console.log('  node check-routes.js --all');
        console.log('');
        console.log('Examples:');
        console.log('  node check-routes.js ./frontend/features/feature-bm/bd/bd.route.ts');
        console.log('  node check-routes.js --all');
        process.exit(1);
    }

    let results = [];

    if (args[0] === '--all') {
        // Find frontend directory
        let frontendDir = './frontend';
        if (!fs.existsSync(frontendDir)) {
            frontendDir = '../frontend';
        }
        if (!fs.existsSync(frontendDir)) {
            // Try to find it relative to skill location
            const skillDir = __dirname;
            frontendDir = path.join(skillDir, '../../../../frontend');
        }

        if (!fs.existsSync(frontendDir)) {
            console.error('Could not find frontend directory');
            process.exit(1);
        }

        const routeFiles = findAllRouteFiles(frontendDir);

        if (routeFiles.length === 0) {
            console.log('No route files found');
            process.exit(0);
        }

        console.log(`Found ${routeFiles.length} route file(s)\n`);

        for (const file of routeFiles) {
            results.push(validateRouteFile(file));
        }
    } else {
        // Validate single file
        results.push(validateRouteFile(args[0]));
    }

    // Output results
    let hasFailures = false;

    for (const result of results) {
        if (result.status === 'FAILED' || result.status === 'ERROR') {
            hasFailures = true;
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log(`File: ${result.file}`);
        console.log(`Status: ${result.status}`);

        if (result.moduleAlias) {
            console.log(`Module: ${result.moduleAlias}`);
        }

        if (result.routeCount !== undefined) {
            console.log(`Routes: ${result.routeCount}`);
        }

        if (result.error) {
            console.log(`Error: ${result.error}`);
        }

        if (result.violations && result.violations.length > 0) {
            console.log(`\nViolations (${result.violations.length}):`);
            for (const v of result.violations) {
                console.log(`  [${v.ruleId}] Line ${v.line}: ${v.description}`);
                if (v.suggestion) {
                    console.log(`           Suggestion: ${v.suggestion}`);
                }
            }
        }
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('SUMMARY');
    console.log(`${'='.repeat(60)}`);

    const passed = results.filter(r => r.status === 'PASSED').length;
    const failed = results.filter(r => r.status === 'FAILED').length;
    const errors = results.filter(r => r.status === 'ERROR').length;

    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Errors: ${errors}`);
    console.log(`Total:  ${results.length}`);

    // JSON output for programmatic use
    if (args.includes('--json')) {
        console.log('\nJSON Output:');
        console.log(JSON.stringify(results, null, 2));
    }

    process.exit(hasFailures ? 1 : 0);
}

main();