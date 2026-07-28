export interface ICustomer {
  id: number;
  customer_no: string;
  name: string;
  phone: string;
  email: string;
  address:string;
}

export interface IStore {
  id: number;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
}

export interface ISaleOrderUser {
  id: number;
  name: string;
  email: string;
}

// If your item's decimal fields are serialized as strings by Laravel,
// keep this consistent with your existing Iitem / Inewitem pattern.
export interface ISoDetail {
  id: number;
  so_id: number;
  item_id: number;
  item?: {
    id: number;
    name: string;
    sku?: string;
  };
  quantity: string;
  rate: string;
  discount?: string;
  amount: string;
}

export interface ISaleOrder {
  id: number;
  so_no: string;
  customer_id: number;
  customer: ICustomer;
  store_id: number;
  store: IStore;
  user_id: number;
  user: ISaleOrderUser;
  customer_reference: string | null;
  customer_requisitions: string | null;
  status: string;
  amount_status: string;
  sub_total: string;
  discount_amount: string;
  tax_amount: string;
  grand_total: string;
  paid_amount: string;
  due_amount: string;
  so_detail: ISoDetail[];
  created_at: string | null;
  updated_at: string;
}