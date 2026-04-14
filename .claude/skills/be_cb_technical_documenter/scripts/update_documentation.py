#!/usr/bin/env python3
"""
CB Technical Documentation Updater

This script uploads technical documentation to the Alpha CB (Cognitive Backend) system.
It handles module, entity, and attribute documentation updates.

Usage:
    python update_documentation.py --action <action> --data <json_data> [--mode <mode>]
    python update_documentation.py --action document_batch --input-file <path> [--mode <mode>]

Modes:
    - api: Send data directly to the API (default)
    - review: Write data to .temp file in project root for review before sending

Actions:
    Single Operations:
    - list_modules: List all module documentations
    - list_entities: List entity documentations (optionally filtered by module)
    - list_attributes: List attribute documentations (filtered by entity)
    - get_module: Get module documentation by ID
    - get_module_by_alias: Get module documentation by alias
    - create_module: Create new module documentation
    - update_module: Update existing module documentation
    - create_entity: Create new entity documentation
    - update_entity: Update existing entity documentation
    - create_attribute: Create new attribute documentation
    - update_attribute: Update existing attribute documentation

    Batch Operations:
    - document_batch: Process complete module documentation from JSON file
                      Includes module, entities, attributes, and enums
    - upload_batch: Upload batch review files to API using new endpoints
                    Requires --input-dir pointing to batch directory

Review Mode:
    When using --mode review, write operations (create/update) will write the data
    to a .temp file in the project root directory instead of sending to the API.
    This allows you to review the documentation before committing it.

    The .temp file will be named: cb_documentation_review_<timestamp>.json

Batch Input File Format:
    {
      "module": {
        "moduleAlias": "cr",
        "moduleName": "Customer Relationship",
        "purpose": "...",
        "businessDescription": "...",
        "technicalDescription": "..."
      },
      "entities": [
        {
          "objectTypeAlias": "cr.Customer",
          "purpose": "...",
          "businessDescription": "...",
          "technicalDescription": "...",
          "usageNotes": "...",
          "domainContext": "...",
          "attributes": [
            {
              "attributeName": "status",
              "purpose": "...",
              "businessDescription": "...",
              "technicalDescription": "...",
              "exampleValues": "...",
              "validationRules": "..."
            }
          ],
          "enums": [
            {
              "enumName": "CustomerStatus",
              "purpose": "...",
              "businessDescription": "...",
              "technicalDescription": "...",
              "values": [
                {
                  "value": "ACTIVE",
                  "label": "Active",
                  "businessDescription": "...",
                  "technicalDescription": "..."
                }
              ]
            }
          ]
        }
      ],
      "options": {
        "entities": "all" | ["cr.Customer", "cr.CustomerType"],
        "includeAttributes": true,
        "includeEnums": true
      }
    }
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
import urllib.request
import urllib.error
import ssl
import os

# Determine project root directory (3 levels up from this script)
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent.parent  # .claude/skills/be_cb_technical_documenter/scripts -> root
TEMP_DIR = PROJECT_ROOT / ".temp"

# Configuration - can be overridden via environment variables
BASE_URL = os.environ.get("CB_BASE_URL", "http://localhost:8080")
TENANT = os.environ.get("CB_TENANT", "master")
AUTH_TOKEN = os.environ.get("CB_AUTH_TOKEN", "Bearer ig_access eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxIiwidG9rZW4tdHlwZSI6MSwiZXhwIjo0MTAyMzU4NDAwLCJpYXQiOjE3NzAxMTgyMDksInRlbmFudCI6Im1hc3RlciJ9.z4L9EWQz8L0W79b3cWdAWnGfR7O_0yDUXl8PuVdYbAUcPp68equKRuz2ww1PxYWXA3s_gsGRtFouvdWoljEB5w")


def make_request(
    method: str,
    endpoint: str,
    data: Optional[Dict[str, Any]] = None,
    params: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Make an HTTP request to the Alpha API.

    Args:
        method: HTTP method (GET, POST, PUT, DELETE)
        endpoint: API endpoint path
        data: Request body data (for POST/PUT)
        params: Query parameters

    Returns:
        Response data as dictionary
    """
    url = f"{BASE_URL}{endpoint}"

    if params:
        query_string = "&".join(f"{k}={v}" for k, v in params.items())
        url = f"{url}?{query_string}"

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-alpha-tenant": TENANT,
        "IgAuthorization": AUTH_TOKEN
    }

    body = None
    if data is not None:
        body = json.dumps(data).encode('utf-8')

    # Create SSL context that doesn't verify certificates (for dev environment)
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    request = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(request, context=ssl_context) as response:
            response_body = response.read().decode('utf-8')
            if response_body:
                return json.loads(response_body)
            return {"status": "success", "code": response.status}
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if e.fp else ""
        return {
            "error": True,
            "status_code": e.code,
            "message": str(e),
            "details": error_body
        }
    except urllib.error.URLError as e:
        return {
            "error": True,
            "message": str(e)
        }


