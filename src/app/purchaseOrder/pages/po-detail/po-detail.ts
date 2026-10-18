import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
    PoItems
],
  templateUrl: './po-detail.html',
  styleUrl: './po-detail.css',
})
export class PoDetail {
  private route = inject(ActivatedRoute);
  private poService = inject(PurchaseOrderService);
  private messageService = inject(MessageService);
  private location = inject(Location);

  po = signal<IPurchaseOrder | null>(null);

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
}
