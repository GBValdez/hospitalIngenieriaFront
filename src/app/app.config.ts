import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_DATE_FORMATS_PROVIDER } from '@utils/formatDate';
import { InterceptorService } from '@utils/interceptor.service';
import { MatMomentDateModule } from '@angular/material-moment-adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    importProvidersFrom(HttpClientModule, MatMomentDateModule),
    { provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true },
    APP_DATE_FORMATS_PROVIDER,
  ],
};
