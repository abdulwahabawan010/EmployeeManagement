#!/usr/bin/env node

/**
 * Entity Registry Generator
 *
 * Scans backend Java entity files and extracts:
 * - Entity names and QL names (module.EntityName format)
 * - Fields with their types
 * - Relationships (@ManyToOne, @OneToOne) with join names for QL queries
 * - Reverse relationships (OneToMany) derived from other entities pointing back
 *
 * Usage:
 *   node generate-entity-registry.js [--backend-path <path>] [--output-dir <path>]
 *
 * Outputs:
 *   - entity-registry.json: Machine-readable registry
 *   - entity-registry.md: Human-readable documentation
 *
 * Relationship Types:
 *   - Direct (ManyToOne/OneToOne): Use field name as join name (e.g., 'customer')
 *   - Reverse (OneToMany): Use 'module.Entity#attributeName' format (e.g., 'bm.CustomerBillingAccountBalance#customerBillingAccount')
 *     Based on MetaService.deriveJoins(): join.setName(type.getAlias() + "#" + attribute.getName())
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DEFAULT_BACKEND_PATH = path.resolve(__dirname, '../../../../backend/src/main/java/com/mvs/backend');
const DEFAULT_OUTPUT_DIR = path.resolve(__dirname, '../data');

// Module code to module name mapping
const MODULE_NAMES = {
    'am': 'Agent Management',
    'as': 'Appointment Scheduling',
    'bm': 'Billing Management',
    'bd': 'Billing Dunning',
    'cc': 'Core Configuration',
    'ce': 'Condition Engine',
    'cf': 'Calculation/Formula',
    'cm': 'Contract Management',
    'cp': 'Commission/Provision',
    'cr': 'Customer Relationship',
    'ct': 'Contract Types',
    'ci': 'Contract Insurance',
    'dm': 'Document Management',
    'eu': 'End User',
    'ex': 'External API',
    'ha': 'Alpha Integration',
    'hb': 'Bipro Integration',
    'hc': 'Core Integration',
    'im': 'Import Management',
    'jb': 'Job/Batch Processing',
    'lg': 'Logic Module',
    'lm': 'Lead Management',
    'ns': 'Notification System',
    'ol': 'Outlet/CMS',
    'pc': 'Phone Call/Protocol',
    'pm': 'Person Management',
    'rp': 'Report Framework',
    'si': 'Search Index',
    'tm': 'Ticket Management',
    'te': 'Template Engine',
    'ui': 'UI Configuration',
    'um': 'User Management',
    'wf': 'Workflow Engine'
};

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    let backendPath = DEFAULT_BACKEND_PATH;
    let outputDir = DEFAULT_OUTPUT_DIR;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--backend-path' && args[i + 1]) {
            backendPath = path.resolve(args[i + 1]);
            i++;
        } else if (args[i] === '--output-dir' && args[i + 1]) {
            outputDir = path.resolve(args[i + 1]);
            i++;
        } else if (args[i] === '--help' || args[i] === '-h') {
            console.log(`
Entity Registry Generator

Usage:
  node generate-entity-registry.js [options]

Options:
  --backend-path <path>  Path to backend source (default: backend/src/main/java/com/mvs/backend)
  --output-dir <path>    Output directory for generated files (default: ../data)
  --help, -h             Show this help message
`);
            process.exit(0);
        }
    }

    return { backendPath, outputDir };
}

// Recursively find all Java files in a directory
function findJavaFiles(dir, files = []) {
    if (!fs.existsSync(dir)) {
        return files;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            findJavaFiles(fullPath, files);
        } else if (entry.isFile() && entry.name.endsWith('.java')) {
            files.push(fullPath);
        }
    }

    return files;
}

// Extract module code from path
function extractModuleCode(filePath, backendPath) {
    const relativePath = path.relative(backendPath, filePath);
    const parts = relativePath.split(path.sep);
    if (parts.length >= 1) {
        return parts[0]; // First directory is the module code
    }
    return null;
}

// Parse a single Java entity file
function parseEntityFile(filePath, moduleCode) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check if this is an entity class
    const entityMatch = content.match(/@Entity\s*\(\s*name\s*=\s*"([^"]+)"\s*\)/);
    if (!entityMatch) {
        return null;
    }

    const qlName = entityMatch[1]; // e.g., "bmInvoice"

    // Extract class name
    const classMatch = content.match(/public\s+class\s+(\w+)/);
    if (!classMatch) {
        return null;
    }
    const className = classMatch[1];

    // Extract table name if specified
    const tableMatch = content.match(/@Table\s*\([^)]*name\s*=\s*"([^"]+)"/);
    const tableName = tableMatch ? tableMatch[1] : null;

    // Extract sequence info
    const sequenceMatch = content.match(/@SequenceGenerator\s*\([^)]*name\s*=\s*"([^"]+)"/);
    const sequenceName = sequenceMatch ? sequenceMatch[1] : null;

    // Extract base class
    const extendsMatch = content.match(/extends\s+(\w+)/);
    const baseClass = extendsMatch ? extendsMatch[1] : null;

    // Extract fields and relationships
    const fields = [];
    const relationships = [];

    // Match field declarations with annotations
    // Look for patterns like:
    // @Column(name = "...") or @ManyToOne etc.
    // private Type fieldName;

    // Extract @ManyToOne relationships (these become join names in QL)
    // Pattern: @ManyToOne annotation followed by Type fieldName; (with optional private/protected)
    // The annotations may be in various orders, and fields might be package-private
    const manyToOneRegex = /@ManyToOne[^;]*?(\w+)\s+(\w+)\s*;/g;
    let match;

    while ((match = manyToOneRegex.exec(content)) !== null) {
        const targetType = match[1];
        const fieldName = match[2];

        // Skip if target type looks like an annotation parameter
        if (['optional', 'fetch', 'cascade', 'targetEntity'].includes(targetType.toLowerCase())) {
            continue;
        }

        // Look for @JoinColumn near this match
        const contextStart = Math.max(0, match.index - 300);
        const context = content.substring(contextStart, match.index + match[0].length);
        const joinColumnMatch = context.match(/@JoinColumn\s*\([^)]*name\s*=\s*"([^"]+)"/);
        const joinColumnName = joinColumnMatch ? joinColumnMatch[1] : null;

        relationships.push({
            type: 'ManyToOne',
            fieldName: fieldName,           // This is the join name for QL
            targetEntity: targetType,
            joinColumn: joinColumnName || `${fieldName}_id`
        });
    }

    // Extract @OneToOne relationships
    const oneToOneRegex = /@OneToOne[^;]*?(\w+)\s+(\w+)\s*;/g;

    while ((match = oneToOneRegex.exec(content)) !== null) {
        const targetType = match[1];
        const fieldName = match[2];

        // Skip if target type looks like an annotation parameter
        if (['optional', 'fetch', 'cascade', 'targetEntity', 'mappedBy'].includes(targetType.toLowerCase())) {
            continue;
        }

        // Look for @JoinColumn near this match
        const contextStart = Math.max(0, match.index - 300);
        const context = content.substring(contextStart, match.index + match[0].length);
        const joinColumnMatch = context.match(/@JoinColumn\s*\([^)]*name\s*=\s*"([^"]+)"/);
        const joinColumnName = joinColumnMatch ? joinColumnMatch[1] : null;

        relationships.push({
            type: 'OneToOne',
            fieldName: fieldName,           // This is the join name for QL
            targetEntity: targetType,
            joinColumn: joinColumnName || `${fieldName}_id`
        });
    }

    // Extract regular fields (non-relationship)
    const fieldRegex = /@Column\s*\([^)]*(?:name\s*=\s*"([^"]+)")?[^)]*\)\s*(?:private|protected)\s+(\w+(?:<[^>]+>)?)\s+(\w+)\s*;/g;

    while ((match = fieldRegex.exec(content)) !== null) {
        const columnName = match[1];
        const fieldType = match[2];
        const fieldName = match[3];

        // Skip if this is actually a relationship field
        const isRelationship = relationships.some(r => r.fieldName === fieldName);
        if (!isRelationship) {
            fields.push({
                name: fieldName,
                type: fieldType,
                columnName: columnName || fieldName
            });
        }
    }

    // Also extract fields without @Column annotation (basic fields)
    const basicFieldRegex = /(?<!@\w+[^;]*)\s+(?:private|protected)\s+(\w+(?:<[^>]+>)?)\s+(\w+)\s*;/g;

    while ((match = basicFieldRegex.exec(content)) !== null) {
        const fieldType = match[1];
        const fieldName = match[2];

        // Skip known non-field types and already captured fields
        const skipTypes = ['Supplier', 'Consumer', 'Function', 'Predicate'];
        if (skipTypes.includes(fieldType)) continue;

        const alreadyExists = fields.some(f => f.name === fieldName) ||
                             relationships.some(r => r.fieldName === fieldName);
        if (!alreadyExists && !fieldName.startsWith('serial')) {
            fields.push({
                name: fieldName,
                type: fieldType,
                columnName: null
            });
        }
    }

    // Extract enum fields (look for enum type references)
    const enumFieldRegex = /@Enumerated[^@]*?@Column\s*\([^)]*(?:name\s*=\s*"([^"]+)")?[^)]*\)\s*(?:private|protected)\s+(\w+)\s+(\w+)\s*;/g;

    while ((match = enumFieldRegex.exec(content)) !== null) {
        const columnName = match[1];
        const enumType = match[2];
        const fieldName = match[3];

        const existingField = fields.find(f => f.name === fieldName);
        if (existingField) {
            existingField.isEnum = true;
            existingField.enumType = enumType;
        } else {
            fields.push({
                name: fieldName,
                type: enumType,
                columnName: columnName || fieldName,
                isEnum: true
            });
        }
    }

    return {
        className: className,
        qlName: qlName,
        qlFullName: `${moduleCode}.${className}`,  // e.g., "bm.Invoice"
        moduleCode: moduleCode,
        moduleName: MODULE_NAMES[moduleCode] || moduleCode,
        tableName: tableName,
        sequenceName: sequenceName,
        baseClass: baseClass,
        filePath: filePath,
        fields: fields,
        relationships: relationships
    };
}

/**
 * Compute reverse relationships (OneToMany) for all entities.
 * For each entity, find all other entities that have a ManyToOne/OneToOne pointing to it.
 *
 * Based on MetaService.deriveJoins() logic (lines 264-280):
 *   join.setName(type.getAlias() + "#" + attribute.getName());
 *
 * Reverse join name format: '{sourceEntityQlName}#{attributeName}'
 * Example: 'bm.CustomerBillingAccountBalance#customerBillingAccount'
 *
 * @param {Array} entities - All parsed entities
 * @returns {Map} Map of entityClassName -> array of reverse relationships
 */
