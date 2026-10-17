import { Component, inject, signal } from '@angular/core';
import { Toolbar } from 'primeng/toolbar';
import { InputNumber } from 'primeng/inputnumber';
import { ActivatedRoute } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { SupplierService } from '../../service/supplier-service';
import { ToastService } from '../../../toast/toast-service';
import { ISupplier } from '../../../interface/isupplier';
import { Location } from '@angular/common';
import { Card, CardModule } from 'primeng/card';
import { Tag, TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-supplier-detail',
  imports: [
    Toolbar,
    InputNumber,
    Card,
    Tag,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    FloatLabelModule,
    FormsModule,
    ConfirmDialogModule,
    TagModule,
    Toolbar,
  ],
  templateUrl: './supplier-detail.html',
  styleUrl: './supplier-detail.css',
})
export class SupplierDetail {
  // =========================
  // Services
  // =========================

  route = inject(ActivatedRoute);

  confirmationService = inject(ConfirmationService);

  suppliersService = inject(SupplierService);

  toast = inject(ToastService);

  location = inject(Location);

  // =========================
  // Signals
  // =========================

  isEditing = signal(false);

  supplier = signal<ISupplier | undefined>(undefined);

  originalSupplier = signal<ISupplier | undefined>(undefined);

  // =========================
  // Load Supplier
  // =========================

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.suppliersService.getById(id).subscribe({
        next: (response: any) => {
          this.supplier.set(response.data);

          this.originalSupplier.set(response.data);

          console.log(response);
        },

        error: (error) => {
          console.log(error);

          if (error) {
            this.toast.error(error);
          } else {
            this.toast.error('Something went wrong.');
          }
        },
      });
    }
  }

  // =========================
  // Update SKU
  // =========================

  updateSku(sku: string) {
    this.supplier.update((s) => ({
      ...s!,

      sku: sku,
    }));
  }

  // =========================
  // Update Name
  // =========================

  updateName(name: string) {
    this.supplier.update((s) => ({
      ...s!,

      name: name,
    }));
  }

  // =========================
  // Update Phone
  // =========================

  updatePhone(phone: string) {
    this.supplier.update((s) => ({
      ...s!,

      phone: phone,
    }));
  }

  // =========================
  // Update Email
  // =========================

  updateEmail(email: string) {
    this.supplier.update((s) => ({
      ...s!,

      email: email,
    }));
  }

  // =========================
  // Update City
  // =========================

  updateCity(city: string) {
    this.supplier.update((s) => ({
      ...s!,

      city: city,
    }));
  }

  // =========================
  // Update Address
  // =========================

  updateAddress(address: string) {
    this.supplier.update((s) => ({
      ...s!,

      address: address,
    }));
  }

  // =========================
  // Update Credit Limit
  // =========================

  updateCreditLimit(credit_limit: number | null) {
    this.supplier.update((s) => ({
      ...s!,

      credit_limit: credit_limit ?? 0,
    }));
  }

  // =========================
  // Enable Edit
  // =========================

  enableEdit() {
    this.isEditing.set(true);
  }

  // =========================
  // Cancel
  // =========================

  cancel() {
    this.isEditing.set(false);

    this.supplier.set({
      ...this.originalSupplier()!,
    });
  }

  // =========================
  // Save
  // =========================

  save() {
    const supplier = this.supplier();

    if (!supplier) {
      return;
    }

    this.suppliersService.update(Number(supplier.id), supplier).subscribe({
      next: (response: any) => {
        // Update original copy
        this.originalSupplier.set({
          ...supplier,
        });

        // Disable editing
        this.isEditing.set(false);

        this.toast.success(response.message || 'Supplier updated successfully.');
      },

      error: (error) => {
        this.toast.error(error?.error?.message || 'Something went wrong.');
      },
    });
  }

  // =========================
  // Delete
  // =========================

  delete(event: MouseEvent, id: any) {
    this.confirmationService.confirm({
      target: event.target as HTMLElement,

      message: 'Do you want to delete this record?',

      header: 'Danger Zone',

      icon: 'pi pi-info-circle',

      rejectLabel: 'Cancel',

      rejectButtonProps: {
        label: 'Cancel',

        severity: 'secondary',

        outlined: true,
      },

      acceptButtonProps: {
        label: 'Delete',

        severity: 'danger',
      },

      accept: () => {
        this.suppliersService.delete(id).subscribe({
          next: (response: any) => {
            this.toast.success(response.message);

            this.location.back();
          },

          error: (err: any) => {
            this.toast.error(err.message);
          },
        });
      },
    });
  }

  // =========================
  // Back
  // =========================

  back() {
    this.location.back();
  }

  // =========================
  // Refresh
  // =========================

  refresh() {
    this.ngOnInit();
  }
}
