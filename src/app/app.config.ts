import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import Nora from '@primeuix/themes/nora';
import Material from '@primeuix/themes/material';
import Lara from '@primeuix/themes/lara';
import { ConfirmationService } from 'primeng/api';
import { MessageService } from 'primeng/api';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { loadingInterceptor } from './core/interceptors/loading-interceptor';
import { authInterceptor } from './core/interceptors/auth-interceptor';
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    ConfirmationService,
    // provideAnimationsAsync(),
    MessageService,
    ConfirmationService,

    providePrimeNG({
      theme: {
        preset: Aura,
      },
    }),
    //Interceptors
    provideHttpClient(withInterceptors([loadingInterceptor,authInterceptor])),
  ],
};