function computeReverseRelationships(entities) {
    // Build a map of className -> entity for quick lookup
    const entityByClassName = new Map();
    for (const entity of entities) {
        entityByClassName.set(entity.className, entity);
    }

    // Build a map of className -> array of reverse relationships
    const reverseRelationships = new Map();

    // Initialize empty arrays for all entities
    for (const entity of entities) {
        reverseRelationships.set(entity.className, []);
    }

    // For each entity, look at its relationships and add reverse entries to the target
    for (const sourceEntity of entities) {
        for (const rel of sourceEntity.relationships) {
            const targetClassName = rel.targetEntity;

            // Check if target entity exists in our registry
            if (entityByClassName.has(targetClassName)) {
                const targetEntity = entityByClassName.get(targetClassName);

                // Add reverse relationship to target entity
                // Format matches MetaService.deriveJoins(): type.getAlias() + "#" + attribute.getName()
                // Example: 'bm.CustomerBillingAccountBalance#customerBillingAccount'
                const reverseRels = reverseRelationships.get(targetClassName);
                const qlJoinName = `${sourceEntity.qlFullName}#${rel.fieldName}`;

                reverseRels.push({
                    type: 'OneToMany',
                    // QL join name: 'module.Entity#attributeName'
                    // This is the value to use in joins[].name
                    qlJoinName: qlJoinName,
                    // Source entity info
                    sourceEntity: sourceEntity.className,
                    sourceEntityQlName: sourceEntity.qlFullName,
                    // The attribute on the source that points to target
                    sourceAttribute: rel.fieldName,
                    // Original relationship type on source
                    sourceRelationType: rel.type
                });
            }
        }
    }

    return reverseRelationships;
}

