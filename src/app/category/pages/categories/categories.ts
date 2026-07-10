import { Component, inject, OnInit, signal } from '@angular/core';
import { CategoriesService } from '../../services/categories';
import { Icategory } from '../../../interface/Icategory';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { Router, RouterLink } from '@angular/router';
import { TableLazyLoadEvent } from 'primeng/table';
import { ToastService } from '../../../toast/toast-service';
@Component({
  selector: 'app-categories',
  imports: [
    TableModule,
    FormsModule,
    FloatLabelModule,
    InputTextModule,
    ToolbarModule,
    ButtonModule,
    RouterLink,
  ],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories {
  categoriesService = inject(CategoriesService);
  router = inject(Router);
  categories = signal<Icategory[]>([]);
  loading = true;
  searchValue = '';
  totalRecords = 0;
  toast = inject(ToastService);
  clear(table: any) {
    table.clear();
    this.searchValue = '';
  }

  ngOnInit() {
    setTimeout(() => {
      console.log('loading state after 3s:', this.loading);
    }, 5000);
  }

  loadCategories(event: TableLazyLoadEvent) {
    const page = (event.first ?? 0) / (event.rows ?? 10) + 1;
    const size = event.rows ?? 10;
    console.log(event.filters);

    console.log(page, size);
    //order by
    const sortField = (event.sortField as string) ?? 'id';
    const sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';

    //filter with column
    const filters = Object.entries(event.filters ?? {}).flatMap(([field, metadata]) => {
      if (!metadata) return [];

      const constraint = Array.isArray(metadata) ? metadata[0] : metadata;

      
      if (constraint.value == null || constraint.value === '') {
        return [];
      }
      return [
        {
          field,
          value: constraint.value,
          operator: constraint.matchMode,
        },
      ];
    });

    console.log('filter applied here ', event.filters);

    this.categoriesService
      .getCategories(page, size, this.searchValue, sortField, sortOrder, filters)
      .subscribe({
        next: (response: any) => {
          console.log(response);
          // this.toast.success('Categories fetched seccussfully.');
          this.categories.set(response.data);
          this.totalRecords = response.pagination.total;
          this.loading = false;
        },
        error: (error) => {
          console.log(error);
          if (error) {
            this.toast.error(error);
          } else {
            this.toast.error('Someting went wrong.');
          }
          this.loading = false;
        },
      });
  }
  detail_category(id: number) {
    console.log(id);
    this.categoriesService.getById(id).subscribe({
      next: (response: any) => {
        this.router.navigate(['/category/detail', id]);
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
}
