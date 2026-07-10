export interface Inewitem {
  category_id: number;
  unit_id: number;
  sku: string;
  name: string;
  description: string;
  purchase_price: number;
  sale_price: number;
  status: 'active' | 'inactive';
  barcode: string;
  reorder_level: number;
}
