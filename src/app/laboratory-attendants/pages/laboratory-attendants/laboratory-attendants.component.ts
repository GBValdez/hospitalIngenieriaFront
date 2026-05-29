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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { catalogueInterface } from '@utils/commons.interface';
import { CatalogueService } from '@utils/modules/catalogues/services/catalogue.service';
import Swal from 'sweetalert2';
import {
  LaboratoryAttendantCreationDto,
  LaboratoryAttendantDto,
  LaboratoryAttendantQueryDto,
  LaboratoryAttendantUpdateDto,
} from '../../interfaces/laboratory-attendants.interface';
import { LaboratoryAttendantsService } from '../../services/laboratory-attendants.service';

@Component({
  selector: 'app-laboratory-attendants',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
  ],
  templateUrl: './laboratory-attendants.component.html',
  styleUrls: ['./laboratory-attendants.component.scss'],
})
export class LaboratoryAttendantsComponent implements OnInit {
  @ViewChild('attendantDialog') attendantDialog!: TemplateRef<unknown>;

  attendants: LaboratoryAttendantDto[] = [];
  sexOptions: catalogueInterface[] = [];
  nationalityOptions: catalogueInterface[] = [];
  examTypeOptions: catalogueInterface[] = [];
  loading = false;
  pageNumber = 1;
  pageSize = 10;
  totalAttendants = 0;
  selectedAttendant?: LaboratoryAttendantDto;
  maxBirthdayDate = this.addYears(new Date(), -18);
  maxHiringDate = new Date();
  private dialogRef?: MatDialogRef<unknown>;

  filterForm: FormGroup;
  attendantForm: FormGroup;