// Generate JSON output
function generateJson(entities, reverseRelationships) {
    const totalReverseRels = [...reverseRelationships.values()].reduce((sum, arr) => sum + arr.length, 0);

    const registry = {
        generatedAt: new Date().toISOString(),
        version: '2.0.0',
        stats: {
            totalEntities: entities.length,
            totalModules: [...new Set(entities.map(e => e.moduleCode))].length,
            totalDirectRelationships: entities.reduce((sum, e) => sum + e.relationships.length, 0),
            totalReverseRelationships: totalReverseRels,
            totalRelationships: entities.reduce((sum, e) => sum + e.relationships.length, 0) + totalReverseRels
        },
        modules: {},
        entities: {}
    };

    // Group by module
    for (const entity of entities) {
        if (!registry.modules[entity.moduleCode]) {
            registry.modules[entity.moduleCode] = {
                name: entity.moduleName,
                entities: []
            };
        }
        registry.modules[entity.moduleCode].entities.push(entity.className);

        // Get reverse relationships for this entity
        const reverseRels = reverseRelationships.get(entity.className) || [];

        // Add to entities lookup
        registry.entities[entity.qlFullName] = {
            className: entity.className,
            qlName: entity.qlName,
            moduleCode: entity.moduleCode,
            baseClass: entity.baseClass,
            fields: entity.fields.map(f => f.name),
            // Direct relationships (ManyToOne, OneToOne) - use field name as join
            relationships: entity.relationships.map(r => ({
                joinName: r.fieldName,
                targetEntity: r.targetEntity,
                type: r.type
            })),
            // Reverse relationships (OneToMany) - use 'module.Entity#attributeName' format
            reverseRelationships: reverseRels.map(r => ({
                qlJoinName: r.qlJoinName,           // e.g., 'bm.CustomerBillingAccountBalance#customerBillingAccount'
                sourceEntity: r.sourceEntity,
                sourceEntityQlName: r.sourceEntityQlName,
                sourceAttribute: r.sourceAttribute,
                type: r.type
            }))
        };
    }

    // Sort module entities
    for (const mod of Object.values(registry.modules)) {
        mod.entities.sort();
    }

    return registry;
}

