import { Component, computed, inject, signal } from '@angular/core';
import { DashboardService, IDashboardData } from '../../serivce/dashboard-service';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import type { ChartData, ChartOptions } from 'chart.js';
@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    ChartModule,
    TableModule,
    TagModule,
    SkeletonModule,
    ButtonModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {  private dashboardService = inject(DashboardService);

  loading = signal(true);
  errorMessage = signal('');
  data = signal<IDashboardData | null>(null);

  // Top row of cards
  statCards = computed<any[]>(() => {
    const d = this.data();

    if (!d) {
      return [];
    }

    return [
      {
        label: 'Sales This Month',
        value: d.sales_this_month,
        icon: 'pi pi-shopping-cart',
        route: '/saleOrders',
        isMoney: true,
      },
      {
        label: 'Purchases This Month',
        value: d.purchases_this_month,
        icon: 'pi pi-shopping-bag',
        route: '/purchaseOrders',
        isMoney: true,
      },
      {
        label: 'Pending Sale Orders',
        value: d.pending_sale_orders,
        icon: 'pi pi-clock',
        route: '/saleOrders',
        isMoney: false,
      },
      {
        label: 'Pending Purchase Orders',
        value: d.pending_purchase_orders,
        icon: 'pi pi-clock',
        route: '/purchaseOrders',
        isMoney: false,
      },
    ];
  });

  // Profit cards
  profitCards = computed<any[]>(() => {
    const d = this.data();

    if (!d) {
      return [];
    }

    const p = d.profit_this_month;

    return [
      {
        label: 'Revenue (Dispatched)',
        value: p.revenue,
        icon: 'pi pi-wallet',
        kind: 'money',
      },
      {
        label: 'Cost of Goods Sold',
        value: p.cost,
        icon: 'pi pi-tag',
        kind: 'money',
      },
      {
        label: 'Profit This Month',
        value: p.profit,
        icon: 'pi pi-chart-line',
        kind: 'money',
      },
      {
        label: 'Profit Margin',
        value: p.margin_percent,
        icon: 'pi pi-percentage',
        kind: 'percent',
      },
    ];
  });

  // Master data counts
  countCards = computed(() => {
    const d = this.data();

    if (!d) {
      return [];
    }

    return [
      {
        label: 'Items',
        value: d.counts.items,
        icon: 'pi pi-box',
        route: '/items',
      },
      {
        label: 'Categories',
        value: d.counts.categories,
        icon: 'pi pi-folder',
        route: '/categories',
      },
      {
        label: 'Customers',
        value: d.counts.customers,
        icon: 'pi pi-chart-bar',
        route: '/customers',
      },
      {
        label: 'Suppliers',
        value: d.counts.suppliers,
        icon: 'pi pi-building',
        route: '/suppliers',
      },
    ];
  });

  // Mixed Bar + Line Chart
  chartData = computed<ChartData<'bar' | 'line'> | null>(() => {
    const d = this.data();

    if (!d) {
      return null;
    }

    const style = getComputedStyle(document.documentElement);

    const salesColor = style
      .getPropertyValue('--p-primary-500')
      .trim();

    const purchaseColor = style
      .getPropertyValue('--p-surface-400')
      .trim();

    const profitColor = style
      .getPropertyValue('--p-green-500')
      .trim();

    const labels = d.monthly_totals.map((row) => row.month);
    const sales = d.monthly_totals.map((row) => row.sales);
    const purchases = d.monthly_totals.map((row) => row.purchases);
    const profit = d.monthly_totals.map((row) => row.profit);

    return {
      labels,
      datasets: [
        {
          type: 'line',
          label: 'Profit',
          data: profit,
          borderColor: profitColor,
          backgroundColor: profitColor,
          tension: 0.3,
          borderWidth: 3,
          order: 0,
        },
        {
          type: 'bar',
          label: 'Sales',
          data: sales,
          backgroundColor: salesColor,
          borderRadius: 4,
          order: 1,
        },
        {
          type: 'bar',
          label: 'Purchases',
          data: purchases,
          backgroundColor: purchaseColor,
          borderRadius: 4,
          order: 1,
        },
      ],
    };
  });

  // Chart options
  chartOptions: ChartOptions<'bar' | 'line'> = {
    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: 'bottom',
      },
    },

    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  ngOnInit(): void {
    this.load();
  }

  // Load dashboard data
  load(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.dashboardService.getDashboard().subscribe({
      next: (res) => {
        this.data.set(res.data);
        this.loading.set(false);
      },

      error: (error) => {
        console.error('Dashboard loading error:', error);

        this.errorMessage.set(
          'Could not load dashboard data.'
        );

        this.loading.set(false);
      },
    });
  }

  // Order status severity
  statusSeverity(
    status: string
  ): 'success' | 'warn' | 'info' | 'secondary' | 'danger' {
    switch (status) {
      case 'completed':
      case 'dispatched':
      case 'received':
        return 'success';

      case 'pending':
      case 'draft':
        return 'warn';

      case 'cancelled':
        return 'danger';

      default:
        return 'secondary';
    }
  }
}
