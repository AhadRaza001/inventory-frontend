import { Component, inject, signal } from '@angular/core';
import { UnitService } from '../../service/unit-service';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../toast/toast-service';
import { Iunit } from '../../../interface/iunit';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { Location } from '@angular/common';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { ConfirmationService } from 'primeng/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-unit-controller',
  imports: [
    TableModule,
    FormsModule,
    FloatLabelModule,
    InputTextModule,
    ToolbarModule,
    ButtonModule,
    RouterLink,
    IconField,
    InputIcon,
  ],
  templateUrl: './unit-controller.html',
  styleUrl: './unit-controller.css',
})
export class UnitController {
  unitService = inject(UnitService);
  router = inject(Router);
  toast = inject(ToastService);
  location = inject(Location);

  units = signal<Iunit[]>([]);
  selecteditems: Iunit[] = [];
  confirmService = inject(ConfirmationService);
  loading = true;
  searchValue = '';
  totalRecords = 0;

  clear(table: any) {
    table.clear();
    this.searchValue = '';
  }
  ngOnInit() {
    setTimeout(() => {
      console.log('Loading State:', this.loading);
    }, 3000);
  }

  lastLazyEvent!: any;
  loadUnits(event: TableLazyLoadEvent) {
    const page = (event.first ?? 0) / (event.rows ?? 10) + 1;
    const size = event.rows ?? 10;
    this.lastLazyEvent = event;

    // Sorting
    const sortField = (event.sortField as string) ?? 'id';
    const sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';

    // Column Filters
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

    this.loading = true;

    this.unitService
      .getUnit(page, size, this.searchValue, sortField, sortOrder, filters)
      .subscribe({
        next: (response: any) => {
          this.units.set(response.data);
          this.totalRecords = response.pagination.total;
          this.loading = false;
        },
        error: (error) => {
          console.error(error);

          this.toast.error(error?.message ?? 'Something went wrong.');

          this.loading = false;
        },
      });
  }

  detailUnit(id: number) {
    this.unitService.getById(id).subscribe({
      next: () => {
        this.router.navigate(['/unit/detail', id]);
      },
      error: (error) => {
        console.error(error);
        this.toast.error(error?.message ?? 'Something went wrong.');
      },
    });
  }
  deleteSelected() {
    if (this.selecteditems.length === 0) {
      this.toast.warn('Please select at least one unit.');
      return;
    }

    this.confirmService.confirm({
      message: `Do you want to delete ${this.selecteditems.length} selected Units?`,
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
        const ids = this.selecteditems.map((c) => c.id);

        this.unitService.bulkDelete(ids).subscribe({
          next: (response: any) => {
            this.toast.success(response.message);
            this.selecteditems = [];
            this.loadUnits(this.lastLazyEvent);
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
    const exportData = this.selecteditems.map((unit) => ({
      ID: unit.id,
      Name: unit.name,
      Symbol: unit.symbol,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Units');

    XLSX.writeFile(workbook, 'units.xlsx');
    this.selecteditems = [];
  }
  exportPDF() {
    if (this.selecteditems.length === 0) {
      this.toast.warn('Please select at least one unit.');
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Inventory Management System', 14, 15);

    doc.setFontSize(15);
    doc.text('Units Report', 14, 25);

    doc.setFontSize(10);
    doc.text('Generated On: ' + new Date().toLocaleString(), 130, 120);

    doc.text('Developed By: Ahad Raza', 150, 15);
    autoTable(doc, {
      startY: 45,
      head: [['ID', 'Name', 'Symbol']],
      body: this.selecteditems.map((c) => [c.id, c.name ?? '', c.symbol ?? '']),
    });

    const finalY = (doc as any).lastAutoTable.finalY;

    doc.text(`Total Records: ${this.selecteditems.length}`, 14, finalY + 10);

    doc.save('Unit_Report.pdf');
    this.selecteditems = [];
  }
  refresh() {
    this.loadUnits(this.lastLazyEvent);
    this.selecteditems = [];
  }
}
