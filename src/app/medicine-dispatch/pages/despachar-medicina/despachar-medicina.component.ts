import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { OnlyNumberInputDirective } from '@utils/directivas/only-number-input.directive';
import Swal from 'sweetalert2';
import {
  DispatchPayloadDto,
  DispatchRecipeDto,
  InventoryMovementDto,
  MedicineInventoryDto,
} from '../../interfaces/medicine-dispatch.interface';
import { MedicineDispatchService } from '../../services/medicine-dispatch.service';

@Component({
  selector: 'app-despachar-medicina',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    OnlyNumberInputDirective,
  ],
  templateUrl: './despachar-medicina.component.html',
  styleUrls: ['./despachar-medicina.component.scss'],
})
export class DespacharMedicinaComponent implements OnInit {
  searchForm: FormGroup;
  dispatchForm: FormGroup;
  entryForm: FormGroup;
  recipe?: DispatchRecipeDto;
  inventory: MedicineInventoryDto[] = [];
  movements: InventoryMovementDto[] = [];
  loadingRecipe = false;
  loadingInventory = false;
  error = '';

  constructor(
    private service: MedicineDispatchService,
    private fb: FormBuilder,
  ) {
    this.searchForm = this.fb.group({
      appointmentId: ['', [Validators.required, Validators.min(1)]],
    });
    this.dispatchForm = this.fb.group({
      medicines: this.fb.array([]),
    });
    this.entryForm = this.fb.group({
      medicineId: [null, [Validators.required]],
      amount: ['', [Validators.required, Validators.min(1)]],
      unitPrice: [''],
      reason: ['Entrada de inventario'],
    });
  }

  ngOnInit(): void {
    this.loadInventory();
    this.loadMovements();
  }

  get medicinesArray(): FormArray {
    return this.dispatchForm.get('medicines') as FormArray;
  }

  get total(): number {
    if (!this.recipe) {
      return 0;
    }

    return this.medicinesArray.controls.reduce((sum, control, index) => {
      const amount = Number(control.get('amount')?.value || 0);
      return control.get('selected')?.value
        ? sum + amount * this.recipe!.medicines[index].price
        : sum;
    }, 0);
  }

  searchRecipe(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    this.loadingRecipe = true;
    this.error = '';
    this.recipe = undefined;
    this.medicinesArray.clear();
    this.service.getRecipe(Number(this.searchForm.value.appointmentId)).subscribe({
      next: (recipe) => {
        this.recipe = recipe;
        recipe.medicines.forEach((medicine) => {
          const maxDispatch = Math.min(medicine.pendingAmount, medicine.availableStock);
          this.medicinesArray.push(
            this.fb.group({
              selected: [maxDispatch > 0],
              amount: [maxDispatch, [Validators.required, Validators.min(1)]],
            }),
          );
        });
        this.loadingRecipe = false;
      },
      error: (err) => {
        this.error = err?.error?.error || err?.error?.message || 'No se encontro la receta.';
        this.loadingRecipe = false;
      },
    });
  }

  async dispatch(): Promise<void> {
    if (!this.recipe) {
      return;
    }

    const items = this.recipe.medicines
      .map((medicine, index) => ({
        medicine,
        control: this.medicinesArray.at(index),
      }))
      .filter((item) => item.control.get('selected')?.value)
      .map((item) => ({
        recipeId: item.medicine.recipeId,
        amount: Number(item.control.get('amount')?.value || 0),
        pendingAmount: item.medicine.pendingAmount,
        availableStock: item.medicine.availableStock,
        medicineName: item.medicine.medicineName,
      }));

    if (items.length === 0) {
      this.error = 'Debe seleccionar al menos un medicamento.';
      return;
    }

    const invalid = items.find((item) => item.amount <= 0 || item.amount > item.pendingAmount || item.amount > item.availableStock);
    if (invalid) {
      this.error = `Cantidad invalida para ${invalid.medicineName}.`;
      return;
    }

    const result = await Swal.fire({
      title: 'Deseas despachar la medicina?',
      text: `Total a pagar: Q${this.total.toFixed(2)}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Despachar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) {
      return;
    }

    const payload: DispatchPayloadDto = {
      appointmentId: this.recipe.appointmentId,
      items: items.map((item) => ({ recipeId: item.recipeId, amount: item.amount })),
    };

    this.service.dispatch(payload).subscribe({
      next: async () => {
        await Swal.fire('Despacho registrado', 'La medicina fue despachada correctamente.', 'success');
        this.searchRecipe();
        this.loadInventory();
        this.loadMovements();
      },
      error: (err) => {
        this.error = err?.error?.error || err?.error?.message || 'No se pudo registrar el despacho.';
      },
    });
  }

  async registerEntry(): Promise<void> {
    if (this.entryForm.invalid) {
      this.entryForm.markAllAsTouched();
      return;
    }

    const result = await Swal.fire({
      title: 'Deseas registrar esta entrada?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Registrar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) {
      return;
    }

    const value = this.entryForm.value;
    this.service.registerEntry({
      medicineId: Number(value.medicineId),
      amount: Number(value.amount),
      unitPrice: value.unitPrice ? Number(value.unitPrice) : undefined,
      reason: value.reason,
    }).subscribe({
      next: async () => {
        await Swal.fire('Entrada registrada', '', 'success');
        this.entryForm.reset({ reason: 'Entrada de inventario' });
        this.loadInventory();
        this.loadMovements();
      },
      error: (err) => {
        this.error = err?.error?.error || err?.error?.message || 'No se pudo registrar la entrada.';
      },
    });
  }

  loadInventory(): void {
    this.loadingInventory = true;
    this.service.getInventory().subscribe({
      next: (inventory) => {
        this.inventory = inventory;
        this.loadingInventory = false;
      },
      error: () => {
        this.loadingInventory = false;
      },
    });
  }

  loadMovements(): void {
    this.service.getMovements().subscribe((movements) => {
      this.movements = movements;
    });
  }

  amountControl(index: number): AbstractControl | null {
    return this.medicinesArray.at(index)?.get('amount') ?? null;
  }
}
