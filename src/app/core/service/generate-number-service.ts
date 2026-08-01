import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Service()
export class GenerateNumberService {
  private apiUrl = environment.apiUrl;
  private baseUrl = `${this.apiUrl}/generate`;

  http = inject(HttpClient);

  public Item() {
    return this.http.get(`${this.baseUrl}/item`).pipe(
      map((res: any) => {
        return res.data;
      }),
    );
  }

  public saleOrder() {
    return this.http.get(`${this.baseUrl}/saleOrder`).pipe(
      tap((res: any) => {
        console.log(res);
      }),
    );
  }

  public purchaseOrder() {
    return this.http.get(`${this.baseUrl}/purchaseOrder`).pipe(
      tap((res: any) => {
        console.log(res);
      }),
    );
  }
}
