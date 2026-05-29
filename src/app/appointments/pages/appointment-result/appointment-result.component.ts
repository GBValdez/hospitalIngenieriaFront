import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppointmentResultDto } from '../../interfaces/appointments.interface';
import { AppointmentsService } from '../../services/appointments.service';

@Component({
  selector: 'app-appointment-result',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './appointment-result.component.html',
  styleUrls: ['./appointment-result.component.scss'],
})
export class AppointmentResultComponent implements OnInit {
  result?: AppointmentResultDto;
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appointmentsService: AppointmentsService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'No se encontro la cita.';
      return;
    }

    this.loading = true;
    this.appointmentsService.getResultadoCita(id).subscribe({
      next: (result) => {
        this.result = result;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.error || err?.error?.message || 'No se pudo cargar el resultado.';
        this.loading = false;
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/session/appointments']);
  }
}
