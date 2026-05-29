import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { catalogueInterface } from '@utils/commons.interface';
import { CatalogueService } from '@utils/modules/catalogues/services/catalogue.service';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';
import {
  ExamTypeDiagnosisCreationDto,
  ExamTypeDiagnosisDto,
} from '../../interfaces/exam-type-diagnosis.interface';
import { ExamTypeDiagnosisService } from '../../services/exam-type-diagnosis.service';

@Component({
  selector: 'app-exam-type-diagnoses',
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
  ],
  templateUrl: './exam-type-diagnoses.component.html',
  styleUrls: ['./exam-type-diagnoses.component.scss'],
})
export class ExamTypeDiagnosesComponent implements OnInit {
  @ViewChild('relationDialog') relationDialog!: TemplateRef<unknown>;

  relations: ExamTypeDiagnosisDto[] = [];
  examTypes: catalogueInterface[] = [];
  diseasesOrInjuries: catalogueInterface[] = [];
  loading = false;
  selectedRelation?: ExamTypeDiagnosisDto;
  filterForm: FormGroup;
  relationForm: FormGroup;
  private dialogRef?: MatDialogRef<unknown>;

  constructor(
    private relationService: ExamTypeDiagnosisService,
    private catalogueService: CatalogueService,
    private fb: FormBuilder,
    private dialog: MatDialog,
  ) {
    this.filterForm = this.fb.group({
      examTypeId: [null],
      diseaseOrInjuryId: [null],
    });

    this.relationForm = this.fb.group({
      examTypeId: [null, [Validators.required]],
      diseaseOrInjuryId: [null, [Validators.required]],
      notes: ['', [Validators.maxLength(500)]],
    });
  }

  ngOnInit(): void {
    this.loadCatalogues();
    this.loadRelations();
  }

  loadCatalogues(): void {
    this.catalogueService.get('examtypes', 1, 100, {}, true).subscribe((res) => {
      this.examTypes = res.items;
    });

    this.catalogueService.get('diseaseorinjuries', 1, 100, {}, true).subscribe((res) => {
      this.diseasesOrInjuries = res.items;
    });
  }

  loadRelations(): void {
    this.loading = true;
    this.relationService.get(this.filterForm.value).subscribe({
      next: (relations) => {
        this.relations = relations;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  search(): void {
    this.loadRelations();
  }

  cleanFilter(): void {
    this.filterForm.reset({
      examTypeId: null,
      diseaseOrInjuryId: null,
    });
    this.loadRelations();
  }

  openCreate(): void {
    this.selectedRelation = undefined;
    this.relationForm.reset({
      examTypeId: null,
      diseaseOrInjuryId: null,
      notes: '',
    });
    this.dialogRef = this.dialog.open(this.relationDialog, {
      width: '680px',
      maxWidth: 'calc(100vw - 32px)',
    });
  }

  openEdit(relation: ExamTypeDiagnosisDto): void {
    this.selectedRelation = relation;
    this.relationForm.reset({
      examTypeId: relation.examTypeId,
      diseaseOrInjuryId: relation.diseaseOrInjuryId,
      notes: relation.notes ?? '',
    });
    this.dialogRef = this.dialog.open(this.relationDialog, {
      width: '680px',
      maxWidth: 'calc(100vw - 32px)',
    });
  }

  async saveRelation(): Promise<void> {
    if (this.relationForm.invalid) {
      this.relationForm.markAllAsTouched();
      return;
    }

    const result = await Swal.fire({
      title: 'Deseas guardar esta relacion?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) {
      return;
    }

    const payload = this.mapForm();
    const request: Observable<unknown> = this.selectedRelation
      ? this.relationService.put(this.selectedRelation.id, payload)
      : this.relationService.post(payload);

    request.subscribe({
      next: async () => {
        await Swal.fire('Relacion guardada', '', 'success');
        this.dialogRef?.close();
        this.loadRelations();
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

  async deleteRelation(relation: ExamTypeDiagnosisDto): Promise<void> {
    const result = await Swal.fire({
      title: 'Deseas eliminar esta relacion?',
      text: `${relation.examTypeName} diagnostica ${relation.diseaseOrInjuryName}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) {
      return;
    }

    this.relationService.delete(relation.id).subscribe(async () => {
      await Swal.fire('Relacion eliminada', '', 'success');
      this.loadRelations();
    });
  }

  closeDialog(): void {
    this.dialogRef?.close();
  }

  private mapForm(): ExamTypeDiagnosisCreationDto {
    const value = this.relationForm.value;
    return {
      examTypeId: Number(value.examTypeId),
      diseaseOrInjuryId: Number(value.diseaseOrInjuryId),
      notes: value.notes?.trim() || undefined,
    };
  }
}
