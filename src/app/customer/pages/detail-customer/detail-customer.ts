import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
 
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { Tag } from 'primeng/tag';
import { Toolbar } from 'primeng/toolbar';
import { CustomerService } from '../../service/customer-service';
import { ToastService } from '../../../toast/toast-service';
import { Icustomer } from '../../icustomer';
@Component({
  selector: 'app-detail-customer',
  imports: [
    CardModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    FloatLabelModule,
    FormsModule,
    ConfirmDialogModule,
    Tag,
    Toolbar,
  ],
  templateUrl: './detail-customer.html',
  styleUrl: './detail-customer.css',
})
export class DetailCustomer {
  route = inject(ActivatedRoute);
  customerService = inject(CustomerService);
  confirmationService = inject(ConfirmationService);
  toast = inject(ToastService);
  location = inject(Location);
 
  isEditing = signal(false);
 
  customer = signal<Icustomer | undefined>(undefined);
  originalCustomer = signal<Icustomer | undefined>(undefined);
 
  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Blocked', value: 'blocked' },
  ];
 
  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
 
    this.customerService.getById(id).subscribe({
      next: (response: any) => {
        this.customer.set(response.data);
        this.originalCustomer.set(response.data);
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
 
  statusSeverity(status?: string): 'success' | 'secondary' | 'danger' {
    if (status === 'active') return 'success';
    if (status === 'blocked') return 'danger';
    return 'secondary';
  }
 
  // One method for all text/select fields: name, phone, email, city, address, status
  updateField(field: keyof Icustomer, value: any) {
    this.customer.update((c) => ({
      ...c!,
      [field]: value,
    }));
  }
 
  // credit_limit is a string in the interface, but p-inputnumber works with numbers
  creditLimit(): number {
    return Number(this.customer()?.credit_limit ?? 0);
  }
 
  updateCreditLimit(value: number | null) {
    this.customer.update((c) => ({
      ...c!,
      credit_limit: String(value ?? 0),
    }));
  }
 
  enableEdit() {
    this.isEditing.set(true);
  }
 
  cancel() {
    this.isEditing.set(false);
    this.customer.set({ ...this.originalCustomer()! });
  }
 
  save() {
    const customer = this.customer();
 
    if (!customer || !this.isEditing()) return;
 
    this.customerService.update(Number(customer.id), customer).subscribe({
      next: (response: any) => {
        this.originalCustomer.set({ ...customer });
        this.isEditing.set(false);
        this.toast.success(response.message || 'Customer updated successfully.');
      },
      error: (error) => {
        this.toast.error(error?.error?.message || 'Something went wrong.');
      },
    });
  }
 
  delete(event: MouseEvent, id: any) {
    this.confirmationService.confirm({
      target: event.currentTarget as HTMLElement,
      message: 'Do you want to delete this customer?',
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
        this.customerService.delete(id).subscribe({
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
