import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { pagDto, pagOptions } from './commons.interface';
import { fixedQueryParams } from './utils';

// Servicio generico para la gestión de entidades
@Injectable({
  providedIn: 'root',
})
export class CommonsSvcService<dto, dtoCreation> {
  protected urlBase: string = '';
  constructor(protected http: HttpClient) {}
  // Creacion de la url base para el consumo de los servicios
  set url(url: string) {
    this.urlBase = `${environment.api}/${url}`;
  }
  protected fixedQueryParams<queryParam>(opts?: pagOptions<queryParam>) {
    if (!opts) return {};

    let PARAMS = {
      ...(opts.query ?? {}),
      pageSize: opts.pageSize ?? undefined,
      pageNumber: opts.pageNumber ?? undefined,
      all: opts.all ?? undefined,
    };
    return fixedQueryParams(PARAMS);
  }

  get<queryParam>(opts?: pagOptions<queryParam>): Observable<pagDto<dto>> {
    console.log('opts', this.urlBase);
    const PARAMS = this.fixedQueryParams<queryParam>(opts);
    return this.http.get<pagDto<dto>>(this.urlBase, { params: PARAMS });
  }
  getById<queryParam>(
    id: number,
    opts?: pagOptions<queryParam>
  ): Observable<dto> {
    const PARAMS = this.fixedQueryParams<queryParam>(opts);
    return this.http.get<dto>(`${this.urlBase}/${id}`, { params: PARAMS });
  }
  post<queryParam>(
    body: dtoCreation,
    opts?: pagOptions<queryParam>
  ): Observable<dto> {
    const PARAMS = this.fixedQueryParams<queryParam>(opts);
    return this.http.post<dto>(this.urlBase, body, { params: PARAMS });
  }
  put<queryParam>(
    id: number,
    body: dtoCreation,
    opts?: pagOptions<queryParam>
  ): Observable<dto> {
    const PARAMS = this.fixedQueryParams<queryParam>(opts);
    return this.http.put<dto>(`${this.urlBase}/${id}`, body, {
      params: PARAMS,
    });
  }
  delete<queryParam>(
    id: number,
    opts?: pagOptions<queryParam>
  ): Observable<dto> {
    const PARAMS = this.fixedQueryParams<queryParam>(opts);
    return this.http.delete<dto>(`${this.urlBase}/${id}`, { params: PARAMS });
  }

  postGroup<queryParam>(
    body: dtoCreation[],
    opts?: pagOptions<queryParam>
  ): Observable<dto[]> {
    const PARAMS = this.fixedQueryParams<queryParam>(opts);
    return this.http.post<dto[]>(`${this.urlBase}/group`, body, {
      params: PARAMS,
    });
  }
}
