import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import {
  DispatchPayloadDto,
  DispatchRecipeDto,
  InventoryEntryDto,
  InventoryMovementDto,
  MedicineInventoryDto,
} from '../interfaces/medicine-dispatch.interface';

@Injectable({
  providedIn: 'root',
})
export class MedicineDispatchService {
  private readonly url = `${environment.api}/api/medicamentos`;

  constructor(private http: HttpClient) {}

  getRecipe(appointmentId: number): Observable<DispatchRecipeDto> {
    return this.http.get<DispatchRecipeDto>(`${this.url}/receta/${appointmentId}`);
  }

  dispatch(payload: DispatchPayloadDto): Observable<void> {
    return this.http.post<void>(`${this.url}/despachar`, payload);
  }

  getInventory(): Observable<MedicineInventoryDto[]> {
    return this.http.get<MedicineInventoryDto[]>(`${this.url}/inventario`);
  }

  registerEntry(payload: InventoryEntryDto): Observable<void> {
    return this.http.post<void>(`${this.url}/inventario/entrada`, payload);
  }

  getMovements(medicineId?: number): Observable<InventoryMovementDto[]> {
    if (!medicineId) {
      return this.http.get<InventoryMovementDto[]>(`${this.url}/movimientos`);
    }

    return this.http.get<InventoryMovementDto[]>(`${this.url}/movimientos`, {
      params: { medicineId },
    });
  }
}
