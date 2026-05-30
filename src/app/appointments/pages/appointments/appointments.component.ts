import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';
import { AuthService } from '@auth/services/auth.service';
import { catalogueInterface } from '@utils/commons.interface';
import { CatalogueService } from '@utils/modules/catalogues/services/catalogue.service';
import {
  AppointmentCreationDto,
  AppointmentDto,
  AppointmentAvailabilitySuggestionDto,
  AppointmentStatusHistoryDto,
  EmergencyAppointmentDto,
  EmergencyPatientResultDto,
  ExamDto,
  ExamStatusHistoryDto,
  FinalizarExamDto,
  ReagendarDto,
} from '../../interfaces/appointments.interface';
import { InicioCitaComponent } from '../inicio-cita/inicio-cita.component';
import {
  RescheduleAppointmentDialogComponent,
  RescheduleAppointmentDialogResult,
} from '../reschedule-appointment-dialog/reschedule-appointment-dialog.component';
import { AppointmentsService } from '../../services/appointments.service';
import { FinalizarCitaComponent } from '../finalizar-cita/finalizar-cita.component';
import { ExamTypeDiagnosisDto } from 'src/app/exam-type-diagnoses/interfaces/exam-type-diagnosis.interface';
import { ExamTypeDiagnosisService } from 'src/app/exam-type-diagnoses/services/exam-type-diagnosis.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [
    CommonModule,
    MatPaginatorModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatSelectModule,
  ],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss'],
})
export class AppointmentsComponent implements OnInit {
  @ViewChild('appointmentDialog') appointmentDialog!: TemplateRef<unknown>;
  @ViewChild('emergencyDialog') emergencyDialog!: TemplateRef<unknown>;
  @ViewChild('historyDialog') historyDialog!: TemplateRef<unknown>;
  @ViewChild('finishExamDialog') finishExamDialog!: TemplateRef<unknown>;

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
  selectedFinishExam?: ExamDto;
  emergencyPatient?: EmergencyPatientResultDto;
  emergencyPatientSearched = false;
  searchingEmergencyPatient = false;
  sexOptions: catalogueInterface[] = [];
  nationalityOptions: catalogueInterface[] = [];
  allowedExamDiagnoses: ExamTypeDiagnosisDto[] = [];
  private appointmentDialogRef?: MatDialogRef<unknown>;
  private emergencyDialogRef?: MatDialogRef<unknown>;
  private historyDialogRef?: MatDialogRef<unknown>;
  private finishExamDialogRef?: MatDialogRef<unknown>;

  filterForm: FormGroup;
  examFilterForm: FormGroup;
  appointmentForm: FormGroup;
  emergencyForm: FormGroup;
  finishExamForm: FormGroup;

