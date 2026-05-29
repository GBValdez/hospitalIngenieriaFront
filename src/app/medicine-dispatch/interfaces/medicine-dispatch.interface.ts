export interface DispatchRecipeDto {
  appointmentId: number;
  appointmentReason: string;
  patientId: number;
  patientName: string;
  patientDpi: string;
  doctorId: number;
  doctorName: string;
  appointmentDate: string;
  medicines: DispatchRecipeItemDto[];
}

export interface DispatchRecipeItemDto {
  recipeId: number;
  medicineId: number;
  medicineName: string;
  days: number;
  timeLimit: number;
  prescribedAmount: number;
  alreadyDispatched: number;
  pendingAmount: number;
  availableStock: number;
  price: number;
}

export interface DispatchPayloadDto {
  appointmentId: number;
  dpi: string;
  items: DispatchPayloadItemDto[];
}

export interface DispatchPayloadItemDto {
  recipeId: number;
  amount: number;
}

export interface MedicineInventoryDto {
  medicineId: number;
  medicineName: string;
  price: number;
  stock: number;
}

export interface InventoryEntryDto {
  medicineId: number;
  amount: number;
  unitPrice?: number;
  reason?: string;
}

export interface InventoryMovementDto {
  id: number;
  medicineId: number;
  medicineName: string;
  movementType: string;
  amount: number;
  previousStock: number;
  newStock: number;
  unitPrice: number;
  reason: string;
  dispatchId?: number;
  createAt?: string;
  registeredByUserName?: string;
}
