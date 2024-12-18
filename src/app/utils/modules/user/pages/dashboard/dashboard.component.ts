import { Component } from '@angular/core';
import { SideMenuComponent } from '@utils/side-menu/side-menu.component';
import { sideMenuInterface } from '@utils/side-menu/side-menu.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SideMenuComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {}
