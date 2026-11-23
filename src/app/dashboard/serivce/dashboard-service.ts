import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface IProfitSummary {
  revenue: number;
  cost: number;
  profit: number;
  margin_percent: number;
}

export interface ITopProfitItem {
  item_id: number;
  name: string;
  qty_sold: number;
  profit: number;
}
export interface IDashboardCounts {
  items: number;
  customers: number;
  suppliers: number;
  categories: number;
  profit_this_month: IProfitSummary;   // new
  top_profit_items: ITopProfitItem[];
}

export interface IMonthlyTotal {
  month: string;
  sales: number;
  purchases: number;
   profit: number; 
}

export interface ILowStockItem {
  id: number;
  name: string;
  stock_qty: number;
  reorder_level: number;
}

export interface IRecentOrder {
  id: number;
  order_no: string;
  party_name: string;
  order_date: string;
  total_amount: number;
  status: string;
}

export interface IDashboardData {
  profit_this_month: any;
  counts: IDashboardCounts;
  sales_this_month: number;
  purchases_this_month: number;
  pending_sale_orders: number;
  pending_purchase_orders: number;
  monthly_totals: IMonthlyTotal[];
  low_stock_items: ILowStockItem[];
  recent_sale_orders: IRecentOrder[];
  recent_purchase_orders: IRecentOrder[];
}
@Service()
export class DashboardService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/dashboard`;

  getDashboard(): Observable<{ data: IDashboardData }> {
    return this.http.get<{ data: IDashboardData }>(this.url);
  }
}
