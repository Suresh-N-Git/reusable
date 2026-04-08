import { Routes } from '@angular/router';
import { TableuiComponent } from './tables/tableui/tableui.component';


export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tableui' },
  { path: 'tableui', component: TableuiComponent },
  { path: '**', redirectTo: 'tableui' }
]
