import { Component, inject, input, signal } from '@angular/core';
import { ItemService } from '../../../service/item-service';
import { CategoriesService } from '../../../../category/services/categories';
import { UnitService } from '../../../../unit/service/unit-service';
import { ToastService } from '../../../../toast/toast-service';
import { form, FormField, required } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';
import { Location } from '@angular/common';
import { Iitem } from '../../../../interface/iitem';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Select } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { Inewitem } from '../../../../interface/inewitem';
import { Icategory } from '../../../../interface/Icategory';
import { GenerateNumberService } from '../../../../core/service/generate-number-service';

@Component({
  selector: 'app-item-add-component',
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
  templateUrl: './item-add-component.html',
  styleUrl: './item-add-component.css',
})
export class ItemAddComponent {
  itemService = inject(ItemService);
  categoriesService = inject(CategoriesService);
  unitService = inject(UnitService);
  toast = inject(ToastService);
  location = inject(Location);

  categories = signal<any[]>([]);
  units = signal<any[]>([]);

  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];
  item = signal({
    category_id: '',
    unit_id: '',
    sku: '',
    name: '',
    purchase_price: '',
    sale_price: '',
    status: '',
    reorder_level: '',
    barcode: '',
    description: '',
  });
  itemForm = form(this.item, (schema) => {
    required(schema.category_id, {
      when: ({ state }) => state.touched(),
      message: 'Category is required.',
    });
    required(schema.unit_id, {
      when: ({ state }) => state.touched(),
      message: 'Unit is required.',
    });
    required(schema.sku, { when: ({ state }) => state.touched(), message: 'SKU is required.' });
    required(schema.name, { when: ({ state }) => state.touched(), message: 'Name is required.' });
    required(schema.purchase_price, {
      when: ({ state }) => state.touched(),
      message: 'Purchase price is required.',
    });
    required(schema.sale_price, {
      when: ({ state }) => state.touched(),
      message: 'Sale price is required.',
    });
    required(schema.status, {
      when: ({ state }) => state.touched(),
      message: 'Status is required.',
    });
  });

  gNumber = inject(GenerateNumberService);
  ngOnInit() {
    // generate SKU
    this.gNumber.Item().subscribe({
      next: (sku) => {
        console.log(sku);

        this.item.update((item) => ({
          ...item,
          sku: sku,
        }));
      },
    });

    this.categoriesService.getAll().subscribe({
      next: (response: any) => {
        this.categories.set(response.data);
      },
      error: (error) => {
        this.toast.error(error?.error?.message || 'Something went wrong.');
      },
    });

    this.unitService.getAll().subscribe({
      next: (response: any) => {
        this.units.set(response.data);
      },
      error: (error) => {
        this.toast.error(error?.error?.message || 'Something went wrong.');
      },
    });
  }

  submit() {
    console.log('item signal:', this.item());

    if (this.itemForm().invalid()) {
      this.itemForm().markAsTouched();
      return;
    }

    const formValue = this.itemForm().value();
    console.log('Payload for item create', formValue);

    this.itemService.create(formValue).subscribe({
      next: (response: any) => {
        this.toast.success(response.message);
        // this.location.back();
      },
      error: (err: HttpErrorResponse) => {
        const errors = err.error?.errors;

        if (errors) {
          const firstError = Object.values(errors)[0] as string[];
          this.toast.error(firstError[0]);

          const debug = err.error?.debug || '';
          if (debug.includes('items.items_sku_unique')) {
            this.toast.error('SKU already exists. Please change its SKU.');
            return;
          }

          if (debug.includes('items.items_name_unique')) {
            this.toast.error('Item name already exists. Please change its name.');
            return;
          }

          if (debug.includes('items.items_barcode_unique')) {
            this.toast.error('Barcode already exists.');
            return;
          }
        } else {
          //dublicate entry
          const debug = err.error?.debug || '';
          if (debug.includes('items.items_sku_unique')) {
            this.toast.error('SKU already exists. Please change its SKU.');
            return;
          }

          if (debug.includes('items.items_name_unique')) {
            this.toast.error('Item name already exists. Please change its name.');
            return;
          }

          if (debug.includes('items.items_barcode_unique')) {
            this.toast.error('Barcode already exists.');
            return;
          }
          this.toast.error(err.error?.message || 'Something went wrong');
        }
      },
    });
  }

  back() {
    this.location.back();
  }
}
