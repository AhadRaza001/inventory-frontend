import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { IsaleOrder } from '../../interface/isale-order';
import { ISaleOrder } from '../../interface/iso-detail';

@Service()
export class SaleOrderService {
  private baseUrl = 'http://localhost:8000/api/saleorders';

  private http = inject(HttpClient);
  // GET /SO

  getSaleOrder(
    page: number,
    perPage: number,
    search: string,
    sortField: string,
    sortOrder: string,
    filters: any[],
  ) {
    let params = new HttpParams()
      .set('page', page)
      .set('per_page', perPage)
      .set('search', search)
      .set('sortField', sortField)
      .set('sortOrder', sortOrder)
      .set('filters', JSON.stringify(filters));

    return this.http.get<any>(this.baseUrl, { params });
  }

  // GET /SO/{id}
  getById(id: number): Observable<any> {
    return this.http.get<IsaleOrder>(`${this.baseUrl}/${id}`);
  }

  // POST /SO
  create(saleorder: Partial<IsaleOrder>): Observable<IsaleOrder> {
    return this.http.post<IsaleOrder>(this.baseUrl, saleorder);
  }

  // POST /SO/{id}  (your backend uses POST for update, not PUT)
  update(id: number, so: Partial<IsaleOrder>): Observable<IsaleOrder> {
    return this.http.put<IsaleOrder>(`${this.baseUrl}/${id}`, so);
  }

  // DELETE /SO/{id}
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getAll(): Observable<any> {
    return this.http.get(this.baseUrl);
  }
}
