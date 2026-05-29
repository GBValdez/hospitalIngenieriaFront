import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonsSvcService } from '@utils/commons-svc.service';
import {
  NurseCreationDto,
  NurseDto,
  NurseUpdateDto,
} from '../interfaces/nurses.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NursesService extends CommonsSvcService<
  NurseDto,
  NurseCreationDto | NurseUpdateDto
> {
  constructor(protected override http: HttpClient) {
    super(http);
    this.url = 'api/enfermeras';
  }

  override put<queryParam>(
    id: number,
    body: NurseUpdateDto,
  ): Observable<NurseDto> {
    return super.put(id, body);
  }
}
