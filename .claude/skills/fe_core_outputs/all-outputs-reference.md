# All Output Fields - Quick Reference

> **Complete reference for all 60+ output field components with examples**

---

## Text Outputs

| Component | Selector | Use For | Example |
|-----------|----------|---------|---------|
| Text | `mvs-form-control-output-text` | Basic text display | `<mvs-form-control-output-text [value]="name"></mvs-form-control-output-text>` |
| Text Upper Case | `mvs-form-control-output-text-upper-case` | Uppercase text | `<mvs-form-control-output-text-upper-case [value]="code"></mvs-form-control-output-text-upper-case>` |
| Text Lower Case | `mvs-form-control-output-text-lower-case` | Lowercase text | `<mvs-form-control-output-text-lower-case [value]="email"></mvs-form-control-output-text-lower-case>` |
| Text Show More | `mvs-form-control-text-show-more-wrapper` | Long text with expand | `<mvs-form-control-text-show-more-wrapper [value]="longText"></mvs-form-control-text-show-more-wrapper>` |
| Raw Text | `mvs-form-control-output-raw-text` | Text without HTML processing | `<mvs-form-control-output-raw-text [value]="html"></mvs-form-control-output-raw-text>` |

---

## Date/Time Outputs

| Component | Selector | Use For | Example |
|-----------|----------|---------|---------|
| Date | `mvs-form-control-output-date` | Date (DD.MM.YYYY) | `<mvs-form-control-output-date [value]="birthDate"></mvs-form-control-output-date>` |
| Date Time | `mvs-form-control-output-date-time` | Date with time | `<mvs-form-control-output-date-time [value]="createdAt"></mvs-form-control-output-date-time>` |
| Time | `mvs-form-control-output-time` | Time only | `<mvs-form-control-output-time [value]="startTime"></mvs-form-control-output-time>` |
| Time Date | `mvs-form-control-output-time-date` | Time then date | `<mvs-form-control-output-time-date [value]="timestamp"></mvs-form-control-output-time-date>` |
| Date Ago | `mvs-form-control-output-date-ago` | Relative time (2h ago) | `<mvs-form-control-output-date-ago [value]="lastModified"></mvs-form-control-output-date-ago>` |
| Due Date | `mvs-form-control-output-due-date` | Due date with highlighting | `<mvs-form-control-output-due-date [value]="dueDate"></mvs-form-control-output-due-date>` |
| Day Date | `mvs-form-control-output-day-date` | Day name with date | `<mvs-form-control-output-day-date [value]="appointmentDate"></mvs-form-control-output-day-date>` |
| Years Ago | `mvs-form-control-output-years-ago` | Years since date | `<mvs-form-control-output-years-ago [value]="startDate"></mvs-form-control-output-years-ago>` |
| Age Birthday | `mvs-form-control-output-age-birthday` | Age from birth date | `<mvs-form-control-output-age-birthday [value]="birthDate"></mvs-form-control-output-age-birthday>` |

---

## Number/Amount Outputs

| Component | Selector | Use For | Example |
|-----------|----------|---------|---------|
| Amount | `mvs-form-control-output-amount` | Formatted number | `<mvs-form-control-output-amount [value]="total"></mvs-form-control-output-amount>` |
| Amount Color | `mvs-form-control-output-amount-color` | Color-coded amount | `<mvs-form-control-output-amount-color [value]="balance"></mvs-form-control-output-amount-color>` |
| Currency Euro | `mvs-form-control-output-currency-euro` | Euro currency | `<mvs-form-control-output-currency-euro [value]="price"></mvs-form-control-output-currency-euro>` |
| Percentage | `mvs-form-control-output-append-percentage` | Number with % | `<mvs-form-control-output-append-percentage [value]="discount"></mvs-form-control-output-append-percentage>` |
| Base Format Number | `mvs-form-control-output-base-format-number` | Base number format | `<mvs-form-control-output-base-format-number [value]="count"></mvs-form-control-output-base-format-number>` |

