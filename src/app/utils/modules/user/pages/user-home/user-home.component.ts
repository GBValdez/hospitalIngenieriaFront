import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { UserDto, userQueryFilter } from '@user/interface/user.interface';
import { RolService } from '@user/services/rol.service';
import { UserAdminService } from '@user/services/user-admin.service';
import { catalogueInterface } from '@utils/commons.interface';
import { formIsEmptyValidator } from '@utils/utils';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-home',
  standalone: true,
  imports: [
    MatCardModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatPaginatorModule,
    DatePipe,
    RouterModule,
    MatSelectModule,
  ],
  templateUrl: './user-home.component.html',
  styleUrl: './user-home.component.scss',
})
export class UserHomeComponent implements OnInit {
  constructor(
    private userAdminSvc: UserAdminService,
    private fb: FormBuilder,
    private rolSvc: RolService
  ) {}
  ngOnInit(): void {
    this.form = this.fb.group(
      {
        UserNameCont: [''],
        EmailCont: [''],
        roles: [''],
        isActive: [null],
      },
      {
        validators: formIsEmptyValidator(),
      }
    );
    this.getUser(1, 10);
    this.rolSvc.get({ all: true }).subscribe((res) => {
      this.rolesOpt = res.items;
    });
  }
  rolesOpt: catalogueInterface[] = [];
  form!: FormGroup;
  users: UserDto[] = [];
  sizeUsers: number = 0;
  indexPage: number = 0;
  pageSize: number = 10;

  getUser(page: number, pageSize: number, filter?: userQueryFilter) {
    this.userAdminSvc.getUsers(pageSize, page, filter).subscribe((res) => {
      if (res.total > 0) {
        this.users = res.items;
        this.sizeUsers = res.total;
      } else {
        Swal.fire('No se encontraron usuarios', '', 'info');
      }
    });
  }

  changePagination(event: PageEvent) {
    this.indexPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.getUser(event.pageIndex + 1, event.pageSize);
  }
  search() {
    if (this.form.valid) this.getUser(1, 10, this.form.value);
  }
  cleanFilter() {
    this.form.patchValue({
      UserNameCont: '',
      EmailCont: '',
      roles: [],
      isActive: null,
    });
    this.getUser(1, 10);
  }
}
