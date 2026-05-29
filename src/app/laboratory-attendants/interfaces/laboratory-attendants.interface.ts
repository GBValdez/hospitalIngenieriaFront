export interface LaboratoryAttendantDto {
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
  examTypeIds: number[];
  examTypeNames: string[];
  userId: string;
  userName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
}

export interface LaboratoryAttendantCreationDto {
  name: string;
  dpi: string;
  direction: string;
  birthday: string;
  sexId: number;
  nationalityId: number;
  hiringDate: string;
  examTypeIds: number[];
  email: string;
  phoneNumber: string;
  userName: string;
  password: string;
}

export interface LaboratoryAttendantUpdateDto {
  name: string;
  dpi: string;
  direction: string;
  birthday: string;
  sexId: number;
  nationalityId: number;
  hiringDate: string;
  examTypeIds: number[];
  email: string;
  phoneNumber: string;
  isActive: boolean;
}

export interface LaboratoryAttendantQueryDto {
  name?: string;
  email?: string;
  examTypeId?: number;
  isActive?: boolean;
}
