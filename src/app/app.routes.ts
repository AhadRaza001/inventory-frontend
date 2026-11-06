import { Routes } from '@angular/router';
import { Categories } from './category/pages/categories/categories';
import { Breadcrumb } from './breadcrumb/breadcrumb/breadcrumb';
import { AddCategory } from './category/pages/add-category/add-category';
import { CategoryDetailComponent } from './category/pages/detail-categories/category-detail-component/category-detail-component';
import { LoginComponent } from './auth/pages/login-component/login-component';
import { authGuard } from './guards/auth-guard';
import { SignupComponent } from './auth/pages/signup-component/signup-component';
import { UnitController } from './unit/pages/unit-controller/unit-controller';
import { UnitDetailController } from './unit/pages/unit-detail-controller/unit-detail-controller';
import { UnitAddController } from './unit/pages/unit-add-controller/unit-add-controller';
import { ItemComponent } from './item/pages/itemComponent/item-component/item-component';
import { ItemDetailComponent } from './item/pages/itemComponent/item-detail-component/item-detail-component';
import { ItemAddComponent } from './item/pages/itemComponent/item-add-component/item-add-component';
import { SaleOrderComponent } from './saleOrder/pages/sale-order-component/sale-order-component';
import { SoDetailComponent } from './saleOrder/pages/so-detail-component/so-detail-component';
import { SoAddComponent } from './saleOrder/pages/so-add-component/so-add-component';
import { PurchaseOrder } from './purchaseOrder/pages/purchase-order/purchase-order';
import { Supplier } from './supplier/pages/supplier/supplier';
import { SupplierDetail } from './supplier/pages/supplier-detail/supplier-detail';
import { AddSupplier } from './supplier/pages/add-supplier/add-supplier';
import { PoDetail } from './purchaseOrder/pages/po-detail/po-detail';
import { AddPurchaseOrder } from './purchaseOrder/pages/add-purchase-order/add-purchase-order';
import { PackingSlipComponent } from './pdf/packing-slip-component/packing-slip-component';
import { PoPackingSlipComponent } from './pdf/po-packing-slip-component/po-packing-slip-component';
import { ItemledgerComponent } from './itemledger/itemledger-component/itemledger-component';
import { InoutsummaryComponent } from './inoutsummary/inoutsummary-component/inoutsummary-component';

export const routes: Routes = [
  // ==================================================
  // DEFAULT ROUTE
  // ==================================================

  {
    path: '',
    redirectTo: 'categories',
    pathMatch: 'full',
  },

  // ==================================================
  // AUTHENTICATION
  // ==================================================

  {
    path: 'login',
    component: LoginComponent,
  },

  {
    path: 'signup',
    component: SignupComponent,
    canActivate: [authGuard],
  },

  // ==================================================
  // CATEGORIES
  // ==================================================

  {
    path: 'categories',
    canActivate: [authGuard],
    data: { breadcrumb: 'Categories' },
    children: [
      {
        path: '',
        component: Categories,
      },

      {
        path: 'createCategory',
        component: AddCategory,
        data: { breadcrumb: 'Add Category' },
      },

      {
        path: 'detail/:id',
        component: CategoryDetailComponent,
        data: { breadcrumb: 'Category Details' },
      },
    ],
  },

  // ==================================================
  // UNITS
  // ==================================================

  {
    path: 'units',
    canActivate: [authGuard],
    data: { breadcrumb: 'Units' },
    children: [
      {
        path: '',
        component: UnitController,
      },

      {
        path: 'createUnit',
        component: UnitAddController,
        data: { breadcrumb: 'Add Unit' },
      },

      {
        path: 'detail/:id',
        component: UnitDetailController,
        data: { breadcrumb: 'Unit Details' },
      },
    ],
  },

  // ==================================================
  // ITEMS
  // ==================================================

  {
    path: 'items',
    canActivate: [authGuard],
    data: { breadcrumb: 'Items' },
    children: [
      {
        path: '',
        component: ItemComponent,
      },

      {
        path: 'createItem',
        component: ItemAddComponent,
        data: { breadcrumb: 'Add Item' },
      },

      {
        path: 'detail/:id',
        component: ItemDetailComponent,
        data: { breadcrumb: 'Item Details' },
      },
    ],
  },

  // ==================================================
  // SALE ORDERS
  // ==================================================

  {
    path: 'saleOrders',
    canActivate: [authGuard],
    data: { breadcrumb: 'Sale Orders' },
    children: [
      {
        path: '',
        component: SaleOrderComponent,
      },

      {
        path: 'createOrder',
        component: SoAddComponent,
        data: { breadcrumb: 'Create Sale Order' },
      },

      {
        path: 'detail/:id',
        component: SoDetailComponent,
        data: { breadcrumb: 'Sale Order Details' },
      },
    ],
  },

  // ==================================================
  // PURCHASE ORDERS
  // ==================================================

  {
    path: 'purchaseOrders',
    canActivate: [authGuard],
    data: { breadcrumb: 'Purchase Orders' },
    children: [
      {
        path: '',
        component: PurchaseOrder,
      },

      {
        path: 'createOrder',
        component: AddPurchaseOrder,
        data: { breadcrumb: 'Create Purchase Order' },
      },

      {
        path: 'detail/:id',
        component: PoDetail,
        data: { breadcrumb: 'Purchase Order Details' },
      },
    ],
  },

  // ==================================================
  // SUPPLIERS
  // ==================================================

  {
    path: 'suppliers',
    canActivate: [authGuard],
    data: { breadcrumb: 'Suppliers' },
    children: [
      {
        path: '',
        component: Supplier,
      },

      {
        path: 'create',
        component: AddSupplier,
        data: { breadcrumb: 'Add Supplier' },
      },

      {
        path: 'detail/:id',
        component: SupplierDetail,
        data: { breadcrumb: 'Supplier Details' },
      },
    ],
  },

  // ==================================================
  // PACKING SLIPS
  // ==================================================

  {
    path: 'packing-slip',
    canActivate: [authGuard],
    data: { breadcrumb: 'Sale Packing Slip' },
    children: [
      {
        path: ':id',
        component: PackingSlipComponent,
      },
    ],
  },

  {
    path: 'po-packing-slip',
    canActivate: [authGuard],
    data: { breadcrumb: 'Purchase Packing Slip' },
    children: [
      {
        path: ':id',
        component: PoPackingSlipComponent,
      },
    ],
  },

  // ==================================================
  // REPORTS
  // ==================================================

  {
    path: 'reports',
    canActivate: [authGuard],
    data: { breadcrumb: 'Reports' },
    children: [
      {
        path: 'itemledger',
        component: ItemledgerComponent,
        data: { breadcrumb: 'Item Ledger' },
      },

      {
        path: 'inoutsummary',
        component: InoutsummaryComponent,
        data: { breadcrumb: 'Stock In-Out Summary' },
      },
    ],
  },

  // ==================================================
  // WILDCARD
  // ==================================================

  {
    path: '**',
    redirectTo: 'login',
  },
];
