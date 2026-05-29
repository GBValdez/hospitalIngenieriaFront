import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '@auth/services/auth.service';
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
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatTableModule,
    OnlyNumberInputDirective,
  ],
  templateUrl: './despachar-medicina.component.html',
  styleUrls: ['./despachar-medicina.component.scss'],
})
export class DespacharMedicinaComponent implements OnInit {
  @ViewChild('entryDialog') entryDialog!: TemplateRef<unknown>;

  searchForm: FormGroup;
  dispatchForm: FormGroup;
  entryForm: FormGroup;
  activeView: 'inventory' | 'dispatch' | 'movements' = 'inventory';
  selectedTabIndex = 0;
  recipe?: DispatchRecipeDto;
  inventory: MedicineInventoryDto[] = [];
  movements: InventoryMovementDto[] = [];
  inventoryColumns = ['medicineName', 'price', 'stock', 'actions'];
  movementColumns = ['createAt', 'movementType', 'medicineName', 'amount', 'stock', 'reason'];
  loadingRecipe = false;
  loadingInventory = false;
  error = '';
  entryTitle = 'Entrada de inventario';
  canViewMovements = false;
  private dialogRef?: MatDialogRef<unknown>;

  constructor(
    private service: MedicineDispatchService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private authService: AuthService,
  ) {
    this.searchForm = this.fb.group({
      appointmentId: ['', [Validators.required, Validators.min(1)]],
      dpi: ['', [Validators.required, Validators.minLength(13), Validators.maxLength(13)]],
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
    const roles = this.authService.getAuth()?.roles ?? [];
    this.canViewMovements = roles.includes('ADMINISTRATOR');
    this.loadInventory();
    if (this.canViewMovements) {
      this.loadMovements();
    }
  }

  get medicinesArray(): FormArray {
    return this.dispatchForm.get('medicines') as FormArray;
  }

  showInventory(): void {
    this.selectedTabIndex = 0;
    this.activeView = 'inventory';
    this.error = '';
    this.loadInventory();
  }

  showDispatch(): void {
    this.selectedTabIndex = 1;
    this.activeView = 'dispatch';
    this.error = '';
  }

  showMovements(): void {
    if (!this.canViewMovements) {
      this.showInventory();
      return;
    }

    this.selectedTabIndex = 2;
    this.activeView = 'movements';
    this.error = '';
    this.loadMovements();
  }

  changeTab(index: number): void {
    if (index === 0) {
      this.showInventory();
      return;
    }

    if (index === 1) {
      this.showDispatch();
      return;
    }

    this.showMovements();
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
    this.service.getRecipe(
      Number(this.searchForm.value.appointmentId),
      this.searchForm.value.dpi,
    ).subscribe({
      next: (recipe) => {
        this.recipe = recipe;
        recipe.medicines.forEach((medicine) => {
          const maxDispatch = Math.min(medicine.pendingAmount, medicine.availableStock);
          this.medicinesArray.push(this.createDispatchMedicineGroup(maxDispatch));
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
      this.error = `Cantidad invalida para ${invalid.medicineName}. No puede superar lo pendiente ni el stock disponible.`;
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
      dpi: this.searchForm.value.dpi,
      items: items.map((item) => ({ recipeId: item.recipeId, amount: item.amount })),
    };

    this.service.dispatch(payload).subscribe({
      next: async () => {
        await Swal.fire('Despacho registrado', 'La medicina fue despachada correctamente.', 'success');
        this.searchRecipe();
        this.loadInventory();
        if (this.canViewMovements) {
          this.loadMovements();
        }
        this.selectedTabIndex = 0;
        this.activeView = 'inventory';
      },
      error: (err) => {
        this.error = err?.error?.error || err?.error?.message || 'No se pudo registrar el despacho.';
      },
    });
  }

  openInventoryEntry(item: MedicineInventoryDto): void {
    this.entryTitle = 'Entrada de inventario';
    this.entryForm.reset({
      medicineId: item.medicineId,
      amount: '',
      unitPrice: item.price,
      reason: 'Entrada de inventario',
    });
    this.dialogRef = this.dialog.open(this.entryDialog, {
      width: '520px',
      maxWidth: 'calc(100vw - 32px)',
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
        this.dialogRef?.close();
        this.loadInventory();
        if (this.canViewMovements) {
          this.loadMovements();
        }
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

  selectedControl(index: number): AbstractControl | null {
    return this.medicinesArray.at(index)?.get('selected') ?? null;
  }

  isMedicineSelected(index: number): boolean {
    return this.selectedControl(index)?.value === true;
  }

  closeEntryDialog(): void {
    this.dialogRef?.close();
  }

  private createDispatchMedicineGroup(maxDispatch: number): FormGroup {
    const canDispatch = maxDispatch > 0;
    const group = this.fb.group({
      selected: [{ value: canDispatch, disabled: !canDispatch }],
      amount: [{ value: canDispatch ? maxDispatch : 0, disabled: !canDispatch }],
    });

    this.syncAmountValidators(group, maxDispatch);
    group.get('selected')?.valueChanges.subscribe((selected) => {
      this.syncAmountValidators(group, maxDispatch, selected === true);
    });

    return group;
  }

  private syncAmountValidators(
    group: FormGroup,
    maxDispatch: number,
    selected = group.get('selected')?.value === true,
  ): void {
    const amount = group.get('amount');
    if (!amount) {
      return;
    }

    if (!selected) {
      amount.clearValidators();
      amount.disable({ emitEvent: false });
      amount.updateValueAndValidity({ emitEvent: false });
      return;
    }

    amount.enable({ emitEvent: false });
    amount.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(maxDispatch),
    ]);

    if (Number(amount.value || 0) <= 0) {
      amount.setValue(maxDispatch, { emitEvent: false });
    }

    amount.updateValueAndValidity({ emitEvent: false });
  }
}
