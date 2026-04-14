#!/usr/bin/env python3
"""
CB Technical Documentation Validation Script

This script validates the quality and correctness of CB technical documentation
before uploading to the API. It checks for:
- Required fields presence
- Data type correctness
- Length constraints
- Cross-reference validity
- Format compliance

Usage:
    python validate_documentation.py --module <alias>
    python validate_documentation.py --all
    python validate_documentation.py --all --fix

Options:
    --module <alias>    Validate specific module
    --all               Validate all modules
    --fix               Auto-fix common issues
    --strict            Fail on warnings (not just errors)
    --output <format>   Output format: text, json, html (default: text)
    --verbose           Show detailed progress
"""

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Any, Set, Tuple

# Determine paths
SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_DIR = SCRIPT_DIR.parent
PROJECT_ROOT = SKILL_DIR.parent.parent.parent
CB_DIR = PROJECT_ROOT / ".cb"
MODULES_DIR = CB_DIR / "modules"


class Severity(Enum):
    """Issue severity levels."""
    ERROR = "ERROR"      # Must fix before upload
    WARNING = "WARNING"  # Should fix, may upload with caution
    INFO = "INFO"        # Informational, cosmetic issue


@dataclass
class ValidationIssue:
    """Represents a validation issue found in documentation."""
    file_path: str
    doc_type: str
    severity: Severity
    category: str
    field: str
    message: str
    suggestion: Optional[str] = None
    auto_fixable: bool = False
    fix_function: Optional[str] = None

    def to_dict(self) -> Dict:
        return {
            "file_path": self.file_path,
            "doc_type": self.doc_type,
            "severity": self.severity.value,
            "category": self.category,
            "field": self.field,
            "message": self.message,
            "suggestion": self.suggestion,
            "auto_fixable": self.auto_fixable
        }


@dataclass
class ValidationResult:
    """Results of validating a module."""
    module_alias: str
    total_files: int = 0
    valid_files: int = 0
    issues: List[ValidationIssue] = field(default_factory=list)
    duration_seconds: float = 0.0

    @property
    def errors(self) -> List[ValidationIssue]:
        return [i for i in self.issues if i.severity == Severity.ERROR]

    @property
    def warnings(self) -> List[ValidationIssue]:
        return [i for i in self.issues if i.severity == Severity.WARNING]

    @property
    def infos(self) -> List[ValidationIssue]:
        return [i for i in self.issues if i.severity == Severity.INFO]

    @property
    def is_valid(self) -> bool:
        return len(self.errors) == 0

    def add(self, other: 'ValidationResult') -> 'ValidationResult':
        """Merge another result into this one."""
        self.total_files += other.total_files
        self.valid_files += other.valid_files
        self.issues.extend(other.issues)
        return self


