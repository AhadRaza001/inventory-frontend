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
import { CurrencyPipe, DatePipe, Location } from '@angular/common';
import { Select } from 'primeng/select';
import { TableToolbar } from '../../../shared/table-toolbar/table-toolbar';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ConfirmationService } from 'primeng/api';
@Component({
  selector: 'app-sale-order-component',
  imports: [
    TableModule,
    FormsModule,
    FloatLabelModule,
    InputTextModule,
    ToolbarModule,
    ButtonModule,
    DatePipe,
    Select,
    TableToolbar,
  ],
  templateUrl: './sale-order-component.html',
  styleUrl: './sale-order-component.css',
})
export class SaleOrderComponent {
  saleOrderService = inject(SaleOrderService);
  router = inject(Router);
  toast = inject(ToastService);
  location = inject(Location);
  confirmService = inject(ConfirmationService);
  selecteditems: IsaleOrder[] = [];
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
  lastLazyEvent!: any;

  loadSaleOrders(event: TableLazyLoadEvent) {
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

  back() {
    this.location.back();
  }

  exportSelected() {
    const exportData = this.selecteditems.map((order) => ({
      ID: order.id,
      'SO No': order.so_no,
      Customer: order.customer?.name ?? '',
      Store: order.store?.name ?? '',
      // User: order.user?.name ?? '',
      Status: order.status,
      'Amount Status': order.amount_status,
      'Sub Total': order.sub_total,
      'Discount Amount': order.discount_amount,
      'Discount %': order.discount_percentage,
      'Tax %': order.taxPercent,
      'Tax Amount': order.tax_amount,
      'Grand Total': order.grand_total,
      'Paid Amount': order.paid_amount,
      'Due Amount': order.due_amount,
      'Customer Requisition': order.customer_requisitions ?? '',
      'Customer Reference': order.customer_reference ?? '',
      'Created At': order.created_at,
      'Updated At': order.updated_at,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sale Order');

    XLSX.writeFile(workbook, 'saleOrder.xlsx');
    this.selecteditems = [];
  }
  exportPDF() {
    if (this.selecteditems.length === 0) {
      this.toast.warn('Please select at least one sale order.');
      return;
    }

    const doc = new jsPDF('landscape');

    doc.setFontSize(20);
    doc.text('Inventory Management System', 14, 15);

    doc.setFontSize(15);
    doc.text('Sale Order Report', 14, 25);

    doc.setFontSize(10);
    doc.text('Generated On: ' + new Date().toLocaleString(), 14, 35);

    doc.text('Developed By: Ahad Raza', 220, 15);

    autoTable(doc, {
      startY: 45,

      head: [
        [
          'ID',
          'SO No',
          'Customer',
          'Store',
          'Status',
          'Amount Status',
          'Sub Total',
          'Discount Amount',
          'Discount %',
          'Tax %',
          'Tax Amount',
          'Grand Total',
          'Paid Amount',
          'Due Amount',
          'Customer Requisition',
          'Customer Reference',
          'Created At',
          'Updated At',
        ],
      ],

      body: this.selecteditems.map((order) => [
        order.id,
        order.so_no ?? '',
        order.customer?.name ?? '',
        order.store?.name ?? '',
        order.status ?? '',
        order.amount_status ?? '',
        order.sub_total ?? '',
        order.discount_amount ?? '',
        order.discount_percentage ?? '',
        order.taxPercent ?? '',
        order.tax_amount ?? '',
        order.grand_total ?? '',
        order.paid_amount ?? '',
        order.due_amount ?? '',
        order.customer_requisitions ?? '',
        order.customer_reference ?? '',
        order.created_at ?? '',
        order.updated_at ?? '',
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

    doc.save('Sale_order.pdf');

    this.selecteditems = [];
  }
  refresh() {
    this.loadSaleOrders(this.lastLazyEvent);
    this.selecteditems = [];
  }
  onNew() {
    this.router.navigate(['/saleOrders/createOrder']);
  }
  onSearch(value: string) {
    this.searchValue = value;

    if (this.lastLazyEvent) {
      this.loadSaleOrders({
        ...this.lastLazyEvent,
        first: 0,
      });
    }
  }

  deleteSelected() {
    if (this.selecteditems.length === 0) {
      this.toast.warn('Please select at least one sale order.');
      return;
    }

    this.confirmService.confirm({
      message: `Do you want to delete ${this.selecteditems.length} selected sale orders?`,
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

        this.saleOrderService.bulkDelete(ids).subscribe({
          next: (response: any) => {
            this.toast.success(response.message);
            this.selecteditems = [];
            this.loadSaleOrders(this.lastLazyEvent);
          },
          error: (err: any) => {
            this.toast.error(err.error?.message || 'Something went wrong.');
          },
        });
      },
    });
  }
}
