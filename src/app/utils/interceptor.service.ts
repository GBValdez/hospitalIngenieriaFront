import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '@auth/services/auth.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import Swal from 'sweetalert2';

// Servicio para la interceptación de las peticiones HTTP
@Injectable({
  providedIn: 'root',
})
export class InterceptorService implements HttpInterceptor {
  constructor(
    public spinnerSvc: NgxSpinnerService,
    private authSvc: AuthService
  ) {}
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Verificación de la existencia de un token de autenticación
    let headers;
    if (this.authSvc.hasAuth()) {
      headers = req.headers.set(
        'Authorization',
        `Bearer ${this.authSvc.getAuth()?.token}`
      );

      // Inclusión del token de autenticación en la cabecera de la petición
    }

    const cloneRequest = req.clone({
      headers: headers,
    });

    // Creación de un spinner para la visualización del proceso de carga
    this.spinnerSvc.show();

    return next.handle(cloneRequest).pipe(
      catchError((error) => {
        // Manejo de errores
        if (error.status === 401) {
          this.authSvc.logout();
        }
        console.log(error);
        if (error.error?.message) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.error.message,
          });
        }
        if (error.error?.errors) {
          const VALUES = Object.values(error.error.errors);
          const message = VALUES.join('\n');

          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
          });
        }
        return throwError(error);
      }),

      finalize(async () => {
        this.spinnerSvc.hide();
      })
    );
  }
}
