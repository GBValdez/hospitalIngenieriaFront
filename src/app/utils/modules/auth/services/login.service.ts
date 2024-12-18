import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  loginInterface,
  responseLoginInterface,
} from '@auth/interface/login.interface';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private urlBase: string = environment.api;
  constructor(private http: HttpClient) {}
  login(credentials: loginInterface): Observable<responseLoginInterface> {
    return this.http.post<responseLoginInterface>(
      `${this.urlBase}/user/login`,
      credentials
    );
  }
}
