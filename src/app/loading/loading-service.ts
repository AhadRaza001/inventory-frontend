import { Service, signal } from '@angular/core';

@Service()
export class LoadingService {
  loading = signal(false);
   private activeRequests = 0;
  show() {
    this.activeRequests++;
    if (this.activeRequests === 1) {
    this.loading.set(true);
}
  }

  hide() {
     if (this.activeRequests > 0) {
        this.activeRequests--;
    }
     if (this.activeRequests === 0) {
    this.loading.set(false);
     }
  }
}
