import { Categories } from '../category/pages/categories/categories';
import { UnitController } from '../unit/pages/unit-controller/unit-controller';

export interface Iitem {
  id: number;
  category_id: number;
  unit_id: number;
  sku: string | number;
  name: string | number;
  description?: string | null;
  purchase_price: string;
  sale_price: string;
  status: 'active' | 'inactive';
  barcode?: string | null;
  reorder_level: number;
  created_at: string;
  updated_at: string;

  category?: Categories;
  unit?: UnitController;
}
