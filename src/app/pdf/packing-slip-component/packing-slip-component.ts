import { Component, inject, Inject, OnDestroy, OnInit, signal } from '@angular/core';
import { PackingSlipSerive } from '../../saleOrder/service/packing-slip-serive';
import { forkJoin, map, switchMap } from 'rxjs';
import { PsDetailService } from '../../saleOrder/service/ps-detail-service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-packing-slip-component',
  imports: [],
  templateUrl: './packing-slip-component.html',
  styleUrl: './packing-slip-component.css',
})
export class PackingSlipComponent implements OnInit, OnDestroy {
  private packingSlipService = inject(PackingSlipSerive);
  private packingSlipDetailService = inject(PsDetailService);
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  pdfUrl = signal<SafeResourceUrl | null>(null);
  private objectUrl: string | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    forkJoin({
      slip: this.packingSlipService.getBySaleOrder(id),
      details: this.packingSlipDetailService.getbyid(id),
    }).subscribe({
      next: ({ slip, details }) => {
        console.log('Packing slip response:', slip);
        console.log('Packing slip details response:', details);

        const slipResponse = slip as any;
        const detailsResponse = details as any;

        this.createPdf(slipResponse.data?.[0], detailsResponse.data ?? []);
      },
    });
  }

  private createPdf(packingSlip: any, details: any[]): void {
    const doc = new jsPDF();

    if (!packingSlip) {
      console.error('Packing slip data is empty');
      return;
    }

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

    doc.text(`${type} PACKING SLIP`, pageWidth / 2, 12, {
      align: 'center',
    });

    doc.text(`${packingSlip.customer.name}`, pageWidth / 2, 22, {
      align: 'center',
    });

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
      {
        align: 'right',
      },
    );

    rightY += 6;
    doc.text(
      `Customer Requisition : ${packingSlip.sale_order?.customer_requisitions ?? ''}`,
      rightX,
      rightY,
      {
        align: 'right',
      },
    );

    // --------------------------------------------------
    // DETAILS TABLE
    // --------------------------------------------------

    autoTable(doc, {
      startY: 60,

      head: [['SKU', 'Item', 'Quantity']],

      body: details.map((d: any) => [
        d.item.sku ?? '',
        d.item.name ?? '',
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

const finalY = (doc as any).lastAutoTable.finalY + 85;

doc.setFontSize(10);

doc.text('Recept: ', 20, finalY);

doc.line(
  35,
  finalY + 5,
80,
  finalY + 5
);

    // --------------------------------------------------
    // CREATE PDF URL
    // --------------------------------------------------

    this.objectUrl = URL.createObjectURL(doc.output('blob'));

    this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl));
  }

  ngOnDestroy(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }
}
