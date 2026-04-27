import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

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
  displayField?: string;
  linkField?: string;
  searchTextMode?: 'displayed' | 'all';
  actions?: {
    select?: { show?: boolean; color?: 'primary' | 'accent' | 'warn' };
    edit?: { show?: boolean; color?: 'primary' | 'accent' | 'warn' };
    delete?: { show?: boolean; color?: 'primary' | 'accent' | 'warn' };
  };
  footer?:
  | { type: 'sum' | 'avg' | 'min' | 'max' | 'count' }
  | { type: 'text'; value: string }
  | { type: 'custom'; formatter: (rows: any[]) => string };
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

const DEFAULT_TABLE_CONFIG: Required<ReusableTableConfig> = {
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

@Component({
  selector: 'app-reusabletable',
  templateUrl: './reusable-table.component.html',
  styleUrls: ['./reusable-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReusableTableComponent implements OnInit, OnChanges, AfterViewInit {
  constructor(
    private readonly exportService: TableExportService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  @Input() columns: ReUsableTableColumn[] = [];
  @Input() tableConfig: ReusableTableConfig = {};
  @Input() data: any[] = [];
  @Input() enableActions = true;

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;
  @ViewChild('printSection') printSection?: ElementRef;

  @Output() rowEdit = new EventEmitter<any>();
  @Output() rowSelect = new EventEmitter<any>();
  @Output() rowDelete = new EventEmitter<any>();

  resolvedConfig: Required<ReusableTableConfig> = DEFAULT_TABLE_CONFIG;
  isMobileView = false;
  displayedColumnIds: string[] = [];
  displayedColumnsExtended: ReUsableTableColumn[] = [];
  visibleColumnIds: string[] = [];
  dataSource = new MatTableDataSource<any>([]);
  selectedRow: any = null;
  currentFilter = '';
  headingForCtrlP: string = "Print Table";

  footerValues: Record<string, string> = {};

  ngOnInit(): void {
    this.updateViewMode();
  }

  ngOnChanges(_: SimpleChanges): void {
    this.resolvedConfig = this.mergeConfig(this.tableConfig);
    document.title = this.resolvedConfig.appearance.headingToPrint ?? this.headingForCtrlP;
    this.initializeTable();
  }

  @HostListener('window:resize')
  updateViewMode(): void {
    this.isMobileView = window.innerWidth <= 768;
  }

  ngAfterViewInit(): void {
    this.attachMaterialControllers();
  }

  setSelectedRow(row: any): void {
    this.selectedRow = row;
  }

  getCellStyle(col: ReUsableTableColumn): Record<string, any> {
    return {
      textAlign: col.align || 'left',
      verticalAlign: 'middle',
      ...col.style,
    };
  }

  getChipContainerStyle(col: ReUsableTableColumn): Record<string, any> | null {
    if (!col.chipStyle) return null;

    return {
      backgroundColor: col.chipStyle['backgroundColor'],
    };
  }

  getChipTextStyle(col: ReUsableTableColumn): Record<string, any> | null {
    if (!col.chipStyle) return null;

    const { backgroundColor, ...rest } = col.chipStyle;
    return rest;
  }

  getDisplayValue(obj: any, col: ReUsableTableColumn): any {
    if (!obj) return '';

    if (col.displayField) {
      return obj[col.displayField];
    }

    return Object.values(obj).find(value => value != null) ?? '';
  }

  getLinkValue(obj: any, col: ReUsableTableColumn): string {
    if (!obj) return '';

    return col.linkField ? obj[col.linkField] : obj;
  }

  toggleColumn(columnId: string): void {
    const index = this.visibleColumnIds.indexOf(columnId);

    if (index >= 0) {
      this.visibleColumnIds.splice(index, 1);
    } else {
      this.visibleColumnIds.push(columnId);
    }

    this.updateVisibleColumns();
    this.computeFooterValues();
  }

  onEdit(row: any): void {
    this.rowEdit.emit(row);
  }

  onSelect(row: any): void {
    this.rowSelect.emit(row);
  }

  onDelete(row: any): void {
    this.rowDelete.emit(row);
  }

  applyGlobalFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim().toLowerCase();

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


  highlightSearchedText(value: any): string {
    if (value === null || value === undefined || !this.currentFilter) {
      return value ?? '';
    }

    const escapedValue = this.escapeHtml(String(value));
    const escapedFilter = this.escapeRegex(this.currentFilter);
    const regex = new RegExp(`(${escapedFilter})`, 'gi');

    return escapedValue.replace(regex, '<mark>$1</mark>');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')   // must be first
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // highlightSearchedText(value: any): string {
  //   if (!value || !this.currentFilter) return value;

  //   const regex = new RegExp(`(${this.currentFilter})`, 'gi');
  //   return String(value).replace(regex, '<mark>$1</mark>');
  // }

  getFormatOfValue(value: any, col: ReUsableTableColumn): string {
    if (value === null || value === undefined) return '';

    switch (col.type) {
      case 'integer':
        return Number(value).toLocaleString(undefined, {
          maximumFractionDigits: 0,
        });
      case 'number': {
        if (!col.digits) return Number(value).toLocaleString();

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

  printTable(): void {

    const { rows } = this.getExportData();
    if (!this.assertHasRowsToExport(rows)) return;

    const savedPaginator = this.dataSource.paginator;
    this.dataSource.paginator = null; // Set it to null so that the whole data source gets printed
    this.cdr.detectChanges();  // Needed to make the full table data available in the html


    const html = this.printSection?.nativeElement?.innerHTML;

    this.dataSource.paginator = savedPaginator; // Put back the original state of the paginator
    this.cdr.detectChanges(); // Change detection then puts back the no of rows originally visible

    if (!html) return;

    this.exportService.printTable(this.resolvedConfig.appearance.headingToPrint!, html);
  }

  private mergeConfig(config: ReusableTableConfig): Required<ReusableTableConfig> {
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

  private initializeTable(): void {
    this.displayedColumnsExtended = [...this.columns];
    this.displayedColumnIds = this.columns.map(column => column.id);
    this.visibleColumnIds = [...this.displayedColumnIds];
    this.dataSource = new MatTableDataSource(this.data ?? []);
    this.dataSource.filterPredicate = (data: any, filter: string) =>
      this.buildSearchableText(data).includes(filter);

    this.updateVisibleColumns();
    this.attachMaterialControllers();
    this.computeFooterValues();
  }

  private buildSearchableText(row: any): string {
    return this.displayedColumnsExtended
      .map(column => this.getSearchableCellText(row?.[column.id], column))
      .join(' ')
      .toLowerCase();
  }

  private getSearchableCellText(value: any, col: ReUsableTableColumn): string {
    if (value === null || value === undefined) return '';

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

  private getSearchTextForObject(obj: any, col: ReUsableTableColumn): string {
    const displayedText = String(this.getDisplayValue(obj, col) ?? '');
    const hiddenText = String(this.getLinkValue(obj, col) ?? '');

    if (this.resolvedConfig.searchTextMode === 'displayed') {
      return displayedText;
    }

    return [displayedText, hiddenText].filter(Boolean).join(' ');
  }

  private attachMaterialControllers(): void {
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

  private updateVisibleColumns(): void {
    if (!this.visibleColumnIds.includes('actions')) {
      this.visibleColumnIds.push('actions');
    }

    this.displayedColumnIds = this.displayedColumnsExtended
      .filter(column => this.visibleColumnIds.includes(column.id))
      .map(column => column.id);
  }

  // private getExportData(): { columns: ReUsableTableColumn[]; rows: any[] } {
  //   const columns = this.displayedColumnsExtended.filter(
  //     column => this.displayedColumnIds.includes(column.id) && column.id !== 'actions'
  //   );

  //   const rows = this.dataSource.filteredData.length
  //     ? this.dataSource.filteredData
  //     : this.dataSource.data;

  //   return { columns, rows };
  // }



  private getExportData(): { columns: ReUsableTableColumn[]; rows: any[] } {
    const columns = this.displayedColumnsExtended.filter(
      column => this.displayedColumnIds.includes(column.id) && column.id !== 'actions'
    );

    const rows = this.dataSource.filteredData;

    return { columns, rows };
  }

  private computeFooterValues(): void {
    if (!this.resolvedConfig.footer.enabled) {
      this.footerValues = {};
      return;
    }

    const rows = this.dataSource.filteredData ?? [];
    const next: Record<string, string> = {};

    for (const col of this.displayedColumnsExtended) {
      next[col.id] = this.calcFooterValue(col, rows);
    }

    this.footerValues = next;
  }


  private calcFooterValue(col: ReUsableTableColumn, rows: any[]): string {
    if (!col.footer) return '';

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
          console.warn(
            `[ReusableTable] footer type "${col.footer.type}" on column "${col.id}" ` +
            `found no numeric values — rendering empty. Check if the column holds numeric data.`
          );
          return '';

        }
        let result: number;
        switch (col.footer.type) {
          case 'sum': result = nums.reduce((a, b) => a + b, 0); break;
          case 'avg': result = nums.reduce((a, b) => a + b, 0) / nums.length; break;
          case 'min': result = Math.min(...nums); break;
          case 'max': result = Math.max(...nums); break;
        }

        return this.getFormatOfValue(result, col);
      }
    }
  }
  downloadCSV(): void {
    const { columns, rows } = this.getExportData();
    if (!this.assertHasRowsToExport(rows)) return;
    this.exportService.exportCsv(columns, rows);
  }

  downloadExcel(): void {
    const { columns, rows } = this.getExportData();
    if (!this.assertHasRowsToExport(rows)) return;
    this.exportService.exportExcel(columns, rows);
  }

  downloadPdf(): void {
    const { columns, rows } = this.getExportData();
    if (!this.assertHasRowsToExport(rows)) return;
    this.exportService.exportPdf(columns, rows, this.resolvedConfig.appearance.headingToPrint!, (value, col) =>
      this.getFormatOfValue(value, col)
    );
  }

  private assertHasRowsToExport(rows: any[]): boolean {
    if (rows.length === 0) {
      // pick ONE of the options below
      alert('No Data Found.');
      return false;
    }
    return true;
  }
}