// Generate Markdown documentation
function generateMarkdown(entities, reverseRelationships) {
    const lines = [];
    const totalReverseRels = [...reverseRelationships.values()].reduce((sum, arr) => sum + arr.length, 0);

    lines.push('# Entity Registry');
    lines.push('');
    lines.push('> Auto-generated by `generate-entity-registry.js`');
    lines.push(`> Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('## Overview');
    lines.push('');

    const modules = [...new Set(entities.map(e => e.moduleCode))].sort();
    lines.push(`- **Total Entities:** ${entities.length}`);
    lines.push(`- **Total Modules:** ${modules.length}`);
    lines.push(`- **Direct Relationships (ManyToOne/OneToOne):** ${entities.reduce((sum, e) => sum + e.relationships.length, 0)}`);
    lines.push(`- **Reverse Relationships (OneToMany):** ${totalReverseRels}`);
    lines.push('');

    lines.push('## Quick Reference');
    lines.push('');
    lines.push('### QL Entity Names');
    lines.push('');
    lines.push('| Module | QL Name | Class Name |');
    lines.push('|--------|---------|------------|');

    const sortedEntities = [...entities].sort((a, b) =>
        a.qlFullName.localeCompare(b.qlFullName)
    );

    for (const entity of sortedEntities) {
        lines.push(`| ${entity.moduleCode} | \`${entity.qlFullName}\` | ${entity.className} |`);
    }
    lines.push('');

    lines.push('### Direct Join Names (ManyToOne/OneToOne)');
    lines.push('');
    lines.push('Use these field names directly as join names in QL queries.');
    lines.push('');
    lines.push('| Entity | Join Name | Target Entity | Type |');
    lines.push('|--------|-----------|---------------|------|');

    for (const entity of sortedEntities) {
        for (const rel of entity.relationships) {
            lines.push(`| ${entity.qlFullName} | \`${rel.fieldName}\` | ${rel.targetEntity} | ${rel.type} |`);
        }
    }
    lines.push('');

    lines.push('### Reverse Join Names (OneToMany)');
    lines.push('');
    lines.push('Use `module.Entity#attributeName` format for reverse relationships (entities pointing TO this entity).');
    lines.push('');
    lines.push('| Target Entity | QL Join Name | Source Entity | Source Attribute |');
    lines.push('|---------------|--------------|---------------|------------------|');

    for (const entity of sortedEntities) {
        const reverseRels = reverseRelationships.get(entity.className) || [];
        for (const rel of reverseRels) {
            lines.push(`| ${entity.qlFullName} | \`${rel.qlJoinName}\` | ${rel.sourceEntityQlName} | ${rel.sourceAttribute} |`);
        }
    }
    lines.push('');

    lines.push('## Entities by Module');
    lines.push('');

    // Group entities by module
    const byModule = {};
    for (const entity of entities) {
        if (!byModule[entity.moduleCode]) {
            byModule[entity.moduleCode] = [];
        }
        byModule[entity.moduleCode].push(entity);
    }

    for (const moduleCode of modules) {
        const moduleEntities = byModule[moduleCode].sort((a, b) =>
            a.className.localeCompare(b.className)
        );

        lines.push(`### ${moduleCode.toUpperCase()} - ${MODULE_NAMES[moduleCode] || moduleCode}`);
        lines.push('');

        for (const entity of moduleEntities) {
            const reverseRels = reverseRelationships.get(entity.className) || [];

            lines.push(`#### ${entity.className}`);
            lines.push('');
            lines.push(`- **QL Name:** \`${entity.qlFullName}\``);
            if (entity.baseClass) {
                lines.push(`- **Base Class:** ${entity.baseClass}`);
            }
            lines.push('');

            if (entity.relationships.length > 0) {
                lines.push('**Direct Relationships (Join Names):**');
                lines.push('');
                for (const rel of entity.relationships) {
                    lines.push(`- \`${rel.fieldName}\` → ${rel.targetEntity} (${rel.type})`);
                }
                lines.push('');
            }

            if (reverseRels.length > 0) {
                lines.push('**Reverse Relationships (OneToMany):**');
                lines.push('');
                for (const rel of reverseRels) {
                    lines.push(`- \`${rel.qlJoinName}\` ← ${rel.sourceEntityQlName}.${rel.sourceAttribute}`);
                }
                lines.push('');
            }

            if (entity.fields.length > 0) {
                lines.push('<details>');
                lines.push('<summary>Fields</summary>');
                lines.push('');
                for (const field of entity.fields.slice(0, 20)) { // Limit to first 20
                    const typeInfo = field.isEnum ? `${field.type} (enum)` : field.type;
                    lines.push(`- \`${field.name}\`: ${typeInfo}`);
                }
                if (entity.fields.length > 20) {
                    lines.push(`- ... and ${entity.fields.length - 20} more fields`);
                }
                lines.push('');
                lines.push('</details>');
                lines.push('');
            }
        }
    }

    lines.push('## Usage in QL Queries');
    lines.push('');
    lines.push('### Entity Reference');
    lines.push('');
    lines.push('```typescript');
    lines.push('// Use the QL full name format: module.EntityName');
    lines.push('start: {');
    lines.push('  type: \'entity\',');
    lines.push('  name: \'bm.Invoice\',  // From QL Name column');
    lines.push('  as: \'e\'');
    lines.push('}');
    lines.push('```');
    lines.push('');
    lines.push('### Direct Join (ManyToOne/OneToOne)');
    lines.push('');
    lines.push('```typescript');
    lines.push('// Use the relationship field name as the join name');
    lines.push('joins: [');
    lines.push('  {');
    lines.push('    type: \'entity\',');
    lines.push('    name: \'customer\',  // Direct relationship field name');
    lines.push('    as: \'c\',');
    lines.push('    joinType: \'left\'');
    lines.push('  }');
    lines.push(']');
    lines.push('```');
    lines.push('');
    lines.push('### Reverse Join (OneToMany)');
    lines.push('');
    lines.push('```typescript');
    lines.push('// Use module.Entity#attributeName format for reverse relationships');
    lines.push('// Based on MetaService.deriveJoins(): type.getAlias() + "#" + attribute.getName()');
    lines.push('// Example: CustomerBillingAccount has reverse rel to CustomerBillingAccountBalance');
    lines.push('joins: [');
    lines.push('  {');
    lines.push('    type: \'entity\',');
    lines.push('    name: \'bm.CustomerBillingAccountBalance#customerBillingAccount\',  // Entities pointing TO this one');
    lines.push('    as: \'bal\',');
    lines.push('    joinType: \'left\',');
    lines.push('    onlyFirst: true  // Often used with reverse joins to get single record');
    lines.push('  }');
    lines.push(']');
    lines.push('```');
    lines.push('');

    return lines.join('\n');
}

