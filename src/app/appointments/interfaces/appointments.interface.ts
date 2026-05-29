export interface AppointmentDto {
  id: number;
  scheduledDate?: string;
  reason: string;
  isEmergency: boolean;
  startDate: string;
  endDate: string;
  bloodPressure?: string;
  diagnosis?: string;
  observations?: string;
  treatment?: string;
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  doctorId: number;
  patientId: number;
  status?: string;
}

export interface AppointmentCreationDto {
  scheduledDate?: string;
  reason: string;
  isEmergency: boolean;
  startDate: string;
  endDate: string;
  bloodPressure?: string;
  diagnosis?: string;
  observations?: string;
  treatment?: string;
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  doctorId: number;
  patientId: number;
}

export interface AppointmentAvailabilityDto {
  disponible: boolean;
  doctorId?: number;
}

export interface ReagendarDto {
  citaId: number;
  newStartDate: string;
  newEndDate: string;
}
