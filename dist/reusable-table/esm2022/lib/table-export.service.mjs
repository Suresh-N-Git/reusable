import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as i0 from "@angular/core";
export class TableExportService {
    exportCsv(columns, rows, footerRow) {
        const header = columns.map(c => `"${c.name}"`).join(',');
        const csvRows = rows.map(row => columns
            .map(col => {
            let value = row[col.id];
            if (col.exportFormatter) {
                value = col.exportFormatter(value);
            }
            if (value == null)
                return '';
            if (col.type === 'integer' || col.type === 'number' || col.type === 'currency') {
                return value;
            }
            return `"${value.toString().replace(/"/g, '""')}"`;
        })
            .join(','));
        const allLines = [header, ...csvRows];
        if (footerRow && footerRow.length) {
            const footerCsv = footerRow
                .map(value => `"${(value ?? '').toString().replace(/"/g, '""')}"`)
                .join(',');
            allLines.push(footerCsv);
        }
        const csvContent = allLines.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'table-export.csv';
        link.click();
    }
    exportExcel(columns, rows, footerRow) {
        const exportData = rows.map(row => {
            const obj = {};
            columns.forEach(col => {
                let value = row[col.id];
                if (col.exportFormatter) {
                    value = col.exportFormatter(value);
                }
                else if (Array.isArray(value)) {
                    value = value.join(', ');
                }
                else if (value && typeof value === 'object') {
                    value = JSON.stringify(value);
                }
                obj[col.name] = value;
            });
            return obj;
        });
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        if (footerRow && footerRow.length) {
            XLSX.utils.sheet_add_aoa(worksheet, [footerRow], { origin: -1 });
        }
        const workbook = {
            Sheets: { Data: worksheet },
            SheetNames: ['Data'],
        };
        const excelBuffer = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array',
        });
        const blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'table-export.xlsx';
        link.click();
    }
    exportPdf(columns, rows, headingToPrint, formatter, footerRow) {
        const head = [columns.map(c => c.name)];
        const body = rows.map(row => columns.map(col => {
            const raw = row[col.id];
            let value = raw;
            if (col.exportFormatter) {
                value = col.exportFormatter(raw);
            }
            else if (formatter) {
                value = formatter(raw, col);
            }
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
        }));
        const doc = new jsPDF({
            orientation: columns.length > 6 ? 'landscape' : 'portrait',
        });
        const columnStyles = {};
        columns.forEach((col, index) => {
            columnStyles[index] = {
                halign: col.align || 'left',
            };
        });
        autoTable(doc, {
            head,
            body,
            foot: footerRow && footerRow.length ? [footerRow] : undefined,
            styles: { fontSize: 9 },
            columnStyles,
            headStyles: {
                fillColor: [41, 128, 185],
            },
            footStyles: {
                fillColor: [220, 220, 220],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
            },
            margin: { top: 20 },
            didParseCell: (data) => {
                if (data.section === 'head' || data.section === 'foot') {
                    const colIndex = data.column.index;
                    data.cell.styles.halign = columnStyles[colIndex]?.halign || 'left';
                }
            },
            didDrawPage: () => {
                doc.setFontSize(12);
                doc.text(headingToPrint, 14, 15);
            },
        });
        doc.save('table-export.pdf');
    }
    // exportPdf(
    //   columns: ReUsableTableColumn[],
    //   rows: any[],
    //   headingToPrint: string,
    //   formatter?: (value: any, col: ReUsableTableColumn) => string
    // ): void {
    //   const head = [columns.map(c => c.name)];
    //   const body = rows.map(row =>
    //     columns.map(col => {
    //       const raw = row[col.id];
    //       let value = raw;
    //       if (col.exportFormatter) {
    //         value = col.exportFormatter(raw);
    //       } else if (formatter) {
    //         value = formatter(raw, col);
    //       } else if (Array.isArray(raw)) {
    //         value = raw.join(', ');
    //       } else if (raw && typeof raw === 'object') {
    //         value = JSON.stringify(raw);
    //       } else {
    //         value = raw ?? '';
    //       }
    //       return value;
    //     })
    //   );
    //   const doc = new jsPDF({
    //     orientation: columns.length > 6 ? 'landscape' : 'portrait',
    //   });
    //   const columnStyles: any = {};
    //   columns.forEach((col, index) => {
    //     columnStyles[index] = {
    //       halign: col.align || 'left',
    //     };
    //   });
    //   autoTable(doc, {
    //     head,
    //     body,
    //     styles: { fontSize: 9 },
    //     columnStyles,
    //     headStyles: {
    //       fillColor: [41, 128, 185],
    //     },
    //     margin: { top: 20 },
    //     didParseCell: (data: any) => {
    //       if (data.section === 'head') {
    //         const colIndex = data.column.index;
    //         data.cell.styles.halign = columnStyles[colIndex]?.halign || 'left';
    //       }
    //     },
    //     didDrawPage: () => {
    //       doc.setFontSize(12);
    //       doc.text(headingToPrint, 14, 15);
    //     },
    //   });
    //   doc.save('table-export.pdf');
    // }
    printTable(headingToPrint, html) {
        const popup = window.open('', '_blank', 'width=1000,height=700');
        if (!popup)
            return;
        popup.document.open();
        popup.document.write(`
    <html>
      <head>
        <title>${headingToPrint}</title>
        <style>
          body { font-family: Arial; margin:20px; }
          table { border-collapse: collapse; width:100%; }
          th, td { border:1px solid #ccc; padding:6px; }
          .mat-column-rowOps {display: none !important;}
          .mat-column-actions {display: none !important; }
        </style>
      </head>
       <body onload="window.focus(); window.print();">${html}</body>
    </html>
  `);
        console.log(html);
        popup.document.close();
        popup.onafterprint = () => popup.close();
        // popup.print();
        // popup.close();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: TableExportService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: TableExportService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: TableExportService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root',
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGUtZXhwb3J0LnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9yZXVzYWJsZS10YWJsZS9zcmMvbGliL3RhYmxlLWV4cG9ydC5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFHM0MsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUM7QUFDN0IsT0FBTyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBQzFCLE9BQU8sU0FBUyxNQUFNLGlCQUFpQixDQUFDOztBQUt4QyxNQUFNLE9BQU8sa0JBQWtCO0lBRTdCLFNBQVMsQ0FDUCxPQUE4QixFQUM5QixJQUFXLEVBQ1gsU0FBMkI7UUFFM0IsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXpELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FDN0IsT0FBTzthQUNKLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNULElBQUksS0FBSyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFeEIsSUFBSSxHQUFHLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ3hCLEtBQUssR0FBRyxHQUFHLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JDLENBQUM7WUFFRCxJQUFJLEtBQUssSUFBSSxJQUFJO2dCQUFFLE9BQU8sRUFBRSxDQUFDO1lBRTdCLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxTQUFTLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxRQUFRLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUUsQ0FBQztn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QUFDLFlBQVksR0FBRyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDekMsaUJBQWlCO1FBQ2pCLGlCQUFpQjtJQUNuQixDQUFDO3dHQXhRVSxrQkFBa0I7NEdBQWxCLGtCQUFrQixjQUZqQixNQUFNOzs0RkFFUCxrQkFBa0I7a0JBSDlCLFVBQVU7bUJBQUM7b0JBQ1YsVUFBVSxFQUFFLE1BQU07aUJBQ25CIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgeyBSZVVzYWJsZVRhYmxlQ29sdW1uIH0gZnJvbSAnLi9yZXVzYWJsZS10YWJsZS5jb21wb25lbnQnO1xyXG5cclxuaW1wb3J0ICogYXMgWExTWCBmcm9tICd4bHN4JztcclxuaW1wb3J0IGpzUERGIGZyb20gJ2pzcGRmJztcclxuaW1wb3J0IGF1dG9UYWJsZSBmcm9tICdqc3BkZi1hdXRvdGFibGUnO1xyXG5cclxuQEluamVjdGFibGUoe1xyXG4gIHByb3ZpZGVkSW46ICdyb290JyxcclxufSlcclxuZXhwb3J0IGNsYXNzIFRhYmxlRXhwb3J0U2VydmljZSB7XHJcblxyXG4gIGV4cG9ydENzdihcclxuICAgIGNvbHVtbnM6IFJlVXNhYmxlVGFibGVDb2x1bW5bXSxcclxuICAgIHJvd3M6IGFueVtdLFxyXG4gICAgZm9vdGVyUm93Pzogc3RyaW5nW10gfCBudWxsXHJcbiAgKTogdm9pZCB7XHJcbiAgICBjb25zdCBoZWFkZXIgPSBjb2x1bW5zLm1hcChjID0+IGBcIiR7Yy5uYW1lfVwiYCkuam9pbignLCcpO1xyXG5cclxuICAgIGNvbnN0IGNzdlJvd3MgPSByb3dzLm1hcChyb3cgPT5cclxuICAgICAgY29sdW1uc1xyXG4gICAgICAgIC5tYXAoY29sID0+IHtcclxuICAgICAgICAgIGxldCB2YWx1ZSA9IHJvd1tjb2wuaWRdO1xyXG5cclxuICAgICAgICAgIGlmIChjb2wuZXhwb3J0Rm9ybWF0dGVyKSB7XHJcbiAgICAgICAgICAgIHZhbHVlID0gY29sLmV4cG9ydEZvcm1hdHRlcih2YWx1ZSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiAnJztcclxuXHJcbiAgICAgICAgICBpZiAoY29sLnR5cGUgPT09ICdpbnRlZ2VyJyB8fCBjb2wudHlwZSA9PT0gJ251bWJlcicgfHwgY29sLnR5cGUgPT09ICdjdXJyZW5jeScpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJldHVybiBgXCIke3ZhbHVlLnRvU3RyaW5nKCkucmVwbGFjZSgvXCIvZywgJ1wiXCInKX1cImA7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuam9pbignLCcpXHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IGFsbExpbmVzID0gW2hlYWRlciwgLi4uY3N2Um93c107XHJcblxyXG4gICAgaWYgKGZvb3RlclJvdyAmJiBmb290ZXJSb3cubGVuZ3RoKSB7XHJcbiAgICAgIGNvbnN0IGZvb3RlckNzdiA9IGZvb3RlclJvd1xyXG4gICAgICAgIC5tYXAodmFsdWUgPT4gYFwiJHsodmFsdWUgPz8gJycpLnRvU3RyaW5nKCkucmVwbGFjZSgvXCIvZywgJ1wiXCInKX1cImApXHJcbiAgICAgICAgLmpvaW4oJywnKTtcclxuICAgICAgYWxsTGluZXMucHVzaChmb290ZXJDc3YpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNzdkNvbnRlbnQgPSBhbGxMaW5lcy5qb2luKCdcXG4nKTtcclxuICAgIGNvbnN0IGJsb2IgPSBuZXcgQmxvYihbY3N2Q29udGVudF0sIHsgdHlwZTogJ3RleHQvY3N2O2NoYXJzZXQ9dXRmLTg7JyB9KTtcclxuXHJcbiAgICBjb25zdCBsaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gICAgbGluay5ocmVmID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcclxuICAgIGxpbmsuZG93bmxvYWQgPSAndGFibGUtZXhwb3J0LmNzdic7XHJcbiAgICBsaW5rLmNsaWNrKCk7XHJcbiAgfVxyXG5cclxuICBleHBvcnRFeGNlbChcclxuICAgIGNvbHVtbnM6IFJlVXNhYmxlVGFibGVDb2x1bW5bXSxcclxuICAgIHJvd3M6IGFueVtdLFxyXG4gICAgZm9vdGVyUm93Pzogc3RyaW5nW10gfCBudWxsXHJcbiAgKTogdm9pZCB7XHJcbiAgICBjb25zdCBleHBvcnREYXRhID0gcm93cy5tYXAocm93ID0+IHtcclxuICAgICAgY29uc3Qgb2JqOiBhbnkgPSB7fTtcclxuXHJcbiAgICAgIGNvbHVtbnMuZm9yRWFjaChjb2wgPT4ge1xyXG4gICAgICAgIGxldCB2YWx1ZSA9IHJvd1tjb2wuaWRdO1xyXG5cclxuICAgICAgICBpZiAoY29sLmV4cG9ydEZvcm1hdHRlcikge1xyXG4gICAgICAgICAgdmFsdWUgPSBjb2wuZXhwb3J0Rm9ybWF0dGVyKHZhbHVlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgICB2YWx1ZSA9IHZhbHVlLmpvaW4oJywgJyk7XHJcbiAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICB2YWx1ZSA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG9ialtjb2wubmFtZV0gPSB2YWx1ZTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gb2JqO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3Qgd29ya3NoZWV0ID0gWExTWC51dGlscy5qc29uX3RvX3NoZWV0KGV4cG9ydERhdGEpO1xyXG5cclxuICAgIGlmIChmb290ZXJSb3cgJiYgZm9vdGVyUm93Lmxlbmd0aCkge1xyXG4gICAgICBYTFNYLnV0aWxzLnNoZWV0X2FkZF9hb2Eod29ya3NoZWV0LCBbZm9vdGVyUm93XSwgeyBvcmlnaW46IC0xIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHdvcmtib29rID0ge1xyXG4gICAgICBTaGVldHM6IHsgRGF0YTogd29ya3NoZWV0IH0sXHJcbiAgICAgIFNoZWV0TmFtZXM6IFsnRGF0YSddLFxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBleGNlbEJ1ZmZlciA9IFhMU1gud3JpdGUod29ya2Jvb2ssIHtcclxuICAgICAgYm9va1R5cGU6ICd4bHN4JyxcclxuICAgICAgdHlwZTogJ2FycmF5JyxcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGJsb2IgPSBuZXcgQmxvYihbZXhjZWxCdWZmZXJdLCB7XHJcbiAgICAgIHR5cGU6ICdhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC5zaGVldCcsXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBsaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gICAgbGluay5ocmVmID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcclxuICAgIGxpbmsuZG93bmxvYWQgPSAndGFibGUtZXhwb3J0Lnhsc3gnO1xyXG4gICAgbGluay5jbGljaygpO1xyXG4gIH1cclxuXHJcbiAgZXhwb3J0UGRmKFxyXG4gICAgY29sdW1uczogUmVVc2FibGVUYWJsZUNvbHVtbltdLFxyXG4gICAgcm93czogYW55W10sXHJcbiAgICBoZWFkaW5nVG9QcmludDogc3RyaW5nLFxyXG4gICAgZm9ybWF0dGVyPzogKHZhbHVlOiBhbnksIGNvbDogUmVVc2FibGVUYWJsZUNvbHVtbikgPT4gc3RyaW5nLFxyXG4gICAgZm9vdGVyUm93Pzogc3RyaW5nW10gfCBudWxsXHJcbiAgKTogdm9pZCB7XHJcbiAgICBjb25zdCBoZWFkID0gW2NvbHVtbnMubWFwKGMgPT4gYy5uYW1lKV07XHJcblxyXG4gICAgY29uc3QgYm9keSA9IHJvd3MubWFwKHJvdyA9PlxyXG4gICAgICBjb2x1bW5zLm1hcChjb2wgPT4ge1xyXG4gICAgICAgIGNvbnN0IHJhdyA9IHJvd1tjb2wuaWRdO1xyXG5cclxuICAgICAgICBsZXQgdmFsdWUgPSByYXc7XHJcblxyXG4gICAgICAgIGlmIChjb2wuZXhwb3J0Rm9ybWF0dGVyKSB7XHJcbiAgICAgICAgICB2YWx1ZSA9IGNvbC5leHBvcnRGb3JtYXR0ZXIocmF3KTtcclxuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdHRlcikge1xyXG4gICAgICAgICAgdmFsdWUgPSBmb3JtYXR0ZXIocmF3LCBjb2wpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShyYXcpKSB7XHJcbiAgICAgICAgICB2YWx1ZSA9IHJhdy5qb2luKCcsICcpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocmF3ICYmIHR5cGVvZiByYXcgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICB2YWx1ZSA9IEpTT04uc3RyaW5naWZ5KHJhdyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHZhbHVlID0gcmF3ID8/ICcnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICB9KVxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBkb2MgPSBuZXcganNQREYoe1xyXG4gICAgICBvcmllbnRhdGlvbjogY29sdW1ucy5sZW5ndGggPiA2ID8gJ2xhbmRzY2FwZScgOiAncG9ydHJhaXQnLFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgY29sdW1uU3R5bGVzOiBhbnkgPSB7fTtcclxuXHJcbiAgICBjb2x1bW5zLmZvckVhY2goKGNvbCwgaW5kZXgpID0+IHtcclxuICAgICAgY29sdW1uU3R5bGVzW2luZGV4XSA9IHtcclxuICAgICAgICBoYWxpZ246IGNvbC5hbGlnbiB8fCAnbGVmdCcsXHJcbiAgICAgIH07XHJcbiAgICB9KTtcclxuXHJcbiAgICBhdXRvVGFibGUoZG9jLCB7XHJcbiAgICAgIGhlYWQsXHJcbiAgICAgIGJvZHksXHJcbiAgICAgIGZvb3Q6IGZvb3RlclJvdyAmJiBmb290ZXJSb3cubGVuZ3RoID8gW2Zvb3RlclJvd10gOiB1bmRlZmluZWQsXHJcbiAgICAgIHN0eWxlczogeyBmb250U2l6ZTogOSB9LFxyXG4gICAgICBjb2x1bW5TdHlsZXMsXHJcbiAgICAgIGhlYWRTdHlsZXM6IHtcclxuICAgICAgICBmaWxsQ29sb3I6IFs0MSwgMTI4LCAxODVdLFxyXG4gICAgICB9LFxyXG4gICAgICBmb290U3R5bGVzOiB7XHJcbiAgICAgICAgZmlsbENvbG9yOiBbMjIwLCAyMjAsIDIyMF0sXHJcbiAgICAgICAgdGV4dENvbG9yOiBbMCwgMCwgMF0sXHJcbiAgICAgICAgZm9udFN0eWxlOiAnYm9sZCcsXHJcbiAgICAgIH0sXHJcbiAgICAgIG1hcmdpbjogeyB0b3A6IDIwIH0sXHJcbiAgICAgIGRpZFBhcnNlQ2VsbDogKGRhdGE6IGFueSkgPT4ge1xyXG4gICAgICAgIGlmIChkYXRhLnNlY3Rpb24gPT09ICdoZWFkJyB8fCBkYXRhLnNlY3Rpb24gPT09ICdmb290Jykge1xyXG4gICAgICAgICAgY29uc3QgY29sSW5kZXggPSBkYXRhLmNvbHVtbi5pbmRleDtcclxuICAgICAgICAgIGRhdGEuY2VsbC5zdHlsZXMuaGFsaWduID0gY29sdW1uU3R5bGVzW2NvbEluZGV4XT8uaGFsaWduIHx8ICdsZWZ0JztcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIGRpZERyYXdQYWdlOiAoKSA9PiB7XHJcbiAgICAgICAgZG9jLnNldEZvbnRTaXplKDEyKTtcclxuICAgICAgICBkb2MudGV4dChoZWFkaW5nVG9QcmludCwgMTQsIDE1KTtcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIGRvYy5zYXZlKCd0YWJsZS1leHBvcnQucGRmJyk7XHJcbiAgfVxyXG5cclxuXHJcbiAgLy8gZXhwb3J0UGRmKFxyXG4gIC8vICAgY29sdW1uczogUmVVc2FibGVUYWJsZUNvbHVtbltdLFxyXG4gIC8vICAgcm93czogYW55W10sXHJcbiAgLy8gICBoZWFkaW5nVG9QcmludDogc3RyaW5nLFxyXG4gIC8vICAgZm9ybWF0dGVyPzogKHZhbHVlOiBhbnksIGNvbDogUmVVc2FibGVUYWJsZUNvbHVtbikgPT4gc3RyaW5nXHJcbiAgLy8gKTogdm9pZCB7XHJcbiAgLy8gICBjb25zdCBoZWFkID0gW2NvbHVtbnMubWFwKGMgPT4gYy5uYW1lKV07XHJcblxyXG4gIC8vICAgY29uc3QgYm9keSA9IHJvd3MubWFwKHJvdyA9PlxyXG4gIC8vICAgICBjb2x1bW5zLm1hcChjb2wgPT4ge1xyXG4gIC8vICAgICAgIGNvbnN0IHJhdyA9IHJvd1tjb2wuaWRdO1xyXG5cclxuICAvLyAgICAgICBsZXQgdmFsdWUgPSByYXc7XHJcblxyXG4gIC8vICAgICAgIGlmIChjb2wuZXhwb3J0Rm9ybWF0dGVyKSB7XHJcbiAgLy8gICAgICAgICB2YWx1ZSA9IGNvbC5leHBvcnRGb3JtYXR0ZXIocmF3KTtcclxuICAvLyAgICAgICB9IGVsc2UgaWYgKGZvcm1hdHRlcikge1xyXG4gIC8vICAgICAgICAgdmFsdWUgPSBmb3JtYXR0ZXIocmF3LCBjb2wpO1xyXG4gIC8vICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShyYXcpKSB7XHJcbiAgLy8gICAgICAgICB2YWx1ZSA9IHJhdy5qb2luKCcsICcpO1xyXG4gIC8vICAgICAgIH0gZWxzZSBpZiAocmF3ICYmIHR5cGVvZiByYXcgPT09ICdvYmplY3QnKSB7XHJcbiAgLy8gICAgICAgICB2YWx1ZSA9IEpTT04uc3RyaW5naWZ5KHJhdyk7XHJcbiAgLy8gICAgICAgfSBlbHNlIHtcclxuICAvLyAgICAgICAgIHZhbHVlID0gcmF3ID8/ICcnO1xyXG4gIC8vICAgICAgIH1cclxuXHJcbiAgLy8gICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gIC8vICAgICB9KVxyXG4gIC8vICAgKTtcclxuXHJcbiAgLy8gICBjb25zdCBkb2MgPSBuZXcganNQREYoe1xyXG4gIC8vICAgICBvcmllbnRhdGlvbjogY29sdW1ucy5sZW5ndGggPiA2ID8gJ2xhbmRzY2FwZScgOiAncG9ydHJhaXQnLFxyXG4gIC8vICAgfSk7XHJcblxyXG4gIC8vICAgY29uc3QgY29sdW1uU3R5bGVzOiBhbnkgPSB7fTtcclxuXHJcbiAgLy8gICBjb2x1bW5zLmZvckVhY2goKGNvbCwgaW5kZXgpID0+IHtcclxuICAvLyAgICAgY29sdW1uU3R5bGVzW2luZGV4XSA9IHtcclxuICAvLyAgICAgICBoYWxpZ246IGNvbC5hbGlnbiB8fCAnbGVmdCcsXHJcbiAgLy8gICAgIH07XHJcbiAgLy8gICB9KTtcclxuXHJcbiAgLy8gICBhdXRvVGFibGUoZG9jLCB7XHJcbiAgLy8gICAgIGhlYWQsXHJcbiAgLy8gICAgIGJvZHksXHJcbiAgLy8gICAgIHN0eWxlczogeyBmb250U2l6ZTogOSB9LFxyXG4gIC8vICAgICBjb2x1bW5TdHlsZXMsXHJcbiAgLy8gICAgIGhlYWRTdHlsZXM6IHtcclxuICAvLyAgICAgICBmaWxsQ29sb3I6IFs0MSwgMTI4LCAxODVdLFxyXG4gIC8vICAgICB9LFxyXG4gIC8vICAgICBtYXJnaW46IHsgdG9wOiAyMCB9LFxyXG4gIC8vICAgICBkaWRQYXJzZUNlbGw6IChkYXRhOiBhbnkpID0+IHtcclxuICAvLyAgICAgICBpZiAoZGF0YS5zZWN0aW9uID09PSAnaGVhZCcpIHtcclxuICAvLyAgICAgICAgIGNvbnN0IGNvbEluZGV4ID0gZGF0YS5jb2x1bW4uaW5kZXg7XHJcbiAgLy8gICAgICAgICBkYXRhLmNlbGwuc3R5bGVzLmhhbGlnbiA9IGNvbHVtblN0eWxlc1tjb2xJbmRleF0/LmhhbGlnbiB8fCAnbGVmdCc7XHJcbiAgLy8gICAgICAgfVxyXG4gIC8vICAgICB9LFxyXG4gIC8vICAgICBkaWREcmF3UGFnZTogKCkgPT4ge1xyXG4gIC8vICAgICAgIGRvYy5zZXRGb250U2l6ZSgxMik7XHJcbiAgLy8gICAgICAgZG9jLnRleHQoaGVhZGluZ1RvUHJpbnQsIDE0LCAxNSk7XHJcbiAgLy8gICAgIH0sXHJcbiAgLy8gICB9KTtcclxuXHJcbiAgLy8gICBkb2Muc2F2ZSgndGFibGUtZXhwb3J0LnBkZicpO1xyXG4gIC8vIH1cclxuXHJcbiAgcHJpbnRUYWJsZShoZWFkaW5nVG9QcmludDogc3RyaW5nLCBodG1sOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgIGNvbnN0IHBvcHVwID0gd2luZG93Lm9wZW4oJycsICdfYmxhbmsnLCAnd2lkdGg9MTAwMCxoZWlnaHQ9NzAwJyk7XHJcbiAgICBpZiAoIXBvcHVwKSByZXR1cm47XHJcblxyXG4gICAgcG9wdXAuZG9jdW1lbnQub3BlbigpO1xyXG4gICAgcG9wdXAuZG9jdW1lbnQud3JpdGUoYFxyXG4gICAgPGh0bWw+XHJcbiAgICAgIDxoZWFkPlxyXG4gICAgICAgIDx0aXRsZT4ke2hlYWRpbmdUb1ByaW50fTwvdGl0bGU+XHJcbiAgICAgICAgPHN0eWxlPlxyXG4gICAgICAgICAgYm9keSB7IGZvbnQtZmFtaWx5OiBBcmlhbDsgbWFyZ2luOjIwcHg7IH1cclxuICAgICAgICAgIHRhYmxlIHsgYm9yZGVyLWNvbGxhcHNlOiBjb2xsYXBzZTsgd2lkdGg6MTAwJTsgfVxyXG4gICAgICAgICAgdGgsIHRkIHsgYm9yZGVyOjFweCBzb2xpZCAjY2NjOyBwYWRkaW5nOjZweDsgfVxyXG4gICAgICAgICAgLm1hdC1jb2x1bW4tcm93T3BzIHtkaXNwbGF5OiBub25lICFpbXBvcnRhbnQ7fVxyXG4gICAgICAgICAgLm1hdC1jb2x1bW4tYWN0aW9ucyB7ZGlzcGxheTogbm9uZSAhaW1wb3J0YW50OyB9XHJcbiAgICAgICAgPC9zdHlsZT5cclxuICAgICAgPC9oZWFkPlxyXG4gICAgICAgPGJvZHkgb25sb2FkPVwid2luZG93LmZvY3VzKCk7IHdpbmRvdy5wcmludCgpO1wiPiR7aHRtbH08L2JvZHk+XHJcbiAgICA8L2h0bWw+XHJcbiAgYCk7XHJcblxyXG4gICAgY29uc29sZS5sb2coaHRtbCk7XHJcbiAgICBwb3B1cC5kb2N1bWVudC5jbG9zZSgpO1xyXG4gICAgcG9wdXAub25hZnRlcnByaW50ID0gKCkgPT4gcG9wdXAuY2xvc2UoKTtcclxuICAgIC8vIHBvcHVwLnByaW50KCk7XHJcbiAgICAvLyBwb3B1cC5jbG9zZSgpO1xyXG4gIH1cclxufVxyXG4iXX0=