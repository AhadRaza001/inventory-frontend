import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Service()
export class PoDetailService {
  private apiUrl = environment.apiUrl;
  private baseUrl = `${this.apiUrl}/podetails`;
  private http = inject(HttpClient);

  create(payload: any) {
    return this.http.post<any>(this.baseUrl, payload);
  }

  update(id: any, payload: any) {
    return this.http.post<any>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: any) {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

  getbyid(id: any) {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  singlePoDetail(id: any) {
    return this.http.get<any>(`${this.baseUrl}/single/${id}`);
  }
}