  constructor(
    private appointmentsService: AppointmentsService,
    private examTypeDiagnosisService: ExamTypeDiagnosisService,
    private catalogueService: CatalogueService,
    private authService: AuthService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private router: Router,
  ) {
    this.filterForm = this.fb.group({
      reason: [''],
      dpi: [''],
      estado: [''],
      startDateFrom: [''],
      startDateTo: [''],
    });

    this.examFilterForm = this.fb.group({
      dpi: [''],
    });

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

    this.emergencyForm = this.fb.group({
      dpi: [
        '',
        [Validators.required, Validators.minLength(13), Validators.maxLength(13)],
      ],
      reason: [
        'Emergencia',
        [Validators.required, Validators.maxLength(250)],
      ],
      name: [''],
      direction: [''],
      birthday: [''],
      sexId: [null],
      nationalityId: [null],
    });

    this.finishExamForm = this.fb.group({
      results: ['', [Validators.required, Validators.maxLength(1000)]],
      diseaseOrInjuryIds: [[], [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadAppointments();
    this.loadExams();
    this.emergencyForm.get('dpi')?.valueChanges.subscribe(() => {
      this.emergencyPatient = undefined;
      this.emergencyPatientSearched = false;
      this.clearEmergencyPatientValidators();
    });
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

  get canAttendEmergency(): boolean {
    return this.authService.hasRoles(['NURSE', 'ADMINISTRATOR']);
  }

  get canFilterByDpi(): boolean {
    return this.authService.hasRoles(['NURSE', 'ADMINISTRATOR']);
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
    this.pageNumber = pageNumber;
    this.pageSize = pageSize;
    this.appointmentsService.get({
      pageNumber,
      pageSize,
      query: this.mapAppointmentFilters(),
    }).subscribe({
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
    this.loadAppointments(event.pageIndex + 1, event.pageSize);
  }

  searchAppointments(): void {
    this.loadAppointments(1, this.pageSize);
  }

  cleanAppointmentFilters(): void {
    this.filterForm.reset({
      reason: '',
      dpi: '',
      estado: '',
      startDateFrom: '',
      startDateTo: '',
    });
    this.loadAppointments(1, this.pageSize);
  }

  searchExams(): void {
    this.loadExams(1, this.examPageSize);
  }

  cleanExamFilters(): void {
    this.examFilterForm.reset({
      dpi: '',
    });
    this.loadExams(1, this.examPageSize);
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
    this.appointmentsService.getExamenes({
      pageNumber,
      pageSize,
      query: this.mapExamFilters(),
    }).subscribe({
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

    const payment = await Swal.fire({
      title: 'Simulacion de pago',
      text: 'Para agendar la cita debes confirmar el pago de la consulta.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Pagar y continuar',
      cancelButtonText: 'Cancelar',
    });

    if (!payment.isConfirmed) {
      this.error = 'El agendamiento fue cancelado porque no se confirmo el pago.';
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

  abrirAtencionEmergencia(): void {
    this.resetEmergencyForm(false);
    this.loadEmergencyCatalogues();
    this.emergencyDialogRef = this.dialog.open(this.emergencyDialog, {
      width: '680px',
      maxWidth: 'calc(100vw - 32px)',
      autoFocus: false,
    });
  }

  buscarPacienteEmergencia(): void {
    this.success = '';
    this.error = '';
    this.emergencyPatient = undefined;
    this.emergencyPatientSearched = false;
    this.clearEmergencyPatientValidators();

    const dpiControl = this.emergencyForm.get('dpi');
    if (!dpiControl || dpiControl.invalid) {
      dpiControl?.markAsTouched();
      return;
    }

    const dpi = String(dpiControl.value).trim();
    this.searchingEmergencyPatient = true;
    this.appointmentsService.buscarPacienteEmergenciaPorDpi(dpi).subscribe({
      next: (patient) => {
        this.emergencyPatient = patient;
        this.emergencyPatientSearched = true;
        this.searchingEmergencyPatient = false;
      },
      error: (err) => {
        if (err?.status === 404) {
          this.emergencyPatientSearched = true;
          this.setEmergencyPatientValidators();
        } else {
          this.error = err?.error?.error || err?.error?.message || 'No se pudo buscar el paciente.';
        }
        this.searchingEmergencyPatient = false;
      },
    });
  }

  async atenderEmergencia(): Promise<void> {
    this.success = '';
    this.error = '';

    if (!this.emergencyPatientSearched) {
      this.error = 'Busca el paciente por DPI antes de atender la emergencia.';
      this.emergencyForm.get('dpi')?.markAsTouched();
      return;
    }

    if (!this.emergencyPatient && this.emergencyPatientSearched) {
      this.setEmergencyPatientValidators();
    }

    if (this.emergencyForm.invalid) {
      this.emergencyForm.markAllAsTouched();
      return;
    }

    const payment = await Swal.fire({
      title: 'Simulacion de pago',
      text: 'Confirma el pago para registrar la atencion de emergencia.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Pagar emergencia',
      cancelButtonText: 'Cancelar',
    });

    if (!payment.isConfirmed) {
      this.error = 'La emergencia no fue registrada porque no se confirmo el pago.';
      return;
    }

    const result = await Swal.fire({
      title: 'Deseas atender esta emergencia?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Atender',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) {
      return;
    }

    const value = this.emergencyForm.value;
    const payload: EmergencyAppointmentDto = {
      dpi: String(value.dpi).trim(),
      reason: String(value.reason).trim(),
    };

    if (!this.emergencyPatient) {
      payload.patient = {
        name: String(value.name).trim(),
        direction: String(value.direction).trim(),
        birthday: value.birthday,
        sexId: Number(value.sexId),
        nationalityId: Number(value.nationalityId),
      };
    }

    this.saving = true;
    this.appointmentsService.atenderEmergencia(payload).subscribe({
      next: () => {
        this.success = 'Emergencia registrada e iniciada correctamente.';
        this.saving = false;
        this.emergencyDialogRef?.close();
        Swal.fire('Emergencia iniciada', 'La cita de emergencia quedo en curso.', 'success');
        this.loadAppointments(this.pageNumber, this.pageSize);
      },
      error: (err) => {
        this.error = err?.error?.error || err?.error?.message || 'No se pudo atender la emergencia.';
        this.saving = false;
        console.error(err);
      },
    });
  }

  cancelarEmergencia(closeDialog = true): void {
    this.resetEmergencyForm(closeDialog);
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

  canSeeAppointmentResult(appointment: AppointmentDto): boolean {
    return appointment.status === 'FINALIZADA';
  }

  verResultadoCita(appointment: AppointmentDto): void {
    this.router.navigate(['/session/appointments', appointment.id, 'result']);
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

    this.selectedFinishExam = exam;
    this.allowedExamDiagnoses = [];
    this.finishExamForm.reset({
      results: '',
      diseaseOrInjuryIds: [],
    });

    this.examTypeDiagnosisService.get({ examTypeId: exam.examTypeId }).subscribe({
      next: (diagnoses) => {
        this.allowedExamDiagnoses = diagnoses;
        this.finishExamDialogRef = this.dialog.open(this.finishExamDialog, {
          width: '680px',
          maxWidth: 'calc(100vw - 32px)',
          autoFocus: false,
        });
      },
      error: (err) => {
        this.error = 'No se pudieron cargar los diagnosticos permitidos para el examen.';
        console.error(err);
      },
    });
  }

  async saveFinishExam(): Promise<void> {
    if (!this.selectedFinishExam) {
      return;
    }

    if (this.finishExamForm.invalid || this.selectedExamDiagnosisIds.length === 0) {
      this.finishExamForm.markAllAsTouched();
      return;
    }

    const result = await Swal.fire({
      title: 'Deseas finalizar este examen?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Finalizar examen',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) {
      return;
    }

    const payload: FinalizarExamDto = {
      examId: this.selectedFinishExam.id,
      results: this.finishExamForm.value.results.trim(),
      diseaseOrInjuryIds: this.selectedExamDiagnosisIds,
    };

    this.appointmentsService.finalizarExamen(payload).subscribe({
      next: () => {
        this.success = 'Examen finalizado correctamente.';
        this.finishExamDialogRef?.close();
        Swal.fire('Examen finalizado', 'El examen fue finalizado correctamente.', 'success');
        this.loadExams(this.examPageNumber, this.examPageSize);
      },
      error: (err) => {
        this.error = err?.error?.error || err?.error?.message || 'No se pudo finalizar el examen.';
        console.error(err);
      },
    });
  }

  closeFinishExamDialog(): void {
    this.selectedFinishExam = undefined;
    this.allowedExamDiagnoses = [];
    this.finishExamDialogRef?.close();
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

  private mapAppointmentFilters(): Record<string, string> {
    const value = this.filterForm.value;
    return {
      reason: value.reason?.trim() ?? '',
      dpi: value.dpi?.trim() ?? '',
      estado: value.estado ?? '',
      startDateFrom: value.startDateFrom
        ? new Date(`${value.startDateFrom}T00:00:00`).toISOString()
        : '',
      startDateTo: value.startDateTo
        ? new Date(`${value.startDateTo}T00:00:00`).toISOString()
        : '',
    };
  }

  private mapExamFilters(): Record<string, string> {
    const value = this.examFilterForm.value;
    return {
      dpi: value.dpi?.trim() ?? '',
    };
  }

  private loadEmergencyCatalogues(): void {
    if (this.sexOptions.length > 0 && this.nationalityOptions.length > 0) {
      return;
    }

    forkJoin({
      sex: this.catalogueService.get('sex', 1, 50, {}, true),
      nationality: this.catalogueService.get('nationality', 1, 50, {}, true),
    }).subscribe({
      next: ({ sex, nationality }) => {
        this.sexOptions = sex.items;
        this.nationalityOptions = nationality.items;
      },
      error: (err) => {
        this.error = 'No se pudieron cargar los catalogos para registrar pacientes.';
        console.error(err);
      },
    });
  }

  private setEmergencyPatientValidators(): void {
    this.emergencyForm.get('name')?.setValidators([
      Validators.required,
      Validators.maxLength(100),
    ]);
    this.emergencyForm.get('direction')?.setValidators([
      Validators.required,
      Validators.maxLength(200),
    ]);
    this.emergencyForm.get('birthday')?.setValidators([Validators.required]);
    this.emergencyForm.get('sexId')?.setValidators([Validators.required]);
    this.emergencyForm.get('nationalityId')?.setValidators([Validators.required]);
    this.updateEmergencyPatientValidatorState();
  }

  private clearEmergencyPatientValidators(): void {
    ['name', 'direction', 'birthday', 'sexId', 'nationalityId'].forEach((controlName) => {
      const control = this.emergencyForm.get(controlName);
      control?.clearValidators();
      control?.setErrors(null);
    });
    this.updateEmergencyPatientValidatorState();
  }

  private updateEmergencyPatientValidatorState(): void {
    ['name', 'direction', 'birthday', 'sexId', 'nationalityId'].forEach((controlName) => {
      this.emergencyForm.get(controlName)?.updateValueAndValidity({ emitEvent: false });
    });
  }

  private resetEmergencyForm(closeDialog = true): void {
    this.emergencyForm.reset({
      dpi: '',
      reason: 'Emergencia',
      name: '',
      direction: '',
      birthday: '',
      sexId: null,
      nationalityId: null,
    });
    this.emergencyPatient = undefined;
    this.emergencyPatientSearched = false;
    this.searchingEmergencyPatient = false;
    this.clearEmergencyPatientValidators();
    this.success = '';
    this.error = '';
    if (closeDialog) {
      this.emergencyDialogRef?.close();
    }
  }

  get selectedExamDiagnosisIds(): number[] {
    return (this.finishExamForm.value.diseaseOrInjuryIds ?? [])
      .map((value: number | string) => Number(value))
      .filter((value: number) => value > 0);
  }
}
