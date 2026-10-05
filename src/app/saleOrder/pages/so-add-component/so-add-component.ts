import { Component, inject, signal } from '@angular/core';
import { SaleOrderService } from '../../service/sale-order-service';
import { ToastService } from '../../../toast/toast-service';
import { GenerateNumberService } from '../../../core/service/generate-number-service';
import { form, FormField, required } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';
import { Location } from '@angular/common';
import { CustomerService } from '../../../customer/service/customer-service';
import { StoreService } from '../../../store/service/store-service';
import { Select } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
  selector: 'app-so-add-component',
  imports: [
    FloatLabelModule,
    ButtonModule,
    InputTextModule,
    FormField,
    ButtonModule,
    InputTextModule,
    FormsModule,
    CardModule,
    Select,
  ],
  templateUrl: './so-add-component.html',
  styleUrl: './so-add-component.css',
})
export class SoAddComponent {
  saleOrderService = inject(SaleOrderService);
  customerService = inject(CustomerService);
  storeService = inject(StoreService);

  toast = inject(ToastService);
  location = inject(Location);
  gNumber = inject(GenerateNumberService);

  customers = signal<any[]>([]);
  stores = signal<any[]>([]);

  // Sale Order Status
  statusOptions = [
    { label: 'Open', value: 'open' },
    { label: 'Partially Delivered', value: 'partially_delivered' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Invoiced', value: 'invoiced' },
  ];

  // Amount Status
  amountStatusOptions = [
    { label: 'Paid', value: 'paid' },
    { label: 'Unpaid', value: 'unpaid' },
    { label: 'Partial', value: 'partial' },
  ];

  saleOrder = signal({
    customer_id: 0,
    store_id: 0,
    user_id: 0,

    so_no: '',

    status: 'open' as 'open' | 'partially_delivered' | 'delivered' | 'cancelled' | 'invoiced',

    amount_status: 'unpaid' as 'paid' | 'unpaid' | 'partial',

    sub_total: 0,
    discount_amount: 0,
    discount_percentage: 0,

    taxPercent: 0,
    tax_amount: 0,

    grand_total: 0,
    paid_amount: 0,
    due_amount: 0,

    customer_requisitions: '',
    customer_reference: '',
  });

  saleOrderForm = form(this.saleOrder, (schema) => {
    required(schema.customer_id, {
      when: ({ state }) => state.touched(),
      message: 'Customer is required.',
    });

    required(schema.store_id, {
      when: ({ state }) => state.touched(),
      message: 'Store is required.',
    });

    required(schema.so_no, {
      when: ({ state }) => state.touched(),
      message: 'SO No is required.',
    });

    required(schema.status, {
      when: ({ state }) => state.touched(),
      message: 'Status is required.',
    });

    required(schema.amount_status, {
      when: ({ state }) => state.touched(),
      message: 'Amount status is required.',
    });
  });

  ngOnInit() {
    // Generate Sale Order Number
    this.gNumber.saleOrder().subscribe({
      next: (soNo) => {
        console.log('Generated SO No:', soNo.data);

        this.saleOrder.update((order) => ({
          ...order,
          so_no: soNo.data,
        }));
      },

      error: (error) => {
        this.toast.error(error?.error?.message || 'Unable to generate sale order number.');
      },
    });

    // Get Customers
    this.customerService.getAll().subscribe({
      next: (response: any) => {
        this.customers.set(response.data);
      },

      error: (error) => {
        this.toast.error(error?.error?.message || 'Unable to load customers.');
      },
    });

    // Get Stores
    this.storeService.getAll().subscribe({
      next: (response: any) => {
        this.stores.set(response.data);
      },

      error: (error) => {
        this.toast.error(error?.error?.message || 'Unable to load stores.');
      },
    });
  }

  submit() {
    console.log('Sale Order signal:', this.saleOrder());

    if (this.saleOrderForm().invalid()) {
      this.saleOrderForm().markAsTouched();
      return;
    }

    const formValue = this.saleOrderForm().value();

    console.log('Payload for sale order create:', formValue);

    this.saleOrderService.create(formValue).subscribe({
      next: (response: any) => {
        this.toast.success(response.message);
      },

      error: (err: HttpErrorResponse) => {
        const errors = err.error?.errors;

        if (errors) {
          const firstError = Object.values(errors)[0] as string[];

          if (firstError?.length) {
            this.toast.error(firstError[0]);
            return;
          }
        }

        const debug = err.error?.debug || '';

        // Duplicate Sale Order Number
        if (
          debug.includes('sale_orders_company_id_so_no_unique') ||
          debug.includes('sale_orders_so_no_unique')
        ) {
          this.toast.error('Sale Order number already exists. Please reload the page.');
          return;
        }

        this.toast.error(err.error?.message || 'Something went wrong.');
      },
    });
  }

  back() {
    this.location.back();
  }
}
