export interface AppointmentDto {
  id: number;
  scheduledDate?: string;
  arrivalDate?: string;
  reason: string;
  isEmergency: boolean;
  startDate: string;
  endDate?: string;
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
  doctorName?: string;
  patientName?: string;
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
  recomendaciones?: AppointmentAvailabilitySuggestionDto[];
}

export interface AppointmentAvailabilitySuggestionDto {
  startDate: string;
  endDate: string;
  doctorId: number;
}

export interface ReagendarDto {
  citaId: number;
  newStartDate: string;
  newEndDate?: string;
}

export interface InicioCitaDto {
  appointmentId: number;
  bloodPressure: number;
  temperature: number;
  heartRate: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  weight: number;
  height: number;
}

export interface FinalizarCitaRecipeDto {
  medicineId: number;
  days: number;
  timeLimit: number;
}

export interface FinalizarCitaExamDto {
  examTypeId: number;
  indications: string;
}

export interface FinalizarCitaDto {
  appointmentId: number;
  diagnosis: string;
  observations?: string;
  treatment: string;
  requiresRecipe: boolean;
  recipes: FinalizarCitaRecipeDto[];
  requiresLabExams: boolean;
  labExams: FinalizarCitaExamDto[];
  requiresReschedule: boolean;
  rescheduleReason?: string;
  newStartDate?: string;
}

export interface AppointmentStatusHistoryDto {
  id: number;
  appointmentId: number;
  previousStatus?: string;
  status: string;
  comment?: string;
  changedAt: string;
  changedByUserId?: string;
  changedByUserName?: string;
}

export interface ExamDto {
  id: number;
  startDate: string;
  endDate: string;
  results: string;
  observations: string;
  examTypeId: number;
  examTypeName: string;
  appointmentId: number;
  appointmentReason: string;
  attendantId: number;
  attendantName: string;
  doctorId: number;
  doctorName: string;
  patientId: number;
  patientName: string;
  status: string;
}

export interface ExamStatusHistoryDto {
  id: number;
  examId: number;
  previousStatus?: string;
  status: string;
  comment?: string;
  changedAt: string;
  changedByUserId?: string;
  changedByUserName?: string;
}
