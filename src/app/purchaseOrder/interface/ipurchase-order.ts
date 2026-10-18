import { IStore } from "../../interface/iso-detail";

export interface IPoDetail {
  id: number;
  purchase_order_id: number;
  item_id: number;
  quantity: string;
  delivered_qty: string;
  unit_cost: string | null;
  discount_amount: string | null;
  tax_amount: string | null;
  status: 'open' | 'delivered';
  item?: { id: number; name: string; sku: string; cost_price?: string };
}

export interface IPurchaseOrder {
  id: number;
  po_no: string;
  store_id: IStore;
  supplier_id: number;
  status: 'open' | 'delivered' | 'cancelled';
  sub_total: string;
  discount_amount: string;
  tax_amount: string;
  grand_total: string;
  paid_amount: string;
  due_amount: string;
  customer_reference: string | null;
  customer_requisitions: string | null;
  updated_at: string;
  created_at: string;
  supplier?: { id: number; name: string; sku: string; phone: string; address: string };
  store?: { id: number; name: string };
  user?: { id: number; name: string };
  po_detail: IPoDetail[];
}