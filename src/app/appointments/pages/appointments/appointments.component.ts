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
  AppointmentAvailabilitySuggestionDto,
  AppointmentStatusHistoryDto,
  ExamDto,
  ExamStatusHistoryDto,
  ReagendarDto,
} from '../../interfaces/appointments.interface';
import { InicioCitaComponent } from '../inicio-cita/inicio-cita.component';
import {
  RescheduleAppointmentDialogComponent,
  RescheduleAppointmentDialogResult,
} from '../reschedule-appointment-dialog/reschedule-appointment-dialog.component';
import { AppointmentsService } from '../../services/appointments.service';
import { FinalizarCitaComponent } from '../finalizar-cita/finalizar-cita.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, MatPaginatorModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss'],
})
export class AppointmentsComponent implements OnInit {
  @ViewChild('appointmentDialog') appointmentDialog!: TemplateRef<unknown>;
  @ViewChild('historyDialog') historyDialog!: TemplateRef<unknown>;

  appointments: AppointmentDto[] = [];
  exams: ExamDto[] = [];
  statusHistory: AppointmentStatusHistoryDto[] = [];
  examStatusHistory: ExamStatusHistoryDto[] = [];
  activeTab: 'appointments' | 'exams' = 'appointments';
  loading = false;
  loadingExams = false;
  loadingHistory = false;
  saving = false;
  checkingAvailability = false;
  error = '';
  success = '';
  pageNumber = 1;
  pageSize = 10;
  totalAppointments = 0;
  examPageNumber = 1;
  examPageSize = 10;
  totalExams = 0;
  minDateTime = this.toDateTimeLocalValue(new Date());
  availabilityMessage = '';
  availabilitySuggestions: AppointmentAvailabilitySuggestionDto[] = [];
  selectedDoctorId?: number;
  selectedHistoryAppointment?: AppointmentDto;
  selectedHistoryExam?: ExamDto;
  private appointmentDialogRef?: MatDialogRef<unknown>;
  private historyDialogRef?: MatDialogRef<unknown>;

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
    this.loadExams();
  }

  get startDateControl(): AbstractControl | null {
    return this.appointmentForm.get('startDate');
  }

  get reasonControl(): AbstractControl | null {
    return this.appointmentForm.get('reason');
  }

  get canStartAppointment(): boolean {
    return this.authService.hasRoles(['NURSE', 'ADMINISTRATOR']);
  }

  get canFinishAppointment(): boolean {
    return this.authService.hasRoles(['DOCTOR', 'ADMINISTRATOR']);
  }

  get canScheduleAppointment(): boolean {
    return this.authService.hasRoles(['userNormal']);
  }

  get canManageExam(): boolean {
    return this.authService.hasRoles(['LAB_ATTENDANT', 'ADMINISTRATOR']);
  }

  get currentHistoryItems(): Array<AppointmentStatusHistoryDto | ExamStatusHistoryDto> {
    return this.selectedHistoryExam ? this.examStatusHistory : this.statusHistory;
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

  changeExamPagination(event: PageEvent): void {
    this.examPageNumber = event.pageIndex + 1;
    this.examPageSize = event.pageSize;
    this.loadExams(this.examPageNumber, this.examPageSize);
  }

  setTab(tab: 'appointments' | 'exams'): void {
    this.activeTab = tab;
  }

  loadExams(pageNumber = 1, pageSize = 10): void {
    this.loadingExams = true;
    this.error = '';
    this.appointmentsService.getExamenes({ pageNumber, pageSize }).subscribe({
      next: (result) => {
        this.exams = result.items;
        this.totalExams = result.total;
        this.loadingExams = false;
      },
      error: (err) => {
        this.error = 'No se pudo cargar los examenes.';
        this.loadingExams = false;
        console.error(err);
      },
    });
  }

  abrirFormularioAgendar(): void {
    this.cancelarAgendamiento(false);
    this.appointmentDialogRef = this.dialog.open(this.appointmentDialog, {
      width: '520px',
      maxWidth: 'calc(100vw - 32px)',
      autoFocus: false,
    });
  }

  async agendarCita(): Promise<void> {
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

    const result = await Swal.fire({
      title: 'Deseas agendar esta cita?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Agendar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) {
      return;
    }

    const patientId = auth.patientId;
    const startDate = this.appointmentForm.value.startDate ?? '';
    const startDateUtc = this.toUtcIsoString(startDate);
    this.saving = true;
    this.appointmentsService.validarDisponibilidad(
      startDateUtc,
      undefined,
      patientId,
    ).subscribe({
      next: (availability) => {
        if (!availability.disponible || !availability.doctorId) {
            this.error = 'No hay disponibilidad para la fecha y hora seleccionada.';
            this.availabilitySuggestions = availability.recomendaciones ?? [];
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
            Swal.fire('Cita agendada', 'La cita fue agendada correctamente.', 'success');
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
    this.availabilitySuggestions = [];
    this.selectedDoctorId = undefined;
    if (closeDialog) {
      this.appointmentDialogRef?.close();
    }
  }

  validarDisponibilidad(): void {
    this.availabilityMessage = '';
    this.availabilitySuggestions = [];
    this.selectedDoctorId = undefined;

    if (this.startDateControl?.invalid) {
      this.startDateControl.markAsTouched();
      return;
    }

    const startDate = this.appointmentForm.value.startDate;
    if (!startDate) {
      return;
    }

    const patientId = this.authService.getAuth()?.patientId;
    this.checkingAvailability = true;
    this.appointmentsService.validarDisponibilidad(
      this.toUtcIsoString(startDate),
      undefined,
      patientId,
    ).subscribe({
      next: (availability) => {
        this.selectedDoctorId = availability.doctorId;
        this.availabilitySuggestions = availability.recomendaciones ?? [];
        this.availabilityMessage = availability.disponible
          ? 'Horario disponible.'
          : this.availabilitySuggestions.length > 0
            ? 'No hay disponibilidad para ese horario. Puedes usar una de estas recomendaciones.'
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

  aplicarRecomendacion(suggestion: AppointmentAvailabilitySuggestionDto): void {
    this.appointmentForm.patchValue({
      startDate: this.toDateTimeLocalValue(new Date(suggestion.startDate)),
    });
    this.selectedDoctorId = suggestion.doctorId;
    this.availabilitySuggestions = [];
    this.availabilityMessage = 'Horario recomendado seleccionado.';
  }

  async cancelarCita(appointment: AppointmentDto): Promise<void> {
    const result = await Swal.fire({
      title: 'Deseas cancelar esta cita?',
      text: appointment.reason,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Cancelar cita',
      cancelButtonText: 'Volver',
    });

    if (!result.isConfirmed) {
      return;
    }

    this.appointmentsService.cancelarCita(appointment.id).subscribe({
      next: () => {
        this.success = 'Cita cancelada correctamente.';
        Swal.fire('Cita cancelada', 'La cita fue cancelada correctamente.', 'success');
        this.loadAppointments(this.pageNumber, this.pageSize);
      },
      error: (err) => {
        this.error = 'No se pudo cancelar la cita.';
        console.error(err);
      },
    });
  }

  reagendarCita(appointment: AppointmentDto): void {
    const dialogRef = this.dialog.open(RescheduleAppointmentDialogComponent, {
      width: '560px',
      maxWidth: 'calc(100vw - 32px)',
      autoFocus: false,
      data: appointment,
    });

    dialogRef.afterClosed().subscribe(
      async (result?: RescheduleAppointmentDialogResult) => {
        if (!result) {
          return;
        }

        const confirmation = await Swal.fire({
          title: 'Deseas reagendar esta cita?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Reagendar',
          cancelButtonText: 'Cancelar',
        });

        if (!confirmation.isConfirmed) {
          return;
        }

        const payload: ReagendarDto = {
          citaId: appointment.id,
          newStartDate: this.toUtcIsoString(result.newStartDate),
        };

        this.appointmentsService.reagendarCita(payload).subscribe({
          next: () => {
            this.success = 'Cita reagendada correctamente.';
            Swal.fire('Cita reagendada', 'La cita fue reagendada correctamente.', 'success');
            this.loadAppointments(this.pageNumber, this.pageSize);
          },
          error: (err) => {
            this.error = 'No se pudo reagendar la cita. Verifica el horario.';
            console.error(err);
          },
        });
      },
    );
  }

  abrirInicioCita(appointment: AppointmentDto): void {
    if (!this.canStartAppointmentByStatus(appointment)) {
      this.error = 'Solo se pueden iniciar citas con estado ACTIVO o REAGENDAR.';
      return;
    }

    if (!this.isWithinStartWindow(appointment)) {
      this.error = 'La cita solo puede iniciarse desde la hora programada hasta 10 minutos despues.';
      return;
    }

    const dialogRef = this.dialog.open(InicioCitaComponent, {
      width: '680px',
      maxWidth: 'calc(100vw - 32px)',
      autoFocus: false,
      data: appointment,
    });

    dialogRef.afterClosed().subscribe((saved) => {
      if (saved) {
        this.success = 'Inicio de cita registrado correctamente.';
        this.loadAppointments(this.pageNumber, this.pageSize);
      }
    });
  }

  finalizarCita(appointment: AppointmentDto): void {
    if (!this.canFinishAppointmentByStatus(appointment)) {
      this.error = 'Solo se pueden finalizar citas con estado EN_CURSO.';
      return;
    }

    const dialogRef = this.dialog.open(FinalizarCitaComponent, {
      width: '820px',
      maxWidth: 'calc(100vw - 32px)',
      autoFocus: false,
      data: appointment,
    });

    dialogRef.afterClosed().subscribe((saved) => {
      if (saved) {
        this.success = 'Cita finalizada correctamente.';
        this.loadAppointments(this.pageNumber, this.pageSize);
        this.loadExams(this.examPageNumber, this.examPageSize);
      }
    });
  }

  isWithinStartWindow(appointment: AppointmentDto): boolean {
    const now = new Date();
    const startDate = new Date(appointment.startDate);
    const maxArrivalDate = new Date(startDate.getTime() + 10 * 60 * 1000);

    return now >= startDate && now <= maxArrivalDate;
  }

  canCancelAppointment(appointment: AppointmentDto): boolean {
    return appointment.status === 'ACTIVO' || appointment.status === 'REAGENDAR';
  }

  canStartAppointmentByStatus(appointment: AppointmentDto): boolean {
    return appointment.status === 'ACTIVO' || appointment.status === 'REAGENDAR';
  }

  canFinishAppointmentByStatus(appointment: AppointmentDto): boolean {
    return appointment.status === 'EN_CURSO';
  }

  canStartExamByStatus(exam: ExamDto): boolean {
    return exam.status === 'ACTIVO' && this.isWithinExamStartWindow(exam);
  }

  canFinishExamByStatus(exam: ExamDto): boolean {
    return exam.status === 'EN_CURSO';
  }

  isWithinExamStartWindow(exam: ExamDto): boolean {
    const now = new Date();
    const startDate = new Date(exam.startDate);
    const maxStartDate = new Date(startDate.getTime() + 10 * 60 * 1000);

    return now >= startDate && now <= maxStartDate;
  }

  async iniciarExamen(exam: ExamDto): Promise<void> {
    if (!this.canStartExamByStatus(exam)) {
      this.error = 'Solo se pueden iniciar examenes ACTIVO desde la hora programada hasta 10 minutos despues.';
      return;
    }

    const result = await Swal.fire({
      title: 'Deseas iniciar este examen?',
      text: exam.examTypeName,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Iniciar examen',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) {
      return;
    }

    this.appointmentsService.iniciarExamen(exam.id).subscribe({
      next: () => {
        this.success = 'Examen iniciado correctamente.';
        Swal.fire('Examen iniciado', 'El examen fue iniciado correctamente.', 'success');
        this.loadExams(this.examPageNumber, this.examPageSize);
      },
      error: (err) => {
        this.error = err?.error?.error || err?.error?.message || 'No se pudo iniciar el examen.';
        console.error(err);
      },
    });
  }

  async finalizarExamen(exam: ExamDto): Promise<void> {
    if (!this.canFinishExamByStatus(exam)) {
      this.error = 'Solo se pueden finalizar examenes con estado EN_CURSO.';
      return;
    }

    const result = await Swal.fire({
      title: 'Resultado del examen',
      input: 'textarea',
      inputPlaceholder: 'Escribe el resultado',
      inputAttributes: {
        maxlength: '1000',
      },
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Finalizar examen',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value?.trim()) {
          return 'El resultado es obligatorio.';
        }
        return undefined;
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    this.appointmentsService.finalizarExamen(exam.id, result.value.trim()).subscribe({
      next: () => {
        this.success = 'Examen finalizado correctamente.';
        Swal.fire('Examen finalizado', 'El examen fue finalizado correctamente.', 'success');
        this.loadExams(this.examPageNumber, this.examPageSize);
      },
      error: (err) => {
        this.error = err?.error?.error || err?.error?.message || 'No se pudo finalizar el examen.';
        console.error(err);
      },
    });
  }

  verHistorialEstados(appointment: AppointmentDto): void {
    this.selectedHistoryAppointment = appointment;
    this.selectedHistoryExam = undefined;
    this.statusHistory = [];
    this.examStatusHistory = [];
    this.loadingHistory = true;
    this.historyDialogRef = this.dialog.open(this.historyDialog, {
      width: '560px',
      maxWidth: 'calc(100vw - 32px)',
      autoFocus: false,
    });

    this.appointmentsService.getHistorialEstados(appointment.id).subscribe({
      next: (history) => {
        this.statusHistory = history;
        this.loadingHistory = false;
      },
      error: (err) => {
        this.error = 'No se pudo cargar el historial de la cita.';
        this.loadingHistory = false;
        console.error(err);
      },
    });
  }

  verHistorialEstadosExamen(exam: ExamDto): void {
    this.selectedHistoryExam = exam;
    this.selectedHistoryAppointment = undefined;
    this.examStatusHistory = [];
    this.statusHistory = [];
    this.loadingHistory = true;
    this.historyDialogRef = this.dialog.open(this.historyDialog, {
      width: '560px',
      maxWidth: 'calc(100vw - 32px)',
      autoFocus: false,
    });

    this.appointmentsService.getHistorialEstadosExamen(exam.id).subscribe({
      next: (history) => {
        this.examStatusHistory = history;
        this.loadingHistory = false;
      },
      error: (err) => {
        this.error = 'No se pudo cargar el historial del examen.';
        this.loadingHistory = false;
        console.error(err);
      },
    });
  }

  cerrarHistorialEstados(): void {
    this.selectedHistoryAppointment = undefined;
    this.selectedHistoryExam = undefined;
    this.historyDialogRef?.close();
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
