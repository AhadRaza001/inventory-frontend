import { Component, computed, inject } from '@angular/core';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../auth/service/auth-service';
import { ToastService } from '../../toast/toast-service';
import { Location } from '@angular/common';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { filter, map, startWith, Subscription } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-breadcrumb',
  imports: [BreadcrumbModule, ButtonModule, ConfirmDialogModule],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.css',
})
export class Breadcrumb {
 private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly home: MenuItem = {
    icon: 'pi pi-home',
    routerLink: '/categories',
  };

  // Emits the current URL after every completed navigation
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  // Hide the whole bar on the login page
  readonly visible = computed(() => !this.currentUrl().startsWith('/login'));

  // Recomputed whenever the URL changes
  readonly items = computed<MenuItem[]>(() => {
    this.currentUrl();
    return this.buildBreadcrumbs();
  });

  private buildBreadcrumbs(): MenuItem[] {
    const crumbs: MenuItem[] = [];
    let route: ActivatedRouteSnapshot | undefined = this.router.routerState.snapshot.root;
    let url = '';

    while (route) {
      const path = route.url.map((segment) => segment.path).join('/');
      if (path) {
        url += `/${path}`;
      }

      const data = route.routeConfig?.data;
      if (data?.['breadcrumb']) {
        crumbs.push({
          label: data['breadcrumb'],
          // Set `breadcrumbLink: false` on a route to render its crumb as plain text
          routerLink: data['breadcrumbLink'] === false ? undefined : url || undefined,
        });
      }

      route = route.children.find((child) => child.outlet === 'primary');
    }

    // The last crumb is the current page, so it isn't a link
    const last = crumbs.at(-1);
    if (last) {
      delete last.routerLink;
    }

    return crumbs;
  }

  logout(event: MouseEvent): void {
    this.confirmationService.confirm({
      target: event.currentTarget as HTMLElement,
      message: 'Do you want to Log Out?',
      header: 'Log Out',
      icon: 'pi pi-sign-out',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Log Out',
        severity: 'danger',
      },
      accept: () => {
        this.authService.logout().subscribe({
          next: (response: any) => this.toast.success(response.message),
          error: (error: any) =>
            this.toast.error(error?.error?.message || 'Something went wrong.'),
        });
      },
    });
  }
}
