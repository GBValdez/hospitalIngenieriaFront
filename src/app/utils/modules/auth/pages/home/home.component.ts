import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ForgotPasswordComponent } from '@user/pages/forgot-password/forgot-password.component';
import { MatIconModule } from '@angular/material/icon';
import { LoginService } from '@auth/services/login.service';
import { AuthService } from '@auth/services/auth.service';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { authUserInterface } from '@auth/interface/auth.inteface';
import { UserCreateComponent } from '@utils/modules/user/pages/user-create/user-create.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    ForgotPasswordComponent,
    MatIconModule,
    UserCreateComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  constructor(
    private loginSvc: LoginService,
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog
  ) {}
  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }
  form!: FormGroup;
  login() {
    if (this.form.valid) {
      this.loginSvc.login(this.form.value).subscribe((res) => {
        const decoded: any = jwtDecode(res.token);
        // console.log(decoded);
        const newUser: authUserInterface = {
          token: res.token,
          expiration: res.expiration,
          email: decoded.email,
          roles:
            decoded[
              'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
            ],
          userName:
            decoded[
              'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
            ],
          clientId: decoded.clienteId,
        };
        console.log(newUser);
        this.authService.setAuth(newUser);
        this.router.navigate(['/session/dashboard']);
      });
      this.form.patchValue({ email: '', password: '' });
    } else {
      this.form.markAllAsTouched();
    }
  }
  createAccount() {
    this.dialog.open(UserCreateComponent, {
      width: '40%',
      minWidth: '280px',
    });
  }
  forgotPassword() {
    this.dialog.open(ForgotPasswordComponent, {
      width: '40%',
      minWidth: '280px',
    });
  }
}
