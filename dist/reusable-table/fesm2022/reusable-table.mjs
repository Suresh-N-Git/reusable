import * as i0 from '@angular/core';
import { Injectable, EventEmitter, Component, ChangeDetectionStrategy, Input, ViewChild, Output, HostListener, NgModule } from '@angular/core';
import * as i2 from '@angular/common';
import { CommonModule } from '@angular/common';
import * as i3 from '@angular/material/table';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import * as i4 from '@angular/material/paginator';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import * as i5 from '@angular/material/sort';
import { MatSort, MatSortModule } from '@angular/material/sort';
import * as i9 from '@angular/material/form-field';
import { MatFormFieldModule } from '@angular/material/form-field';
import * as i13 from '@angular/material/input';
import { MatInputModule } from '@angular/material/input';
import * as i6 from '@angular/material/icon';
import { MatIconModule } from '@angular/material/icon';
import * as i10 from '@angular/material/menu';
import { MatMenuModule } from '@angular/material/menu';
import * as i11 from '@angular/material/checkbox';
import { MatCheckboxModule } from '@angular/material/checkbox';
import * as i7 from '@angular/material/button';
import { MatButtonModule } from '@angular/material/button';
import * as i12 from '@angular/material/tooltip';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as i8 from '@angular/material/chips';
import { MatChipsModule } from '@angular/material/chips';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

