export interface Icustomer {
  id: number;
  company_id?: number | null;
  customer_no: string;
  name: string;
  phone: string;
  email?: string | null;
  city: string;
  address?: string | null;
  credit_limit: string; // decimal arrives as a string from Laravel
  status: 'active' | 'inactive' | 'blocked';
  created_at?: string;
  updated_at?: string;
}