// Main execution
function main() {
    const { backendPath, outputDir } = parseArgs();

    console.log('Entity Registry Generator');
    console.log('=========================');
    console.log(`Backend path: ${backendPath}`);
    console.log(`Output directory: ${outputDir}`);
    console.log('');

    if (!fs.existsSync(backendPath)) {
        console.error(`Error: Backend path does not exist: ${backendPath}`);
        process.exit(1);
    }

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Find all modules (directories in backend path)
    const moduleEntries = fs.readdirSync(backendPath, { withFileTypes: true });
    const modules = moduleEntries
        .filter(e => e.isDirectory() && e.name.length === 2)
        .map(e => e.name);

    console.log(`Found ${modules.length} modules: ${modules.join(', ')}`);
    console.log('');

    // Scan each module for entity files
    const allEntities = [];

    for (const moduleCode of modules) {
        const modelPath = path.join(backendPath, moduleCode, 'model');
        const javaFiles = findJavaFiles(modelPath);

        let moduleEntityCount = 0;
        for (const file of javaFiles) {
            const entity = parseEntityFile(file, moduleCode);
            if (entity) {
                allEntities.push(entity);
                moduleEntityCount++;
            }
        }

        if (moduleEntityCount > 0) {
            console.log(`  ${moduleCode}: ${moduleEntityCount} entities`);
        }
    }

    console.log('');
    console.log(`Total entities found: ${allEntities.length}`);

    // Compute reverse relationships (OneToMany)
    console.log('Computing reverse relationships...');
    const reverseRelationships = computeReverseRelationships(allEntities);
    const totalReverseRels = [...reverseRelationships.values()].reduce((sum, arr) => sum + arr.length, 0);
    console.log(`  Direct relationships: ${allEntities.reduce((sum, e) => sum + e.relationships.length, 0)}`);
    console.log(`  Reverse relationships: ${totalReverseRels}`);
    console.log('');

    // Generate outputs
    const jsonRegistry = generateJson(allEntities, reverseRelationships);
    const jsonPath = path.join(outputDir, 'entity-registry.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonRegistry, null, 2));
    console.log(`Generated: ${jsonPath}`);

    const markdown = generateMarkdown(allEntities, reverseRelationships);
    const mdPath = path.join(outputDir, 'entity-registry.md');
    fs.writeFileSync(mdPath, markdown);
    console.log(`Generated: ${mdPath}`);

    console.log('');
    console.log('Done!');
}

main();
