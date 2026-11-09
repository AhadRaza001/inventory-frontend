import { Component, computed, inject, signal } from '@angular/core';
import { DashboardService, IDashboardData } from '../../serivce/dashboard-service';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
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
export class Dashboard {
  private dashboardService = inject(DashboardService);

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

  // Second row: small master-data counts
  countCards = computed(() => {
    const d = this.data();
    if (!d) {
      return [];
    }
    return [
      { label: 'Items', value: d.counts.items, icon: 'pi pi-box', route: '/items' },
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

  chartData = computed(() => {
    const d = this.data();
    if (!d) {
      return null;
    }
    const style = getComputedStyle(document.documentElement);
    const salesColor = style.getPropertyValue('--p-primary-500');
    const purchaseColor = style.getPropertyValue('--p-surface-400');

    const labels: string[] = [];
    const sales: number[] = [];
    const purchases: number[] = [];
    for (const row of d.monthly_totals) {
      labels.push(row.month);
      sales.push(row.sales);
      purchases.push(row.purchases);
    }

    return {
      labels: labels,
      datasets: [
        { label: 'Sales', data: sales, backgroundColor: salesColor, borderRadius: 4 },
        { label: 'Purchases', data: purchases, backgroundColor: purchaseColor, borderRadius: 4 },
      ],
    };
  });

  chartOptions = {
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true } },
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.dashboardService.getDashboard().subscribe({
      next: (res) => {
        this.data.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load dashboard data.');
        this.loading.set(false);
      },
    });
  }

  statusSeverity(status: string): 'success' | 'warn' | 'info' | 'secondary' | 'danger' {
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
