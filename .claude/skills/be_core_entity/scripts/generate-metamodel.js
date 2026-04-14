#!/usr/bin/env node

/**
 * JPA Metamodel Generator
 *
 * Generates static metamodel classes for JPA entities without requiring a build.
 * Replaces the need for hibernate-jpamodelgen annotation processor.
 *
 * Usage:
 *   node generate-metamodel.js [options]
 *
 * Options:
 *   --backend-path <path>   Path to backend source (default: backend/src/main/java/com/mvs/backend)
 *   --module <code>         Generate only for specific module (e.g., 'bm', 'pm')
 *   --entity <name>         Generate only for specific entity (e.g., 'Person')
 *   --force                 Overwrite existing metamodel classes
 *   --dry-run               Show what would be generated without writing files
 *   --no-inherited          Exclude fields from base classes
 *   --help, -h              Show help message
 *
 * Output:
 *   Generated classes are placed in {module}/model/desc/{EntityName}_.java
 *
 * @generated
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_BACKEND_PATH = path.resolve(__dirname, '../../../../backend/src/main/java/com/mvs/backend');

// Module codes that are valid
const VALID_MODULE_CODES = [
    'ad', 'am', 'ap', 'as', 'bd', 'bm', 'ca', 'cb', 'cc', 'cd', 'ce', 'cf', 'ci', 'cm',
    'co', 'cp', 'cr', 'ct', 'dc', 'dm', 'ea', 'ei', 'em', 'eu', 'ex', 'ha', 'hb', 'hc',
    'ig', 'im', 'jb', 'lg', 'lm', 'ns', 'ol', 'pc', 'pm', 'rp', 'sg', 'si', 'te',
    'tm', 'uf', 'ui', 'um', 'wf', 'xx'
];

// Base class inheritance chain with their fields
const BASE_CLASS_FIELDS = {
    'EntityBase': [],
    'AuditableEntity': [
        'createdBy',
        'createdDate',
        'lastModifiedBy',
        'lastModifiedDate'
    ],
    'AuditableDateEntity': [
        'createdBy',
        'createdDate',
        'lastModifiedBy',
        'lastModifiedDate'
    ],
    'AuditableActivityEntity': [
        'createdBy',
        'createdDate',
        'lastModifiedBy',
        'lastModifiedDate',
        'activityContext'
    ],
    'ConfigurableEntity': [
        'createdBy',
        'createdDate',
        'lastModifiedBy',
        'lastModifiedDate',
        'activityContext',
        'image',
        'rgbaColor',
        'rgbaColorBackground'
    ]
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert camelCase to SCREAMING_SNAKE_CASE
 */
function toScreamingSnakeCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .toUpperCase();
}

/**
 * Get inherited fields for a base class
 */
function getInheritedFields(baseClass) {
    return BASE_CLASS_FIELDS[baseClass] || [];
}

/**
 * Get the parent class name for grouping inherited fields
 */
function getParentClassName(baseClass) {
    switch (baseClass) {
        case 'ConfigurableEntity':
            return 'ConfigurableEntity';
        case 'AuditableActivityEntity':
            return 'AuditableActivityEntity';
        case 'AuditableEntity':
        case 'AuditableDateEntity':
            return 'AuditableEntity';
        default:
            return null;
    }
}

// ============================================================================
// FILE DISCOVERY
// ============================================================================

/**
 * Find all Java files in a directory recursively
 */
function findJavaFiles(dir, files = []) {
    if (!fs.existsSync(dir)) {
        return files;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            // Skip desc directories (our output)
            if (entry.name !== 'desc') {
                findJavaFiles(fullPath, files);
            }
        } else if (entry.isFile() && entry.name.endsWith('.java')) {
            files.push(fullPath);
        }
    }

    return files;
}

/**
 * Check if a file contains an @Entity annotation
 */
