import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { utils, WorkBook, WorkSheet, writeFile } from 'xlsx';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  constructor() {}

  exportToExcel(data: any[], fileName: string = 'DatosTabla.xlsx') {
    let columns: string[] = Object.keys(data[0]);
    columns.forEach((column) => {
      column = column.toUpperCase();
    });
    const ws: WorkSheet = utils.json_to_sheet(data, { header: columns });
    const wb: WorkBook = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Sheet1');
    writeFile(wb, fileName);
  }

  exportToPdf(data: any[], fileName: string = 'DatosTabla.pdf') {
    const doc = new jsPDF();
    const COLUMNS: string[] = Object.keys(data[0]);
    COLUMNS.forEach((column) => {
      column = column.toUpperCase();
    });
    const rows = data.map((row) => COLUMNS.map((col) => row[col]));

    autoTable(doc, {
      head: [COLUMNS],
      body: rows,
    });

    doc.save(fileName);
  }
}
