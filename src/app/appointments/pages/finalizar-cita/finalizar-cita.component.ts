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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { catalogueInterface } from '@utils/commons.interface';
import { OnlyNumberInputDirective } from '@utils/directivas/only-number-input.directive';
import { CatalogueService } from '@utils/modules/catalogues/services/catalogue.service';
import { ErrorAlertService } from '@utils/services/error-alert.service';
import { MedicineDosageDto } from 'src/app/medicine-dosages/interfaces/medicine-dosage.interface';
import { MedicineDosageService } from 'src/app/medicine-dosages/services/medicine-dosage.service';
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
    MatFormFieldModule,
    MatSelectModule,
    OnlyNumberInputDirective,
  ],
  templateUrl: './finalizar-cita.component.html',
  styleUrls: ['./finalizar-cita.component.scss'],
})
export class FinalizarCitaComponent implements OnInit {
  form: FormGroup;
  medicines: catalogueInterface[] = [];
  diseasesOrInjuries: catalogueInterface[] = [];
  allowedDosages: MedicineDosageDto[] = [];
  allowedMedicines: catalogueInterface[] = [];
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
    private medicineDosageService: MedicineDosageService,
    private errorAlertService: ErrorAlertService,
    private dialogRef: MatDialogRef<FinalizarCitaComponent>,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      observations: ['', [Validators.maxLength(500)]],
      diseaseOrInjuryIds: [[], [Validators.required]],
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

    this.form.get('diseaseOrInjuryIds')?.valueChanges.subscribe((value) => {
      const ids = Array.isArray(value) ? value : [];
      this.loadAllowedMedicines(ids.map((id: unknown) => Number(id)));
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

  getDosageInfo(medicineId: unknown): string {
    const id = Number(medicineId);
    if (!id) {
      return '';
    }

    const rules = this.allowedDosages.filter((dosage) => dosage.medicineId === id);
    if (rules.length === 0) {
      return '';
    }

    const recommended = Math.min(...rules.map((rule) => rule.recommendedAmount));
    const maximum = Math.min(...rules.map((rule) => rule.maximumAmount));
    const diagnoses = rules.map((rule) => rule.diseaseOrInjuryName).join(', ');
    return `Recomendado: ${recommended}. Maximo permitido aplicado: ${maximum}. Diagnosticos: ${diagnoses}.`;
  }

  getRecipeTotal(index: number): number {
    const recipe = this.recipes.at(index);
    const days = Number(recipe.get('days')?.value || 0);
    const timeLimit = Number(recipe.get('timeLimit')?.value || 0);

    if (days <= 0 || timeLimit <= 0) {
      return 0;
    }

    return days * Math.ceil(24 / timeLimit);
  }

  getRecipeMaximum(medicineId: unknown): number {
    const id = Number(medicineId);
    if (!id) {
      return 0;
    }

    const rules = this.allowedDosages.filter((dosage) => dosage.medicineId === id);
    if (rules.length === 0) {
      return 0;
    }

    return Math.min(...rules.map((rule) => rule.maximumAmount));
  }

  exceedsRecipeMaximum(index: number): boolean {
    const medicineId = this.recipes.at(index).get('medicineId')?.value;
    const maximum = this.getRecipeMaximum(medicineId);
    return maximum > 0 && this.getRecipeTotal(index) > maximum;
  }

  async guardar(): Promise<void> {
    this.error = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    let requiresLabExams = Boolean(this.form.value.requiresLabExams);
    if (requiresLabExams) {
      const examPayment = await Swal.fire({
        title: 'Simulacion de pago de examenes',
        text: 'El doctor solicito examenes de laboratorio. Deseas confirmar el pago para programarlos?',
        icon: 'info',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Pagar examenes',
        denyButtonText: 'No pagar examenes',
        cancelButtonText: 'Cancelar',
      });

      if (examPayment.isDismissed) {
        return;
      }

      if (examPayment.isDenied) {
        requiresLabExams = false;
        await Swal.fire(
          'Examenes no programados',
          'La consulta se finalizara sin agendar examenes de laboratorio.',
          'info',
        );
      }
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
    const requiresReschedule = Boolean(this.form.value.requiresReschedule);
    const payload: FinalizarCitaDto = {
      appointmentId: this.appointment.id,
      observations: this.form.value.observations?.trim() || undefined,
      diseaseOrInjuryIds: this.form.value.diseaseOrInjuryIds.map((id: unknown) => Number(id)),
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
        this.error = this.errorAlertService.getMessage(err, 'No se pudo finalizar la cita.');
        this.errorAlertService.show(err, 'No se pudo finalizar la cita.');
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
        this.medicineCatalogError = this.errorAlertService.getMessage(
          err,
          'No se pudo cargar el catalogo de medicamentos.',
        );
        this.errorAlertService.show(err, 'No se pudo cargar el catalogo de medicamentos.');
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

    this.catalogueService.get('diseaseorinjuries', 1, 100, {}, true).subscribe({
      next: (res) => {
        this.diseasesOrInjuries = res.items;
      },
      error: (err) => console.error(err),
    });
  }

  private loadAllowedMedicines(diseaseOrInjuryIds: number[]): void {
    if (diseaseOrInjuryIds.length === 0) {
      this.allowedDosages = [];
      this.allowedMedicines = [];
      return;
    }

    this.medicineDosageService.getByDiseases(diseaseOrInjuryIds).subscribe({
      next: (dosages) => {
        this.allowedDosages = dosages;
        const medicineById = new Map<number, catalogueInterface>();
        dosages.forEach((dosage) => {
          if (!medicineById.has(dosage.medicineId)) {
            medicineById.set(dosage.medicineId, {
              id: dosage.medicineId,
              name: dosage.medicineName,
              description: '',
            });
          }
        });
        this.allowedMedicines = Array.from(medicineById.values()).sort((a, b) =>
          a.name.localeCompare(b.name),
        );

        const allowedIds = new Set(this.allowedMedicines.map((medicine) => medicine.id));
        this.recipes.controls.forEach((control) => {
          const currentId = control.get('medicineId')?.value;
          if (currentId && !allowedIds.has(Number(currentId))) {
            control.get('medicineId')?.reset(null);
          }
        });
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
