 import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

 import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

import { ReusabletableComponent } from './reusabletable.component';

@NgModule({
  declarations: [ReusabletableComponent],
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
  exports: [ReusabletableComponent]
})
export class ReusableTableModule {}
