import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import {
  LowStockMedicineDto,
  ReportCountDto,
  ReportSummaryDto,
} from '../../interfaces/reports.interface';
import { ReportsService } from '../../services/reports.service';

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
export class ReportsComponent implements OnInit {
  filterForm: FormGroup;
  report?: ReportSummaryDto;
  loading = false;
  error = '';
  isDoctorReport = false;
  lowStockColumns = ['medicineName', 'stock', 'price'];

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

  loadReport(): void {
    this.loading = true;
    this.error = '';
    this.reportsService.getSummary(this.mapFilters()).subscribe({
      next: (report) => {
        this.report = report;
        this.loading = false;
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
