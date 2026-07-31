import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  HostListener,
  ElementRef,
  inject,
  ChangeDetectorRef,
  signal,
  Signal,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { Drawer, DrawerModule } from 'primeng/drawer';
import { StyleClassModule } from 'primeng/styleclass';
import { SidebarService } from '../sidebarService';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  imports: [AvatarModule, ButtonModule, RippleModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  collapsed = signal(false);
  sidebarservice = inject(SidebarService);

  menus = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      route: '/dashboard',
    },
    {
      label: 'Category',
      icon: 'pi pi-folder',
      route: '/categories',
    },
    {
      label: 'Units',
      icon: 'pi pi-calculator',
      route: '/units',
    },
    {
      label: 'Sale Orders',
      icon: 'pi pi-shopping-cart',
      route: '/saleOrders',
    },
    {
      label: 'Purchase Orders',
      icon: 'pi pi-shopping-bag',
      route: '/purchase-orders',
    },
    {
      label: 'Item',
      icon: 'pi pi-box',
      route: '/items'
    },
    {
      label: 'Reports',
      icon: 'pi pi-chart-bar',
      route: '/reports',
    },
  ];

  toggle() {
    this.collapsed.update((v) => !v);
    this.sidebarservice.toggle();
  }
}
