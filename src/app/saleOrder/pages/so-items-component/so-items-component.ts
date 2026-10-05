import {
  Component,
  computed,
  EventEmitter,
  inject,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
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
import { forkJoin, Subscription } from 'rxjs';
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
  ],
  templateUrl: './so-items-component.html',
  styleUrl: './so-items-component.css',
})
export class SoItemsComponent implements OnChanges, OnDestroy{
 @Input() so: ISaleOrder | null = null;
  @Output() refresh = new EventEmitter<number>();
 
  rows = signal<any[]>([]);
 
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private itemService = inject(ItemService);
  private soDetailService = inject(SoDetailService);
 
  private loadSub?: Subscription;
 
  delivered_now!: number;
 
  // Runs on first bind AND every time the parent passes a new `so`
  // (e.g. after a refresh emits and the parent refetches the sale order).
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['so']) {
      this.syncRows();
    }
  }
 
  ngOnDestroy(): void {
    this.loadSub?.unsubscribe();
  }
 
  // Re-emit the signal after mutating a row object in place.
  private touch(): void {
    this.rows.update((rows) => [...rows]);
  }
 
  private toRow(data: any): any {
    return { ...data, savedQuantity: data.quantity, saving: false, resolving: false };
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
      saving: false,
      resolving: false,
    };
 
    this.rows.update((rows) => [draftRow, ...rows]);
  }
 
  // Called when the user presses Enter / clicks out of the SKU field on a draft row.
  onItemIdResolve(row: any, sku: string): void {
    const code = sku?.trim();
    // Guards: empty SKU, already resolved, or a lookup already running
    // (Enter + blur can both fire).
    if (!code || row.item || row.resolving) return;
 
    row.resolving = true;
    this.touch();
 
    this.itemService.getBySKU(code).subscribe({
      next: (res: any) => {
        row.item_id = res.data.id;
        row.item = {
          id: res.data.id,
          name: res.data.name,
          sku: res.data.sku,
          sale_price: res.data.sale_price,
        };
        row.resolving = false;
        this.touch();
 
        // FIX 1: save the line right away with the default quantity (1).
        // Before, saving only happened on quantity blur, and a quantity that
        // stays at 1 never triggers a change, so the line was never saved.
        this.saveRow(row);
      },
      error: () => {
        row.resolving = false;
        this.touch();
        this.messageService.add({
          severity: 'error',
          summary: 'Item Not Found',
          detail: `No item found with SKU ${code}.`,
        });
      },
    });
  }
 
  // Called on quantity blur. Only saves when something actually changed.
  onQuantityBlur(row: any): void {
    if (!row.item_id) return; // can't save a line with no item resolved yet
    if (!(+row.quantity >= 1)) return;
 
    const isNewRow = row.id < 0;
    if (!isNewRow && +row.quantity === +row.savedQuantity) return; // unchanged
 
    this.saveRow(row);
  }
 
  // Creates the line the first time, updates it on later edits.
  private saveRow(row: any): void {
    const so = this.so;
    if (!so || row.saving) return;
 
    row.saving = true;
    this.touch();
 
    const payload = {
      sale_order_id: so.id,
      item_id: row.item_id,
      quantity: +row.quantity,
    };
 
    const isNewRow = row.id < 0;
    const request$ = isNewRow
      ? this.soDetailService.create(so.id, payload)
      : this.soDetailService.update(row.id, payload);
 
    request$.subscribe({
      next: (res: any) => {
        row.saving = false;
        row.savedQuantity = row.quantity;
 
        if (isNewRow) {
          const newId = res?.data?.id;
          if (newId) {
            // Server returned the saved line: turn the draft into a real row
            // in place, so the table keeps showing it (no flicker).
            row.id = newId;
            row.isDraft = false;
          } else {
            // No id in the response: keep the draft visible until the
            // refreshed sale order arrives (syncRows swaps it out).
            row.saved = true;
          }
        }
 
        this.touch();
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Line item saved.',
        });
 
        // Parent refetches the sale order (for the totals) -> ngOnChanges -> syncRows.
        this.refresh.emit(so.id);
      },
      error: (err) => {
        row.saving = false;
        this.touch();
 
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
    // Draft row -> remove locally only, no server call needed.
    if (detail.isDraft || detail.id < 0) {
      this.onRemoveDraftRow(detail);
      return;
    }
 
    this.confirmationService.confirm({
      message: `Are you sure you want to remove '${detail.item?.name ?? 'this item'}' from the sale order?`,
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
 
  // FIX 2: merge instead of replace.
  // Before, ngOnChanges did rows.set(so.so_detail) (raw lines with no item
  // info, so SKU/name went blank) and only after forkJoin finished did the
  // real data come back. It also wiped any draft row and re-fetched every line.
  // Now: lines we already have stay on screen as they are, and only new or
  // changed lines are fetched and swapped in when they arrive.
  private syncRows(): void {
    this.loadSub?.unsubscribe(); // a newer refresh makes any older response stale
 
    const details: any[] = this.so?.so_detail ?? [];
    const current = this.rows();
 
    const known = new Map<number, any>(current.filter((r) => r.id > 0).map((r) => [r.id, r]));
    const drafts = current.filter((r) => r.id < 0);
    const usedDrafts = new Set<any>();
    const toFetch: number[] = [];
 
    const serverRows = details.map((d) => {
      const cached = known.get(d.id);
 
      if (cached) {
        // Already on screen. Only refetch if the server's quantity differs.
        if (d.quantity != null && +d.quantity !== +cached.quantity) toFetch.push(d.id);
        return cached;
      }
 
      // New line. If it is the one we just saved (same item), reuse the draft's
      // data as a placeholder so there is no blank gap while it loads.
      const draft = drafts.find((x) => x.saved && x.item_id === d.item_id && !usedDrafts.has(x));
      toFetch.push(d.id);
      if (draft) {
        usedDrafts.add(draft);
        return { ...draft, id: d.id, isDraft: false, saved: false, saving: false };
      }
      return this.toRow(d);
    });
 
    // Keep drafts the user is still working on; drop the ones just swapped in.
    const keepDrafts = drafts.filter((x) => !usedDrafts.has(x) && !x.saved);
    this.rows.set([...keepDrafts, ...serverRows]);
 
    if (toFetch.length === 0) return;
 
    this.loadSub = forkJoin(toFetch.map((id) => this.soDetailService.getbyid(id))).subscribe({
      next: (results: any[]) => {
        const fresh = new Map<number, any>(results.map((res) => [res.data.id, this.toRow(res.data)]));
        this.rows.update((rows) => rows.map((r) => fresh.get(r.id) ?? r));
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load item details.',
        });
      },
    });
  }
}
