import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '@user/services/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-verify-email',
  standalone: true,
  imports: [],
  templateUrl: './user-verify-email.component.html',
  styleUrl: './user-verify-email.component.scss',
})
export class UserVerifyEmailComponent implements OnInit {
  constructor(
    private userSvc: UserService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const params = this.activatedRoute.snapshot.queryParams;
    const { token, email } = params;
    if (!token || !email) this.router.navigate(['/home']);
    this.userSvc.verifyEmail(token, email).subscribe(
      (res) => {
        Swal.fire('Email verificado', 'El email ha sido verificado', 'success');
        this.router.navigate(['/home']);
      },
      () => {
        Swal.fire('Error', 'El email no ha sido verificado', 'error');
        this.router.navigate(['/home']);
      }
    );
  }
}
