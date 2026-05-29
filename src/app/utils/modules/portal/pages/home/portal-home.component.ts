import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { catalogueInterface, pagDto } from '@utils/commons.interface';
import { CatalogueService } from '@utils/modules/catalogues/services/catalogue.service';

@Component({
  selector: 'app-portal-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './portal-home.component.html',
  styleUrls: ['./portal-home.component.scss'],
})
export class PortalHomeComponent implements OnInit {
  examTypes: catalogueInterface[] = [];

  constructor(private catalogueService: CatalogueService) {}

  ngOnInit(): void {
    this.loadExamTypes();
  }

  loadExamTypes(): void {
    this.catalogueService.get('examtypes', 1, 100, { all: true }).subscribe({
      next: (data) => {
        this.examTypes = data.items ?? [];
      },
    });
  }
}