function isEntityFile(content) {
    return /@Entity\s*\(/.test(content);
}

// ============================================================================
// ENTITY PARSING
// ============================================================================

/**
 * Parse an entity file and extract metadata
 */
function parseEntityFile(filePath, moduleCode) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check if this is an entity class
    if (!isEntityFile(content)) {
        return null;
    }

    // Extract entity QL name
    const entityMatch = content.match(/@Entity\s*\(\s*name\s*=\s*"([^"]+)"\s*\)/);
    if (!entityMatch) {
        return null;
    }
    const qlName = entityMatch[1];

    // Extract class name
    const classMatch = content.match(/public\s+class\s+(\w+)/);
    if (!classMatch) {
        return null;
    }
    const className = classMatch[1];

    // Extract package name
    const packageMatch = content.match(/package\s+([\w.]+)\s*;/);
    if (!packageMatch) {
        return null;
    }
    const packageName = packageMatch[1];

    // Extract base class
    const extendsMatch = content.match(/extends\s+(\w+)/);
    const baseClass = extendsMatch ? extendsMatch[1] : null;

    // Extract all fields
    const fields = extractFields(content);

    return {
        className,
        packageName,
        qlName,
        baseClass,
        moduleCode,
        filePath,
        fields
    };
}

/**
 * Extract all field names from entity content
 */
function extractFields(content) {
    const fields = new Set();

    // Remove comments to avoid false matches
    const cleanContent = content
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');

    // Pattern 1: Fields with annotations (most common)
    // Matches: @Something... Type fieldName;
    const annotatedFieldRegex = /(?:@\w+[^;]*?\s+)+(?:private|protected|public)?\s*(\w+(?:<[^>]+>)?)\s+(\w+)\s*(?:=|;)/g;
    let match;
    while ((match = annotatedFieldRegex.exec(cleanContent)) !== null) {
        const fieldName = match[2];
        // Skip static fields, constants, and serialization fields
        if (!fieldName.match(/^[A-Z_]+$/) && !fieldName.startsWith('serial')) {
            fields.add(fieldName);
        }
    }

    // Pattern 2: Simple private/protected fields without annotations
    const simpleFieldRegex = /^\s*(?:private|protected)\s+(\w+(?:<[^>]+>)?)\s+(\w+)\s*;/gm;
    while ((match = simpleFieldRegex.exec(cleanContent)) !== null) {
        const fieldName = match[2];
        if (!fieldName.match(/^[A-Z_]+$/) && !fieldName.startsWith('serial')) {
            fields.add(fieldName);
        }
    }

    // Pattern 3: Package-private fields (no modifier)
    // Look for lines that start with a type and field name
    const packagePrivateRegex = /^\s+(\w+(?:<[^>]+>)?)\s+(\w+)\s*;/gm;
    while ((match = packagePrivateRegex.exec(cleanContent)) !== null) {
        const type = match[1];
        const fieldName = match[2];
        // Skip method parameters, local variables, and constants
        if (!type.match(/^(if|for|while|switch|return|new|throw|catch)$/) &&
            !fieldName.match(/^[A-Z_]+$/) &&
            !fieldName.startsWith('serial') &&
            type.match(/^[A-Z]/)) { // Type should start with uppercase
            fields.add(fieldName);
        }
    }

    return Array.from(fields).sort();
}

// ============================================================================
// CODE GENERATION
// ============================================================================

/**
 * Generate metamodel class content
 */
function generateMetamodelClass(entity, includeInherited) {
    const lines = [];

    // Package declaration
    lines.push(`package ${entity.packageName}.desc;`);
    lines.push('');

    // Javadoc
    lines.push('/**');
    lines.push(` * JPA Metamodel for {@link ${entity.packageName}.${entity.className}}`);
    lines.push(' *');
    lines.push(' * @generated by generate-metamodel.js');
    lines.push(' */');

    // Class declaration
    lines.push(`public abstract class ${entity.className}_ {`);

    // Entity's own fields
    if (entity.fields.length > 0) {
        for (const field of entity.fields) {
            const constant = toScreamingSnakeCase(field);
            lines.push(`    public static final String ${constant} = "${field}";`);
        }
    }

    // Inherited fields
    if (includeInherited && entity.baseClass) {
        const inheritedFields = getInheritedFields(entity.baseClass);
        const parentClass = getParentClassName(entity.baseClass);

        if (inheritedFields.length > 0 && parentClass) {
            // Filter out fields that are already defined in the entity
            const uniqueInheritedFields = inheritedFields.filter(f => !entity.fields.includes(f));

            if (uniqueInheritedFields.length > 0) {
                lines.push('');
                lines.push(`    // Inherited from ${parentClass}`);
                for (const field of uniqueInheritedFields) {
                    const constant = toScreamingSnakeCase(field);
                    lines.push(`    public static final String ${constant} = "${field}";`);
                }
            }
        }
    }

    lines.push('}');

    return lines.join('\n');
}

