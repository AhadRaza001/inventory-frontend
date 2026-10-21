import { IStore } from "./iso-detail";

export type PackingSlipType = 'sale' | 'purchase';
export type PackingSlipStatus = 'draft' | 'dispatched' | 'cancelled';

export interface IPackingSlipDetail {
  id?: number;
  packing_slip_id?: number;
  so_detail_id?: number | null;
  po_detail_id?: number | null;
  item_id: number;
  ordered_qty: number;
  packed_qty: number;
  item?: any;
  so_detail?: any;
  po_detail?: any;
}

export interface IPackingSlip {
  id: number;
  type: PackingSlipType;
  ps_no: string;
  status: PackingSlipStatus;
  sale_order_id: number | null;
  purchase_order_id: number | null;
  store_id: number;
  user_id: number;
  vehicle_no?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  remarks?: string | null;
  dispatch_date?: string | null;
  sale_order?: any;
  purchase_order?: any;
  store?: any;
  user?: any;
  packing_slip_details?: IPackingSlipDetail[];
}

export interface IPackingSlipCreatePayload {
  type: PackingSlipType;
  sale_order_id?: number; // required when type = 'sale'
  purchase_order_id?: number; // required when type = 'purchase'
  store_id: IStore;
  vehicle_no?: string | null;
  driver_name?: string| null;
  driver_phone?: string| null;
  remarks?: string;
  details: {
    so_detail_id?: number; // sale
    po_detail_id?: number; // purchase
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
