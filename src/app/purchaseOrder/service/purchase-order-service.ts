import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { IPurchaseOrder } from '../interface/ipurchase-order';
import { environment } from '../../../environments/environment';

@Service()
export class PurchaseOrderService {
      private apiUrl = environment.apiUrl;
  private baseUrl = `${this.apiUrl}/purchaseorders`;
 
  private http = inject(HttpClient);
 
  // GET /purchaseorders
  getPurchaseOrder(
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
 
  // GET /purchaseorders/{id}
  getById(id: number): Observable<any> {
    return this.http.get<IPurchaseOrder>(`${this.baseUrl}/${id}`);
  }
 
  // POST /purchaseorders
  create(purchaseOrder: Partial<IPurchaseOrder>): Observable<IPurchaseOrder> {
    return this.http.post<IPurchaseOrder>(this.baseUrl, purchaseOrder);
  }
 
  // POST /purchaseorders/{id}  (backend uses POST for update, not PUT)
  update(id: number, po: Partial<IPurchaseOrder>): Observable<IPurchaseOrder> {
    return this.http.post<IPurchaseOrder>(`${this.baseUrl}/${id}`, po);
  }
 
  // DELETE /purchaseorders/{id}
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
 
  getAll(): Observable<any> {
    return this.http.get(this.baseUrl);
  }
 
  // DELETE /purchaseorders/bulk-delete
  bulkDelete(ids: number[]) {
    return this.http.delete(`${this.baseUrl}/bulk-delete`, {
      body: { ids },
    });
  }
}
