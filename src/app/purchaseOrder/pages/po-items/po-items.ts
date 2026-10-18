import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputNumber } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmationService, MessageService } from 'primeng/api';
import { forkJoin, Subscription } from 'rxjs';
import { ItemService } from '../../../item/service/item-service';
import { IPurchaseOrder } from '../../interface/ipurchase-order';
import { PoDetailService } from '../../service/po-detail-service';

@Component({
  selector: 'app-po-items',
  imports: [CurrencyPipe, ButtonModule, TableModule, InputNumber, InputTextModule, FormsModule],
  templateUrl: './po-items.html',
  styleUrl: './po-items.css',
})
export class PoItems implements OnChanges, OnDestroy {
  @Input() po:  IPurchaseOrder | null = null;
  @Output() refresh = new EventEmitter<number>();
 
  rows = signal<any[]>([]);
 
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private itemService = inject(ItemService);
  private poDetailService = inject(PoDetailService);
 
  private loadSub?: Subscription;
 
  // Runs on first bind AND every time the parent passes a new `po`
  // (e.g. after a refresh emits and the parent refetches the purchase order).
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['po']) {
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
    return {
      ...data,
      savedQuantity: data.quantity,
      savedUnitCost: data.unit_cost,
      saving: false,
      resolving: false,
    };
  }
 
  onAddItem(): void {
    const po = this.po;
    if (!po) return;
 
    const draftRow: any = {
      id: -Date.now(), // temp negative id marks this row as unsaved
      purchase_order_id: po.id,
      sku: '',
      item_id: 0,
      item: undefined,
      quantity: '1',
      delivered_qty: '0',
      unit_cost: '0',
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
          cost_price: res.data.cost_price,
        };
        // Default the unit cost from the item; the user can edit it afterwards.
        row.unit_cost = res.data.cost_price ?? '0';
        row.resolving = false;
        this.touch();
 
        // Save right away with the default quantity (1).
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
 
  // Called on quantity or unit cost blur. Only saves when something actually changed.
  onFieldBlur(row: any): void {
    if (!row.item_id) return; // can't save a line with no item resolved yet
    if (!(+row.quantity >= 1)) return;
    if (!(+row.unit_cost >= 0)) return;
 
    const isNewRow = row.id < 0;
    const unchanged =
      +row.quantity === +row.savedQuantity && +row.unit_cost === +(row.savedUnitCost ?? 0);
    if (!isNewRow && unchanged) return;
 
    this.saveRow(row);
  }
 
  // Creates the line the first time, updates it on later edits.
  private saveRow(row: any): void {
    const po = this.po;
    if (!po || row.saving) return;
 
    row.saving = true;
    this.touch();
 
    const payload = {
      purchase_order_id: po.id,
      item_id: row.item_id,
      quantity: +row.quantity,
      unit_cost: +row.unit_cost,
    };
 
    const isNewRow = row.id < 0;
    const request$ = isNewRow
      ? this.poDetailService.create(payload)
      : this.poDetailService.update(row.id, payload);
 
    request$.subscribe({
      next: (res: any) => {
        row.saving = false;
        row.savedQuantity = row.quantity;
        row.savedUnitCost = row.unit_cost;
 
        if (isNewRow) {
          const newId = res?.data?.id;
          if (newId) {
            // Turn the draft into a real row in place, so the table keeps showing it.
            row.id = newId;
            row.isDraft = false;
          } else {
            // No id in the response: keep the draft visible until the
            // refreshed purchase order arrives (syncRows swaps it out).
            row.saved = true;
          }
        }
 
        this.touch();
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Line item saved.',
        });
 
        // Parent refetches the purchase order (for the totals) -> ngOnChanges -> syncRows.
        this.refresh.emit(po.id);
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
      message: `Are you sure you want to remove '${detail.item?.name ?? 'this item'}' from the purchase order?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.poDetailService.delete(detail.id).subscribe({
          next: () => {
            // Optimistic local removal, in addition to the parent refetch that follows.
            this.rows.update((rows) => rows.filter((r) => r.id !== detail.id));
            this.refresh.emit(this.po?.id);
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
 
  // Merge instead of replace: lines already on screen stay as they are,
  // and only new or changed lines are fetched and swapped in when they arrive.
  private syncRows(): void {
    this.loadSub?.unsubscribe(); // a newer refresh makes any older response stale
 
    const details: any[] = this.po?.po_detail ?? [];
    const current = this.rows();
 
    const known = new Map<number, any>(current.filter((r) => r.id > 0).map((r) => [r.id, r]));
    const drafts = current.filter((r) => r.id < 0);
    const usedDrafts = new Set<any>();
    const toFetch: number[] = [];
 
    const serverRows = details.map((d) => {
      const cached = known.get(d.id);
 
      if (cached) {
        // Already on screen. Only refetch if the server's values differ.
        const qtyChanged = d.quantity != null && +d.quantity !== +cached.quantity;
        const costChanged = d.unit_cost != null && +d.unit_cost !== +cached.unit_cost;
        if (qtyChanged || costChanged) toFetch.push(d.id);
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
 
    this.loadSub = forkJoin(toFetch.map((id) => this.poDetailService.getbyid(id))).subscribe({
      next: (results: any[]) => {
        const fresh = new Map<number, any>(
          results.map((res) => [res.data.id, this.toRow(res.data)]),
        );
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
