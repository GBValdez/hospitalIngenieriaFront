import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import {
  UserDto,
  userQueryFilter,
  userUpdateDto,
} from '@user/interface/user.interface';
import { pagDto } from '@utils/commons.interface';
import { fixedQueryParams } from '@utils/utils';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserAdminService {
  private urlBase: string = `${environment.api}/user`;
  constructor(private httpClient: HttpClient) {}
  getUsers(
    pageSize: number,
    pageNumber: number,
    filters?: userQueryFilter
  ): Observable<pagDto<UserDto>> {
    const params: any = fixedQueryParams({
      pageSize,
      pageNumber,
      ...filters,
    });
    return this.httpClient.get<pagDto<UserDto>>(`${this.urlBase}`, {
      params,
    });
  }
  deleteUser(id: string): Observable<any> {
    return this.httpClient.delete(`${this.urlBase}/${id}`);
  }
  getUserByUserName(userName: string): Observable<UserDto> {
    return this.httpClient.get<UserDto>(`${this.urlBase}/${userName}`);
  }
  updateUser(user: userUpdateDto, userName: string): Observable<any> {
    return this.httpClient.put(`${this.urlBase}/${userName}`, user);
  }
}
