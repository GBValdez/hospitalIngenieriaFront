import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonsSvcService } from '@utils/commons-svc.service';
import { catalogueInterface } from '@utils/commons.interface';
@Injectable({
  providedIn: 'root',
})
export class RolService extends CommonsSvcService<
  catalogueInterface,
  catalogueInterface
> {
  constructor(http: HttpClient) {
    super(http);
    this.url = 'rol';
  }
}
