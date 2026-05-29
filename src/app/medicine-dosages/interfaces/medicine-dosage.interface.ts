export interface MedicineDosageDto {
  id: number;
  medicineId: number;
  medicineName: string;
  diseaseOrInjuryId: number;
  diseaseOrInjuryName: string;
  recommendedAmount: number;
  maximumAmount: number;
  notes?: string;
}

export interface MedicineDosageCreationDto {
  medicineId: number;
  diseaseOrInjuryId: number;
  recommendedAmount: number;
  maximumAmount: number;
  notes?: string;
}

export interface MedicineDosageQueryDto {
  medicineId?: number | null;
  diseaseOrInjuryId?: number | null;
  diseaseOrInjuryIds?: string | null;
}
