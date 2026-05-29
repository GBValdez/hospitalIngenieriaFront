import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonsSvcService } from '@utils/commons-svc.service';
import { Observable } from 'rxjs';
import {
  LaboratoryAttendantCreationDto,
  LaboratoryAttendantDto,
  LaboratoryAttendantUpdateDto,
} from '../interfaces/laboratory-attendants.interface';

@Injectable({
  providedIn: 'root',
})
export class LaboratoryAttendantsService extends CommonsSvcService<
  LaboratoryAttendantDto,
  LaboratoryAttendantCreationDto | LaboratoryAttendantUpdateDto
> {
  constructor(protected override http: HttpClient) {
    super(http);
    this.url = 'api/encargados-laboratorio';
  }

  override put<queryParam>(
    id: number,
    body: LaboratoryAttendantUpdateDto,
  ): Observable<LaboratoryAttendantDto> {
    return super.put(id, body);
  }
}
