import { Component, inject } from '@angular/core';
import { LoadingService } from '../../loading/loading-service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-loading',
  imports: [ProgressSpinnerModule],
  templateUrl: './loading.html',
  styleUrl: './loading.css',
})
export class Loading {
    loadingService = inject(LoadingService);

}
