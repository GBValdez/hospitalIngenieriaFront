import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { UserCreateDto } from '@user/interface/user.interface';
import { fixedQueryParams } from '@utils/utils';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private urlBase: string = `${environment.api}/user`;
  constructor(private httpClient: HttpClient) {}
  createUser(user: UserCreateDto): Observable<any> {
    return this.httpClient.post(`${this.urlBase}/register`, user);
  }
  verifyEmail(token: string, email: string): Observable<any> {
    const params = fixedQueryParams({ token, email });
    return this.httpClient.get(`${this.urlBase}/confirmEmail`, { params });
  }
  forgotPassword(email: string): Observable<any> {
    return this.httpClient.post(`${this.urlBase}/forgotPassword`, { email });
  }
  resetPassword(
    token: string,
    email: string,
    password: string
  ): Observable<any> {
    return this.httpClient.post(`${this.urlBase}/resetPassword`, {
      token,
      email,
      password,
    });
  }
}
