import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonsSvcService } from '@utils/commons-svc.service';
import {
  DoctorCreationDto,
  DoctorDto,
  DoctorUpdateDto,
} from '../interfaces/doctors.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DoctorsService extends CommonsSvcService<
  DoctorDto,
  DoctorCreationDto | DoctorUpdateDto
> {
  constructor(protected override http: HttpClient) {
    super(http);
    this.url = 'api/doctores';
  }

  override put<queryParam>(
    id: number,
    body: DoctorUpdateDto,
  ): Observable<DoctorDto> {
    return super.put(id, body);
  }
}
