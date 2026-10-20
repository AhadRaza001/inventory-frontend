import { Component, inject, OnInit, signal } from '@angular/core';
import { PurchaseOrderService } from '../../service/purchase-order-service';
import { SupplierService } from '../../../supplier/service/supplier-service';
import { StoreService } from '../../../store/service/store-service';
import { GenerateNumberService } from '../../../core/service/generate-number-service';
import { ToastService } from '../../../toast/toast-service';
import { ISupplier } from '../../../interface/isupplier';
import { IStore } from '../../../interface/iso-detail';
import { disabled, form, FormField, required } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';
import { Location } from '@angular/common';
import { Card, CardModule } from 'primeng/card';
import { Select, SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-add-purchase-order',
  imports: [
    Card,
    Select,
    FormsModule,
    FormField,
    ButtonModule,
    InputTextModule,
    SelectModule,
    CardModule,
  ],
  templateUrl: './add-purchase-order.html',
  styleUrl: './add-purchase-order.css',
})
export class AddPurchaseOrder implements OnInit {
  poService = inject(PurchaseOrderService);
  supplierService = inject(SupplierService);
  storeService = inject(StoreService);
  gNumber = inject(GenerateNumberService);
  toast = inject(ToastService);
  location = inject(Location);

  suppliers = signal<ISupplier[]>([]);
  stores = signal<IStore[]>([]);

  po = signal<{
    po_no: string;
    supplier_id: number | null;
    store_id: number | null;
    customer_reference: string;
    customer_requisitions: string;
  }>({
    po_no: '',
    supplier_id: null,
    store_id: null,
    customer_reference: '',
    customer_requisitions: '',
  });

  poForm = form(this.po, (schema) => {
    const whenTouched = { when: ({ state }: any) => state.touched() };
    disabled(schema.po_no);
    required(schema.supplier_id, { ...whenTouched, message: 'Supplier is required.' });
    required(schema.store_id, { ...whenTouched, message: 'Store is required.' });
  });

  ngOnInit() {
    // generate PO number
    this.gNumber.purchaseOrder().subscribe({
      next: (res) => {
        this.po.update((po) => ({ ...po, po_no: res.data }));
      },
    });

    // dropdown options
    this.supplierService.getAll().subscribe({
      next: (res: any) => this.suppliers.set(res.data),
    });
    this.storeService.getAll().subscribe({
      next: (res: any) => this.stores.set(res.data),
    });
  }

  submit() {
    // mark as touched first so the required rules are active before we check validity
    this.poForm().markAsTouched();

    if (this.poForm().invalid()) {
      return;
    }

    const formValue = this.poForm().value();
    this.poService.create(formValue).subscribe({
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

  back() {
    this.location.back();
  }
}
