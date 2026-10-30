import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Service()
export class ItemledgerService {
  http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private baseUrl = `${this.apiUrl}/itemledgers`;

  // Route is POST /itemledgers/by-item, so the filters go in the body
  getLedger(filter: IItemLedgerFilter): Observable<{ data: IItemLedgerResponse }> {
    const body: Record<string, number | string> = {
      item_id: filter.item_id,
      store_id: filter.store_id,
    };

    if (filter.date_from) {
      body['date_from'] = filter.date_from;
    }
    if (filter.date_to) {
      body['date_to'] = filter.date_to;
    }

    return this.http.post<{ data: IItemLedgerResponse }>(`${this.baseUrl}/by-item`, body);
  }
}

export interface IItemLedgerEntry {
  id: number;
  transaction_date: string;
  transaction_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
  quantity: string; // decimals come back as strings
  created_by?: { id: number; name: string } | null;
  order_no: string | null;
}

export interface IItemLedgerResponse {
  item: { id: number; name: string };
  store: { id: number; name: string };
  date_from: string;
  date_to: string;
  total_in: string | number;
  total_out: string | number;
  opening_balance: string | number;
  closing_balance: string | number;
  ledgers: IItemLedgerEntry[];
}

export interface IItemLedgerFilter {
  item_id: number;
  store_id: number;
  date_from: string | null; // YYYY-MM-DD
  date_to: string | null; // YYYY-MM-DD
}