---

## Boolean Outputs

| Component | Selector | Use For | Example |
|-----------|----------|---------|---------|
| Bool | `mvs-form-control-output-bool` | Generic boolean | `<mvs-form-control-output-bool [value]="isActive"></mvs-form-control-output-bool>` |
| Bool Active | `mvs-form-control-output-bool-active` | Active/Inactive | `<mvs-form-control-output-bool-active [value]="active"></mvs-form-control-output-bool-active>` |
| Bool Negative | `mvs-form-control-output-bool-negative` | Negative boolean | `<mvs-form-control-output-bool-negative [value]="isCancelled"></mvs-form-control-output-bool-negative>` |
| Icon Yes | `mvs-form-control-output-icon-yes` | Check icon for true | `<mvs-form-control-output-icon-yes [value]="isPaid"></mvs-form-control-output-icon-yes>` |
| Icon No | `mvs-form-control-output-icon-no` | X icon for false | `<mvs-form-control-output-icon-no [value]="isCancelled"></mvs-form-control-output-icon-no>` |
| Icon Null | `mvs-form-control-output-icon-null` | Null icon | `<mvs-form-control-output-icon-null [value]="nullValue"></mvs-form-control-output-icon-null>` |

---

## Badge/Tag/Chip Outputs

| Component | Selector | Use For | Example |
|-----------|----------|---------|---------|
| Badge | `mvs-form-control-output-badge` | Badge with value list | `<mvs-form-control-output-badge [value]="status" [formField]="{valueList: list}"></mvs-form-control-output-badge>` |
| Tag | `mvs-form-control-output-tag` | PrimeNG tag | `<mvs-form-control-output-tag [value]="label"></mvs-form-control-output-tag>` |
| Chip | `mvs-form-control-output-chip` | PrimeNG chip | `<mvs-form-control-output-chip [value]="chipLabel"></mvs-form-control-output-chip>` |
| Custom Tag | `mvs-form-control-output-custom-tag` | Customizable tag | `<mvs-form-control-output-custom-tag [value]="tag" [formField]="field"></mvs-form-control-output-custom-tag>` |
| Multi-Value Tag | `mvs-form-control-output-multi-value-tag` | Multiple tags | `<mvs-form-control-output-multi-value-tag [value]="tags"></mvs-form-control-output-multi-value-tag>` |

---

## Navigation Outputs

| Component | Selector | Use For | Example |
|-----------|----------|---------|---------|
| Navigate Main | `mvs-form-control-output-navigate-to-object-main` | Navigate to main view | `<mvs-form-control-output-navigate-to-object-main [value]="name" [dto]="obj"></mvs-form-control-output-navigate-to-object-main>` |
| Navigate Right | `mvs-form-control-output-navigate-to-object-right` | Navigate to right sidebar | `<mvs-form-control-output-navigate-to-object-right [value]="name" [dto]="obj"></mvs-form-control-output-navigate-to-object-right>` |
| Navigate Left | `mvs-form-control-output-navigate-to-object-left` | Navigate to left sidebar | `<mvs-form-control-output-navigate-to-object-left [value]="name" [dto]="obj"></mvs-form-control-output-navigate-to-object-left>` |
| Navigate Bottom | `mvs-form-control-output-navigate-to-object-bottom` | Navigate to bottom panel | `<mvs-form-control-output-navigate-to-object-bottom [value]="name" [dto]="obj"></mvs-form-control-output-navigate-to-object-bottom>` |
| Navigate New Window | `mvs-form-control-output-navigate-to-new-window` | Open in new window | `<mvs-form-control-output-navigate-to-new-window [value]="name" [dto]="obj"></mvs-form-control-output-navigate-to-new-window>` |

---

## User Outputs

