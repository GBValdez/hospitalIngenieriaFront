import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { fixedQueryParams } from '@utils/utils';
import { Observable } from 'rxjs';
import { ReportSummaryDto } from '../interfaces/reports.interface';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private readonly url = `${environment.api}/api/reportes`;

  constructor(private http: HttpClient) {}

  getSummary(query: Record<string, unknown>): Observable<ReportSummaryDto> {
    return this.http.get<ReportSummaryDto>(`${this.url}/resumen`, {
      params: fixedQueryParams(query),
    });
  }
}
