import { Component, inject, signal } from '@angular/core';
import { UnitService } from '../../service/unit-service';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../toast/toast-service';
import { Iunit } from '../../../interface/iunit';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-unit-controller',
  imports: [
    TableModule,
    FormsModule,
    FloatLabelModule,
    InputTextModule,
    ToolbarModule,
    ButtonModule,
    RouterLink,
  ],
  templateUrl: './unit-controller.html',
  styleUrl: './unit-controller.css',
})
export class UnitController {
  unitService = inject(UnitService);
  router = inject(Router);
  toast = inject(ToastService);

  units = signal<Iunit[]>([]);

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

    this.unitService
      .getUnit(page, size, this.searchValue, sortField, sortOrder, filters)
      .subscribe({
        next: (response: any) => {
          this.units.set(response.data);
          this.totalRecords = response.pagination.total;
          this.loading = false;
        },
        error: (error) => {
          console.error(error);

          this.toast.error(error?.message ?? 'Something went wrong.');

          this.loading = false;
        },
      });
  }

  detailUnit(id: number) {
    this.unitService.getById(id).subscribe({
      next: () => {
        this.router.navigate(['/unit/detail', id]);
      },
      error: (error) => {
        console.error(error);
        this.toast.error(error?.message ?? 'Something went wrong.');
      },
    });
  }
}
