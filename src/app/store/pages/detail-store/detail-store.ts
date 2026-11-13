import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { Toolbar } from 'primeng/toolbar';
import { StoreService } from '../../service/store-service';
import { ToastService } from '../../../toast/toast-service';
import { IStore } from '../../../interface/iso-detail';
@Component({
  selector: 'app-detail-store',
  imports: [
     CardModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    FormsModule,
    ConfirmDialogModule,
    Toolbar,
  ],
  templateUrl: './detail-store.html',
  styleUrl: './detail-store.css',
})
export class DetailStore {
  route = inject(ActivatedRoute);
  storeService = inject(StoreService);
  confirmationService = inject(ConfirmationService);
  toast = inject(ToastService);
  location = inject(Location);

  isEditing = signal(false);

  store = signal<IStore | undefined>(undefined);
  originalStore = signal<IStore | undefined>(undefined);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.storeService.getById(id).subscribe({
      next: (response: any) => {
        this.store.set(response.data);
        this.originalStore.set(response.data);
        this.isEditing.set(false);
      },
      error: (error) => {
        console.error(error);
        this.toast.error(error?.error?.message || 'Something went wrong.');
      },
    });
  }

  refresh() {
    this.ngOnInit();
  }

  // One method for all fields: name, phone, address, description
  updateField(field: keyof IStore, value: any) {
    this.store.update((s) => ({
      ...s!,
      [field]: value,
    }));
  }

  enableEdit() {
    this.isEditing.set(true);
  }

  cancel() {
    this.isEditing.set(false);
    this.store.set({ ...this.originalStore()! });
  }

  save() {
    const store = this.store();

    if (!store || !this.isEditing()) return;

    if (!store.name?.trim() || !store.address?.trim()) {
      this.toast.warn('Name and address are required.');
      return;
    }

    // send only the editable fields, company_id and timestamps stay untouched
    const payload = {
      name: store.name.trim(),
      phone: store.phone,
      address: store.address.trim(),
      description: store.description,
    };

    this.storeService.update(Number(store.id), payload).subscribe({
      next: (response: any) => {
        this.originalStore.set({ ...store });
        this.isEditing.set(false);
        this.toast.success(response.message || 'Store updated successfully.');
      },
      error: (error) => {
        this.toast.error(error?.error?.message || 'Something went wrong.');
      },
    });
  }

  delete(event: MouseEvent, id: any) {
    this.confirmationService.confirm({
      target: event.currentTarget as HTMLElement,
      message: 'Do you want to delete this store?',
      header: 'Danger Zone',
      icon: 'pi pi-info-circle',

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
        this.storeService.delete(id).subscribe({
          next: (response: any) => {
            this.toast.success(response.message);
            this.location.back();
          },
          error: (error: any) => {
            this.toast.error(error?.error?.message || 'Something went wrong.');
          },
        });
      },
    });
  }

  back() {
    this.location.back();
  }
}
