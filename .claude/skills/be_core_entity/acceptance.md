# Acceptance Checklist: Entity Architecture

Use this checklist to verify compliance with entity architecture standards.

## Entity Naming

- [ ] Entity name is prefixed with module code: `@Entity(name = "{moduleCode}{EntityName}")`
- [ ] Entity name uses camelCase format (e.g., `tmTicket`, `crCustomer`)

## Sequence Naming

- [ ] Sequence uses full names: `{module}_id_{entity_name_snake_case}`
- [ ] Sequence name is NOT abbreviated
- [ ] Sequence generator matches sequence name

## Allocation Size

- [ ] Config entities use `allocationSize = 1`
- [ ] Runtime entities use `allocationSize = 50`

## Relationships

- [ ] No `@OneToMany` relationships are used
- [ ] All relationships use `FetchType.LAZY`

## Enums

- [ ] Enum implements `AlphaBaseEnum`
- [ ] Enum uses `@Enumerated(EnumType.ORDINAL)`
- [ ] All enum values have `@UiEnumValueInfo` annotation with label

## Base Classes

- [ ] Runtime entities extend `AuditableEntity`
- [ ] Configuration entities extend `ConfigurableEntity`

## ID Field

- [ ] ID field uses `@GeneratedValue(strategy = GenerationType.SEQUENCE)`
- [ ] `@SequenceGenerator` is properly configured
- [ ] Generator name matches sequence name
