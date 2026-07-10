import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ItemService } from '../../../service/item-service';
import { ConfirmationService } from 'primeng/api';
import { ToastService } from '../../../../toast/toast-service';
import { Iitem } from '../../../../interface/iitem';
import { DecimalPipe, Location } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Select } from 'primeng/select';
import { UnitController } from '../../../../unit/pages/unit-controller/unit-controller';
import { Categories } from '../../../../category/pages/categories/categories';
import { CategoriesService } from '../../../../category/services/categories';
import { UnitService } from '../../../../unit/service/unit-service';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-item-detail-component',
  imports: [
    CardModule,
    ButtonModule,
    InputTextModule,
    FloatLabelModule,
    FormsModule,
    ConfirmDialogModule,
    Select,
    InputNumberModule
  ],
  templateUrl: './item-detail-component.html',
  styleUrl: './item-detail-component.css',
})
export class ItemDetailComponent {
  route = inject(ActivatedRoute);
  itemService = inject(ItemService);
  categoryService = inject(CategoriesService);
  unitService = inject(UnitService);
  confirmationService = inject(ConfirmationService);
  toast = inject(ToastService);
  location = inject(Location);

  isEditing = signal(false);
  categories = signal<any[]>([]);
  units = signal<UnitController[]>([]);

  item = signal<Iitem | undefined>(undefined);
  originalItem = signal<Iitem | undefined>(undefined);

  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];
  // get all unit for option
  ngOnInit() {
    this.unitService.getAll().subscribe({
      next: (response: any) => {
        this.units.set(response.data);
      },
      error: (error) => {
        console.error(error);
        this.toast.error(error?.error?.message || 'Something went wrong.');
      },
    });
    // get all category for option
    this.categoryService.getAll().subscribe({
      next: (response: any) => {
        this.categories.set(response.data); 
      },
      error: (error) => {
        this.toast.error(error?.error?.message || 'Something went wrong.');
      },
    });

    const id = this.route.snapshot.paramMap.get('id');

    this.itemService.getById(id).subscribe({
      next: (response: any) => {
        this.item.set(response.data);
        this.originalItem.set(response.data);
        console.log('Item detail is:', response.data);
      },
      error: (error) => {
        console.error(error);
        this.toast.error(error?.error?.message || 'Something went wrong.');
      },
    });
  }

  updateName(name: string) {
    this.item.update((i) => ({
      ...i!,
      name,
    }));
  }

  updateSku(sku: string) {
    this.item.update((i) => ({
      ...i!,
      sku,
    }));
  }

  updateDescription(description: string) {
    this.item.update((i) => ({
      ...i!,
      description,
    }));
  }

 updatePurchasePrice(purchase_price: number) {
  this.item.update((i) => ({
    ...i!,
    purchase_price: purchase_price.toString(), // keep interface contract as string
  }));
}

  updateSalePrice(sale_price: number) {
    this.item.update((i) => ({
      ...i!,
      sale_price: sale_price.toString(),
    }));
  }

  updateStatus(status: 'active' | 'inactive') {
    this.item.update((i) => ({
      ...i!,
      status,
    }));
  }

  updateBarcode(barcode: string) {
    this.item.update((i) => ({
      ...i!,
      barcode,
    }));
  }

  updateReorderLevel(reorder_level: number) {
    this.item.update((i) => ({
      ...i!,
      reorder_level,
    }));
  }

  updateCategory(category_id: number) {
    this.item.update((i) => ({
      ...i!,
      category_id,
    }));
  }

  updateUnit(unit_id: number) {
    this.item.update((i) => ({
      ...i!,
      unit_id,
    }));
  }

  enableEdit() {
    this.isEditing.set(true);
  }

  cancel() {
    this.isEditing.set(false);
    this.item.set({ ...this.originalItem()! });
  }

  save() {
    const item = this.item();

    if (!item) return;

    this.itemService.update(Number(item.id), item).subscribe({
      next: (response: any) => {
        this.originalItem.set({ ...item });
        this.isEditing.set(false);
        this.toast.success(response.message || 'Item updated successfully.');
      },
      error: (error) => {
        this.toast.error(error?.error?.message || 'Something went wrong.');
      },
    });
  }

  delete(event: MouseEvent, id: any) {
    this.confirmationService.confirm({
      target: event.currentTarget as HTMLElement,
      message: 'Do you want to delete this item?',
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
        this.itemService.delete(id).subscribe({
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
