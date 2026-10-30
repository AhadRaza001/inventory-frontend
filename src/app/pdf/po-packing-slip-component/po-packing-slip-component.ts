import { Component, inject, signal } from '@angular/core';
import { PackingSlipSerive } from '../../saleOrder/service/packing-slip-serive';
import { PsDetailService } from '../../saleOrder/service/ps-detail-service';
import { ActivatedRoute } from '@angular/router';
import { NgxExtendedPdfViewerService, NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { Location } from '@angular/common';
import { forkJoin } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-po-packing-slip-component',
  imports: [NgxExtendedPdfViewerModule],
  templateUrl: './po-packing-slip-component.html',
  styleUrl: './po-packing-slip-component.css',
})
export class PoPackingSlipComponent {
  private packingSlipService = inject(PackingSlipSerive);
  private packingSlipDetailService = inject(PsDetailService);
  private route = inject(ActivatedRoute);
  private pdfService = inject(NgxExtendedPdfViewerService);
  private location = inject(Location);

  pdfBlob = signal<Blob | null>(null);

  private slip: any = null;
  private rows: any[] = [];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    forkJoin({
      slip: this.packingSlipService.getByPurchaseOrder(id),
      details: this.packingSlipDetailService.getbyid(id),
    }).subscribe({
      next: ({ slip, details }) => {
        this.slip = (slip as any).data?.[0];
        this.rows = (details as any).data ?? [];

        this.createPdf(this.slip, this.rows);
      },
      error: (err) => {
        console.error('Error loading purchase packing slip:', err);
      },
    });
  }

  // --------------------------------------------------
  // CREATE PURCHASE PACKING SLIP PDF
  // --------------------------------------------------

  private createPdf(packingSlip: any, details: any[]): void {
    if (!packingSlip) {
      console.error('Purchase packing slip data is empty');
      return;
    }

    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();

    const leftX = 20;
    let leftY = 32;

    const rightX = pageWidth - 20;
    let rightY = 32;

    // --------------------------------------------------
    // HEADER
    // --------------------------------------------------

    const type = String(packingSlip.type ?? 'purchase').toUpperCase();

    doc.setFontSize(16);

    doc.text(`${type} PACKING SLIP`, pageWidth / 2, 12, { align: 'center' });

    // Supplier name instead of customer name
    doc.setFontSize(12);

    doc.text(packingSlip.supplier?.name ?? '', pageWidth / 2, 22, { align: 'center' });

    // --------------------------------------------------
    // LEFT INFORMATION
    // --------------------------------------------------

    doc.setFontSize(10);

    doc.text(`Packing Slip : ${packingSlip.ps_no ?? ''}`, leftX, leftY);
    leftY += 6;

    doc.text(`Warehouse : ${packingSlip.store?.name ?? ''}`, leftX, leftY);
    leftY += 6;

    doc.text(`User Name : ${packingSlip.user?.name ?? ''}`, leftX, leftY);
    leftY += 6;

    const rawDate = String(packingSlip.date ?? packingSlip.created_at ?? '');

    const date = rawDate ? rawDate.substring(0, 10).split('-').reverse().join('-') : '';

    doc.text(`Date : ${date}`, leftX, leftY);

    // --------------------------------------------------
    // RIGHT INFORMATION
    // --------------------------------------------------

    doc.text(`Purchase Order : ${packingSlip.purchase_order?.po_no ?? ''}`, rightX, rightY, {
      align: 'right',
    });

    rightY += 6;

    doc.text(
      `Supplier Reference : ${packingSlip.purchase_order?.supplier_reference ?? ''}`,
      rightX,
      rightY,
      { align: 'right' },
    );

    rightY += 6;

    doc.text(
      `Supplier Requisition : ${packingSlip.purchase_order?.supplier_requisitions ?? ''}`,
      rightX,
      rightY,
      { align: 'right' },
    );

    // --------------------------------------------------
    // DIVIDER
    // --------------------------------------------------

    doc.line(17, rightY + 13, 190, rightY + 13);

    // --------------------------------------------------
    // PURCHASE DETAILS TABLE
    // --------------------------------------------------

    autoTable(doc, {
      startY: 60,

      head: [['SKU', 'Item', 'Received Qty']],

      body: details.map((d: any) => [d.item?.sku ?? '', d.item?.name ?? '', d.packed_qty ?? '']),

      theme: 'plain',

      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineWidth: 0,
      },

      headStyles: {
        fontStyle: 'bold',
        fillColor: false,
        textColor: 0,
      },

      bodyStyles: {
        fillColor: false,
      },

      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 100 },
        2: { cellWidth: 35, halign: 'center' },
      },
    });

    // --------------------------------------------------
    // RECEIPT SIGNATURE
    // --------------------------------------------------

    const finalY = (doc as any).lastAutoTable.finalY + 85;

    doc.setFontSize(10);

    doc.text('Received By :', 20, finalY);
    doc.line(48, finalY, 95, finalY);

    doc.text('Signature :', 120, finalY);
    doc.line(145, finalY, 190, finalY);

    // --------------------------------------------------
    // OUTPUT
    // --------------------------------------------------

    this.pdfBlob.set(doc.output('blob'));
  }

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  onSearch(text: string) {
    if (!text.trim()) {
      this.clearSearch();
      return;
    }

    this.pdfService.find(text, { highlightAll: true });
  }

  private clearSearch() {
    this.pdfService.find('');
  }

  next(text: string) {
    if (text) this.pdfService.findNext();
  }

  prev(text: string) {
    if (text) this.pdfService.findPrevious();
  }

  // --------------------------------------------------
  // FILE NAME / DOWNLOAD
  // --------------------------------------------------

  private get fileName() {
    return this.slip?.ps_no ?? 'purchase-packing-slip';
  }

  private download(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');

    a.href = url;
    a.download = name;

    a.click();

    URL.revokeObjectURL(url);
  }

  // --------------------------------------------------
  // PDF EXPORT
  // --------------------------------------------------

  exportPdf() {
    const blob = this.pdfBlob();

    if (blob) {
      this.download(blob, `${this.fileName}.pdf`);
    }
  }

  // --------------------------------------------------
  // PRINT
  // --------------------------------------------------

  print() {
    this.pdfService.print();
  }

  // --------------------------------------------------
  // EXCEL EXPORT
  // --------------------------------------------------

  async exportExcel() {
    if (!this.slip) return;

    const ExcelJS = (await import('exceljs')).default;

    const wb = new ExcelJS.Workbook();

    const ws = wb.addWorksheet('Purchase Packing Slip');

    ws.addRow(['PURCHASE PACKING SLIP']).font = {
      bold: true,
      size: 14,
    };

    ws.addRow([this.slip.supplier?.name ?? '']);

    ws.addRow([]);

    ws.addRow(['Packing Slip', this.slip.ps_no ?? '']);

    ws.addRow(['Warehouse', this.slip.store?.name ?? '']);

    ws.addRow(['User Name', this.slip.user?.name ?? '']);

    ws.addRow(['Purchase Order', this.slip.purchase_order?.po_no ?? '']);

    ws.addRow(['Supplier Reference', this.slip.purchase_order?.supplier_reference ?? '']);

    ws.addRow(['Supplier Requisition', this.slip.purchase_order?.supplier_requisitions ?? '']);

    ws.addRow([]);

    ws.addRow(['SKU', 'Item', 'Ordered Qty', 'Received Qty']).font = { bold: true };

    this.rows.forEach((d: any) => {
      ws.addRow([
        d.item?.sku ?? '',
        d.item?.name ?? '',
        Number(d.po_detail?.quantity ?? 0),
        Number(d.packed_qty ?? 0),
      ]);
    });

    ws.columns = [{ width: 24 }, { width: 36 }, { width: 18 }, { width: 18 }];

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

  async exportWord() {
    if (!this.slip) return;

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

    const cell = (text: string, bold = false) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text, bold })],
          }),
        ],
      });

    const info = (label: string, value: any) =>
      new Paragraph({
        children: [new TextRun(`${label} : ${value ?? ''}`)],
      });

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'PURCHASE PACKING SLIP',
                  bold: true,
                  size: 32,
                }),
              ],
            }),

            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: this.slip.supplier?.name ?? '',
                  size: 28,
                }),
              ],
            }),

            new Paragraph({}),

            info('Packing Slip', this.slip.ps_no),

            info('Warehouse', this.slip.store?.name),

            info('User Name', this.slip.user?.name),

            info('Purchase Order', this.slip.purchase_order?.po_no),

            info('Supplier Reference', this.slip.purchase_order?.supplier_reference),

            info('Supplier Requisition', this.slip.purchase_order?.supplier_requisitions),

            new Paragraph({}),

            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },

              rows: [
                new TableRow({
                  children: [
                    cell('SKU', true),
                    cell('Item', true),
                    cell('Ordered Qty', true),
                    cell('Received Qty', true),
                  ],
                }),

                ...this.rows.map(
                  (d: any) =>
                    new TableRow({
                      children: [
                        cell(String(d.item?.sku ?? '')),

                        cell(String(d.item?.name ?? '')),

                        cell(String(d.po_detail?.quantity ?? '')),

                        cell(String(d.packed_qty ?? '')),
                      ],
                    }),
                ),
              ],
            }),
          ],
        },
      ],
    });

    this.download(await Packer.toBlob(doc), `${this.fileName}.docx`);
  }

  // --------------------------------------------------
  // ZOOM
  // --------------------------------------------------

  zoom: number | string = 100;

  zoomPercent = 100;

  private readonly MIN_ZOOM = 25;
  private readonly MAX_ZOOM = 400;
  private readonly STEP = 10;

  private setZoom(value: number) {
    const clamped = Math.min(this.MAX_ZOOM, Math.max(this.MIN_ZOOM, value));

    this.zoomPercent = clamped;
    this.zoom = clamped;
  }

  zoomIn() {
    this.setZoom(this.zoomPercent + this.STEP);
  }

  zoomOut() {
    this.setZoom(this.zoomPercent - this.STEP);
  }

  resetZoom() {
    this.setZoom(100);
  }

  onZoomChange(value: number | string | undefined) {
    const n = Number(value);

    if (!isNaN(n) && n > 0) {
      this.zoomPercent = Math.round(n);
    }
  }

  // --------------------------------------------------
  // BACK
  // --------------------------------------------------

  back() {
    this.location.back();
  }
}
