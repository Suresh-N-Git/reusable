import { AfterViewInit, Component, ElementRef, HostListener, inject, OnChanges, OnInit, ViewChild } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';

import { Input, Output, EventEmitter } from '@angular/core';
import { SimpleChanges } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

import { TableExportService } from './table-export.service';


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

  // NEW (used by multiline or future cases)
  displayField?: string;   // for both types multiline and ling
  linkField?: string;   // for type link

  actions?: {
    select?: { show?: boolean; color?: 'primary' | 'accent' | 'warn' };
    edit?: { show?: boolean; color?: 'primary' | 'accent' | 'warn' };
    delete?: { show?: boolean; color?: 'primary' | 'accent' | 'warn' };
  };
}

export interface ReusableTableConfig {

  appearance?: {
    zebraColor?: string;
    hoverColor?: string;
    selectedRowColor?: string;
  };

  pagination?: {
    enabled?: boolean;
    threshold?: number;
    defaultPageSize?: number;
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
}

const DEFAULT_TABLE_CONFIG: Required<ReusableTableConfig> = {
  appearance: {
    zebraColor: '#f5f5f5',
    hoverColor: '#e3f2fd',
    selectedRowColor: '#ffe0b2'
  },
  pagination: {
    enabled: true,
    threshold: 100,
    defaultPageSize: 25
  },
  sorting: {
    enabled: true
  },
  toolbar: {
    showSearch: true,
    showColumnToggle: true,
    showCsv: true,
    showExcel: true,
    showPdf: true,
    showPrint: true
  }
};


@Component({
  selector: 'app-reusabletable',
  templateUrl: './reusabletable.component.html',
  styleUrls: ['./reusabletable.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})


export class ReusabletableComponent implements OnInit, OnChanges, AfterViewInit {

  constructor(private exportService: TableExportService) { }

  @Input() columns: ReUsableTableColumn[] = [];
  @Input() tableConfig: ReusableTableConfig = {};

  resolvedConfig: Required<ReusableTableConfig> = DEFAULT_TABLE_CONFIG;  // Create with default. No need to null check

  @Input() data: any[] = [];
  @Input() enableActions = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('printSection') printSection!: ElementRef;

  @Output() rowEdit = new EventEmitter<any>();
  @Output() rowSelect = new EventEmitter<any>();
  @Output() rowDelete = new EventEmitter<any>();

  columnFilters: any = {};
  globalFilter = '';

  isMobileView = false;

  displayedColumns: string[] = [];
  displayedColumnIds: string[] = [];
  displayedColumnsExtended: ReUsableTableColumn[] = [];

  visibleColumnIds: string[] = [];

  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  selectedRow: any = null;
  currentFilter = '';

  ngOnInit(): void {
    // this.isMobileView = window.innerWidth <= 768;
    this.updateViewMode();

  }

  ngOnChanges(changes: SimpleChanges) {

    const config = this.tableConfig ?? {};

    this.resolvedConfig = {
      appearance: {
        ...DEFAULT_TABLE_CONFIG.appearance,
        ...(config.appearance ?? {})
      },
      pagination: {
        ...DEFAULT_TABLE_CONFIG.pagination,
        ...(config.pagination ?? {})
      },
      sorting: {
        ...DEFAULT_TABLE_CONFIG.sorting,
        ...(config.sorting ?? {})
      },
      toolbar: {
        ...DEFAULT_TABLE_CONFIG.toolbar,
        ...(config.toolbar ?? {})
      }
    };

    this.tryInitialize();
  }

  @HostListener('window:resize')
  updateViewMode() {
    this.isMobileView = window.innerWidth <= 768;

  }

  private tryInitialize() {

    this.displayedColumnsExtended = this.columns;
    this.displayedColumnIds = this.columns.map(c => c.id);
    this.visibleColumnIds = [...this.displayedColumnIds];

    this.dataSource.data = this.data || [];
    this.buildDataSource();
  }
  ngAfterViewInit() {

    if (!this.dataSource) return;

    if (this.paginator && this.resolvedConfig.pagination?.enabled) {
      this.dataSource.paginator = this.paginator;

      const len = this.dataSource.data.length;
      const threshold = this.resolvedConfig.pagination.defaultPageSize || 100;

      if (len < threshold) {
        this.paginator.pageSize = len || 1;
      } else {
        this.paginator.pageSize = 25;
      }

      this.paginator.firstPage(); // safer than _changePageSize
    }

    if (this.sort && this.resolvedConfig.sorting?.enabled) {
      this.dataSource.sort = this.sort;
    }
  }

  setSelectedRow(row: any) {
    this.selectedRow = row;
  }


  getCellStyle(col: any) {
    return {
      'text-align': col.align || 'left',
      'vertical-align': 'middle',
      ...col.style
    };
  }

  getChipContainerStyle(col: any) {
    if (!col.chipStyle) return null;

    const { backgroundColor, ...rest } = col.chipStyle;

    return {
      backgroundColor
    };
  }

  getChipTextStyle(col: any) {
    if (!col.chipStyle) return null;
    const { backgroundColor, ...rest } = col.chipStyle;
    return rest;
  }


  getDisplayValue(obj: any, col: any): any {
    if (!obj) return '';

    // Optional override
    if (col.displayField) {
      return obj[col.displayField];
    }

    // Fallback
    const values = Object.values(obj).filter(v => v != null);
    return values[0] ?? '';
  }


  getLinkValue(obj: any, col: ReUsableTableColumn): string {
    if (!obj) return '';

    // If object-based
    if (col.linkField) {
      return obj[col.linkField];
    }

    // If direct string URL
    return obj;
  }



  toggleColumn(columnId: string) {

    const index = this.visibleColumnIds.indexOf(columnId);

    if (index >= 0) {
      this.visibleColumnIds.splice(index, 1);
    } else {
      this.visibleColumnIds.push(columnId);
    }

    this.updateVisibleColumns();
  }

  updateVisibleColumns() {

    if (!this.visibleColumnIds.includes('actions')) {
      this.visibleColumnIds.push('actions');
    }

    this.displayedColumnIds =
      this.displayedColumnsExtended
        .filter((c: { id: string; }) => this.visibleColumnIds.includes(c.id))
        .map((c: { id: any; }) => c.id);
  }


  private buildDataSource() {
    this.dataSource = new MatTableDataSource(this.data);

    this.dataSource.filterPredicate = (data: any, filter: string) =>
      Object.values(data)
        .join(' ')
        .toLowerCase()
        .includes(filter);

  }

  onEdit(row: any) {
    this.rowEdit.emit(row);
  }

  onSelect(row: any) {
    this.rowSelect.emit(row);
  }

  onDelete(row: any) {
    this.rowDelete.emit(row);
  }

  applyGlobalFilter(event: Event) {
    const value = (event.target as HTMLInputElement)
      .value
      .trim()
      .toLowerCase();

    this.currentFilter = value;
    this.dataSource.filter = value;

    // Ensure filtering resets to first page: Else filter will only filter the visible rows and may throw empty rows
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }

  }


  highlightSearchedText(value: any): string {
    if (!value || !this.currentFilter) return value;

    const regex = new RegExp(`(${this.currentFilter})`, 'gi');
    return String(value).replace(regex, '<mark>$1</mark>');
  }



  getFormatOfValue(value: any, col: any): string {
    // returns the format  used in UI for display of a value in the table

    if (value === null || value === undefined) return '';

    switch (col.type) {

      case 'integer':
        return Number(value).toLocaleString(undefined, {
          maximumFractionDigits: 0
        });

      case 'number':
        if (!col.digits) return Number(value).toLocaleString();

        // digits format: "1.2-2"
        const parts = col.digits.split('.');
        const fraction = parts[1]?.split('-');

        const minFraction = Number(fraction?.[0] ?? 0);
        const maxFraction = Number(fraction?.[1] ?? minFraction);

        return Number(value).toLocaleString(undefined, {
          minimumFractionDigits: minFraction,
          maximumFractionDigits: maxFraction
        });

      default:
        return value.toString();
    }
  }

  private getExportData() {
    const columns = this.displayedColumnsExtended
      .filter(c => this.displayedColumnIds.includes(c.id) && c.id !== 'actions');

    const rows = this.dataSource.filteredData.length
      ? this.dataSource.filteredData
      : this.dataSource.data;

    return { columns, rows };
  }

  downloadCSV() {
    const { columns, rows } = this.getExportData();
    this.exportService.exportCsv(columns, rows);
  }

  downloadExcel() {
    const { columns, rows } = this.getExportData();
    this.exportService.exportExcel(columns, rows);
  }


  downloadPdf() {
    const { columns, rows } = this.getExportData();

    this.exportService.exportPdf(
      columns,
      rows,
      (value, col) => this.getFormatOfValue(value, col)
    );
  }

  // downloadPdf() {
  //   const { columns, rows } = this.getExportData();
  //   this.exportService.exportPdf(columns, rows);
  // }

  printTable(): void {
    const html = this.printSection.nativeElement.innerHTML;
    this.exportService.printTable(html);
  }
}

