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
  DoctorCreationDto,
  DoctorDto,
  DoctorQueryDto,
  DoctorUpdateDto,
} from '../../interfaces/doctors.interface';
import { DoctorsService } from '../../services/doctors.service';

@Component({
  selector: 'app-doctors',
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
  templateUrl: './doctors.component.html',
  styleUrls: ['./doctors.component.scss'],
})
export class DoctorsComponent implements OnInit {
  @ViewChild('doctorDialog') doctorDialog!: TemplateRef<unknown>;

  doctors: DoctorDto[] = [];
  sexOptions: catalogueInterface[] = [];
  nationalityOptions: catalogueInterface[] = [];
  specialtyOptions: catalogueInterface[] = [];
  loading = false;
  pageNumber = 1;
  pageSize = 10;
  totalDoctors = 0;
  selectedDoctor?: DoctorDto;
  maxBirthdayDate = this.addYears(new Date(), -18);
  private dialogRef?: MatDialogRef<unknown>;

  filterForm: FormGroup;
  doctorForm: FormGroup;

  constructor(
    private doctorsService: DoctorsService,
    private catalogueService: CatalogueService,
    private fb: FormBuilder,
    private dialog: MatDialog,
  ) {
    this.filterForm = this.fb.group({
      name: [''],
      email: [''],
      specialtyId: [null],
      isActive: [null],
    });

    this.doctorForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.maxLength(100)]],
        dpi: ['', [Validators.required, Validators.minLength(13), Validators.maxLength(13)]],
        direction: ['', [Validators.required, Validators.maxLength(200)]],
        birthday: ['', [Validators.required, this.adultValidator.bind(this)]],
        sexId: [null, [Validators.required]],
        nationalityId: [null, [Validators.required]],
        hiringDate: ['', [Validators.required]],
        specialtyIds: [[], [Validators.required, Validators.minLength(1)]],
        licenseNumber: ['', [Validators.required, Validators.maxLength(50)]],
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
    this.loadDoctors();
    this.doctorForm.get('birthday')?.valueChanges.subscribe(() => {
      this.doctorForm.get('hiringDate')?.updateValueAndValidity();
    });
  }

  get passwordControl(): AbstractControl | null {
    return this.doctorForm.get('password');
  }

  get birthdayControl(): AbstractControl | null {
    return this.doctorForm.get('birthday');
  }

  get hiringDateControl(): AbstractControl | null {
    return this.doctorForm.get('hiringDate');
  }

  loadCatalogues(): void {
    this.catalogueService.get('sex', 1, 10, {}, true).subscribe((res) => {
      this.sexOptions = res.items;
    });
    this.catalogueService.get('nationality', 1, 10, {}, true).subscribe((res) => {
      this.nationalityOptions = res.items;
    });
    this.catalogueService.get('specialty', 1, 10, {}, true).subscribe({
      next: (res) => {
        this.specialtyOptions = res.items;
      },
      error: () => {
        this.specialtyOptions = [];
      },
    });
  }

  loadDoctors(pageNumber = this.pageNumber, pageSize = this.pageSize): void {
    this.loading = true;
    this.pageNumber = pageNumber;
    this.pageSize = pageSize;
    this.doctorsService
      .get<DoctorQueryDto>({
        pageNumber,
        pageSize,
        query: this.filterForm.value,
      })
      .subscribe({
        next: (res) => {
          this.doctors = res.items;
          this.totalDoctors = res.total;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  changePagination(event: PageEvent): void {
    this.loadDoctors(event.pageIndex + 1, event.pageSize);
  }

  search(): void {
    this.loadDoctors(1, this.pageSize);
  }

  cleanFilter(): void {
    this.filterForm.reset({
      name: '',
      email: '',
      specialtyId: null,
      isActive: null,
    });
    this.loadDoctors(1, this.pageSize);
  }

  openCreate(): void {
    this.selectedDoctor = undefined;
    this.configurePassword(true);
    this.doctorForm.reset({ specialtyIds: [], isActive: true });
    this.doctorForm.get('userName')?.enable();
    this.dialogRef = this.dialog.open(this.doctorDialog, {
      width: '720px',
      maxWidth: 'calc(100vw - 32px)',
    });
  }

  openEdit(doctor: DoctorDto): void {
    this.selectedDoctor = doctor;
    this.configurePassword(false);
    this.doctorForm.reset({
      name: doctor.name,
      dpi: doctor.dpi,
      direction: doctor.direction,
      birthday: this.toDateValue(doctor.birthday),
      sexId: doctor.sexId,
      nationalityId: doctor.nationalityId,
      hiringDate: this.toDateValue(doctor.hiringDate),
      specialtyIds: doctor.specialtyIds?.length
        ? doctor.specialtyIds
        : [doctor.specialtyId],
      licenseNumber: doctor.licenseNumber,
      email: doctor.email,
      phoneNumber: doctor.phoneNumber,
      userName: doctor.userName,
      password: '',
      isActive: doctor.isActive,
    });
    this.doctorForm.get('userName')?.disable();
    this.dialogRef = this.dialog.open(this.doctorDialog, {
      width: '720px',
      maxWidth: 'calc(100vw - 32px)',
    });
  }

  async saveDoctor(): Promise<void> {
    if (this.doctorForm.invalid) {
      this.doctorForm.markAllAsTouched();
      return;
    }

    const result = await Swal.fire({
      title: 'Deseas guardar el doctor?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
    });

    if (!result.isConfirmed) {
      return;
    }

    if (this.selectedDoctor) {
      const payload = this.mapUpdate();
      this.doctorsService.put(this.selectedDoctor.id, payload).subscribe(() => {
        this.afterSave();
      });
      return;
    }

    const payload = this.mapCreate();
    this.doctorsService.post(payload).subscribe(() => {
      this.afterSave();
    });
  }

  async deleteDoctor(doctor: DoctorDto): Promise<void> {
    const result = await Swal.fire({
      title: 'Deseas eliminar este doctor?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
    });

    if (!result.isConfirmed) {
      return;
    }

    this.doctorsService.delete(doctor.id).subscribe(async () => {
      await Swal.fire('Doctor eliminado', '', 'success');
      this.loadDoctors(this.pageNumber, this.pageSize);
    });
  }

  closeDialog(): void {
    this.dialogRef?.close();
  }

  private afterSave(): void {
    this.dialogRef?.close();
    Swal.fire('Doctor guardado', '', 'success');
    this.loadDoctors(this.pageNumber, this.pageSize);
  }

  private mapCreate(): DoctorCreationDto {
    const value = this.doctorForm.getRawValue();
    return {
      name: value.name,
      dpi: value.dpi,
      direction: value.direction,
      birthday: this.toDateOnlyString(value.birthday),
      sexId: Number(value.sexId),
      nationalityId: Number(value.nationalityId),
      hiringDate: this.toDate(value.hiringDate).toISOString(),
      specialtyIds: value.specialtyIds.map((id: number | string) => Number(id)),
      licenseNumber: value.licenseNumber,
      email: value.email,
      phoneNumber: value.phoneNumber,
      userName: value.userName,
      password: value.password,
    };
  }

  private mapUpdate(): DoctorUpdateDto {
    const value = this.doctorForm.getRawValue();
    return {
      name: value.name,
      dpi: value.dpi,
      direction: value.direction,
      birthday: this.toDateOnlyString(value.birthday),
      sexId: Number(value.sexId),
      nationalityId: Number(value.nationalityId),
      hiringDate: this.toDate(value.hiringDate).toISOString(),
      specialtyIds: value.specialtyIds.map((id: number | string) => Number(id)),
      licenseNumber: value.licenseNumber,
      email: value.email,
      phoneNumber: value.phoneNumber,
      isActive: Boolean(value.isActive),
    };
  }

  private configurePassword(required: boolean): void {
    const password = this.doctorForm.get('password');
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

    if (!birthdayValue || !hiringDateValue) {
      this.removeControlError(hiringDateControl, 'hiringBeforeAdultAge');
      return null;
    }

    const minimumHiringDate = this.addYears(this.toDate(birthdayValue), 18);
    const hiringDate = this.toDate(hiringDateValue);

    if (hiringDate >= minimumHiringDate) {
      this.removeControlError(hiringDateControl, 'hiringBeforeAdultAge');
      return null;
    }

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
