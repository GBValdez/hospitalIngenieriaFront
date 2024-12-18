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
        text: 'Ordenes',
        icon: 'shopping_cart',
        child: [
          {
            text: 'Realizar Orden',
            icon: 'add_shopping_cart',
            click: '/session/orders-add',
            show: true,
          },
          {
            text: 'Historial de Ordenes',
            icon: 'history',
            click: '/session/orders-home',
            show: true,
          },
        ],
        show: res?.roles.includes('userNormal'),
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
            text: 'Proveedores',
            icon: 'local_shipping',
            click: '/session/provider-home',
            show: true,
          },
          {
            text: 'Productos',
            icon: 'shopping_cart',
            click: '/session/product-home',
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
