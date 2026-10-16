export interface ISupplier {
  id: number;
  company_id: number | null;
  sku: string;
  name: string;
  phone: string;
  city: string;
  address: string;
  email: string;
  credit_limit: number;
  created_at?: string;
  updated_at?: string;
}