class TableExportService {
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

const DEFAULT_TABLE_CONFIG = {
    searchTextMode: 'all',
    appearance: {
        zebraColor: '#f5f5f5',
        hoverColor: '#e3f2fd',
        selectedRowColor: '#ffe0b2',
        headingToPrint: 'Print Table'
    },
    pagination: {
        enabled: true,
        defaultPageSize: 25,
    },
    sorting: {
        enabled: true,
    },
    toolbar: {
        showSearch: true,
        showColumnToggle: true,
        showCsv: true,
        showExcel: true,
        showPdf: true,
        showPrint: true,
    },
    footer: {
        enabled: false,
        sticky: false,
    },
};
class ReusableTableComponent {
    exportService;
    cdr;
    constructor(exportService, cdr) {
        this.exportService = exportService;
        this.cdr = cdr;
    }
    columns = [];
    tableConfig = {};
    data = [];
    paginator;
    sort;
    printSection;
    rowEdit = new EventEmitter();
    rowSelect = new EventEmitter();
    rowDelete = new EventEmitter();
    resolvedConfig = DEFAULT_TABLE_CONFIG;
    isMobileView = false;
    displayedColumnIds = [];
    displayedColumnsExtended = [];
    visibleColumnIds = [];
    dataSource = new MatTableDataSource([]);
    selectedRow = null;
    currentFilter = '';
    headingForCtrlP = "Print Table";
    footerValues = {};
    ngOnInit() {
        this.updateViewMode();
    }
    ngOnChanges(_) {
        this.resolvedConfig = this.mergeConfig(this.tableConfig);
        document.title = this.resolvedConfig.appearance.headingToPrint ?? this.headingForCtrlP;
        this.initializeTable();
    }
    updateViewMode() {
        this.isMobileView = window.innerWidth <= 768;
    }
    ngAfterViewInit() {
        this.attachMaterialControllers();
    }
    setSelectedRow(row) {
        this.selectedRow = row;
    }
    isActionDisabled(row, action) {
        const rule = action?.disableWhen;
        if (!rule)
            return false;
        return row[rule.key] === rule.equals;
    }
    getCellStyle(col) {
        return {
            textAlign: col.align || 'left',
            verticalAlign: 'middle',
            ...col.style,
        };
    }
    getChipContainerStyle(col) {
        if (!col.chipStyle)
            return null;
        return {
            backgroundColor: col.chipStyle['backgroundColor'],
        };
    }
    getChipTextStyle(col) {
        if (!col.chipStyle)
            return null;
        const { backgroundColor, ...rest } = col.chipStyle;
        return rest;
    }
    getDisplayValue(obj, col) {
        if (!obj)
            return '';
        if (col.displayField) {
            return obj[col.displayField];
        }
        return Object.values(obj).find(value => value != null) ?? '';
    }
    getLinkValue(obj, col) {
        if (!obj)
            return '';
        return col.linkField ? obj[col.linkField] : obj;
    }
    toggleColumn(columnId) {
        const index = this.visibleColumnIds.indexOf(columnId);
        if (index >= 0) {
            this.visibleColumnIds.splice(index, 1);
        }
        else {
            this.visibleColumnIds.push(columnId);
        }
        this.updateVisibleColumns();
        this.computeFooterValues();
    }
    onEdit(row) {
        this.rowEdit.emit(row);
    }
    onSelect(row) {
        this.rowSelect.emit(row);
    }
    onDelete(row) {
        this.rowDelete.emit(row);
    }
    applyGlobalFilter(event) {
        const value = event.target.value.trim().toLowerCase();
        this.currentFilter = value;
        this.dataSource.filter = value;
        this.dataSource.paginator?.firstPage();
        this.computeFooterValues();
    }
    //  A few notes onn highlightSearchedText
    // Order matters in escapeHtml. & has to be replaced first — otherwise escaping < to &lt; would double-encode any existing & in later passes.
    // escapeRegex covers every regex metacharacter (. * + ? ^ $ { } ( ) | [ ] \). After this, a user typing (abc or . in the search box matches literal text instead of exploding or matching everything.
    // Guard clause widened a bit. The old if (!value ...) treated 0 and '' as "nothing to do" and returned them unchanged, which then got run through [innerHTML]. The new check is explicit about null/undefined and always returns a string-safe result.
    // Both helpers are private because they're implementation details, not part of the public API.
    // The template binding stays the same. You don't need to touch any [innerHTML]="highlightSearchedText(...)" in the HTML — they just start emitting safe content.
    highlightSearchedText(value) {
        if (value === null || value === undefined || !this.currentFilter) {
            return value ?? '';
        }
        const escapedValue = this.escapeHtml(String(value));
        const escapedFilter = this.escapeRegex(this.currentFilter);
        const regex = new RegExp(`(${escapedFilter})`, 'gi');
        return escapedValue.replace(regex, '<mark>$1</mark>');
    }
    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;') // must be first
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    escapeRegex(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    // highlightSearchedText(value: any): string {
    //   if (!value || !this.currentFilter) return value;
    //   const regex = new RegExp(`(${this.currentFilter})`, 'gi');
    //   return String(value).replace(regex, '<mark>$1</mark>');
    // }
    getFormatOfValue(value, col) {
        if (value === null || value === undefined)
            return '';
        switch (col.type) {
            case 'integer':
                return Number(value).toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                });
            case 'number': {
                if (!col.digits)
                    return Number(value).toLocaleString();
                const parts = col.digits.split('.');
                const fraction = parts[1]?.split('-');
                const minFraction = Number(fraction?.[0] ?? 0);
                const maxFraction = Number(fraction?.[1] ?? minFraction);
                return Number(value).toLocaleString(undefined, {
                    minimumFractionDigits: minFraction,
                    maximumFractionDigits: maxFraction,
                });
            }
            default:
                return String(value);
        }
    }
    printTable() {
        const { rows } = this.getExportData();
        if (!this.assertHasRowsToExport(rows))
            return;
        const savedPaginator = this.dataSource.paginator;
        this.dataSource.paginator = null; // Set it to null so that the whole data source gets printed
        this.cdr.detectChanges(); // Needed to make the full table data available in the html
        const html = this.printSection?.nativeElement?.innerHTML;
        this.dataSource.paginator = savedPaginator; // Put back the original state of the paginator
        this.cdr.detectChanges(); // Change detection then puts back the no of rows originally visible
        if (!html)
            return;
        this.exportService.printTable(this.resolvedConfig.appearance.headingToPrint, html);
    }
    mergeConfig(config) {
        return {
            searchTextMode: config.searchTextMode ?? DEFAULT_TABLE_CONFIG.searchTextMode,
            appearance: {
                ...DEFAULT_TABLE_CONFIG.appearance,
                ...(config.appearance ?? {}),
            },
            pagination: {
                ...DEFAULT_TABLE_CONFIG.pagination,
                ...(config.pagination ?? {}),
            },
            sorting: {
                ...DEFAULT_TABLE_CONFIG.sorting,
                ...(config.sorting ?? {}),
            },
            toolbar: {
                ...DEFAULT_TABLE_CONFIG.toolbar,
                ...(config.toolbar ?? {}),
            },
            footer: {
                ...DEFAULT_TABLE_CONFIG.footer,
                ...(config.footer ?? {}),
            },
        };
    }
    initializeTable() {
        this.displayedColumnsExtended = [...this.columns];
        this.displayedColumnIds = this.columns.map(column => column.id);
        this.visibleColumnIds = [...this.displayedColumnIds];
        this.dataSource = new MatTableDataSource(this.data ?? []);
        this.dataSource.filterPredicate = (data, filter) => this.buildSearchableText(data).includes(filter);
        this.updateVisibleColumns();
        this.attachMaterialControllers();
        this.computeFooterValues();
    }
    buildSearchableText(row) {
        return this.displayedColumnsExtended
            .map(column => this.getSearchableCellText(row?.[column.id], column))
            .join(' ')
            .toLowerCase();
    }
    getSearchableCellText(value, col) {
        if (value === null || value === undefined)
            return '';
        if (Array.isArray(value)) {
            return value
                .map(item => {
                if (item && typeof item === 'object') {
                    return this.getSearchTextForObject(item, col);
                }
                return String(item);
            })
                .join(' ');
        }
        if (value && typeof value === 'object') {
            return this.getSearchTextForObject(value, col);
        }
        return String(value);
    }
    getSearchTextForObject(obj, col) {
        const displayedText = String(this.getDisplayValue(obj, col) ?? '');
        const hiddenText = String(this.getLinkValue(obj, col) ?? '');
        if (this.resolvedConfig.searchTextMode === 'displayed') {
            return displayedText;
        }
        return [displayedText, hiddenText].filter(Boolean).join(' ');
    }
    attachMaterialControllers() {
        if (this.paginator && this.resolvedConfig.pagination.enabled) {
            this.dataSource.paginator = this.paginator;
            const len = this.dataSource.data.length;
            const pageSize = this.resolvedConfig.pagination.defaultPageSize ?? 25;
            this.paginator.pageSize = len < pageSize ? (len || 1) : pageSize;
            this.paginator.firstPage();
        }
        if (this.sort && this.resolvedConfig.sorting.enabled) {
            this.dataSource.sort = this.sort;
        }
    }
    updateVisibleColumns() {
        const actionsCol = this.displayedColumnsExtended.find(col => col.type === 'actions');
        if (actionsCol && !this.visibleColumnIds.includes(actionsCol.id)) {
            this.visibleColumnIds.push(actionsCol.id);
        }
        this.displayedColumnIds = this.displayedColumnsExtended
            .filter(column => this.visibleColumnIds.includes(column.id))
            .map(column => column.id);
    }
    getExportData() {
        const columns = this.displayedColumnsExtended.filter(column => this.displayedColumnIds.includes(column.id) && column.type !== 'actions');
        const rows = this.dataSource.filteredData;
        return { columns, rows };
    }
    computeFooterValues() {
        if (!this.resolvedConfig.footer.enabled) {
            this.footerValues = {};
            return;
        }
        const rows = this.dataSource.filteredData ?? [];
        const next = {};
        for (const col of this.displayedColumnsExtended) {
            next[col.id] = this.calcFooterValue(col, rows);
        }
        this.footerValues = next;
    }
    calcFooterValue(col, rows) {
        if (!col.footer)
            return '';
        switch (col.footer.type) {
            case 'text':
                return col.footer.value;
            case 'custom':
                return col.footer.formatter(rows);
            case 'count':
                return String(rows.length);
            case 'sum':
            case 'avg':
            case 'min':
            case 'max': {
                const nums = rows
                    .map(r => Number(r?.[col.id]))
                    .filter(n => Number.isFinite(n));
                // if (!nums.length) return '';
                if (!nums.length) {
                    console.warn(`[ReusableTable] footer type "${col.footer.type}" on column "${col.id}" ` +
                        `found no numeric values — rendering empty. Check if the column holds numeric data.`);
                    return '';
                }
                let result;
                switch (col.footer.type) {
                    case 'sum':
                        result = nums.reduce((a, b) => a + b, 0);
                        break;
                    case 'avg':
                        result = nums.reduce((a, b) => a + b, 0) / nums.length;
                        break;
                    case 'min':
                        result = Math.min(...nums);
                        break;
                    case 'max':
                        result = Math.max(...nums);
                        break;
                }
                return this.getFormatOfValue(result, col);
            }
        }
    }
    getFooterRowForExport(columns) {
        if (!this.resolvedConfig.footer.enabled)
            return null;
        return columns.map(col => this.footerValues[col.id] ?? '');
    }
    downloadCSV() {
        const { columns, rows } = this.getExportData();
        if (!this.assertHasRowsToExport(rows))
            return;
        const footerRow = this.getFooterRowForExport(columns);
        this.exportService.exportCsv(columns, rows, footerRow);
    }
    downloadExcel() {
        const { columns, rows } = this.getExportData();
        if (!this.assertHasRowsToExport(rows))
            return;
        const footerRow = this.getFooterRowForExport(columns);
        this.exportService.exportExcel(columns, rows, footerRow);
    }
    downloadPdf() {
        const { columns, rows } = this.getExportData();
        if (!this.assertHasRowsToExport(rows))
            return;
        const footerRow = this.getFooterRowForExport(columns);
        this.exportService.exportPdf(columns, rows, this.resolvedConfig.appearance.headingToPrint, (value, col) => this.getFormatOfValue(value, col), footerRow);
    }
    assertHasRowsToExport(rows) {
        if (rows.length === 0) {
            alert('No Data Found.');
            return false;
        }
        return true;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: ReusableTableComponent, deps: [{ token: TableExportService }, { token: i0.ChangeDetectorRef }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "18.2.14", type: ReusableTableComponent, selector: "app-reusabletable", inputs: { columns: "columns", tableConfig: "tableConfig", data: "data" }, outputs: { rowEdit: "rowEdit", rowSelect: "rowSelect", rowDelete: "rowDelete" }, host: { listeners: { "window:resize": "updateViewMode()" } }, viewQueries: [{ propertyName: "paginator", first: true, predicate: MatPaginator, descendants: true }, { propertyName: "sort", first: true, predicate: MatSort, descendants: true }, { propertyName: "printSection", first: true, predicate: ["printSection"], descendants: true }], usesOnChanges: true, ngImport: i0, template: "<div class=\"row w-100 align-items-center mt-3 no-print\">\n\n  <div class=\"col-md-3 col-sm-12 \" *ngIf=\"resolvedConfig.toolbar.showSearch\">\n\n    <mat-form-field appearance=\"outline\" class=\"search-field\">\n      <mat-label>Search</mat-label>\n\n      <mat-icon matSuffix>search</mat-icon>\n\n      <input matInput (keyup)=\"applyGlobalFilter($event)\" placeholder=\"Search all columns\">\n\n    </mat-form-field>\n\n  </div>\n\n  <div class=\"col-md-9 d-flex justify-content-end gap-2\">\n\n    <button *ngIf=\"resolvedConfig.toolbar.showColumnToggle !== false\" mat-icon-button color=\"primary\"\n      [matMenuTriggerFor]=\"columnMenu\" matTooltip=\"Show/Hide Columns\">\n      <mat-icon>view_week</mat-icon>\n      <span class=\"icon-text\">shc</span>\n    </button>\n\n    <button *ngIf=\"resolvedConfig.toolbar.showCsv\" mat-icon-button color=\"primary\" matTooltip=\"Download CSV\"\n      (click)=\"downloadCSV()\">\n      <mat-icon>description</mat-icon>\n      <span class=\"icon-text\">csv</span>\n    </button>\n\n    <button *ngIf=\"resolvedConfig.toolbar.showExcel !== false\" mat-icon-button color=\"primary\"\n      matTooltip=\"Download Excel\" (click)=\"downloadExcel()\">\n      <mat-icon>table_view</mat-icon>\n      <span class=\"icon-text\">xls</span>\n    </button>\n\n    <button *ngIf=\"resolvedConfig.toolbar.showPdf !== false\" mat-icon-button color=\"primary\" matTooltip=\"Download PDF\"\n      (click)=\"downloadPdf()\">\n      <mat-icon>picture_as_pdf</mat-icon>\n      <span class=\"icon-text\">pdf</span>\n    </button>\n\n    <button *ngIf=\"resolvedConfig.toolbar.showPrint\" mat-icon-button color=\"primary\" matTooltip=\"Print Table\"\n      (click)=\"printTable()\">\n      <mat-icon>print</mat-icon>\n      <span class=\"icon-text\">prn</span>\n    </button>\n\n  </div>\n\n  <mat-menu #columnMenu=\"matMenu\" class=\"column-menu\">\n\n    <div class=\"menu-header\">\n      <span>Show Columns</span>\n    </div>\n\n    @for (col of displayedColumnsExtended; track col.id) {\n    <button mat-menu-item (click)=\"$event.stopPropagation()\">\n      <mat-checkbox [checked]=\"visibleColumnIds.includes(col.id)\" (change)=\"toggleColumn(col.id)\"\n        [disabled]=\"col.type === 'actions'\">\n        {{ col.name }}\n      </mat-checkbox>\n    </button>\n    }\n\n  </mat-menu>\n\n</div>\n\n<div #printSection class=\"table-container print-area\" [style.--zebra-color]=\"resolvedConfig.appearance.zebraColor\"\n  [style.--hover-color]=\"resolvedConfig.appearance.hoverColor || '#e3f2fd'\"\n  [style.--selected-row-color]=\"resolvedConfig.appearance.selectedRowColor || '#ffe0b2'\">\n\n  <table mat-table [dataSource]=\"dataSource\" matSort>\n\n    @for (col of displayedColumnsExtended; track col.id) {\n\n    <ng-container [matColumnDef]=\"col.id\">\n\n      @if (col.type !== 'actions') {\n      <th mat-header-cell *matHeaderCellDef [style.width]=\"col.width\" mat-sort-header\n        [disabled]=\"!resolvedConfig.sorting.enabled\" [arrowPosition]=\"col.align === 'right' ? 'before' : 'after'\"\n        [ngClass]=\"{\n          'right-aligned-header': col.align === 'right',\n          'center-aligned-header': col.align === 'center',\n          'left-aligned-header': !col.align || col.align === 'left'\n        }\">\n        {{ col.name }}\n      </th>\n      } @else {\n      <th mat-header-cell *matHeaderCellDef [style.width]=\"col.width\" [style.text-align]=\"col.align || 'left'\">\n        {{ col.name }}\n      </th>\n      }\n\n      <td mat-cell *matCellDef=\"let row\" [attr.data-label]=\"col.name\" [ngStyle]=\"getCellStyle(col)\">\n\n        @if (col.type === 'actions') {\n\n        @if (isMobileView) {\n        <span class=\"cell-label\">{{ col.name }}</span>\n        }\n\n        <div class=\"cell-value action-buttons\">\n          @if (col.actions?.select?.show) {\n          <button mat-icon-button [color]=\"col.actions?.select?.color\" \n           [disabled]=\"isActionDisabled(row, col.actions?.select)\"\n           (click)=\"setSelectedRow(row); onSelect(row)\">\n            <mat-icon>check_box</mat-icon>\n          </button>\n          }\n\n          @if (col.actions?.edit?.show) {\n          <button mat-icon-button [color]=\"col.actions?.edit?.color\" \n          [disabled]=\"isActionDisabled(row, col.actions?.edit)\"\n          (click)=\"setSelectedRow(row); onEdit(row)\">\n            <mat-icon>edit</mat-icon>\n          </button>\n          }\n\n          @if (col.actions?.delete?.show) {\n          <button mat-icon-button [color]=\"col.actions?.delete?.color\" \n           [disabled]=\"isActionDisabled(row, col.actions?.delete)\"(click)=\"setSelectedRow(row); onDelete(row)\">\n            <mat-icon>delete</mat-icon>\n          </button>\n          }\n        </div>\n\n        } @else {\n\n        @if (isMobileView) {\n        <span class=\"cell-label\">{{ col.name }}</span>\n        }\n\n        <span class=\"cell-value\">\n\n          @switch (col.type) {\n\n          @case ('integer') {\n          {{ row[col.id] | number:'1.0-0' }}\n          }\n\n          @case ('number') {\n          <span [innerHTML]=\"highlightSearchedText(row[col.id] | number:(col.digits || '1.2-2'))\"></span>\n          }\n\n          @case ('currency') {\n          {{ row[col.id] | currency:'INR' }}\n          }\n\n          @case ('date') {\n          {{ row[col.id] | date:'dd-MM-yyyy' }}\n          }\n\n          @case ('chip') {\n          <mat-chip selected [ngStyle]=\"getChipContainerStyle(col)\">\n            <span [ngStyle]=\"getChipTextStyle(col)\">\n              {{ row[col.id] }}\n            </span>\n          </mat-chip>\n          }\n\n          @case ('multiline') {\n          <ng-container *ngIf=\"row[col.id]?.length; else noData\">\n            <div *ngFor=\"let item of row[col.id]\">\n              {{ getDisplayValue(item, col) }}\n            </div>\n          </ng-container>\n          <ng-template #noData>-</ng-template>\n          }\n\n          @case ('link') {\n          <ng-container *ngIf=\"row[col.id]?.length; else noData\">\n            <div *ngFor=\"let item of row[col.id]\">\n              <a [href]=\"getLinkValue(item, col)\" target=\"_blank\" rel=\"noopener noreferrer\">\n                {{ getDisplayValue(item, col) }}\n              </a>\n            </div>\n          </ng-container>\n          <ng-template #noData>-</ng-template>\n          }\n\n          @default {\n          <span [innerHTML]=\"highlightSearchedText(row[col.id])\"></span>\n          }\n\n          }\n\n        </span>\n\n        }\n\n      </td>\n\n      <td mat-footer-cell *matFooterCellDef [ngStyle]=\"getCellStyle(col)\">\n        {{ footerValues[col.id] }}\n      </td>\n\n    </ng-container>\n\n    }\n\n    <tr mat-header-row *matHeaderRowDef=\"displayedColumnIds; sticky: true\"></tr>\n    <tr mat-row *matRowDef=\"let row; columns: displayedColumnIds\" [class.row-selected]=\"row === selectedRow\"></tr>\n    @if (resolvedConfig.footer.enabled) {\n    <tr mat-footer-row *matFooterRowDef=\"displayedColumnIds; sticky: resolvedConfig.footer.sticky\"></tr>\n    }\n\n  </table>\n</div>\n\n<div class=\"no-print\" *ngIf=\"resolvedConfig.pagination.enabled\">\n  <mat-paginator [pageSizeOptions]=\"[5, 10, 25, 100]\" showFirstLastButtons></mat-paginator>\n</div>\n\n<div class=\"print-hint no-print\" *ngIf=\"(displayedColumnIds.length || 0) > 7\">\n  For reports with more than 7 columns, select\n  <b>Landscape</b> in the print dialog.\n</div>", styles: [".table-container{height:500px;overflow:auto;border:1px solid #ddd}.search-field{width:100%}.search-field .mat-mdc-form-field-infix{padding-top:10px;padding-bottom:10px}.mat-mdc-header-row{background:#fff;box-shadow:0 2px 3px #00000014;z-index:10}.mat-mdc-header-row .mat-mdc-header-cell{background:#94baf3;border-bottom:1px solid #dcdcdc;font-weight:600;letter-spacing:3px;font-variant-numeric:tabular-nums}.mat-mdc-header-cell,.mat-mdc-cell,.mat-sort-header-content{font-variant-numeric:tabular-nums}.mat-sort-header-content{letter-spacing:inherit}.table-container .mat-mdc-row:nth-child(2n){background:var(--zebra-color)}.table-container .mat-mdc-row:hover .mat-mdc-cell{background:var(--hover-color)!important}.table-container .mat-mdc-row.row-selected .mat-mdc-cell,.table-container .mat-mdc-row.row-selected:hover .mat-mdc-cell{background:var(--selected-row-color)!important}.table-container .mat-mdc-cell,.table-container .mat-mdc-header-cell{padding-top:0!important;padding-bottom:0!important}.mdc-data-table__cell,.mat-mdc-header-cell{padding:12px 16px}.cell-label{display:none}.cell-value{display:block;width:100%;margin-top:0}.mat-column-flow .cell-value,.mat-column-id .cell-value{padding-right:0}.table-container .mat-column-actions .cell-value{display:flex;align-items:center;justify-content:center}mark{background:#ffeb3b;border-radius:2px;padding:0 2px}button.mat-icon-button{display:flex;flex-direction:column;align-items:center;justify-content:center}.icon-text{font-size:14px;line-height:14px}.mat-icon{margin-bottom:-10px}.action-buttons{display:flex;align-items:center;justify-content:center;gap:2px}.action-buttons mat-icon{width:24px;height:24px;font-size:24px}.action-buttons .mat-mdc-icon-button{width:28px;height:28px;padding:2px}.print-hint{margin-top:6px;color:#555;font-size:12px}.column-menu{padding:8px 0}.menu-header{padding:8px 16px;border-bottom:1px solid #ddd;font-weight:600}.mat-menu-item{height:auto}@media screen and (max-width: 768px){.mat-mdc-header-row{display:none!important}mat-form-field{width:100%}.mat-mdc-row{display:block!important;margin:16px 0;padding:12px;border:1px solid #e0e0e0;border-radius:8px;background:#fff;height:auto!important;min-height:unset!important}.mat-mdc-cell{display:flex!important;justify-content:flex-start!important;width:100%;padding:8px 0!important;text-align:left!important;border-bottom:1px solid #eee}.mat-mdc-cell:last-child{border-bottom:none}.mat-mdc-cell:before{content:none}.cell-label{display:block;flex:0 0 40%;font-weight:600;color:#666;text-transform:uppercase;font-size:.75rem}.cell-value{margin-left:auto!important;min-width:0;text-align:right!important;font-variant-numeric:tabular-nums}}@media print{body *,.no-print,.mat-column-actions{display:none!important}.print-area,.print-area *{visibility:visible}.print-area{position:absolute;left:0;top:0;width:100%}.table-container{height:auto!important;overflow:visible!important}}\n"], dependencies: [{ kind: "directive", type: i2.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }, { kind: "directive", type: i2.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { kind: "directive", type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "directive", type: i2.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { kind: "component", type: i3.MatTable, selector: "mat-table, table[mat-table]", exportAs: ["matTable"] }, { kind: "directive", type: i3.MatHeaderCellDef, selector: "[matHeaderCellDef]" }, { kind: "directive", type: i3.MatHeaderRowDef, selector: "[matHeaderRowDef]", inputs: ["matHeaderRowDef", "matHeaderRowDefSticky"] }, { kind: "directive", type: i3.MatColumnDef, selector: "[matColumnDef]", inputs: ["matColumnDef"] }, { kind: "directive", type: i3.MatCellDef, selector: "[matCellDef]" }, { kind: "directive", type: i3.MatRowDef, selector: "[matRowDef]", inputs: ["matRowDefColumns", "matRowDefWhen"] }, { kind: "directive", type: i3.MatFooterCellDef, selector: "[matFooterCellDef]" }, { kind: "directive", type: i3.MatFooterRowDef, selector: "[matFooterRowDef]", inputs: ["matFooterRowDef", "matFooterRowDefSticky"] }, { kind: "directive", type: i3.MatHeaderCell, selector: "mat-header-cell, th[mat-header-cell]" }, { kind: "directive", type: i3.MatCell, selector: "mat-cell, td[mat-cell]" }, { kind: "directive", type: i3.MatFooterCell, selector: "mat-footer-cell, td[mat-footer-cell]" }, { kind: "component", type: i3.MatHeaderRow, selector: "mat-header-row, tr[mat-header-row]", exportAs: ["matHeaderRow"] }, { kind: "component", type: i3.MatRow, selector: "mat-row, tr[mat-row]", exportAs: ["matRow"] }, { kind: "component", type: i3.MatFooterRow, selector: "mat-footer-row, tr[mat-footer-row]", exportAs: ["matFooterRow"] }, { kind: "component", type: i4.MatPaginator, selector: "mat-paginator", inputs: ["color", "pageIndex", "length", "pageSize", "pageSizeOptions", "hidePageSize", "showFirstLastButtons", "selectConfig", "disabled"], outputs: ["page"], exportAs: ["matPaginator"] }, { kind: "directive", type: i5.MatSort, selector: "[matSort]", inputs: ["matSortActive", "matSortStart", "matSortDirection", "matSortDisableClear", "matSortDisabled"], outputs: ["matSortChange"], exportAs: ["matSort"] }, { kind: "component", type: i5.MatSortHeader, selector: "[mat-sort-header]", inputs: ["mat-sort-header", "arrowPosition", "start", "disabled", "sortActionDescription", "disableClear"], exportAs: ["matSortHeader"] }, { kind: "component", type: i6.MatIcon, selector: "mat-icon", inputs: ["color", "inline", "svgIcon", "fontSet", "fontIcon"], exportAs: ["matIcon"] }, { kind: "component", type: i7.MatIconButton, selector: "button[mat-icon-button]", exportAs: ["matButton"] }, { kind: "component", type: i8.MatChip, selector: "mat-basic-chip, [mat-basic-chip], mat-chip, [mat-chip]", inputs: ["role", "id", "aria-label", "aria-description", "value", "color", "removable", "highlighted", "disableRipple", "disabled"], outputs: ["removed", "destroyed"], exportAs: ["matChip"] }, { kind: "component", type: i9.MatFormField, selector: "mat-form-field", inputs: ["hideRequiredMarker", "color", "floatLabel", "appearance", "subscriptSizing", "hintLabel"], exportAs: ["matFormField"] }, { kind: "directive", type: i9.MatLabel, selector: "mat-label" }, { kind: "directive", type: i9.MatSuffix, selector: "[matSuffix], [matIconSuffix], [matTextSuffix]", inputs: ["matTextSuffix"] }, { kind: "component", type: i10.MatMenu, selector: "mat-menu", inputs: ["backdropClass", "aria-label", "aria-labelledby", "aria-describedby", "xPosition", "yPosition", "overlapTrigger", "hasBackdrop", "class", "classList"], outputs: ["closed", "close"], exportAs: ["matMenu"] }, { kind: "component", type: i10.MatMenuItem, selector: "[mat-menu-item]", inputs: ["role", "disabled", "disableRipple"], exportAs: ["matMenuItem"] }, { kind: "directive", type: i10.MatMenuTrigger, selector: "[mat-menu-trigger-for], [matMenuTriggerFor]", inputs: ["mat-menu-trigger-for", "matMenuTriggerFor", "matMenuTriggerData", "matMenuTriggerRestoreFocus"], outputs: ["menuOpened", "onMenuOpen", "menuClosed", "onMenuClose"], exportAs: ["matMenuTrigger"] }, { kind: "component", type: i11.MatCheckbox, selector: "mat-checkbox", inputs: ["aria-label", "aria-labelledby", "aria-describedby", "id", "required", "labelPosition", "name", "value", "disableRipple", "tabIndex", "color", "disabledInteractive", "checked", "disabled", "indeterminate"], outputs: ["change", "indeterminateChange"], exportAs: ["matCheckbox"] }, { kind: "directive", type: i12.MatTooltip, selector: "[matTooltip]", inputs: ["matTooltipPosition", "matTooltipPositionAtOrigin", "matTooltipDisabled", "matTooltipShowDelay", "matTooltipHideDelay", "matTooltipTouchGestures", "matTooltip", "matTooltipClass"], exportAs: ["matTooltip"] }, { kind: "directive", type: i13.MatInput, selector: "input[matInput], textarea[matInput], select[matNativeControl],      input[matNativeControl], textarea[matNativeControl]", inputs: ["disabled", "id", "placeholder", "name", "required", "type", "errorStateMatcher", "aria-describedby", "value", "readonly"], exportAs: ["matInput"] }, { kind: "pipe", type: i2.DecimalPipe, name: "number" }, { kind: "pipe", type: i2.CurrencyPipe, name: "currency" }, { kind: "pipe", type: i2.DatePipe, name: "date" }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: ReusableTableComponent, decorators: [{
            type: Component,
            args: [{ selector: 'app-reusabletable', changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"row w-100 align-items-center mt-3 no-print\">\n\n  <div class=\"col-md-3 col-sm-12 \" *ngIf=\"resolvedConfig.toolbar.showSearch\">\n\n    <mat-form-field appearance=\"outline\" class=\"search-field\">\n      <mat-label>Search</mat-label>\n\n      <mat-icon matSuffix>search</mat-icon>\n\n      <input matInput (keyup)=\"applyGlobalFilter($event)\" placeholder=\"Search all columns\">\n\n    </mat-form-field>\n\n  </div>\n\n  <div class=\"col-md-9 d-flex justify-content-end gap-2\">\n\n    <button *ngIf=\"resolvedConfig.toolbar.showColumnToggle !== false\" mat-icon-button color=\"primary\"\n      [matMenuTriggerFor]=\"columnMenu\" matTooltip=\"Show/Hide Columns\">\n      <mat-icon>view_week</mat-icon>\n      <span class=\"icon-text\">shc</span>\n    </button>\n\n    <button *ngIf=\"resolvedConfig.toolbar.showCsv\" mat-icon-button color=\"primary\" matTooltip=\"Download CSV\"\n      (click)=\"downloadCSV()\">\n      <mat-icon>description</mat-icon>\n      <span class=\"icon-text\">csv</span>\n    </button>\n\n    <button *ngIf=\"resolvedConfig.toolbar.showExcel !== false\" mat-icon-button color=\"primary\"\n      matTooltip=\"Download Excel\" (click)=\"downloadExcel()\">\n      <mat-icon>table_view</mat-icon>\n      <span class=\"icon-text\">xls</span>\n    </button>\n\n    <button *ngIf=\"resolvedConfig.toolbar.showPdf !== false\" mat-icon-button color=\"primary\" matTooltip=\"Download PDF\"\n      (click)=\"downloadPdf()\">\n      <mat-icon>picture_as_pdf</mat-icon>\n      <span class=\"icon-text\">pdf</span>\n    </button>\n\n    <button *ngIf=\"resolvedConfig.toolbar.showPrint\" mat-icon-button color=\"primary\" matTooltip=\"Print Table\"\n      (click)=\"printTable()\">\n      <mat-icon>print</mat-icon>\n      <span class=\"icon-text\">prn</span>\n    </button>\n\n  </div>\n\n  <mat-menu #columnMenu=\"matMenu\" class=\"column-menu\">\n\n    <div class=\"menu-header\">\n      <span>Show Columns</span>\n    </div>\n\n    @for (col of displayedColumnsExtended; track col.id) {\n    <button mat-menu-item (click)=\"$event.stopPropagation()\">\n      <mat-checkbox [checked]=\"visibleColumnIds.includes(col.id)\" (change)=\"toggleColumn(col.id)\"\n        [disabled]=\"col.type === 'actions'\">\n        {{ col.name }}\n      </mat-checkbox>\n    </button>\n    }\n\n  </mat-menu>\n\n</div>\n\n<div #printSection class=\"table-container print-area\" [style.--zebra-color]=\"resolvedConfig.appearance.zebraColor\"\n  [style.--hover-color]=\"resolvedConfig.appearance.hoverColor || '#e3f2fd'\"\n  [style.--selected-row-color]=\"resolvedConfig.appearance.selectedRowColor || '#ffe0b2'\">\n\n  <table mat-table [dataSource]=\"dataSource\" matSort>\n\n    @for (col of displayedColumnsExtended; track col.id) {\n\n    <ng-container [matColumnDef]=\"col.id\">\n\n      @if (col.type !== 'actions') {\n      <th mat-header-cell *matHeaderCellDef [style.width]=\"col.width\" mat-sort-header\n        [disabled]=\"!resolvedConfig.sorting.enabled\" [arrowPosition]=\"col.align === 'right' ? 'before' : 'after'\"\n        [ngClass]=\"{\n          'right-aligned-header': col.align === 'right',\n          'center-aligned-header': col.align === 'center',\n          'left-aligned-header': !col.align || col.align === 'left'\n        }\">\n        {{ col.name }}\n      </th>\n      } @else {\n      <th mat-header-cell *matHeaderCellDef [style.width]=\"col.width\" [style.text-align]=\"col.align || 'left'\">\n        {{ col.name }}\n      </th>\n      }\n\n      <td mat-cell *matCellDef=\"let row\" [attr.data-label]=\"col.name\" [ngStyle]=\"getCellStyle(col)\">\n\n        @if (col.type === 'actions') {\n\n        @if (isMobileView) {\n        <span class=\"cell-label\">{{ col.name }}</span>\n        }\n\n        <div class=\"cell-value action-buttons\">\n          @if (col.actions?.select?.show) {\n          <button mat-icon-button [color]=\"col.actions?.select?.color\" \n           [disabled]=\"isActionDisabled(row, col.actions?.select)\"\n           (click)=\"setSelectedRow(row); onSelect(row)\">\n            <mat-icon>check_box</mat-icon>\n          </button>\n          }\n\n          @if (col.actions?.edit?.show) {\n          <button mat-icon-button [color]=\"col.actions?.edit?.color\" \n          [disabled]=\"isActionDisabled(row, col.actions?.edit)\"\n          (click)=\"setSelectedRow(row); onEdit(row)\">\n            <mat-icon>edit</mat-icon>\n          </button>\n          }\n\n          @if (col.actions?.delete?.show) {\n          <button mat-icon-button [color]=\"col.actions?.delete?.color\" \n           [disabled]=\"isActionDisabled(row, col.actions?.delete)\"(click)=\"setSelectedRow(row); onDelete(row)\">\n            <mat-icon>delete</mat-icon>\n          </button>\n          }\n        </div>\n\n        } @else {\n\n        @if (isMobileView) {\n        <span class=\"cell-label\">{{ col.name }}</span>\n        }\n\n        <span class=\"cell-value\">\n\n          @switch (col.type) {\n\n          @case ('integer') {\n          {{ row[col.id] | number:'1.0-0' }}\n          }\n\n          @case ('number') {\n          <span [innerHTML]=\"highlightSearchedText(row[col.id] | number:(col.digits || '1.2-2'))\"></span>\n          }\n\n          @case ('currency') {\n          {{ row[col.id] | currency:'INR' }}\n          }\n\n          @case ('date') {\n          {{ row[col.id] | date:'dd-MM-yyyy' }}\n          }\n\n          @case ('chip') {\n          <mat-chip selected [ngStyle]=\"getChipContainerStyle(col)\">\n            <span [ngStyle]=\"getChipTextStyle(col)\">\n              {{ row[col.id] }}\n            </span>\n          </mat-chip>\n          }\n\n          @case ('multiline') {\n          <ng-container *ngIf=\"row[col.id]?.length; else noData\">\n            <div *ngFor=\"let item of row[col.id]\">\n              {{ getDisplayValue(item, col) }}\n            </div>\n          </ng-container>\n          <ng-template #noData>-</ng-template>\n          }\n\n          @case ('link') {\n          <ng-container *ngIf=\"row[col.id]?.length; else noData\">\n            <div *ngFor=\"let item of row[col.id]\">\n              <a [href]=\"getLinkValue(item, col)\" target=\"_blank\" rel=\"noopener noreferrer\">\n                {{ getDisplayValue(item, col) }}\n              </a>\n            </div>\n          </ng-container>\n          <ng-template #noData>-</ng-template>\n          }\n\n          @default {\n          <span [innerHTML]=\"highlightSearchedText(row[col.id])\"></span>\n          }\n\n          }\n\n        </span>\n\n        }\n\n      </td>\n\n      <td mat-footer-cell *matFooterCellDef [ngStyle]=\"getCellStyle(col)\">\n        {{ footerValues[col.id] }}\n      </td>\n\n    </ng-container>\n\n    }\n\n    <tr mat-header-row *matHeaderRowDef=\"displayedColumnIds; sticky: true\"></tr>\n    <tr mat-row *matRowDef=\"let row; columns: displayedColumnIds\" [class.row-selected]=\"row === selectedRow\"></tr>\n    @if (resolvedConfig.footer.enabled) {\n    <tr mat-footer-row *matFooterRowDef=\"displayedColumnIds; sticky: resolvedConfig.footer.sticky\"></tr>\n    }\n\n  </table>\n</div>\n\n<div class=\"no-print\" *ngIf=\"resolvedConfig.pagination.enabled\">\n  <mat-paginator [pageSizeOptions]=\"[5, 10, 25, 100]\" showFirstLastButtons></mat-paginator>\n</div>\n\n<div class=\"print-hint no-print\" *ngIf=\"(displayedColumnIds.length || 0) > 7\">\n  For reports with more than 7 columns, select\n  <b>Landscape</b> in the print dialog.\n</div>", styles: [".table-container{height:500px;overflow:auto;border:1px solid #ddd}.search-field{width:100%}.search-field .mat-mdc-form-field-infix{padding-top:10px;padding-bottom:10px}.mat-mdc-header-row{background:#fff;box-shadow:0 2px 3px #00000014;z-index:10}.mat-mdc-header-row .mat-mdc-header-cell{background:#94baf3;border-bottom:1px solid #dcdcdc;font-weight:600;letter-spacing:3px;font-variant-numeric:tabular-nums}.mat-mdc-header-cell,.mat-mdc-cell,.mat-sort-header-content{font-variant-numeric:tabular-nums}.mat-sort-header-content{letter-spacing:inherit}.table-container .mat-mdc-row:nth-child(2n){background:var(--zebra-color)}.table-container .mat-mdc-row:hover .mat-mdc-cell{background:var(--hover-color)!important}.table-container .mat-mdc-row.row-selected .mat-mdc-cell,.table-container .mat-mdc-row.row-selected:hover .mat-mdc-cell{background:var(--selected-row-color)!important}.table-container .mat-mdc-cell,.table-container .mat-mdc-header-cell{padding-top:0!important;padding-bottom:0!important}.mdc-data-table__cell,.mat-mdc-header-cell{padding:12px 16px}.cell-label{display:none}.cell-value{display:block;width:100%;margin-top:0}.mat-column-flow .cell-value,.mat-column-id .cell-value{padding-right:0}.table-container .mat-column-actions .cell-value{display:flex;align-items:center;justify-content:center}mark{background:#ffeb3b;border-radius:2px;padding:0 2px}button.mat-icon-button{display:flex;flex-direction:column;align-items:center;justify-content:center}.icon-text{font-size:14px;line-height:14px}.mat-icon{margin-bottom:-10px}.action-buttons{display:flex;align-items:center;justify-content:center;gap:2px}.action-buttons mat-icon{width:24px;height:24px;font-size:24px}.action-buttons .mat-mdc-icon-button{width:28px;height:28px;padding:2px}.print-hint{margin-top:6px;color:#555;font-size:12px}.column-menu{padding:8px 0}.menu-header{padding:8px 16px;border-bottom:1px solid #ddd;font-weight:600}.mat-menu-item{height:auto}@media screen and (max-width: 768px){.mat-mdc-header-row{display:none!important}mat-form-field{width:100%}.mat-mdc-row{display:block!important;margin:16px 0;padding:12px;border:1px solid #e0e0e0;border-radius:8px;background:#fff;height:auto!important;min-height:unset!important}.mat-mdc-cell{display:flex!important;justify-content:flex-start!important;width:100%;padding:8px 0!important;text-align:left!important;border-bottom:1px solid #eee}.mat-mdc-cell:last-child{border-bottom:none}.mat-mdc-cell:before{content:none}.cell-label{display:block;flex:0 0 40%;font-weight:600;color:#666;text-transform:uppercase;font-size:.75rem}.cell-value{margin-left:auto!important;min-width:0;text-align:right!important;font-variant-numeric:tabular-nums}}@media print{body *,.no-print,.mat-column-actions{display:none!important}.print-area,.print-area *{visibility:visible}.print-area{position:absolute;left:0;top:0;width:100%}.table-container{height:auto!important;overflow:visible!important}}\n"] }]
        }], ctorParameters: () => [{ type: TableExportService }, { type: i0.ChangeDetectorRef }], propDecorators: { columns: [{
                type: Input
            }], tableConfig: [{
                type: Input
            }], data: [{
                type: Input
            }], paginator: [{
                type: ViewChild,
                args: [MatPaginator]
            }], sort: [{
                type: ViewChild,
                args: [MatSort]
            }], printSection: [{
                type: ViewChild,
                args: ['printSection']
            }], rowEdit: [{
                type: Output
            }], rowSelect: [{
                type: Output
            }], rowDelete: [{
                type: Output
            }], updateViewMode: [{
                type: HostListener,
                args: ['window:resize']
            }] } });

class ReusableTableModule {
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: ReusableTableModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
    static ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "18.2.14", ngImport: i0, type: ReusableTableModule, declarations: [ReusableTableComponent], imports: [CommonModule,
            MatTableModule,
            MatPaginatorModule,
            MatSortModule,
            MatIconModule,
            MatButtonModule,
            MatChipsModule,
            MatFormFieldModule,
            MatMenuModule,
            MatCheckboxModule,
            MatTooltipModule,
            MatInputModule], exports: [ReusableTableComponent] });
    static ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: ReusableTableModule, imports: [CommonModule,
            MatTableModule,
            MatPaginatorModule,
            MatSortModule,
            MatIconModule,
            MatButtonModule,
            MatChipsModule,
            MatFormFieldModule,
            MatMenuModule,
            MatCheckboxModule,
            MatTooltipModule,
            MatInputModule] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: ReusableTableModule, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [ReusableTableComponent],
                    imports: [
                        CommonModule,
                        MatTableModule,
                        MatPaginatorModule,
                        MatSortModule,
                        MatIconModule,
                        MatButtonModule,
                        MatChipsModule,
                        MatFormFieldModule,
                        MatMenuModule,
                        MatCheckboxModule,
                        MatTooltipModule,
                        MatInputModule,
                    ],
                    exports: [ReusableTableComponent],
                }]
        }] });

class ReusableTableService {
    constructor() { }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: ReusableTableService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: ReusableTableService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: ReusableTableService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [] });

/*
 * Public API Surface of reusable-table
 */

/**
 * Generated bundle index. Do not edit.
 */

export { ReusableTableComponent, ReusableTableModule, ReusableTableService, TableExportService };
//# sourceMappingURL=reusable-table.mjs.map
