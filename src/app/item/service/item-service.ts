import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { Iitem } from '../../interface/iitem';
import { environment } from '../../../environments/environment';

@Service()
export class ItemService {
  private apiUrl = environment.apiUrl;
  private baseUrl = `${this.apiUrl}/items`;
  private http = inject(HttpClient);

  getItem(
    page: number,
    perPage: number,
    search: string,
    sortField: string,
    sortOrder: string,
    filters: any[],
  ): Observable<Iitem> {
    let params = new HttpParams()
      .set('page', page)
      .set('per_page', perPage)
      .set('search', search)
      .set('sortField', sortField)
      .set('sortOrder', sortOrder)
      .set('filters', JSON.stringify(filters));

    return this.http.get<Iitem>(this.baseUrl, { params });
  }

  // GET /item/{id}
  getById(id: any): Observable<Iitem> {
    return this.http.get<Iitem>(`${this.baseUrl}/${id}`);
  }

  getBySKU(sku: any) {
    return this.http.get<Iitem>(`${this.baseUrl}/sku/${sku}`);
  }

  // POST /item
  create(item: Partial<any>): Observable<any> {
    return this.http.post<Iitem>(this.baseUrl, item);
  }

  // POST /item/{id}  (your backend uses POST for update, not PUT)
  update(id: number, item: Partial<Iitem>): Observable<Iitem> {
    return this.http.post<Iitem>(`${this.baseUrl}/${id}`, item);
  }

  // DELETE /item/{id}
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
  
  bulkDelete(ids: number[]) {
    return this.http.delete(`${this.baseUrl}/bulk-delete`, {
      body: { ids },
    });
  }
}
