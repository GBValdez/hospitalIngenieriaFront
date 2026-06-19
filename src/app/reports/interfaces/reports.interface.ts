export interface ReportSummaryDto {
  startDateFrom: string;
  startDateTo: string;
  totals: ReportTotalsDto;
  appointmentsByStatus: ReportCountDto[];
  appointmentsByDoctor: ReportCountDto[];
  examsByStatus: ReportCountDto[];
  examsByType: ReportCountDto[];
  topDiagnoses: ReportCountDto[];
  topPrescribedMedicines: ReportCountDto[];
  topDispatchedMedicines: ReportCountDto[];
  lowStockMedicines: LowStockMedicineDto[];
  doctorReports: DoctorReportsDto;
}

export interface ReportTotalsDto {
  appointments: number;
  finalizedAppointments: number;
  exams: number;
  finalizedExams: number;
  recipes: number;
  dispatchedUnits: number;
  dispatchRevenue: number;
  lowStockMedicines: number;
}

export interface ReportCountDto {
  name: string;
  count: number;
  amount: number;
}

export interface DoctorReportsDto {
  patientsAttendedByDoctor: ReportCountDto[];
  appointmentsByDoctor: ReportCountDto[];
  finalizedAppointmentsByDoctor: ReportCountDto[];
  emergencyAppointmentsByDoctor: ReportCountDto[];
  averageAttentionMinutesByDoctor: ReportCountDto[];
  recipesByDoctor: ReportCountDto[];
  prescribedMedicinesByDoctor: ReportCountDto[];
  dispatchedMedicinesByDoctor: ReportCountDto[];
  diagnosesByDoctor: ReportCountDto[];
  appointmentsBySpecialty: ReportCountDto[];
}

export interface LowStockMedicineDto {
  medicineId: number;
  medicineName: string;
  stock: number;
  price: number;
}
