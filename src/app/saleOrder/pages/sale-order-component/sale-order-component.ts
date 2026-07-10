import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, ValueChangeEvent } from '@angular/forms';

import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { SaleOrderService } from '../../service/sale-order-service';
import { ToastService } from '../../../toast/toast-service';
import { IsaleOrder } from '../../../interface/isale-order';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Select } from 'primeng/select';
@Component({
  selector: 'app-sale-order-component',
  imports: [
    TableModule,
    FormsModule,
    FloatLabelModule,
    InputTextModule,
    ToolbarModule,
    ButtonModule,
    RouterLink,
    CurrencyPipe,
    DatePipe,
    Select,
  ],
  templateUrl: './sale-order-component.html',
  styleUrl: './sale-order-component.css',
})
export class SaleOrderComponent {
  saleOrderService = inject(SaleOrderService);
  router = inject(Router);
  toast = inject(ToastService);

  saleOrders = signal<IsaleOrder[]>([]);

  statusOptions = [
    { label: 'Open', value: 'open' },
    { label: 'Partial', value: 'partially_delivered' },
    { label: 'Deliverd', value: 'delivered' },
  ];
  amount_status = [
    { label: 'Paid', value: 'paid' },
    { label: 'Unpaid', value: 'unpaid' },
    { label: 'Partial', value: 'partial' },
  ];

  loading = true;
  searchValue = '';
  totalRecords = 0;

  clear(table: any) {
    table.clear();
    this.searchValue = '';
  }

  ngOnInit() {
    setTimeout(() => {
      console.log('Loading State:', this.loading);
    }, 3000);
  }
  loadSaleOrders(event: TableLazyLoadEvent) {
    const page = (event.first ?? 0) / (event.rows ?? 10) + 1;
    const size = event.rows ?? 10;

    // Sorting
    const sortField = (event.sortField as string) ?? 'id';
    const sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';

    // Column Filters
    const filters = Object.entries(event.filters ?? {}).flatMap(([field, metadata]) => {
      if (!metadata) return [];

      const constraint = Array.isArray(metadata) ? metadata[0] : metadata;

      if (constraint.value == null || constraint.value === '') {
        return [];
      }
      return [
        {
          field,
          value: constraint.value,
          operator: constraint.matchMode,
        },
      ];
    });

    this.loading = true;
    this.saleOrderService
      .getSaleOrder(page, size, this.searchValue, sortField, sortOrder, filters)
      .subscribe({
        next: (response: any) => {
          this.saleOrders.set(response.data);
          console.log('sale orders is:', response);

          this.totalRecords = response.pagination.total;
          this.loading = false;
        },
        error: (error: any) => {
          console.error(error);

          this.toast.error(error?.message ?? 'Something went wrong.');

          this.loading = false;
        },
      });
  }

  detailSaleOrder(id: number) {
    this.saleOrderService.getById(id).subscribe({
      next: () => {
        this.router.navigate(['/saleOrder/detail', id]);
      },
      error: (error: any) => {
        console.error(error);
        this.toast.error(error?.message ?? 'Something went wrong.');
      },
    });
  }
}
