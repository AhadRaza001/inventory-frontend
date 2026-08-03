import { Component, inject, OnInit, signal } from '@angular/core';
import { CategoriesService } from '../../services/categories';
import { Icategory } from '../../../interface/Icategory';
import { TableCheckbox, TableHeaderCheckbox, TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { Router, RouterLink } from '@angular/router';
import { TableLazyLoadEvent } from 'primeng/table';
import { ToastService } from '../../../toast/toast-service';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog, ConfirmDialogClasses, ConfirmDialogModule } from 'primeng/confirmdialog';
import { Location } from '@angular/common';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
@Component({
  selector: 'app-categories',
  imports: [
    TableModule,
    FormsModule,
    FloatLabelModule,
    InputTextModule,
    ToolbarModule,
    ButtonModule,
    ConfirmDialogModule,
    RouterLink,
    IconField,
    InputIcon,
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
  selectedCategories: Icategory[] = [];
  confirmService = inject(ConfirmationService);
  location = inject(Location);

  clear(table: any) {
    table.clear();
    this.searchValue = '';
  }

  ngOnInit() {
    setTimeout(() => {
      console.log('loading state after 3s:', this.loading);
    }, 5000);
  }
  lastLazyEvent!: any;
  loadCategories(event: TableLazyLoadEvent) {
    const page = (event.first ?? 0) / (event.rows ?? 10) + 1;
    const size = event.rows ?? 10;
    console.log(event.filters);
    this.lastLazyEvent = event;
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
  deleteSelected() {
    if (this.selectedCategories.length === 0) {
      this.toast.warn('Please select at least one category.');
      return;
    }

    this.confirmService.confirm({
      message: `Do you want to delete ${this.selectedCategories.length} selected Categories?`,
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
        const ids = this.selectedCategories.map((c) => c.id);

        this.categoriesService.bulkDelete(ids).subscribe({
          next: (response: any) => {
            this.toast.success(response.message);
            this.selectedCategories = [];
            this.loadCategories(this.lastLazyEvent);
          },
          error: (err: any) => {
            this.toast.error(err.error?.message || 'Something went wrong.');
          },
        });
      },
    });
  }
  back() {
    this.location.back();
  }

  exportSelected() {
    const exportData = this.selectedCategories.map((category) => ({
      ID: category.id,
      Name: category.name,
      Description: category.description,
      CreatedAt: category.created_at,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Categories');

    XLSX.writeFile(workbook, 'categories.xlsx');
    this.selectedCategories = [];
  }
  exportPDF() {
    if (this.selectedCategories.length === 0) {
      this.toast.warn('Please select at least one category.');
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Inventory Management System', 14, 15);

    doc.setFontSize(15);
    doc.text('Category Report', 14, 25);

    doc.setFontSize(10);
    doc.text('Generated On: ' + new Date().toLocaleString(), 14, 35);

    doc.text('Developed By: Ahad Raza', 150, 15);
    autoTable(doc, {
      startY: 45,
      head: [['ID', 'Name', 'Description']],
      body: this.selectedCategories.map((c) => [c.id, c.name ?? '', c.description ?? '']),
    });

    const finalY = (doc as any).lastAutoTable.finalY;

    doc.text(`Total Records: ${this.selectedCategories.length}`, 14, finalY + 10);

    doc.save('Category_Report.pdf');
    this.selectedCategories = [];
  }
  refresh() {
    this.loadCategories(this.lastLazyEvent);
    this.selectedCategories = [];
  }
}
