import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { registerLocaleData } from '@angular/common';
import localePk from '@angular/common/locales/en-PK';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));

registerLocaleData(localePk);

