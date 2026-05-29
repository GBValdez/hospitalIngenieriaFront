export interface NurseDto {
  id: number;
  name: string;
  dpi: string;
  direction: string;
  birthday: string;
  sexId: number;
  sexName?: string;
  nationalityId: number;
  nationalityName?: string;
  hiringDate: string;
  userId: string;
  userName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
}

export interface NurseCreationDto {
  name: string;
  dpi: string;
  direction: string;
  birthday: string;
  sexId: number;
  nationalityId: number;
  hiringDate: string;
  email: string;
  phoneNumber: string;
  userName: string;
  password: string;
}

export interface NurseUpdateDto {
  name: string;
  dpi: string;
  direction: string;
  birthday: string;
  sexId: number;
  nationalityId: number;
  hiringDate: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
}

export interface NurseQueryDto {
  name?: string;
  email?: string;
  isActive?: boolean;
}
