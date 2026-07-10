import { Component, inject, signal } from '@angular/core';
import { ItemService } from '../../../service/item-service';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../../toast/toast-service';
import { Iitem } from '../../../../interface/iitem';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { CurrencyPipe, NgClass } from '@angular/common';
import { Select, SelectModule } from 'primeng/select';
import { GenerateNumberService } from '../../../../core/service/generate-number-service';

@Component({
  selector: 'app-item-component',
  imports: [
    TableModule,
    FormsModule,
    FloatLabelModule,
    InputTextModule,
    ToolbarModule,
    ButtonModule,
    RouterLink,
    CurrencyPipe,
    NgClass,
    Select,
  ],
  templateUrl: './item-component.html',
  styleUrl: './item-component.css',
})
export class ItemComponent {
  itemService = inject(ItemService);
  router = inject(Router);
  toast = inject(ToastService);

  units = signal<Iitem[]>([]);

  loading = true;
  searchValue = '';
  totalRecords = 0;

  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  clear(table: any) {
    table.clear();
    this.searchValue = '';
  }
  ngOnInit() {
    setTimeout(() => {
      console.log('Loading State:', this.loading);
    }, 3000);
  }

  loadUnits(event: TableLazyLoadEvent) {
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

    this.itemService
      .getItem(page, size, this.searchValue, sortField, sortOrder, filters)
      .subscribe({
        next: (response: any) => {
          this.units.set(response.data);
          this.totalRecords = response.pagination.total;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);

          this.loading = false;

          // Validation errors
          if (err.error?.errors) {
            Object.values(err.error.errors).forEach((messages: any) => {
              this.toast.error(messages[0]);
            });
            return;
          }

          // Duplicate entry
          if (err.error?.debug?.includes('Duplicate entry')) {
            this.toast.error('Record already exists.');
            return;
          }
          // Custom API message
          if (err.error?.message) {
            this.toast.error(err.error.message);
            return;
          }

          // Fallback
          this.toast.error('Something went wrong.');
        },
      });
  }

  detailItem(id: number) {
    this.itemService.getById(id).subscribe({
      next: () => {
        this.router.navigate(['/item/detail', id]);
      },
      error: (error) => {
        console.error(error);
        this.toast.error(error?.message ?? 'Something went wrong.');
      },
    });
  }
  
}
