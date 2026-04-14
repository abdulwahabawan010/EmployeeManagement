---
name: be_core_ql_frontend
description: "Backend: Expert guidance on QL frontend integration patterns. Use when implementing frontend query integration, understanding QL API endpoints, or configuring frontend-backend query communication."
---

# QL Frontend Usage Guide

Read the full documentation at:
`backend/src/main/java/com/mvs/backend/core/ql/frontend-usage-guide.md`

## When to Use This Skill

Use when:
- Implementing frontend query integration
- Understanding QL API endpoints
- Configuring frontend-backend query communication

## API Endpoint

Single backend endpoint: `/core/ql/query`

## Key Concepts

- Queries define WHAT data to fetch
- Pipes define HOW data is returned
- Results returned by pipe name, not query name

## Integration Pattern

Frontend sends requests with:
- Query definitions
- Pipe definitions
- Filter criteria
- Sorting options
- Pagination settings

Backend processes and returns:
- Pipe data with results
- Form metadata (optional)
- Count information (optional)

## Acceptance Check

For compliance verification, see the checklist at:
[acceptance.md](acceptance.md)