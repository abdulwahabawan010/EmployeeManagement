# Chart KPI Card - Complete Implementation Reference

This file contains the complete implementation examples for the Chart KPI Card component. Use this as a blueprint to create or modify Chart KPI components in any project.

---

## Technology Stack

- Angular 20
- PrimeNG 20 (ChartModule, CardModule)
- PrimeFlex 4
- Font Awesome 6
- Chart.js (via PrimeNG)

---

## Model (chart-kpi.model.ts)

```typescript
/**
 * Chart type options for Chart KPI
 * - bar: Period-based comparison (default)
 * - line: Continuous trend over time
 * - pie: Distribution or composition
 */
export type ChartKpiType = 'bar' | 'line' | 'pie';

/**
 * Change direction for KPI trend indicator
 */
export type ChangeDirection = 'positive' | 'negative' | 'neutral';

/**
 * Chart data structure compatible with PrimeNG/Chart.js
 */
export interface ChartKpiData {
  labels: string[];
  datasets: ChartDataset[];
}

/**
 * Dataset structure for charts
 */
export interface ChartDataset {
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
  pointHoverRadius?: number;
}

/**
 * Chart KPI Card Data Transfer Object
 * Supports all three chart types: Bar, Line, Pie
 */
export interface ChartKpiCardDto {
  /** Chart type to display */
  chartType: ChartKpiType;

  /** Short, noun-based label (e.g., "Monthly Revenue") */
  label: string;

  /** Primary KPI figure value */
  value: number;

  /** Currency code for formatting (e.g., "EUR", "USD") - optional */
  currency?: string;

  /** Change percentage from previous period - optional */
  changePercent?: number;

  /** Direction of change for styling */
  changeDirection?: ChangeDirection;

  /** Optional Font Awesome icon class */
  icon?: string;

  /** PrimeNG-compatible chart data */
  chartData: ChartKpiData;

  /** Index of current/active period (for bar/line charts) - optional */
  activeIndex?: number;
}
```

---

## Component (chart-kpi-card.component.ts)

```typescript
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ChartKpiCardDto, ChartKpiType } from '../chart-kpi.model';

/**
 * Chart KPI Card Component
 *
 * Supports three chart types:
 * - bar: Period-based comparison with highlighted current period
 * - line: Continuous trend visualization
 * - pie: Distribution/composition display
 *
 * @example
 * <app-chart-kpi-card [kpi]="revenueKpi"></app-chart-kpi-card>
 */
@Component({
  selector: 'app-chart-kpi-card',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule, CurrencyPipe, DecimalPipe],
  templateUrl: './chart-kpi-card.component.html'
})
export class ChartKpiCardComponent implements OnInit {
  /** KPI data to display */
  @Input({ required: true }) kpi!: ChartKpiCardDto;

  /** Chart options configured based on chart type */
  chartOptions: any = {};

  /** Processed chart data with active index highlighting */
  processedChartData: any = {};

  ngOnInit(): void {
    this.setupChartOptions();
    this.processChartData();
  }

  /**
   * Configure chart options based on chart type
   */
  private setupChartOptions(): void {
    const baseOptions = {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      }
    };

    switch (this.kpi.chartType) {
      case 'bar':
        this.chartOptions = {
          ...baseOptions,
          scales: {
            x: {
              display: true,
              grid: { display: false },
              ticks: { font: { size: 10 }, color: '#9CA3AF' }
            },
            y: { display: false }
          }
        };
        break;

      case 'line':
        this.chartOptions = {
          ...baseOptions,
          scales: {
            x: {
              display: true,
              grid: { display: false },
              ticks: { font: { size: 10 }, color: '#9CA3AF' }
            },
            y: { display: false }
          },
          elements: {
            point: { radius: 0, hoverRadius: 6 }
          }
        };
        break;

      case 'pie':
        this.chartOptions = {
          ...baseOptions,
          cutout: '60%'
        };
        break;
    }
  }

  /**
   * Process chart data with active index highlighting for bar charts
   */
  private processChartData(): void {
    if (this.kpi.chartType === 'bar' && this.kpi.activeIndex !== undefined) {
      const primaryColor = '#3B82F6';
      const mutedColor = 'rgba(59, 130, 246, 0.4)';

      const backgroundColors = this.kpi.chartData.datasets[0].data.map((_, index) =>
        index === this.kpi.activeIndex ? primaryColor : mutedColor
      );

      this.processedChartData = {
        labels: this.kpi.chartData.labels,
        datasets: [{
          ...this.kpi.chartData.datasets[0],
          backgroundColor: backgroundColors,
          borderRadius: 4
        }]
      };
    } else {
      this.processedChartData = this.kpi.chartData;
    }
  }

  /**
   * Returns the appropriate arrow icon based on change direction
   */
  get changeArrowIcon(): string {
    if (this.kpi.changeDirection === 'negative') {
      return 'fa-solid fa-arrow-down';
    }
    if (this.kpi.changeDirection === 'positive') {
      return 'fa-solid fa-arrow-up';
    }
    return 'fa-solid fa-minus';
  }

  /**
   * Returns the appropriate text color class based on change direction
   */
  get changeColorClass(): string {
    switch (this.kpi.changeDirection) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-color-secondary';
    }
  }

  /**
   * Returns formatted change percentage with sign
   */
  get formattedChangePercent(): string {
    if (this.kpi.changePercent === undefined) return '';
    const sign = this.kpi.changePercent >= 0 ? '+' : '';
    return `${sign}${this.kpi.changePercent}%`;
  }

  /**
   * Returns chart height based on chart type
   */
  get chartHeight(): string {
    return this.kpi.chartType === 'pie' ? '100px' : '80px';
  }
}
```

