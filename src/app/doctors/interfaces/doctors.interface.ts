export interface DoctorDto {
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
  specialtyId: number;
  specialtyName?: string;
  specialtyIds: number[];
  specialtyNames: string[];
  licenseNumber: string;
  userId: string;
  userName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
}

export interface DoctorCreationDto {
  name: string;
  dpi: string;
  direction: string;
  birthday: string;
  sexId: number;
  nationalityId: number;
  hiringDate: string;
  specialtyIds: number[];
  licenseNumber: string;
  email: string;
  phoneNumber: string;
  userName: string;
  password: string;
}

export interface DoctorUpdateDto {
  name: string;
  dpi: string;
  direction: string;
  birthday: string;
  sexId: number;
  nationalityId: number;
  hiringDate: string;
  specialtyIds: number[];
  licenseNumber: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
}

export interface DoctorQueryDto {
  name?: string;
  email?: string;
  specialtyId?: number;
  isActive?: boolean;
}
