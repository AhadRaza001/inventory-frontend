import {
  Component,
  computed,
  EventEmitter,
  inject,
  Inject,
  Input,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ISaleOrder, ISoDetail } from '../../../interface/iso-detail';
import { IsaleOrder } from '../../../interface/isale-order';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InputNumber } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { Message } from 'primeng/message';
import { ItemService } from '../../../item/service/item-service';
import { Toast } from 'primeng/toast';
import { SoDetailService } from '../../service/so-detail-service';
import { SaleOrderService } from '../../service/sale-order-service';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-so-items-component',
  standalone: true,
  imports: [
    CurrencyPipe,
    CardModule,
    DividerModule,
    ToolbarModule,
    ButtonModule,
    TableModule,
    TagModule,
    InputNumber,
    FormsModule,
    ConfirmDialog,
  ],
  templateUrl: './so-items-component.html',
  styleUrl: './so-items-component.css',
})
export class SoItemsComponent {
  @Input() so: ISaleOrder | null = null;
  @Output() refresh = new EventEmitter<number>();

  rows = signal<any[]>([]);

  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private itemService = inject(ItemService);
  private soDetailService = inject(SoDetailService);

  delivered_now!: number;
  // Runs on first bind AND every time the parent passes a new `so`
  // (e.g. after a refresh emits and the parent refetches the sale order).
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['so']) {
      this.rows.set(this.so?.so_detail ?? []);
      this.loadRows();
    }
  }

  onAddItem(): void {
    const so = this.so;
    if (!so) return;

    const draftRow: any = {
      id: -Date.now(), // temp negative id marks this row as unsaved
      so_id: so.id,
      name: '',
      sku: '',
      item_id: 0,
      item: undefined,
      quantity: '1',
      rate: '0',
      discount: '0',
      amount: '0',
      isDraft: true,
    };

    this.rows.update((rows) => [draftRow, ...rows]);
  }

  // Called when the user tabs/clicks out of the SKU field on a draft row.
  onItemIdResolve(row: any, sku: string): void {
    if (!sku) return;

    this.itemService.getBySKU(sku).subscribe({
      next: (res: any) => {
        row.item_id = res.data.id;
        row.item = {
          id: res.data.id,
          name: res.data.name,
          sku: res.data.sku,
          sale_price: res.data.sale_price,
        };
        this.rows.update((rows) => [...rows]); // re-emit signal so the table re-renders
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Item Not Found',
          detail: `No item found with SKU ${sku}.`,
        });
      },
    });
  }

  // Called on quantity blur. Creates the line on the server the first time,
  // updates it on subsequent edits.
  onQuantityBlur(row: any): void {
    if (!row.item_id) {
      return; // can't save a line with no item resolved yet
    }

    const so = this.so;
    if (!so) return;

    const quantity = +row.quantity;

    const payload = {
      sale_order_id: so.id,
      item_id: row.item_id,
      quantity,
    };

    const isNewRow = row.id < 0;
    const request$ = isNewRow
      ? this.soDetailService.create(so.id, payload)
      : this.soDetailService.update(row.id, payload);

    request$.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Line item saved.',
        });
        // Parent refetches the sale order -> `so` input changes ->
        // ngOnChanges resyncs `rows` with the server's saved state.
        this.refresh.emit(so.id);
      },
      error: (err) => {
        if (err.status === 422) {
          const messages = Object.values(err.error.errors).flat().join('\n');

          this.messageService.add({
            severity: 'error',
            summary: err.error.message,
            detail: messages,
          });

          return;
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Something went wrong.',
        });
      },
    });
  }

  // Removes a draft row locally without hitting the server (nothing was saved yet).
  onRemoveDraftRow(row: any): void {
    this.rows.update((rows) => rows.filter((r) => r !== row));
  }

  onDeleteItem(detail: any): void {
    // Draft row → remove locally only, no server call needed.
    if (detail.isDraft || detail.id < 0) {
      this.onRemoveDraftRow(detail);
      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to remove "${detail.item?.name ?? 'this item'}" from the sale order?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.soDetailService.delete(detail.id).subscribe({
          next: () => {
            // Optimistic local removal so the row disappears immediately,
            // in addition to the parent refetch that follows.
            this.rows.update((rows) => rows.filter((r) => r.id !== detail.id));
            this.refresh.emit(this.so?.id);
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err.error?.debug || err.error?.message || 'Failed to delete line item.',
            });
          },
        });
      },
    });
  }

  private loadRows(): void {
    const details = this.so?.so_detail ?? [];

    if (details.length === 0) {
      this.rows.set([]);
      return;
    }

    // this.rowsLoading.set(true);

    const requests = details.map((d) => this.soDetailService.getbyid(d.id));

    forkJoin(requests).subscribe({
      next: (results: any[]) => {
        this.rows.set(results.map((res) => res.data));
        // this.rowsLoading.set(false);
      },
      error: () => {
        // this.rowsLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load item details.',
        });
      },
    });
  }
}
