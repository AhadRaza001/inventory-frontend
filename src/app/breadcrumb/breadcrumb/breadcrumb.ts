import { Component, inject } from '@angular/core';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../auth/service/auth-service';
import { ToastService } from '../../toast/toast-service';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-breadcrumb',
  imports: [BreadcrumbModule, ButtonModule,ConfirmDialogModule],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.css',
})
export class Breadcrumb {
  items: MenuItem[] = [
    { label: 'Components' },
    { label: 'Form' },
    { label: 'InputText', routerLink: '/inputtext' },
  ];
  home: MenuItem = { icon: 'pi pi-home', routerLink: '/' };

  //logout
  confirmationService = inject(ConfirmationService);
  authservice = inject(AuthService);

  toast = inject(ToastService);
  location = inject(Location);
  logout(event: MouseEvent) {
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
        this.authservice.logout().subscribe({
          next: (response: any) => {
            this.toast.success(response.message);
            console.log('Logout button pressed');
          },
          error: (error: any) => {
            this.toast.error(error?.error?.message || 'Something went wrong.');
          },
        });
      },
    });
  }
}