def write_to_review_file(
    action: str,
    data: Dict[str, Any],
    entity_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Write documentation data to a .temp file for review instead of sending to API.

    Args:
        action: The action that would be performed (create/update)
        data: The documentation data
        entity_id: Optional entity ID for update operations

    Returns:
        Result dictionary with file path information
    """
    # Ensure .temp directory exists
    TEMP_DIR.mkdir(parents=True, exist_ok=True)

    # Generate timestamp for unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Create review file content
    review_content = {
        "metadata": {
            "action": action,
            "entity_id": entity_id,
            "timestamp": datetime.now().isoformat(),
            "status": "pending_review",
            "api_endpoint": get_endpoint_for_action(action, entity_id),
            "http_method": "POST" if "create" in action else "PUT"
        },
        "data": data
    }

    # Write to file
    filename = f"cb_documentation_review_{action}_{timestamp}.json"
    file_path = TEMP_DIR / filename

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(review_content, f, indent=2, default=str, ensure_ascii=False)

    return {
        "status": "review_pending",
        "message": f"Documentation written to review file",
        "file_path": str(file_path),
        "action": action,
        "to_apply": f"python {__file__} --action {action} --data '{json.dumps(data)}' --mode api" + (f" --id {entity_id}" if entity_id else "")
    }


def get_endpoint_for_action(action: str, entity_id: Optional[int] = None) -> str:
    """Get the API endpoint for a given action."""
    endpoints = {
        "create_module": "/mvsa/cb/moduleDocumentations",
        "update_module": f"/mvsa/cb/moduleDocumentations/{entity_id}",
        "create_entity": "/mvsa/cb/entityDocumentations",
        "update_entity": f"/mvsa/cb/entityDocumentations/{entity_id}",
        "create_attribute": "/mvsa/cb/attributeDocumentations",
        "update_attribute": f"/mvsa/cb/attributeDocumentations/{entity_id}",
    }
    return endpoints.get(action, "unknown")


def apply_review_file(file_path: str) -> Dict[str, Any]:
    """
    Apply a review file by sending its contents to the API.

    Args:
        file_path: Path to the review file

    Returns:
        API response
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        review_content = json.load(f)

    metadata = review_content.get("metadata", {})
    data = review_content.get("data", {})
    action = metadata.get("action")
    entity_id = metadata.get("entity_id")

    # Route to appropriate function
    if action == "create_module":
        return create_module(data)
    elif action == "update_module":
        return update_module(entity_id, data)
    elif action == "create_entity":
        return create_entity(data)
    elif action == "update_entity":
        return update_entity(entity_id, data)
    elif action == "create_attribute":
        return create_attribute(data)
    elif action == "update_attribute":
        return update_attribute(entity_id, data)
    else:
        return {"error": True, "message": f"Unknown action in review file: {action}"}


# ============================================================================
# Batch Documentation Functions
# ============================================================================

def process_batch_documentation(input_file: str, mode: str = "review") -> Dict[str, Any]:
    """
    Process complete module documentation from a JSON file.

    This function handles:
    - Module documentation
    - Entity documentation (all or specific entities)
    - Attribute documentation for each entity
    - Enum documentation with value descriptions

    Args:
        input_file: Path to the JSON file containing complete documentation
        mode: 'api' to send to API, 'review' to write to .temp files

    Returns:
        Summary of processed documentation
    """
    # Load input file
    with open(input_file, 'r', encoding='utf-8') as f:
        batch_data = json.load(f)

    # Extract components
    module_data = batch_data.get("module", {})
    entities_data = batch_data.get("entities", [])
    options = batch_data.get("options", {})

    # Determine which entities to process
    entity_filter = options.get("entities", "all")
    include_attributes = options.get("includeAttributes", True)
    include_enums = options.get("includeEnums", True)

    # Filter entities if specific ones requested
    if entity_filter != "all" and isinstance(entity_filter, list):
        entities_data = [e for e in entities_data if e.get("objectTypeAlias") in entity_filter]

    # Process results tracking
    results = {
        "module": None,
        "entities": [],
        "attributes": [],
        "enums": [],
        "summary": {
            "module_processed": False,
            "entities_processed": 0,
            "attributes_processed": 0,
            "enums_processed": 0,
            "enum_values_processed": 0
        }
    }

    # Create batch directory for review mode
    if mode == "review":
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        module_alias = module_data.get("moduleAlias", "unknown")
        batch_dir = TEMP_DIR / f"cb_batch_{module_alias}_{timestamp}"
        batch_dir.mkdir(parents=True, exist_ok=True)

    # Process module documentation
    if module_data:
        if mode == "review":
            result = write_batch_review_file(
                batch_dir, "module", module_data.get("moduleAlias", "module"), module_data
            )
        else:
            result = create_module(module_data)
        results["module"] = result
        results["summary"]["module_processed"] = True

    # Process entity documentation
    for entity in entities_data:
        entity_alias = entity.get("objectTypeAlias", "unknown")

        # Extract entity-level data (without attributes and enums)
        entity_doc = {k: v for k, v in entity.items()
                      if k not in ["attributes", "enums"]}

        if mode == "review":
            result = write_batch_review_file(
                batch_dir, "entity", entity_alias, entity_doc
            )
        else:
            result = create_entity(entity_doc)

        results["entities"].append({"alias": entity_alias, "result": result})
        results["summary"]["entities_processed"] += 1

        # Process attributes for this entity
        if include_attributes:
            attributes = entity.get("attributes", [])
            for attr in attributes:
                attr_name = attr.get("attributeName", "unknown")
                attr["entityAlias"] = entity_alias  # Add reference for review

                if mode == "review":
                    result = write_batch_review_file(
                        batch_dir, "attribute", f"{entity_alias}.{attr_name}", attr
                    )
                else:
                    result = create_attribute(attr)

                results["attributes"].append({
                    "entity": entity_alias,
                    "attribute": attr_name,
                    "result": result
                })
                results["summary"]["attributes_processed"] += 1

        # Process enums for this entity
        if include_enums:
            enums = entity.get("enums", [])
            for enum in enums:
                enum_name = enum.get("enumName", "unknown")
                enum["entityAlias"] = entity_alias  # Add reference for review

                if mode == "review":
                    result = write_batch_review_file(
                        batch_dir, "enum", f"{entity_alias}.{enum_name}", enum
                    )
                else:
                    # For API mode, we'd need to handle enum documentation
                    # This would require additional API endpoints
                    result = {"status": "enum_api_not_implemented", "data": enum}

                results["enums"].append({
                    "entity": entity_alias,
                    "enum": enum_name,
                    "result": result
                })
                results["summary"]["enums_processed"] += 1
                results["summary"]["enum_values_processed"] += len(enum.get("values", []))

    # Write summary file for review mode
    if mode == "review":
        summary_file = batch_dir / "_summary.json"
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump({
                "batch_info": {
                    "module_alias": module_data.get("moduleAlias"),
                    "timestamp": datetime.now().isoformat(),
                    "options": options
                },
                "summary": results["summary"],
                "files_created": list(batch_dir.glob("*.json"))
            }, f, indent=2, default=str, ensure_ascii=False)

        results["batch_directory"] = str(batch_dir)
        results["summary_file"] = str(summary_file)

    return results


def write_batch_review_file(
    batch_dir: Path,
    doc_type: str,
    name: str,
    data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Write a single documentation item to the batch review directory.

    Args:
        batch_dir: Directory for batch review files
        doc_type: Type of documentation (module, entity, attribute, enum)
        name: Name/identifier for the documentation
        data: Documentation data

    Returns:
        Result dictionary with file path information
    """
    # Sanitize name for filename
    safe_name = name.replace(".", "_").replace("/", "_")
    filename = f"{doc_type}_{safe_name}.json"
    file_path = batch_dir / filename

    review_content = {
        "metadata": {
            "doc_type": doc_type,
            "name": name,
            "timestamp": datetime.now().isoformat(),
            "status": "pending_review"
        },
        "data": data
    }

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(review_content, f, indent=2, default=str, ensure_ascii=False)

    return {
        "status": "review_pending",
        "file_path": str(file_path),
        "doc_type": doc_type,
        "name": name
    }


def apply_batch_review(batch_dir: str) -> Dict[str, Any]:
    """
    Apply all review files from a batch directory to the API.

    Args:
        batch_dir: Path to the batch review directory

    Returns:
        Summary of applied documentation
    """
    batch_path = Path(batch_dir)
    if not batch_path.exists():
        return {"error": True, "message": f"Batch directory not found: {batch_dir}"}

    results = {
        "applied": [],
        "errors": [],
        "summary": {
            "total": 0,
            "success": 0,
            "failed": 0
        }
    }

    # Process files in order: module first, then entities, then attributes, then enums
    file_order = ["module_", "entity_", "attribute_", "enum_"]

    for prefix in file_order:
        for json_file in sorted(batch_path.glob(f"{prefix}*.json")):
            if json_file.name == "_summary.json":
                continue

            results["summary"]["total"] += 1

            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    review_content = json.load(f)

                doc_type = review_content.get("metadata", {}).get("doc_type")
                data = review_content.get("data", {})

                # Route to appropriate API function
                if doc_type == "module":
                    result = create_module(data)
                elif doc_type == "entity":
                    result = create_entity(data)
                elif doc_type == "attribute":
                    # Remove the reference field we added
                    data.pop("entityAlias", None)
                    result = create_attribute(data)
                elif doc_type == "enum":
                    # Enum API would need to be implemented
                    result = {"status": "enum_api_not_implemented"}
                else:
                    result = {"error": True, "message": f"Unknown doc_type: {doc_type}"}

                if result.get("error"):
                    results["errors"].append({"file": str(json_file), "error": result})
                    results["summary"]["failed"] += 1
                else:
                    results["applied"].append({"file": str(json_file), "result": result})
                    results["summary"]["success"] += 1

            except Exception as e:
                results["errors"].append({"file": str(json_file), "error": str(e)})
                results["summary"]["failed"] += 1

    return results


# ============================================================================
# Module Documentation Functions
# ============================================================================

def list_modules() -> Dict[str, Any]:
    """List all module documentations."""
    request_body = {
        "filterCriteria": [],
        "sorting": [{"field": "moduleAlias", "order": "ASC"}]
    }
    return make_request("POST", "/mvsa/cb/moduleDocumentations/list", data=request_body)


def get_module(module_id: int) -> Dict[str, Any]:
    """Get module documentation by ID."""
    return make_request("GET", f"/mvsa/cb/moduleDocumentations/{module_id}")


def get_module_by_alias(alias: str) -> Dict[str, Any]:
    """Get module documentation by module alias."""
    return make_request("GET", f"/mvsa/cb/moduleDocumentations/by-alias/{alias}")


def create_module(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create new module documentation.

    Required fields:
        - moduleAlias: str (max 10 chars)
        - moduleName: str (max 100 chars)

    Optional fields:
        - purpose: str (max 200 chars)
        - businessDescription: str (TEXT)
        - technicalDescription: str (TEXT)
        - reviewedBy: str (max 100 chars)
    """
    # Add timestamp
    data["lastReviewedAt"] = datetime.now().isoformat()
    if "reviewedBy" not in data:
        data["reviewedBy"] = "Claude Technical Documenter"

    return make_request("POST", "/mvsa/cb/moduleDocumentations", data=data)


def update_module(module_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update existing module documentation.

    Fields that can be updated:
        - moduleName: str (max 100 chars)
        - purpose: str (max 200 chars)
        - businessDescription: str (TEXT)
        - technicalDescription: str (TEXT)
        - reviewedBy: str (max 100 chars)
    """
    data["id"] = module_id
    data["lastReviewedAt"] = datetime.now().isoformat()
    if "reviewedBy" not in data:
        data["reviewedBy"] = "Claude Technical Documenter"

    return make_request("PUT", f"/mvsa/cb/moduleDocumentations/{module_id}", data=data)


# ============================================================================
# Entity Documentation Functions
# ============================================================================

def list_entities(object_type_id: Optional[int] = None) -> Dict[str, Any]:
    """
    List entity documentations.

    Args:
        object_type_id: Optional filter by object type ID
    """
    filter_criteria = []
    if object_type_id:
        filter_criteria.append({
            "field": "objectTypeDtoId",
            "operator": "eq",
            "value": object_type_id
        })

    request_body = {
        "filterCriteria": filter_criteria,
        "sorting": [{"field": "id", "order": "ASC"}]
    }
    return make_request("POST", "/mvsa/cb/entityDocumentations/list", data=request_body)


def get_entity(entity_id: int) -> Dict[str, Any]:
    """Get entity documentation by ID."""
    return make_request("GET", f"/mvsa/cb/entityDocumentations/{entity_id}")


def create_entity(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create new entity documentation.

    Required fields:
        - objectTypeDtoId: int (FK to ObjectType)

    Optional fields:
        - purpose: str (max 200 chars)
        - businessDescription: str (TEXT)
        - technicalDescription: str (TEXT)
        - usageNotes: str (TEXT)
        - domainContext: str (max 255 chars)
        - reviewedBy: str (max 100 chars)
    """
    data["lastReviewedAt"] = datetime.now().isoformat()
    if "reviewedBy" not in data:
        data["reviewedBy"] = "Claude Technical Documenter"

    return make_request("POST", "/mvsa/cb/entityDocumentations", data=data)


def update_entity(entity_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update existing entity documentation.

    Fields that can be updated:
        - purpose: str (max 200 chars)
        - businessDescription: str (TEXT)
        - technicalDescription: str (TEXT)
        - usageNotes: str (TEXT)
        - domainContext: str (max 255 chars)
        - reviewedBy: str (max 100 chars)
    """
    data["id"] = entity_id
    data["lastReviewedAt"] = datetime.now().isoformat()
    if "reviewedBy" not in data:
        data["reviewedBy"] = "Claude Technical Documenter"

    return make_request("PUT", f"/mvsa/cb/entityDocumentations/{entity_id}", data=data)


# ============================================================================
# Attribute Documentation Functions
# ============================================================================

def list_attributes(entity_id: int) -> Dict[str, Any]:
    """
    List attribute documentations for an entity.

    Args:
        entity_id: Entity documentation ID to filter by
    """
    request_body = {
        "filterCriteria": [{
            "field": "entityDtoId",
            "operator": "eq",
            "value": entity_id
        }],
        "sorting": [{"field": "attributeName", "order": "ASC"}]
    }
    return make_request("POST", "/mvsa/cb/attributeDocumentations/list", data=request_body)


def get_attribute(attribute_id: int) -> Dict[str, Any]:
    """Get attribute documentation by ID."""
    return make_request("GET", f"/mvsa/cb/attributeDocumentations/{attribute_id}")


def create_attribute(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create new attribute documentation.

    Required fields:
        - entityDtoId: int (FK to CbEntityDocumentation)
        - attributeName: str (max 100 chars)

    Optional fields:
        - purpose: str (max 200 chars)
        - businessDescription: str (TEXT)
        - technicalDescription: str (TEXT)
        - exampleValues: str (TEXT)
        - validationRules: str (TEXT)
    """
    return make_request("POST", "/mvsa/cb/attributeDocumentations", data=data)


def update_attribute(attribute_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update existing attribute documentation.

    Fields that can be updated:
        - purpose: str (max 200 chars)
        - businessDescription: str (TEXT)
        - technicalDescription: str (TEXT)
        - exampleValues: str (TEXT)
        - validationRules: str (TEXT)
    """
    data["id"] = attribute_id
    return make_request("PUT", f"/mvsa/cb/attributeDocumentations/{attribute_id}", data=data)


# ============================================================================
# Main Entry Point
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="CB Technical Documentation Updater")
    parser.add_argument("--action", required=True, help="Action to perform")
    parser.add_argument("--data", help="JSON data for the action")
    parser.add_argument("--id", type=int, help="ID for get/update operations")
    parser.add_argument("--alias", help="Module alias for lookup")
    parser.add_argument("--entity-id", type=int, help="Entity ID for attribute operations")
    parser.add_argument(
        "--mode",
        choices=["api", "review"],
        default="review",
        help="Mode: 'api' sends to API, 'review' writes to .temp file for review (default)"
    )
    parser.add_argument(
        "--apply-review",
        help="Path to a review file to apply (sends its contents to API)"
    )
    parser.add_argument(
        "--input-file",
        help="Path to JSON file for batch documentation (used with document_batch action)"
    )
    parser.add_argument(
        "--apply-batch",
        help="Path to batch review directory to apply (sends all files to API)"
    )

    args = parser.parse_args()

    # Handle apply-review action
    if args.apply_review:
        result = apply_review_file(args.apply_review)
        print(json.dumps(result, indent=2, default=str))
        return

    # Handle apply-batch action
    if args.apply_batch:
        result = apply_batch_review(args.apply_batch)
        print(json.dumps(result, indent=2, default=str))
        return

    # Parse data if provided
    data = None
    if args.data:
        try:
            data = json.loads(args.data)
        except json.JSONDecodeError as e:
            print(json.dumps({"error": True, "message": f"Invalid JSON: {e}"}))
            sys.exit(1)

    result = None

    # Module operations
    if args.action == "list_modules":
        result = list_modules()
    elif args.action == "get_module":
        if not args.id:
            print(json.dumps({"error": True, "message": "Module ID required"}))
            sys.exit(1)
        result = get_module(args.id)
    elif args.action == "get_module_by_alias":
        if not args.alias:
            print(json.dumps({"error": True, "message": "Module alias required"}))
            sys.exit(1)
        result = get_module_by_alias(args.alias)
    elif args.action == "create_module":
        if not data:
            print(json.dumps({"error": True, "message": "Data required for create_module"}))
            sys.exit(1)
        if args.mode == "review":
            result = write_to_review_file("create_module", data)
        else:
            result = create_module(data)
    elif args.action == "update_module":
        if not args.id or not data:
            print(json.dumps({"error": True, "message": "Module ID and data required"}))
            sys.exit(1)
        if args.mode == "review":
            result = write_to_review_file("update_module", data, args.id)
        else:
            result = update_module(args.id, data)

    # Entity operations
    elif args.action == "list_entities":
        result = list_entities(args.id)
    elif args.action == "get_entity":
        if not args.id:
            print(json.dumps({"error": True, "message": "Entity ID required"}))
            sys.exit(1)
        result = get_entity(args.id)
    elif args.action == "create_entity":
        if not data:
            print(json.dumps({"error": True, "message": "Data required for create_entity"}))
            sys.exit(1)
        if args.mode == "review":
            result = write_to_review_file("create_entity", data)
        else:
            result = create_entity(data)
    elif args.action == "update_entity":
        if not args.id or not data:
            print(json.dumps({"error": True, "message": "Entity ID and data required"}))
            sys.exit(1)
        if args.mode == "review":
            result = write_to_review_file("update_entity", data, args.id)
        else:
            result = update_entity(args.id, data)

    # Attribute operations
    elif args.action == "list_attributes":
        if not args.entity_id:
            print(json.dumps({"error": True, "message": "Entity ID required for list_attributes"}))
            sys.exit(1)
        result = list_attributes(args.entity_id)
    elif args.action == "get_attribute":
        if not args.id:
            print(json.dumps({"error": True, "message": "Attribute ID required"}))
            sys.exit(1)
        result = get_attribute(args.id)
    elif args.action == "create_attribute":
        if not data:
            print(json.dumps({"error": True, "message": "Data required for create_attribute"}))
            sys.exit(1)
        if args.mode == "review":
            result = write_to_review_file("create_attribute", data)
        else:
            result = create_attribute(data)
    elif args.action == "update_attribute":
        if not args.id or not data:
            print(json.dumps({"error": True, "message": "Attribute ID and data required"}))
            sys.exit(1)
        if args.mode == "review":
            result = write_to_review_file("update_attribute", data, args.id)
        else:
            result = update_attribute(args.id, data)

    # Batch operations
    elif args.action == "document_batch":
        if not args.input_file:
            print(json.dumps({"error": True, "message": "Input file required for document_batch"}))
            sys.exit(1)
        result = process_batch_documentation(args.input_file, args.mode)

    elif args.action == "upload_batch":
        # Delegate to the upload_documentation.py script
        if not args.input_file:
            print(json.dumps({"error": True, "message": "Input directory required (use --input-file for batch directory path)"}))
            sys.exit(1)
        import subprocess
        upload_script = SCRIPT_DIR / "upload_documentation.py"
        cmd = [sys.executable, str(upload_script), "--input-dir", args.input_file]
        if args.mode == "review":
            cmd.append("--dry-run")
        try:
            subprocess.run(cmd, check=True)
            result = {"status": "success", "message": "Upload completed. See output above."}
        except subprocess.CalledProcessError as e:
            result = {"error": True, "message": f"Upload failed with exit code {e.returncode}"}

    else:
        result = {"error": True, "message": f"Unknown action: {args.action}"}

    # Output result as JSON
    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()
