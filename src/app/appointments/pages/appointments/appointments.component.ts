import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '@auth/services/auth.service';
import {
  AppointmentCreationDto,
  AppointmentDto,
  ReagendarDto,
} from '../../interfaces/appointments.interface';
import { AppointmentsService } from '../../services/appointments.service';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, MatPaginatorModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss'],
})
export class AppointmentsComponent implements OnInit {
  @ViewChild('appointmentDialog') appointmentDialog!: TemplateRef<unknown>;

  appointments: AppointmentDto[] = [];
  loading = false;
  saving = false;
  checkingAvailability = false;
  error = '';
  success = '';
  pageNumber = 1;
  pageSize = 10;
  totalAppointments = 0;
  minDateTime = this.toDateTimeLocalValue(new Date());
  availabilityMessage = '';
  selectedDoctorId?: number;
  private appointmentDialogRef?: MatDialogRef<unknown>;

  appointmentForm: FormGroup;

  constructor(
    private appointmentsService: AppointmentsService,
    private authService: AuthService,
    private fb: FormBuilder,
    private dialog: MatDialog,
  ) {
    this.appointmentForm = this.fb.group({
      startDate: [
        '',
        [Validators.required, this.notPastDateValidator.bind(this)],
      ],
      reason: [
        '',
        [Validators.required, Validators.minLength(1), Validators.maxLength(250)],
      ],
    });
  }

  ngOnInit(): void {
    this.loadAppointments();
  }

  get startDateControl(): AbstractControl | null {
    return this.appointmentForm.get('startDate');
  }

  get reasonControl(): AbstractControl | null {
    return this.appointmentForm.get('reason');
  }

  loadAppointments(pageNumber = 1, pageSize = 10): void {
    this.loading = true;
    this.error = '';
    this.appointmentsService.get({ pageNumber, pageSize }).subscribe({
      next: (result) => {
        this.appointments = result.items;
        this.totalAppointments = result.total;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'No se pudo cargar las citas.';
        this.loading = false;
        console.error(err);
      },
    });
  }

  changePagination(event: PageEvent): void {
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadAppointments(this.pageNumber, this.pageSize);
  }

  abrirFormularioAgendar(): void {
    this.cancelarAgendamiento(false);
    this.appointmentDialogRef = this.dialog.open(this.appointmentDialog, {
      width: '520px',
      maxWidth: 'calc(100vw - 32px)',
      autoFocus: false,
    });
  }

  agendarCita(): void {
    this.success = '';
    this.error = '';

    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }

    const auth = this.authService.getAuth();
    if (!auth) {
      this.error = 'Debes iniciar sesion para agendar una cita.';
      return;
    }

    if (!auth.patientId) {
      this.error = 'No se encontro un paciente asociado a tu usuario.';
      return;
    }

    const patientId = auth.patientId;
    const startDate = this.appointmentForm.value.startDate ?? '';
    const startDateUtc = this.toUtcIsoString(startDate);
    this.saving = true;
    this.appointmentsService.validarDisponibilidad(startDateUtc).subscribe({
      next: (availability) => {
        if (!availability.disponible || !availability.doctorId) {
          this.error = 'No hay disponibilidad para la fecha y hora seleccionada.';
          this.saving = false;
          return;
        }

        const payload: AppointmentCreationDto = {
          scheduledDate: startDateUtc,
          startDate: startDateUtc,
          endDate: this.addMinutesAsUtcIsoString(startDate, 30),
          reason: this.appointmentForm.value.reason?.trim() ?? '',
          isEmergency: false,
          doctorId: availability.doctorId,
          patientId,
        };

        this.appointmentsService.post(payload).subscribe({
          next: () => {
            this.success = 'Cita agendada correctamente.';
            this.appointmentForm.reset();
            this.availabilityMessage = '';
            this.selectedDoctorId = undefined;
            this.saving = false;
            this.appointmentDialogRef?.close();
            this.loadAppointments(this.pageNumber, this.pageSize);
          },
          error: (err) => {
            this.error = 'No se pudo agendar la cita.';
            this.saving = false;
            console.error(err);
          },
        });
      },
      error: (err) => {
        this.error = 'No se pudo validar la disponibilidad.';
        this.saving = false;
        console.error(err);
      },
    });
  }

  cancelarAgendamiento(closeDialog = true): void {
    this.appointmentForm.reset();
    this.success = '';
    this.error = '';
    this.availabilityMessage = '';
    this.selectedDoctorId = undefined;
    if (closeDialog) {
      this.appointmentDialogRef?.close();
    }
  }

  validarDisponibilidad(): void {
    this.availabilityMessage = '';
    this.selectedDoctorId = undefined;

    if (this.startDateControl?.invalid) {
      this.startDateControl.markAsTouched();
      return;
    }

    const startDate = this.appointmentForm.value.startDate;
    if (!startDate) {
      return;
    }

    this.checkingAvailability = true;
    this.appointmentsService.validarDisponibilidad(
      this.toUtcIsoString(startDate),
    ).subscribe({
      next: (availability) => {
        this.selectedDoctorId = availability.doctorId;
        this.availabilityMessage = availability.disponible
          ? 'Horario disponible.'
          : 'No hay disponibilidad para ese horario.';
        this.checkingAvailability = false;
      },
      error: (err) => {
        this.availabilityMessage = 'No se pudo consultar la disponibilidad.';
        this.checkingAvailability = false;
        console.error(err);
      },
    });
  }

  cancelarCita(appointment: AppointmentDto): void {
    const confirmed = window.confirm(
      'Deseas cancelar esta cita? Esta accion no se puede deshacer.',
    );
    if (!confirmed) {
      return;
    }

    this.appointmentsService.cancelarCita(appointment.id).subscribe({
      next: () => this.loadAppointments(),
      error: (err) => {
        this.error = 'No se pudo cancelar la cita.';
        console.error(err);
      },
    });
  }

  reagendarCita(appointment: AppointmentDto): void {
    const newStartDate = window.prompt(
      'Ingresa la nueva fecha y hora de inicio en formato YYYY-MM-DDTHH:mm',
      appointment.startDate,
    );
    if (!newStartDate) {
      return;
    }

    const newEndDate = window.prompt(
      'Ingresa la nueva fecha y hora de fin en formato YYYY-MM-DDTHH:mm',
      appointment.endDate,
    );
    if (!newEndDate) {
      return;
    }

    const payload: ReagendarDto = {
      citaId: appointment.id,
      newStartDate: this.toUtcIsoString(newStartDate),
      newEndDate: this.toUtcIsoString(newEndDate),
    };

    this.appointmentsService.reagendarCita(payload).subscribe({
      next: () => this.loadAppointments(),
      error: (err) => {
        this.error = 'No se pudo reagendar la cita. Verifica el horario.';
        console.error(err);
      },
    });
  }

  private addMinutes(dateTime: string, minutes: number): string {
    const date = new Date(dateTime);
    date.setMinutes(date.getMinutes() + minutes);
    return this.toDateTimeLocalValue(date);
  }

  private addMinutesAsUtcIsoString(dateTime: string, minutes: number): string {
    const date = new Date(dateTime);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toISOString();
  }

  private toUtcIsoString(dateTime: string): string {
    return new Date(dateTime).toISOString();
  }

  private notPastDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const selectedDate = new Date(control.value);
    return selectedDate < new Date() ? { pastDate: true } : null;
  }

  private toDateTimeLocalValue(date: Date): string {
    const pad = (value: number) => value.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate(),
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
