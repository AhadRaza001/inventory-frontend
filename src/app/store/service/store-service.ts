import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { IStore } from '../../interface/iso-detail';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Service()
export class StoreService {
  private apiUrl = environment.apiUrl;
  private baseUrl = `${this.apiUrl}/stores`;
  private http = inject(HttpClient);

  // GET /stores
  getStore(
    page: number,
    perPage: number,
    search: string,
    sortField: string,
    sortOrder: string,
    filters: any[],
  ): Observable<IStore> {
    const params = new HttpParams()
      .set('page', page)
      .set('per_page', perPage)
      .set('search', search)
      .set('sortField', sortField)
      .set('sortOrder', sortOrder)
      .set('filters', JSON.stringify(filters));

    return this.http.get<IStore>(this.baseUrl, { params });
  }

  // GET /stores
  getAll(): Observable<any> {
    return this.http.get<any>(this.baseUrl);
  }

  // GET /stores/{id}
  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  // POST /stores
  create(store: Partial<any>): Observable<any> {
    return this.http.post<any>(this.baseUrl, store);
  }

  // PUT /stores/{id}
  update(id: number, store: Partial<IStore>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, store);
  }

  // DELETE /stores/{id}
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // DELETE /stores/bulk-delete
  bulkDelete(ids: number[]) {
    return this.http.delete(`${this.baseUrl}/bulk-delete`, {
      body: { ids },
    });
  }
}
