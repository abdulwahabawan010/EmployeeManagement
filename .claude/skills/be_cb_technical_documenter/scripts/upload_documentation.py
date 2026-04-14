#!/usr/bin/env python3
"""
CB Technical Documentation Uploader

This script uploads technical documentation to the Alpha CB API.
It supports both the new .cb/modules/ structure and legacy .temp/cb_batch_* directories.

Usage:
    # New structure (from .cb/modules/)
    python upload_documentation.py --module <alias> [options]
    python upload_documentation.py --modules cr,cm,am [options]

    # Legacy structure (from .temp/)
    python upload_documentation.py --input-dir <batch_directory> [options]

Options:
    --module        Single module alias to upload (from .cb/modules/<alias>/documentation/)
    --modules       Comma-separated list of module aliases
    --input-dir     Path to batch directory (legacy: .temp/cb_batch_cr_20260203_112403)
    --base-url      API base URL (default: from CB_BASE_URL env or localhost:8080)
    --tenant        Tenant header value (default: from CB_TENANT env or 'master')
    --token         Auth token (default: from CB_AUTH_TOKEN env)
    --batch-size    Items per API call (default: 50)
    --dry-run       Preview without uploading
    --verbose       Show detailed progress

Delta Mode Options:
    --delta             Enable delta mode (only upload changes)
    --remove-orphaned   Delete docs not in source files (requires --delta)

Requirements:
    pip install tqdm requests
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime

# Try to import tqdm for progress bars
try:
    from tqdm import tqdm
    HAS_TQDM = True
except ImportError:
    HAS_TQDM = False
    print("Warning: tqdm not installed. Install with 'pip install tqdm' for progress bars.")

# Try to import requests for better HTTP handling
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    import urllib.request
    import urllib.error
    import ssl

# Determine paths
SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_DIR = SCRIPT_DIR.parent
PROJECT_ROOT = SKILL_DIR.parent.parent.parent
CB_DIR = PROJECT_ROOT / ".cb"
MODULES_DIR = CB_DIR / "modules"

# Configuration
DEFAULT_BASE_URL = os.environ.get("CB_BASE_URL", "http://localhost:8080")
DEFAULT_TENANT = os.environ.get("CB_TENANT", "master")
DEFAULT_TOKEN = os.environ.get("CB_AUTH_TOKEN", "Bearer ig_access eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxIiwidG9rZW4tdHlwZSI6MSwiZXhwIjo0MTAyMzU4NDAwLCJpYXQiOjE3NzAxMTgyMDksInRlbmFudCI6Im1hc3RlciJ9.z4L9EWQz8L0W79b3cWdAWnGfR7O_0yDUXl8PuVdYbAUcPp68equKRuz2ww1PxYWXA3s_gsGRtFouvdWoljEB5w")


@dataclass
class UploadStats:
    """Track upload statistics."""
    created: int = 0
    updated: int = 0
    skipped: int = 0
    failed: int = 0
    errors: List[Dict[str, Any]] = field(default_factory=list)

    def add(self, other: 'UploadStats') -> 'UploadStats':
        """Merge another stats object into this one."""
        self.created += other.created
        self.updated += other.updated
        self.skipped += other.skipped
        self.failed += other.failed
        self.errors.extend(other.errors)
        return self

    @property
    def total(self) -> int:
        return self.created + self.updated + self.skipped + self.failed

    def __str__(self) -> str:
        return f"Created: {self.created}, Updated: {self.updated}, Skipped: {self.skipped}, Failed: {self.failed}"


@dataclass
class DeltaResult:
    """Track delta comparison results."""
    new_entities: List[Dict] = field(default_factory=list)
    modified_entities: List[Dict] = field(default_factory=list)
    unchanged_entities: List[str] = field(default_factory=list)
    orphaned_entities: List[str] = field(default_factory=list)
    new_attributes: List[Dict] = field(default_factory=list)
    modified_attributes: List[Dict] = field(default_factory=list)
    unchanged_attributes: List[str] = field(default_factory=list)
    orphaned_attributes: List[str] = field(default_factory=list)
    new_values: List[Dict] = field(default_factory=list)
    modified_values: List[Dict] = field(default_factory=list)
    unchanged_values: List[str] = field(default_factory=list)
    orphaned_values: List[str] = field(default_factory=list)

    @property
    def has_changes(self) -> bool:
        return bool(
            self.new_entities or self.modified_entities or self.orphaned_entities or
            self.new_attributes or self.modified_attributes or self.orphaned_attributes or
            self.new_values or self.modified_values or self.orphaned_values
        )


@dataclass
class ModuleState:
    """Remote module documentation state."""
    module_alias: str
    module_documented: bool
    entities: Dict[str, 'EntityState'] = field(default_factory=dict)

    @classmethod
    def from_api_response(cls, data: Dict) -> 'ModuleState':
        entities = {}
        for entity_data in data.get('entities', []):
            alias = entity_data.get('objectTypeAlias')
            entities[alias] = EntityState(
                object_type_alias=alias,
                attribute_names=set(entity_data.get('attributeNames', [])),
                enum_values={
                    k: set(v) for k, v in entity_data.get('enumValues', {}).items()
                }
            )
        return cls(
            module_alias=data.get('moduleAlias'),
            module_documented=data.get('moduleDocumented', False),
            entities=entities
        )


@dataclass
class EntityState:
    """State of a single entity's documentation."""
    object_type_alias: str
    attribute_names: set = field(default_factory=set)
    enum_values: Dict[str, set] = field(default_factory=dict)


