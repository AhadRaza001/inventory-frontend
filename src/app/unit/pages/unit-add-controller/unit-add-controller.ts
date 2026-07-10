import { Component, inject, signal } from '@angular/core';
import { UnitService } from '../../service/unit-service';
import { ToastService } from '../../../toast/toast-service';
import { form, FormField, required } from '@angular/forms/signals';
import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-unit-add-controller',
  imports: [FloatLabelModule, MessageModule,ButtonModule, InputTextModule, FormField, InputTextModule,FormsModule,CardModule],
  templateUrl: './unit-add-controller.html',
  styleUrl: './unit-add-controller.css',
})
export class UnitAddController {
   unitService = inject(UnitService);
  toast = inject(ToastService);
  location = inject(Location);

  unit = signal({
    name: '',
    symbol: '',
  });

  unitForm = form(this.unit, (schema) => {
    required(schema.name, {
      when: ({ state }) => state.touched(),
      message: 'Unit name is required.',
    });
     required(schema.symbol, {
      when: ({ state }) => state.touched(),
      message: 'Short Name is required.',
    });
  });

  submit() {
    if (this.unitForm().invalid()) {
      this.unitForm().markAsTouched();
      return;
    }

    const formValue = this.unitForm().value();

    this.unitService.create(formValue).subscribe({
      next: (response: any) => {
        this.toast.success(response.message);
        this.location.back();
      },
       error: (err: HttpErrorResponse) => {
        this.toast.error(err.error?.message ?? 'Something went wrong');
      },
    });
  }

  back() {
    this.location.back();
  }
}
