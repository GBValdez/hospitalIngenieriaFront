import { NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { authUserInterface } from '@auth/interface/auth.inteface';
import { AuthService } from '@auth/services/auth.service';
import { catalogueData } from '@catalogues/catalogueData';
import { SideMenuComponent } from '@utils/side-menu/side-menu.component';
import { sideMenuInterface } from '@utils/side-menu/side-menu.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-general-menu',
  standalone: true,
  imports: [SideMenuComponent, RouterModule, NgClass],
  templateUrl: './general-menu.component.html',
  styleUrl: './general-menu.component.scss',
})
export class GeneralMenuComponent implements OnInit {
  constructor(private auth: AuthService) {}
  ngOnInit(): void {
    this.auth.getObservable().subscribe((res) => {
      this.setPermission(res);
    });
    this.setPermission(this.auth.getAuth());
  }

  setPermission(res: authUserInterface | null) {
    if (!res) {
      this.buttons = [];
      return;
    }
    this.buttons = [
      {
        text: 'Dashboard',
        icon: 'dashboard',
        click: '/session/dashboard',
        show: true,
      },
      {
        text: 'Citas',
        icon: 'event',
        click: '/session/appointments',
        show:
          res?.roles.includes('userNormal') ||
          res?.roles.includes('NURSE') ||
          res?.roles.includes('ADMINISTRATOR'),
      },
      {
        text: 'Inventario',
        icon: 'medication',
        click: '/session/dispatch-medicine',
        show:
          res?.roles.includes('PHARMACY_ATTENDANT') ||
          res?.roles.includes('ADMINISTRATOR'),
      },
      {
        text: 'Administrador',
        icon: 'admin_panel_settings',
        show: res?.roles.includes('ADMINISTRATOR'),
        child: [
          {
            text: 'Usuarios',
            icon: 'people',
            click: '/session/user-home',
            show: true,
          },
          {
            text: 'Doctores',
            icon: 'medical_services',
            click: '/session/doctors',
            show: true,
          },
          {
            text: 'Laboratorio',
            icon: 'science',
            click: '/session/laboratory-attendants',
            show: true,
          },
          {
            text: 'Enfermeras',
            icon: 'local_hospital',
            click: '/session/nurses',
            show: true,
          },
          {
            text: 'Repartidores',
            icon: 'people',
            click: '/session/driver-home',
            show: true,
          },
          {
            text: 'Catálogos',
            icon: 'list',
            child: [
              ...catalogueData.map((catalogue) => {
                return {
                  text: catalogue.title,
                  icon: 'list',
                  click: `/session/catalogue/${catalogue.name}`,
                  show: true,
                };
              }),
            ],
            show: true,
          },
        ],
      },

      {
        text: 'Cerrar sesión',
        icon: 'logout',
        click: async () => {
          const RES = await Swal.fire({
            title: '¿Estás seguro de cerrar sesión?',
            showCancelButton: true,
            confirmButtonText: 'Cerrar sesión',
            cancelButtonText: 'Cancelar',
            icon: 'question',
          });
          if (RES.isConfirmed) this.auth.logout();
        },
        show: true,
      },
    ];
  }

  buttons: sideMenuInterface[] = [];
  isCollapsed: boolean = true;
}
