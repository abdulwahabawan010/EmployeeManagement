# Chart KPI - Variant Reference

This document provides detailed specifications for all Chart KPI variants (Bar, Line, Pie).

---

## Variant A: Bar Chart KPI (Default)

### Purpose
Shows period-based comparison (e.g., months, quarters) with the current period highlighted.

### Best Use Cases
- Monthly revenue comparison
- Volume or count metrics
- Period-over-period analysis
- Sales performance tracking

### Visual Characteristics
- Vertical bars representing each period
- Current period bar highlighted (stronger color/opacity)
- Non-active bars muted (reduced opacity)
- No legend displayed
- Minimal grid lines

### Data Structure
```typescript
chartData: {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [{
    data: [3200, 4100, 3800, 4500, 4200, 4800],
    backgroundColor: [...], // Array with active index highlighted
    borderRadius: 4
  }]
}
```

### Behavior
- Hover: Shows tooltip with period name + exact value
- Active bar: Visually emphasized
- Does NOT change headline KPI value on hover

### Configuration
```typescript
options: {
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true }
  },
  scales: {
    x: { display: true, grid: { display: false } },
    y: { display: false }
  },
  maintainAspectRatio: false
}
```

---

## Variant B: Line Chart KPI

### Purpose
Shows continuous trend over time, emphasizing growth or decline patterns.

### Best Use Cases
- Performance trends
- Usage metrics over time
- Growth tracking
- Continuous data streams

### Visual Characteristics
- Smooth line connecting data points
- Optional fill area under line
- Data points visible on hover
- Current point may be emphasized
- No legend displayed

### Data Structure
```typescript
chartData: {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
  datasets: [{
    data: [120, 145, 138, 162],
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    fill: true,
    tension: 0.4,
    pointRadius: 0,
    pointHoverRadius: 6
  }]
}
```

### Behavior
- Hover: Shows tooltip with period + value
- Line tension provides smooth curves
- Points appear only on hover

### Configuration
```typescript
options: {
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true }
  },
  scales: {
    x: { display: true, grid: { display: false } },
    y: { display: false }
  },
  maintainAspectRatio: false,
  elements: {
    point: { radius: 0, hoverRadius: 6 }
  }
}
```

---

## Variant C: Pie/Doughnut Chart KPI

### Purpose
Shows distribution or composition of categories.

### Best Use Cases
- Category breakdown
- Market share distribution
- Budget allocation
- Status distribution (e.g., contract types)

### Visual Characteristics
- Circular chart showing proportions
- Doughnut style (hollow center) preferred for readability
- Distinct colors per segment
- No exploding slices
- No legend (categories shown in tooltip)

### Data Structure
```typescript
chartData: {
  labels: ['Active', 'Pending', 'Expired', 'Draft'],
  datasets: [{
    data: [65, 20, 10, 5],
    backgroundColor: [
      '#22C55E', // green - Active
      '#3B82F6', // blue - Pending
      '#EF4444', // red - Expired
      '#9CA3AF'  // gray - Draft
    ],
    borderWidth: 0
  }]
}
```

### Behavior
- Hover: Shows category name + value/percentage
- Active slice slightly emphasized (optional)
- No slice explosion on interaction

### Configuration
```typescript
options: {
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true }
  },
  cutout: '60%', // For doughnut style
  maintainAspectRatio: false
}
```

---

## Chart Type Comparison

| Aspect | Bar | Line | Pie |
|--------|-----|------|-----|
| Data Type | Discrete periods | Continuous trend | Categories |
| Best For | Period comparison | Trend analysis | Distribution |
| Highlight | Current bar | Latest point | Active slice |
| Interaction | Hover tooltip | Hover tooltip | Hover tooltip |
| Legend | Hidden | Hidden | Hidden |

---

## AI Identification Rules

| If the KPI shows... | Then use... |
|---------------------|-------------|
| Monthly/quarterly comparison | **Bar Chart** |
| Trend over time, growth pattern | **Line Chart** |
| Category breakdown, distribution | **Pie Chart** |
| Volume or count by period | **Bar Chart** |
| Continuous performance metrics | **Line Chart** |
| Parts of a whole | **Pie Chart** |

---

## Color Guidelines

### Bar Chart Colors
- Active bar: Primary color (full opacity)
- Inactive bars: Primary color (40% opacity)

### Line Chart Colors
- Line: Primary blue (`#3B82F6`)
- Fill: Primary blue (10% opacity)
- Points: Primary blue on hover

### Pie Chart Colors
- Use semantic colors when applicable:
  - Success/Active: Green (`#22C55E`)
  - Info/Pending: Blue (`#3B82F6`)
  - Warning: Yellow (`#F59E0B`)
  - Error/Expired: Red (`#EF4444`)
  - Neutral: Gray (`#9CA3AF`)

---

## Sizing Guidelines

### Compact KPI Size
- Chart height: 80-100px
- Chart width: Full card width minus padding
- Card minimum width: 280px
- Card recommended width: 320px

### Chart Options (Common)
```typescript
{
  maintainAspectRatio: false,
  responsive: true,
  plugins: {
    legend: { display: false }
  }
}
```

---

## Accessibility

- Tooltips must show exact values
- Color should not be the only indicator
- Values must be programmatically readable
- Sufficient color contrast required

---

## Anti-Patterns (DO NOT)

1. **DO NOT** show legends - they clutter the compact view
2. **DO NOT** enable click interactions - hover only
3. **DO NOT** animate beyond PrimeNG defaults
4. **DO NOT** make the chart larger than the KPI value
5. **DO NOT** use 3D effects on any chart
6. **DO NOT** explode pie slices on hover
7. **DO NOT** hide the KPI headline value
8. **DO NOT** use gradients unless system standard
