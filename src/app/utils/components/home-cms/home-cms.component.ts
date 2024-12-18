import {
  Component,
  Input,
  input,
  InputSignal,
  TemplateRef,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';

import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import {
  clickTypeBasic,
  homeSvc,
  infoModalDto,
  pagDto,
} from '@utils/commons.interface';
import Swal from 'sweetalert2';
import { NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { clickType } from '@utils/side-menu/side-menu.interface';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-home-cms',
  standalone: true,
  imports: [
    MatCardModule,
    MatMenuModule,
    MatIconModule,
    MatPaginatorModule,
    MatTableModule,
    NgTemplateOutlet,
    MatButtonModule,
  ],
  templateUrl: './home-cms.component.html',
  styleUrl: './home-cms.component.scss',
})
export class HomeCmsComponent {
  constructor(
    private dialog: MatDialog,
    private route: Router,
    private routeAct: ActivatedRoute
  ) {}
  data: any[] = [];
  pageNumber: number = 0;
  pageSize: number = 10;
  dataSize: number = 0;
  homeSvc: InputSignal<homeSvc> = input.required();
  @Input() templateRef!: TemplateRef<any>; // Recibe la plantilla desde el padre

  ngOnInit(): void {
    this.getData(this.pageNumber, this.pageSize);
  }

  getData(pageNumber: number, pageSize: number) {
    this.homeSvc()!
      .get({
        pageNumber: pageNumber + 1,
        pageSize,
        query: this.homeSvc()?.query,
      })
      .subscribe((res: pagDto<any>) => {
        if (res.total > 0) {
          console.log('res', res);
          this.data = res.items;
          this.dataSize = res.total;
        } else {
          this.data = [];
          this.dataSize = 0;
          Swal.fire('No se encontraron registros', '', 'info');
        }
      });
  }

  changePagination(event: PageEvent) {
    this.pageNumber = event.pageIndex;
    this.pageSize = event.pageSize;
    this.getData(this.pageNumber, this.pageSize);
  }
  async deleteItem(catalogue: any) {
    const result = await Swal.fire({
      title: '¿Estas seguro de eliminar este registro?',
      icon: 'warning',
      showCancelButton: true,
    });
    if (result.isConfirmed) {
      this.homeSvc()
        .delete(catalogue.id!)
        .subscribe(async () => {
          await Swal.fire('Eliminado', 'Registro eliminado', 'success');
          this.pageNumber = 0;
          this.getData(this.pageNumber, this.pageSize);
        });
    }
  }

  openForm(item?: any) {
    const DATA: infoModalDto<any> = {
      routerAct: this.routeAct,
      data: item,
    };

    this.dialog
      .open(this.homeSvc().formComponent, {
        width: '60%',
        minWidth: '280px',
        data: DATA,
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.modify) {
          this.getData(this.pageNumber, this.pageSize);
        }
      });
  }

  clickBtn(click: clickTypeBasic, id: number) {
    if (click)
      if (typeof click == 'string') {
        this.route.navigate([click, id]);
      } else {
        click(id);
      }
  }
}
