import { Component, inject, signal } from '@angular/core';
import { SupplierService } from '../../service/supplier-service';
import { Router } from '@angular/router';
import { ToastService } from '../../../toast/toast-service';
import { ConfirmationService } from 'primeng/api';
import { ISupplier } from '../../../interface/isupplier';
import { TableLazyLoadEvent, TableCheckbox, SortIcon, ColumnFilter, TableHeaderCheckbox, Table } from 'primeng/table';
import { Location } from '@angular/common';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { CurrencyPipe, DatePipe,} from '@angular/common';

import { TableToolbar } from '../../../shared/table-toolbar/table-toolbar';

@Component({
  selector: 'app-supplier',
  imports: [TableCheckbox, SortIcon, ColumnFilter, TableHeaderCheckbox, Table, TableToolbar, DatePipe,CurrencyPipe],
  templateUrl: './supplier.html',
  styleUrl: './supplier.css',
})
export class Supplier {
  supplierService = inject(SupplierService);
  router = inject(Router);
  toast = inject(ToastService);
  location = inject(Location);
  confirmService = inject(ConfirmationService);
 
  selecteditems: ISupplier[] = [];
 
  suppliers = signal<ISupplier[]>([]);
 
  loading = true;
  searchValue = '';
  totalRecords = 0;
 
  lastLazyEvent!: TableLazyLoadEvent;
 
  loadSuppliers(event: TableLazyLoadEvent) {
    const page = (event.first ?? 0) / (event.rows ?? 10) + 1;
    const size = event.rows ?? 10;
 
    this.lastLazyEvent = event;
 
    // Sorting
    const sortField = (event.sortField as string) ?? 'id';
    const sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
 
    // Column filters
    const filters = Object.entries(event.filters ?? {}).flatMap(
      ([field, metadata]) => {
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
      },
    );
 
    this.loading = true;
 
    this.supplierService
      .getSuppliers(page, size, this.searchValue, sortField, sortOrder, filters)
      .subscribe({
        next: (response: any) => {
          this.suppliers.set(response.data);
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
 
  detailSupplier(id: number) {
    this.router.navigate(['/supplier/detail/', id]);
  }
 
  back() {
    this.location.back();
  }
 
  onNew() {
    this.router.navigate(['/suppliers/create']);
  }
 
  onSearch(value: string) {
    this.searchValue = value;
 
    if (this.lastLazyEvent) {
      this.loadSuppliers({
        ...this.lastLazyEvent,
        first: 0,
      });
    }
  }
 
  refresh() {
    this.loadSuppliers(this.lastLazyEvent);
    this.selecteditems = [];
  }
 
  exportSelected() {
    if (this.selecteditems.length === 0) {
      this.toast.warn('Please select at least one supplier.');
      return;
    }
 
    const exportData = this.selecteditems.map((supplier) => ({
      SKU: supplier.sku,
      Name: supplier.name,
      Phone: supplier.phone,
      City: supplier.city,
      Email: supplier.email,
      Address: supplier.address,
      'Credit Limit': supplier.credit_limit,
      'Created At': supplier.created_at,
      'Updated At': supplier.updated_at,
    }));
 
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
 
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Suppliers');
    XLSX.writeFile(workbook, 'suppliers.xlsx');
 
    this.selecteditems = [];
  }
 
  exportPDF() {
    if (this.selecteditems.length === 0) {
      this.toast.warn('Please select at least one supplier.');
      return;
    }
 
    const doc = new jsPDF('landscape');
 
    doc.setFontSize(20);
    doc.text('Inventory Management System', 14, 15);
 
    doc.setFontSize(15);
    doc.text('Supplier Report', 14, 25);
 
    doc.setFontSize(10);
    doc.text('Generated On: ' + new Date().toLocaleString(), 14, 35);
    doc.text('Developed By: Ahad Raza', 220, 15);
 
    autoTable(doc, {
      startY: 45,
 
      head: [
        [
          'ID',
          'SKU',
          'Name',
          'Phone',
          'City',
          'Email',
          'Address',
          'Credit Limit',
          'Created At',
          'Updated At',
        ],
      ],
 
      body: this.selecteditems.map((supplier) => [
        supplier.id,
        supplier.sku ?? '',
        supplier.name ?? '',
        supplier.phone ?? '',
        supplier.city ?? '',
        supplier.email ?? '',
        supplier.address ?? '',
        supplier.credit_limit ?? '',
        supplier.created_at ?? '',
        supplier.updated_at ?? '',
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
 
    doc.save('Suppliers.pdf');
 
    this.selecteditems = [];
  }
 
  deleteSelected() {
    if (this.selecteditems.length === 0) {
      this.toast.warn('Please select at least one supplier.');
      return;
    }
 
    this.confirmService.confirm({
      message: `Do you want to delete ${this.selecteditems.length} selected suppliers?`,
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
 
        this.supplierService.bulkDelete(ids).subscribe({
          next: (response: any) => {
            this.toast.success(response.message);
            this.selecteditems = [];
            this.loadSuppliers(this.lastLazyEvent);
          },
 
          error: (err: any) => {
            this.toast.error(err.error?.message ?? 'Something went wrong.');
          },
        });
      },
    });
  }
}
