import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { UnitService } from '../../service/unit-service';
import { ToastService } from '../../../toast/toast-service';
import { Iunit } from '../../../interface/iunit';

@Component({
  selector: 'app-unit-detail-controller',
  imports: [
     CardModule,
    ButtonModule,
    InputTextModule,
    FloatLabelModule,
    FormsModule,
    ConfirmDialogModule,
  ],
  templateUrl: './unit-detail-controller.html',
  styleUrl: './unit-detail-controller.css',
})
export class UnitDetailController {
  route = inject(ActivatedRoute);
  unitService = inject(UnitService);
  confirmationService = inject(ConfirmationService);
  toast = inject(ToastService);
  location = inject(Location);

  isEditing = signal(false);

  unit = signal<Iunit | undefined>(undefined);
  originalUnit = signal<Iunit | undefined>(undefined);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    this.unitService.getById(id).subscribe({
      next: (response: any) => {
        this.unit.set(response.data);
        this.originalUnit.set(response.data);
      },
      error: (error) => {
        console.error(error);
        this.toast.error(error?.error?.message || 'Something went wrong.');
      },
    });
  }

  updateName(name: string) {
    this.unit.update((u) => ({
      ...u!,
      name,
    }));
  }

  // Remove this function if your unit doesn't have short_name
  updateShortName(short_name: string) {
    this.unit.update((u) => ({
      ...u!,
      symbol:short_name,
    }));
  }

  enableEdit() {
    this.isEditing.set(true);
  }

  cancel() {
    this.isEditing.set(false);
    this.unit.set({ ...this.originalUnit()! });
  }
  save() {
    const unit = this.unit();

    if (!unit) return;

    this.unitService.update(Number(unit.id), unit).subscribe({
      next: (response: any) => {
        this.originalUnit.set({ ...unit });
        this.isEditing.set(false);
        this.toast.success(response.message || 'Unit updated successfully.');
      },
      error: (error) => {
        this.toast.error(error?.error?.message || 'Something went wrong.');
      },
    });
  }
  delete(event: MouseEvent, id: any) {
    this.confirmationService.confirm({
      target: event.currentTarget as HTMLElement,
      message: 'Do you want to delete this unit?',
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
        this.unitService.delete(id).subscribe({
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
