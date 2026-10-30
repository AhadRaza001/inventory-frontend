import { Component, inject, Inject, OnDestroy, OnInit, signal } from '@angular/core';
import { PackingSlipSerive } from '../../saleOrder/service/packing-slip-serive';
import { forkJoin, map, switchMap } from 'rxjs';
import { PsDetailService } from '../../saleOrder/service/ps-detail-service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { NgxExtendedPdfViewerModule, NgxExtendedPdfViewerService } from 'ngx-extended-pdf-viewer';
import { Location } from '@angular/common';
@Component({
  selector: 'app-packing-slip-component',
  imports: [NgxExtendedPdfViewerModule],
  templateUrl: './packing-slip-component.html',
  styleUrl: './packing-slip-component.css',
})
export class PackingSlipComponent implements OnInit {
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
      slip: this.packingSlipService.getBySaleOrder(id),
      details: this.packingSlipDetailService.getbyid(id),
    }).subscribe(({ slip, details }) => {
      this.slip = (slip as any).data?.[0];
      this.rows = (details as any).data ?? [];
      this.createPdf(this.slip, this.rows);
    });
  }

  private createPdf(packingSlip: any, details: any[]): void {
    if (!packingSlip) {
      console.error('Packing slip data is empty');
      return;
    }

    const doc = new jsPDF();

    // --------------------------------------------------
    // PAGE / HEADER SETTINGS
    // --------------------------------------------------
    const pageWidth = doc.internal.pageSize.getWidth();

    const leftX = 20;
    let leftY = 32;

    const rightX = pageWidth - 20;
    let rightY = 32;

    const type = String(packingSlip.type ?? '').toUpperCase();

    // --------------------------------------------------
    // TITLE
    // --------------------------------------------------
    doc.setFontSize(16);

    doc.text(`${type} PACKING SLIP`, pageWidth / 2, 12, { align: 'center' });
    doc.text(`${packingSlip.customer?.name ?? ''}`, pageWidth / 2, 22, { align: 'center' });

    // --------------------------------------------------
    // LEFT SIDE
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
    // RIGHT SIDE
    // --------------------------------------------------
    doc.text(`Sale Order : ${packingSlip.sale_order?.so_no ?? ''}`, rightX, rightY, {
      align: 'right',
    });
    rightY += 6;

    doc.text(
      `Customer Reference : ${packingSlip.sale_order?.customer_reference ?? ''}`,
      rightX,
      rightY,
      { align: 'right' },
    );
    rightY += 6;

    doc.text(
      `Customer Requisition : ${packingSlip.sale_order?.customer_requisitions ?? ''}`,
      rightX,
      rightY,
      { align: 'right' },
    );

    // divider line under the header
    doc.line(17, rightY + 13, 190, rightY + 13);

    // --------------------------------------------------
    // DETAILS TABLE
    // --------------------------------------------------
    autoTable(doc, {
      startY: 60,
      head: [['SKU', 'Item', 'Quantity']],
      body: details.map((d: any) => [
        d.item?.sku ?? '',
        d.item?.name ?? '',
        d.quantity ?? d.packed_qty ?? '',
      ]),
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
    });

    // --------------------------------------------------
    // RECEIPT LINE
    // --------------------------------------------------
    const finalY = (doc as any).lastAutoTable.finalY + 85;

    doc.setFontSize(10);
    doc.text('Recept: ', 20, finalY);
    doc.line(35, finalY, 80, finalY);

    // --------------------------------------------------
    // OUTPUT (blob for the PDF viewer and the PDF export button)
    // --------------------------------------------------
    this.pdfBlob.set(doc.output('blob'));
  }

  // ---------------- SEARCH ----------------
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

  // ---------------- EXPORT ----------------
  private get fileName() {
    return this.slip?.ps_no ?? 'packing-slip';
  }

  private download(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportPdf() {
    const blob = this.pdfBlob();
    if (blob) this.download(blob, `${this.fileName}.pdf`);
  }
  print() {
    this.pdfService.print();
  }

  async exportExcel() {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Packing Slip');

    ws.addRow([`${String(this.slip.type ?? '').toUpperCase()} PACKING SLIP`]).font = {
      bold: true,
      size: 14,
    };
    ws.addRow([this.slip.customer?.name ?? '']);
    ws.addRow([]);
    ws.addRow(['Packing Slip', this.slip.ps_no ?? '']);
    ws.addRow(['Warehouse', this.slip.store?.name ?? '']);
    ws.addRow(['User Name', this.slip.user?.name ?? '']);
    ws.addRow(['Sale Order', this.slip.sale_order?.so_no ?? '']);
    ws.addRow(['Customer Reference', this.slip.sale_order?.customer_reference ?? '']);
    ws.addRow(['Customer Requisition', this.slip.sale_order?.customer_requisitions ?? '']);
    ws.addRow([]);
    ws.addRow(['SKU', 'Item', 'Quantity']).font = { bold: true };
    this.rows.forEach((d) =>
      ws.addRow([d.item?.sku ?? '', d.item?.name ?? '', Number(d.quantity ?? d.packed_qty ?? 0)]),
    );
    ws.columns = [{ width: 24 }, { width: 36 }, { width: 14 }];

    const buffer = await wb.xlsx.writeBuffer();
    this.download(
      new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      `${this.fileName}.xlsx`,
    );
  }

  async exportWord() {
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
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold })] })] });

    const info = (label: string, value: string) =>
      new Paragraph({ children: [new TextRun(`${label} : ${value ?? ''}`)] });

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `${String(this.slip.type ?? '').toUpperCase()} PACKING SLIP`,
                  bold: true,
                  size: 32,
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: this.slip.customer?.name ?? '', size: 28 })],
            }),
            new Paragraph({}),
            info('Packing Slip', this.slip.ps_no),
            info('Warehouse', this.slip.store?.name),
            info('User Name', this.slip.user?.name),
            info('Sale Order', this.slip.sale_order?.so_no),
            info('Customer Reference', this.slip.sale_order?.customer_reference),
            info('Customer Requisition', this.slip.sale_order?.customer_requisitions),
            new Paragraph({}),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [cell('SKU', true), cell('Item', true), cell('Quantity', true)],
                }),
                ...this.rows.map(
                  (d) =>
                    new TableRow({
                      children: [
                        cell(String(d.item?.sku ?? '')),
                        cell(String(d.item?.name ?? '')),
                        cell(String(d.quantity ?? d.packed_qty ?? '')),
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

  //zoom

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

  // keeps the label in sync if the zoom changes another way (Ctrl + mouse wheel)
  onZoomChange(value: number | string | undefined) {
    const n = Number(value);
    if (!isNaN(n) && n > 0) this.zoomPercent = Math.round(n);
  }
  back(){
    this.location.back();
  }
}
