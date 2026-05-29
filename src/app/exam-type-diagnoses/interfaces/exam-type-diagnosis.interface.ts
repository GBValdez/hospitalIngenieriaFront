export interface ExamTypeDiagnosisDto {
  id: number;
  examTypeId: number;
  examTypeName: string;
  diseaseOrInjuryId: number;
  diseaseOrInjuryName: string;
  notes?: string;
}

export interface ExamTypeDiagnosisCreationDto {
  examTypeId: number;
  diseaseOrInjuryId: number;
  notes?: string;
}