/**
 * Write metamodel file to disk
 */
function writeMetamodelFile(entity, content, options) {
    // Build output path: backend/src/main/java/{packagePath}/desc/{ClassName}_.java
    const packagePath = entity.packageName.replace(/\./g, '/');
    // Go up from backendPath (com/mvs/backend) to java/, then add package path with desc
    const javaDir = path.join(options.backendPath, '..', '..', '..');
    const outputDir = path.join(javaDir, packagePath, 'desc');
    const outputFile = path.join(outputDir, `${entity.className}_.java`);

    // Check if file already exists
    const exists = fs.existsSync(outputFile);
    if (exists && !options.force) {
        return { status: 'skip', path: outputFile, reason: 'exists' };
    }

    if (options.dryRun) {
        return { status: 'would_create', path: outputFile };
    }

    // Create desc directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(outputFile, content);

    return { status: exists ? 'overwrite' : 'create', path: outputFile };
}

// ============================================================================
// CLI
// ============================================================================

function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        backendPath: DEFAULT_BACKEND_PATH,
        module: null,
        entity: null,
        force: false,
        dryRun: false,
        includeInherited: true,
        help: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--help' || arg === '-h') {
            options.help = true;
        } else if (arg === '--backend-path' && args[i + 1]) {
            options.backendPath = path.resolve(args[i + 1]);
            i++;
        } else if (arg === '--module' && args[i + 1]) {
            options.module = args[i + 1];
            i++;
        } else if (arg === '--entity' && args[i + 1]) {
            options.entity = args[i + 1];
            i++;
        } else if (arg === '--force') {
            options.force = true;
        } else if (arg === '--dry-run') {
            options.dryRun = true;
        } else if (arg === '--no-inherited') {
            options.includeInherited = false;
        }
    }

    return options;
}

