import { Component, inject, signal } from '@angular/core';
import { StoreService } from '../../service/store-service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../toast/toast-service';
import { ConfirmationService } from 'primeng/api';
import {
  TableLazyLoadEvent,
  TableCheckbox,
  SortIcon,
  ColumnFilter,
  TableHeaderCheckbox,
  Table,
  SortableColumn,
} from 'primeng/table';
import { Location, DatePipe } from '@angular/common';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

import { TableToolbar } from '../../../shared/table-toolbar/table-toolbar';
import { IStore } from '../../../interface/iso-detail';

@Component({
  selector: 'app-store-component',
  imports: [
    TableCheckbox,
    SortIcon,
    ColumnFilter,
    TableHeaderCheckbox,
    Table,
    TableToolbar,
    DatePipe,
    SortableColumn,
  ],
  templateUrl: './store-component.html',
  styleUrl: './store-component.css',
})
export class StoreComponent {
  storeService = inject(StoreService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  toast = inject(ToastService);
  location = inject(Location);
  confirmService = inject(ConfirmationService);

  selecteditems: IStore[] = [];

  stores = signal<IStore[]>([]);

  loading = true;
  searchValue = '';
  totalRecords = 0;

  lastLazyEvent!: TableLazyLoadEvent;

  loadStores(event: TableLazyLoadEvent) {
    const page = (event.first ?? 0) / (event.rows ?? 10) + 1;
    const size = event.rows ?? 10;

    this.lastLazyEvent = event;

    // Sorting
    const sortField = (event.sortField as string) ?? 'id';
    const sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';

    // Column filters
    const filters = Object.entries(event.filters ?? {}).flatMap(([field, metadata]) => {
      if (!metadata) {
        return [];
      }

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

    this.storeService
      .getStore(page, size, this.searchValue, sortField, sortOrder, filters)
      .subscribe({
        next: (response: any) => {
          this.stores.set(response.data);
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

  detailStore(id: number) {
    this.router.navigate(['/stores/detail/', id]);
  }

  back() {
    this.location.back();
  }

  onNew() {
    this.router.navigate(['/stores/createStore'], {
      relativeTo: this.route,
    });
  }

  onSearch(value: string) {
    this.searchValue = value;

    if (this.lastLazyEvent) {
      this.loadStores({
        ...this.lastLazyEvent,
        first: 0,
      });
    }
  }

  refresh() {
    this.loadStores(this.lastLazyEvent);
    this.selecteditems = [];
  }

  exportSelected() {
    if (this.selecteditems.length === 0) {
      this.toast.warn('Please select at least one store.');
      return;
    }

    const exportData = this.selecteditems.map((store) => ({
      Name: store.name,
      Phone: store.phone,
      Address: store.address,
      Description: store.description,
      'Created At': store.created_at,
      'Updated At': store.updated_at,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stores');
    XLSX.writeFile(workbook, 'stores.xlsx');

    this.selecteditems = [];
  }

  exportPDF() {
    if (this.selecteditems.length === 0) {
      this.toast.warn('Please select at least one store.');
      return;
    }

    const doc = new jsPDF('landscape');

    doc.setFontSize(20);
    doc.text('Inventory Management System', 14, 15);

    doc.setFontSize(15);
    doc.text('Store Report', 14, 25);

    doc.setFontSize(10);
    doc.text('Generated On: ' + new Date().toLocaleString(), 14, 35);
    doc.text('Developed By: Ahad Raza', 220, 15);

    autoTable(doc, {
      startY: 45,

      head: [['ID', 'Name', 'Phone', 'Address', 'Description', 'Created At', 'Updated At']],

      body: this.selecteditems.map((store) => [
        store.id,
        store.name ?? '',
        store.phone ?? '',
        store.address ?? '',
        store.description ?? '',
        store.created_at ?? '',
        store.updated_at ?? '',
      ]),

      tableWidth: 'auto',

      styles: {
        fontSize: 6,
        cellPadding: 1.5,
        overflow: 'linebreak',
        valign: 'middle',
      },

      headStyles: {
        fontSize: 6,
        valign: 'middle',
      },

      margin: {
        left: 10,
        right: 10,
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY;

    doc.setFontSize(10);
    doc.text(`Total Records: ${this.selecteditems.length}`, 14, finalY + 10);

    doc.save('Stores.pdf');

    this.selecteditems = [];
  }

  deleteSelected() {
    if (this.selecteditems.length === 0) {
      this.toast.warn('Please select at least one store.');
      return;
    }

    this.confirmService.confirm({
      message: `Do you want to delete ${this.selecteditems.length} selected stores?`,
      header: 'Danger Zone',
      icon: 'pi pi-info-circle',

      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },

      acceptButtonProps: {
        label: 'Delete',
        severity: 'danger',
      },

      accept: () => {
        const ids = this.selecteditems.map((item) => item.id);

        this.storeService.bulkDelete(ids).subscribe({
          next: (response: any) => {
            this.toast.success(response.message);
            this.selecteditems = [];
            this.loadStores(this.lastLazyEvent);
          },

          error: (err: any) => {
            this.toast.error(err.error?.message ?? 'Something went wrong.');
          },
        });
      },
    });
  }
}
