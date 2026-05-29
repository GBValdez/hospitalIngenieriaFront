import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { AppointmentDto } from '../../interfaces/appointments.interface';

@Component({
  selector: 'app-cancel-appointment-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './cancel-appointment-dialog.component.html',
  styleUrls: ['./cancel-appointment-dialog.component.scss'],
})
export class CancelAppointmentDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public appointment: AppointmentDto,
    private dialogRef: MatDialogRef<CancelAppointmentDialogComponent>,
  ) {}

  cancelar(): void {
    this.dialogRef.close(false);
  }

  confirmar(): void {
    this.dialogRef.close(true);
  }
}
