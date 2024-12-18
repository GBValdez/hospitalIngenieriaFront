import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import {
  catalogueInterface,
  catalogueQuery,
  pagDto,
} from '@utils/commons.interface';
import { fixedQueryParams } from '@utils/utils';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CatalogueService {
  private baseUrl: string = environment.api;
  constructor(private http: HttpClient) {}
  get(
    catalogue: string,
    pageNumber: number,
    pageSize: number,
    query?: catalogueQuery,
    all: boolean = true
  ): Observable<pagDto<catalogueInterface>> {
    const params: any = fixedQueryParams({
      all,
      pageNumber,
      pageSize,
      ...query,
    });
    return this.http.get<pagDto<catalogueInterface>>(
      `${this.baseUrl}/${catalogue}`,
      {
        params,
      }
    );
  }

  create(
    newCatalogue: catalogueInterface,
    catalogue: string
  ): Observable<catalogueInterface> {
    return this.http.post<catalogueInterface>(
      `${this.baseUrl}/${catalogue}`,
      newCatalogue
    );
  }

  update(
    id: string | number,
    catalogue: string,
    newCatalogue: catalogueInterface
  ): Observable<catalogueInterface> {
    return this.http.put<catalogueInterface>(
      `${this.baseUrl}/${catalogue}/${id}`,
      newCatalogue
    );
  }

  delete(id: string | number, catalogue: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${catalogue}/${id}`);
  }
}
