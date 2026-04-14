#!/usr/bin/env python3
"""
CB Technical Documentation Checker

This script verifies documentation completeness against the index and can fill gaps.
It is designed to be run by AI checker agents (Claude) after documentation workers complete.

The checker:
1. Loads the index (complete inventory of what should be documented)
2. Scans the documentation folder for what has been documented
3. Identifies gaps (missing items, incomplete fields)
4. Generates a checker report
5. Can optionally indicate which items need gap-filling

Usage:
    python check_documentation.py --module <alias> [options]

Options:
    --report-only       Only generate report, don't identify items for gap-filling
    --fill-gaps         Mark items for gap-filling (checker agent will fill them)
    --json              Output report in JSON format
    --verbose           Show detailed output

Output:
    .cb/modules/<alias>/<alias>_checker_report.json

This script is part of the four-phase workflow:
1. generate_index.py    - Create inventory (Phase 1)
2. generate_documentation.py - AI workers document (Phase 2)
3. check_documentation.py - AI checkers verify & fill gaps (Phase 3)
4. upload_documentation.py - Upload to API (Phase 4)
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Set
from dataclasses import dataclass, field, asdict

# Determine paths
SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_DIR = SCRIPT_DIR.parent
PROJECT_ROOT = SKILL_DIR.parent.parent.parent
CB_DIR = PROJECT_ROOT / ".cb"
MODULES_DIR = CB_DIR / "modules"

# Required fields for completeness validation
REQUIRED_MODULE_FIELDS = ["moduleAlias", "moduleName", "purpose", "businessDescription", "technicalDescription"]
REQUIRED_ENTITY_FIELDS = ["objectTypeAlias", "purpose", "businessDescription", "technicalDescription"]
REQUIRED_ATTRIBUTE_FIELDS = ["attributeName", "purpose", "businessDescription"]
REQUIRED_ENUM_VALUE_FIELDS = ["valueName", "purpose", "businessDescription"]


@dataclass
class IncompleteItem:
    """Represents an item with incomplete documentation."""
    item_type: str  # "module", "entity", "attribute", "enumValue"
    identifier: str
    missing_fields: List[str]
    empty_fields: List[str]


@dataclass
class CheckerReport:
    """Documentation checker report."""
    moduleAlias: str
    checkedAt: str
    checkedBy: str = "Claude Documentation Checker"

    # Index statistics
    indexStats: Dict[str, int] = field(default_factory=dict)

    # Before check metrics
    beforeCheck: Dict[str, Any] = field(default_factory=dict)

    # Gaps found
    missingEntities: List[str] = field(default_factory=list)
    missingAttributes: List[Dict] = field(default_factory=list)
    missingEnumValues: List[Dict] = field(default_factory=list)
    incompleteItems: List[Dict] = field(default_factory=list)

    # After check metrics (after gap-filling)
    afterCheck: Dict[str, Any] = field(default_factory=dict)

    # Items added during gap-filling
    itemsAdded: Dict[str, int] = field(default_factory=dict)

    # Overall status
    status: str = "INCOMPLETE"  # or "COMPLETE"

    def to_dict(self) -> Dict:
        return {
            "moduleAlias": self.moduleAlias,
            "checkedAt": self.checkedAt,
            "checkedBy": self.checkedBy,
            "indexStats": self.indexStats,
            "beforeCheck": self.beforeCheck,
            "gaps": {
                "missingEntities": self.missingEntities,
                "missingAttributes": self.missingAttributes,
                "missingEnumValues": self.missingEnumValues,
                "incompleteItems": self.incompleteItems
            },
            "afterCheck": self.afterCheck,
            "itemsAdded": self.itemsAdded,
            "status": self.status
        }


def load_index(module_alias: str) -> Optional[Dict]:
    """Load the index file for a module."""
    index_file = MODULES_DIR / module_alias / f"{module_alias}_index.json"
    if not index_file.exists():
        print(f"Error: Index file not found: {index_file}")
        return None

    with open(index_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_documentation_file(file_path: Path) -> Optional[Dict]:
    """Load a documentation JSON file."""
    if not file_path.exists():
        return None

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = json.load(f)
            return content.get("data", content)
    except Exception:
        return None


def check_field_completeness(data: Dict, required_fields: List[str]) -> tuple:
    """Check if required fields are present and non-empty."""
    missing = []
    empty = []

    for field_name in required_fields:
        if field_name not in data:
            missing.append(field_name)
        elif data[field_name] is None or (isinstance(data[field_name], str) and not data[field_name].strip()):
            empty.append(field_name)

    return missing, empty


def check_module_documentation(module_alias: str) -> tuple:
    """Check module-level documentation."""
    doc_dir = MODULES_DIR / module_alias / "documentation"
    module_file = doc_dir / "module.json"

    exists = module_file.exists()
    incomplete_item = None

    if exists:
        data = load_documentation_file(module_file)
        if data:
            missing, empty = check_field_completeness(data, REQUIRED_MODULE_FIELDS)
            if missing or empty:
                incomplete_item = IncompleteItem(
                    item_type="module",
                    identifier=module_alias,
                    missing_fields=missing,
                    empty_fields=empty
                )

    return exists, incomplete_item


def check_entity_documentation(module_alias: str, entity_alias: str) -> tuple:
    """Check entity-level documentation."""
    doc_dir = MODULES_DIR / module_alias / "documentation" / "entities"
    safe_name = entity_alias.replace(".", "_")
    entity_file = doc_dir / f"{safe_name}.json"

    exists = entity_file.exists()
    incomplete_item = None

    if exists:
        data = load_documentation_file(entity_file)
        if data:
            missing, empty = check_field_completeness(data, REQUIRED_ENTITY_FIELDS)
            if missing or empty:
                incomplete_item = IncompleteItem(
                    item_type="entity",
                    identifier=entity_alias,
                    missing_fields=missing,
                    empty_fields=empty
                )

    return exists, incomplete_item


def check_attribute_documentation(module_alias: str, entity_alias: str, attr_name: str) -> tuple:
    """Check attribute-level documentation."""
    doc_dir = MODULES_DIR / module_alias / "documentation" / "attributes"
    safe_entity = entity_alias.replace(".", "_")
    attr_file = doc_dir / f"{safe_entity}_{attr_name}.json"

    exists = attr_file.exists()
    incomplete_item = None

    if exists:
        data = load_documentation_file(attr_file)
        if data:
            missing, empty = check_field_completeness(data, REQUIRED_ATTRIBUTE_FIELDS)
            if missing or empty:
                incomplete_item = IncompleteItem(
                    item_type="attribute",
                    identifier=f"{entity_alias}.{attr_name}",
                    missing_fields=missing,
                    empty_fields=empty
                )

    return exists, incomplete_item


def check_enum_value_documentation(module_alias: str, entity_alias: str, attr_name: str, value_name: str) -> tuple:
    """Check enum value documentation."""
    doc_dir = MODULES_DIR / module_alias / "documentation" / "attribute_values"
    safe_entity = entity_alias.replace(".", "_")
    value_file = doc_dir / f"{safe_entity}_{attr_name}_{value_name}.json"

    exists = value_file.exists()
    incomplete_item = None

    if exists:
        data = load_documentation_file(value_file)
        if data:
            missing, empty = check_field_completeness(data, REQUIRED_ENUM_VALUE_FIELDS)
            if missing or empty:
                incomplete_item = IncompleteItem(
                    item_type="enumValue",
                    identifier=f"{entity_alias}.{attr_name}.{value_name}",
                    missing_fields=missing,
                    empty_fields=empty
                )

    return exists, incomplete_item


def run_check(module_alias: str, verbose: bool = False) -> CheckerReport:
    """Run the documentation check and generate report."""
    index = load_index(module_alias)
    if index is None:
        raise ValueError(f"Index not found for module: {module_alias}")

    report = CheckerReport(
        moduleAlias=module_alias,
        checkedAt=datetime.now().isoformat()
    )

    # Index statistics
    entities = index.get("entities", [])
    enums = index.get("enums", [])

    total_entities = len(entities)
    total_attributes = sum(len(e.get("attributes", [])) for e in entities)
    total_enum_values = sum(len(e.get("values", [])) for e in enums)
    # Also count enum values from attributes
    for entity in entities:
        for attr in entity.get("attributes", []):
            total_enum_values += len(attr.get("enumValues", []))

    report.indexStats = {
        "totalEntities": total_entities,
        "totalAttributes": total_attributes,
        "totalEnumValues": total_enum_values
    }

    # Check counters
    documented_entities = 0
    documented_attributes = 0
    documented_enum_values = 0
    incomplete_items = []

    # Check module documentation
    module_exists, module_incomplete = check_module_documentation(module_alias)
    if not module_exists:
        if verbose:
            print(f"  Missing: Module documentation")
    elif module_incomplete:
        incomplete_items.append(asdict(module_incomplete))
        if verbose:
            print(f"  Incomplete: Module - missing {module_incomplete.missing_fields}, empty {module_incomplete.empty_fields}")

    # Check entity documentation
    for entity in entities:
        entity_alias = entity.get("alias")

        entity_exists, entity_incomplete = check_entity_documentation(module_alias, entity_alias)

        if entity_exists:
            documented_entities += 1
            if entity_incomplete:
                incomplete_items.append(asdict(entity_incomplete))
                if verbose:
                    print(f"  Incomplete: {entity_alias}")
        else:
            report.missingEntities.append(entity_alias)
            if verbose:
                print(f"  Missing: Entity {entity_alias}")

        # Check attribute documentation
        for attr in entity.get("attributes", []):
            attr_name = attr.get("name")

            attr_exists, attr_incomplete = check_attribute_documentation(module_alias, entity_alias, attr_name)

            if attr_exists:
                documented_attributes += 1
                if attr_incomplete:
                    incomplete_items.append(asdict(attr_incomplete))
            else:
                report.missingAttributes.append({
                    "entityAlias": entity_alias,
                    "attributeName": attr_name
                })

            # Check enum value documentation
            for value_name in attr.get("enumValues", []):
                value_exists, value_incomplete = check_enum_value_documentation(
                    module_alias, entity_alias, attr_name, value_name
                )

                if value_exists:
                    documented_enum_values += 1
                    if value_incomplete:
                        incomplete_items.append(asdict(value_incomplete))
                else:
                    report.missingEnumValues.append({
                        "entityAlias": entity_alias,
                        "attributeName": attr_name,
                        "valueName": value_name
                    })

    # Check standalone enums
    for enum in enums:
        enum_name = enum.get("name")
        for value in enum.get("values", []):
            value_name = value.get("name")
            # For standalone enums, use module-level location
            value_exists, value_incomplete = check_enum_value_documentation(
                module_alias, module_alias, enum_name, value_name
            )

            if value_exists:
                documented_enum_values += 1
                if value_incomplete:
                    incomplete_items.append(asdict(value_incomplete))
            else:
                report.missingEnumValues.append({
                    "entityAlias": module_alias,
                    "attributeName": enum_name,
                    "valueName": value_name
                })

    # Store incomplete items
    report.incompleteItems = incomplete_items

    # Calculate coverage
    total_items = 1 + total_entities + total_attributes + total_enum_values  # 1 for module
    documented_items = (1 if module_exists else 0) + documented_entities + documented_attributes + documented_enum_values
    coverage_percent = (documented_items / total_items * 100) if total_items > 0 else 0

    report.beforeCheck = {
        "moduleDocumented": module_exists,
        "documentedEntities": documented_entities,
        "documentedAttributes": documented_attributes,
        "documentedEnumValues": documented_enum_values,
        "coveragePercent": round(coverage_percent, 1),
        "incompleteCount": len(incomplete_items)
    }

    # Determine status
    has_gaps = (
        not module_exists or
        report.missingEntities or
        report.missingAttributes or
        report.missingEnumValues or
        incomplete_items
    )
    report.status = "INCOMPLETE" if has_gaps else "COMPLETE"

    return report


def save_checker_report(module_alias: str, report: CheckerReport) -> Path:
    """Save the checker report to a JSON file."""
    module_dir = MODULES_DIR / module_alias
    module_dir.mkdir(parents=True, exist_ok=True)

    report_file = module_dir / f"{module_alias}_checker_report.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report.to_dict(), f, indent=2, ensure_ascii=False)

    return report_file


def print_report(report: CheckerReport):
    """Print a human-readable report."""
    print(f"\n{'='*60}")
    print(f"Documentation Checker Report: {report.moduleAlias}")
    print(f"{'='*60}")
    print(f"Checked at: {report.checkedAt}")
    print(f"Status: {report.status}")

    print(f"\nIndex Statistics:")
    print(f"  Total Entities: {report.indexStats.get('totalEntities', 0)}")
    print(f"  Total Attributes: {report.indexStats.get('totalAttributes', 0)}")
    print(f"  Total Enum Values: {report.indexStats.get('totalEnumValues', 0)}")

    print(f"\nCoverage:")
    before = report.beforeCheck
    print(f"  Module: {'✓' if before.get('moduleDocumented') else '○'}")
    print(f"  Entities: {before.get('documentedEntities', 0)}/{report.indexStats.get('totalEntities', 0)}")
    print(f"  Attributes: {before.get('documentedAttributes', 0)}/{report.indexStats.get('totalAttributes', 0)}")
    print(f"  Enum Values: {before.get('documentedEnumValues', 0)}/{report.indexStats.get('totalEnumValues', 0)}")
    print(f"  Overall: {before.get('coveragePercent', 0):.1f}%")

    if report.status == "COMPLETE":
        print(f"\n✓ Documentation is COMPLETE!")
    else:
        print(f"\nGaps Found:")

        if report.missingEntities:
            print(f"\n  Missing Entities ({len(report.missingEntities)}):")
            for entity in report.missingEntities[:10]:
                print(f"    - {entity}")
            if len(report.missingEntities) > 10:
                print(f"    ... and {len(report.missingEntities) - 10} more")

        if report.missingAttributes:
            print(f"\n  Missing Attributes ({len(report.missingAttributes)}):")
            for item in report.missingAttributes[:10]:
                print(f"    - {item['entityAlias']}.{item['attributeName']}")
            if len(report.missingAttributes) > 10:
                print(f"    ... and {len(report.missingAttributes) - 10} more")

        if report.missingEnumValues:
            print(f"\n  Missing Enum Values ({len(report.missingEnumValues)}):")
            for item in report.missingEnumValues[:10]:
                print(f"    - {item['entityAlias']}.{item['attributeName']}.{item['valueName']}")
            if len(report.missingEnumValues) > 10:
                print(f"    ... and {len(report.missingEnumValues) - 10} more")

        if report.incompleteItems:
            print(f"\n  Incomplete Items ({len(report.incompleteItems)}):")
            for item in report.incompleteItems[:10]:
                print(f"    - {item['item_type']}: {item['identifier']}")
                if item['missing_fields']:
                    print(f"      Missing fields: {', '.join(item['missing_fields'])}")
                if item['empty_fields']:
                    print(f"      Empty fields: {', '.join(item['empty_fields'])}")
            if len(report.incompleteItems) > 10:
                print(f"    ... and {len(report.incompleteItems) - 10} more")

    print()


def main():
    parser = argparse.ArgumentParser(
        description="Check CB technical documentation completeness",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
This script verifies documentation against the index and identifies gaps.

Workflow:
1. Run generate_index.py to create/update the index
2. Run documentation workers (Phase 2)
3. Run this script to verify completeness
4. If gaps found, run checker workers to fill them
5. Repeat until status is COMPLETE
6. Run upload_documentation.py to upload to API

Examples:
    # Check documentation status
    python check_documentation.py --module cr

    # Get JSON report
    python check_documentation.py --module cr --json

    # Verbose check with details
    python check_documentation.py --module cr --verbose
        """
    )

    parser.add_argument("--module", required=True, help="Module alias to check")
    parser.add_argument("--report-only", action="store_true", help="Only generate report")
    parser.add_argument("--fill-gaps", action="store_true", help="Mark items for gap-filling")
    parser.add_argument("--json", action="store_true", help="Output in JSON format")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show detailed output")

    args = parser.parse_args()

    try:
        if args.verbose:
            print(f"Checking documentation for module: {args.module}")

        report = run_check(args.module, verbose=args.verbose)

        # Save report
        report_file = save_checker_report(args.module, report)

        if args.json:
            print(json.dumps(report.to_dict(), indent=2))
        else:
            print_report(report)
            print(f"Report saved to: {report_file}")

        # Exit with appropriate code
        sys.exit(0 if report.status == "COMPLETE" else 1)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
