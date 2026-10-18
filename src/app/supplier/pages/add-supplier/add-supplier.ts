import { Component, inject, signal } from '@angular/core';
import { Card, CardModule } from 'primeng/card';
import { email, form, FormField, required, min, disabled } from '@angular/forms/signals';
import { ToastService } from '../../../toast/toast-service';
import { SupplierService } from '../../service/supplier-service';
import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageModule } from 'primeng/message';
import { GenerateNumberService } from '../../../core/service/generate-number-service';

@Component({
  selector: 'app-add-supplier',
  imports: [
    Card,
    FormField,
    FloatLabelModule,
    MessageModule,
    ButtonModule,
    InputTextModule,
    FormField,
    ButtonModule,
    InputTextModule,
    FormsModule,
    CardModule,
  ],
  templateUrl: './add-supplier.html',
  styleUrl: './add-supplier.css',
})
export class AddSupplier {
  suppliersService = inject(SupplierService);
  toast = inject(ToastService);
  location = inject(Location);

  supplier = signal({
    sku: '',
    name: '',
    phone: '',
    city: '',
    address: '',
    email: '',
    credit_limit: 0,
  });

  supplierForm = form(this.supplier, (schema) => {
    const whenTouched = { when: ({ state }: any) => state.touched() };
    disabled(schema.sku);
    required(schema.name, { ...whenTouched, message: 'Name is required.' });
    required(schema.phone, { ...whenTouched, message: 'Phone is required.' });
    required(schema.city, { ...whenTouched, message: 'City is required.' });
    required(schema.address, { ...whenTouched, message: 'Address is required.' });
    required(schema.email, { ...whenTouched, message: 'Email is required.' });
    email(schema.email, { message: 'Enter a valid email address.' });
    min(schema.credit_limit, 0, { message: 'Credit limit cannot be negative.' });
  });

  submit() {
    if (this.supplierForm().invalid()) {
      this.supplierForm().markAsTouched();
      return;
    }

    const formValue = this.supplierForm().value();
    this.suppliersService.create(formValue).subscribe({
      next: (response: any) => {
        this.toast.success(response.message);
        this.location.back();
      },
      error: (err: HttpErrorResponse) => {
        const errors = err.error?.errors;

        if (errors) {
          const messages = Object.values(errors).flat().join('\n');

          this.toast.error(messages);
        } else {
          this.toast.error(err.error?.message ?? 'Something went wrong');
        }
      },
    });
  }

  gNumber = inject(GenerateNumberService);
  ngOnInit() {
    // generate SKU
    this.gNumber.supplier().subscribe({
      next: (sku) => {
        console.log(sku);

        this.supplier.update((supplier) => ({
          ...supplier,
          sku: sku.data,
        }));
      },
    });
  }
  back() {
    this.location.back();
  }
}
