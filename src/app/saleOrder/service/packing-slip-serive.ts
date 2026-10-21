import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiResponse, IPackingSlip, IPackingSlipCreatePayload } from '../../interface/packing-slip.model';
import { environment } from '../../../environments/environment';

@Service()
export class PackingSlipSerive {
  private apiUrl = environment.apiUrl;
  private baseUrl = `${this.apiUrl}/packing-slips`;
  private http = inject(HttpClient);

  /** GET /packing-slips/sale-order/{id} (paginated) */
  getPaginatedBySaleOrder(
    saleOrderId: number,
    params?: { page?: number },
  ): Observable<IApiResponse<{ data: IPackingSlip[]; total: number }>> {
    return this.http.get<IApiResponse<{ data: IPackingSlip[]; total: number }>>(
      `${this.baseUrl}/sale-order/${saleOrderId}`,
      { params: this.buildParams(params) },
    );
  }

  /** GET /packing-slips/purchase-order/{id} (paginated) */
  getPaginatedByPurchaseOrder(
    purchaseOrderId: number,
    params?: { page?: number },
  ): Observable<IApiResponse<{ data: IPackingSlip[]; total: number }>> {
    return this.http.get<IApiResponse<{ data: IPackingSlip[]; total: number }>>(
      `${this.baseUrl}/purchase-order/${purchaseOrderId}`,
      { params: this.buildParams(params) },
    );
  }

  /** GET /packing-slips/{id} */
  getById(id: number): Observable<IApiResponse<IPackingSlip>> {
    return this.http.get<IApiResponse<IPackingSlip>>(`${this.baseUrl}/${id}`);
  }

  /** GET /packing-slips/by-sale-order?sale_order_id={id} (all slips with details) */
  getBySaleOrder(saleOrderId: number): Observable<IApiResponse<IPackingSlip[]>> {
    return this.http.get<IApiResponse<IPackingSlip[]>>(`${this.baseUrl}/by-sale-order`, {
      params: new HttpParams().set('sale_order_id', saleOrderId.toString()),
    });
  }

  /** GET /packing-slips/by-purchase-order?purchase_order_id={id} (all slips with details) */
  getByPurchaseOrder(purchaseOrderId: number): Observable<IApiResponse<IPackingSlip[]>> {
    return this.http.get<IApiResponse<IPackingSlip[]>>(`${this.baseUrl}/by-purchase-order`, {
      params: new HttpParams().set('purchase_order_id', purchaseOrderId.toString()),
    });
  }

  /** POST /packing-slips (type = 'sale' | 'purchase' decides the flow) */
  create(payload: IPackingSlipCreatePayload): Observable<IApiResponse<IPackingSlip>> {
    return this.http.post<IApiResponse<IPackingSlip>>(this.baseUrl, payload);
  }

  /** POST /packing-slips/{id}/dispatch (sale reduces stock, purchase adds stock) */
  dispatch(id: number): Observable<IApiResponse<IPackingSlip>> {
    return this.http.post<IApiResponse<IPackingSlip>>(`${this.baseUrl}/${id}/dispatch`, {});
  }

  private buildParams(params?: Record<string, string | number | undefined | null>): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return httpParams;
  }
}
