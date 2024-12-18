import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UserService } from '@user/services/user.service';
import { OnlyNumberInputDirective } from '@utils/directivas/only-number-input.directive';
import { Moment } from 'moment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatDatepickerModule,
    OnlyNumberInputDirective,
    MatSelectModule,
  ],
  templateUrl: './user-create.component.html',
  styleUrl: './user-create.component.scss',
})
export class UserCreateComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    private userSvc: UserService,
    private dialogRef: MatDialogRef<UserCreateComponent>
  ) {}
  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      birthdate: ['', [Validators.required, this.fechaNacimientoValidator()]],
      tel: ['', [Validators.required]],
      address: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/
          ),
        ],
      ],
      userName: [
        '',
        [Validators.required, Validators.pattern('^[a-zA-Z0-9]+$')],
      ],
    });
  }
  symbols: string = '@$!%*?&#';
  fechaNacimientoValidator(): ValidatorFn {
    return (control) => {
      if (!control.value) return null;
      const fechaNacimiento: Moment = control.value;
      const fechaNacimientoDate = fechaNacimiento.toDate();
      const fechaActual = new Date();
      fechaActual.setFullYear(fechaActual.getFullYear() - 18);
      return fechaNacimientoDate <= fechaActual ? null : { menorDeEdad: true };
    };
  }

  form!: FormGroup;

  async createUser() {
    const ALERT = await Swal.fire({
      title: '¿Estas seguro de continuar?',
      showCancelButton: true,
      confirmButtonText: `Guardar`,
      icon: 'question',
    });
    if (ALERT.isConfirmed)
      if (this.form.valid) {
        const DATA = this.form.value;
        DATA.birthdate = new Date(DATA.birthdate).toISOString().split('T')[0];
        this.userSvc.createUser(DATA).subscribe((res) => {
          Swal.fire({
            title: 'Usuario creado',
            text: 'Se ha enviado un correo de verificación a su email para activar su cuenta de usuario en la aplicación. Por favor, revise su bandeja de entrada',
            icon: 'success',
          });
          this.dialogRef.close();
        });
      } else this.form.markAllAsTouched();
  }
}
