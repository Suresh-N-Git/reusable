// table-export.service.ts

import { Injectable } from '@angular/core';
import { ReUsableTableColumn } from './reusabletable.component';

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})

export class TableExportService {

  exportCsv(columns: ReUsableTableColumn[], rows: any[]): void {

    const header = columns.map(c => `"${c.name}"`).join(',');

    const csvRows = rows.map(row =>
      columns.map(col => {
        let value = row[col.id];

        if (col.exportFormatter) {
          value = col.exportFormatter(value);
        }

        if (value == null) return '';

        if (col.type === 'integer' || col.type === 'number' || col.type === 'currency')
          return value;

        return `"${value.toString().replace(/"/g, '""')}"`;
      }).join(',')
    );

    const csvContent = [header, ...csvRows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'table-export.csv';
    link.click();
  }


  exportExcel(columns: ReUsableTableColumn[], rows: any[]): void {

    const exportData = rows.map(row => {
      const obj: any = {};

      // this is needed of there are objects like for multiline and link
      columns.forEach(col => {

        let value = row[col.id];

        if (col.exportFormatter) {
          value = col.exportFormatter(value);
        } else if (Array.isArray(value)) {
          value = value.join(', ');
        } else if (value && typeof value === 'object') {
          value = JSON.stringify(value);
        }

        obj[col.name] = value;
      });

      // columns.forEach(col => obj[col.name] = row[col.id]);   // This is enough for straight data


      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    const workbook = {
      Sheets: { Data: worksheet },
      SheetNames: ['Data']
    };

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'table-export.xlsx';
    link.click();
  }


  exportPdf(
    columns: ReUsableTableColumn[],
    rows: any[],
    formatter?: (value: any, col: ReUsableTableColumn) => string
  ): void {

    const head = [columns.map(c => c.name)];

    const body = rows.map(row =>
      columns.map(col => {
        const raw = row[col.id];

        let value = raw;

        // 1. Column-specific export logic (FILES, ARRAYS, etc.)
        if (col.exportFormatter) {
          value = col.exportFormatter(raw);
        }

        // 2. Your existing number/date formatter
        else if (formatter) {
          value = formatter(raw, col);
        }

        // 3. Fallbacks (safety net)
        else if (Array.isArray(raw)) {
          value = raw.join(', ');
        }
        else if (raw && typeof raw === 'object') {
          value = JSON.stringify(raw);
        }
        else {
          value = raw ?? '';
        }
        return value;
        // return formatter ? formatter(raw, col) : (raw ?? '');



      })
    );

    const doc = new jsPDF({
      orientation: columns.length > 6 ? 'landscape' : 'portrait'
    });

    // ✅ Restore alignment logic
    const columnStyles: any = {};

    columns.forEach((col, index) => {
      columnStyles[index] = {
        halign: col.align || 'left'
      };
    });

    autoTable(doc, {
      head,
      body,
      styles: { fontSize: 9 },
      columnStyles,
      headStyles: {
        fillColor: [41, 128, 185]
      },
      margin: { top: 20 },

      // ✅ Keep header alignment consistent
      didParseCell: (data: any) => {
        if (data.section === 'head') {
          const colIndex = data.column.index;
          data.cell.styles.halign =
            columnStyles[colIndex]?.halign || 'left';
        }
      },

      didDrawPage: () => {
        doc.setFontSize(12);
        doc.text('Table Export', 14, 15);
      }
    });

    doc.save('table-export.pdf');
  }

  // exportPdf(columns: ReUsableTableColumn[], rows: any[]): void {

  //   const head = [columns.map(c => c.name)];

  //   const body = rows.map(row =>
  //     columns.map(col => row[col.id] ?? '')
  //   );

  //   const doc = new jsPDF({
  //     orientation: columns.length > 6 ? 'landscape' : 'portrait'
  //   });

  //   autoTable(doc, {
  //     head,
  //     body,
  //     styles: { fontSize: 9 },
  //     headStyles: { fillColor: [41, 128, 185] },
  //     margin: { top: 20 },
  //     didDrawPage: () => {
  //       doc.setFontSize(12);
  //       doc.text('Table Export', 14, 15);
  //     }
  //   });

  //   doc.save('table-export.pdf');
  // }

  printTable(html: string): void {

    const popup = window.open('', '_blank', 'width=1000,height=700');
    if (!popup) return;

    popup.document.open();
    popup.document.write(`
    <html>
      <head>
        <title>Print Table</title>
        <style>
          body { font-family: Arial; margin:20px; }
          table { border-collapse: collapse; width:100%; }
          th, td { border:1px solid #ccc; padding:6px; }
          .mat-column-actions { display:none; }
        </style>
      </head>
      <body>${html}</body>
    </html>
  `);

    popup.document.close();
    popup.print();
    popup.close();
  }
}