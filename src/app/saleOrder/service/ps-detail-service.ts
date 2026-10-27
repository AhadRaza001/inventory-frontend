import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Service()
export class PsDetailService {
  private apiUrl = environment.apiUrl;
  private baseUrl = `${this.apiUrl}/packing-slips-detail`;
  private http = inject(HttpClient);

  getbyid(id: any) {
   return this.http.get(`${this.baseUrl}/${id}`);
  }
}
