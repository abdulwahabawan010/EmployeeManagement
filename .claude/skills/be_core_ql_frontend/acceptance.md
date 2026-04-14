# Acceptance Checklist: QL Frontend Integration

Use this checklist to verify compliance with QL frontend integration standards.

## API Endpoint

- [ ] Queries use the single backend endpoint: `/core/ql/query`

## Request Structure

- [ ] Query definitions are properly structured
- [ ] Pipe definitions are correctly configured
- [ ] Filter criteria are properly formatted
- [ ] Sorting options follow expected format
- [ ] Pagination settings are included when needed

## Response Handling

- [ ] Results are retrieved by pipe name, not query name
- [ ] Form metadata is handled when returned
- [ ] Count information is processed when included

## Best Practices

- [ ] Queries define WHAT data to fetch
- [ ] Pipes define HOW data is returned
- [ ] Frontend-backend communication follows established patterns
