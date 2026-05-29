import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { fixedQueryParams } from '@utils/utils';
import { Observable } from 'rxjs';
import {
  MedicineDosageCreationDto,
  MedicineDosageDto,
  MedicineDosageQueryDto,
} from '../interfaces/medicine-dosage.interface';

@Injectable({
  providedIn: 'root',
})
export class MedicineDosageService {
  private readonly url = `${environment.api}/medicine-disease-or-injury-dosages`;

  constructor(private http: HttpClient) {}

  get(query?: MedicineDosageQueryDto): Observable<MedicineDosageDto[]> {
    return this.http.get<MedicineDosageDto[]>(this.url, {
      params: fixedQueryParams(query ?? {}),
    });
  }

  getByDiseases(diseaseOrInjuryIds: number[]): Observable<MedicineDosageDto[]> {
    return this.get({
      diseaseOrInjuryIds: diseaseOrInjuryIds.join(','),
    });
  }

  post(payload: MedicineDosageCreationDto): Observable<MedicineDosageDto> {
    return this.http.post<MedicineDosageDto>(this.url, payload);
  }

  put(id: number, payload: MedicineDosageCreationDto): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