  constructor(
    private attendantsService: LaboratoryAttendantsService,
    private catalogueService: CatalogueService,
    private fb: FormBuilder,
    private dialog: MatDialog,
  ) {
    this.filterForm = this.fb.group({
      name: [''],
      email: [''],
      examTypeId: [null],
      isActive: [null],
    });

    this.attendantForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.maxLength(100)]],
        dpi: ['', [Validators.required, Validators.minLength(13), Validators.maxLength(13)]],
        direction: ['', [Validators.required, Validators.maxLength(200)]],
        birthday: ['', [Validators.required, this.adultValidator.bind(this)]],
        sexId: [null, [Validators.required]],
        nationalityId: [null, [Validators.required]],
        hiringDate: ['', [Validators.required]],
        examTypeIds: [[], [Validators.required, Validators.minLength(1)]],
        email: ['', [Validators.required, Validators.email]],
        phoneNumber: ['', [Validators.required, Validators.maxLength(10)]],
        userName: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9]+$')]],
        password: ['', [Validators.required, this.passwordValidator]],
        isActive: [true],
      },
      { validators: [this.hiringAfterAdultAgeValidator.bind(this)] },
    );
  }

  ngOnInit(): void {
    this.loadCatalogues();
    this.loadAttendants();
    this.attendantForm.get('birthday')?.valueChanges.subscribe(() => {
      this.attendantForm.get('hiringDate')?.updateValueAndValidity();
    });
  }

  get passwordControl(): AbstractControl | null {
    return this.attendantForm.get('password');
  }

  get birthdayControl(): AbstractControl | null {
    return this.attendantForm.get('birthday');
  }

  get hiringDateControl(): AbstractControl | null {
    return this.attendantForm.get('hiringDate');
  }

  loadCatalogues(): void {
    this.catalogueService.get('sex', 1, 10, {}, true).subscribe((res) => {
      this.sexOptions = res.items;
    });
    this.catalogueService.get('nationality', 1, 10, {}, true).subscribe((res) => {
      this.nationalityOptions = res.items;
    });
    this.catalogueService.get('examtypes', 1, 10, {}, true).subscribe({
      next: (res) => {
        this.examTypeOptions = res.items;
      },
      error: () => {
        this.examTypeOptions = [];
      },
    });
  }

  loadAttendants(pageNumber = this.pageNumber, pageSize = this.pageSize): void {
    this.loading = true;
    this.pageNumber = pageNumber;
    this.pageSize = pageSize;
    this.attendantsService
      .get<LaboratoryAttendantQueryDto>({
        pageNumber,
        pageSize,
        query: this.filterForm.value,
      })
      .subscribe({
        next: (res) => {
          this.attendants = res.items;
          this.totalAttendants = res.total;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  changePagination(event: PageEvent): void {
    this.loadAttendants(event.pageIndex + 1, event.pageSize);
  }

  search(): void {
    this.loadAttendants(1, this.pageSize);
  }

  cleanFilter(): void {
    this.filterForm.reset({
      name: '',
      email: '',
      examTypeId: null,
      isActive: null,
    });
    this.loadAttendants(1, this.pageSize);
  }

  openCreate(): void {
    this.selectedAttendant = undefined;
    this.configurePassword(true);
    this.attendantForm.reset({ examTypeIds: [], isActive: true });
    this.attendantForm.get('userName')?.enable();
    this.dialogRef = this.dialog.open(this.attendantDialog, {
      width: '720px',
      maxWidth: 'calc(100vw - 32px)',
    });
  }

  openEdit(attendant: LaboratoryAttendantDto): void {
    this.selectedAttendant = attendant;
    this.configurePassword(false);
    this.attendantForm.reset({
      name: attendant.name,
      dpi: attendant.dpi,
      direction: attendant.direction,
      birthday: this.toDateValue(attendant.birthday),
      sexId: attendant.sexId,
      nationalityId: attendant.nationalityId,
      hiringDate: this.toDateValue(attendant.hiringDate),
      examTypeIds: attendant.examTypeIds,
      email: attendant.email,
      phoneNumber: attendant.phoneNumber,
      userName: attendant.userName,
      password: '',
      isActive: attendant.isActive,
    });
    this.attendantForm.get('userName')?.disable();
    this.dialogRef = this.dialog.open(this.attendantDialog, {
      width: '720px',
      maxWidth: 'calc(100vw - 32px)',
    });
  }

  async saveAttendant(): Promise<void> {
    if (this.attendantForm.invalid) {
      this.attendantForm.markAllAsTouched();
      return;
    }

    const result = await Swal.fire({
      title: 'Deseas guardar el encargado?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
    });

    if (!result.isConfirmed) {
      return;
    }

    if (this.selectedAttendant) {
      this.attendantsService.put(this.selectedAttendant.id, this.mapUpdate()).subscribe(() => {
        this.afterSave();
      });
      return;
    }

    this.attendantsService.post(this.mapCreate()).subscribe(() => {
      this.afterSave();
    });
  }

  async deleteAttendant(attendant: LaboratoryAttendantDto): Promise<void> {
    const result = await Swal.fire({
      title: 'Deseas eliminar este encargado?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
    });

    if (!result.isConfirmed) {
      return;
    }

    this.attendantsService.delete(attendant.id).subscribe(async () => {
      await Swal.fire('Encargado eliminado', '', 'success');
      this.loadAttendants(this.pageNumber, this.pageSize);
    });
  }

  closeDialog(): void {
    this.dialogRef?.close();
  }

  private afterSave(): void {
    this.dialogRef?.close();
    Swal.fire('Encargado guardado', '', 'success');
    this.loadAttendants(this.pageNumber, this.pageSize);
  }

  private mapCreate(): LaboratoryAttendantCreationDto {
    const value = this.attendantForm.getRawValue();
    return {
      name: value.name,
      dpi: value.dpi,
      direction: value.direction,
      birthday: this.toDateOnlyString(value.birthday),
      sexId: Number(value.sexId),
      nationalityId: Number(value.nationalityId),
      hiringDate: this.toDate(value.hiringDate).toISOString(),
      examTypeIds: value.examTypeIds.map((id: number | string) => Number(id)),
      email: value.email,
      phoneNumber: value.phoneNumber,
      userName: value.userName,
      password: value.password,
    };
  }

  private mapUpdate(): LaboratoryAttendantUpdateDto {
    const value = this.attendantForm.getRawValue();
    return {
      name: value.name,
      dpi: value.dpi,
      direction: value.direction,
      birthday: this.toDateOnlyString(value.birthday),
      sexId: Number(value.sexId),
      nationalityId: Number(value.nationalityId),
      hiringDate: this.toDate(value.hiringDate).toISOString(),
      examTypeIds: value.examTypeIds.map((id: number | string) => Number(id)),
      email: value.email,
      phoneNumber: value.phoneNumber,
      isActive: Boolean(value.isActive),
    };
  }

  private configurePassword(required: boolean): void {
    const password = this.attendantForm.get('password');
    if (!password) {
      return;
    }

    password.setValidators(required ? [Validators.required, this.passwordValidator] : []);
    password.updateValueAndValidity();
  }

  private passwordValidator(control: AbstractControl) {
    if (!control.value) {
      return null;
    }

    const valid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(
      control.value,
    );
    return valid ? null : { passwordFormat: true };
  }

  private adultValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const birthday = this.toDate(control.value);
    const adultDate = this.addYears(new Date(), -18);
    return birthday <= adultDate ? null : { underAge: true };
  }

  private hiringAfterAdultAgeValidator(form: AbstractControl): ValidationErrors | null {
    const birthdayValue = form.get('birthday')?.value;
    const hiringDateControl = form.get('hiringDate');
    const hiringDateValue = hiringDateControl?.value;

    if (!hiringDateValue) {
      this.removeControlError(hiringDateControl, 'hiringBeforeAdultAge');
      this.removeControlError(hiringDateControl, 'futureHiringDate');
      return null;
    }

    const hiringDate = this.toDate(hiringDateValue);
    const today = new Date();

    if (hiringDate > today) {
      this.removeControlError(hiringDateControl, 'hiringBeforeAdultAge');
      hiringDateControl?.setErrors({
        ...(hiringDateControl.errors ?? {}),
        futureHiringDate: true,
      });
      return { futureHiringDate: true };
    }

    if (!birthdayValue) {
      this.removeControlError(hiringDateControl, 'hiringBeforeAdultAge');
      this.removeControlError(hiringDateControl, 'futureHiringDate');
      return null;
    }

    const minimumHiringDate = this.addYears(this.toDate(birthdayValue), 18);

    if (hiringDate >= minimumHiringDate) {
      this.removeControlError(hiringDateControl, 'futureHiringDate');
      this.removeControlError(hiringDateControl, 'hiringBeforeAdultAge');
      return null;
    }

    this.removeControlError(hiringDateControl, 'futureHiringDate');
    hiringDateControl?.setErrors({
      ...(hiringDateControl.errors ?? {}),
      hiringBeforeAdultAge: true,
    });
    return { hiringBeforeAdultAge: true };
  }

  private removeControlError(
    control: AbstractControl | null | undefined,
    errorKey: string,
  ): void {
    if (!control?.errors?.[errorKey]) {
      return;
    }

    const errors = { ...control.errors };
    delete errors[errorKey];
    control.setErrors(Object.keys(errors).length ? errors : null);
  }

  private addYears(date: Date, years: number): Date {
    const newDate = new Date(date);
    newDate.setFullYear(newDate.getFullYear() + years);
    return newDate;
  }

  private toDateValue(value: string | Date): Date | string {
    if (!value) {
      return '';
    }

    return this.toDate(value);
  }

  private toDateOnlyString(value: unknown): string {
    return this.toDate(value).toISOString().split('T')[0];
  }

  private toDate(value: any): Date {
    if (value?.toDate instanceof Function) {
      return value.toDate();
    }

    return new Date(value);
  }
}