---

## Template (chart-kpi-card.component.html)

```html
<!-- Chart KPI Card - Supports Bar, Line, and Pie chart types -->
<p-card styleClass="shadow-none border-1 border-surface">
  <div class="flex flex-column gap-3">

    <!-- Top Row: Icon + Change Indicator -->
    <div class="flex justify-content-between align-items-center">
      <!-- Icon (left) -->
      @if (kpi.icon) {
        <i [class]="kpi.icon + ' text-color-secondary text-xl'"></i>
      } @else {
        <span></span>
      }

      <!-- Change Indicator (right) -->
      @if (kpi.changePercent !== undefined) {
        <div class="flex align-items-center gap-1">
          <i [class]="changeArrowIcon + ' ' + changeColorClass + ' text-sm'"></i>
          <span [class]="changeColorClass + ' font-medium text-sm'">
            {{ formattedChangePercent }}
          </span>
        </div>
      }
    </div>

    <!-- Middle: Label + Value -->
    <div class="flex flex-column gap-1">
      <span class="text-sm text-color-secondary uppercase font-medium">
        {{ kpi.label }}
      </span>
      <span class="text-3xl font-bold text-color">
        @if (kpi.currency) {
          {{ kpi.value | currency: kpi.currency : 'symbol' : '1.0-0' }}
        } @else {
          {{ kpi.value | number: '1.0-0' }}
        }
      </span>
    </div>

    <!-- Bottom: Mini Chart -->
    <div [style.height]="chartHeight">
      <p-chart
        [type]="kpi.chartType"
        [data]="processedChartData"
        [options]="chartOptions"
        [style]="{ width: '100%', height: '100%' }">
      </p-chart>
    </div>

  </div>
</p-card>
```

---

## Usage Examples

### Bar Chart KPI (Period Comparison)

```typescript
const barChartKpi: ChartKpiCardDto = {
  chartType: 'bar',
  label: 'Monthly Revenue',
  value: 48290,
  currency: 'EUR',
  changePercent: 12.5,
  changeDirection: 'positive',
  icon: 'fa-solid fa-chart-bar',
  activeIndex: 3, // April is current month
  chartData: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      data: [32000, 41000, 38000, 48290, 0, 0]
    }]
  }
};
```

```html
<app-chart-kpi-card [kpi]="barChartKpi"></app-chart-kpi-card>
```

### Line Chart KPI (Trend Analysis)

```typescript
const lineChartKpi: ChartKpiCardDto = {
  chartType: 'line',
  label: 'Active Users',
  value: 1842,
  changePercent: 8.3,
  changeDirection: 'positive',
  icon: 'fa-solid fa-users',
  chartData: {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      data: [1200, 1450, 1680, 1842],
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    }]
  }
};
```

```html
<app-chart-kpi-card [kpi]="lineChartKpi"></app-chart-kpi-card>
```

### Pie Chart KPI (Distribution)