class DocumentationValidator:
    """Validates CB technical documentation files."""

    # Validation rules
    REQUIRED_FIELDS = {
        "module": ["purpose", "businessDescription", "technicalDescription"],
        "entity": ["purpose", "businessDescription", "technicalDescription"],
        "attribute": ["purpose", "businessDescription", "technicalDescription"],
        "attributeValue": ["purpose", "businessDescription", "technicalDescription"]
    }

    FIELD_MAX_LENGTHS = {
        "module.purpose": 200,
        "entity.purpose": 200,
        "attribute.purpose": 200,
        "attributeValue.purpose": 200
    }

    FIELD_MIN_LENGTHS = {
        "module.purpose": 10,
        "module.businessDescription": 50,
        "module.technicalDescription": 50,
        "entity.purpose": 10,
        "entity.businessDescription": 30,
        "entity.technicalDescription": 30,
        "attribute.purpose": 5,
        "attribute.businessDescription": 10,
        "attribute.technicalDescription": 10
    }

    # Patterns for validation
    ENTITY_ALIAS_PATTERN = re.compile(r'^[a-z]{2,}\.[A-Z][a-zA-Z0-9]*$')
    MODULE_ALIAS_PATTERN = re.compile(r'^[a-z]{2,}$')
    ATTRIBUTE_NAME_PATTERN = re.compile(r'^[a-z][a-zA-Z0-9]*$')

    # English language detection (basic)
    ENGLISH_WORDS = {
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "with", "by", "from", "about", "as", "into", "through", "during",
        "before", "after", "above", "below", "between", "under", "again",
        "management", "system", "module", "entity", "attribute", "data", "user",
        "customer", "agent", "contract", "status", "type", "value", "configuration"
    }

    def __init__(self, strict: bool = False, verbose: bool = False):
        self.strict = strict
        self.verbose = verbose
        self.fix_count = 0

    def validate_module(self, module_alias: str) -> ValidationResult:
        """Validate all documentation for a module."""
        result = ValidationResult(module_alias=module_alias)
        start_time = datetime.now()

        doc_dir = MODULES_DIR / module_alias / "documentation"
        if not doc_dir.exists():
            result.issues.append(ValidationIssue(
                file_path=str(doc_dir),
                doc_type="directory",
                severity=Severity.ERROR,
                category="structure",
                field="documentation",
                message=f"Documentation directory not found: {doc_dir}",
                suggestion="Run generate_documentation.py for this module first"
            ))
            result.duration_seconds = (datetime.now() - start_time).total_seconds()
            return result

        # Validate module documentation
        module_file = doc_dir / "module.json"
        if module_file.exists():
            result.total_files += 1
            result.issues.extend(self._validate_file(module_file, "module"))
            if not any(i.file_path == str(module_file) and i.severity == Severity.ERROR for i in result.issues):
                result.valid_files += 1
        else:
            result.issues.append(ValidationIssue(
                file_path=str(module_file),
                doc_type="module",
                severity=Severity.ERROR,
                category="missing",
                field="file",
                message="Module documentation file not found",
                suggestion="Create module.json documentation"
            ))
            result.total_files += 1

        # Validate entity documentation
        entities_dir = doc_dir / "entities"
        if entities_dir.exists():
            for json_file in sorted(entities_dir.glob("*.json")):
                result.total_files += 1
                file_issues = self._validate_file(json_file, "entity")
                result.issues.extend(file_issues)
                if not any(i.severity == Severity.ERROR for i in file_issues):
                    result.valid_files += 1

        # Validate attribute documentation
        attributes_dir = doc_dir / "attributes"
        if attributes_dir.exists():
            for json_file in sorted(attributes_dir.glob("*.json")):
                result.total_files += 1
                file_issues = self._validate_file(json_file, "attribute")
                result.issues.extend(file_issues)
                if not any(i.severity == Severity.ERROR for i in file_issues):
                    result.valid_files += 1

        # Validate attribute value documentation
        values_dir = doc_dir / "attribute_values"
        if values_dir.exists():
            for json_file in sorted(values_dir.glob("*.json")):
                result.total_files += 1
                file_issues = self._validate_file(json_file, "attributeValue")
                result.issues.extend(file_issues)
                if not any(i.severity == Severity.ERROR for i in file_issues):
                    result.valid_files += 1

        result.duration_seconds = (datetime.now() - start_time).total_seconds()
        return result

    def _validate_file(self, file_path: Path, expected_doc_type: str) -> List[ValidationIssue]:
        """Validate a single documentation file."""
        issues = []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = json.load(f)
        except json.JSONDecodeError as e:
            issues.append(ValidationIssue(
                file_path=str(file_path),
                doc_type=expected_doc_type,
                severity=Severity.ERROR,
                category="json",
                field="format",
                message=f"Invalid JSON: {e}",
                suggestion="Fix JSON syntax errors"
            ))
            return issues
        except Exception as e:
            issues.append(ValidationIssue(
                file_path=str(file_path),
                doc_type=expected_doc_type,
                severity=Severity.ERROR,
                category="file",
                field="read",
                message=f"Cannot read file: {e}",
                suggestion="Check file permissions and encoding"
            ))
            return issues

        # Check metadata
        metadata = content.get("metadata", {})
        data = content.get("data", content)

        issues.extend(self._validate_metadata(file_path, metadata, expected_doc_type))
        issues.extend(self._validate_data(file_path, data, metadata, expected_doc_type))

        return issues

    def _validate_metadata(self, file_path: Path, metadata: Dict, doc_type: str) -> List[ValidationIssue]:
        """Validate metadata section."""
        issues = []
        file_str = str(file_path)

        # Check required metadata fields
        if "docType" not in metadata:
            issues.append(ValidationIssue(
                file_path=file_str,
                doc_type=doc_type,
                severity=Severity.ERROR,
                category="metadata",
                field="docType",
                message="Missing docType in metadata",
                suggestion=f'Add "docType": "{doc_type}" to metadata',
                auto_fixable=True,
                fix_function="add_doc_type"
            ))

        elif metadata["docType"] != doc_type:
            issues.append(ValidationIssue(
                file_path=file_str,
                doc_type=doc_type,
                severity=Severity.ERROR,
                category="metadata",
                field="docType",
                message=f'docType is "{metadata["docType"]}" but expected "{doc_type}"',
                suggestion=f'Change docType to "{doc_type}"'
            ))

        if "generatedAt" not in metadata:
            issues.append(ValidationIssue(
                file_path=file_str,
                doc_type=doc_type,
                severity=Severity.WARNING,
                category="metadata",
                field="generatedAt",
                message="Missing generatedAt timestamp",
                suggestion="Add generatedAt timestamp for tracking",
                auto_fixable=True,
                fix_function="add_timestamp"
            ))

        if "generatedBy" not in metadata:
            issues.append(ValidationIssue(
                file_path=file_str,
                doc_type=doc_type,
                severity=Severity.INFO,
                category="metadata",
                field="generatedBy",
                message="Missing generatedBy field",
                suggestion='Add "generatedBy": "Claude Technical Documenter"'
            ))

        return issues

    def _validate_data(self, file_path: Path, data: Dict, metadata: Dict, doc_type: str) -> List[ValidationIssue]:
        """Validate data section."""
        issues = []
        file_str = str(file_path)

        # Check required fields
        required = self.REQUIRED_FIELDS.get(doc_type, [])
        for field in required:
            if field not in data or not data[field]:
                issues.append(ValidationIssue(
                    file_path=file_str,
                    doc_type=doc_type,
                    severity=Severity.ERROR,
                    category="required",
                    field=field,
                    message=f"Missing required field: {field}",
                    suggestion=f"Add {field} description (minimum {self.FIELD_MIN_LENGTHS.get(f'{doc_type}.{field}', 20)} characters)"
                ))

        # Check field lengths
        for field, max_length in self.FIELD_MAX_LENGTHS.items():
            if f"{doc_type}.{field}" in self.FIELD_MAX_LENGTHS:
                max_len = self.FIELD_MAX_LENGTHS[f"{doc_type}.{field}"]
                field_name = field
                if field_name in data and data[field_name]:
                    actual_length = len(data[field_name])
                    if actual_length > max_len:
                        issues.append(ValidationIssue(
                            file_path=file_str,
                            doc_type=doc_type,
                            severity=Severity.ERROR,
                            category="length",
                            field=field_name,
                            message=f"{field_name} exceeds maximum length: {actual_length} > {max_len}",
                            suggestion=f"Shorten {field_name} to {max_len} characters or less",
                            auto_fixable=True,
                            fix_function="truncate_field"
                        ))

        # Check minimum lengths
        for field, min_length in self.FIELD_MIN_LENGTHS.items():
            if f"{doc_type}.{field}" in self.FIELD_MIN_LENGTHS:
                min_len = self.FIELD_MIN_LENGTHS[f"{doc_type}.{field}"]
                field_name = field
                if field_name in data and data[field_name]:
                    actual_length = len(data[field_name])
                    if actual_length < min_len:
                        issues.append(ValidationIssue(
                            file_path=file_str,
                            doc_type=doc_type,
                            severity=Severity.WARNING,
                            category="length",
                            field=field_name,
                            message=f"{field_name} below minimum length: {actual_length} < {min_len}",
                            suggestion=f"Expand {field_name} to at least {min_len} characters"
                        ))

        # Type-specific validation
        if doc_type == "module":
            issues.extend(self._validate_module_data(file_str, data, metadata))
        elif doc_type == "entity":
            issues.extend(self._validate_entity_data(file_str, data, metadata))
        elif doc_type == "attribute":
            issues.extend(self._validate_attribute_data(file_str, data, metadata))
        elif doc_type == "attributeValue":
            issues.extend(self._validate_attribute_value_data(file_str, data, metadata))

        # Check for placeholder text
        for field_name, field_value in data.items():
            if isinstance(field_value, str):
                placeholder_patterns = [
                    r'^\[TODO\]', r'^\[FIXME\]', r'^TBD', r'^To be added',
                    r'^N/A$', r'^xxx$', r'^placeholder', r'^INSERT',
                    r'^\.{3,}$'  # Just dots
                ]
                for pattern in placeholder_patterns:
                    if re.match(pattern, field_value.strip(), re.IGNORECASE):
                        issues.append(ValidationIssue(
                            file_path=file_str,
                            doc_type=doc_type,
                            severity=Severity.ERROR,
                            category="content",
                            field=field_name,
                            message=f"Field contains placeholder text: {field_value[:50]}",
                            suggestion="Replace with actual documentation"
                        ))
                        break

        # Check for non-English content (basic heuristic)
        if self.verbose:
            for field_name in ["purpose", "businessDescription", "technicalDescription"]:
                if field_name in data and isinstance(data[field_name], str):
                    if self._contains_non_english(data[field_name]):
                        issues.append(ValidationIssue(
                            file_path=file_str,
                            doc_type=doc_type,
                            severity=Severity.INFO,
                            category="language",
                            field=field_name,
                            message="Field may contain non-English content",
                            suggestion="Ensure documentation is in English"
                        ))

        return issues

    def _validate_module_data(self, file_path: str, data: Dict, metadata: Dict) -> List[ValidationIssue]:
        """Validate module-specific data."""
        issues = []

        # Check if moduleAlias is present in metadata
        if "moduleAlias" not in metadata:
            issues.append(ValidationIssue(
                file_path=file_path,
                doc_type="module",
                severity=Severity.ERROR,
                category="metadata",
                field="moduleAlias",
                message="Missing moduleAlias in metadata",
                suggestion=f'Add "moduleAlias" to metadata (extract from filename or directory)',
                auto_fixable=True,
                fix_function="add_module_alias"
            ))

        return issues

    def _validate_entity_data(self, file_path: str, data: Dict, metadata: Dict) -> List[ValidationIssue]:
        """Validate entity-specific data."""
        issues = []

        # Check objectTypeAlias
        if "objectTypeAlias" not in data and "entityAlias" not in metadata:
            issues.append(ValidationIssue(
                file_path=file_path,
                doc_type="entity",
                severity=Severity.ERROR,
                category="reference",
                field="objectTypeAlias",
                message="Missing objectTypeAlias in data and entityAlias in metadata",
                suggestion="Add entity alias to metadata or objectTypeAlias to data",
                auto_fixable=True,
                fix_function="add_entity_alias"
            ))

        # Validate objectTypeAlias format if present
        entity_alias = data.get("objectTypeAlias") or metadata.get("entityAlias")
        if entity_alias and not self.ENTITY_ALIAS_PATTERN.match(entity_alias):
            issues.append(ValidationIssue(
                file_path=file_path,
                doc_type="entity",
                severity=Severity.WARNING,
                category="format",
                field="objectTypeAlias",
                message=f"Entity alias format may be invalid: {entity_alias}",
                suggestion="Use format: module.EntityName (e.g., am.Agent)"
            ))

        return issues

    def _validate_attribute_data(self, file_path: str, data: Dict, metadata: Dict) -> List[ValidationIssue]:
        """Validate attribute-specific data."""
        issues = []

        # Check required references
        entity_alias = data.get("objectTypeAlias") or metadata.get("entityAlias")
        attr_name = data.get("attributeName") or metadata.get("attributeName")

        if not entity_alias:
            issues.append(ValidationIssue(
                file_path=file_path,
                doc_type="attribute",
                severity=Severity.ERROR,
                category="reference",
                field="objectTypeAlias",
                message="Missing objectTypeAlias (entity reference)",
                suggestion="Add entity reference to metadata or data"
            ))

        if not attr_name:
            issues.append(ValidationIssue(
                file_path=file_path,
                doc_type="attribute",
                severity=Severity.ERROR,
                category="reference",
                field="attributeName",
                message="Missing attributeName",
                suggestion="Add attribute name to metadata or data"
            ))

        return issues

    def _validate_attribute_value_data(self, file_path: str, data: Dict, metadata: Dict) -> List[ValidationIssue]:
        """Validate attribute value-specific data."""
        issues = []

        # Check required references
        entity_alias = data.get("objectTypeAlias") or metadata.get("entityAlias")
        attr_name = data.get("attributeName") or metadata.get("attributeName")
        value_name = data.get("valueName") or metadata.get("valueName")

        if not entity_alias:
            issues.append(ValidationIssue(
                file_path=file_path,
                doc_type="attributeValue",
                severity=Severity.ERROR,
                category="reference",
                field="objectTypeAlias",
                message="Missing objectTypeAlias",
                suggestion="Add entity reference to metadata or data"
            ))

        if not attr_name:
            issues.append(ValidationIssue(
                file_path=file_path,
                doc_type="attributeValue",
                severity=Severity.ERROR,
                category="reference",
                field="attributeName",
                message="Missing attributeName",
                suggestion="Add attribute name to metadata or data"
            ))

        if not value_name:
            issues.append(ValidationIssue(
                file_path=file_path,
                doc_type="attributeValue",
                severity=Severity.ERROR,
                category="reference",
                field="valueName",
                message="Missing valueName",
                suggestion="Add enum value name to metadata or data"
            ))

        # Check ordinalValue
        if "ordinalValue" not in data:
            issues.append(ValidationIssue(
                file_path=file_path,
                doc_type="attributeValue",
                severity=Severity.WARNING,
                category="data",
                field="ordinalValue",
                message="Missing ordinalValue",
                suggestion="Add ordinalValue (enum ordinal position)"
            ))

        # Detect standalone enum (entityAlias is just module prefix)
        if entity_alias and '.' not in entity_alias:
            issues.append(ValidationIssue(
                file_path=file_path,
                doc_type="attributeValue",
                severity=Severity.INFO,
                category="structure",
                field="objectTypeAlias",
                message=f"Standalone enum detected: {entity_alias}.{attr_name}",
                suggestion="This enum value may not be uploadable (not a JPA entity)"
            ))

        return issues

    def _contains_non_english(self, text: str) -> bool:
        """Basic check for non-English characters."""
        # Check for common non-English scripts
        non_english_ranges = [
            (0x0400, 0x04FF),  # Cyrillic
            (0x4E00, 0x9FFF),  # CJK Unified Ideographs
            (0x0600, 0x06FF),  # Arabic
            (0x0590, 0x05FF),  # Hebrew
            (0x0E00, 0x0E7F),  # Thai
        ]
        for char in text:
            code = ord(char)
            for start, end in non_english_ranges:
                if start <= code <= end:
                    return True
        return False

    def apply_fixes(self, result: ValidationResult) -> int:
        """Apply auto-fixes to fixable issues."""
        fixes_applied = 0

        for issue in result.issues:
            if issue.auto_fixable:
                if self._apply_fix(issue):
                    fixes_applied += 1
                    self.fix_count += 1

        return fixes_applied

    def _apply_fix(self, issue: ValidationIssue) -> bool:
        """Apply a single fix."""
        file_path = Path(issue.file_path)

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = json.load(f)
        except Exception:
            return False

        modified = False

        if issue.fix_function == "add_doc_type":
            content["metadata"]["docType"] = issue.doc_type
            modified = True

        elif issue.fix_function == "add_timestamp":
            content["metadata"]["generatedAt"] = datetime.now().isoformat()
            modified = True

        elif issue.fix_function == "add_module_alias":
            # Extract module alias from file path
            match = re.search(r'\.cb/modules/([a-z]+)/', file_path)
            if match:
                content["metadata"]["moduleAlias"] = match.group(1)
                modified = True

        elif issue.fix_function == "add_entity_alias":
            # Extract entity alias from filename
            filename = file_path.stem
            # Convert format: am_Agent -> am.Agent
            parts = filename.split('_', 1)
            if len(parts) == 2:
                content["metadata"]["entityAlias"] = f"{parts[0]}.{parts[1]}"
                modified = True

        elif issue.fix_function == "truncate_field":
            # Truncate field to max length
            max_len = self.FIELD_MAX_LENGTHS.get(f"{issue.doc_type}.{issue.field}")
            if max_len and issue.field in content["data"]:
                original = content["data"][issue.field]
                content["data"][issue.field] = original[:max_len-3] + "..."
                modified = True

        if modified:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(content, f, indent=2, ensure_ascii=False)
            return True

        return False


