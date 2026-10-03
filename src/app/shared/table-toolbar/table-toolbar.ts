import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';

@Component({
  selector: 'app-table-toolbar',
  imports: [
    FormsModule,
    RouterLink,
    ToolbarModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    FloatLabelModule,
  ],
  templateUrl: './table-toolbar.html',
  styleUrl: './table-toolbar.css',
})
export class TableToolbar {
  // Search
  @Input() searchPlaceholder = 'Search...';
  @Input() searchValue = '';

  // Buttons
  @Input() showBack = true;
  @Input() showNew = true;
  @Input() showDelete = true;
  @Input() showExcel = true;
  @Input() showPdf = true;
  @Input() showRefresh = true;

  // Button disabled states
  @Input() deleteDisabled = false;
  @Input() excelDisabled = false;
  @Input() pdfDisabled = false;


  // Events
  @Output() searchChange = new EventEmitter<string>();
  @Output() backClick = new EventEmitter<void>();
  @Output() newClick = new EventEmitter<void>();
  @Output() deleteClick = new EventEmitter<void>();
  @Output() excelClick = new EventEmitter<void>();
  @Output() pdfClick = new EventEmitter<void>();
  @Output() refreshClick = new EventEmitter<void>();

  onSearch(value: string): void {
    this.searchValue = value;
    this.searchChange.emit(value);
  }
  onBack(): void {
    this.backClick.emit();
  }

  onNew(): void {
    this.newClick.emit();
  }

  onDelete(): void {
    this.deleteClick.emit();
  }

  onExcel(): void {
    this.excelClick.emit();
  }

  onPdf(): void {
    this.pdfClick.emit();
  }

  onRefresh(): void {
    this.refreshClick.emit();
  }
}
