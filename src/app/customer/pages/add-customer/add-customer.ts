import { Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { email, form, FormField, min, required } from '@angular/forms/signals';

import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { CustomerService } from '../../service/customer-service';
import { ToastService } from '../../../toast/toast-service';

@Component({
  selector: 'app-add-customer',
  imports: [
    FloatLabelModule,
    MessageModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    FormField,
    FormsModule,
    CardModule,
  ],
  templateUrl: './add-customer.html',
  styleUrl: './add-customer.css',
})
export class AddCustomer {
  customerService = inject(CustomerService);
  toast = inject(ToastService);
  location = inject(Location);

  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Blocked', value: 'blocked' },
  ];

  // customer_no and company_id are set by the backend
  customer = signal({
    name: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    credit_limit: 0,
    status: 'active',
  });

  customerForm = form(this.customer, (schema) => {
    required(schema.name, {
      when: ({ state }) => state.touched(),
      message: 'Customer name is required.',
    });
    required(schema.phone, { when: ({ state }) => state.touched(), message: 'Phone is required.' });
    required(schema.city, { when: ({ state }) => state.touched(), message: 'City is required.' });

    // email is optional, but must be valid if it is filled in
    email(schema.email, { message: 'Enter a valid email address.' });

    min(schema.credit_limit, 0, { message: 'Credit limit cannot be negative.' });
  });

  submit() {
    if (this.customerForm().invalid()) {
      this.customerForm().markAsTouched();
      return;
    }

    const formValue = this.customerForm().value();

    // an empty email must go as null, otherwise the (company_id, email) unique index
    // rejects the second customer without an email
    const payload = {
      ...formValue,
      email: formValue.email.trim() === '' ? null : formValue.email.trim(),
    };

    this.customerService.create(payload).subscribe({
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
