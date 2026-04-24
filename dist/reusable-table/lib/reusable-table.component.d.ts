import { AfterViewInit, ElementRef, EventEmitter, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TableExportService } from './table-export.service';
import * as i0 from "@angular/core";
export interface ReUsableTableColumn {
    id: string;
    name: string;
    width?: string;
    type?: 'text' | 'integer' | 'number' | 'currency' | 'date' | 'actions' | 'chip' | 'multiline' | 'link';
    exportFormatter?: (value: any) => string;
    align?: 'left' | 'center' | 'right';
    digits?: string;
    style?: Record<string, any>;
    chipStyle?: Record<string, any>;
    displayField?: string;
    linkField?: string;
    searchTextMode?: 'displayed' | 'all';
    actions?: {
        select?: {
            show?: boolean;
            color?: 'primary' | 'accent' | 'warn';
        };
        edit?: {
            show?: boolean;
            color?: 'primary' | 'accent' | 'warn';
        };
        delete?: {
            show?: boolean;
            color?: 'primary' | 'accent' | 'warn';
        };
    };
    footer?: {
        type: 'sum' | 'avg' | 'min' | 'max' | 'count';
    } | {
        type: 'text';
        value: string;
    } | {
        type: 'custom';
        formatter: (rows: any[]) => string;
    };
}
export interface ReusableTableConfig {
    searchTextMode?: 'displayed' | 'all';
    appearance?: {
        zebraColor?: string;
        hoverColor?: string;
        selectedRowColor?: string;
        headingToPrint?: string;
    };
    pagination?: {
        enabled?: boolean;
        threshold?: number;
        defaultPageSize?: 5 | 10 | 25 | 100;
    };
    sorting?: {
        enabled?: boolean;
    };
    toolbar?: {
        showSearch?: boolean;
        showColumnToggle?: boolean;
        showCsv?: boolean;
        showExcel?: boolean;
        showPdf?: boolean;
        showPrint?: boolean;
    };
    footer?: {
        enabled?: boolean;
        sticky?: boolean;
    };
}
export declare class ReusableTableComponent implements OnInit, OnChanges, AfterViewInit {
    private readonly exportService;
    constructor(exportService: TableExportService);
    columns: ReUsableTableColumn[];
    tableConfig: ReusableTableConfig;
    data: any[];
    enableActions: boolean;
    paginator?: MatPaginator;
    sort?: MatSort;
    printSection?: ElementRef;
    rowEdit: EventEmitter<any>;
    rowSelect: EventEmitter<any>;
    rowDelete: EventEmitter<any>;
    resolvedConfig: Required<ReusableTableConfig>;
    isMobileView: boolean;
    displayedColumnIds: string[];
    displayedColumnsExtended: ReUsableTableColumn[];
    visibleColumnIds: string[];
    dataSource: MatTableDataSource<any, MatPaginator>;
    selectedRow: any;
    currentFilter: string;
    headingForCtrlP: string;
    footerValues: Record<string, string>;
    ngOnInit(): void;
    ngOnChanges(_: SimpleChanges): void;
    updateViewMode(): void;
    ngAfterViewInit(): void;
    setSelectedRow(row: any): void;
    getCellStyle(col: ReUsableTableColumn): Record<string, any>;
    getChipContainerStyle(col: ReUsableTableColumn): Record<string, any> | null;
    getChipTextStyle(col: ReUsableTableColumn): Record<string, any> | null;
    getDisplayValue(obj: any, col: ReUsableTableColumn): any;
    getLinkValue(obj: any, col: ReUsableTableColumn): string;
    toggleColumn(columnId: string): void;
    onEdit(row: any): void;
    onSelect(row: any): void;
    onDelete(row: any): void;
    applyGlobalFilter(event: Event): void;
    highlightSearchedText(value: any): string;
    private escapeHtml;
    private escapeRegex;
    getFormatOfValue(value: any, col: ReUsableTableColumn): string;
    printTable(): void;
    private mergeConfig;
    private initializeTable;
    private buildSearchableText;
    private getSearchableCellText;
    private getSearchTextForObject;
    private attachMaterialControllers;
    private updateVisibleColumns;
    private getExportData;
    private computeFooterValues;
    private calcFooterValue;
    downloadCSV(): void;
    downloadExcel(): void;
    downloadPdf(): void;
    private assertHasRowsToExport;
    static ɵfac: i0.ɵɵFactoryDeclaration<ReusableTableComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<ReusableTableComponent, "app-reusabletable", never, { "columns": { "alias": "columns"; "required": false; }; "tableConfig": { "alias": "tableConfig"; "required": false; }; "data": { "alias": "data"; "required": false; }; "enableActions": { "alias": "enableActions"; "required": false; }; }, { "rowEdit": "rowEdit"; "rowSelect": "rowSelect"; "rowDelete": "rowDelete"; }, never, never, false, never>;
}
