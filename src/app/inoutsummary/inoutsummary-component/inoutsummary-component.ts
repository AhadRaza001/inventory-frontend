import { Component, inject, signal } from '@angular/core';
import { IInOutSummaryRow, InoutsummaryService } from '../inoutsummary-service';
import { ItemService } from '../../item/service/item-service';
import { StoreService } from '../../store/service/store-service';
import { MessageService } from 'primeng/api';
import { NgxExtendedPdfViewerModule, NgxExtendedPdfViewerService } from 'ngx-extended-pdf-viewer';
import { Toast, ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { DrawerModule } from 'primeng/drawer';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { forkJoin } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Location } from '@angular/common';

interface IOption {
  id: number;
  name: string;
}

// One display row with numbers already converted
interface ISummaryRow {
  item_id: number;
  item_sku: string;
  item_name: string;
  opening_balance: number;
  total_in: number;
  total_out: number;
  closing_balance: number;
}
@Component({
  selector: 'app-inoutsummary-component',
  imports: [
    Toast,
    ButtonModule,
    FormsModule,
    DrawerModule,
    SelectModule,
    DatePickerModule,
    TableModule,
    ToastModule,
    NgxExtendedPdfViewerModule,
  ],
  templateUrl: './inoutsummary-component.html',
  styleUrl: './inoutsummary-component.css',
})
export class InoutsummaryComponent {
  private summaryService = inject(InoutsummaryService);
  private itemService = inject(ItemService);
  private storeService = inject(StoreService);
  private messageService = inject(MessageService);
  private pdfService = inject(NgxExtendedPdfViewerService);
  private location = inject(Location);

  pdfBlob = signal<Blob | null>(null);

  rows = signal<ISummaryRow[]>([]);

  // Values used in the report header
  reportInfo = signal<{
    store: string;
    itemFrom: string;
    itemTo: string;
    dateFrom: string;
    dateTo: string;
  } | null>(null);

  drawerVisible = signal(false);
  loading = signal(false);
  noRecords = signal(false);

  items = signal<IOption[]>([]);
  stores = signal<IOption[]>([]);

  // Filter fields
  storeId: number | null = null;
  itemFrom: number | null = null;
  itemTo: number | null = null;
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
        // Items are filtered by id range on the server, so keep them ordered by id
        const sortedItems = [...res.items.data].sort((a: IOption, b: IOption) => a.id - b.id);

