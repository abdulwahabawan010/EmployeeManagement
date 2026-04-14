# Basic KPI Card - Complete Implementation Reference

This file contains the complete implementation examples for the Basic KPI Card component. Use this as a blueprint to create or modify KPI components in any project.

---

## Technology Stack

- Angular 20
- PrimeNG 20 (CardModule, BadgeModule)
- PrimeFlex 4
- Font Awesome 6

---

## Model (kpi.model.ts)

```typescript
/**
 * KPI Card Variant Types
 * - regular: Neutral numeric business value (default)
 * - highlight: Status, alerts, warnings with subtle border/accent
 * - primary: Most important KPI with full background color (ONE per screen)
 */
export type KpiVariant = 'regular' | 'highlight' | 'primary';

/**
 * Highlight severity for KPI Highlight variant
 */
export type KpiHighlightSeverity = 'info' | 'warning' | 'critical';

/**
 * Generic KPI Card Model
 * Supports all three KPI variants: Regular, Highlight, Primary
 */
export interface KpiCardDto {
  /** KPI variant type */
  variant: KpiVariant;

  /** Short, noun-based label (e.g., "Balance", "Total Contracts") */
  label: string;

  /** Primary KPI figure value or status text */
  value: number | string;

  /** Currency code for formatting (e.g., "EUR", "USD") - optional */
  currency?: string;

  /** Change percentage from previous period (positive or negative) - optional */
  changePercent?: number;

  /** Supporting text for change (e.g., "from last month") - optional */
  changeText?: string;

  /** Optional Font Awesome icon class (e.g., "fa-regular fa-wallet") */
  icon?: string;

  /** Highlight severity (only for highlight variant) */
  highlightSeverity?: KpiHighlightSeverity;

  /** Status badge text (only for highlight variant, e.g., "LEVEL 1") */
  statusBadge?: string;

  /** Action hint text (only for highlight variant, e.g., "Review required") */
  actionHint?: string;
}
```

---

## Component (basic-kpi-card.component.ts)

```typescript
import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { KpiCardDto } from '../kpi.model';

/**
 * Basic KPI Card Component
 *
 * Supports three variants:
 * - regular: Neutral numeric business value display
 * - highlight: Status/alert KPI with border accent and optional badge
 * - primary: Most important KPI with full background color (ONE per screen)
 *
 * @example
 * <app-basic-kpi-card [kpi]="balanceKpi"></app-basic-kpi-card>
 */
@Component({
  selector: 'app-basic-kpi-card',
  standalone: true,
  imports: [CommonModule, CardModule, BadgeModule, CurrencyPipe, DecimalPipe],
  templateUrl: './basic-kpi-card.component.html'
})
export class BasicKpiCardComponent {
  /** KPI data to display */
  @Input({ required: true }) kpi!: KpiCardDto;

  /**
   * Returns border classes for highlight variant
   */
  get highlightBorderClasses(): string {
    if (this.kpi.variant !== 'highlight') return '';

    switch (this.kpi.highlightSeverity) {
      case 'critical':
        return 'border-left-3 border-red-500';
      case 'warning':
        return 'border-left-3 border-yellow-500';
      case 'info':
      default:
        return 'border-left-3 border-blue-500';
    }
  }

  /**
   * Returns background classes for primary variant
   */
  get primaryBackgroundClasses(): string {
    if (this.kpi.variant !== 'primary') return '';
    return 'bg-primary text-primary-contrast';
  }

  /**
   * Returns combined card style classes
   */
  get cardStyleClasses(): string {
    if (this.kpi.variant === 'highlight') {
      return this.highlightBorderClasses;
    }
    if (this.kpi.variant === 'primary') {
      return this.primaryBackgroundClasses;
    }
    return '';
  }

  /**
   * Returns label text color based on variant
   */
  get labelClasses(): string {
    if (this.kpi.variant === 'primary') {
      return 'text-sm text-primary-contrast opacity-80';
    }
    return 'text-sm text-color-secondary';
  }

  /**
   * Returns value text classes based on variant
   */
  get valueClasses(): string {
    const sizeClass = this.kpi.variant === 'primary' ? 'text-4xl' : 'text-3xl';

    if (this.kpi.variant === 'primary') {
      return `${sizeClass} font-bold text-primary-contrast`;
    }
    return `${sizeClass} font-bold text-color`;
  }

  /**
   * Returns icon classes based on variant
   */
  get iconClasses(): string {
    if (this.kpi.variant === 'primary') {
      return 'text-primary-contrast opacity-80';
    }
    if (this.kpi.variant === 'highlight') {
      return this.highlightIconClasses;
    }
    return 'text-color-secondary';
  }

  /**
   * Returns icon classes for highlight variant based on severity
   */
  get highlightIconClasses(): string {
    switch (this.kpi.highlightSeverity) {
      case 'critical':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
      default:
        return 'text-blue-500';
    }
  }

  /**
   * Returns badge severity for highlight variant
   */
  get badgeSeverity(): 'info' | 'warn' | 'danger' | 'success' {
    switch (this.kpi.highlightSeverity) {
      case 'critical':
        return 'danger';
      case 'warning':
        return 'warn';
      case 'info':
      default:
        return 'info';
    }
  }

  /**
   * Determines if the change is positive
   */
  get isPositiveChange(): boolean {
    return (this.kpi.changePercent ?? 0) >= 0;
  }

  /**
   * Returns the appropriate arrow icon based on change direction
   */
  get changeArrowIcon(): string {
    return this.isPositiveChange
      ? 'fa-solid fa-arrow-up'
      : 'fa-solid fa-arrow-down';
  }

  /**
   * Returns the appropriate text color class based on change direction
   */
  get changeColorClass(): string {
    if (this.kpi.variant === 'primary') {
      return 'text-primary-contrast';
    }
    return this.isPositiveChange ? 'text-green-600' : 'text-red-600';
  }

  /**
   * Returns formatted change percentage with sign
   */
  get formattedChangePercent(): string {
    if (this.kpi.changePercent === undefined) return '';
    const sign = this.isPositiveChange ? '+' : '';
    return `${sign}${this.kpi.changePercent}%`;
  }

  /**
   * Check if value is numeric for currency formatting
   */
  get isNumericValue(): boolean {
    return typeof this.kpi.value === 'number';
  }

  /**
   * Returns action hint classes for highlight variant
   */
  get actionHintClasses(): string {
    switch (this.kpi.highlightSeverity) {
      case 'critical':
        return 'text-sm text-red-600';
      case 'warning':
        return 'text-sm text-yellow-600';
      case 'info':
      default:
        return 'text-sm text-blue-600';
    }
  }
}
```

