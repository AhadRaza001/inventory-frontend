import { Component, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { SidebarService } from '../sidebarService';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

interface SubMenu {
  label: string;
  icon: string;
  route: string;
}

interface MenuItem {
  label: string;
  icon: string;
  route?: string; // plain link
  children?: SubMenu[]; // dropdown group
}

@Component({
  selector: 'app-sidebar',
  imports: [AvatarModule, ButtonModule, RippleModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  collapsed = signal(false);
  sidebarservice = inject(SidebarService);
  router = inject(Router);

  openGroups = signal<string[]>([]);

  menus: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      route: '/dashboard',
    },

    { label: 'Sale Orders', icon: 'pi pi-shopping-cart', route: '/saleOrders' },
    { label: 'Purchase Orders', icon: 'pi pi-shopping-bag', route: '/purchaseOrders' },

    {
      label: 'Item Ledger',
      icon: 'pi pi-book',
      route: '/reports/itemledger',
    },
    {
      label: 'In-Out Summary',
      icon: 'pi pi-arrow-right-arrow-left',
      route: '/reports/inoutsummary',
    },

    {
      label: 'Suppliers',
      icon: 'pi pi-building',
      route: '/suppliers',
    },
    {
      label: 'Customer',
      icon: 'pi pi-users',
      route: '/customers',
    },
    {
      label: 'Core Module',
      icon: 'pi pi-cog',
      children: [
        { label: 'Category', icon: 'pi pi-folder', route: '/categories' },
        { label: 'Units', icon: 'pi pi-calculator', route: '/units' },
        { label: 'Store', icon: 'pi pi-shop', route: '/stores' },
        {
          label: 'Item',
          icon: 'pi pi-box',
          route: '/items',
        },
      ],
    },
  ];

  constructor() {
    // open the group that contains the current page
    const open = this.menus
      .filter((menu) => menu.children?.some((child) => this.router.url.startsWith(child.route)))
      .map((menu) => menu.label);

    this.openGroups.set(open);
  }

  isOpen(label: string): boolean {
    return this.openGroups().includes(label);
  }

  isGroupActive(menu: MenuItem): boolean {
    return (
      menu.children?.some((child) =>
        this.router.isActive(child.route, {
          paths: 'subset',
          queryParams: 'ignored',
          fragment: 'ignored',
          matrixParams: 'ignored',
        }),
      ) ?? false
    );
  }

  toggleGroup(label: string) {
    // collapsed rail has no room for a submenu: expand it and open the group
    if (this.collapsed()) {
      this.toggle();
      if (!this.isOpen(label)) {
        this.openGroups.update((groups) => [...groups, label]);
      }
      return;
    }

    this.openGroups.update((groups) =>
      groups.includes(label) ? groups.filter((g) => g !== label) : [...groups, label],
    );
  }

  toggle() {
    this.collapsed.update((v) => !v);
    this.sidebarservice.toggle();
  }
}
