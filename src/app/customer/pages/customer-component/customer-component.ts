import { Component, inject, signal } from '@angular/core';
import { TableToolbar } from '../../../shared/table-toolbar/table-toolbar';
import { CustomerService } from '../../service/customer-service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../toast/toast-service';
import { DecimalPipe, Location } from '@angular/common';
import { ConfirmationService } from 'primeng/api';
import { Icustomer } from '../../icustomer';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-customer-component',
  imports: [
    TableToolbar,
    TableModule,
    FormsModule,
    ToolbarModule,
    ButtonModule,
    TagModule,
    DecimalPipe,
  ],
  templateUrl: './customer-component.html',
  styleUrl: './customer-component.css',
})
export class CustomerComponent {
  customerService = inject(CustomerService);
  router = inject(Router);
  toast = inject(ToastService);
  location = inject(Location);
  route = inject(ActivatedRoute);
  confirmService = inject(ConfirmationService);

  customers = signal<Icustomer[]>([]);
  selecteditems: Icustomer[] = [];
  loading = true;
  searchValue = '';
  totalRecords = 0;
  lastLazyEvent!: any;

  statusSeverity(status: string): 'success' | 'secondary' | 'danger' {
    if (status === 'active') return 'success';
    if (status === 'blocked') return 'danger';
    return 'secondary';
  }

  loadCustomers(event: TableLazyLoadEvent) {
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

    this.customerService
      .getCustomer(page, size, this.searchValue, sortField, sortOrder, filters)
      .subscribe({
        next: (response: any) => {
          this.customers.set(response.data);
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

  detailCustomer(id: number) {
    this.customerService.getById(id).subscribe({
      next: () => {
        this.router.navigate(['/customers/detail', id]);
      },
      error: (error) => {
        console.error(error);
        this.toast.error(error?.message ?? 'Something went wrong.');
      },
    });
  }

  deleteSelected() {
    if (this.selecteditems.length === 0) {
      this.toast.warn('Please select at least one customer.');
      return;
    }

    this.confirmService.confirm({
      message: `Do you want to delete ${this.selecteditems.length} selected Customers?`,
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

        this.customerService.bulkDelete(ids).subscribe({
          next: (response: any) => {
            this.toast.success(response.message);
            this.selecteditems = [];
            this.loadCustomers(this.lastLazyEvent);
          },
          error: (err: any) => {
            this.toast.error(err.error?.message || 'Something went wrong.');
          },
        });
      },
    });
  }

  back() {
    this.location.back();
  }

  exportSelected() {
    if (this.selecteditems.length === 0) {
      this.toast.warn('Please select at least one customer.');
      return;
    }

    const exportData = this.selecteditems.map((customer) => ({
      ID: customer.id,
      'Customer No': customer.customer_no,
      Name: customer.name,
      Phone: customer.phone,
      Email: customer.email,
      City: customer.city,
      'Credit Limit': customer.credit_limit,
      Status: customer.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');

    XLSX.writeFile(workbook, 'customers.xlsx');
    this.selecteditems = [];
  }

  exportPDF() {
    if (this.selecteditems.length === 0) {
      this.toast.warn('Please select at least one customer.');
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Inventory Management System', 14, 15);

    doc.setFontSize(15);
    doc.text('Customers Report', 14, 25);

    doc.setFontSize(10);
    doc.text('Generated On: ' + new Date().toLocaleString(), 14, 33);

    doc.text('Developed By: Ahad Raza', 150, 15);
    autoTable(doc, {
      startY: 45,
      head: [['ID', 'Customer No', 'Name', 'Phone', 'Email', 'City', 'Credit Limit', 'Status']],
      body: this.selecteditems.map((c) => [
        c.id,
        c.customer_no ?? '',
        c.name ?? '',
        c.phone ?? '',
        c.email ?? '',
        c.city ?? '',
        c.credit_limit ?? '',
        c.status ?? '',
      ]),
      styles: { fontSize: 8 },
    });

    const finalY = (doc as any).lastAutoTable.finalY;

    doc.text(`Total Records: ${this.selecteditems.length}`, 14, finalY + 10);

    doc.save('Customer_Report.pdf');
    this.selecteditems = [];
  }

  refresh() {
    this.loadCustomers(this.lastLazyEvent);
    this.selecteditems = [];
  }

  onNew() {
    this.router.navigate(['createCustomer'], {
      relativeTo: this.route,
    });
  }

  onSearch(value: string) {
    this.searchValue = value;

    if (this.lastLazyEvent) {
      this.loadCustomers({
        ...this.lastLazyEvent,
        first: 0,
      });
    }
  }
}
