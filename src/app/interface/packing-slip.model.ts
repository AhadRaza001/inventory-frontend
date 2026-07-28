export interface IPsDetail {
  id?: number;
  so_detail_id: number;
  item_id: number;
  item_name?: string;
  ordered_qty: number;
  packed_qty: number;
}

export interface IPackingSlip {
  id: number;
  ps_no: string;
  sale_order_id: number;
  store_id: number;
  status: 'draft' | 'dispatched' | 'cancelled';
  vehicle_no: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  remarks: string | null;
  dispatch_date: string | null;
  created_at: string;
  updated_at: string;
  packing_slip_details?: IPsDetail[];
  sale_order?: { id: number; so_no: string };
  store?: { id: number; name: string };
}

export interface IPackingSlipCreatePayload {
  sale_order_id: number;
  store_id: number;
  vehicle_no?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  remarks?: string | null;
  details: {
    so_detail_id: number;
    item_id: number;
    ordered_qty: number;
    packed_qty: number;
  }[];
}

export interface IApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