function printHelp() {
    console.log(`
JPA Metamodel Generator

Generates static metamodel classes for JPA entities without requiring a build.

Usage:
  node generate-metamodel.js [options]

Options:
  --backend-path <path>   Path to backend source
                          (default: backend/src/main/java/com/mvs/backend)
  --module <code>         Generate only for specific module (e.g., 'bm', 'pm')
  --entity <name>         Generate only for specific entity (e.g., 'Person')
  --force                 Overwrite existing metamodel classes
  --dry-run               Show what would be generated without writing files
  --no-inherited          Exclude fields from base classes
  --help, -h              Show this help message

Examples:
  # Generate all missing metamodel classes
  node generate-metamodel.js

  # Preview what would be generated
  node generate-metamodel.js --dry-run

  # Generate for specific module
  node generate-metamodel.js --module pm

  # Force regenerate all for a module
  node generate-metamodel.js --module bm --force

  # Generate for specific entity
  node generate-metamodel.js --entity Person
`);
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
    const options = parseArgs();

    if (options.help) {
        printHelp();
        process.exit(0);
    }

    // Colors for output
    const c = {
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        cyan: '\x1b[36m',
        dim: '\x1b[2m',
        reset: '\x1b[0m',
        bold: '\x1b[1m'
    };

    console.log();
    console.log(c.bold + 'JPA Metamodel Generator' + c.reset);
    console.log('=======================');
    console.log(`Backend: ${options.backendPath}`);
    if (options.module) {
        console.log(`Module filter: ${options.module}`);
    }
    if (options.entity) {
        console.log(`Entity filter: ${options.entity}`);
    }
    if (options.dryRun) {
        console.log(c.yellow + 'DRY RUN - no files will be written' + c.reset);
    }
    if (options.force) {
        console.log(c.yellow + 'FORCE - existing files will be overwritten' + c.reset);
    }
    console.log();

    // Validate backend path
    if (!fs.existsSync(options.backendPath)) {
        console.error(`Error: Backend path does not exist: ${options.backendPath}`);
        process.exit(1);
    }

    // Discover modules
    const moduleEntries = fs.readdirSync(options.backendPath, { withFileTypes: true });
    let modules = moduleEntries
        .filter(e => e.isDirectory() && VALID_MODULE_CODES.includes(e.name))
        .map(e => e.name);

    // Apply module filter
    if (options.module) {
        if (!VALID_MODULE_CODES.includes(options.module)) {
            console.error(`Error: Unknown module code: ${options.module}`);
            process.exit(1);
        }
        modules = modules.filter(m => m === options.module);
    }

    // Statistics
    const stats = {
        scanned: 0,
        created: 0,
        overwritten: 0,
        skipped: 0,
        errors: 0
    };

    // Process each module
    for (const moduleCode of modules.sort()) {
        const modelPath = path.join(options.backendPath, moduleCode, 'model');

        if (!fs.existsSync(modelPath)) {
            continue;
        }

        const javaFiles = findJavaFiles(modelPath);
        const moduleEntities = [];

        for (const file of javaFiles) {
            const entity = parseEntityFile(file, moduleCode);
            if (entity) {
                // Apply entity filter
                if (options.entity && entity.className !== options.entity) {
                    continue;
                }
                moduleEntities.push(entity);
            }
        }

        if (moduleEntities.length === 0) {
            continue;
        }

        console.log(`Processing ${c.bold}${moduleCode}${c.reset} module...`);

        for (const entity of moduleEntities.sort((a, b) => a.className.localeCompare(b.className))) {
            stats.scanned++;

            try {
                const content = generateMetamodelClass(entity, options.includeInherited);
                const result = writeMetamodelFile(entity, content, options);

                const fieldCount = entity.fields.length;
                const inheritedCount = options.includeInherited && entity.baseClass
                    ? getInheritedFields(entity.baseClass).filter(f => !entity.fields.includes(f)).length
                    : 0;
                const totalFields = fieldCount + inheritedCount;

                switch (result.status) {
                    case 'create':
                        console.log(`  ${c.green}[NEW]${c.reset} ${entity.className}_ (${totalFields} fields)`);
                        stats.created++;
                        break;
                    case 'overwrite':
                        console.log(`  ${c.yellow}[UPD]${c.reset} ${entity.className}_ (${totalFields} fields)`);
                        stats.overwritten++;
                        break;
                    case 'skip':
                        console.log(`  ${c.dim}[SKIP]${c.reset} ${entity.className}_ (exists)`);
                        stats.skipped++;
                        break;
                    case 'would_create':
                        console.log(`  ${c.cyan}[WOULD CREATE]${c.reset} ${entity.className}_ (${totalFields} fields)`);
                        stats.created++;
                        break;
                }
            } catch (error) {
                console.log(`  [ERROR] ${entity.className}_: ${error.message}`);
                stats.errors++;
            }
        }
    }

    // Summary
    console.log();
    console.log(c.bold + 'Summary:' + c.reset);
    console.log(`  Entities scanned: ${stats.scanned}`);
    console.log(`  ${c.green}Generated:${c.reset}         ${stats.created}`);
    if (stats.overwritten > 0) {
        console.log(`  ${c.yellow}Overwritten:${c.reset}       ${stats.overwritten}`);
    }
    console.log(`  ${c.dim}Skipped:${c.reset}           ${stats.skipped}`);
    if (stats.errors > 0) {
        console.log(`  Errors:            ${stats.errors}`);
    }
    console.log();

    if (options.dryRun) {
        console.log(c.yellow + 'This was a dry run. Run without --dry-run to generate files.' + c.reset);
    } else if (stats.created > 0 || stats.overwritten > 0) {
        console.log(c.green + 'Done!' + c.reset);
    } else {
        console.log('No files were generated. Use --force to regenerate existing files.');
    }
}

main();
