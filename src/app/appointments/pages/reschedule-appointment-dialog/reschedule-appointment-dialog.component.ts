import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import {
  AppointmentAvailabilitySuggestionDto,
  AppointmentDto,
} from '../../interfaces/appointments.interface';
import { AppointmentsService } from '../../services/appointments.service';

export interface RescheduleAppointmentDialogResult {
  newStartDate: string;
}

@Component({
  selector: 'app-reschedule-appointment-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './reschedule-appointment-dialog.component.html',
  styleUrls: ['./reschedule-appointment-dialog.component.scss'],
})
export class RescheduleAppointmentDialogComponent {
  form: FormGroup;
  minDateTime = this.toDateTimeLocalValue(new Date());
  checkingAvailability = false;
  availabilityMessage = '';
  availabilityAvailable = false;
  availabilitySuggestions: AppointmentAvailabilitySuggestionDto[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public appointment: AppointmentDto,
    private appointmentsService: AppointmentsService,
    private dialogRef: MatDialogRef<RescheduleAppointmentDialogComponent>,
    private fb: FormBuilder,
  ) {
    const startDate = this.toDateTimeLocalValue(new Date(appointment.startDate));

    this.form = this.fb.group({
      newStartDate: [
        startDate,
        [Validators.required, this.futureDateValidator.bind(this)],
      ],
    });
  }

  get newStartDateControl(): AbstractControl | null {
    return this.form.get('newStartDate');
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  validarDisponibilidad(): void {
    this.availabilityMessage = '';
    this.availabilityAvailable = false;
    this.availabilitySuggestions = [];

    if (this.newStartDateControl?.invalid) {
      this.newStartDateControl.markAsTouched();
      return;
    }

    const newStartDate = this.form.value.newStartDate;
    if (!newStartDate) {
      return;
    }

    this.checkingAvailability = true;
    this.appointmentsService
      .validarDisponibilidad(
        new Date(newStartDate).toISOString(),
        this.appointment.doctorId,
        this.appointment.patientId,
        this.appointment.id,
      )
      .subscribe({
        next: (availability) => {
          this.availabilitySuggestions = availability.recomendaciones ?? [];
          this.availabilityAvailable = availability.disponible;
          this.availabilityMessage = availability.disponible
            ? 'Horario disponible.'
            : this.availabilitySuggestions.length > 0
              ? 'No hay disponibilidad para ese horario. Puedes usar una de estas recomendaciones.'
              : 'No hay disponibilidad para ese horario.';
          this.checkingAvailability = false;
        },
        error: (err) => {
          this.availabilityMessage = 'No se pudo consultar la disponibilidad.';
          this.availabilityAvailable = false;
          this.checkingAvailability = false;
          console.error(err);
        },
      });
  }

  aplicarRecomendacion(suggestion: AppointmentAvailabilitySuggestionDto): void {
    this.form.patchValue({
      newStartDate: this.toDateTimeLocalValue(new Date(suggestion.startDate)),
    });
    this.availabilityAvailable = true;
    this.availabilitySuggestions = [];
    this.availabilityMessage = 'Horario recomendado seleccionado.';
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close({
      newStartDate: this.form.value.newStartDate,
    } satisfies RescheduleAppointmentDialogResult);
  }

  private futureDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    return new Date(control.value) <= new Date()
      ? { pastDate: true }
      : null;
  }

  private toDateTimeLocalValue(date: Date): string {
    const pad = (value: number) => value.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate(),
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
