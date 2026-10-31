import { Component, inject, signal } from '@angular/core';
import { ItemService } from '../../item/service/item-service';
import { StoreService } from '../../store/service/store-service';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { Toast, ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { DatePipe, Location } from '@angular/common';
import { DrawerModule } from 'primeng/drawer';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { IItemLedgerResponse, ItemledgerService } from '../itemledger-service';
import * as XLSX from 'xlsx';
import { NgxExtendedPdfViewerService, NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface IOption {
  id: number;
  name: string;
}

// One display row with the running balance already worked out
interface ILedgerRow {
  id: number;
  date: string;
  type: string;
  in_qty: number;
  order_no: string | null;
  out_qty: number;
  balance: number;
  created_by: string;
}

@Component({
  selector: 'app-itemledger-component',
  imports: [
    Toast,
    ButtonModule,
    FormsModule,
    ButtonModule,
    DrawerModule,
    SelectModule,
    DatePickerModule,
    TableModule,
    ToastModule,
    NgxExtendedPdfViewerModule,
  ],
  templateUrl: './itemledger-component.html',
  styleUrl: './itemledger-component.css',
})
export class ItemledgerComponent {
  private ledgerService = inject(ItemledgerService);
  private itemService = inject(ItemService);
  private storeService = inject(StoreService);
  private messageService = inject(MessageService);
  private pdfService = inject(NgxExtendedPdfViewerService);
  private location = inject(Location);

  pdfBlob = signal<Blob | null>(null);

  summary = signal<IItemLedgerResponse | null>(null);
  rows = signal<ILedgerRow[]>([]);

  drawerVisible = signal(false);
  loading = signal(false);
  noRecords = signal(false);

  items = signal<IOption[]>([]);
  stores = signal<IOption[]>([]);

  // Filter fields
  itemId: number | null = null;
  storeId: number | null = null;
  dateFrom: Date | null = null;
  dateTo: Date | null = null;

  // PDF zoom
  zoom: number | string = 100;
  zoomPercent = 100;

  private readonly MIN_ZOOM = 25;
  private readonly MAX_ZOOM = 400;
  private readonly STEP = 10;

  ngOnInit(): void {
    forkJoin({
      items: this.itemService.all(),
      stores: this.storeService.all(),
    }).subscribe({
      next: (res: any) => {
        this.items.set(res.items.data);
        this.stores.set(res.stores.data);
        this.openDrawer();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Could not load items and warehouses',
        });
      },
    });
  }

  // --------------------------------------------------
  // FILTERS
  // --------------------------------------------------

  openDrawer(): void {
    this.drawerVisible.set(true);
  }

  resetFilters(): void {
    this.itemId = null;
    this.storeId = null;
    this.dateFrom = null;
    this.dateTo = null;
  }

  applyFilters(): void {
    if (!this.itemId || !this.storeId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing filters',
        detail: 'Item and warehouse are required',
      });
      return;
    }

    if (this.dateFrom && this.dateTo && this.dateFrom > this.dateTo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid range',
        detail: 'Start date cannot be after end date',
      });
      return;
    }

    this.loading.set(true);
    this.noRecords.set(false);
    this.pdfBlob.set(null);

    this.ledgerService
      .getLedger({
        item_id: this.itemId,
        store_id: this.storeId,
        date_from: this.dateFrom ? this.formatDate(this.dateFrom) : null,
        date_to: this.dateTo ? this.formatDate(this.dateTo) : null,
      })
      .subscribe({
        next: (res) => {
          const ledgerData = res.data;

          this.summary.set(ledgerData);

          const ledgerRows = this.buildRows(ledgerData);
          this.rows.set(ledgerRows);

          // Generate PDF automatically after loading ledger data
          this.createPdf(ledgerData, ledgerRows);

          this.loading.set(false);
          this.drawerVisible.set(false);
        },

        error: (err) => {
          this.loading.set(false);
          this.summary.set(null);
          this.rows.set([]);
          this.pdfBlob.set(null);

          if (err.status === 404) {
            this.noRecords.set(true);
            this.drawerVisible.set(false);
            return;
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Could not load the item ledger',
          });
        },
      });
  }

  // --------------------------------------------------
  // BUILD LEDGER ROWS / RUNNING BALANCE
  // --------------------------------------------------

  private buildRows(data: IItemLedgerResponse): ILedgerRow[] {
    const sorted = [...data.ledgers].sort((a, b) => {
      const byDate = a.transaction_date.localeCompare(b.transaction_date);
      return byDate !== 0 ? byDate : a.id - b.id;
    });

    let balance = Number(data.opening_balance);
    const result: ILedgerRow[] = [];

    for (const entry of sorted) {
      const qty = Number(entry.quantity);

      let inQty = 0;
      let outQty = 0;

      if (entry.transaction_type === 'IN' || entry.transaction_type === 'ADJUSTMENT') {
        inQty = qty;
        balance += qty;
      } else {
        outQty = qty;
        balance -= qty;
      }

      result.push({
        id: entry.id,
        date: entry.transaction_date,
        type: entry.transaction_type,
        order_no: entry.order_no ?? '-',
        in_qty: inQty,
        out_qty: outQty,
        balance: Math.round(balance * 10000) / 10000,
        created_by: entry.created_by?.name ?? '',
      });
    }

    return result;
  }

  // --------------------------------------------------
  // TOTALS
  // --------------------------------------------------

  get totalInQty(): number {
    return this.rows().reduce((total, row) => total + row.in_qty, 0);
  }

  get totalOutQty(): number {
    return this.rows().reduce((total, row) => total + row.out_qty, 0);
  }

  // --------------------------------------------------
  // PDF GENERATION
  // --------------------------------------------------

  private createPdf(data: IItemLedgerResponse, rows: ILedgerRow[]): void {
    const doc = new jsPDF('landscape', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();

    // --------------------------------------------------
    // TITLE
    // --------------------------------------------------

    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');

    doc.text('ITEM LEDGER REPORT', pageWidth / 2, 15, {
      align: 'center',
    });

    // --------------------------------------------------
    // ITEM / WAREHOUSE INFORMATION
    // --------------------------------------------------

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    doc.text(`Item : ${data.item?.name ?? ''}`, 14, 28);
    doc.text(`Warehouse : ${data.store?.name ?? ''}`, 14, 35);

    doc.text(`From Date : ${data.date_from ?? 'All'}`, pageWidth - 40, 28, {
      align: 'right',
    });

    doc.text(`To Date : ${data.date_to ?? 'All'}`, pageWidth - 40, 35, {
      align: 'right',
    });

    doc.text(`Opening Balance : ${data.opening_balance}`, 14, 42);
    doc.text(`Closing Balance : ${data.closing_balance}`, 14, 49);

    doc.line(14, 53, pageWidth - 14, 53);

    // --------------------------------------------------
    // LEDGER TABLE
    // --------------------------------------------------

    autoTable(doc, {
      startY: 60,

      head: [['Date', 'Order No', 'Type', 'In Qty', 'Out Qty', 'Balance', 'Created By']],

      body: rows.map((row) => [
        this.formatPdfDate(row.date),
        row.order_no ?? '-',
        row.type,
        row.in_qty || '',
        row.out_qty || '',
        row.balance,
        row.created_by,
      ]),

      foot: [['', '', 'Total', this.totalInQty, this.totalOutQty, data.closing_balance, '']],

      theme: 'grid',

      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        lineWidth: 0.1,
        lineColor: [180, 180, 180],
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
      },

      headStyles: {
        fontStyle: 'bold',
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        lineWidth: 0.1,
        lineColor: [180, 180, 180],
      },

      footStyles: {
        fontStyle: 'bold',
        fillColor: [235, 245, 240],
        textColor: [0, 0, 0],
        lineWidth: 0.1,
        lineColor: [180, 180, 180],
      },

      margin: {
        left: 14,
        right: 14,
      },
    });

    // --------------------------------------------------
    // OUTPUT FOR PDF VIEWER
    // --------------------------------------------------

    this.pdfBlob.set(doc.output('blob'));
  }

  private formatPdfDate(value: string): string {
    if (!value) return '';

    const datePart = value.substring(0, 10);

    // Handles YYYY-MM-DD
    if (datePart.includes('-')) {
      return datePart.split('-').reverse().join('-');
    }

    return datePart;
  }

  // --------------------------------------------------
  // FILE NAME / DOWNLOAD
  // --------------------------------------------------

  private get fileName(): string {
    const itemName = this.summary()?.item?.name ?? 'Item-Ledger';

    return itemName.trim().replace(/[^a-zA-Z0-9-_]/g, '-');
  }

  private download(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = name;
    a.click();

    URL.revokeObjectURL(url);
  }

  // --------------------------------------------------
  // PDF EXPORT / PRINT
  // --------------------------------------------------

  exportPdf(): void {
    const data = this.summary();

    if (!data) return;

    const doc = new jsPDF('landscape', 'mm', 'a4');

    // Rebuild PDF so export always uses current ledger data
    this.createPdf(data, this.rows());

    const blob = this.pdfBlob();

    if (blob) {
      this.download(blob, `${this.fileName}.pdf`);
    }
  }

  print(): void {
    if (this.pdfBlob()) {
      this.pdfService.print();
    }
  }

  // --------------------------------------------------
  // EXCEL EXPORT
  // --------------------------------------------------

  async exportExcel(): Promise<void> {
    const data = this.summary();

    if (!data) return;

    const ExcelJS = (await import('exceljs')).default;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Item Ledger');

    ws.addRow(['ITEM LEDGER REPORT']).font = {
      bold: true,
      size: 16,
    };

    ws.addRow([`Item: ${data.item.name}`]);
    ws.addRow([`Warehouse: ${data.store.name}`]);
    ws.addRow([`From Date: ${data.date_from}`]);
    ws.addRow([`To Date: ${data.date_to}`]);
    ws.addRow([`Opening Balance: ${data.opening_balance}`]);
    ws.addRow([`Closing Balance: ${data.closing_balance}`]);

    ws.addRow([]);

    const header = ws.addRow([
      'Date',
      'Order No',
      'Type',
      'In Qty',
      'Out Qty',
      'Balance',
      'Created By',
    ]);

    header.font = { bold: true };

    this.rows().forEach((row) => {
      ws.addRow([
        this.formatPdfDate(row.date),
        row.order_no ?? '-',
        row.type,
        row.in_qty,
        row.out_qty,
        row.balance,
        row.created_by,
      ]);
    });

    const totalRow = ws.addRow([
      '',
      '',
      'Total',
      this.totalInQty,
      this.totalOutQty,
      Number(data.closing_balance),
      '',
    ]);

    totalRow.font = { bold: true };

    ws.columns = [
      { width: 18 },
      { width: 22 },
      { width: 18 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
      { width: 24 },
    ];

    const buffer = await wb.xlsx.writeBuffer();

    this.download(
      new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      `${this.fileName}.xlsx`,
    );
  }

  // --------------------------------------------------
  // WORD EXPORT
  // --------------------------------------------------

  async exportWord(): Promise<void> {
    const data = this.summary();

    if (!data) return;

    const {
      Document,
      Packer,
      Paragraph,
      Table,
      TableRow,
      TableCell,
      TextRun,
      WidthType,
      AlignmentType,
    } = await import('docx');

    const cell = (value: string, bold = false) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: value,
                bold,
              }),
            ],
          }),
        ],
      });

    const info = (label: string, value: unknown) =>
      new Paragraph({
        children: [
          new TextRun({
            text: `${label}: ${String(value ?? '')}`,
          }),
        ],
      });

    const tableRows = [
      new TableRow({
        children: [
          cell('Date', true),
          cell('Order No', true),
          cell('Type', true),
          cell('In Qty', true),
          cell('Out Qty', true),
          cell('Balance', true),
          cell('Created By', true),
        ],
      }),

      ...this.rows().map(
        (row) =>
          new TableRow({
            children: [
              cell(this.formatPdfDate(row.date)),
              cell(row.order_no ?? '-'),
              cell(row.type),
              cell(String(row.in_qty)),
              cell(String(row.out_qty)),
              cell(String(row.balance)),
              cell(row.created_by),
            ],
          }),
      ),

      new TableRow({
        children: [
          cell(''),
          cell(''),
          cell('Total', true),
          cell(String(this.totalInQty), true),
          cell(String(this.totalOutQty), true),
          cell(String(data.closing_balance), true),
          cell(''),
        ],
      }),
    ];

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'ITEM LEDGER REPORT',
                  bold: true,
                  size: 32,
                }),
              ],
            }),

            new Paragraph({}),

            info('Item', data.item.name),
            info('Warehouse', data.store.name),
            info('From Date', data.date_from),
            info('To Date', data.date_to),
            info('Opening Balance', data.opening_balance),
            info('Closing Balance', data.closing_balance),

            new Paragraph({}),

            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              rows: tableRows,
            }),
          ],
        },
      ],
    });

    this.download(await Packer.toBlob(doc), `${this.fileName}.docx`);
  }

  // --------------------------------------------------
  // PDF SEARCH
  // --------------------------------------------------

  onSearch(text: string): void {
    if (!text.trim()) {
      this.clearSearch();
      return;
    }

    this.pdfService.find(text, {
      highlightAll: true,
    });
  }

  private clearSearch(): void {
    this.pdfService.find('');
  }

  next(text: string): void {
    if (text.trim()) {
      this.pdfService.findNext();
    }
  }

  prev(text: string): void {
    if (text.trim()) {
      this.pdfService.findPrevious();
    }
  }

  // --------------------------------------------------
  // PDF ZOOM
  // --------------------------------------------------

  private setZoom(value: number): void {
    const clamped = Math.min(this.MAX_ZOOM, Math.max(this.MIN_ZOOM, value));

    this.zoomPercent = clamped;
    this.zoom = clamped;
  }

  zoomIn(): void {
    this.setZoom(this.zoomPercent + this.STEP);
  }

  zoomOut(): void {
    this.setZoom(this.zoomPercent - this.STEP);
  }

  resetZoom(): void {
    this.setZoom(100);
  }

  onZoomChange(value: number | string | undefined): void {
    const n = Number(value);

    if (!isNaN(n) && n > 0) {
      this.zoomPercent = Math.round(n);
    }
  }

  // --------------------------------------------------
  // BACK
  // --------------------------------------------------

  back(): void {
    this.location.back();
  }

  // --------------------------------------------------
  // DATE FORMAT
  // --------------------------------------------------

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${y}-${m}-${day}`;
  }
}