| Component | Selector | Use For | Example |
|-----------|----------|---------|---------|
| User | `mvs-form-control-output-user` | User with avatar | `<mvs-form-control-output-user [value]="username"></mvs-form-control-output-user>` |
| User Name | `mvs-form-control-output-user-name` | User name only | `<mvs-form-control-output-user-name [value]="username"></mvs-form-control-output-user-name>` |
| User Image | `mvs-form-control-output-user-image` | User profile image | `<mvs-form-control-output-user-image [value]="userId"></mvs-form-control-output-user-image>` |
| Initials | `mvs-form-control-output-initials` | User initials circle | `<mvs-form-control-output-initials [value]="fullName"></mvs-form-control-output-initials>` |
| Selected Avatar | `mvs-form-control-output-selected-avatar` | Selected avatar | `<mvs-form-control-output-selected-avatar [value]="avatarPath"></mvs-form-control-output-selected-avatar>` |

---

## Privacy/Security Outputs

| Component | Selector | Use For | Example |
|-----------|----------|---------|---------|
| Anonymize Email | `mvs-form-control-anonymize-email` | Partially hidden email | `<mvs-form-control-anonymize-email [value]="email"></mvs-form-control-anonymize-email>` |
| Anonymize Phone | `mvs-form-control-anonymize-phone-number` | Partially hidden phone | `<mvs-form-control-anonymize-phone-number [value]="phone"></mvs-form-control-anonymize-phone-number>` |

---

## Icon/Image Outputs

| Component | Selector | Use For | Example |
|-----------|----------|---------|---------|
| Icon | `mvs-form-control-output-icon` | Font Awesome icon | `<mvs-form-control-output-icon [value]="'fa fa-home'"></mvs-form-control-output-icon>` |
| Color Icon | `mvs-form-control-output-color-icon` | Icon with color | `<mvs-form-control-output-color-icon [value]="icon" [dto]="obj"></mvs-form-control-output-color-icon>` |
| Device Icon | `mvs-form-control-output-device-icon` | Device-specific icon | `<mvs-form-control-output-device-icon [value]="device" [dto]="obj"></mvs-form-control-output-device-icon>` |
| Image | `mvs-form-control-output-image` | Image display | `<mvs-form-control-output-image [value]="imageUrl"></mvs-form-control-output-image>` |
| Icon or Image | `mvs-form-control-output-icon-or-image` | Icon or image based on value | `<mvs-form-control-output-icon-or-image [value]="media"></mvs-form-control-output-icon-or-image>` |

---

## Range/Progress Outputs

| Component | Selector | Use For | Example |
|-----------|----------|---------|---------|
| Range | `mvs-form-control-output-range` | Numeric range | `<mvs-form-control-output-range [value]="score"></mvs-form-control-output-range>` |
| Range Color | `mvs-form-control-output-range-color` | Color-coded range | `<mvs-form-control-output-range-color [value]="rating"></mvs-form-control-output-range-color>` |
| Range Progress | `mvs-form-control-output-range-progress` | Progress bar | `<mvs-form-control-output-range-progress [value]="percent"></mvs-form-control-output-range-progress>` |
| Range Progress 100 | `mvs-form-control-output-range-progress-100` | Progress (0-100) | `<mvs-form-control-output-range-progress-100 [value]="80"></mvs-form-control-output-range-progress-100>` |

---

## File Size Outputs

| Component | Selector | Use For | Example |
|-----------|----------|---------|---------|
| File Size KB | `mvs-form-control-output-filesize-kb` | Bytes to KB | `<mvs-form-control-output-filesize-kb [value]="sizeBytes"></mvs-form-control-output-filesize-kb>` |
| File Size MB | `mvs-form-control-output-filesize-mb` | Bytes to MB | `<mvs-form-control-output-filesize-mb [value]="sizeBytes"></mvs-form-control-output-filesize-mb>` |
| File Size GB | `mvs-form-control-output-filesize-gb` | Bytes to GB | `<mvs-form-control-output-filesize-gb [value]="sizeBytes"></mvs-form-control-output-filesize-gb>` |

---

## Duration/Time Outputs

