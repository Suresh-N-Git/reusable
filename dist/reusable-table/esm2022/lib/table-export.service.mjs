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
          .mat-column-actions { display:none; }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGUtZXhwb3J0LnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9yZXVzYWJsZS10YWJsZS9zcmMvbGliL3RhYmxlLWV4cG9ydC5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFHM0MsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUM7QUFDN0IsT0FBTyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBQzFCLE9BQU8sU0FBUyxNQUFNLGlCQUFpQixDQUFDOztBQUt4QyxNQUFNLE9BQU8sa0JBQWtCO0lBRTdCLFNBQVMsQ0FDUCxPQUE4QixFQUM5QixJQUFXLEVBQ1gsU0FBMkI7UUFFM0IsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXpELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FDN0IsT0FBTzthQUNKLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNULElBQUksS0FBSyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFeEIsSUFBSSxHQUFHLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ3hCLEtBQUssR0FBRyxHQUFHLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JDLENBQUM7WUFFRCxJQUFJLEtBQUssSUFBSSxJQUFJO2dCQUFFLE9BQU8sRUFBRSxDQUFDO1lBRTdCLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxTQUFTLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxRQUFRLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUUsQ0FBQztn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SyxFQUFFLENBQUM7UUFDekMsaUJBQWlCO1FBQ2pCLGlCQUFpQjtJQUNuQixDQUFDO3dHQXRRVSxrQkFBa0I7NEdBQWxCLGtCQUFrQixjQUZqQixNQUFNOzs0RkFFUCxrQkFBa0I7a0JBSDlCLFVBQVU7bUJBQUM7b0JBQ1YsVUFBVSxFQUFFLE1BQU07aUJBQ25CIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgUmVVc2FibGVUYWJsZUNvbHVtbiB9IGZyb20gJy4vcmV1c2FibGUtdGFibGUuY29tcG9uZW50JztcblxuaW1wb3J0ICogYXMgWExTWCBmcm9tICd4bHN4JztcbmltcG9ydCBqc1BERiBmcm9tICdqc3BkZic7XG5pbXBvcnQgYXV0b1RhYmxlIGZyb20gJ2pzcGRmLWF1dG90YWJsZSc7XG5cbkBJbmplY3RhYmxlKHtcbiAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxufSlcbmV4cG9ydCBjbGFzcyBUYWJsZUV4cG9ydFNlcnZpY2Uge1xuXG4gIGV4cG9ydENzdihcbiAgICBjb2x1bW5zOiBSZVVzYWJsZVRhYmxlQ29sdW1uW10sXG4gICAgcm93czogYW55W10sXG4gICAgZm9vdGVyUm93Pzogc3RyaW5nW10gfCBudWxsXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IGhlYWRlciA9IGNvbHVtbnMubWFwKGMgPT4gYFwiJHtjLm5hbWV9XCJgKS5qb2luKCcsJyk7XG5cbiAgICBjb25zdCBjc3ZSb3dzID0gcm93cy5tYXAocm93ID0+XG4gICAgICBjb2x1bW5zXG4gICAgICAgIC5tYXAoY29sID0+IHtcbiAgICAgICAgICBsZXQgdmFsdWUgPSByb3dbY29sLmlkXTtcblxuICAgICAgICAgIGlmIChjb2wuZXhwb3J0Rm9ybWF0dGVyKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGNvbC5leHBvcnRGb3JtYXR0ZXIodmFsdWUpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gJyc7XG5cbiAgICAgICAgICBpZiAoY29sLnR5cGUgPT09ICdpbnRlZ2VyJyB8fCBjb2wudHlwZSA9PT0gJ251bWJlcicgfHwgY29sLnR5cGUgPT09ICdjdXJyZW5jeScpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gYFwiJHt2YWx1ZS50b1N0cmluZygpLnJlcGxhY2UoL1wiL2csICdcIlwiJyl9XCJgO1xuICAgICAgICB9KVxuICAgICAgICAuam9pbignLCcpXG4gICAgKTtcblxuICAgIGNvbnN0IGFsbExpbmVzID0gW2hlYWRlciwgLi4uY3N2Um93c107XG5cbiAgICBpZiAoZm9vdGVyUm93ICYmIGZvb3RlclJvdy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IGZvb3RlckNzdiA9IGZvb3RlclJvd1xuICAgICAgICAubWFwKHZhbHVlID0+IGBcIiR7KHZhbHVlID8/ICcnKS50b1N0cmluZygpLnJlcGxhY2UoL1wiL2csICdcIlwiJyl9XCJgKVxuICAgICAgICAuam9pbignLCcpO1xuICAgICAgYWxsTGluZXMucHVzaChmb290ZXJDc3YpO1xuICAgIH1cblxuICAgIGNvbnN0IGNzdkNvbnRlbnQgPSBhbGxMaW5lcy5qb2luKCdcXG4nKTtcbiAgICBjb25zdCBibG9iID0gbmV3IEJsb2IoW2NzdkNvbnRlbnRdLCB7IHR5cGU6ICd0ZXh0L2NzdjtjaGFyc2V0PXV0Zi04OycgfSk7XG5cbiAgICBjb25zdCBsaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgIGxpbmsuaHJlZiA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gICAgbGluay5kb3dubG9hZCA9ICd0YWJsZS1leHBvcnQuY3N2JztcbiAgICBsaW5rLmNsaWNrKCk7XG4gIH1cbiAgXG4gIGV4cG9ydEV4Y2VsKFxuICAgIGNvbHVtbnM6IFJlVXNhYmxlVGFibGVDb2x1bW5bXSxcbiAgICByb3dzOiBhbnlbXSxcbiAgICBmb290ZXJSb3c/OiBzdHJpbmdbXSB8IG51bGxcbiAgKTogdm9pZCB7XG4gICAgY29uc3QgZXhwb3J0RGF0YSA9IHJvd3MubWFwKHJvdyA9PiB7XG4gICAgICBjb25zdCBvYmo6IGFueSA9IHt9O1xuXG4gICAgICBjb2x1bW5zLmZvckVhY2goY29sID0+IHtcbiAgICAgICAgbGV0IHZhbHVlID0gcm93W2NvbC5pZF07XG5cbiAgICAgICAgaWYgKGNvbC5leHBvcnRGb3JtYXR0ZXIpIHtcbiAgICAgICAgICB2YWx1ZSA9IGNvbC5leHBvcnRGb3JtYXR0ZXIodmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgdmFsdWUgPSB2YWx1ZS5qb2luKCcsICcpO1xuICAgICAgICB9IGVsc2UgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB2YWx1ZSA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG9ialtjb2wubmFtZV0gPSB2YWx1ZTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gb2JqO1xuICAgIH0pO1xuXG4gICAgY29uc3Qgd29ya3NoZWV0ID0gWExTWC51dGlscy5qc29uX3RvX3NoZWV0KGV4cG9ydERhdGEpO1xuXG4gICAgaWYgKGZvb3RlclJvdyAmJiBmb290ZXJSb3cubGVuZ3RoKSB7XG4gICAgICBYTFNYLnV0aWxzLnNoZWV0X2FkZF9hb2Eod29ya3NoZWV0LCBbZm9vdGVyUm93XSwgeyBvcmlnaW46IC0xIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHdvcmtib29rID0ge1xuICAgICAgU2hlZXRzOiB7IERhdGE6IHdvcmtzaGVldCB9LFxuICAgICAgU2hlZXROYW1lczogWydEYXRhJ10sXG4gICAgfTtcblxuICAgIGNvbnN0IGV4Y2VsQnVmZmVyID0gWExTWC53cml0ZSh3b3JrYm9vaywge1xuICAgICAgYm9va1R5cGU6ICd4bHN4JyxcbiAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgfSk7XG5cbiAgICBjb25zdCBibG9iID0gbmV3IEJsb2IoW2V4Y2VsQnVmZmVyXSwge1xuICAgICAgdHlwZTogJ2FwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5zcHJlYWRzaGVldG1sLnNoZWV0JyxcbiAgICB9KTtcblxuICAgIGNvbnN0IGxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgbGluay5ocmVmID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcbiAgICBsaW5rLmRvd25sb2FkID0gJ3RhYmxlLWV4cG9ydC54bHN4JztcbiAgICBsaW5rLmNsaWNrKCk7XG4gIH1cblxuICBleHBvcnRQZGYoXG4gICAgY29sdW1uczogUmVVc2FibGVUYWJsZUNvbHVtbltdLFxuICAgIHJvd3M6IGFueVtdLFxuICAgIGhlYWRpbmdUb1ByaW50OiBzdHJpbmcsXG4gICAgZm9ybWF0dGVyPzogKHZhbHVlOiBhbnksIGNvbDogUmVVc2FibGVUYWJsZUNvbHVtbikgPT4gc3RyaW5nLFxuICAgIGZvb3RlclJvdz86IHN0cmluZ1tdIHwgbnVsbFxuICApOiB2b2lkIHtcbiAgICBjb25zdCBoZWFkID0gW2NvbHVtbnMubWFwKGMgPT4gYy5uYW1lKV07XG5cbiAgICBjb25zdCBib2R5ID0gcm93cy5tYXAocm93ID0+XG4gICAgICBjb2x1bW5zLm1hcChjb2wgPT4ge1xuICAgICAgICBjb25zdCByYXcgPSByb3dbY29sLmlkXTtcblxuICAgICAgICBsZXQgdmFsdWUgPSByYXc7XG5cbiAgICAgICAgaWYgKGNvbC5leHBvcnRGb3JtYXR0ZXIpIHtcbiAgICAgICAgICB2YWx1ZSA9IGNvbC5leHBvcnRGb3JtYXR0ZXIocmF3KTtcbiAgICAgICAgfSBlbHNlIGlmIChmb3JtYXR0ZXIpIHtcbiAgICAgICAgICB2YWx1ZSA9IGZvcm1hdHRlcihyYXcsIGNvbCk7XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShyYXcpKSB7XG4gICAgICAgICAgdmFsdWUgPSByYXcuam9pbignLCAnKTtcbiAgICAgICAgfSBlbHNlIGlmIChyYXcgJiYgdHlwZW9mIHJhdyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB2YWx1ZSA9IEpTT04uc3RyaW5naWZ5KHJhdyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsdWUgPSByYXcgPz8gJyc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9KVxuICAgICk7XG5cbiAgICBjb25zdCBkb2MgPSBuZXcganNQREYoe1xuICAgICAgb3JpZW50YXRpb246IGNvbHVtbnMubGVuZ3RoID4gNiA/ICdsYW5kc2NhcGUnIDogJ3BvcnRyYWl0JyxcbiAgICB9KTtcblxuICAgIGNvbnN0IGNvbHVtblN0eWxlczogYW55ID0ge307XG5cbiAgICBjb2x1bW5zLmZvckVhY2goKGNvbCwgaW5kZXgpID0+IHtcbiAgICAgIGNvbHVtblN0eWxlc1tpbmRleF0gPSB7XG4gICAgICAgIGhhbGlnbjogY29sLmFsaWduIHx8ICdsZWZ0JyxcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBhdXRvVGFibGUoZG9jLCB7XG4gICAgICBoZWFkLFxuICAgICAgYm9keSxcbiAgICAgIGZvb3Q6IGZvb3RlclJvdyAmJiBmb290ZXJSb3cubGVuZ3RoID8gW2Zvb3RlclJvd10gOiB1bmRlZmluZWQsXG4gICAgICBzdHlsZXM6IHsgZm9udFNpemU6IDkgfSxcbiAgICAgIGNvbHVtblN0eWxlcyxcbiAgICAgIGhlYWRTdHlsZXM6IHtcbiAgICAgICAgZmlsbENvbG9yOiBbNDEsIDEyOCwgMTg1XSxcbiAgICAgIH0sXG4gICAgICBmb290U3R5bGVzOiB7XG4gICAgICAgIGZpbGxDb2xvcjogWzIyMCwgMjIwLCAyMjBdLFxuICAgICAgICB0ZXh0Q29sb3I6IFswLCAwLCAwXSxcbiAgICAgICAgZm9udFN0eWxlOiAnYm9sZCcsXG4gICAgICB9LFxuICAgICAgbWFyZ2luOiB7IHRvcDogMjAgfSxcbiAgICAgIGRpZFBhcnNlQ2VsbDogKGRhdGE6IGFueSkgPT4ge1xuICAgICAgICBpZiAoZGF0YS5zZWN0aW9uID09PSAnaGVhZCcgfHwgZGF0YS5zZWN0aW9uID09PSAnZm9vdCcpIHtcbiAgICAgICAgICBjb25zdCBjb2xJbmRleCA9IGRhdGEuY29sdW1uLmluZGV4O1xuICAgICAgICAgIGRhdGEuY2VsbC5zdHlsZXMuaGFsaWduID0gY29sdW1uU3R5bGVzW2NvbEluZGV4XT8uaGFsaWduIHx8ICdsZWZ0JztcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGRpZERyYXdQYWdlOiAoKSA9PiB7XG4gICAgICAgIGRvYy5zZXRGb250U2l6ZSgxMik7XG4gICAgICAgIGRvYy50ZXh0KGhlYWRpbmdUb1ByaW50LCAxNCwgMTUpO1xuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGRvYy5zYXZlKCd0YWJsZS1leHBvcnQucGRmJyk7XG4gIH1cblxuXG4gIC8vIGV4cG9ydFBkZihcbiAgLy8gICBjb2x1bW5zOiBSZVVzYWJsZVRhYmxlQ29sdW1uW10sXG4gIC8vICAgcm93czogYW55W10sXG4gIC8vICAgaGVhZGluZ1RvUHJpbnQ6IHN0cmluZyxcbiAgLy8gICBmb3JtYXR0ZXI/OiAodmFsdWU6IGFueSwgY29sOiBSZVVzYWJsZVRhYmxlQ29sdW1uKSA9PiBzdHJpbmdcbiAgLy8gKTogdm9pZCB7XG4gIC8vICAgY29uc3QgaGVhZCA9IFtjb2x1bW5zLm1hcChjID0+IGMubmFtZSldO1xuXG4gIC8vICAgY29uc3QgYm9keSA9IHJvd3MubWFwKHJvdyA9PlxuICAvLyAgICAgY29sdW1ucy5tYXAoY29sID0+IHtcbiAgLy8gICAgICAgY29uc3QgcmF3ID0gcm93W2NvbC5pZF07XG5cbiAgLy8gICAgICAgbGV0IHZhbHVlID0gcmF3O1xuXG4gIC8vICAgICAgIGlmIChjb2wuZXhwb3J0Rm9ybWF0dGVyKSB7XG4gIC8vICAgICAgICAgdmFsdWUgPSBjb2wuZXhwb3J0Rm9ybWF0dGVyKHJhdyk7XG4gIC8vICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0dGVyKSB7XG4gIC8vICAgICAgICAgdmFsdWUgPSBmb3JtYXR0ZXIocmF3LCBjb2wpO1xuICAvLyAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocmF3KSkge1xuICAvLyAgICAgICAgIHZhbHVlID0gcmF3LmpvaW4oJywgJyk7XG4gIC8vICAgICAgIH0gZWxzZSBpZiAocmF3ICYmIHR5cGVvZiByYXcgPT09ICdvYmplY3QnKSB7XG4gIC8vICAgICAgICAgdmFsdWUgPSBKU09OLnN0cmluZ2lmeShyYXcpO1xuICAvLyAgICAgICB9IGVsc2Uge1xuICAvLyAgICAgICAgIHZhbHVlID0gcmF3ID8/ICcnO1xuICAvLyAgICAgICB9XG5cbiAgLy8gICAgICAgcmV0dXJuIHZhbHVlO1xuICAvLyAgICAgfSlcbiAgLy8gICApO1xuXG4gIC8vICAgY29uc3QgZG9jID0gbmV3IGpzUERGKHtcbiAgLy8gICAgIG9yaWVudGF0aW9uOiBjb2x1bW5zLmxlbmd0aCA+IDYgPyAnbGFuZHNjYXBlJyA6ICdwb3J0cmFpdCcsXG4gIC8vICAgfSk7XG5cbiAgLy8gICBjb25zdCBjb2x1bW5TdHlsZXM6IGFueSA9IHt9O1xuXG4gIC8vICAgY29sdW1ucy5mb3JFYWNoKChjb2wsIGluZGV4KSA9PiB7XG4gIC8vICAgICBjb2x1bW5TdHlsZXNbaW5kZXhdID0ge1xuICAvLyAgICAgICBoYWxpZ246IGNvbC5hbGlnbiB8fCAnbGVmdCcsXG4gIC8vICAgICB9O1xuICAvLyAgIH0pO1xuXG4gIC8vICAgYXV0b1RhYmxlKGRvYywge1xuICAvLyAgICAgaGVhZCxcbiAgLy8gICAgIGJvZHksXG4gIC8vICAgICBzdHlsZXM6IHsgZm9udFNpemU6IDkgfSxcbiAgLy8gICAgIGNvbHVtblN0eWxlcyxcbiAgLy8gICAgIGhlYWRTdHlsZXM6IHtcbiAgLy8gICAgICAgZmlsbENvbG9yOiBbNDEsIDEyOCwgMTg1XSxcbiAgLy8gICAgIH0sXG4gIC8vICAgICBtYXJnaW46IHsgdG9wOiAyMCB9LFxuICAvLyAgICAgZGlkUGFyc2VDZWxsOiAoZGF0YTogYW55KSA9PiB7XG4gIC8vICAgICAgIGlmIChkYXRhLnNlY3Rpb24gPT09ICdoZWFkJykge1xuICAvLyAgICAgICAgIGNvbnN0IGNvbEluZGV4ID0gZGF0YS5jb2x1bW4uaW5kZXg7XG4gIC8vICAgICAgICAgZGF0YS5jZWxsLnN0eWxlcy5oYWxpZ24gPSBjb2x1bW5TdHlsZXNbY29sSW5kZXhdPy5oYWxpZ24gfHwgJ2xlZnQnO1xuICAvLyAgICAgICB9XG4gIC8vICAgICB9LFxuICAvLyAgICAgZGlkRHJhd1BhZ2U6ICgpID0+IHtcbiAgLy8gICAgICAgZG9jLnNldEZvbnRTaXplKDEyKTtcbiAgLy8gICAgICAgZG9jLnRleHQoaGVhZGluZ1RvUHJpbnQsIDE0LCAxNSk7XG4gIC8vICAgICB9LFxuICAvLyAgIH0pO1xuXG4gIC8vICAgZG9jLnNhdmUoJ3RhYmxlLWV4cG9ydC5wZGYnKTtcbiAgLy8gfVxuXG4gIHByaW50VGFibGUoaGVhZGluZ1RvUHJpbnQ6IHN0cmluZywgaHRtbDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgcG9wdXAgPSB3aW5kb3cub3BlbignJywgJ19ibGFuaycsICd3aWR0aD0xMDAwLGhlaWdodD03MDAnKTtcbiAgICBpZiAoIXBvcHVwKSByZXR1cm47XG5cbiAgICBwb3B1cC5kb2N1bWVudC5vcGVuKCk7XG4gICAgcG9wdXAuZG9jdW1lbnQud3JpdGUoYFxuICAgIDxodG1sPlxuICAgICAgPGhlYWQ+XG4gICAgICAgIDx0aXRsZT4ke2hlYWRpbmdUb1ByaW50fTwvdGl0bGU+XG4gICAgICAgIDxzdHlsZT5cbiAgICAgICAgICBib2R5IHsgZm9udC1mYW1pbHk6IEFyaWFsOyBtYXJnaW46MjBweDsgfVxuICAgICAgICAgIHRhYmxlIHsgYm9yZGVyLWNvbGxhcHNlOiBjb2xsYXBzZTsgd2lkdGg6MTAwJTsgfVxuICAgICAgICAgIHRoLCB0ZCB7IGJvcmRlcjoxcHggc29saWQgI2NjYzsgcGFkZGluZzo2cHg7IH1cbiAgICAgICAgICAubWF0LWNvbHVtbi1hY3Rpb25zIHsgZGlzcGxheTpub25lOyB9XG4gICAgICAgIDwvc3R5bGU+XG4gICAgICA8L2hlYWQ+XG4gICAgICAgPGJvZHkgb25sb2FkPVwid2luZG93LmZvY3VzKCk7IHdpbmRvdy5wcmludCgpO1wiPiR7aHRtbH08L2JvZHk+XG4gICAgPC9odG1sPlxuICBgKTtcblxuICAgIHBvcHVwLmRvY3VtZW50LmNsb3NlKCk7XG4gICAgcG9wdXAub25hZnRlcnByaW50ID0gKCkgPT4gcG9wdXAuY2xvc2UoKTtcbiAgICAvLyBwb3B1cC5wcmludCgpO1xuICAgIC8vIHBvcHVwLmNsb3NlKCk7XG4gIH1cbn1cbiJdfQ==