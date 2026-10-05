import { Component, computed, inject, signal } from '@angular/core';
import { SaleOrderService } from '../../service/sale-order-service';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastService } from '../../../toast/toast-service';
import { CurrencyPipe, DatePipe, Location, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { IsaleOrder } from '../../../interface/isale-order';
import { Card, CardModule } from 'primeng/card';
import { ISaleOrder, ISoDetail } from '../../../interface/iso-detail';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { DatePicker } from 'primeng/datepicker';
import { SoItemsComponent } from '../so-items-component/so-items-component';
import { PackingSlipSerive } from '../../service/packing-slip-serive';
import { TableToolbar } from '../../../shared/table-toolbar/table-toolbar';
type IEditableSaleOrderField = 'customer_reference' | 'customer_requisitions' | 'paid_amount';

@Component({
  selector: 'app-so-detail-component',
  imports: [
    Card,
    CurrencyPipe,
    CardModule,
    DividerModule,
    ToolbarModule,
    ButtonModule,
    TableModule,
    TagModule,
    DatePipe,
    TitleCasePipe,
    SoItemsComponent,
    ToolbarModule
],
  templateUrl: './so-detail-component.html',
  styleUrl: './so-detail-component.css',
})
export class SoDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private saleOrderService = inject(SaleOrderService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private psService = inject(PackingSlipSerive);
  private location = inject(Location);

  so = signal<ISaleOrder | null>(null);

  // Derived so the table always reflects the latest saleOrder signal
  soDetails = computed<ISoDetail[]>(() => this.so()?.so_detail ?? []);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchSaleOrder(+id);
    }
  }

  fetchSaleOrder(id: any): void {
    this.saleOrderService.getById(id).subscribe({
      next: (res) => {
        this.so.set(res.data);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load sale order.',
        });
      },
    });
  }

  getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'pending':
        return 'warn';
      case 'cancelled':
        return 'danger';
      default:
        return 'info';
    }
  }

  getAmountStatusSeverity(status: string): 'success' | 'warn' | 'danger' {
    switch (status) {
      case 'paid':
        return 'success';
      case 'partial':
        return 'warn';
      case 'unpaid':
        return 'danger';
      default:
        return 'warn';
    }
  }

  back() {
    this.location.back();
  }
  customer_reference: any;
  customer_requisitions: any;
  updateSaleOrderField(field: IEditableSaleOrderField, value: string): void {
    if (field == 'customer_reference') {
      this.customer_reference = value;
    }
    if (field == 'customer_requisitions') {
      this.customer_requisitions = value;
    }
    const so = this.so();
    if (!so) return;

    const trimmed = value.trim();
    if (trimmed === (so[field] ?? '')) {
      return; // unchanged — skip the request
    }

    const previous = so;

    // Optimistic local update so the field reflects the edit immediately.
    this.so.set({ ...so, [field]: trimmed });

    this.saleOrderService.update(so.id, { [field]: trimmed }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Sale order updated.',
        });
      },
      error: () => {
        this.so.set(previous); // revert on failure
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update sale order.',
        });
      },
    });
  }

  private buildPayload() {
    const so = this.so();
    if (!so) return null;

    return {
      sale_order_id: so.id,
      store_id: so.store_id,
      vehicle_no: this.customer_requisitions,
      driver_name: this.customer_reference,
      details: so.so_detail
        .filter((d) => d.id > 0) // drop empty/unsaved placeholder rows if any
        .map((d) => ({
          so_detail_id: d.id,
          item_id: d.item_id,
          sku: d.item?.sku,
          packed_qty: Number(d.quantity),
          ordered_qty: Number(d.quantity),
          // rate: d.rate,
          // only what the backend's Validator actually asks for
        })),
    };
  }

  saveAndDispatch() {
    const payload = this.buildPayload();
    if (!payload) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cannot dispatch',
        detail: 'Sale order data is not loaded yet.',
      });
      return;
    }
    this.psService.create(payload).subscribe({
      next: (res) => {
        const psId = res.data.id;
        this.psService.dispatch(psId).subscribe({
          next: (dispatchRes) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Dispatched',
              detail: `${dispatchRes.data.ps_no} dispatched successfully`,
            });
            // emit refresh to parent SO page
          },
          error: (err) => {
            // Slip WAS created as draft — dispatch just failed. Tell the user clearly.
            this.messageService.add({
              severity: 'warn',
              summary: 'Saved as draft, dispatch failed',
              detail: err.error?.message ?? 'You can retry dispatch from the packing slip list.',
              life: 8000,
            });
          },
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Failed to create',
          detail: err.error?.debug,
        });
      },
    });
  }

  getpackingslip() {
  const so = this.so();
  if (!so) return;

  this.psService.getBySaleOrder(so.id).subscribe({
    next: (res) => {
      console.log('this is packing slip of sale order: ', res);
      
    },
    error: (err) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Failed to load packing slips',
        detail: err.error?.message,
      });
    },
  });
}

}