```typescript
const pieChartKpi: ChartKpiCardDto = {
  chartType: 'pie',
  label: 'Contract Status',
  value: 248,
  changePercent: -2.1,
  changeDirection: 'negative',
  icon: 'fa-solid fa-file-contract',
  chartData: {
    labels: ['Active', 'Pending', 'Expired', 'Draft'],
    datasets: [{
      data: [165, 48, 25, 10],
      backgroundColor: ['#22C55E', '#3B82F6', '#EF4444', '#9CA3AF'],
      borderWidth: 0
    }]
  }
};
```

```html
<app-chart-kpi-card [kpi]="pieChartKpi"></app-chart-kpi-card>
```

---

## Complete Demo Component

### Demo Component (chart-kpi-demo.component.ts)

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartKpiCardComponent } from '../chart-kpi-card/chart-kpi-card.component';
import { ChartKpiCardDto } from '../chart-kpi.model';

@Component({
  selector: 'app-chart-kpi-demo',
  standalone: true,
  imports: [CommonModule, ChartKpiCardComponent],
  templateUrl: './chart-kpi-demo.component.html'
})
export class ChartKpiDemoComponent {

  /**
   * Single array containing all Chart KPI variants
   * Same component handles all chart types via the 'chartType' property
   */
  chartKpiCards: ChartKpiCardDto[] = [
    // BAR CHART - Period comparison
    {
      chartType: 'bar',
      label: 'Monthly Revenue',
      value: 48290,
      currency: 'EUR',
      changePercent: 12.5,
      changeDirection: 'positive',
      icon: 'fa-solid fa-euro-sign',
      activeIndex: 3,
      chartData: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          data: [32000, 41000, 38000, 48290, 0, 0]
        }]
      }
    },

    // LINE CHART - Trend analysis
    {
      chartType: 'line',
      label: 'Active Users',
      value: 1842,
      changePercent: 8.3,
      changeDirection: 'positive',
      icon: 'fa-solid fa-users',
      chartData: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
          data: [1200, 1450, 1680, 1842],
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        }]
      }
    },

    // PIE CHART - Distribution
    {
      chartType: 'pie',
      label: 'Contract Status',
      value: 248,
      changePercent: -2.1,
      changeDirection: 'negative',
      icon: 'fa-solid fa-file-contract',
      chartData: {
        labels: ['Active', 'Pending', 'Expired', 'Draft'],
        datasets: [{
          data: [165, 48, 25, 10],
          backgroundColor: ['#22C55E', '#3B82F6', '#EF4444', '#9CA3AF'],
          borderWidth: 0
        }]
      }
    }
  ];
}
```

### Demo Template (chart-kpi-demo.component.html)

```html
<div class="flex flex-column gap-4">
  <div class="flex align-items-center gap-2 mb-2">
    <span class="text-xl font-semibold text-color">Chart KPI Variants</span>
    <span class="text-sm text-color-secondary">
      ({{ chartKpiCards.length }} items - Bar, Line, Pie)
    </span>
  </div>

  <div class="flex gap-4 flex-wrap">
    @for (kpi of chartKpiCards; track kpi.label) {
      <div class="w-20rem">
        <app-chart-kpi-card [kpi]="kpi"></app-chart-kpi-card>
      </div>
    }
  </div>
</div>
```

---

## File Structure

```
src/app/
├── chart-kpi-card/
│   ├── chart-kpi-card.component.ts
│   └── chart-kpi-card.component.html
├── chart-kpi-demo/
│   ├── chart-kpi-demo.component.ts
│   └── chart-kpi-demo.component.html
└── chart-kpi.model.ts
```

---

## Module Import

```typescript
// In your component or module
import { ChartKpiCardComponent } from './chart-kpi-card/chart-kpi-card.component';
import { ChartKpiCardDto } from './chart-kpi.model';

@Component({
  // ...
  imports: [ChartKpiCardComponent]
})
```

---

## PrimeNG Chart Module Setup

Ensure ChartModule is available in your application:

```typescript
// In app.config.ts or module
import { provideChartJs } from 'ng2-charts';

// Or import ChartModule where needed
import { ChartModule } from 'primeng/chart';
```

**Note:** PrimeNG's Chart component uses Chart.js under the hood. Ensure chart.js is installed:
```bash
npm install chart.js
```
