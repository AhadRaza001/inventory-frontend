import { Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { form, FormField, maxLength, required } from '@angular/forms/signals';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CardModule } from 'primeng/card';
import { StoreService } from '../../service/store-service';
import { ToastService } from '../../../toast/toast-service';
@Component({
  selector: 'app-add-store',
  imports: [ButtonModule, InputTextModule, TextareaModule, FormField, CardModule],
  templateUrl: './add-store.html',
  styleUrl: './add-store.css',
})
export class AddStore {
    storeService = inject(StoreService);
  toast = inject(ToastService);
  location = inject(Location);

  // company_id is set by the backend
  store = signal({
    name: '',
    phone: '',
    address: '',
    description: '',
  });

  storeForm = form(this.store, (schema) => {
    required(schema.name, {
      when: ({ state }) => state.touched(),
      message: 'Store name is required.',
    });
    required(schema.address, {
      when: ({ state }) => state.touched(),
      message: 'Address is required.',
    });

    // phone is optional, but the column is varchar(20)
    maxLength(schema.phone, 20, { message: 'Phone cannot exceed 20 characters.' });
  });

  submit() {
    if (this.storeForm().invalid()) {
      this.storeForm().markAsTouched();
      return;
    }

    const formValue = this.storeForm().value();

    // phone and description are nullable columns, so empty strings go as null
    const payload = {
      name: formValue.name.trim(),
      address: formValue.address.trim(),
      phone: formValue.phone.trim() === '' ? null : formValue.phone.trim(),
      description: formValue.description.trim() === '' ? null : formValue.description.trim(),
    };

    this.storeService.create(payload).subscribe({
      next: (response: any) => {
        this.toast.success(response.message);
        this.location.back();
      },
      error: (err: HttpErrorResponse) => {
        this.toast.error(err.error?.message ?? 'Something went wrong');
      },
    });
  }

  back() {
    this.location.back();
  }
}
