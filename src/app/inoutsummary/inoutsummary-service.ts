import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

 export interface IInOutSummaryRow {
  item: { id: number; name: string; sku?: string; [key: string]: any };
  opening_balance: number | string;
  total_in: number | string;
  total_out: number | string;
  closing_balance: number | string;
}

export interface IInOutSummaryParams {
  store_id: number;
  item_from: number;
  item_to: number;
  date_from: string;
  date_to: string;
}
@Service()
export class InoutsummaryService {
  private http = inject(HttpClient);

  // Adjust the URL to match your Laravel route for inOutSummary
  private url = `${environment.apiUrl}/itemledgers/summary`;

  getSummary(filter: IInOutSummaryParams): Observable<{ data: IInOutSummaryRow[] }> {
    const body: Record<string, number | string> = {
      item_from: filter.item_from,
      item_to: filter.item_to,
      store_id: filter.store_id,
    };

    if (filter.date_from) {
      body['date_from'] = filter.date_from;
    }
    if (filter.date_to) {
      body['date_to'] = filter.date_to;
    }

    return this.http.post<{ data: IInOutSummaryRow[] }>(this.url, body);
  }
}
