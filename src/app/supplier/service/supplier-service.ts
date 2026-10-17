import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ISupplier } from '../../interface/isupplier';

@Service()
export class SupplierService {
    private apiUrl = environment.apiUrl;
  private baseUrl = `${this.apiUrl}/suppliers`;
 
  private http = inject(HttpClient);
 
  // GET /suppliers (paginated)
  getSuppliers(
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
 
  // GET /suppliers/all (unpaginated, for dropdowns)
  getAll(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/all`);
  }
 
  // GET /suppliers/{id}
  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }
 
  // POST /suppliers
  create(supplier: Partial<ISupplier>): Observable<any> {
    return this.http.post<any>(this.baseUrl, supplier);
  }
 
  // POST /suppliers/{id} (backend uses POST for update)
  update(id: number, supplier: Partial<ISupplier>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${id}`, supplier);
  }
 
  // DELETE /suppliers/{id}
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
 
  // DELETE /suppliers/bulk-delete
  bulkDelete(ids: number[]) {
    return this.http.delete<any>(`${this.baseUrl}/bulk-delete`, {
      body: { ids },
    });
  }
}
