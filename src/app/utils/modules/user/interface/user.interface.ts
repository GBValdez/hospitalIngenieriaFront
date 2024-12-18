export interface UserDto {
  userName: string;
  email: string;
  isActive?: boolean;
  roles?: string[];
}
export interface UserCreateDto extends clienteDto {
  password: string;
  userName: string;
}

export interface userQueryFilter {
  UserName?: string;
  Email?: string;
}
export interface userUpdateDto {
  roles: string[];
  status: boolean;
}

export interface clienteDto {
  name: string;
  birthdate: Date;
  email: string;
  tel: string;
  address: string;
}
