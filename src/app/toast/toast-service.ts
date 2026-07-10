import { Location } from '@angular/common';
import { inject, Service } from '@angular/core';
import { MessageService } from 'primeng/api';

@Service()
export class ToastService {
  private messageService = inject(MessageService);
  success(message: string, title = 'Success') {
    this.messageService.add({
      severity: 'success',
      summary: title,
      detail: message,
    });
  }

  error(message: string, title = 'info') {
    this.messageService.add({
      severity: 'info',
      summary: title,
      detail: message,
    });
  }
  warn(message: string, title = 'Warning') {
    this.messageService.add({
      severity: 'warn',
      summary: title,
      detail: message,
    });
  }

}
