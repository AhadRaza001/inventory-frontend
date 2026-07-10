import { Component, inject, signal, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { Drawer, DrawerModule } from 'primeng/drawer';
import { StyleClassModule } from 'primeng/styleclass';
import { Topbar } from './topbar/topbar/topbar';
import { Sidebar } from './sidebar/sidebar/sidebar';
import { SidebarService } from './sidebar/sidebarService';
import { ToastComponent } from './toast/toast-component/toast-component';
import { Loading } from './shared/loading/loading';

import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
@Component({
  selector: 'app-root',
  imports: [
    AvatarModule,
    ButtonModule,
    DrawerModule,
    RippleModule,
    Topbar,
    Sidebar,
    RouterOutlet,
    ToastComponent,
    Loading,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  router = inject(Router);
  sidebarService = inject(SidebarService);

  //sidebar work
  protected readonly title = signal('inventory_management');

  sidebarVisible = false;
  showSidebar() {
    this.sidebarVisible = true;
  }

//Login Signup show than sidebr or top hide
  constructor() {
    // recompute showLayout whenever navigation ends
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const isAuthRoute = this.authRoutes.some((route) =>
          event.urlAfterRedirects.startsWith(route),
        );
        this.showLayout.set(!isAuthRoute);
      });

  }
  


  // routes where the layout chrome (topbar/sidebar) should be hidden
  private authRoutes = ['/login', '/signup'];

  private currentUrl = toSignal(
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)),
    { initialValue: null },
  );

  showLayout = signal(true);
}
