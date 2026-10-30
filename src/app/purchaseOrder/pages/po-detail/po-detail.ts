import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyPipe, DatePipe, Location, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { PurchaseOrderService } from '../../service/purchase-order-service';
import { IPurchaseOrder } from '../../interface/ipurchase-order';
import { PoItems } from '../po-items/po-items';
import { PackingSlipType } from '../../../interface/packing-slip.model';
import { PackingSlipSerive } from '../../../saleOrder/service/packing-slip-serive';

type IEditablePoField = 'customer_reference' | 'customer_requisitions';
@Component({
  selector: 'app-po-detail',
  imports: [
    UpperCasePipe,
    TitleCasePipe,
    CurrencyPipe,
    DatePipe,
    CardModule,
    DividerModule,
    ToolbarModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    PoItems,
  ],
  templateUrl: './po-detail.html',
  styleUrl: './po-detail.css',
})
export class PoDetail {
  private route = inject(ActivatedRoute);
  private poService = inject(PurchaseOrderService);
  private messageService = inject(MessageService);
  private location = inject(Location);
  private router = inject(Router);

  po = signal<IPurchaseOrder | null>(null);
  // inside the class
  psService = inject(PackingSlipSerive);
  saving = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchPurchaseOrder(+id);
    }
  }

  fetchPurchaseOrder(id: any): void {
    this.poService.getById(id).subscribe({
      next: (res) => {
        this.po.set(res.data);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load purchase order.',
        });
      },
    });
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'danger' {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'info';
    }
  }

  back() {
    this.location.back();
  }

  updatePoField(field: IEditablePoField, value: string): void {
    const po = this.po();
    if (!po) return;

    const trimmed = value.trim();
    if (trimmed === (po[field] ?? '')) {
      return; // unchanged, skip the request
    }

    const previous = po;

    // Optimistic update so the field reflects the edit immediately.
    this.po.set({ ...po, [field]: trimmed });

    this.poService.update(po.id, { [field]: trimmed }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Purchase order updated.',
        });
      },
      error: () => {
        this.po.set(previous); // revert on failure
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update purchase order.',
        });
      },
    });
  }

  private buildPayload() {
    const po = this.po();
    if (!po) return null;

    const type: PackingSlipType = 'purchase';

    return {
      type,
      purchase_order_id: po.id,
      store_id: po.store_id,
      vehicle_no: po.customer_requisitions,
      driver_name: po.customer_reference,
      details: po.po_detail
        .filter((d) => d.id > 0) // drop empty/unsaved placeholder rows
        .map((d) => ({
          po_detail_id: d.id,
          item_id: d.item_id,
          packed_qty: Number(d.quantity),
          ordered_qty: Number(d.quantity),
          reference_type:"purchase",
        })),
    };
  }

  saveAndReceive() {
    const payload = this.buildPayload();
    if (!payload) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cannot receive',
        detail: 'Purchase order data is not loaded yet.',
      });
      return;
    }

    this.saving.set(true);

    this.psService.create(payload).subscribe({
      next: (res) => {
        this.psService.dispatch(res.data.id).subscribe({
          next: (dispatchRes) => {
            this.saving.set(false);
            this.messageService.add({
              severity: 'success',
              summary: 'Received',
              detail: `${dispatchRes.data.ps_no} received, stock updated`,
            });
            this.fetchPurchaseOrder(payload.purchase_order_id); // refresh status
          },
          error: (err) => {
            this.saving.set(false);
            // Slip WAS created as draft, only the dispatch failed
            this.messageService.add({
              severity: 'warn',
              summary: 'Saved as draft, receiving failed',
              detail: err.error?.message ?? 'You can retry from the packing slip list.',
              life: 8000,
            });
          },
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Failed to create',
          detail: err.error?.message ?? err.error?.debug,
        });
      },
    });
  }

  getPackingSlips() {
    const po = this.po();
    if (!po) return;

    this.router.navigate(['/po-packing-slip', po.id]);
  }
}
