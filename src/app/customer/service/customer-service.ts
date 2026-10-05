import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { ICustomer } from '../../interface/iso-detail';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Service()
export class CustomerService {
  private apiUrl = environment.apiUrl;
  private baseUrl = `${this.apiUrl}/customers`;
  private http = inject(HttpClient);

  // GET /customers
  getCustomer(
    page: number,
    perPage: number,
    search: string,
    sortField: string,
    sortOrder: string,
    filters: any[],
  ): Observable<ICustomer> {
    let params = new HttpParams()
      .set('page', page)
      .set('per_page', perPage)
      .set('search', search)
      .set('sortField', sortField)
      .set('sortOrder', sortOrder)
      .set('filters', JSON.stringify(filters));

    return this.http.get<ICustomer>(this.baseUrl, { params });
  }

  // GET /customers
  getAll(): Observable<any> {
    return this.http.get<any>(this.baseUrl);
  }

  // GET /customers/single/{id}
  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  // POST /customers
  create(customer: Partial<any>): Observable<any> {
    return this.http.post<any>(this.baseUrl, customer);
  }

  // POST /customers/{id}
  update(id: number, customer: Partial<any>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${id}`, customer);
  }

  // DELETE /customers/{id}
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // DELETE /customers/bulk-delete
  bulkDelete(ids: number[]) {
    return this.http.delete(`${this.baseUrl}/bulk-delete`, {
      body: { ids },
    });
  }
}
