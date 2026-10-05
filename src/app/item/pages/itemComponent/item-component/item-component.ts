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
import { TableToolbar } from '../../../../shared/table-toolbar/table-toolbar';
import { Location } from '@angular/common';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ConfirmationService } from 'primeng/api';
@Component({
  selector: 'app-item-component',
  imports: [
    TableModule,
    FormsModule,
    FloatLabelModule,
    InputTextModule,
    ToolbarModule,
    ButtonModule,
    // RouterLink,
    CurrencyPipe,
    NgClass,
    Select,
    TableToolbar,
  ],
  templateUrl: './item-component.html',
  styleUrl: './item-component.css',
})
export class ItemComponent {
  itemService = inject(ItemService);
  router = inject(Router);
  toast = inject(ToastService);
  location = inject(Location);
  selecteditems: Iitem[] = [];
  confirmService = inject(ConfirmationService);


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
  lastLazyEvent!: any;
  loadItems(event: TableLazyLoadEvent) {
    const page = (event.first ?? 0) / (event.rows ?? 10) + 1;
    const size = event.rows ?? 10;
    this.lastLazyEvent = event;

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

  back() {
    this.location.back();
  }

  exportSelected() {
    const exportData = this.selecteditems.map((item) => ({
      ID: item.id,
      SKU: item.sku,
      Name: item.name,
      Category: item.category?.name,
      Unit: item.unit?.name,
      PurchasePrice: item.purchase_price,
      SalePrice: item.sale_price,
      Status: item.status,
      Barcode: item.barcode,
      ReorderLevel: item.reorder_level,
      Description: item.description,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Items');

    XLSX.writeFile(workbook, 'items.xlsx');
    this.selecteditems = [];
  }
  exportPDF() {
    if (this.selecteditems.length === 0) {
      this.toast.warn('Please select at least one item.');
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Inventory Management System', 14, 15);

    doc.setFontSize(15);
    doc.text('Items Report', 14, 25);

    doc.setFontSize(10);
    doc.text('Generated On: ' + new Date().toLocaleString(), 130, 120);

    doc.text('Developed By: Ahad Raza', 150, 15);
    autoTable(doc, {
      startY: 45,
      head: [['ID', 'SKU', 'Name', 'Category', 'Unit','Purchase Price', 'Sale Price', 'Status']],
      body: this.selecteditems.map((item) => [
        item.id,
        item.sku ?? '',
        item.name ?? '',
        item.category?.name ?? '',
        item.unit?.name ?? '',
        item.purchase_price ?? '',
        item.sale_price ?? '',
        item.status ?? '',
      ]),
    });

    const finalY = (doc as any).lastAutoTable.finalY;

    doc.text(`Total Records: ${this.selecteditems.length}`, 14, finalY + 10);

    doc.save('item_Report.pdf');
    this.selecteditems = [];
  }
  refresh() {
    this.loadItems(this.lastLazyEvent);
    this.selecteditems = [];
  }
  onNew() {
    this.router.navigate(['/item/createItem']);
  }
  onSearch(value: string) {
    this.searchValue = value;

    if (this.lastLazyEvent) {
      this.loadItems({
        ...this.lastLazyEvent,
        first: 0,
      });
    }
  }

  deleteSelected() {
    if (this.selecteditems.length === 0) {
      this.toast.warn('Please select at least one item.');
      return;
    }

    this.confirmService.confirm({
      message: `Do you want to delete ${this.selecteditems.length} selected Items?`,
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
        const ids = this.selecteditems.map((c) => c.id);

        this.itemService.bulkDelete(ids).subscribe({
          next: (response: any) => {
            this.toast.success(response.message);
            this.selecteditems = [];
            this.loadItems(this.lastLazyEvent);
          },
          error: (err: any) => {
            this.toast.error(err.error?.message || 'Something went wrong.');
          },
        });
      },
    });
  }
}
