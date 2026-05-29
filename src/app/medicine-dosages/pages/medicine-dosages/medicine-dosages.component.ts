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
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { catalogueInterface } from '@utils/commons.interface';
import { OnlyNumberInputDirective } from '@utils/directivas/only-number-input.directive';
import { CatalogueService } from '@utils/modules/catalogues/services/catalogue.service';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';
import {
  MedicineDosageCreationDto,
  MedicineDosageDto,
} from '../../interfaces/medicine-dosage.interface';
import { MedicineDosageService } from '../../services/medicine-dosage.service';

@Component({
  selector: 'app-medicine-dosages',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    OnlyNumberInputDirective,
  ],
  templateUrl: './medicine-dosages.component.html',
  styleUrls: ['./medicine-dosages.component.scss'],
})
export class MedicineDosagesComponent implements OnInit {
  @ViewChild('dosageDialog') dosageDialog!: TemplateRef<unknown>;

  dosages: MedicineDosageDto[] = [];
  medicines: catalogueInterface[] = [];
  diseasesOrInjuries: catalogueInterface[] = [];
  loading = false;
  selectedDosage?: MedicineDosageDto;
  filterForm: FormGroup;
  dosageForm: FormGroup;
  private dialogRef?: MatDialogRef<unknown>;

  constructor(
    private dosageService: MedicineDosageService,
    private catalogueService: CatalogueService,
    private fb: FormBuilder,
    private dialog: MatDialog,
  ) {
    this.filterForm = this.fb.group({
      medicineId: [null],
      diseaseOrInjuryId: [null],
    });

    this.dosageForm = this.fb.group(
      {
        medicineId: [null, [Validators.required]],
        diseaseOrInjuryId: [null, [Validators.required]],
        recommendedAmount: ['', [Validators.required, Validators.min(1)]],
        maximumAmount: ['', [Validators.required, Validators.min(1)]],
        notes: ['', [Validators.maxLength(500)]],
      },
      { validators: [this.recommendedNotGreaterThanMaximumValidator] },
    );
  }

  ngOnInit(): void {
    this.loadCatalogues();
    this.loadDosages();
  }

  get recommendedAmountControl(): AbstractControl | null {
    return this.dosageForm.get('recommendedAmount');
  }

  get maximumAmountControl(): AbstractControl | null {
    return this.dosageForm.get('maximumAmount');
  }

  loadCatalogues(): void {
    this.catalogueService.get('medicines', 1, 100, {}, true).subscribe((res) => {
      this.medicines = res.items;
    });

    this.catalogueService.get('diseaseorinjuries', 1, 100, {}, true).subscribe((res) => {
      this.diseasesOrInjuries = res.items;
    });
  }

  loadDosages(): void {
    this.loading = true;
    this.dosageService.get(this.filterForm.value).subscribe({
      next: (dosages) => {
        this.dosages = dosages;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  search(): void {
    this.loadDosages();
  }

  cleanFilter(): void {
    this.filterForm.reset({
      medicineId: null,
      diseaseOrInjuryId: null,
    });
    this.loadDosages();
  }

  openCreate(): void {
    this.selectedDosage = undefined;
    this.dosageForm.reset({
      medicineId: null,
      diseaseOrInjuryId: null,
      recommendedAmount: '',
      maximumAmount: '',
      notes: '',
    });
    this.dialogRef = this.dialog.open(this.dosageDialog, {
      width: '680px',
      maxWidth: 'calc(100vw - 32px)',
    });
  }

  openEdit(dosage: MedicineDosageDto): void {
    this.selectedDosage = dosage;
    this.dosageForm.reset({
      medicineId: dosage.medicineId,
      diseaseOrInjuryId: dosage.diseaseOrInjuryId,
      recommendedAmount: dosage.recommendedAmount,
      maximumAmount: dosage.maximumAmount,
      notes: dosage.notes ?? '',
    });
    this.dialogRef = this.dialog.open(this.dosageDialog, {
      width: '680px',
      maxWidth: 'calc(100vw - 32px)',
    });
  }

  async saveDosage(): Promise<void> {
    if (this.dosageForm.invalid) {
      this.dosageForm.markAllAsTouched();
      return;
    }

    const result = await Swal.fire({
      title: 'Deseas guardar esta configuracion?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) {
      return;
    }

    const payload = this.mapForm();
    const request: Observable<unknown> = this.selectedDosage
      ? this.dosageService.put(this.selectedDosage.id, payload)
      : this.dosageService.post(payload);

    request.subscribe({
      next: async () => {
        await Swal.fire('Configuracion guardada', '', 'success');
        this.dialogRef?.close();
        this.loadDosages();
      },
      error: (err: any) => {
        Swal.fire(
          'No se pudo guardar',
          err?.error?.error || err?.error?.message || 'Revise los datos ingresados.',
          'error',
        );
      },
    });
  }

  async deleteDosage(dosage: MedicineDosageDto): Promise<void> {
    const result = await Swal.fire({
      title: 'Deseas eliminar esta configuracion?',
      text: `${dosage.medicineName} para ${dosage.diseaseOrInjuryName}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) {
      return;
    }

    this.dosageService.delete(dosage.id).subscribe(async () => {
      await Swal.fire('Configuracion eliminada', '', 'success');
      this.loadDosages();
    });
  }

  closeDialog(): void {
    this.dialogRef?.close();
  }

  private mapForm(): MedicineDosageCreationDto {
    const value = this.dosageForm.value;
    return {
      medicineId: Number(value.medicineId),
      diseaseOrInjuryId: Number(value.diseaseOrInjuryId),
      recommendedAmount: Number(value.recommendedAmount),
      maximumAmount: Number(value.maximumAmount),
      notes: value.notes?.trim() || undefined,
    };
  }

  private recommendedNotGreaterThanMaximumValidator(
    form: AbstractControl,
  ): ValidationErrors | null {
    const recommended = Number(form.get('recommendedAmount')?.value || 0);
    const maximum = Number(form.get('maximumAmount')?.value || 0);

    if (!recommended || !maximum || recommended <= maximum) {
      return null;
    }

    return { recommendedGreaterThanMaximum: true };
  }
}
