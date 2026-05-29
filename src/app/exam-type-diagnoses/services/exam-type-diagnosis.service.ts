import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { fixedQueryParams } from '@utils/utils';
import { Observable } from 'rxjs';
import {
  ExamTypeDiagnosisCreationDto,
  ExamTypeDiagnosisDto,
} from '../interfaces/exam-type-diagnosis.interface';

@Injectable({
  providedIn: 'root',
})
export class ExamTypeDiagnosisService {
  private readonly url = `${environment.api}/exam-type-disease-or-injuries`;

  constructor(private http: HttpClient) {}

  get(query?: Record<string, unknown>): Observable<ExamTypeDiagnosisDto[]> {
    return this.http.get<ExamTypeDiagnosisDto[]>(this.url, {
      params: fixedQueryParams(query ?? {}),
    });
  }

  post(body: ExamTypeDiagnosisCreationDto): Observable<ExamTypeDiagnosisDto> {
    return this.http.post<ExamTypeDiagnosisDto>(this.url, body);
  }

  put(id: number, body: ExamTypeDiagnosisCreationDto): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
