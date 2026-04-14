# Acceptance Checklist: Alpha Query Language (QL)

Use this checklist to verify compliance with QL standards.

## Query Structure

- [ ] Query has `name` property (unique identifier)
- [ ] Query has `type` property (`view` or `hierarchy`)
- [ ] Query has `start` with entity configuration

## Start/Join Type Selection

- [ ] `type: "entity"` used for standard data retrieval
- [ ] `type: "groupBy"` used for aggregation queries (COUNT, SUM, AVG, MIN, MAX)
- [ ] Type is appropriate for the use case

## Aliases

- [ ] Root entity has an alias (typically `e`)
- [ ] All joined entities have unique aliases
- [ ] Field references use correct alias prefix (`e.fieldName`, `c.amount`)

## Aggregation Queries (type: "groupBy")

- [ ] Regular fields in `fields[]` are used for GROUP BY columns
- [ ] Function fields have `function` property (count, sum, avg, min, max)
- [ ] Function fields have `as` property for result alias
- [ ] `"*"` used as field name for COUNT(*)
- [ ] Correct `dataType` specified for function fields

## Filtering

- [ ] `filters` used for WHERE clause (applied before GROUP BY)
- [ ] `functionFilters` used for HAVING clause (applied after GROUP BY)
- [ ] Filter field paths include alias prefix

## GroupBy in Joins

- [ ] `typeGroupBy` configured when using `type: "groupBy"` in a join
- [ ] `typeGroupBy.fields` specifies GROUP BY columns
- [ ] `typeGroupBy.where` specifies join condition (e.g., `a.model = c.model`)

## Pipes

- [ ] Every query has a corresponding pipe
- [ ] Pipe `simpleQuery` references the query name
- [ ] Results accessed via pipe name: `response.pipeData[pipeName]`

## Best Practices

- [ ] Server-side aggregation used instead of fetching all records and aggregating client-side
- [ ] Appropriate aggregation function selected (count, sum, avg, min, max)
- [ ] No hardcoded SQL strings
- [ ] Proper error handling for query execution