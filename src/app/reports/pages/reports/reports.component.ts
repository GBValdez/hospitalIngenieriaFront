import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import {
  LowStockMedicineDto,
  ReportCountDto,
  ReportSummaryDto,
} from '../../interfaces/reports.interface';
import { ReportsService } from '../../services/reports.service';

Chart.register(...registerables);

type ChartKey =
  | 'appointmentsByStatus'
  | 'appointmentsByDoctor'
  | 'topDiagnoses'
  | 'topPrescribedMedicines'
  | 'topDispatchedMedicines'
  | 'examsByStatus'
  | 'examsByType'
  | 'patientsAttendedByDoctor'
  | 'doctorAppointments'
  | 'finalizedAppointmentsByDoctor'
  | 'emergencyAppointmentsByDoctor'
  | 'averageAttentionMinutesByDoctor'
  | 'recipesByDoctor'
  | 'prescribedMedicinesByDoctor'
  | 'dispatchedMedicinesByDoctor'
  | 'diagnosesByDoctor'
  | 'appointmentsBySpecialty';

type ChartValueType = 'count' | 'amount';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('reportChart') reportChartElements?: QueryList<ElementRef<HTMLCanvasElement>>;

  filterForm: FormGroup;
  report?: ReportSummaryDto;
  loading = false;
  error = '';
  isDoctorReport = false;
  lowStockColumns = ['medicineName', 'stock', 'price'];
  private chartInstances = new Map<HTMLCanvasElement, Chart>();

  constructor(
    private reportsService: ReportsService,
    private fb: FormBuilder,
    private router: Router,
  ) {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    this.filterForm = this.fb.group({
      startDateFrom: [this.toDateInput(firstDay)],
      startDateTo: [this.toDateInput(now)],
      lowStockThreshold: [10],
    });
  }

  ngOnInit(): void {
    this.isDoctorReport = this.router.url.includes('/reports/doctors');
    this.loadReport();
  }

  ngAfterViewInit(): void {
    this.reportChartElements?.changes.subscribe(() => this.queueRenderCharts());
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  loadReport(): void {
    this.loading = true;
    this.error = '';
    this.reportsService.getSummary(this.mapFilters()).subscribe({
      next: (report) => {
        this.report = report;
        this.loading = false;
        this.queueRenderCharts();
      },
      error: (err) => {
        this.error = err?.error?.error || err?.error?.message || 'No se pudo cargar la reportería.';
        this.loading = false;
      },
    });
  }

  cleanFilters(): void {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    this.filterForm.reset({
      startDateFrom: this.toDateInput(firstDay),
      startDateTo: this.toDateInput(now),
      lowStockThreshold: 10,
    });
    this.loadReport();
  }

  max(items: ReportCountDto[]): number {
    return Math.max(...items.map((item) => item.count), 1);
  }

  percent(item: ReportCountDto, items: ReportCountDto[]): number {
    return Math.round((item.count / this.max(items)) * 100);
  }

  trackName(_: number, item: ReportCountDto): string {
    return item.name;
  }

  trackMedicine(_: number, item: LowStockMedicineDto): number {
    return item.medicineId;
  }

  chartItems(key: ChartKey): ReportCountDto[] {
    if (!this.report) {
      return [];
    }

    const generalReports: Record<string, ReportCountDto[]> = {
      appointmentsByStatus: this.report.appointmentsByStatus,
      appointmentsByDoctor: this.report.appointmentsByDoctor,
      topDiagnoses: this.report.topDiagnoses,
      topPrescribedMedicines: this.report.topPrescribedMedicines,
      topDispatchedMedicines: this.report.topDispatchedMedicines,
      examsByStatus: this.report.examsByStatus,
      examsByType: this.report.examsByType,
    };

    const doctorReports: Record<string, ReportCountDto[]> = {
      patientsAttendedByDoctor: this.report.doctorReports.patientsAttendedByDoctor,
      doctorAppointments: this.report.doctorReports.appointmentsByDoctor,
      finalizedAppointmentsByDoctor: this.report.doctorReports.finalizedAppointmentsByDoctor,
      emergencyAppointmentsByDoctor: this.report.doctorReports.emergencyAppointmentsByDoctor,
      averageAttentionMinutesByDoctor: this.report.doctorReports.averageAttentionMinutesByDoctor,
      recipesByDoctor: this.report.doctorReports.recipesByDoctor,
      prescribedMedicinesByDoctor: this.report.doctorReports.prescribedMedicinesByDoctor,
      dispatchedMedicinesByDoctor: this.report.doctorReports.dispatchedMedicinesByDoctor,
      diagnosesByDoctor: this.report.doctorReports.diagnosesByDoctor,
      appointmentsBySpecialty: this.report.doctorReports.appointmentsBySpecialty,
    };

    return generalReports[key] || doctorReports[key] || [];
  }

  chartValue(item: ReportCountDto, valueType: ChartValueType = 'count'): number {
    return valueType === 'amount' ? Number(item.amount || 0) : Number(item.count || 0);
  }

  displayValue(item: ReportCountDto, valueType: ChartValueType = 'count', amountType?: string): string {
    if (valueType === 'amount' && amountType === 'minutes') {
      return `${Number(item.amount || 0).toLocaleString('es-GT', { maximumFractionDigits: 2 })} min`;
    }

    return Number(item.count || 0).toLocaleString('es-GT');
  }

  private queueRenderCharts(): void {
    setTimeout(() => this.renderCharts());
  }

  private renderCharts(): void {
    if (!this.report || !this.reportChartElements) {
      return;
    }

    this.destroyCharts();
    this.reportChartElements.forEach((element) => {
      const canvas = element.nativeElement;
      const key = canvas.dataset['chartKey'] as ChartKey;
      const valueType = (canvas.dataset['valueType'] as ChartValueType) || 'count';
      const amountType = canvas.dataset['amountType'];
      const items = this.chartItems(key);

      if (!key || items.length === 0) {
        return;
      }

      this.chartInstances.set(canvas, new Chart(canvas, this.chartConfig(items, valueType, amountType)));
    });
  }

  private destroyCharts(): void {
    this.chartInstances.forEach((chart) => chart.destroy());
    this.chartInstances.clear();
  }

  private chartConfig(
    items: ReportCountDto[],
    valueType: ChartValueType,
    amountType?: string,
  ): ChartConfiguration<'bar'> {
    return {
      type: 'bar',
      data: {
        labels: items.map((item) => item.name),
        datasets: [
          {
            data: items.map((item) => this.chartValue(item, valueType)),
            backgroundColor: '#2563eb',
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        animation: false,
        indexAxis: 'y',
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = Number(context.raw || 0);
                if (valueType === 'amount' && amountType === 'minutes') {
                  return `${value.toLocaleString('es-GT', { maximumFractionDigits: 2 })} min promedio`;
                }
                return `${value.toLocaleString('es-GT')} registros`;
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
          y: {
            ticks: {
              autoSkip: false,
            },
          },
        },
      },
    };
  }

  private mapFilters(): Record<string, string | number> {
    const value = this.filterForm.value;
    return {
      startDateFrom: value.startDateFrom
        ? new Date(`${value.startDateFrom}T00:00:00`).toISOString()
        : '',
      startDateTo: value.startDateTo
        ? new Date(`${value.startDateTo}T00:00:00`).toISOString()
        : '',
      lowStockThreshold: Number(value.lowStockThreshold || 10),
    };
  }

  private toDateInput(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
}
