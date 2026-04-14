---
name: be_te
description: "Backend: Expert guidance on Template Engine (TE) module for dynamic content generation including FreeMarker templates, PDF generation, and document rendering. Use when working with templates, FreeMarker, PDF generation, or document rendering."
---

# TE (Template Engine) Module

Read the full documentation at:
`backend/src/main/java/com/mvs/backend/te/documentation.md`

## When to Use This Skill

Use when:
- Working with templates
- Using FreeMarker
- Generating PDFs
- Rendering documents

## Core Entities

- **TeTemplate** - Template definition
- **TeArtefact** - Reusable content fragment
- **TeTemplateVariable** - Variable definition
- **TeTemplateArtefact** - Artefact link

## Content Types

- `plain_text`
- `html`
- `xhtml` (required for PDF)

## Key Services

### TeTemplateService
```java
TeTemplate getTemplate(Long id)
TeConvertedContent generateContent(TeTemplate, Map<String, Object> variables)
```

### TeTemplateContentService
```java
byte[] createPdf(String htmlContent)
byte[] createPdf(TeConvertedContent content)
```

## Implementation Pattern

```java
@Autowired TeTemplateService templateService;
@Autowired TeTemplateContentService contentService;

// Generate content
Map<String, Object> variables = Map.of(
    "customerName", customer.getName(),
    "contract", contract
);
TeConvertedContent content = templateService.generateContent(template, variables);

// Generate PDF
if (content.isPrintable()) {
    byte[] pdf = contentService.createPdf(content);
}
```

## Best Practices

### DO:
- Use TeTemplateService for all template operations
- Define variables with proper types
- Use XHTML for printable templates

### DON'T:
- Don't generate PDFs from non-XHTML content
- Don't skip variable validation
- Don't hardcode content as variables

## Primary Entry Point
`TeTemplateService` for templates, `TeTemplateContentService` for PDF

## Acceptance Check

For compliance verification, see the checklist at:
[acceptance.md](acceptance.md)