def print_result(result: ValidationResult, verbose: bool = False):
    """Print validation results to console."""
    print_header(f"Validation Results: {result.module_alias}")

    print(f"\nFiles: {result.valid_files}/{result.total_files} valid")
    print(f"Duration: {result.duration_seconds:.2f}s")
    print(f"Issues: {len(result.errors)} errors, {len(result.warnings)} warnings, {len(result.infos)} info")

    if result.errors:
        print_header("\n🔴 ERRORS", "=")
        for error in result.errors[:20]:  # Show first 20
            print(f"  [{error.category}] {error.field}")
            print(f"    File: {Path(error.file_path).name}")
            print(f"    Message: {error.message}")
            if error.suggestion:
                print(f"    Suggestion: {error.suggestion}")
            print()
        if len(result.errors) > 20:
            print(f"  ... and {len(result.errors) - 20} more errors")

    if result.warnings and (verbose or not result.errors):
        print_header("\n🟡 WARNINGS", "=")
        for warning in result.warnings[:10]:
            print(f"  [{warning.category}] {warning.field}")
            print(f"    File: {Path(warning.file_path).name}")
            print(f"    Message: {warning.message}")
            if warning.suggestion:
                print(f"    Suggestion: {warning.suggestion}")
            print()
        if len(result.warnings) > 10:
            print(f"  ... and {len(result.warnings) - 10} more warnings")

    if result.infos and verbose:
        print_header("\n🔵 INFO", "=")
        for info in result.infos[:5]:
            print(f"  [{info.category}] {info.field}: {info.message}")
        if len(result.infos) > 5:
            print(f"  ... and {len(result.infos) - 5} more info items")

    # Summary
    print_header("\nSummary", "-")
    status = "✅ VALID" if result.is_valid else "❌ INVALID"
    print(f"Status: {status}")
    if result.is_valid:
        print("✓ All files passed validation. Ready to upload.")
    else:
        print(f"✗ {len(result.errors)} error(s) must be fixed before upload.")


