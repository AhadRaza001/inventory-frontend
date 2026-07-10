import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button, ButtonModule } from 'primeng/button';
import { FloatLabel, FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { CategoriesService } from '../../services/categories';
import { form, FormField, required, schema } from '@angular/forms/signals';
import { ToastService } from '../../../toast/toast-service';
import { HttpErrorResponse } from '@angular/common/http';
import { Location } from '@angular/common';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-add-category',
  imports: [FloatLabelModule, MessageModule,ButtonModule, InputTextModule, FormField,ButtonModule, InputTextModule,FormsModule,CardModule],
  templateUrl: './add-category.html',
  styleUrl: './add-category.css',
})
// ButtonModule, InputTextModule,FormsModule
export class AddCategory {
  categoriesService = inject(CategoriesService);
  toast = inject(ToastService);
  location = inject(Location);

  category = signal({
    name: '',
    description: '',
  });

  categoryForm = form(this.category, (schema) => {
    required(schema.name, { when: ({ state }) => state.touched(), message: 'Username is required.' })
    required(schema.description, { when: ({ state }) => state.touched(), message: 'Description is required.' });
  });

  submit() {
    if (this.categoryForm().invalid()) {
      this.categoryForm().markAsTouched();
      return;
    }

    const formValue = this.categoryForm().value();
    this.categoriesService.create(formValue).subscribe({
      next: (response: any) => {
        this.toast.success(response.message);
        this.location.back();
      },
      error: (err: HttpErrorResponse) => {
        this.toast.error(err.error?.message ?? 'Something went wrong');
      },
    });
  }
  back(){
    this.location.back();
  }
  
}
