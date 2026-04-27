import { ReUsableTableColumn } from './reusable-table.component';
import * as i0 from "@angular/core";
export declare class TableExportService {
    exportCsv(columns: ReUsableTableColumn[], rows: any[], footerRow?: string[] | null): void;
    exportExcel(columns: ReUsableTableColumn[], rows: any[], footerRow?: string[] | null): void;
    exportPdf(columns: ReUsableTableColumn[], rows: any[], headingToPrint: string, formatter?: (value: any, col: ReUsableTableColumn) => string, footerRow?: string[] | null): void;
    printTable(headingToPrint: string, html: string): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<TableExportService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<TableExportService>;
}
