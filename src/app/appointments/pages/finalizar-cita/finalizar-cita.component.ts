import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
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
import { catalogueInterface } from '@utils/commons.interface';
import { OnlyNumberInputDirective } from '@utils/directivas/only-number-input.directive';
import { CatalogueService } from '@utils/modules/catalogues/services/catalogue.service';
import {
  AppointmentDto,
  FinalizarCitaDto,
} from '../../interfaces/appointments.interface';
import { AppointmentsService } from '../../services/appointments.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-finalizar-cita',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    OnlyNumberInputDirective,
  ],
  templateUrl: './finalizar-cita.component.html',
  styleUrls: ['./finalizar-cita.component.scss'],
})
export class FinalizarCitaComponent implements OnInit {
  form: FormGroup;
  medicines: catalogueInterface[] = [];
  examTypes: catalogueInterface[] = [];
  saving = false;
  loadingCatalogues = false;
  error = '';
  medicineCatalogError = '';
  minDateTime = this.toDateTimeLocalValue(new Date());
  rescheduleReasons = [
    'Consulta con especialista',
    'Revision de resultados de laboratorio',
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public appointment: AppointmentDto,
    private appointmentsService: AppointmentsService,
    private catalogueService: CatalogueService,
    private dialogRef: MatDialogRef<FinalizarCitaComponent>,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      diagnosis: ['', [Validators.required, Validators.maxLength(500)]],
      observations: ['', [Validators.maxLength(500)]],
      treatment: ['', [Validators.required, Validators.maxLength(500)]],
      requiresRecipe: [false],
      recipes: this.fb.array([]),
      requiresLabExams: [false],
      labExams: this.fb.array([]),
      requiresReschedule: [false],
      rescheduleReason: [''],
      newStartDate: [''],
    });
  }

  ngOnInit(): void {
    this.loadCatalogues();
    this.form.get('requiresRecipe')?.valueChanges.subscribe((value) => {
      if (value && this.recipes.length === 0) {
        this.addRecipe();
      }
      if (!value) {
        this.recipes.clear();
      }
    });

    this.form.get('requiresLabExams')?.valueChanges.subscribe((value) => {
      if (value && this.labExams.length === 0) {
        this.addLabExam();
      }
      if (!value) {
        this.labExams.clear();
      }
    });

    this.form.get('requiresReschedule')?.valueChanges.subscribe((value) => {
      const reason = this.form.get('rescheduleReason');
      const date = this.form.get('newStartDate');
      if (value) {
        reason?.setValidators([Validators.required]);
        date?.setValidators([Validators.required, this.futureDateValidator.bind(this)]);
      } else {
        reason?.clearValidators();
        date?.clearValidators();
        reason?.reset('');
        date?.reset('');
      }
      reason?.updateValueAndValidity();
      date?.updateValueAndValidity();
    });
  }

  get recipes(): FormArray {
    return this.form.get('recipes') as FormArray;
  }

  get labExams(): FormArray {
    return this.form.get('labExams') as FormArray;
  }

  getControl(name: string): AbstractControl | null {
    return this.form.get(name);
  }

  addRecipe(): void {
    this.recipes.push(
      this.fb.group({
        medicineId: [null, [Validators.required]],
        days: [null, [Validators.required, Validators.min(1)]],
        timeLimit: [null, [Validators.required, Validators.min(1)]],
      }),
    );
  }

  removeRecipe(index: number): void {
    this.recipes.removeAt(index);
  }

  addLabExam(): void {
    this.labExams.push(
      this.fb.group({
        examTypeId: [null, [Validators.required]],
        indications: ['', [Validators.required, Validators.maxLength(500)]],
      }),
    );
  }

  removeLabExam(index: number): void {
    this.labExams.removeAt(index);
  }

  async guardar(): Promise<void> {
    this.error = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const result = await Swal.fire({
      title: 'Deseas finalizar esta cita?',
      text: 'Se guardara la atencion, recetas, examenes y reagendamiento si fueron indicados.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Finalizar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) {
      return;
    }

    const requiresRecipe = Boolean(this.form.value.requiresRecipe);
    const requiresLabExams = Boolean(this.form.value.requiresLabExams);
    const requiresReschedule = Boolean(this.form.value.requiresReschedule);
    const payload: FinalizarCitaDto = {
      appointmentId: this.appointment.id,
      diagnosis: this.form.value.diagnosis.trim(),
      observations: this.form.value.observations?.trim() || undefined,
      treatment: this.form.value.treatment.trim(),
      requiresRecipe,
      recipes: requiresRecipe
        ? this.recipes.value.map((recipe: any) => ({
            medicineId: Number(recipe.medicineId),
            days: Number(recipe.days),
            timeLimit: Number(recipe.timeLimit),
          }))
        : [],
      requiresLabExams,
      labExams: requiresLabExams
        ? this.labExams.value.map((exam: any) => ({
            examTypeId: Number(exam.examTypeId),
            indications: exam.indications.trim(),
          }))
        : [],
      requiresReschedule,
      rescheduleReason: requiresReschedule
        ? this.form.value.rescheduleReason
        : undefined,
      newStartDate: requiresReschedule
        ? new Date(this.form.value.newStartDate).toISOString()
        : undefined,
    };

    this.saving = true;
    this.appointmentsService.finalizarCita(payload).subscribe({
      next: async () => {
        this.saving = false;
        await Swal.fire('Cita finalizada', 'La cita fue finalizada correctamente.', 'success');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.error = err?.error?.error || err?.error?.message || 'No se pudo finalizar la cita.';
        this.saving = false;
        console.error(err);
      },
    });
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }

  private loadCatalogues(): void {
    this.loadingCatalogues = true;
    this.medicineCatalogError = '';
    this.catalogueService.get('medicines', 1, 100, {}, true).subscribe({
      next: (res) => {
        this.medicines = res.items;
        if (this.medicines.length === 0) {
          this.medicineCatalogError = 'No hay medicamentos registrados.';
        }
        this.loadingCatalogues = false;
      },
      error: (err) => {
        this.medicineCatalogError = 'No se pudo cargar el catalogo de medicamentos.';
        this.loadingCatalogues = false;
        console.error(err);
      },
    });

    this.catalogueService.get('examtypes', 1, 100, {}, true).subscribe({
      next: (res) => {
        this.examTypes = res.items;
      },
      error: (err) => console.error(err),
    });
  }

  private futureDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    return new Date(control.value) <= new Date() ? { pastDate: true } : null;
  }

  private toDateTimeLocalValue(date: Date): string {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  }
}
