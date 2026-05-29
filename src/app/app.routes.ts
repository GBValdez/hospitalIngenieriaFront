import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Route, Routes } from '@angular/router';
import { AuthGuard } from '@auth/guards/auth.guard';
import {
  catalogueInterface,
  menuBasicInterface,
} from '@utils/commons.interface';
import { CatalogueFormComponent } from '@utils/modules/catalogues/catalogue-form/catalogue-form.component';
import { depCatalogueInterface } from '@utils/modules/catalogues/catalogue.Interface';
import { catalogueData } from '@utils/modules/catalogues/catalogueData';

const createRouteCatalogue = (
  title: string,
  name: string,
  dependency?: depCatalogueInterface,
  subMenu?: menuBasicInterface[],
  afterComplete?: (
    data: catalogueInterface,
    matDialog: MatDialog,
    matDialogRef: MatDialogRef<CatalogueFormComponent>,
  ) => void,
): Route => {
  return {
    path: `catalogue/${name}`,
    loadComponent: () =>
      import(`@catalogues/catalogues-home/catalogues-home.component`).then(
        (m) => m.CataloguesHomeComponent,
      ),
    canActivate: [AuthGuard],
    data: {
      isProtect: 20,
      roles: ['ADMINISTRATOR'],
      titleShow: title,
      typeCatalogue: name,
      dependency: dependency,
      subMenu: subMenu,
      afterComplete: afterComplete,
    },
    title: title,
  };
};
const CATALOGUE_ROUTE = catalogueData.map((catalogue) =>
  createRouteCatalogue(
    catalogue.title,
    catalogue.name,
    catalogue.dependency,
    catalogue.subMenu,
    catalogue.afterComplete,
  ),
);

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./utils/modules/portal/pages/home/portal-home.component').then(
        (m) => m.PortalHomeComponent,
      ),
    data: { isProtect: 25 },
    title: 'Portal',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('@auth/pages/home/home.component').then((m) => m.HomeComponent),
    data: { isProtect: 30 },
    canActivate: [AuthGuard],
    title: 'Iniciar sesión',
  },
  {
    path: 'user/confirmEmail',
    loadComponent: () =>
      import('@user/pages/user-verify-email/user-verify-email.component').then(
        (m) => m.UserVerifyEmailComponent,
      ),
    title: 'Verificar email',
    data: { isProtect: 30 },
    canActivate: [AuthGuard],
  },
  {
    path: 'user/resetPassword/:gmail/:token',
    loadComponent: () =>
      import('@user/pages/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
    title: 'Reiniciar contraseña',
    data: { isProtect: 30 },
    canActivate: [AuthGuard],
  },

  {
    path: 'session',
    loadComponent: () =>
      import('@user/pages/general-menu/general-menu.component').then(
        (m) => m.GeneralMenuComponent,
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('@user/pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
        canActivate: [AuthGuard],
        data: { isProtect: 20 },
        title: 'Dashboard',
      },

      {
        path: 'user-home',
        loadComponent: () =>
          import('@user/pages/user-home/user-home.component').then(
            (m) => m.UserHomeComponent,
          ),
        canActivate: [AuthGuard],
        data: { isProtect: 20, roles: ['ADMINISTRATOR'] },
        title: 'Usuarios',
      },
      {
        path: 'user-home/edit/:userName',
        loadComponent: () =>
          import('@user/pages/user-edit/user-edit.component').then(
            (m) => m.UserEditComponent,
          ),
        title: 'Usuarios',
        data: { isProtect: 20, roles: ['ADMINISTRATOR'] },
        canActivate: [AuthGuard],
      },
      {
        path: 'appointments',
        loadComponent: () =>
          import('@appointments/pages/appointments/appointments.component').then(
            (m) => m.AppointmentsComponent,
          ),
        data: { isProtect: 20, roles: ['userNormal', 'NURSE', 'ADMINISTRATOR'] },
        canActivate: [AuthGuard],
      },
      {
        path: 'doctors',
        loadComponent: () =>
          import('./doctors/pages/doctors/doctors.component').then(
            (m) => m.DoctorsComponent,
          ),
        data: { isProtect: 20, roles: ['ADMINISTRATOR'] },
        canActivate: [AuthGuard],
        title: 'Doctores',
      },
      {
        path: 'laboratory-attendants',
        loadComponent: () =>
          import(
            './laboratory-attendants/pages/laboratory-attendants/laboratory-attendants.component'
          ).then((m) => m.LaboratoryAttendantsComponent),
        data: { isProtect: 20, roles: ['ADMINISTRATOR'] },
        canActivate: [AuthGuard],
        title: 'Encargados de laboratorio',
      },
      {
        path: 'nurses',
        loadComponent: () =>
          import('./nurses/pages/nurses/nurses.component').then(
            (m) => m.NursesComponent,
          ),
        data: { isProtect: 20, roles: ['ADMINISTRATOR'] },
        canActivate: [AuthGuard],
        title: 'Enfermeras',
      },
      {
        path: 'dispatch-medicine',
        loadComponent: () =>
          import(
            './medicine-dispatch/pages/despachar-medicina/despachar-medicina.component'
          ).then((m) => m.DespacharMedicinaComponent),
        data: { isProtect: 20, roles: ['PHARMACY_ATTENDANT', 'ADMINISTRATOR'] },
        canActivate: [AuthGuard],
        title: 'Despachar medicina',
      },
      ...CATALOGUE_ROUTE,
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