        this.items.set(sortedItems);
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
    this.storeId = null;
    this.itemFrom = null;
    this.itemTo = null;
    this.dateFrom = null;
    this.dateTo = null;
  }

  applyFilters(): void {
    if (!this.storeId || !this.itemFrom || !this.itemTo || !this.dateFrom || !this.dateTo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing filters',
        detail: 'Warehouse, item range and date range are required',
      });
      return;
    }

    if (this.itemFrom > this.itemTo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid item range',
        detail: 'Item from cannot be after item to',
      });
      return;
    }

    if (this.dateFrom > this.dateTo) {
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

    const dateFromText = this.formatDate(this.dateFrom);
    const dateToText = this.formatDate(this.dateTo);

    this.summaryService
      .getSummary({
        store_id: this.storeId,
        item_from: this.itemFrom,
        item_to: this.itemTo,
        date_from: dateFromText,
        date_to: dateToText,
      })
      .subscribe({
        next: (res) => {
          const summaryRows = this.buildRows(res.data ?? []);
          console.log('In out summary', res);

          if (!summaryRows.length) {
            this.rows.set([]);
            this.reportInfo.set(null);
            this.noRecords.set(true);
            this.loading.set(false);
            this.drawerVisible.set(false);
            return;
          }

          const info = {
            store: this.findName(this.stores(), this.storeId),
            itemFrom: this.findName(this.items(), this.itemFrom),
            itemTo: this.findName(this.items(), this.itemTo),
            dateFrom: dateFromText,
            dateTo: dateToText,
          };

          this.rows.set(summaryRows);
          this.reportInfo.set(info);

          // Generate PDF automatically after loading data
          this.createPdf(info, summaryRows);

          this.loading.set(false);
          this.drawerVisible.set(false);
        },

        error: (err) => {
          this.loading.set(false);
          this.rows.set([]);
          this.reportInfo.set(null);
          this.pdfBlob.set(null);

          if (err.status === 404) {
            this.noRecords.set(true);
            this.drawerVisible.set(false);
            return;
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Could not load the in/out summary',
          });
        },
      });
  }

  // --------------------------------------------------
  // BUILD ROWS
  // --------------------------------------------------

  private buildRows(data: IInOutSummaryRow[]): ISummaryRow[] {
    return [...data]
      .sort((a, b) => a.item.id - b.item.id)
      .map((entry) => ({
        item_id: entry.item.id,
        item_sku: String(entry.item.sku ?? ''),
        item_name: entry.item.name ?? '',
        opening_balance: this.round(Number(entry.opening_balance)),
        total_in: this.round(Number(entry.total_in)),
        total_out: this.round(Number(entry.total_out)),
        closing_balance: this.round(Number(entry.closing_balance)),
      }));
  }

  private round(value: number): number {
    return Math.round(value * 10000) / 10000;
  }

  private findName(list: IOption[], id: number | null): string {
    return list.find((option) => option.id === id)?.name ?? '';
  }

  // --------------------------------------------------
  // TOTALS
  // --------------------------------------------------

  get totalOpening(): number {
    return this.round(this.rows().reduce((total, row) => total + row.opening_balance, 0));
  }

  get totalInQty(): number {
    return this.round(this.rows().reduce((total, row) => total + row.total_in, 0));
  }

  get totalOutQty(): number {
    return this.round(this.rows().reduce((total, row) => total + row.total_out, 0));
  }

  get totalClosing(): number {
    return this.round(this.rows().reduce((total, row) => total + row.closing_balance, 0));
  }

  // --------------------------------------------------
  // PDF GENERATION
  // --------------------------------------------------

  private createPdf(
    info: NonNullable<ReturnType<typeof this.reportInfo>>,
    rows: ISummaryRow[],
  ): void {
    const doc = new jsPDF('landscape', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();

    // --------------------------------------------------
    // TITLE
    // --------------------------------------------------

    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');

    doc.text('ITEM IN / OUT SUMMARY', pageWidth / 2, 15, {
      align: 'center',
    });

    // --------------------------------------------------
    // WAREHOUSE / RANGE INFORMATION
    // --------------------------------------------------

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    doc.text(`Warehouse : ${info.store}`, 14, 28);
    doc.text(`Item From : ${info.itemFrom}`, 14, 35);
    doc.text(`Item To : ${info.itemTo}`, 14, 42);

    doc.text(`From Date : ${this.formatPdfDate(info.dateFrom)}`, pageWidth - 40, 28, {
      align: 'right',
    });

    doc.text(`To Date : ${this.formatPdfDate(info.dateTo)}`, pageWidth - 40, 35, {
      align: 'right',
    });

    doc.line(14, 47, pageWidth - 14, 47);

    // --------------------------------------------------
    // SUMMARY TABLE
    // --------------------------------------------------

    autoTable(doc, {
      startY: 54,

      head: [['SKU', 'Item', 'Opening Balance', 'Total In', 'Total Out', 'Closing Balance']],

      body: rows.map((row) => [
        row.item_sku,
        row.item_name,
        row.opening_balance,
        row.total_in,
        row.total_out,
        row.closing_balance,
      ]),

      foot: [
        [
          { content: 'Total', colSpan: 2, styles: { halign: 'center' } },
          this.totalOpening,
          this.totalInQty,
          this.totalOutQty,
          this.totalClosing,
        ],
      ],

      theme: 'grid',

      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.1,
        lineColor: [180, 180, 180],
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
      },

      headStyles: {
        halign: 'center',
        fontStyle: 'bold',
        // fillColor: [16, 185, 129],
        // textColor: [255, 255, 255],
        lineWidth: 0.1,
        // lineColor: [180, 180, 180],
      },

      footStyles: {
        halign: 'center',
        fontStyle: 'bold',
        // fillColor: [235, 245, 240],
        textColor: [0, 0, 0],
        lineWidth: 0.1,
        lineColor: [180, 180, 180],
      },

      columnStyles: {
        0: { cellWidth: 24 }, // narrow SKU column
      },

      margin: { left: 14, right: 14 },
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
    const info = this.reportInfo();

    if (!info) return 'Item-In-Out-Summary';

    return `In-Out-Summary-${info.dateFrom}-to-${info.dateTo}`.replace(/[^a-zA-Z0-9-_]/g, '-');
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
    const info = this.reportInfo();

    if (!info) return;

    // Rebuild PDF so export always uses current data
    this.createPdf(info, this.rows());

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
    const info = this.reportInfo();

    if (!info) return;

    const ExcelJS = (await import('exceljs')).default;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('In Out Summary');

    ws.addRow(['ITEM IN / OUT SUMMARY']).font = {
      bold: true,
      size: 16,
    };

    ws.addRow([`Warehouse: ${info.store}`]);
    ws.addRow([`Item From: ${info.itemFrom}`]);
    ws.addRow([`Item To: ${info.itemTo}`]);
    ws.addRow([`From Date: ${info.dateFrom}`]);
    ws.addRow([`To Date: ${info.dateTo}`]);

    ws.addRow([]);

    const header = ws.addRow([
      'SKU',
      'Item',
      'Opening Balance',
      'Total In',
      'Total Out',
      'Closing Balance',
    ]);
    header.font = { bold: true };

    this.rows().forEach((row) => {
      ws.addRow([
        row.item_sku,
        row.item_name,
        row.opening_balance,
        row.total_in,
        row.total_out,
        row.closing_balance,
      ]);
    });

    const totalRow = ws.addRow([
      '',
      'Total',
      this.totalOpening,
      this.totalInQty,
      this.totalOutQty,
      this.totalClosing,
    ]);
    totalRow.font = { bold: true };

    ws.columns = [
      { width: 12 },
      { width: 34 },
      { width: 18 },
      { width: 14 },
      { width: 14 },
      { width: 18 },
    ];

    // Center everything from the table header down
    for (let r = header.number; r <= totalRow.number; r++) {
      ws.getRow(r).eachCell({ includeEmpty: true }, (c) => {
        c.alignment = { horizontal: 'center', vertical: 'middle' };
      });
    }

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
    const info = this.reportInfo();

    if (!info) return;

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

    const line = (label: string, value: unknown) =>
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
          cell('Sku', true),
          cell('Item', true),
          cell('Opening Balance', true),
          cell('Total In', true),
          cell('Total Out', true),
          cell('Closing Balance', true),
        ],
      }),

      ...this.rows().map(
        (row, index) =>
          new TableRow({
            children: [
              cell(String(row.item_sku)),
              cell(row.item_name),
              cell(String(row.opening_balance)),
              cell(String(row.total_in)),
              cell(String(row.total_out)),
              cell(String(row.closing_balance)),
            ],
          }),
      ),

      new TableRow({
        children: [
          cell(''),
          cell('Total', true),
          cell(String(this.totalOpening), true),
          cell(String(this.totalInQty), true),
          cell(String(this.totalOutQty), true),
          cell(String(this.totalClosing), true),
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
                  text: 'ITEM IN / OUT SUMMARY',
                  bold: true,
                  size: 32,
                }),
              ],
            }),

            new Paragraph({}),

            line('Warehouse', info.store),
            line('Item From', info.itemFrom),
            line('Item To', info.itemTo),
            line('From Date', info.dateFrom),
            line('To Date', info.dateTo),

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