| Component | Selector | Use For | Example |
|-----------|----------|---------|---------|
| Duration | `mvs-form-control-output-duration` | Duration (ISO 8601) | `<mvs-form-control-output-duration [value]="duration"></mvs-form-control-output-duration>` |
| Seconds in HH:MM | `mvs-form-control-output-seconds-in-HhMm` | Seconds as HH:MM | `<mvs-form-control-output-seconds-in-HhMm [value]="seconds"></mvs-form-control-output-seconds-in-HhMm>` |
| Seconds in HH:MM:SS | `mvs-form-control-output-seconds-in-HhMmSs` | Seconds as HH:MM:SS | `<mvs-form-control-output-seconds-in-HhMmSs [value]="seconds"></mvs-form-control-output-seconds-in-HhMmSs>` |

---

## Code Editor Outputs

| Component | Selector | Use For | Example |
|-----------|----------|---------|---------|
| SQL | `mvs-form-control-output-code-mirror-sql` | SQL code display | `<mvs-form-control-output-code-mirror-sql [value]="query"></mvs-form-control-output-code-mirror-sql>` |
| JSON | `mvs-form-control-output-code-mirror-json` | JSON code display | `<mvs-form-control-output-code-mirror-json [value]="json"></mvs-form-control-output-code-mirror-json>` |
| Groovy | `mvs-form-control-output-code-mirror-groovy` | Groovy code display | `<mvs-form-control-output-code-mirror-groovy [value]="script"></mvs-form-control-output-code-mirror-groovy>` |
| SPEL | `mvs-form-control-output-code-mirror-spel` | SPEL code display | `<mvs-form-control-output-code-mirror-spel [value]="expression"></mvs-form-control-output-code-mirror-spel>` |
| JSON Output | `mvs-form-control-output-json` | JSON data display | `<mvs-form-control-output-json [value]="jsonData"></mvs-form-control-output-json>` |
| Editor | `mvs-form-control-output-editor` | Generic editor | `<mvs-form-control-output-editor [value]="content"></mvs-form-control-output-editor>` |
| Quill Editor | `mvs-form-control-output-quill-editor` | Quill editor output | `<mvs-form-control-output-quill-editor [value]="richText"></mvs-form-control-output-quill-editor>` |

---

## Link Outputs

| Component | Selector | Use For | Example |
|-----------|----------|---------|---------|
| Link | `mvs-form-control-link` | Clickable link | `<mvs-form-control-link [value]="text"></mvs-form-control-link>` |
| Hyperlink | `mvs-form-control-hyperlink` | External hyperlink | `<mvs-form-control-hyperlink [value]="url"></mvs-form-control-hyperlink>` |
| Text Event | `mvs-form-control-text-event` | Text with click event | `<mvs-form-control-text-event [value]="text" (onFieldValueSelected)="onClick($event)"></mvs-form-control-text-event>` |
| Text Clipboard | `mvs-form-control-output-text-clipboard` | Copy to clipboard | `<mvs-form-control-output-text-clipboard [value]="apiKey"></mvs-form-control-output-text-clipboard>` |

---

## Usage Example with Value List

```typescript
// Create value list
const statusValueList = new MvsFormValueListDto();
statusValueList.entries = [
  {
    key: 1,
    label: 'Active',
    image: 'fa fa-check-circle',
    color: 'green-800',
    backgroundColor: 'green-200'
  },
  {
    key: 2,
    label: 'Inactive',
    image: 'fa fa-times-circle',
    color: 'red-800',
    backgroundColor: 'red-200'
  }
];

// Create field
const statusField = { id: 'status', valueList: statusValueList };
```

```html
<!-- Use with badge -->
<mvs-form-control-output-badge
  [value]="customer.status"
  [formField]="statusField">
</mvs-form-control-output-badge>
```

---

## Testing Reference

**Path**: `features/core/xu/page/output-fields-overview-page`

This page demonstrates all output field types with live examples.

---

**Last Updated:** 2026-01-07
**Version:** 1.0
