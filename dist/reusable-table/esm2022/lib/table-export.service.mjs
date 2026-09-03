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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGUtZXhwb3J0LnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9yZXVzYWJsZS10YWJsZS9zcmMvbGliL3RhYmxlLWV4cG9ydC5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFHM0MsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUM7QUFDN0IsT0FBTyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBQzFCLE9BQU8sU0FBUyxNQUFNLGlCQUFpQixDQUFDOztBQUt4QyxNQUFNLE9BQU8sa0JBQWtCO0lBRTdCLFNBQVMsQ0FDUCxPQUE4QixFQUM5QixJQUFXLEVBQ1gsU0FBMkI7UUFFM0IsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXpELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FDN0IsT0FBTzthQUNKLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNULElBQUksS0FBSyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFeEIsSUFBSSxHQUFHLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ3hCLEtBQUssR0FBRyxHQUFHLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JDLENBQUM7WUFFRCxJQUFJLEtBQUssSUFBSSxJQUFJO2dCQUFFLE9BQU8sRUFBRSxDQUFDO1lBRTdCLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxTQUFTLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxRQUFRLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUUsQ0FBQztn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QUssRUFBRSxDQUFDO1FBQ3pDLGlCQUFpQjtRQUNqQixpQkFBaUI7SUFDbkIsQ0FBQzt3R0F0UVUsa0JBQWtCOzRHQUFsQixrQkFBa0IsY0FGakIsTUFBTTs7NEZBRVAsa0JBQWtCO2tCQUg5QixVQUFVO21CQUFDO29CQUNWLFVBQVUsRUFBRSxNQUFNO2lCQUNuQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHsgUmVVc2FibGVUYWJsZUNvbHVtbiB9IGZyb20gJy4vcmV1c2FibGUtdGFibGUuY29tcG9uZW50JztcclxuXHJcbmltcG9ydCAqIGFzIFhMU1ggZnJvbSAneGxzeCc7XHJcbmltcG9ydCBqc1BERiBmcm9tICdqc3BkZic7XHJcbmltcG9ydCBhdXRvVGFibGUgZnJvbSAnanNwZGYtYXV0b3RhYmxlJztcclxuXHJcbkBJbmplY3RhYmxlKHtcclxuICBwcm92aWRlZEluOiAncm9vdCcsXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBUYWJsZUV4cG9ydFNlcnZpY2Uge1xyXG5cclxuICBleHBvcnRDc3YoXHJcbiAgICBjb2x1bW5zOiBSZVVzYWJsZVRhYmxlQ29sdW1uW10sXHJcbiAgICByb3dzOiBhbnlbXSxcclxuICAgIGZvb3RlclJvdz86IHN0cmluZ1tdIHwgbnVsbFxyXG4gICk6IHZvaWQge1xyXG4gICAgY29uc3QgaGVhZGVyID0gY29sdW1ucy5tYXAoYyA9PiBgXCIke2MubmFtZX1cImApLmpvaW4oJywnKTtcclxuXHJcbiAgICBjb25zdCBjc3ZSb3dzID0gcm93cy5tYXAocm93ID0+XHJcbiAgICAgIGNvbHVtbnNcclxuICAgICAgICAubWFwKGNvbCA9PiB7XHJcbiAgICAgICAgICBsZXQgdmFsdWUgPSByb3dbY29sLmlkXTtcclxuXHJcbiAgICAgICAgICBpZiAoY29sLmV4cG9ydEZvcm1hdHRlcikge1xyXG4gICAgICAgICAgICB2YWx1ZSA9IGNvbC5leHBvcnRGb3JtYXR0ZXIodmFsdWUpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gJyc7XHJcblxyXG4gICAgICAgICAgaWYgKGNvbC50eXBlID09PSAnaW50ZWdlcicgfHwgY29sLnR5cGUgPT09ICdudW1iZXInIHx8IGNvbC50eXBlID09PSAnY3VycmVuY3knKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICByZXR1cm4gYFwiJHt2YWx1ZS50b1N0cmluZygpLnJlcGxhY2UoL1wiL2csICdcIlwiJyl9XCJgO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmpvaW4oJywnKVxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBhbGxMaW5lcyA9IFtoZWFkZXIsIC4uLmNzdlJvd3NdO1xyXG5cclxuICAgIGlmIChmb290ZXJSb3cgJiYgZm9vdGVyUm93Lmxlbmd0aCkge1xyXG4gICAgICBjb25zdCBmb290ZXJDc3YgPSBmb290ZXJSb3dcclxuICAgICAgICAubWFwKHZhbHVlID0+IGBcIiR7KHZhbHVlID8/ICcnKS50b1N0cmluZygpLnJlcGxhY2UoL1wiL2csICdcIlwiJyl9XCJgKVxyXG4gICAgICAgIC5qb2luKCcsJyk7XHJcbiAgICAgIGFsbExpbmVzLnB1c2goZm9vdGVyQ3N2KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjc3ZDb250ZW50ID0gYWxsTGluZXMuam9pbignXFxuJyk7XHJcbiAgICBjb25zdCBibG9iID0gbmV3IEJsb2IoW2NzdkNvbnRlbnRdLCB7IHR5cGU6ICd0ZXh0L2NzdjtjaGFyc2V0PXV0Zi04OycgfSk7XHJcblxyXG4gICAgY29uc3QgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICAgIGxpbmsuaHJlZiA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XHJcbiAgICBsaW5rLmRvd25sb2FkID0gJ3RhYmxlLWV4cG9ydC5jc3YnO1xyXG4gICAgbGluay5jbGljaygpO1xyXG4gIH1cclxuXHJcbiAgZXhwb3J0RXhjZWwoXHJcbiAgICBjb2x1bW5zOiBSZVVzYWJsZVRhYmxlQ29sdW1uW10sXHJcbiAgICByb3dzOiBhbnlbXSxcclxuICAgIGZvb3RlclJvdz86IHN0cmluZ1tdIHwgbnVsbFxyXG4gICk6IHZvaWQge1xyXG4gICAgY29uc3QgZXhwb3J0RGF0YSA9IHJvd3MubWFwKHJvdyA9PiB7XHJcbiAgICAgIGNvbnN0IG9iajogYW55ID0ge307XHJcblxyXG4gICAgICBjb2x1bW5zLmZvckVhY2goY29sID0+IHtcclxuICAgICAgICBsZXQgdmFsdWUgPSByb3dbY29sLmlkXTtcclxuXHJcbiAgICAgICAgaWYgKGNvbC5leHBvcnRGb3JtYXR0ZXIpIHtcclxuICAgICAgICAgIHZhbHVlID0gY29sLmV4cG9ydEZvcm1hdHRlcih2YWx1ZSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgICAgdmFsdWUgPSB2YWx1ZS5qb2luKCcsICcpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgdmFsdWUgPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvYmpbY29sLm5hbWVdID0gdmFsdWU7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIG9iajtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHdvcmtzaGVldCA9IFhMU1gudXRpbHMuanNvbl90b19zaGVldChleHBvcnREYXRhKTtcclxuXHJcbiAgICBpZiAoZm9vdGVyUm93ICYmIGZvb3RlclJvdy5sZW5ndGgpIHtcclxuICAgICAgWExTWC51dGlscy5zaGVldF9hZGRfYW9hKHdvcmtzaGVldCwgW2Zvb3RlclJvd10sIHsgb3JpZ2luOiAtMSB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB3b3JrYm9vayA9IHtcclxuICAgICAgU2hlZXRzOiB7IERhdGE6IHdvcmtzaGVldCB9LFxyXG4gICAgICBTaGVldE5hbWVzOiBbJ0RhdGEnXSxcclxuICAgIH07XHJcblxyXG4gICAgY29uc3QgZXhjZWxCdWZmZXIgPSBYTFNYLndyaXRlKHdvcmtib29rLCB7XHJcbiAgICAgIGJvb2tUeXBlOiAneGxzeCcsXHJcbiAgICAgIHR5cGU6ICdhcnJheScsXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBibG9iID0gbmV3IEJsb2IoW2V4Y2VsQnVmZmVyXSwge1xyXG4gICAgICB0eXBlOiAnYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnNwcmVhZHNoZWV0bWwuc2hlZXQnLFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICAgIGxpbmsuaHJlZiA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XHJcbiAgICBsaW5rLmRvd25sb2FkID0gJ3RhYmxlLWV4cG9ydC54bHN4JztcclxuICAgIGxpbmsuY2xpY2soKTtcclxuICB9XHJcblxyXG4gIGV4cG9ydFBkZihcclxuICAgIGNvbHVtbnM6IFJlVXNhYmxlVGFibGVDb2x1bW5bXSxcclxuICAgIHJvd3M6IGFueVtdLFxyXG4gICAgaGVhZGluZ1RvUHJpbnQ6IHN0cmluZyxcclxuICAgIGZvcm1hdHRlcj86ICh2YWx1ZTogYW55LCBjb2w6IFJlVXNhYmxlVGFibGVDb2x1bW4pID0+IHN0cmluZyxcclxuICAgIGZvb3RlclJvdz86IHN0cmluZ1tdIHwgbnVsbFxyXG4gICk6IHZvaWQge1xyXG4gICAgY29uc3QgaGVhZCA9IFtjb2x1bW5zLm1hcChjID0+IGMubmFtZSldO1xyXG5cclxuICAgIGNvbnN0IGJvZHkgPSByb3dzLm1hcChyb3cgPT5cclxuICAgICAgY29sdW1ucy5tYXAoY29sID0+IHtcclxuICAgICAgICBjb25zdCByYXcgPSByb3dbY29sLmlkXTtcclxuXHJcbiAgICAgICAgbGV0IHZhbHVlID0gcmF3O1xyXG5cclxuICAgICAgICBpZiAoY29sLmV4cG9ydEZvcm1hdHRlcikge1xyXG4gICAgICAgICAgdmFsdWUgPSBjb2wuZXhwb3J0Rm9ybWF0dGVyKHJhdyk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChmb3JtYXR0ZXIpIHtcclxuICAgICAgICAgIHZhbHVlID0gZm9ybWF0dGVyKHJhdywgY29sKTtcclxuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocmF3KSkge1xyXG4gICAgICAgICAgdmFsdWUgPSByYXcuam9pbignLCAnKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHJhdyAmJiB0eXBlb2YgcmF3ID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgdmFsdWUgPSBKU09OLnN0cmluZ2lmeShyYXcpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB2YWx1ZSA9IHJhdyA/PyAnJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgfSlcclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgZG9jID0gbmV3IGpzUERGKHtcclxuICAgICAgb3JpZW50YXRpb246IGNvbHVtbnMubGVuZ3RoID4gNiA/ICdsYW5kc2NhcGUnIDogJ3BvcnRyYWl0JyxcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGNvbHVtblN0eWxlczogYW55ID0ge307XHJcblxyXG4gICAgY29sdW1ucy5mb3JFYWNoKChjb2wsIGluZGV4KSA9PiB7XHJcbiAgICAgIGNvbHVtblN0eWxlc1tpbmRleF0gPSB7XHJcbiAgICAgICAgaGFsaWduOiBjb2wuYWxpZ24gfHwgJ2xlZnQnLFxyXG4gICAgICB9O1xyXG4gICAgfSk7XHJcblxyXG4gICAgYXV0b1RhYmxlKGRvYywge1xyXG4gICAgICBoZWFkLFxyXG4gICAgICBib2R5LFxyXG4gICAgICBmb290OiBmb290ZXJSb3cgJiYgZm9vdGVyUm93Lmxlbmd0aCA/IFtmb290ZXJSb3ddIDogdW5kZWZpbmVkLFxyXG4gICAgICBzdHlsZXM6IHsgZm9udFNpemU6IDkgfSxcclxuICAgICAgY29sdW1uU3R5bGVzLFxyXG4gICAgICBoZWFkU3R5bGVzOiB7XHJcbiAgICAgICAgZmlsbENvbG9yOiBbNDEsIDEyOCwgMTg1XSxcclxuICAgICAgfSxcclxuICAgICAgZm9vdFN0eWxlczoge1xyXG4gICAgICAgIGZpbGxDb2xvcjogWzIyMCwgMjIwLCAyMjBdLFxyXG4gICAgICAgIHRleHRDb2xvcjogWzAsIDAsIDBdLFxyXG4gICAgICAgIGZvbnRTdHlsZTogJ2JvbGQnLFxyXG4gICAgICB9LFxyXG4gICAgICBtYXJnaW46IHsgdG9wOiAyMCB9LFxyXG4gICAgICBkaWRQYXJzZUNlbGw6IChkYXRhOiBhbnkpID0+IHtcclxuICAgICAgICBpZiAoZGF0YS5zZWN0aW9uID09PSAnaGVhZCcgfHwgZGF0YS5zZWN0aW9uID09PSAnZm9vdCcpIHtcclxuICAgICAgICAgIGNvbnN0IGNvbEluZGV4ID0gZGF0YS5jb2x1bW4uaW5kZXg7XHJcbiAgICAgICAgICBkYXRhLmNlbGwuc3R5bGVzLmhhbGlnbiA9IGNvbHVtblN0eWxlc1tjb2xJbmRleF0/LmhhbGlnbiB8fCAnbGVmdCc7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBkaWREcmF3UGFnZTogKCkgPT4ge1xyXG4gICAgICAgIGRvYy5zZXRGb250U2l6ZSgxMik7XHJcbiAgICAgICAgZG9jLnRleHQoaGVhZGluZ1RvUHJpbnQsIDE0LCAxNSk7XHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICBkb2Muc2F2ZSgndGFibGUtZXhwb3J0LnBkZicpO1xyXG4gIH1cclxuXHJcblxyXG4gIC8vIGV4cG9ydFBkZihcclxuICAvLyAgIGNvbHVtbnM6IFJlVXNhYmxlVGFibGVDb2x1bW5bXSxcclxuICAvLyAgIHJvd3M6IGFueVtdLFxyXG4gIC8vICAgaGVhZGluZ1RvUHJpbnQ6IHN0cmluZyxcclxuICAvLyAgIGZvcm1hdHRlcj86ICh2YWx1ZTogYW55LCBjb2w6IFJlVXNhYmxlVGFibGVDb2x1bW4pID0+IHN0cmluZ1xyXG4gIC8vICk6IHZvaWQge1xyXG4gIC8vICAgY29uc3QgaGVhZCA9IFtjb2x1bW5zLm1hcChjID0+IGMubmFtZSldO1xyXG5cclxuICAvLyAgIGNvbnN0IGJvZHkgPSByb3dzLm1hcChyb3cgPT5cclxuICAvLyAgICAgY29sdW1ucy5tYXAoY29sID0+IHtcclxuICAvLyAgICAgICBjb25zdCByYXcgPSByb3dbY29sLmlkXTtcclxuXHJcbiAgLy8gICAgICAgbGV0IHZhbHVlID0gcmF3O1xyXG5cclxuICAvLyAgICAgICBpZiAoY29sLmV4cG9ydEZvcm1hdHRlcikge1xyXG4gIC8vICAgICAgICAgdmFsdWUgPSBjb2wuZXhwb3J0Rm9ybWF0dGVyKHJhdyk7XHJcbiAgLy8gICAgICAgfSBlbHNlIGlmIChmb3JtYXR0ZXIpIHtcclxuICAvLyAgICAgICAgIHZhbHVlID0gZm9ybWF0dGVyKHJhdywgY29sKTtcclxuICAvLyAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocmF3KSkge1xyXG4gIC8vICAgICAgICAgdmFsdWUgPSByYXcuam9pbignLCAnKTtcclxuICAvLyAgICAgICB9IGVsc2UgaWYgKHJhdyAmJiB0eXBlb2YgcmF3ID09PSAnb2JqZWN0Jykge1xyXG4gIC8vICAgICAgICAgdmFsdWUgPSBKU09OLnN0cmluZ2lmeShyYXcpO1xyXG4gIC8vICAgICAgIH0gZWxzZSB7XHJcbiAgLy8gICAgICAgICB2YWx1ZSA9IHJhdyA/PyAnJztcclxuICAvLyAgICAgICB9XHJcblxyXG4gIC8vICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAvLyAgICAgfSlcclxuICAvLyAgICk7XHJcblxyXG4gIC8vICAgY29uc3QgZG9jID0gbmV3IGpzUERGKHtcclxuICAvLyAgICAgb3JpZW50YXRpb246IGNvbHVtbnMubGVuZ3RoID4gNiA/ICdsYW5kc2NhcGUnIDogJ3BvcnRyYWl0JyxcclxuICAvLyAgIH0pO1xyXG5cclxuICAvLyAgIGNvbnN0IGNvbHVtblN0eWxlczogYW55ID0ge307XHJcblxyXG4gIC8vICAgY29sdW1ucy5mb3JFYWNoKChjb2wsIGluZGV4KSA9PiB7XHJcbiAgLy8gICAgIGNvbHVtblN0eWxlc1tpbmRleF0gPSB7XHJcbiAgLy8gICAgICAgaGFsaWduOiBjb2wuYWxpZ24gfHwgJ2xlZnQnLFxyXG4gIC8vICAgICB9O1xyXG4gIC8vICAgfSk7XHJcblxyXG4gIC8vICAgYXV0b1RhYmxlKGRvYywge1xyXG4gIC8vICAgICBoZWFkLFxyXG4gIC8vICAgICBib2R5LFxyXG4gIC8vICAgICBzdHlsZXM6IHsgZm9udFNpemU6IDkgfSxcclxuICAvLyAgICAgY29sdW1uU3R5bGVzLFxyXG4gIC8vICAgICBoZWFkU3R5bGVzOiB7XHJcbiAgLy8gICAgICAgZmlsbENvbG9yOiBbNDEsIDEyOCwgMTg1XSxcclxuICAvLyAgICAgfSxcclxuICAvLyAgICAgbWFyZ2luOiB7IHRvcDogMjAgfSxcclxuICAvLyAgICAgZGlkUGFyc2VDZWxsOiAoZGF0YTogYW55KSA9PiB7XHJcbiAgLy8gICAgICAgaWYgKGRhdGEuc2VjdGlvbiA9PT0gJ2hlYWQnKSB7XHJcbiAgLy8gICAgICAgICBjb25zdCBjb2xJbmRleCA9IGRhdGEuY29sdW1uLmluZGV4O1xyXG4gIC8vICAgICAgICAgZGF0YS5jZWxsLnN0eWxlcy5oYWxpZ24gPSBjb2x1bW5TdHlsZXNbY29sSW5kZXhdPy5oYWxpZ24gfHwgJ2xlZnQnO1xyXG4gIC8vICAgICAgIH1cclxuICAvLyAgICAgfSxcclxuICAvLyAgICAgZGlkRHJhd1BhZ2U6ICgpID0+IHtcclxuICAvLyAgICAgICBkb2Muc2V0Rm9udFNpemUoMTIpO1xyXG4gIC8vICAgICAgIGRvYy50ZXh0KGhlYWRpbmdUb1ByaW50LCAxNCwgMTUpO1xyXG4gIC8vICAgICB9LFxyXG4gIC8vICAgfSk7XHJcblxyXG4gIC8vICAgZG9jLnNhdmUoJ3RhYmxlLWV4cG9ydC5wZGYnKTtcclxuICAvLyB9XHJcblxyXG4gIHByaW50VGFibGUoaGVhZGluZ1RvUHJpbnQ6IHN0cmluZywgaHRtbDogc3RyaW5nKTogdm9pZCB7XHJcbiAgICBjb25zdCBwb3B1cCA9IHdpbmRvdy5vcGVuKCcnLCAnX2JsYW5rJywgJ3dpZHRoPTEwMDAsaGVpZ2h0PTcwMCcpO1xyXG4gICAgaWYgKCFwb3B1cCkgcmV0dXJuO1xyXG5cclxuICAgIHBvcHVwLmRvY3VtZW50Lm9wZW4oKTtcclxuICAgIHBvcHVwLmRvY3VtZW50LndyaXRlKGBcclxuICAgIDxodG1sPlxyXG4gICAgICA8aGVhZD5cclxuICAgICAgICA8dGl0bGU+JHtoZWFkaW5nVG9QcmludH08L3RpdGxlPlxyXG4gICAgICAgIDxzdHlsZT5cclxuICAgICAgICAgIGJvZHkgeyBmb250LWZhbWlseTogQXJpYWw7IG1hcmdpbjoyMHB4OyB9XHJcbiAgICAgICAgICB0YWJsZSB7IGJvcmRlci1jb2xsYXBzZTogY29sbGFwc2U7IHdpZHRoOjEwMCU7IH1cclxuICAgICAgICAgIHRoLCB0ZCB7IGJvcmRlcjoxcHggc29saWQgI2NjYzsgcGFkZGluZzo2cHg7IH1cclxuICAgICAgICAgIC5tYXQtY29sdW1uLXJvd09wcyB7ZGlzcGxheTogbm9uZSAhaW1wb3J0YW50O31cclxuICAgICAgICAgIC5tYXQtY29sdW1uLWFjdGlvbnMge2Rpc3BsYXk6IG5vbmUgIWltcG9ydGFudDsgfVxyXG4gICAgICAgIDwvc3R5bGU+XHJcbiAgICAgIDwvaGVhZD5cclxuICAgICAgIDxib2R5IG9ubG9hZD1cIndpbmRvdy5mb2N1cygpOyB3aW5kb3cucHJpbnQoKTtcIj4ke2h0bWx9PC9ib2R5PlxyXG4gICAgPC9odG1sPlxyXG4gIGApO1xyXG4gICAgcG9wdXAuZG9jdW1lbnQuY2xvc2UoKTtcclxuICAgIHBvcHVwLm9uYWZ0ZXJwcmludCA9ICgpID0+IHBvcHVwLmNsb3NlKCk7XHJcbiAgICAvLyBwb3B1cC5wcmludCgpO1xyXG4gICAgLy8gcG9wdXAuY2xvc2UoKTtcclxuICB9XHJcbn1cclxuIl19