---

## Template (basic-kpi-card.component.html)

```html
<!-- Basic KPI Card - Supports Regular, Highlight, and Primary variants -->
<p-card [styleClass]="cardStyleClasses">
  <div class="flex flex-column gap-3">

    <!-- Top Row: Label + Optional Icon -->
    <div class="flex justify-content-between align-items-center">
      <span [class]="labelClasses">{{ kpi.label }}</span>
      @if (kpi.icon) {
        <i [class]="kpi.icon + ' ' + iconClasses"></i>
      }
    </div>

    <!-- Main Row: KPI Value -->
    <div [class]="valueClasses">
      @if (isNumericValue && kpi.currency) {
        {{ kpi.value | currency: kpi.currency : 'symbol' : '1.2-2' }}
      } @else if (isNumericValue) {
        {{ kpi.value | number: '1.0-2' }}
      } @else {
        {{ kpi.value }}
      }
    </div>

    <!-- Highlight Variant: Status Badge -->
    @if (kpi.variant === 'highlight' && kpi.statusBadge) {
      <div class="flex align-items-center gap-2">
        <p-badge [value]="kpi.statusBadge" [severity]="badgeSeverity"></p-badge>
      </div>
    }

    <!-- Bottom Row: Change Indicator (for Regular and Primary) -->
    @if (kpi.changePercent !== undefined && kpi.changeText) {
      <div class="flex align-items-center gap-2 text-sm">
        <i [class]="changeArrowIcon + ' ' + changeColorClass"></i>
        <span [class]="changeColorClass + ' font-medium'">{{ formattedChangePercent }}</span>
        @if (kpi.variant === 'primary') {
          <span class="text-primary-contrast opacity-70">{{ kpi.changeText }}</span>
        } @else {
          <span class="text-color-secondary">{{ kpi.changeText }}</span>
        }
      </div>
    }

    <!-- Highlight Variant: Action Hint -->
    @if (kpi.variant === 'highlight' && kpi.actionHint) {
      <div [class]="actionHintClasses">
        <i class="fa-solid fa-circle-info mr-1"></i>
        {{ kpi.actionHint }}
      </div>
    }

  </div>
</p-card>
```

---

## Usage Examples

### Regular KPI (Neutral Business Value)

```typescript
const regularKpi: KpiCardDto = {
  variant: 'regular',
  label: 'Balance',
  value: 12500.50,
  currency: 'EUR',
  changePercent: 12,
  changeText: 'from last month',
  icon: 'fa-regular fa-wallet'
};
```

```html
<app-basic-kpi-card [kpi]="regularKpi"></app-basic-kpi-card>
```

### Highlight KPI - Info Severity

```typescript
const infoKpi: KpiCardDto = {
  variant: 'highlight',
  label: 'Contract Status',
  value: 'Expiring Soon',
  icon: 'fa-solid fa-clock',
  highlightSeverity: 'info',
  statusBadge: '30 DAYS',
  actionHint: 'Review for renewal'
};
```

### Highlight KPI - Warning Severity

```typescript
const warningKpi: KpiCardDto = {
  variant: 'highlight',
  label: 'Dunning Status',
  value: 'In Dunning',
  icon: 'fa-solid fa-triangle-exclamation',
  highlightSeverity: 'warning',
  statusBadge: 'LEVEL 1',
  actionHint: 'Payment reminder sent'
};
```

### Highlight KPI - Critical Severity

```typescript
const criticalKpi: KpiCardDto = {
  variant: 'highlight',
  label: 'Payment Status',
  value: 'Payment Overdue',
  icon: 'fa-solid fa-circle-exclamation',
  highlightSeverity: 'critical',
  statusBadge: '15 DAYS',
  actionHint: 'Immediate action required'
};
```

### Primary KPI (Most Important - ONE per screen)

```typescript
const primaryKpi: KpiCardDto = {
  variant: 'primary',
  label: 'Net Balance',
  value: 89750.00,
  currency: 'EUR',
  changePercent: 15,
  changeText: 'year over year',
  icon: 'fa-solid fa-chart-line'
};
```

```html
<app-basic-kpi-card [kpi]="primaryKpi"></app-basic-kpi-card>
```

---

## File Structure

```
src/app/
├── basic-kpi-card/
│   ├── basic-kpi-card.component.ts
│   └── basic-kpi-card.component.html
└── kpi.model.ts
```

---

## Module Import

```typescript
// In your component or module
import { BasicKpiCardComponent } from './basic-kpi-card/basic-kpi-card.component';
import { KpiCardDto } from './kpi.model';

@Component({
  // ...
  imports: [BasicKpiCardComponent]
})
```
