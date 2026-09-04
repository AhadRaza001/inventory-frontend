import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Iunit } from '../../interface/iunit';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Service()
export class UnitService {
  private apiUrl = environment.apiUrl;
  private baseUrl = `${this.apiUrl}/units`;

  private http = inject(HttpClient);
  // GET /unit

  getUnit(
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

  // GET /unit/{id}
  getById(id: any): Observable<Iunit> {
    return this.http.get<Iunit>(`${this.baseUrl}/${id}`);
  }

  // POST /unit
  create(unit: Partial<Iunit>): Observable<Iunit> {
    return this.http.post<Iunit>(this.baseUrl, unit);
  }

  // POST /unit/{id}  (your backend uses POST for update, not PUT)
  update(id: number, unit: Partial<Iunit>): Observable<Iunit> {
    return this.http.post<Iunit>(`${this.baseUrl}/${id}`, unit);
  }

  // DELETE /unit/{id}
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getAll(): Observable<any> {
    return this.http.get(this.baseUrl);
  }
  bulkDelete(ids: number[]) {
    return this.http.delete(`${this.baseUrl}/bulk-delete`, {
      body: { ids },
    });
  }
}
