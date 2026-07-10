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

export const routes: Routes = [
  { path: '', redirectTo: 'categories', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  //categories
  { path: 'categories', component: Categories, canActivate: [authGuard] },
  { path: 'category/createCategory', component: AddCategory, canActivate: [authGuard] },
  { path: 'category/detail/:id', component: CategoryDetailComponent, canActivate: [authGuard] },
  // unit
  { path: 'units', component: UnitController, canActivate: [authGuard] },
  { path: 'unit/detail/:id', component: UnitDetailController, canActivate: [authGuard] },
  { path: 'unit/createUnit', component: UnitAddController, canActivate: [authGuard] },
  //Item
  { path: 'items', component: ItemComponent, canActivate: [authGuard] },
  { path: 'item/detail/:id', component: ItemDetailComponent, canActivate: [authGuard] },
  { path: 'item/createItem', component: ItemAddComponent, canActivate: [authGuard] },

  //saleorders
  { path: 'saleOrders', component: SaleOrderComponent, canActivate: [authGuard] },
  { path: 'saleOrder/detail/:id', component: SoDetailComponent, canActivate: [authGuard] },
  { path: 'saleOrders/createOrder', component: SoAddComponent, canActivate: [authGuard] },

  { path: '**', redirectTo: 'login' },
];
