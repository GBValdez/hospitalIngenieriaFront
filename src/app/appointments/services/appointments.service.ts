import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonsSvcService } from '@utils/commons-svc.service';
import {
  AppointmentAvailabilityDto,
  AppointmentDto,
  AppointmentCreationDto,
  ReagendarDto,
} from '../interfaces/appointments.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppointmentsService extends CommonsSvcService<
  AppointmentDto,
  AppointmentCreationDto
> {
  constructor(protected override http: HttpClient) {
    super(http);
    this.url = 'api/citas';
  }

  cancelarCita(id: number): Observable<void> {
    return this.http.post<void>(`${this.urlBase}/cancelar`, { id });
  }

  reagendarCita(body: ReagendarDto): Observable<void> {
    return this.http.post<void>(`${this.urlBase}/reagendar`, body);
  }

  validarDisponibilidad(fechaHora: string): Observable<AppointmentAvailabilityDto> {
    return this.http.get<AppointmentAvailabilityDto>(
      `${this.urlBase}/disponibilidad`,
      { params: { fechaHora } },
    );
  }
}
