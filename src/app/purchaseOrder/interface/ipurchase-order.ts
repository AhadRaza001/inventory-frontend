import { IStore } from "../../interface/iso-detail";
import { ISupplier } from "../../interface/isupplier";

export type PurchaseOrderStatus = 'open' | 'delivered' | 'cancelled';
 
export interface IPurchaseOrder {
  id: number;
  company_id: number | null;
  store_id: IStore;
  supplier: ISupplier;
  user_id: number;
  po_no: string;
  status: PurchaseOrderStatus;
  sub_total: number;
  discount_amount: number;
  tax_amount: number;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  customer_requisitions?: string | null;
  customer_reference?: string | null;
  created_at?: string;
  updated_at?: string;
}