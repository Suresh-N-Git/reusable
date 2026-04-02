import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { TableuiComponent } from './tables/tableui/tableui.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})


export class AppComponent {
  title = 'reusable-table';

  
  constructor( private route: Router) {
  }


  openReusableTable() {
    this.route.navigate(['tableui'])
  }


}




