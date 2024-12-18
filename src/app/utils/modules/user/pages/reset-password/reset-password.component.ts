import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '@user/services/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    RouterModule,
    MatIconModule,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  passwordEqual: ValidatorFn = (control) => {
    const password = control.get('password')!.value;
    const confirmPassword = control.get('confirmPassword')!.value;
    if (password === confirmPassword) return null;
    else return { noIgual: true };
  };
  symbols: string = '@$!%*?&#';
  form!: FormGroup;
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private activateRoute: ActivatedRoute,
    private userSvc: UserService
  ) {}
  gmail: string = '';
  token: string = '';

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        password: [
          '',
          [
            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/
            ),
            Validators.required,
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordEqual.bind(this) }
    );
    this.gmail = this.activateRoute.snapshot.params['gmail'];
    this.token = this.activateRoute.snapshot.params['token'];
  }
  async resetPassword() {
    if (this.form.valid) {
      const res = await Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas cambiar tu contraseña?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí',
        cancelButtonText: 'No',
      });
      if (res.isConfirmed) {
        this.userSvc
          .resetPassword(this.token, this.gmail, this.form.value.password!)
          .subscribe((res) => {
            Swal.fire({
              title: 'Contraseña cambiada',
              text: 'Tu contraseña ha sido cambiada con éxito',
              icon: 'success',
            });
            this.router.navigate(['/login']);
          });
      }
    }
  }
}
