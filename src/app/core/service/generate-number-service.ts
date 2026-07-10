import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, tap } from 'rxjs';

@Service()
export class GenerateNumberService {
  private baseUrl = 'http://localhost:8000/api/generate';

  http = inject(HttpClient);

  public Item() {
    return this.http.get(`${this.baseUrl}/item`).pipe(map((res:any)=>{
       return res.data;
    }));
  }     

  public saleOrder() {
  return  this.http.get(`${this.baseUrl}/saleOrder`).pipe(
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