def print_header(title: str, char: str = "="):
    """Print a formatted header."""
    print(f"\n{title}")
    print(char * len(title))


def main():
    parser = argparse.ArgumentParser(
        description="Validate CB technical documentation",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--module", help="Validate specific module")
    parser.add_argument("--all", action="store_true", help="Validate all modules")
    parser.add_argument("--fix", action="store_true", help="Auto-fix fixable issues")
    parser.add_argument("--strict", action="store_true", help="Fail on warnings too")
    parser.add_argument("--output", choices=["text", "json", "html"], default="text", help="Output format")
    parser.add_argument("--verbose", action="store_true", help="Show detailed output")

    args = parser.parse_args()

    if not args.module and not args.all:
        parser.print_help()
        sys.exit(1)

    validator = DocumentationValidator(strict=args.strict, verbose=args.verbose)

    if args.all:
        # Validate all modules
        modules = [d.name for d in MODULES_DIR.iterdir() if d.is_dir() and not d.name.startswith('.')]
    else:
        modules = [args.module]

    all_results = ValidationResult(module_alias="all")

    for module_alias in modules:
        if args.verbose:
            print(f"\nValidating module: {module_alias}...")

        result = validator.validate_module(module_alias)

        if args.fix and not result.is_valid:
            fixed = validator.apply_fixes(result)
            if fixed > 0:
                print(f"  Applied {fixed} fix(es)")
                # Re-validate to check remaining issues
                result = validator.validate_module(module_alias)

        all_results.add(result)

        if args.output == "text":
            print_result(result, verbose=args.verbose)

    # Print overall summary
    if len(modules) > 1:
        print_header("\n📊 Overall Summary", "=")
        print(f"Modules validated: {len(modules)}")
        print(f"Total files: {all_results.total_files}")
        print(f"Valid files: {all_results.valid_files}")
        print(f"Total issues: {len(all_results.errors)} errors, {len(all_results.warnings)} warnings")

        if args.fix:
            print(f"Fixes applied: {validator.fix_count}")

        if args.strict and all_results.warnings:
            print("\n❌ VALIDATION FAILED (strict mode: warnings treated as errors)")
            sys.exit(1)
        elif not all_results.is_valid:
            print("\n❌ VALIDATION FAILED")
            sys.exit(1)
        else:
            print("\n✅ ALL MODULES VALID")
            sys.exit(0)

    else:
        # Single module
        if args.strict and all_results.warnings:
            sys.exit(1)
        elif not all_results.is_valid:
            sys.exit(1)
        else:
            sys.exit(0)


if __name__ == "__main__":
    main()
