#!/usr/bin/env python3
"""
CB Technical Documentation Index Generator

This script scans Java source files and creates a complete inventory (index) of
entities, attributes, and enum values for a module. The index serves as a checklist
for documentation workers to ensure nothing is missed.

Usage:
    python generate_index.py --module <alias> [--full|--delta]
    python generate_index.py --modules cr,cm,am [--full|--delta]
    python generate_index.py --all [--full|--delta]

Modes:
    --full      Generate complete index (default)
    --delta     Only include files modified since last processing

Output:
    .cb/modules/<alias>/<alias>_index.json

Requirements:
    No external dependencies - uses only Python standard library
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Set, Tuple
from dataclasses import dataclass, field, asdict

# Determine paths
SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_DIR = SCRIPT_DIR.parent
PROJECT_ROOT = SKILL_DIR.parent.parent.parent  # .claude/skills/be_cb_technical_documenter -> root
CB_DIR = PROJECT_ROOT / ".cb"
MODULES_DIR = CB_DIR / "modules"
BACKEND_SRC = PROJECT_ROOT / "backend" / "src" / "main" / "java" / "com" / "mvs" / "backend"

# Known module aliases (can be extended)
KNOWN_MODULES = [
    "am", "as", "bm", "cb", "ce", "cf", "cm", "cp", "cr", "dm", "ea", "em",
    "eu", "ex", "ha", "hb", "hc", "im", "jb", "lg", "lm", "ns", "ol", "pc",
    "rp", "si", "te", "tm", "ui", "um", "wf"
]


@dataclass
class EnumValue:
    """Represents a single enum value."""
    name: str
    ordinal: int
    label: Optional[str] = None


@dataclass
class EnumInfo:
    """Represents an enum class."""
    name: str
    sourcePath: str
    lastModified: str
    values: List[EnumValue] = field(default_factory=list)


@dataclass
class AttributeInfo:
    """Represents an entity attribute/field."""
    name: str
    javaType: str
    columnName: Optional[str] = None
    isEnum: bool = False
    enumClass: Optional[str] = None
    enumValues: List[str] = field(default_factory=list)
    nullable: bool = True
    maxLength: Optional[int] = None
    annotations: List[str] = field(default_factory=list)


@dataclass
class EntityInfo:
    """Represents a JPA entity."""
    alias: str
    className: str
    sourcePath: str
    lastModified: str
    tableName: Optional[str] = None
    parentClass: Optional[str] = None
    attributes: List[AttributeInfo] = field(default_factory=list)


@dataclass
class ModuleIndex:
    """Complete index for a module."""
    moduleAlias: str
    moduleName: str
    generatedAt: str
    indexType: str  # "full" or "delta"
    sourceRoot: str
    basedOnTimestamp: Optional[str] = None
    entities: List[EntityInfo] = field(default_factory=list)
    enums: List[EnumInfo] = field(default_factory=list)
    removedEntities: List[str] = field(default_factory=list)
    removedEnums: List[str] = field(default_factory=list)
    summary: Dict[str, int] = field(default_factory=dict)

    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "moduleAlias": self.moduleAlias,
            "moduleName": self.moduleName,
            "generatedAt": self.generatedAt,
            "indexType": self.indexType,
            "sourceRoot": self.sourceRoot,
            "basedOnTimestamp": self.basedOnTimestamp,
            "entities": [self._entity_to_dict(e) for e in self.entities],
            "enums": [self._enum_to_dict(e) for e in self.enums],
            "removedEntities": self.removedEntities,
            "removedEnums": self.removedEnums,
            "summary": self.summary
        }

    def _entity_to_dict(self, entity: EntityInfo) -> Dict:
        return {
            "alias": entity.alias,
            "className": entity.className,
            "sourcePath": entity.sourcePath,
            "lastModified": entity.lastModified,
            "tableName": entity.tableName,
            "parentClass": entity.parentClass,
            "attributes": [self._attr_to_dict(a) for a in entity.attributes]
        }

    def _attr_to_dict(self, attr: AttributeInfo) -> Dict:
        return {
            "name": attr.name,
            "javaType": attr.javaType,
            "columnName": attr.columnName,
            "isEnum": attr.isEnum,
            "enumClass": attr.enumClass,
            "enumValues": attr.enumValues,
            "nullable": attr.nullable,
            "maxLength": attr.maxLength,
            "annotations": attr.annotations
        }

    def _enum_to_dict(self, enum: EnumInfo) -> Dict:
        return {
            "name": enum.name,
            "sourcePath": enum.sourcePath,
            "lastModified": enum.lastModified,
            "values": [{"name": v.name, "ordinal": v.ordinal, "label": v.label} for v in enum.values]
        }


class JavaSourceParser:
    """Parser for Java source files."""

    # Regex patterns
    ENTITY_ANNOTATION = re.compile(r'@Entity')
    TABLE_ANNOTATION = re.compile(r'@Table\s*\(\s*name\s*=\s*["\'](\w+)["\']')
    CLASS_DECLARATION = re.compile(r'public\s+class\s+(\w+)(?:\s+extends\s+(\w+))?')
    ENUM_DECLARATION = re.compile(r'public\s+enum\s+(\w+)')
    FIELD_PATTERN = re.compile(
        r'(?:@\w+(?:\([^)]*\))?\s*)*'  # Annotations
        r'(?:private|protected|public)\s+'  # Access modifier
        r'(\w+(?:<[^>]+>)?)\s+'  # Type (with generics)
        r'(\w+)\s*[;=]'  # Field name
    )
    COLUMN_ANNOTATION = re.compile(r'@Column\s*\(([^)]+)\)')
    ENUMERATED_ANNOTATION = re.compile(r'@Enumerated')
    # Match both UPPERCASE and lowercase enum values
    ENUM_VALUE_PATTERN = re.compile(r'^\s*([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*\([^)]*\))?\s*[,;]?\s*$', re.MULTILINE)
    JOIN_COLUMN = re.compile(r'@JoinColumn')
    MANY_TO_ONE = re.compile(r'@ManyToOne')
    ONE_TO_MANY = re.compile(r'@OneToMany')
    ONE_TO_ONE = re.compile(r'@OneToOne')
    MANY_TO_MANY = re.compile(r'@ManyToMany')

    def __init__(self, module_alias: str, source_root: Path):
        self.module_alias = module_alias
        self.source_root = source_root
        self.known_enums: Dict[str, List[str]] = {}  # enum name -> values

    def parse_module(self, since_timestamp: Optional[datetime] = None) -> Tuple[List[EntityInfo], List[EnumInfo]]:
        """Parse all Java files in the module."""
        entities = []
        enums = []

        # First pass: collect all enums
        enums_dir = self.source_root / "enums"
        if enums_dir.exists():
            for java_file in enums_dir.glob("*.java"):
                if since_timestamp and self._get_mtime(java_file) <= since_timestamp:
                    continue
                enum_info = self._parse_enum_file(java_file)
                if enum_info:
                    enums.append(enum_info)
                    self.known_enums[enum_info.name] = [v.name for v in enum_info.values]

        # Second pass: parse entities
        model_dir = self.source_root / "model"
        if model_dir.exists():
            for java_file in model_dir.glob("*.java"):
                if since_timestamp and self._get_mtime(java_file) <= since_timestamp:
                    continue
                entity_info = self._parse_entity_file(java_file)
                if entity_info:
                    entities.append(entity_info)

        return entities, enums

    def _get_mtime(self, file_path: Path) -> datetime:
        """Get file modification time."""
        return datetime.fromtimestamp(file_path.stat().st_mtime)

    def _parse_entity_file(self, file_path: Path) -> Optional[EntityInfo]:
        """Parse a Java entity file."""
        try:
            content = file_path.read_text(encoding='utf-8')
        except Exception as e:
            print(f"Warning: Could not read {file_path}: {e}")
            return None

        # Check if it's an entity
        if not self.ENTITY_ANNOTATION.search(content):
            return None

        # Extract class name
        class_match = self.CLASS_DECLARATION.search(content)
        if not class_match:
            return None

        class_name = class_match.group(1)
        parent_class = class_match.group(2)

        # Extract table name
        table_match = self.TABLE_ANNOTATION.search(content)
        table_name = table_match.group(1) if table_match else None

        # Extract attributes
        attributes = self._parse_attributes(content)

        # Get relative path
        try:
            rel_path = file_path.relative_to(self.source_root)
        except ValueError:
            rel_path = file_path.name

        return EntityInfo(
            alias=f"{self.module_alias}.{class_name}",
            className=class_name,
            sourcePath=str(rel_path),
            lastModified=self._get_mtime(file_path).isoformat(),
            tableName=table_name,
            parentClass=parent_class,
            attributes=attributes
        )

    def _parse_attributes(self, content: str) -> List[AttributeInfo]:
        """Parse attributes/fields from entity content."""
        attributes = []

        # Find class body start
        class_match = self.CLASS_DECLARATION.search(content)
        if not class_match:
            return attributes

        class_start = content.find('{', class_match.end())
        if class_start == -1:
            return attributes

        # Split content into lines for context-aware parsing
        lines = content.split('\n')
        in_class_body = False
        brace_count = 0
        i = 0

        while i < len(lines):
            line = lines[i]

            # Track brace depth to stay in class body
            if not in_class_body:
                if 'class ' in line and '{' in line:
                    in_class_body = True
                    brace_count = 1
                elif 'class ' in line:
                    in_class_body = True
                i += 1
                continue

            # Count braces
            brace_count += line.count('{') - line.count('}')
            if brace_count <= 0:
                break

            # Skip method declarations (have parentheses before semicolon/brace)
            if re.search(r'\)\s*[{;]', line) or re.search(r'\)\s*throws', line):
                i += 1
                continue

            # Skip inner class/interface/enum declarations
            if re.search(r'(class|interface|enum)\s+\w+', line):
                i += 1
                continue

            # Collect annotations (look back from current position)
            annotations = []
            annotation_block = ""
            j = i - 1
            while j >= 0 and (lines[j].strip().startswith('@') or lines[j].strip() == ''):
                if lines[j].strip().startswith('@'):
                    annotation_block = lines[j] + "\n" + annotation_block
                    for ann_match in re.finditer(r'@(\w+)', lines[j]):
                        annotations.insert(0, ann_match.group(1))
                j -= 1

            combined = annotation_block + line

            # Try to match a field - look for type followed by name and semicolon or equals
            # Handle fields with or without access modifiers (Lombok classes may omit them)
            field_match = re.search(
                r'(?:private|protected|public)?\s*(\w+(?:<[^>]+>)?)\s+(\w+)\s*[;=]',
                line
            )

            if field_match:
                java_type = field_match.group(1)
                field_name = field_match.group(2)

                # Skip if java_type is a keyword or common non-type word
                skip_types = {'static', 'final', 'void', 'return', 'new', 'if', 'else', 'for', 'while', 'class', 'public', 'private', 'protected'}
                if java_type.lower() in skip_types:
                    i += 1
                    continue

                # Skip static fields
                if 'static ' in line:
                    i += 1
                    continue

                # Skip constants (static final with assignment)
                if 'final ' in line and '=' in line and 'static' in line:
                    i += 1
                    continue

                # Skip transient fields
                if '@Transient' in combined or 'transient ' in line:
                    i += 1
                    continue

                # Skip fields that are clearly constants (UPPER_CASE names with assignment)
                if re.match(r'^[A-Z][A-Z0-9_]*$', field_name) and '=' in line:
                    i += 1
                    continue

                # Extract column name from @Column or @JoinColumn
                column_name = None
                col_match = self.COLUMN_ANNOTATION.search(combined)
                if col_match:
                    col_props = col_match.group(1)
                    name_match = re.search(r'name\s*=\s*["\'](\w+)["\']', col_props)
                    if name_match:
                        column_name = name_match.group(1)

                # Also check @JoinColumn for name
                join_col_match = re.search(r'@JoinColumn\s*\(([^)]+)\)', combined)
                if join_col_match and not column_name:
                    join_props = join_col_match.group(1)
                    name_match = re.search(r'name\s*=\s*["\'](\w+)["\']', join_props)
                    if name_match:
                        column_name = name_match.group(1)

                # Check if enum
                is_enum = '@Enumerated' in combined or java_type in self.known_enums
                enum_class = java_type if is_enum else None
                enum_values = self.known_enums.get(java_type, []) if is_enum else []

                # Extract nullable
                nullable = True
                if col_match:
                    if 'nullable = false' in col_match.group(1) or 'nullable=false' in col_match.group(1):
                        nullable = False
                # Also check @NotNull annotation
                if '@NotNull' in combined:
                    nullable = False
                # Check ManyToOne optional=false
                if re.search(r'@ManyToOne\s*\([^)]*optional\s*=\s*false', combined):
                    nullable = False

                # Extract max length
                max_length = None
                if col_match:
                    len_match = re.search(r'length\s*=\s*(\d+)', col_match.group(1))
                    if len_match:
                        max_length = int(len_match.group(1))

                # Detect relationship types
                if '@ManyToOne' in combined:
                    annotations.append('ManyToOne') if 'ManyToOne' not in annotations else None
                if '@OneToMany' in combined:
                    annotations.append('OneToMany') if 'OneToMany' not in annotations else None
                if '@OneToOne' in combined:
                    annotations.append('OneToOne') if 'OneToOne' not in annotations else None
                if '@ManyToMany' in combined:
                    annotations.append('ManyToMany') if 'ManyToMany' not in annotations else None

                attributes.append(AttributeInfo(
                    name=field_name,
                    javaType=java_type,
                    columnName=column_name,
                    isEnum=is_enum,
                    enumClass=enum_class,
                    enumValues=enum_values,
                    nullable=nullable,
                    maxLength=max_length,
                    annotations=list(set(annotations))  # Remove duplicates
                ))

            i += 1

        return attributes

    def _parse_enum_file(self, file_path: Path) -> Optional[EnumInfo]:
        """Parse a Java enum file."""
        try:
            content = file_path.read_text(encoding='utf-8')
        except Exception as e:
            print(f"Warning: Could not read {file_path}: {e}")
            return None

        # Extract enum name
        enum_match = self.ENUM_DECLARATION.search(content)
        if not enum_match:
            return None

        enum_name = enum_match.group(1)

        # Extract enum values
        values = []

        # Find the enum body
        enum_start = content.find('{', enum_match.end())
        if enum_start == -1:
            return None

        # Find where enum constants end - look for semicolon followed by method/field or just the last constant
        enum_body = content[enum_start + 1:]

        # Find the end of constants section (after last constant, before methods)
        # Constants section ends at first semicolon that's not inside parentheses, or at first method
        brace_depth = 0
        paren_depth = 0
        constants_end = len(enum_body)

        for i, char in enumerate(enum_body):
            if char == '(':
                paren_depth += 1
            elif char == ')':
                paren_depth -= 1
            elif char == '{':
                brace_depth += 1
            elif char == '}':
                if brace_depth == 0:
                    constants_end = i
                    break
                brace_depth -= 1
            elif char == ';' and paren_depth == 0 and brace_depth == 0:
                # This semicolon ends the constants section
                constants_end = i
                break

        constants_section = enum_body[:constants_end]

        # Extract enum constants - match identifier followed by optional (params) and comma/semicolon
        # Handle both UPPER_CASE and lower_case enum values
        # Also handle annotations before enum values
        ordinal = 0

        # Split by comma to get individual constant declarations
        # But be careful with commas inside parentheses
        current_const = ""
        paren_depth = 0

        for char in constants_section:
            if char == '(':
                paren_depth += 1
                current_const += char
            elif char == ')':
                paren_depth -= 1
                current_const += char
            elif char == ',' and paren_depth == 0:
                # End of a constant
                const_match = re.search(r'([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\([^)]*\))?\s*$', current_const.strip())
                if const_match:
                    value_name = const_match.group(1)
                    # Skip if it looks like a type or annotation
                    if value_name not in ('int', 'String', 'boolean', 'implements', 'extends'):
                        values.append(EnumValue(name=value_name, ordinal=ordinal))
                        ordinal += 1
                current_const = ""
            else:
                current_const += char

        # Don't forget the last constant (no trailing comma)
        if current_const.strip():
            const_match = re.search(r'([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\([^)]*\))?\s*$', current_const.strip())
            if const_match:
                value_name = const_match.group(1)
                if value_name not in ('int', 'String', 'boolean', 'implements', 'extends'):
                    values.append(EnumValue(name=value_name, ordinal=ordinal))

        if not values:
            return None

        # Get relative path
        try:
            rel_path = file_path.relative_to(self.source_root)
        except ValueError:
            rel_path = file_path.name

        return EnumInfo(
            name=enum_name,
            sourcePath=str(rel_path),
            lastModified=self._get_mtime(file_path).isoformat(),
            values=values
        )


def get_module_name(alias: str) -> str:
    """Get human-readable module name from alias."""
    names = {
        "am": "Agent Management",
        "as": "Appointment Scheduling",
        "bm": "Billing Management",
        "cb": "Cognitive Backend",
        "ce": "Condition Engine",
        "cf": "Calculation/Formula",
        "cm": "Contract Management",
        "cp": "Commission/Provision",
        "cr": "Customer Relationship",
        "dm": "Document Management",
        "ea": "Entity Analyze",
        "em": "Entity Mapping",
        "eu": "End User",
        "ex": "External API",
        "ha": "Alpha Integration",
        "hb": "Bipro Integration",
        "hc": "Core Integration",
        "im": "Import Management",
        "jb": "Job/Batch Processing",
        "lg": "Logic Module",
        "lm": "Lead Management",
        "ns": "Notification System",
        "ol": "Outlet/CMS",
        "pc": "Phone Call/Protocol",
        "rp": "Report Framework",
        "si": "Search Index",
        "te": "Template Engine",
        "tm": "Ticket Management",
        "ui": "UI Configuration",
        "um": "User Management",
        "wf": "Workflow Engine"
    }
    return names.get(alias, alias.upper())


def load_state(module_alias: str) -> Optional[Dict]:
    """Load the state file for a module."""
    state_file = MODULES_DIR / module_alias / f"{module_alias}_state.json"
    if state_file.exists():
        try:
            with open(state_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return None


def save_state(module_alias: str, index: ModuleIndex, process_type: str):
    """Save the state file for a module."""
    module_dir = MODULES_DIR / module_alias
    module_dir.mkdir(parents=True, exist_ok=True)

    state = {
        "moduleAlias": module_alias,
        "lastProcessedAt": datetime.now().isoformat(),
        "lastProcessedBy": "generate_index.py",
        "processType": process_type,
        "entitiesIndexed": [e.alias for e in index.entities],
        "enumsIndexed": [e.name for e in index.enums],
        "summary": index.summary
    }

    state_file = module_dir / f"{module_alias}_state.json"
    with open(state_file, 'w', encoding='utf-8') as f:
        json.dump(state, f, indent=2, ensure_ascii=False)


def save_index(module_alias: str, index: ModuleIndex):
    """Save the index file for a module."""
    module_dir = MODULES_DIR / module_alias
    module_dir.mkdir(parents=True, exist_ok=True)

    index_file = module_dir / f"{module_alias}_index.json"
    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(index.to_dict(), f, indent=2, ensure_ascii=False)

    return index_file


def generate_index(module_alias: str, delta: bool = False, verbose: bool = False) -> Optional[ModuleIndex]:
    """Generate index for a single module."""
    source_root = BACKEND_SRC / module_alias

    if not source_root.exists():
        print(f"Warning: Source directory not found: {source_root}")
        return None

    # Load previous state for delta mode
    since_timestamp = None
    if delta:
        state = load_state(module_alias)
        if state and state.get("lastProcessedAt"):
            since_timestamp = datetime.fromisoformat(state["lastProcessedAt"])
            if verbose:
                print(f"  Delta mode: processing files modified since {since_timestamp}")
        else:
            if verbose:
                print(f"  No previous state found, performing full index")

    # Parse the module
    parser = JavaSourceParser(module_alias, source_root)
    entities, enums = parser.parse_module(since_timestamp)

    # Calculate summary
    total_attributes = sum(len(e.attributes) for e in entities)
    total_enum_values = sum(len(e.values) for e in enums)

    # Create index
    index = ModuleIndex(
        moduleAlias=module_alias,
        moduleName=get_module_name(module_alias),
        generatedAt=datetime.now().isoformat(),
        indexType="delta" if delta and since_timestamp else "full",
        sourceRoot=str(source_root.relative_to(PROJECT_ROOT)),
        basedOnTimestamp=since_timestamp.isoformat() if since_timestamp else None,
        entities=entities,
        enums=enums,
        summary={
            "totalEntities": len(entities),
            "totalAttributes": total_attributes,
            "totalEnumTypes": len(enums),
            "totalEnumValues": total_enum_values
        }
    )

    return index


def main():
    parser = argparse.ArgumentParser(
        description="Generate index of entities, attributes, and enums for CB documentation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Generate index for single module (full)
    python generate_index.py --module cr

    # Generate delta index (only changed files)
    python generate_index.py --module cr --delta

    # Generate index for multiple modules
    python generate_index.py --modules cr,cm,am

    # Generate index for all known modules
    python generate_index.py --all

Output:
    Index files are written to .cb/modules/<alias>/<alias>_index.json
        """
    )

    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--module", help="Single module alias to process")
    group.add_argument("--modules", help="Comma-separated list of module aliases")
    group.add_argument("--all", action="store_true", help="Process all known modules")

    parser.add_argument("--delta", action="store_true",
                        help="Only include files modified since last processing")
    parser.add_argument("--full", action="store_true",
                        help="Generate complete index (default)")
    parser.add_argument("--verbose", "-v", action="store_true",
                        help="Show detailed output")
    parser.add_argument("--dry-run", action="store_true",
                        help="Show what would be indexed without writing files")

    args = parser.parse_args()

    # Determine modules to process
    if args.module:
        modules = [args.module]
    elif args.modules:
        modules = [m.strip() for m in args.modules.split(",")]
    else:  # --all
        modules = [m for m in KNOWN_MODULES if (BACKEND_SRC / m).exists()]

    # Ensure .cb directory exists
    CB_DIR.mkdir(parents=True, exist_ok=True)
    MODULES_DIR.mkdir(parents=True, exist_ok=True)

    # Process each module
    results = []
    for module_alias in modules:
        print(f"\nProcessing module: {module_alias}")

        index = generate_index(module_alias, delta=args.delta, verbose=args.verbose)

        if index is None:
            print(f"  Skipped: source not found")
            continue

        if args.dry_run:
            print(f"  [DRY RUN] Would index:")
            print(f"    - {index.summary['totalEntities']} entities")
            print(f"    - {index.summary['totalAttributes']} attributes")
            print(f"    - {index.summary['totalEnumTypes']} enums ({index.summary['totalEnumValues']} values)")
        else:
            # Save index and state
            index_file = save_index(module_alias, index)
            save_state(module_alias, index, "delta" if args.delta else "full")

            print(f"  Indexed:")
            print(f"    - {index.summary['totalEntities']} entities")
            print(f"    - {index.summary['totalAttributes']} attributes")
            print(f"    - {index.summary['totalEnumTypes']} enums ({index.summary['totalEnumValues']} values)")
            print(f"  Output: {index_file}")

        results.append({
            "module": module_alias,
            "entities": index.summary['totalEntities'],
            "attributes": index.summary['totalAttributes'],
            "enums": index.summary['totalEnumTypes'],
            "enumValues": index.summary['totalEnumValues']
        })

        if args.verbose and index.entities:
            print(f"  Entities found:")
            for entity in index.entities[:10]:
                print(f"    - {entity.alias} ({len(entity.attributes)} attributes)")
            if len(index.entities) > 10:
                print(f"    ... and {len(index.entities) - 10} more")

    # Print summary
    print("\n" + "=" * 50)
    print("Summary")
    print("=" * 50)
    total_entities = sum(r["entities"] for r in results)
    total_attrs = sum(r["attributes"] for r in results)
    total_enums = sum(r["enums"] for r in results)
    total_values = sum(r["enumValues"] for r in results)

    print(f"Modules processed: {len(results)}")
    print(f"Total entities: {total_entities}")
    print(f"Total attributes: {total_attrs}")
    print(f"Total enums: {total_enums} ({total_values} values)")

    if not args.dry_run:
        print(f"\nIndex files written to: {MODULES_DIR}")


if __name__ == "__main__":
    main()
