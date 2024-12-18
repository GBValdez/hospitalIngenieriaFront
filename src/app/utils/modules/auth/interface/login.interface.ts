export interface loginInterface {
  email: string;
  password: string;
}
export interface responseLoginInterface {
  token: string;
  expiration: Date;
}
