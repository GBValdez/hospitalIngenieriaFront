import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { OnlyNumberInputDirective } from '@utils/directivas/only-number-input.directive';
import { AppointmentDto, InicioCitaDto } from '../../interfaces/appointments.interface';
import { AppointmentsService } from '../../services/appointments.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-inicio-cita',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    OnlyNumberInputDirective,
  ],
  templateUrl: './inicio-cita.component.html',
  styleUrls: ['./inicio-cita.component.scss'],
})
export class InicioCitaComponent {
  form: FormGroup;
  saving = false;
  error = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public appointment: AppointmentDto,
    private appointmentsService: AppointmentsService,
    private dialogRef: MatDialogRef<InicioCitaComponent>,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      bloodPressure: [null, [Validators.required, Validators.min(0.1)]],
      temperature: [null, [Validators.required, Validators.min(0.1)]],
      heartRate: [null, [Validators.required, Validators.min(0.1)]],
      respiratoryRate: [null, [Validators.required, Validators.min(0.1)]],
      oxygenSaturation: [null, [Validators.required, Validators.min(0.1)]],
      weight: [null, [Validators.required, Validators.min(0.1)]],
      height: [null, [Validators.required, Validators.min(0.1)]],
    });
  }

  getControl(name: string): AbstractControl | null {
    return this.form.get(name);
  }

  async guardar(): Promise<void> {
    this.error = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const result = await Swal.fire({
      title: 'Deseas iniciar esta cita?',
      text: 'Se registraran los signos vitales y la hora de llegada.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Iniciar cita',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) {
      return;
    }

    const payload: InicioCitaDto = {
      appointmentId: this.appointment.id,
      bloodPressure: Number(this.form.value.bloodPressure),
      temperature: Number(this.form.value.temperature),
      heartRate: Number(this.form.value.heartRate),
      respiratoryRate: Number(this.form.value.respiratoryRate),
      oxygenSaturation: Number(this.form.value.oxygenSaturation),
      weight: Number(this.form.value.weight),
      height: Number(this.form.value.height),
    };

    this.saving = true;
    this.appointmentsService.iniciarCita(payload).subscribe({
      next: async () => {
        this.saving = false;
        await Swal.fire('Cita iniciada', 'El inicio de la cita fue registrado correctamente.', 'success');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.error = 'No se pudo registrar el inicio de la cita.';
        this.saving = false;
        console.error(err);
      },
    });
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }
}
