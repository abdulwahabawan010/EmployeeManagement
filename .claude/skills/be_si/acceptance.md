# Acceptance Checklist: Search Index (SI)

Use this checklist to verify compliance with SI module standards.

## Service Usage

- [ ] Indexing uses `SearchIndexingExtractService`

## Entity Annotation

- [ ] Searchable entities have `@EntitySearchable` annotation
- [ ] `EntitySearchableProvideType.SOURCE` is used appropriately

## Field Annotation

- [ ] Searchable fields have `@FieldSearchable` annotation
- [ ] Appropriate `rating` is set based on field importance
- [ ] Correct `compareStrategy` is selected
- [ ] `inResultList` is set when field should appear in results

## Compare Strategy Selection

- [ ] `partialMatch` is used for names/descriptions
- [ ] `perfectMatchClean` is used for identifiers
- [ ] Fuzzy matching is not used for exact identifiers

## Rating Values

- [ ] Ratings reflect field importance (poor=50 to excellent=5000)
- [ ] Higher ratings are used for more important fields

## Best Practices

- [ ] Low-value fields are not over-indexed
- [ ] Sensitive data is not indexed
- [ ] Rating values match field importance
