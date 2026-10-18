import { Component, inject, signal } from '@angular/core';

import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';

import { CurrencyPipe, DatePipe, Location } from '@angular/common';

import { TableToolbar } from '../../../shared/table-toolbar/table-toolbar';
import { ConfirmationService } from 'primeng/api';

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { ToastService } from '../../../toast/toast-service';
import { Router } from '@angular/router';
import {
  TableLazyLoadEvent,
  Table,
  TableHeaderCheckbox,
  SortIcon,
  ColumnFilter,
  TableCheckbox,
} from 'primeng/table';
import { PurchaseOrderService } from '../../service/purchase-order-service';
import { IPurchaseOrder } from '../../interface/ipurchase-order';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-purchase-order',
  imports: [
    TableToolbar,
    Table,
    TableHeaderCheckbox,
    SortIcon,
    ColumnFilter,
    Select,
    TableCheckbox,
    FormsModule,
    DatePipe,
  ],
  templateUrl: './purchase-order.html',
  styleUrl: './purchase-order.css',
})
export class PurchaseOrder {
  purchaseOrderService = inject(PurchaseOrderService);
  router = inject(Router);
  toast = inject(ToastService);
  location = inject(Location);
  confirmService = inject(ConfirmationService);

  selecteditems: IPurchaseOrder[] = [];

  purchaseOrders = signal<IPurchaseOrder[]>([]);

  statusOptions = [
    {
      label: 'Open',
      value: 'open',
    },
    {
      label: 'Delivered',
      value: 'delivered',
    },
    {
      label: 'Cancelled',
      value: 'cancelled',
    },
  ];

  loading = true;
  searchValue = '';
  totalRecords = 0;

  lastLazyEvent!: TableLazyLoadEvent;

  clear(table: any) {
    table.clear();
    this.searchValue = '';
  }

  loadPurchaseOrders(event: TableLazyLoadEvent) {
    const page = (event.first ?? 0) / (event.rows ?? 10) + 1;

    const size = event.rows ?? 10;

    this.lastLazyEvent = event;

    // Sorting
    const sortField = (event.sortField as string) ?? 'id';

    const sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';

    // Column Filters
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

    this.purchaseOrderService
      .getPurchaseOrder(page, size, this.searchValue, sortField, sortOrder, filters)
      .subscribe({
        next: (response: any) => {
          this.purchaseOrders.set(response.data);
          console.log('Purchace order data is: ', response.data);
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

  detailPurchaseOrder(id: number) {
    this.purchaseOrderService.getById(id).subscribe({
      next: () => {
        this.router.navigate(['/purchaseOrder/detail', id]);
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

  onNew() {
    this.router.navigate(['/purchaseOrders/createOrder']);
  }

  onSearch(value: string) {
    this.searchValue = value;

    if (this.lastLazyEvent) {
      this.loadPurchaseOrders({
        ...this.lastLazyEvent,
        first: 0,
      });
    }
  }

  refresh() {
    this.loadPurchaseOrders(this.lastLazyEvent);

    this.selecteditems = [];
  }

  exportSelected() {
    if (this.selecteditems.length === 0) {
      this.toast.warn('Please select at least one purchase order.');

      return;
    }

    const exportData = this.selecteditems.map((order) => ({
      ID: order.id,

      'PO No': order.po_no,

      Supplier: order.supplier?.name ?? '',

      Store: order.store_id.name ?? '',

      // User: order.user_id ?? '',

      Status: order.status,

      'Sub Total': order.sub_total,

      'Discount Amount': order.discount_amount,

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

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Order');

    XLSX.writeFile(workbook, 'purchaseOrder.xlsx');

    this.selecteditems = [];
  }

  exportPDF() {
    if (this.selecteditems.length === 0) {
      this.toast.warn('Please select at least one purchase order.');

      return;
    }

    const doc = new jsPDF('landscape');

    doc.setFontSize(20);

    doc.text('Inventory Management System', 14, 15);

    doc.setFontSize(15);

    doc.text('Purchase Order Report', 14, 25);

    doc.setFontSize(10);

    doc.text('Generated On: ' + new Date().toLocaleString(), 14, 35);

    doc.text('Developed By: Ahad Raza', 220, 15);

    autoTable(doc, {
      startY: 45,

      head: [
        [
          'ID',
          'PO No',
          'Supplier',
          'Store',
          'Status',
          'Sub Total',
          'Discount Amount',
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

        order.po_no ?? '',

        order.supplier?.name ?? '',

        order.store_id?.name ?? '',

        order.status ?? '',

        order.sub_total ?? '',

        order.discount_amount ?? '',

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

    doc.save('Purchase_order.pdf');

    this.selecteditems = [];
  }

  deleteSelected() {
    if (this.selecteditems.length === 0) {
      this.toast.warn('Please select at least one purchase order.');

      return;
    }

    this.confirmService.confirm({
      message: `Do you want to delete ${this.selecteditems.length} selected purchase orders?`,

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

        this.purchaseOrderService.bulkDelete(ids).subscribe({
          next: (response: any) => {
            this.toast.success(response.message);

            this.selecteditems = [];

            this.loadPurchaseOrders(this.lastLazyEvent);
          },

          error: (err: any) => {
            this.toast.error(err.error?.message ?? 'Something went wrong.');
          },
        });
      },
    });
  }
}
