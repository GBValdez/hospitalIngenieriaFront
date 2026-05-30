import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class ErrorAlertService {
  show(error: unknown, fallback: string, title = 'Ocurrio un error'): void {
    Swal.fire(title, this.getMessage(error, fallback), 'error');
  }

  getMessage(error: unknown, fallback: string): string {
    const httpError = error as {
      status?: number;
      statusText?: string;
      message?: string;
      error?: unknown;
    };

    const backendError = httpError?.error;
    if (typeof backendError === 'string' && backendError.trim()) {
      return backendError.trim();
    }

    if (backendError && typeof backendError === 'object') {
      const body = backendError as {
        error?: string;
        message?: string;
        detail?: string;
        title?: string;
        errors?: Record<string, string[]>;
      };

      if (body.error?.trim()) {
        return body.error.trim();
      }

      if (body.message?.trim()) {
        return body.message.trim();
      }

      if (body.detail?.trim()) {
        return body.detail.trim();
      }

      if (body.errors) {
        const validationErrors = Object.values(body.errors).flat().filter(Boolean);
        if (validationErrors.length > 0) {
          return validationErrors.join('\n');
        }
      }

      if (body.title?.trim()) {
        return body.title.trim();
      }
    }

    if (httpError?.status) {
      return `${fallback} (${httpError.status}${httpError.statusText ? ` ${httpError.statusText}` : ''})`;
    }

    return httpError?.message || fallback;
  }
}
