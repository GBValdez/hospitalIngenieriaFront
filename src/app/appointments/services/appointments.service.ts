import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonsSvcService } from '@utils/commons-svc.service';
import {
  AppointmentAvailabilityDto,
  AppointmentDto,
  AppointmentCreationDto,
  AppointmentResultDto,
  AppointmentStatusHistoryDto,
  EmergencyAppointmentDto,
  EmergencyPatientResultDto,
  ExamDto,
  ExamStatusHistoryDto,
  FinalizarExamDto,
  FinalizarCitaDto,
  InicioCitaDto,
  ReagendarDto,
  WalkInAppointmentDto,
} from '../interfaces/appointments.interface';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { pagDto, pagOptions } from '@utils/commons.interface';
import { fixedQueryParams } from '@utils/utils';

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

  iniciarCita(body: InicioCitaDto): Observable<AppointmentDto> {
    return this.http.post<AppointmentDto>(`${this.urlBase}/inicio`, body);
  }

  finalizarCita(body: FinalizarCitaDto): Observable<AppointmentDto> {
    return this.http.post<AppointmentDto>(`${this.urlBase}/finalizar`, body);
  }

  buscarPacienteEmergenciaPorDpi(dpi: string): Observable<EmergencyPatientResultDto> {
    return this.http.get<EmergencyPatientResultDto>(
      `${this.urlBase}/paciente-por-dpi/${dpi}`,
    );
  }

  atenderEmergencia(body: EmergencyAppointmentDto): Observable<AppointmentDto> {
    return this.http.post<AppointmentDto>(`${this.urlBase}/emergencia`, body);
  }

  registrarCitaPresencial(body: WalkInAppointmentDto): Observable<AppointmentDto> {
    return this.http.post<AppointmentDto>(`${this.urlBase}/presencial`, body);
  }

  getHistorialEstados(id: number): Observable<AppointmentStatusHistoryDto[]> {
    return this.http.get<AppointmentStatusHistoryDto[]>(
      `${this.urlBase}/${id}/historial-estados`,
    );
  }

  getResultadoCita(id: number): Observable<AppointmentResultDto> {
    return this.http.get<AppointmentResultDto>(`${this.urlBase}/${id}/resultado`);
  }

  getExamenes(opts?: pagOptions<object>): Observable<pagDto<ExamDto>> {
    const params = fixedQueryParams({
      ...(opts?.query ?? {}),
      pageSize: opts?.pageSize ?? undefined,
      pageNumber: opts?.pageNumber ?? undefined,
      all: opts?.all ?? undefined,
    });

    return this.http.get<pagDto<ExamDto>>(`${environment.api}/api/examenes`, {
      params,
    });
  }

  iniciarExamen(examId: number): Observable<ExamDto> {
    return this.http.post<ExamDto>(`${environment.api}/api/examenes/inicio`, {
      examId,
    });
  }

  finalizarExamen(body: FinalizarExamDto): Observable<ExamDto> {
    return this.http.post<ExamDto>(`${environment.api}/api/examenes/finalizar`, body);
  }

  getHistorialEstadosExamen(id: number): Observable<ExamStatusHistoryDto[]> {
    return this.http.get<ExamStatusHistoryDto[]>(
      `${environment.api}/api/examenes/${id}/historial-estados`,
    );
  }

  validarDisponibilidad(
    fechaHora: string,
    doctorId?: number,
    patientId?: number,
    excludeAppointmentId?: number,
  ): Observable<AppointmentAvailabilityDto> {
    const params: Record<string, string> = { fechaHora };
    if (doctorId) {
      params['doctorId'] = String(doctorId);
    }
    if (patientId) {
      params['patientId'] = String(patientId);
    }
    if (excludeAppointmentId) {
      params['excludeAppointmentId'] = String(excludeAppointmentId);
    }

    return this.http.get<AppointmentAvailabilityDto>(
      `${this.urlBase}/disponibilidad`,
      { params },
    );
  }
}
