#!/usr/bin/env node

/**
 * System Guidelines Validation Script
 *
 * Validates Angular code against Alpha Frontend architectural guidelines:
 * - Enums (naming, structure, folder organization)
 * - DTOs (naming, base classes, folder structure)
 * - Services (naming, registration, CRUD patterns)
 * - Components (standalone, file separation, selectors)
 *
 * Usage:
 *   node check-guidelines.js <file-or-directory>
 *   node check-guidelines.js src/features/feature-bm/bm/model/dto/entity/invoice/invoice.dto.ts
 *   node check-guidelines.js src/features/feature-bm/bm/
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

class GuidelinesValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.filesChecked = 0;
        this.violations = {
            enums: [],
            dtos: [],
            services: [],
            components: []
        };
    }

    /**
     * Main validation entry point
     */
    validate(targetPath) {
        console.log(`${colors.cyan}Starting validation of: ${targetPath}${colors.reset}\n`);

        if (!fs.existsSync(targetPath)) {
            this.addError(`Path does not exist: ${targetPath}`);
            return this.generateReport();
        }

        const stats = fs.statSync(targetPath);

        if (stats.isDirectory()) {
            this.validateDirectory(targetPath);
        } else if (stats.isFile()) {
            this.validateFile(targetPath);
        }

        return this.generateReport();
    }

    /**
     * Recursively validate directory
     */
    validateDirectory(dirPath) {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            // Skip node_modules, dist, etc.
            if (entry.isDirectory() && ['node_modules', 'dist', '.git'].includes(entry.name)) {
                continue;
            }

            if (entry.isDirectory()) {
                this.validateDirectory(fullPath);
            } else if (entry.isFile()) {
                this.validateFile(fullPath);
            }
        }
    }

    /**
     * Validate individual file based on type
     */
    validateFile(filePath) {
        const fileName = path.basename(filePath);

        if (fileName.endsWith('.enum.ts')) {
            this.validateEnum(filePath);
        } else if (fileName.endsWith('.dto.ts')) {
            this.validateDto(filePath);
        } else if (fileName.endsWith('.service.ts')) {
            this.validateService(filePath);
        } else if (fileName.endsWith('.component.ts')) {
            this.validateComponent(filePath);
        }
    }

    /**
     * Validate Enum file
     */
    validateEnum(filePath) {
        this.filesChecked++;
        const fileName = path.basename(filePath);
        const dirName = path.basename(path.dirname(filePath));
        const content = fs.readFileSync(filePath, 'utf8');

        const violations = [];

        // Check file naming convention (lowercase-with-hyphens.enum.ts)
        if (!/^[a-z][a-z0-9-]*\.enum\.ts$/.test(fileName)) {
            violations.push({
                rule: 'File naming convention',
                message: `File name must be lowercase-with-hyphens: ${fileName}`,
                fix: 'Rename to use lowercase letters with hyphens (e.g., customer-status.enum.ts)'
            });
        }

        // Check dedicated folder requirement
        const expectedFolderName = fileName.replace('.enum.ts', '');
        if (dirName !== expectedFolderName) {
            violations.push({
                rule: 'Dedicated folder requirement',
                message: `Enum must be in dedicated folder: ${dirName} !== ${expectedFolderName}`,
                fix: `Move to folder: ${expectedFolderName}/${fileName}`
            });
        }

        // Check visibility location (private-domain, protected-domain, public-domain)
        const fullPath = filePath.replace(/\\/g, '/');
        if (!fullPath.includes('/private-domain/enum/') &&
            !fullPath.includes('/protected-domain/enum/') &&
            !fullPath.includes('/public-domain/enum/')) {
            violations.push({
                rule: 'Enum location',
                message: 'Enum must be in private-domain/enum/, protected-domain/enum/, or public-domain/enum/',
                fix: 'Move to appropriate visibility folder under model/'
            });
        }

        // Check enum naming (PascalCase)
        const enumMatch = content.match(/export\s+enum\s+(\w+)/);
        if (enumMatch) {
            const enumName = enumMatch[1];
            if (!/^[A-Z][a-zA-Z0-9]*$/.test(enumName)) {
                violations.push({
                    rule: 'Enum name convention',
                    message: `Enum name must be PascalCase: ${enumName}`,
                    fix: 'Rename to PascalCase (e.g., CustomerStatus)'
                });
            }
        }

        // Check enum values (SCREAMING_SNAKE_CASE WITHOUT assignments)
        // First, check for any value assignments (string or numeric) - these are NOT allowed
        const assignmentMatches = content.matchAll(/^\s*(\w+)\s*=\s*(.+?)[,}]/gm);
        for (const match of assignmentMatches) {
            const valueName = match[1];
            const assignedValue = match[2].trim();

            violations.push({
                rule: 'No value assignments',
                message: `Enum values must not have assignments: ${valueName} = ${assignedValue}`,
                fix: `Remove assignment: change '${valueName} = ${assignedValue}' to just '${valueName},'`
            });
        }

        // Check enum value naming (SCREAMING_SNAKE_CASE)
        const enumValueNamesMatches = content.matchAll(/^\s*(\w+)\s*[,}]/gm);
        for (const match of enumValueNamesMatches) {
            const valueName = match[1];

            if (!/^[A-Z][A-Z0-9_]*$/.test(valueName)) {
                violations.push({
                    rule: 'Enum value naming',
                    message: `Enum value must be SCREAMING_SNAKE_CASE: ${valueName}`,
                    fix: 'Rename to SCREAMING_SNAKE_CASE (e.g., ACTIVE, IN_PROGRESS)'
                });
            }
        }

        // Check for export keyword
        if (!content.includes('export enum')) {
            violations.push({
                rule: 'Export requirement',
                message: 'Enum must be exported',
                fix: 'Add export keyword: export enum EnumName'
            });
        }

        if (violations.length > 0) {
            this.violations.enums.push({
                file: filePath,
                violations
            });
        }
    }

    /**
     * Validate DTO file
     */
    validateDto(filePath) {
        this.filesChecked++;
        const fileName = path.basename(filePath);
        const dirName = path.basename(path.dirname(filePath));
        const content = fs.readFileSync(filePath, 'utf8');

        const violations = [];

        // Check file naming convention
        if (!/^[a-z][a-z0-9-]*\.dto\.ts$/.test(fileName)) {
            violations.push({
                rule: 'File naming convention',
                message: `File name must be lowercase-with-hyphens: ${fileName}`,
                fix: 'Rename to use lowercase letters with hyphens (e.g., invoice.dto.ts)'
            });
        }

        // Check dedicated folder requirement
        const expectedFolderName = fileName.replace('.dto.ts', '');
        if (dirName !== expectedFolderName) {
            violations.push({
                rule: 'Dedicated folder requirement',
                message: `DTO must be in dedicated folder: ${dirName} !== ${expectedFolderName}`,
                fix: `Move to folder: ${expectedFolderName}/${fileName}`
            });
        }

        // Check location (entity or api)
        const fullPath = filePath.replace(/\\/g, '/');
        if (!fullPath.includes('/dto/entity/') && !fullPath.includes('/dto/api/')) {
            violations.push({
                rule: 'DTO location',
                message: 'DTO must be in model/dto/entity/ or model/dto/api/',
                fix: 'Move to appropriate category folder'
            });
        }

        // Check class naming (PascalCase with Dto suffix)
        const classMatch = content.match(/export\s+class\s+(\w+)/);
        if (classMatch) {
            const className = classMatch[1];
            if (!className.endsWith('Dto')) {
                violations.push({
                    rule: 'DTO class naming',
                    message: `DTO class must end with 'Dto': ${className}`,
                    fix: `Rename to ${className}Dto`
                });
            }
            if (!/^[A-Z][a-zA-Z0-9]*Dto$/.test(className)) {
                violations.push({
                    rule: 'DTO class naming convention',
                    message: `DTO class must be PascalCase: ${className}`,
                    fix: 'Rename to PascalCase with Dto suffix (e.g., InvoiceDto)'
                });
            }
        }

        // Check base class for entity DTOs
        if (fullPath.includes('/dto/entity/')) {
            if (!content.includes('extends DtoDetail') && !content.includes('extends DtoDetailConfigurable')) {
                violations.push({
                    rule: 'Entity DTO base class',
                    message: 'Entity DTO must extend DtoDetail or DtoDetailConfigurable',
                    fix: 'Add: extends DtoDetail or extends DtoDetailConfigurable'
                });
            }
        }

        // Check export keyword
        if (!content.includes('export class')) {
            violations.push({
                rule: 'Export requirement',
                message: 'DTO class must be exported',
                fix: 'Add export keyword: export class DtoName'
            });
        }

        if (violations.length > 0) {
            this.violations.dtos.push({
                file: filePath,
                violations
            });
        }
    }

    /**
     * Validate Service file
     */
    validateService(filePath) {
        this.filesChecked++;
        const fileName = path.basename(filePath);
        const dirName = path.basename(path.dirname(filePath));
        const content = fs.readFileSync(filePath, 'utf8');

        const violations = [];

        // Check file naming convention
        if (!/^[a-z][a-z0-9-]*\.service\.ts$/.test(fileName)) {
            violations.push({
                rule: 'File naming convention',
                message: `File name must be lowercase-with-hyphens: ${fileName}`,
                fix: 'Rename to use lowercase letters with hyphens (e.g., customer.service.ts)'
            });
        }

        // Check dedicated folder requirement
        const expectedFolderName = fileName.replace('.service.ts', '');
        if (dirName !== expectedFolderName) {
            violations.push({
                rule: 'Dedicated folder requirement',
                message: `Service must be in dedicated folder: ${dirName} !== ${expectedFolderName}`,
                fix: `Move to folder: ${expectedFolderName}/${fileName}`
            });
        }

        // Check location (api or domain)
        const fullPath = filePath.replace(/\\/g, '/');
        if (!fullPath.includes('/service/api/') && !fullPath.includes('/service/domain/')) {
            violations.push({
                rule: 'Service location',
                message: 'Service must be in service/api/ or service/domain/',
                fix: 'Move to appropriate service folder'
            });
        }

        // Check class naming (PascalCase with Service suffix)
        const classMatch = content.match(/export\s+class\s+(\w+)/);
        if (classMatch) {
            const className = classMatch[1];
            if (!className.endsWith('Service')) {
                violations.push({
                    rule: 'Service class naming',
                    message: `Service class must end with 'Service': ${className}`,
                    fix: `Rename to ${className}Service`
                });
            }
        }

        // Check Injectable decorator
        if (!content.includes('@Injectable')) {
            violations.push({
                rule: 'Injectable decorator',
                message: 'Service must have @Injectable decorator',
                fix: "Add: @Injectable({ providedIn: 'root' })"
            });
        }

        // Check providedIn: 'root'
        if (content.includes('@Injectable') && !content.includes("providedIn: 'root'")) {
            violations.push({
                rule: 'Service registration',
                message: "Service should use providedIn: 'root'",
                fix: "Change to: @Injectable({ providedIn: 'root' })"
            });
        }

        // Check CRUD service pattern
        if (content.includes('extends MvsCrudService')) {
            // Check getObjectComponent method
            if (!content.includes('getObjectComponent(')) {
                violations.push({
                    rule: 'CRUD service pattern',
                    message: 'CRUD service must implement getObjectComponent() method',
                    fix: 'Add getObjectComponent(mode: MvsCrudModeEnum): Type<any> method'
                });
            }
        }

        if (violations.length > 0) {
            this.violations.services.push({
                file: filePath,
                violations
            });
        }
    }

    /**
     * Validate Component file
     */
    validateComponent(filePath) {
        this.filesChecked++;
        const fileName = path.basename(filePath);
        const dirName = path.basename(path.dirname(filePath));
        const content = fs.readFileSync(filePath, 'utf8');

        const violations = [];

        // Check file naming convention
        if (!/^[a-z][a-z0-9-]*\.component\.ts$/.test(fileName)) {
            violations.push({
                rule: 'File naming convention',
                message: `File name must be lowercase-with-hyphens: ${fileName}`,
                fix: 'Rename to use lowercase letters with hyphens (e.g., customer-list.component.ts)'
            });
        }

        // Check dedicated folder requirement
        const expectedFolderName = fileName.replace('.component.ts', '');
        if (dirName !== expectedFolderName) {
            violations.push({
                rule: 'Dedicated folder requirement',
                message: `Component must be in dedicated folder: ${dirName} !== ${expectedFolderName}`,
                fix: `Move to folder: ${expectedFolderName}/${fileName}`
            });
        }

        // Check for corresponding HTML and SCSS files
        const htmlPath = filePath.replace('.component.ts', '.component.html');
        const scssPath = filePath.replace('.component.ts', '.component.scss');

        if (!fs.existsSync(htmlPath)) {
            violations.push({
                rule: 'File separation',
                message: `Missing HTML file: ${path.basename(htmlPath)}`,
                fix: `Create ${path.basename(htmlPath)} in the same folder`
            });
        }

        if (!fs.existsSync(scssPath)) {
            violations.push({
                rule: 'File separation',
                message: `Missing SCSS file: ${path.basename(scssPath)}`,
                fix: `Create ${path.basename(scssPath)} in the same folder`
            });
        }

        // CRITICAL: Check standalone: false
        if (content.includes('standalone: true')) {
            violations.push({
                rule: 'NgModule architecture (CRITICAL)',
                message: 'Component must use standalone: false (NgModule architecture)',
                fix: 'Change to: standalone: false'
            });
        }

        if (!content.includes('standalone:') && !content.includes('standalone ')) {
            violations.push({
                rule: 'Standalone declaration',
                message: 'Component must explicitly declare standalone: false',
                fix: 'Add: standalone: false to @Component decorator'
            });
        }

        // Check inline template/styles
        if (content.includes('template:') || content.includes('template :')) {
            violations.push({
                rule: 'No inline templates',
                message: 'Component must not use inline templates',
                fix: 'Move template to separate .component.html file'
            });
        }

        if (content.includes('styles:') || content.includes('styles :')) {
            violations.push({
                rule: 'No inline styles',
                message: 'Component must not use inline styles',
                fix: 'Move styles to separate .component.scss file'
            });
        }

        // Check selector format (mvs-module-name)
        const selectorMatch = content.match(/selector:\s*['"]([^'"]+)['"]/);
        if (selectorMatch) {
            const selector = selectorMatch[1];
            if (!selector.startsWith('mvs-')) {
                violations.push({
                    rule: 'Selector prefix',
                    message: `Selector must start with 'mvs-': ${selector}`,
                    fix: `Change to: mvs-${selector}`
                });
            }
        }

        // Check class naming (PascalCase with Component suffix)
        const classMatch = content.match(/export\s+class\s+(\w+)/);
        if (classMatch) {
            const className = classMatch[1];
            if (!className.endsWith('Component')) {
                violations.push({
                    rule: 'Component class naming',
                    message: `Component class must end with 'Component': ${className}`,
                    fix: `Rename to ${className}Component`
                });
            }
        }

        if (violations.length > 0) {
            this.violations.components.push({
                file: filePath,
                violations
            });
        }
    }

    /**
     * Generate validation report
     */
    generateReport() {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`${colors.cyan}Validation Report${colors.reset}`);
        console.log(`${'='.repeat(80)}\n`);

        console.log(`Files checked: ${colors.blue}${this.filesChecked}${colors.reset}\n`);

        let totalViolations = 0;
        const categories = ['enums', 'dtos', 'services', 'components'];

        categories.forEach(category => {
            const items = this.violations[category];
            if (items.length > 0) {
                const categoryViolations = items.reduce((sum, item) => sum + item.violations.length, 0);
                totalViolations += categoryViolations;

                console.log(`${colors.yellow}${category.toUpperCase()} Violations: ${categoryViolations}${colors.reset}`);
                console.log(`${'-'.repeat(80)}`);

                items.forEach(item => {
                    console.log(`\n${colors.red}✗${colors.reset} ${item.file}`);
                    item.violations.forEach(v => {
                        console.log(`  ${colors.yellow}[${v.rule}]${colors.reset}`);
                        console.log(`  ${colors.red}Problem:${colors.reset} ${v.message}`);
                        console.log(`  ${colors.green}Fix:${colors.reset} ${v.fix}`);
                    });
                });

                console.log('\n');
            }
        });

        console.log(`${'='.repeat(80)}`);
        if (totalViolations === 0) {
            console.log(`${colors.green}✓ All checks passed! No violations found.${colors.reset}`);
            return 0;
        } else {
            console.log(`${colors.red}✗ Total violations: ${totalViolations}${colors.reset}`);
            console.log(`${colors.yellow}Please fix the violations above to comply with system guidelines.${colors.reset}`);
            return 1;
        }
    }

    addError(message) {
        this.errors.push(message);
        console.error(`${colors.red}Error: ${message}${colors.reset}`);
    }
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`${colors.cyan}System Guidelines Validation Script${colors.reset}\n`);
        console.log('Usage:');
        console.log('  node check-guidelines.js <file-or-directory>');
        console.log('\nExamples:');
        console.log('  node check-guidelines.js src/features/feature-bm/bm/');
        console.log('  node check-guidelines.js src/features/feature-bm/bm/model/dto/entity/invoice/invoice.dto.ts');
        process.exit(1);
    }

    const targetPath = args[0];
    const validator = new GuidelinesValidator();
    const exitCode = validator.validate(targetPath);

    process.exit(exitCode);
}

module.exports = GuidelinesValidator;
