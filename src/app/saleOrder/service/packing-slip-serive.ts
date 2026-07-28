import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiResponse, IPackingSlip, IPackingSlipCreatePayload } from '../../interface/packing-slip.model';

@Service()
export class PackingSlipSerive {
  private baseUrl = 'http://localhost:8000/api/packingslips';
  private http = inject(HttpClient);

  getAll(params?: {
    page?: number;
    per_page?: number;
    sale_order_id?: number;
    status?: string;
    sort_field?: string;
    sort_order?: string;
  }): Observable<IApiResponse<{ data: IPackingSlip[]; total: number }>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get<IApiResponse<{ data: IPackingSlip[]; total: number }>>(
      this.baseUrl,
      { params: httpParams }
    );
  }

  /** GET /packing-slips/{id} */
  getById(id: number): Observable<IApiResponse<IPackingSlip>> {
    return this.http.get<IApiResponse<IPackingSlip>>(`${this.baseUrl}/${id}`);
  }

  /** GET /packing-slips?sale_order_id={id} — convenience wrapper */
  getBySaleOrder(saleOrderId: number): Observable<IApiResponse<IPackingSlip[]>> {
    return this.http.get<IApiResponse<IPackingSlip[]>>(
      `${this.baseUrl}/getBySaleOrder`,
      { params: new HttpParams().set('sale_order_id', saleOrderId.toString()) }
    );
  }

  /** POST /packing-slips */
  create(payload: IPackingSlipCreatePayload): Observable<any> {
    return this.http.post<any>(this.baseUrl, payload);
  }

  /** POST /packing-slips/{id}/dispatch */
  dispatch(id: number): Observable<IApiResponse<IPackingSlip>> {
    return this.http.post<IApiResponse<IPackingSlip>>(`${this.baseUrl}/${id}/dispatch`, {});
  }

  /** POST /packing-slips/{id}/cancel */
  cancel(id: number): Observable<IApiResponse<IPackingSlip>> {
    return this.http.post<IApiResponse<IPackingSlip>>(`${this.baseUrl}/${id}/cancel`, {});
  }
}
