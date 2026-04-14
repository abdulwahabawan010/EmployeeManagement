# Acceptance Checklist: Template Engine (TE)

Use this checklist to verify compliance with TE module standards.

## Service Usage

- [ ] Template operations use `TeTemplateService`
- [ ] PDF generation uses `TeTemplateContentService`

## Template Configuration

- [ ] Variables are defined with proper types
- [ ] XHTML content type is used for printable templates
- [ ] Content is not hardcoded as variables

## PDF Generation

- [ ] PDFs are only generated from XHTML content
- [ ] `isPrintable()` check is performed before PDF generation

## Variable Handling

- [ ] Variable validation is not skipped
- [ ] Variables are properly typed in template definitions

## Best Practices

- [ ] `TeTemplateService` is used for template operations
- [ ] Non-XHTML content is not used for PDF generation
- [ ] Templates use proper variable definitions
