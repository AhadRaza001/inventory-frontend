export interface IsaleOrder {
  id: number;

  customer_id: number;
  store_id: number;
  user_id: number;

  so_no: string;

  status: 'open' | 'partially_delivered' | 'delivered' | 'cancelled' | 'invoiced';

  amount_status: 'paid' | 'unpaid' | 'partial';

  sub_total: number;
  discount_amount: number;
  tax_amount: number;
  grand_total: number;
  paid_amount: number;
  due_amount: number;

  customer_requisitions: string | null;
  customer_reference: string | null;

  created_at: string;
  updated_at: string;
}
