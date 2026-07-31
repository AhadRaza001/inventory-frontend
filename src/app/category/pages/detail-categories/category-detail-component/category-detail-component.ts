import { Component, inject, signal, Signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CategoriesService } from '../../../services/categories';
import { ToastService } from '../../../../toast/toast-service';
import { Icategory } from '../../../../interface/Icategory';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FormsModule, NgModel } from '@angular/forms';
import { Location } from '@angular/common';
import { ConfirmationService, ConfirmEventType } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Tag, TagClasses, TagModule, TagStyle } from 'primeng/tag';

@Component({
  selector: 'app-category-detail-component',
  imports: [
    CardModule,
    ButtonModule,
    InputTextModule,
    FloatLabelModule,
    FormsModule,
    ConfirmDialogModule,
    TagModule
  ],
  templateUrl: './category-detail-component.html',
  styleUrl: './category-detail-component.css',
})
export class CategoryDetailComponent {
  route = inject(ActivatedRoute);
  confirmationService = inject(ConfirmationService);
  categoriesService = inject(CategoriesService);
  toast = inject(ToastService);
  location = inject(Location);
  isEditing = signal(false);
  category = signal<Icategory | undefined>(undefined);
  originalCategory = signal<Icategory | undefined>(undefined);
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    this.categoriesService.getById(id).subscribe({
      next: (response: any) => {
        this.category.set(response.data);
        this.originalCategory.set(response.data);
        console.log(response);
      },
      error: (error) => {
        console.log(error);
        if (error) {
          this.toast.error(error);
        } else {
          this.toast.error('Someting went wrong.');
        }
      },
    });
  }
  updateName(name: string) {
    this.category.update((c) => ({
      ...c!,
      name: name,
    }));
  }
  updateDescription(description: string) {
    this.category.update((c) => ({
      ...c!,
      description: description,
    }));
  }
  enableEdit() {
    this.isEditing.set(true);
  }
  cancel() {
    this.isEditing.set(false);
    this.category.set({ ...this.originalCategory()! });
  }
  save() {
    const category = this.category();
    if (!category) {
      return;
    }
    this.categoriesService.update(Number(category.id), category).subscribe({
      next: (response: any) => {
        this.originalCategory.set({ ...category });
        this.isEditing.set(false);
        this.toast.success(response.message || 'Category updated successfully.');
      },
      error: (error) => {
        this.toast.error(error?.error?.message || 'Something went wrong.');
      },
    });
  }
  delete(event: MouseEvent,id: any) {
    this.confirmationService.confirm({
      target: event.target as HTMLElement,
      message: 'Do you want to delete this record?',
      header: 'Danger Zone',
      icon: 'pi pi-info-circle',
      rejectLabel: 'Cancel',
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
        this.categoriesService.delete(id).subscribe({
          next: (response: any) => {
            this.toast.success(response.message);
            this.location.back();
          },
          error: (err: any) => {
            this.toast.error(err.message);
          },
        });
      },
    });
  }
  back() {
    this.location.back();
  }
}