class ApiClient:
    """HTTP client for CB API."""

    def __init__(self, base_url: str, tenant: str, token: str, timeout: int = 30):
        self.base_url = base_url.rstrip('/')
        self.tenant = tenant
        self.token = token
        self.timeout = timeout

        if HAS_REQUESTS:
            self.session = requests.Session()
            self.session.headers.update({
                "Content-Type": "application/json",
                "Accept": "application/json",
                "x-alpha-tenant": tenant,
                "IgAuthorization": token
            })
            # Disable SSL verification for dev
            self.session.verify = False
            # Suppress SSL warnings
            import urllib3
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    def post(self, endpoint: str, data: Any, retries: int = 3) -> Dict[str, Any]:
        """Make a POST request with retries."""
        url = f"{self.base_url}{endpoint}"
        last_error = None

        for attempt in range(retries):
            try:
                if HAS_REQUESTS:
                    response = self.session.post(url, json=data, timeout=self.timeout)
                    response.raise_for_status()
                    return response.json()
                else:
                    return self._urllib_post(url, data)
            except Exception as e:
                last_error = e
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff

        return {"error": True, "message": str(last_error)}

    def get(self, endpoint: str) -> Dict[str, Any]:
        """Make a GET request."""
        url = f"{self.base_url}{endpoint}"
        try:
            if HAS_REQUESTS:
                response = self.session.get(url, timeout=self.timeout)
                response.raise_for_status()
                return response.json()
            else:
                return self._urllib_get(url)
        except Exception as e:
            return {"error": True, "message": str(e)}

    def delete(self, endpoint: str) -> Dict[str, Any]:
        """Make a DELETE request."""
        url = f"{self.base_url}{endpoint}"
        try:
            if HAS_REQUESTS:
                response = self.session.delete(url, timeout=self.timeout)
                response.raise_for_status()
                # DELETE may return int or empty response
                text = response.text
                if text:
                    try:
                        return {"deleted": int(text)}
                    except ValueError:
                        return response.json()
                return {"deleted": 0}
            else:
                return self._urllib_delete(url)
        except Exception as e:
            return {"error": True, "message": str(e)}

    def _urllib_delete(self, url: str) -> Dict[str, Any]:
        """Fallback DELETE using urllib."""
        headers = {
            "Accept": "application/json",
            "x-alpha-tenant": self.tenant,
            "IgAuthorization": self.token
        }

        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE

        request = urllib.request.Request(url, headers=headers, method="DELETE")

        try:
            with urllib.request.urlopen(request, context=ssl_context, timeout=self.timeout) as response:
                response_body = response.read().decode('utf-8')
                if response_body:
                    try:
                        return {"deleted": int(response_body)}
                    except ValueError:
                        return json.loads(response_body)
                return {"deleted": 0}
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8') if e.fp else ""
            return {"error": True, "status_code": e.code, "message": str(e), "details": error_body}

    def _urllib_post(self, url: str, data: Any) -> Dict[str, Any]:
        """Fallback POST using urllib."""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "x-alpha-tenant": self.tenant,
            "IgAuthorization": self.token
        }
        body = json.dumps(data).encode('utf-8')

        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE

        request = urllib.request.Request(url, data=body, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(request, context=ssl_context, timeout=self.timeout) as response:
                response_body = response.read().decode('utf-8')
                return json.loads(response_body) if response_body else {}
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8') if e.fp else ""
            return {"error": True, "status_code": e.code, "message": str(e), "details": error_body}

    def _urllib_get(self, url: str) -> Dict[str, Any]:
        """Fallback GET using urllib."""
        headers = {
            "Accept": "application/json",
            "x-alpha-tenant": self.tenant,
            "IgAuthorization": self.token
        }

        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE

        request = urllib.request.Request(url, headers=headers, method="GET")

        try:
            with urllib.request.urlopen(request, context=ssl_context, timeout=self.timeout) as response:
                response_body = response.read().decode('utf-8')
                return json.loads(response_body) if response_body else {}
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8') if e.fp else ""
            return {"error": True, "status_code": e.code, "message": str(e), "details": error_body}


class DocumentationUploader:
    """Handles uploading documentation to the CB API."""

    def __init__(self, client: ApiClient, batch_size: int = 50, verbose: bool = False):
        self.client = client
        self.batch_size = batch_size
        self.verbose = verbose

    def scan_batch_directory(self, batch_dir: Path) -> Dict[str, List[Dict]]:
        """
        Scan a batch directory and categorize files by type.

        Returns:
            Dict with keys: modules, entities, attributes, attribute_values
        """
        result = {
            "modules": [],
            "entities": [],
            "attributes": [],
            "attribute_values": []
        }

        for json_file in sorted(batch_dir.glob("*.json")):
            if json_file.name.startswith("_"):
                continue  # Skip summary files

            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    content = json.load(f)

                doc_type = content.get("metadata", {}).get("doc_type", "")
                data = content.get("data", {})

                if doc_type == "module":
                    result["modules"].append(data)
                elif doc_type == "entity":
                    result["entities"].append(self._convert_entity_doc(data))
                elif doc_type == "attribute":
                    result["attributes"].append(self._convert_attribute_doc(data))
                elif doc_type == "enum":
                    # Convert enum to attribute values
                    result["attribute_values"].extend(self._convert_enum_to_values(data))

            except Exception as e:
                if self.verbose:
                    print(f"Warning: Could not read {json_file}: {e}")

        return result

    def scan_module_documentation(self, module_alias: str) -> Dict[str, List[Dict]]:
        """
        Scan the new .cb/modules/<alias>/documentation/ structure.

        Returns:
            Dict with keys: modules, entities, attributes, attribute_values
        """
        result = {
            "modules": [],
            "entities": [],
            "attributes": [],
            "attribute_values": []
        }

        doc_dir = MODULES_DIR / module_alias / "documentation"
        if not doc_dir.exists():
            if self.verbose:
                print(f"Warning: Documentation directory not found: {doc_dir}")
            return result

        # Load module documentation
        module_file = doc_dir / "module.json"
        if module_file.exists():
            try:
                with open(module_file, 'r', encoding='utf-8') as f:
                    content = json.load(f)
                data = content.get("data", content)
                metadata = content.get("metadata", {})
                if data:
                    # Add moduleAlias from metadata for API compatibility
                    module_alias = metadata.get("moduleAlias")
                    if module_alias and "moduleAlias" not in data:
                        data = dict(data)  # Make a copy to avoid modifying original
                        data["moduleAlias"] = module_alias
                    result["modules"].append(data)
            except Exception as e:
                if self.verbose:
                    print(f"Warning: Could not read {module_file}: {e}")

        # Load entity documentation
        entities_dir = doc_dir / "entities"
        if entities_dir.exists():
            for json_file in sorted(entities_dir.glob("*.json")):
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        content = json.load(f)
                    data = content.get("data", content)
                    metadata = content.get("metadata", {})
                    if data:
                        result["entities"].append(self._convert_cb_entity_doc(data, metadata))
                except Exception as e:
                    if self.verbose:
                        print(f"Warning: Could not read {json_file}: {e}")

        # Load attribute documentation
        attributes_dir = doc_dir / "attributes"
        if attributes_dir.exists():
            for json_file in sorted(attributes_dir.glob("*.json")):
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        content = json.load(f)
                    metadata = content.get("metadata", {})
                    data = content.get("data", content)
                    if data:
                        # Get entity alias from metadata or filename
                        entity_alias = metadata.get("entityAlias") or data.get("entityAlias")
                        attr_name = metadata.get("attributeName") or data.get("attributeName")
                        result["attributes"].append(self._convert_cb_attribute_doc(data, entity_alias, attr_name))
                except Exception as e:
                    if self.verbose:
                        print(f"Warning: Could not read {json_file}: {e}")

        # Load attribute value documentation
        values_dir = doc_dir / "attribute_values"
        if values_dir.exists():
            for json_file in sorted(values_dir.glob("*.json")):
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        content = json.load(f)
                    metadata = content.get("metadata", {})
                    data = content.get("data", content)
                    if data:
                        entity_alias = metadata.get("entityAlias") or data.get("entityAlias")
                        attr_name = metadata.get("attributeName") or data.get("attributeName")
                        value_name = metadata.get("valueName") or data.get("valueName")

                        # Skip standalone enums (entity_alias is just module prefix without dot)
                        # These aren't real JPA entities, so they can't be documented in CB
                        if entity_alias and '.' not in entity_alias:
                            if self.verbose:
                                print(f"Skipping standalone enum value: {entity_alias}.{attr_name}.{value_name}")
                            continue

                        result["attribute_values"].append(
                            self._convert_cb_value_doc(data, entity_alias, attr_name, value_name)
                        )
                except Exception as e:
                    if self.verbose:
                        print(f"Warning: Could not read {json_file}: {e}")

        return result

    def _convert_cb_entity_doc(self, data: Dict, metadata: Dict = None) -> Dict:
        """Convert .cb entity doc format to API format."""
        # Get objectTypeAlias from metadata if not in data
        object_type_alias = data.get("objectTypeAlias")
        if not object_type_alias and metadata:
            object_type_alias = metadata.get("entityAlias")

        return {
            "objectTypeAlias": object_type_alias,
            "purpose": data.get("purpose"),
            "businessDescription": data.get("businessDescription"),
            "technicalDescription": data.get("technicalDescription"),
            "usageNotes": data.get("usageNotes"),
            "domainContext": data.get("domainContext")
        }

    def _convert_cb_attribute_doc(self, data: Dict, entity_alias: str = None, attr_name: str = None) -> Dict:
        """Convert .cb attribute doc format to API format."""
        return {
            "objectTypeAlias": entity_alias or data.get("entityAlias") or data.get("objectTypeAlias"),
            "attributeName": attr_name or data.get("attributeName"),
            "purpose": data.get("purpose"),
            "businessDescription": data.get("businessDescription"),
            "technicalDescription": data.get("technicalDescription"),
            "exampleValues": data.get("exampleValues"),
            "validationRules": data.get("validationRules")
        }

    def _convert_cb_value_doc(self, data: Dict, entity_alias: str = None, attr_name: str = None, value_name: str = None) -> Dict:
        """Convert .cb attribute value doc format to API format."""
        return {
            "objectTypeAlias": entity_alias or data.get("entityAlias") or data.get("objectTypeAlias"),
            "attributeName": attr_name or data.get("attributeName"),
            "valueName": value_name or data.get("valueName"),
            "ordinalValue": data.get("ordinalValue", 0),
            "purpose": data.get("purpose"),
            "businessDescription": data.get("businessDescription"),
            "technicalDescription": data.get("technicalDescription"),
            "usageNotes": data.get("usageNotes")
        }

    def _convert_entity_doc(self, data: Dict) -> Dict:
        """Convert batch entity doc format to API format."""
        return {
            "objectTypeAlias": data.get("objectTypeAlias"),
            "purpose": data.get("purpose"),
            "businessDescription": data.get("businessDescription"),
            "technicalDescription": data.get("technicalDescription"),
            "usageNotes": data.get("usageNotes"),
            "domainContext": data.get("domainContext")
        }

    def _convert_attribute_doc(self, data: Dict) -> Dict:
        """Convert batch attribute doc format to API format."""
        return {
            "objectTypeAlias": data.get("entityAlias"),
            "attributeName": data.get("attributeName"),
            "purpose": data.get("purpose"),
            "businessDescription": data.get("businessDescription"),
            "technicalDescription": data.get("technicalDescription"),
            "exampleValues": data.get("exampleValues"),
            "validationRules": data.get("validationRules")
        }

    def _convert_enum_to_values(self, data: Dict) -> List[Dict]:
        """Convert batch enum doc format to attribute value API format."""
        entity_alias = data.get("entityAlias")
        # The attribute name is often the field that uses this enum
        # For now, we'll use the enum name as the attribute name
        # This might need adjustment based on actual usage
        enum_name = data.get("enumName", "")

        values = []
        for idx, value in enumerate(data.get("values", [])):
            values.append({
                "objectTypeAlias": entity_alias,
                "attributeName": enum_name.lower() if enum_name else "status",
                "ordinalValue": idx,
                "valueName": value.get("value"),
                "purpose": value.get("label") or value.get("value"),
                "businessDescription": value.get("businessDescription"),
                "technicalDescription": value.get("technicalDescription"),
                "usageNotes": None
            })

        return values

    def upload_modules(self, modules: List[Dict], dry_run: bool = False) -> UploadStats:
        """Upload module documentation."""
        stats = UploadStats()

        if not modules:
            return stats

        if dry_run:
            print(f"[DRY RUN] Would upload {len(modules)} module(s)")
            return stats

        # Use batch endpoint
        result = self.client.post("/mvsa/cb/technicalDoc/import/modules", modules)

        if result.get("error"):
            stats.failed = len(modules)
            stats.errors.append({"type": "modules", "error": result})
        else:
            stats.created = result.get("created", 0)
            stats.updated = result.get("updated", 0)
            stats.skipped = result.get("skipped", 0)
            stats.failed = result.get("failed", 0)
            if result.get("errors"):
                stats.errors.extend([{"type": "module", **e} for e in result["errors"]])

        return stats

    def upload_entities(self, entities: List[Dict], dry_run: bool = False) -> UploadStats:
        """Upload entity documentation in batches."""
        stats = UploadStats()

        if not entities:
            return stats

        if dry_run:
            print(f"[DRY RUN] Would upload {len(entities)} entity(s)")
            return stats

        # Process in batches
        batches = [entities[i:i + self.batch_size] for i in range(0, len(entities), self.batch_size)]

        iterator = tqdm(batches, desc="Uploading entities", unit="batch") if HAS_TQDM else batches

        for batch in iterator:
            result = self.client.post("/mvsa/cb/technicalDoc/import/entities", batch)

            if result.get("error"):
                stats.failed += len(batch)
                stats.errors.append({"type": "entities", "error": result})
            else:
                stats.created += result.get("created", 0)
                stats.updated += result.get("updated", 0)
                stats.skipped += result.get("skipped", 0)
                stats.failed += result.get("failed", 0)
                if result.get("errors"):
                    stats.errors.extend([{"type": "entity", **e} for e in result["errors"]])

        return stats

    def upload_attributes(self, attributes: List[Dict], dry_run: bool = False) -> UploadStats:
        """Upload attribute documentation in batches."""
        stats = UploadStats()

        if not attributes:
            return stats

        if dry_run:
            print(f"[DRY RUN] Would upload {len(attributes)} attribute(s)")
            return stats

        # Process in batches
        batches = [attributes[i:i + self.batch_size] for i in range(0, len(attributes), self.batch_size)]

        iterator = tqdm(batches, desc="Uploading attributes", unit="batch") if HAS_TQDM else batches

        for batch in iterator:
            result = self.client.post("/mvsa/cb/technicalDoc/import/attributes", batch)

            if result.get("error"):
                stats.failed += len(batch)
                stats.errors.append({"type": "attributes", "error": result})
            else:
                stats.created += result.get("created", 0)
                stats.updated += result.get("updated", 0)
                stats.skipped += result.get("skipped", 0)
                stats.failed += result.get("failed", 0)
                if result.get("errors"):
                    stats.errors.extend([{"type": "attribute", **e} for e in result["errors"]])

        return stats

    def upload_attribute_values(self, values: List[Dict], dry_run: bool = False) -> UploadStats:
        """Upload attribute value documentation in batches."""
        stats = UploadStats()

        if not values:
            return stats

        if dry_run:
            print(f"[DRY RUN] Would upload {len(values)} attribute value(s)")
            return stats

        # Process in batches
        batches = [values[i:i + self.batch_size] for i in range(0, len(values), self.batch_size)]

        iterator = tqdm(batches, desc="Uploading attr values", unit="batch") if HAS_TQDM else batches

        for batch in iterator:
            result = self.client.post("/mvsa/cb/technicalDoc/import/attributeValues", batch)

            if result.get("error"):
                stats.failed += len(batch)
                stats.errors.append({"type": "attribute_values", "error": result})
            else:
                stats.created += result.get("created", 0)
                stats.updated += result.get("updated", 0)
                stats.skipped += result.get("skipped", 0)
                stats.failed += result.get("failed", 0)
                if result.get("errors"):
                    stats.errors.extend([{"type": "attribute_value", **e} for e in result["errors"]])

        return stats

    # ========== Delta Mode Methods ==========

    def fetch_module_state(self, module_alias: str) -> Optional[ModuleState]:
        """Fetch current documentation state from the API."""
        result = self.client.get(f"/mvsa/cb/technicalDoc/module/{module_alias}/state")

        if result.get("error"):
            if self.verbose:
                print(f"Warning: Could not fetch module state: {result.get('message')}")
            return None

        return ModuleState.from_api_response(result)

    def compute_delta(self, local_docs: Dict[str, List[Dict]], remote_state: ModuleState) -> DeltaResult:
        """
        Compare local documentation with remote state and compute delta.

        Args:
            local_docs: Dict with keys: modules, entities, attributes, attribute_values
            remote_state: Current remote documentation state

        Returns:
            DeltaResult with categorized changes
        """
        delta = DeltaResult()

        # Get local entity aliases
        local_entity_aliases = set()
        local_entities_by_alias = {}
        for entity in local_docs.get("entities", []):
            alias = entity.get("objectTypeAlias")
            if alias:
                local_entity_aliases.add(alias)
                local_entities_by_alias[alias] = entity

        # Get remote entity aliases
        remote_entity_aliases = set(remote_state.entities.keys())

        # Find new, existing, and orphaned entities
        new_entity_aliases = local_entity_aliases - remote_entity_aliases
        existing_entity_aliases = local_entity_aliases & remote_entity_aliases
        orphaned_entity_aliases = remote_entity_aliases - local_entity_aliases

        # Categorize entities
        for alias in new_entity_aliases:
            delta.new_entities.append(local_entities_by_alias[alias])

        for alias in existing_entity_aliases:
            # For now, treat all existing as potentially modified
            # A more sophisticated approach would compare field values
            delta.modified_entities.append(local_entities_by_alias[alias])

        delta.orphaned_entities = list(orphaned_entity_aliases)

        # Process attributes
        local_attrs_by_key = {}
        for attr in local_docs.get("attributes", []):
            key = f"{attr.get('objectTypeAlias')}.{attr.get('attributeName')}"
            local_attrs_by_key[key] = attr

        remote_attrs_by_key = set()
        for entity_alias, entity_state in remote_state.entities.items():
            for attr_name in entity_state.attribute_names:
                remote_attrs_by_key.add(f"{entity_alias}.{attr_name}")

        local_attr_keys = set(local_attrs_by_key.keys())

        # Find new, existing, and orphaned attributes
        new_attr_keys = local_attr_keys - remote_attrs_by_key
        existing_attr_keys = local_attr_keys & remote_attrs_by_key
        orphaned_attr_keys = remote_attrs_by_key - local_attr_keys

        for key in new_attr_keys:
            delta.new_attributes.append(local_attrs_by_key[key])

        for key in existing_attr_keys:
            delta.modified_attributes.append(local_attrs_by_key[key])

        delta.orphaned_attributes = list(orphaned_attr_keys)

        # Process attribute values
        local_values_by_key = {}
        for value in local_docs.get("attribute_values", []):
            key = f"{value.get('objectTypeAlias')}.{value.get('attributeName')}.{value.get('valueName')}"
            local_values_by_key[key] = value

        remote_values_by_key = set()
        for entity_alias, entity_state in remote_state.entities.items():
            for attr_name, values in entity_state.enum_values.items():
                for value_name in values:
                    remote_values_by_key.add(f"{entity_alias}.{attr_name}.{value_name}")

        local_value_keys = set(local_values_by_key.keys())

        # Find new, existing, and orphaned values
        new_value_keys = local_value_keys - remote_values_by_key
        existing_value_keys = local_value_keys & remote_values_by_key
        orphaned_value_keys = remote_values_by_key - local_value_keys

        for key in new_value_keys:
            delta.new_values.append(local_values_by_key[key])

        for key in existing_value_keys:
            delta.modified_values.append(local_values_by_key[key])

        delta.orphaned_values = list(orphaned_value_keys)

        return delta

    def upload_delta(
        self,
        delta: DeltaResult,
        remove_orphaned: bool = False,
        dry_run: bool = False
    ) -> Tuple[UploadStats, UploadStats, int]:
        """
        Upload only the delta changes.

        Args:
            delta: Computed delta result
            remove_orphaned: Whether to delete orphaned documentation
            dry_run: Preview without making changes

        Returns:
            Tuple of (new_stats, update_stats, deleted_count)
        """
        new_stats = UploadStats()
        update_stats = UploadStats()
        deleted_count = 0

        # Upload new entities
        if delta.new_entities:
            if dry_run:
                print(f"[DRY RUN] Would create {len(delta.new_entities)} new entity(s)")
            else:
                new_stats.add(self.upload_entities(delta.new_entities))

        # Upload modified entities (will be updated via upsert)
        if delta.modified_entities:
            if dry_run:
                print(f"[DRY RUN] Would update {len(delta.modified_entities)} existing entity(s)")
            else:
                update_stats.add(self.upload_entities(delta.modified_entities))

        # Upload new attributes
        if delta.new_attributes:
            if dry_run:
                print(f"[DRY RUN] Would create {len(delta.new_attributes)} new attribute(s)")
            else:
                new_stats.add(self.upload_attributes(delta.new_attributes))

        # Upload modified attributes
        if delta.modified_attributes:
            if dry_run:
                print(f"[DRY RUN] Would update {len(delta.modified_attributes)} existing attribute(s)")
            else:
                update_stats.add(self.upload_attributes(delta.modified_attributes))

        # Upload new attribute values
        if delta.new_values:
            if dry_run:
                print(f"[DRY RUN] Would create {len(delta.new_values)} new attribute value(s)")
            else:
                new_stats.add(self.upload_attribute_values(delta.new_values))

        # Upload modified attribute values
        if delta.modified_values:
            if dry_run:
                print(f"[DRY RUN] Would update {len(delta.modified_values)} existing attribute value(s)")
            else:
                update_stats.add(self.upload_attribute_values(delta.modified_values))

        # Delete orphaned documentation if requested
        if remove_orphaned:
            # Delete orphaned attribute values first
            for key in delta.orphaned_values:
                parts = key.split(".")
                if len(parts) >= 3:
                    entity_alias = ".".join(parts[:-2])
                    attr_name = parts[-2]
                    value_name = parts[-1]
                    if dry_run:
                        print(f"[DRY RUN] Would delete orphaned value: {key}")
                    else:
                        result = self.client.delete(
                            f"/mvsa/cb/technicalDoc/attributeValue/{entity_alias}/{attr_name}/{value_name}"
                        )
                        if not result.get("error"):
                            deleted_count += result.get("deleted", 0)

            # Delete orphaned attributes
            for key in delta.orphaned_attributes:
                parts = key.rsplit(".", 1)
                if len(parts) == 2:
                    entity_alias = parts[0]
                    attr_name = parts[1]
                    if dry_run:
                        print(f"[DRY RUN] Would delete orphaned attribute: {key}")
                    else:
                        result = self.client.delete(
                            f"/mvsa/cb/technicalDoc/attribute/{entity_alias}/{attr_name}"
                        )
                        if not result.get("error"):
                            deleted_count += result.get("deleted", 0)

            # Delete orphaned entities
            for entity_alias in delta.orphaned_entities:
                if dry_run:
                    print(f"[DRY RUN] Would delete orphaned entity: {entity_alias}")
                else:
                    result = self.client.delete(f"/mvsa/cb/technicalDoc/entity/{entity_alias}")
                    if not result.get("error"):
                        deleted_count += result.get("deleted", 0)

        return new_stats, update_stats, deleted_count

    def print_delta_summary(self, delta: DeltaResult):
        """Print a summary of delta changes."""
        print_header("Delta Summary", "-")

        print(f"{'Type':<20} {'New':>10} {'Modified':>10} {'Orphaned':>10}")
        print("-" * 50)
        print(f"{'Entities':<20} {len(delta.new_entities):>10} {len(delta.modified_entities):>10} {len(delta.orphaned_entities):>10}")
        print(f"{'Attributes':<20} {len(delta.new_attributes):>10} {len(delta.modified_attributes):>10} {len(delta.orphaned_attributes):>10}")
        print(f"{'Attr Values':<20} {len(delta.new_values):>10} {len(delta.modified_values):>10} {len(delta.orphaned_values):>10}")
        print("-" * 50)

        if delta.orphaned_entities:
            print("\nOrphaned Entities (would be deleted with --remove-orphaned):")
            for alias in delta.orphaned_entities[:10]:
                print(f"  - {alias}")
            if len(delta.orphaned_entities) > 10:
                print(f"  ... and {len(delta.orphaned_entities) - 10} more")

        if delta.orphaned_attributes:
            print("\nOrphaned Attributes (would be deleted with --remove-orphaned):")
            for key in delta.orphaned_attributes[:10]:
                print(f"  - {key}")
            if len(delta.orphaned_attributes) > 10:
                print(f"  ... and {len(delta.orphaned_attributes) - 10} more")


def print_header(title: str, char: str = "="):
    """Print a formatted header."""
    print(f"\n{title}")
    print(char * len(title))


def print_summary(
    module_stats: UploadStats,
    entity_stats: UploadStats,
    attribute_stats: UploadStats,
    value_stats: UploadStats,
    duration: float
):
    """Print a summary of the upload results."""
    print_header("Summary")

    print(f"{'Type':<20} {'Created':>10} {'Updated':>10} {'Skipped':>10} {'Failed':>10}")
    print("-" * 60)
    print(f"{'Modules':<20} {module_stats.created:>10} {module_stats.updated:>10} {module_stats.skipped:>10} {module_stats.failed:>10}")
    print(f"{'Entities':<20} {entity_stats.created:>10} {entity_stats.updated:>10} {entity_stats.skipped:>10} {entity_stats.failed:>10}")
    print(f"{'Attributes':<20} {attribute_stats.created:>10} {attribute_stats.updated:>10} {attribute_stats.skipped:>10} {attribute_stats.failed:>10}")
    print(f"{'Attribute Values':<20} {value_stats.created:>10} {value_stats.updated:>10} {value_stats.skipped:>10} {value_stats.failed:>10}")
    print("-" * 60)

    total_created = module_stats.created + entity_stats.created + attribute_stats.created + value_stats.created
    total_updated = module_stats.updated + entity_stats.updated + attribute_stats.updated + value_stats.updated
    total_skipped = module_stats.skipped + entity_stats.skipped + attribute_stats.skipped + value_stats.skipped
    total_failed = module_stats.failed + entity_stats.failed + attribute_stats.failed + value_stats.failed

    print(f"{'TOTAL':<20} {total_created:>10} {total_updated:>10} {total_skipped:>10} {total_failed:>10}")
    print()
    print(f"Duration: {duration:.2f}s")

    # Print errors if any
    all_errors = module_stats.errors + entity_stats.errors + attribute_stats.errors + value_stats.errors
    if all_errors:
        print_header("Errors", "-")
        for error in all_errors[:10]:  # Limit to first 10 errors
            print(f"  - [{error.get('type', 'unknown')}] {error.get('item', 'N/A')}: {error.get('message', error)}")
        if len(all_errors) > 10:
            print(f"  ... and {len(all_errors) - 10} more errors")


def print_delta_upload_summary(
    new_stats: UploadStats,
    update_stats: UploadStats,
    deleted_count: int,
    delta: DeltaResult,
    duration: float
):
    """Print a summary of the delta upload results."""
    print_header("Delta Upload Summary")

    print(f"{'Operation':<20} {'Entities':>10} {'Attributes':>10} {'Values':>10}")
    print("-" * 50)
    print(f"{'New':<20} {len(delta.new_entities):>10} {len(delta.new_attributes):>10} {len(delta.new_values):>10}")
    print(f"{'Updated':<20} {len(delta.modified_entities):>10} {len(delta.modified_attributes):>10} {len(delta.modified_values):>10}")
    print(f"{'Deleted':<20} {len(delta.orphaned_entities):>10} {len(delta.orphaned_attributes):>10} {len(delta.orphaned_values):>10}")
    print("-" * 50)

    print()
    print(f"API Results:")
    print(f"  Created: {new_stats.created}")
    print(f"  Updated: {update_stats.updated}")
    print(f"  Deleted: {deleted_count}")
    print(f"  Skipped: {new_stats.skipped + update_stats.skipped}")
    print(f"  Failed:  {new_stats.failed + update_stats.failed}")
    print()
    print(f"Duration: {duration:.2f}s")

    # Print errors if any
    all_errors = new_stats.errors + update_stats.errors
    if all_errors:
        print_header("Errors", "-")
        for error in all_errors[:10]:
            print(f"  - [{error.get('type', 'unknown')}] {error.get('item', 'N/A')}: {error.get('message', error)}")
        if len(all_errors) > 10:
            print(f"  ... and {len(all_errors) - 10} more errors")


def main():
    parser = argparse.ArgumentParser(
        description="Upload CB technical documentation to the API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Upload from .cb/modules/ (new structure)
    python upload_documentation.py --module cr
    python upload_documentation.py --modules cr,cm,am

    # Upload from legacy .temp/ directory
    python upload_documentation.py --input-dir .temp/cb_batch_cr_20260203_112403

    # Dry run to preview what would be uploaded
    python upload_documentation.py --module cr --dry-run

    # Delta mode: only upload changes
    python upload_documentation.py --module cr --delta

    # Delta mode with orphan removal
    python upload_documentation.py --module cr --delta --remove-orphaned

    # With custom API settings
    python upload_documentation.py --module cr --base-url https://api.example.com
        """
    )

    # Input source - mutually exclusive
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument(
        "--module",
        help="Single module alias to upload from .cb/modules/<alias>/documentation/"
    )
    input_group.add_argument(
        "--modules",
        help="Comma-separated list of module aliases to upload"
    )
    input_group.add_argument(
        "--input-dir",
        help="Path to legacy batch directory (e.g., .temp/cb_batch_cr_*)"
    )
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE_URL,
        help=f"API base URL (default: {DEFAULT_BASE_URL})"
    )
    parser.add_argument(
        "--tenant",
        default=DEFAULT_TENANT,
        help=f"Tenant header value (default: {DEFAULT_TENANT})"
    )
    parser.add_argument(
        "--token",
        default=DEFAULT_TOKEN,
        help="Authentication token"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=50,
        help="Items per API call (default: 50)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview without uploading"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Show detailed progress"
    )
    # Delta mode arguments
    parser.add_argument(
        "--delta",
        action="store_true",
        help="Enable delta mode (only upload changes)"
    )
    parser.add_argument(
        "--remove-orphaned",
        action="store_true",
        help="Delete documentation not in source files (requires --delta)"
    )

    args = parser.parse_args()

    # Validate arguments
    if args.remove_orphaned and not args.delta:
        print("Error: --remove-orphaned requires --delta mode")
        sys.exit(1)

    # Determine modules to process
    modules_to_process = []
    use_new_structure = False

    if args.module:
        modules_to_process = [args.module]
        use_new_structure = True
    elif args.modules:
        modules_to_process = [m.strip() for m in args.modules.split(",")]
        use_new_structure = True
    elif args.input_dir:
        # Legacy mode - use input directory
        batch_dir = Path(args.input_dir)
        if not batch_dir.exists():
            print(f"Error: Input directory not found: {args.input_dir}")
            sys.exit(1)

    # Print header
    print_header("CB Technical Documentation Upload")
    if use_new_structure:
        print(f"Modules: {', '.join(modules_to_process)}")
        print(f"Source: .cb/modules/")
    else:
        print(f"Input Directory: {batch_dir}")
    print(f"Target: {args.base_url}")
    print(f"Tenant: {args.tenant}")
    if args.delta:
        print("Mode: DELTA (incremental sync)")
        if args.remove_orphaned:
            print("  - Will remove orphaned documentation")
    if args.dry_run:
        print("Mode: DRY RUN (no changes will be made)")
    print()

    # Create client and uploader
    client = ApiClient(args.base_url, args.tenant, args.token)
    uploader = DocumentationUploader(client, args.batch_size, args.verbose)

    # Scan files based on mode
    if use_new_structure:
        # New .cb/modules/ structure
        docs = {
            "modules": [],
            "entities": [],
            "attributes": [],
            "attribute_values": []
        }
        for module_alias in modules_to_process:
            print(f"Scanning module: {module_alias}...")
            module_docs = uploader.scan_module_documentation(module_alias)
            docs["modules"].extend(module_docs["modules"])
            docs["entities"].extend(module_docs["entities"])
            docs["attributes"].extend(module_docs["attributes"])
            docs["attribute_values"].extend(module_docs["attribute_values"])
            print(f"  Found: {len(module_docs['modules'])} module, {len(module_docs['entities'])} entities, "
                  f"{len(module_docs['attributes'])} attributes, {len(module_docs['attribute_values'])} values")
        module_alias = modules_to_process[0] if len(modules_to_process) == 1 else None
    else:
        # Legacy .temp/ structure
        print("Scanning files...")
        docs = uploader.scan_batch_directory(batch_dir)
        # Determine module alias from entities or directory name
        module_alias = None
        if docs['entities']:
            first_entity = docs['entities'][0].get('objectTypeAlias', '')
            if '.' in first_entity:
                module_alias = first_entity.split('.')[0]
        if not module_alias:
            dir_name = batch_dir.name
            parts = dir_name.split('_')
            if len(parts) >= 3 and parts[0] == 'cb' and parts[1] == 'batch':
                module_alias = parts[2]

    print(f"\nTotal: {len(docs['modules'])} module(s), {len(docs['entities'])} entity(s), "
          f"{len(docs['attributes'])} attribute(s), {len(docs['attribute_values'])} enum value(s)")
    print()

    # Start upload
    start_time = time.time()

    if args.delta:
        # Delta mode
        if not module_alias:
            print("Error: Could not determine module alias for delta mode")
            print("  Ensure entity aliases follow format 'module.EntityName' or directory follows 'cb_batch_module_*'")
            sys.exit(1)

        print(f"Fetching remote state for module: {module_alias}...")
        remote_state = uploader.fetch_module_state(module_alias)

        if remote_state is None:
            print("Warning: Could not fetch remote state, falling back to full upload")
            args.delta = False
        else:
            print(f"  Remote has {len(remote_state.entities)} documented entity(s)")
            print()

            # Compute delta
            print("Computing delta...")
            delta = uploader.compute_delta(docs, remote_state)

            if not delta.has_changes and not delta.orphaned_entities and not delta.orphaned_attributes:
                print("No changes detected. Documentation is up to date.")
                sys.exit(0)

            # Show delta summary
            uploader.print_delta_summary(delta)
            print()

            # Upload delta
            if not args.dry_run:
                print("Applying delta changes...")
            new_stats, update_stats, deleted_count = uploader.upload_delta(
                delta,
                remove_orphaned=args.remove_orphaned,
                dry_run=args.dry_run
            )

            duration = time.time() - start_time

            # Print summary
            if not args.dry_run:
                print_delta_upload_summary(new_stats, update_stats, deleted_count, delta, duration)
            else:
                print()
                print(f"[DRY RUN] No changes were made. Duration: {duration:.2f}s")

            # Exit with error code if any failures
            if not args.dry_run and (new_stats.failed + update_stats.failed) > 0:
                sys.exit(1)

            sys.exit(0)

    # Full upload mode (original behavior)
    print("Uploading Module Documentation...")
    module_stats = uploader.upload_modules(docs["modules"], args.dry_run)
    if not args.dry_run:
        print(f"  {module_stats}")

    print("Uploading Entity Documentation...")
    entity_stats = uploader.upload_entities(docs["entities"], args.dry_run)
    if not args.dry_run:
        print(f"  {entity_stats}")

    print("Uploading Attribute Documentation...")
    attribute_stats = uploader.upload_attributes(docs["attributes"], args.dry_run)
    if not args.dry_run:
        print(f"  {attribute_stats}")

    print("Uploading Attribute Value Documentation...")
    value_stats = uploader.upload_attribute_values(docs["attribute_values"], args.dry_run)
    if not args.dry_run:
        print(f"  {value_stats}")

    duration = time.time() - start_time

    # Print summary
    print_summary(module_stats, entity_stats, attribute_stats, value_stats, duration)

    # Exit with error code if any failures
    total_failed = module_stats.failed + entity_stats.failed + attribute_stats.failed + value_stats.failed
    if total_failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
