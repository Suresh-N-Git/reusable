import { Component } from '@angular/core';
import { ReusableTableModule, ReUsableTableColumn, ReusableTableConfig } from 'reusable-table';

@Component({
  selector: 'app-tableui',
  standalone: true,
  imports: [ReusableTableModule],
  templateUrl: './tableui.component.html',
  styleUrl: './tableui.component.scss'
})


export class TableuiComponent {

  reUsableTableConfig!: ReusableTableConfig;
  reUsableTableColumn: ReUsableTableColumn[] = [];

  pumpData = [
    {
      id: 1, name: 'Pump, A', flow: 1000.9999, col4: 'some text', col5: [{ "TextToDisplay": "Plain text" }]
    },
    { id: 2, name: 'Pump B', flow: 120.88, col4: 'some text' },
    { id: 3, name: 'Pump C', flow: 95.66, col4: 'some text' },
    { id: 4, name: 'Pump D', flow: 140.6, col4: 'some text' },
    {
      id: 5, name: 'Pump E', flow: 110.06, col4: 'some text', col5: [
        { "TextToDisplay": "table-export (5).pdf" },
        { "TextToDisplay": "table-export (4).pdf" }
      ]
    },
    // { id: 6, name: 'Pump F', flow: 130, col4: 'some text', col5: 'more text' },
    // { id: 1, name: 'Pump, A', flow: 1000, col4: 'some text', col5: 'more text' },
    // { id: 2, name: 'Pump B', flow: 120, col4: 'some text', col5: 'more text' },
    // { id: 3, name: 'Pump C', flow: 95, col4: 'some text', col5: 'more text' },
    // { id: 4, name: 'Pump D', flow: 140, col4: 'some text', col5: 'more text' },
    // { id: 5, name: 'Pump E', flow: 110, col4: 'some text', col5: 'more text' },
    // { id: 6, name: 'Pump F', flow: 130, col4: 'some text', col5: 'more text' },
    // { id: 1, name: 'Pump, A', flow: 1000, col4: 'some text', col5: 'more text' },
    // { id: 2, name: 'Pump B', flow: 120, col4: 'some text', col5: 'more text' },
    // { id: 3, name: 'Pump C', flow: 95, col4: 'some text', col5: 'more text' },
    // { id: 4, name: 'Pump D', flow: 140, col4: 'some text', col5: 'more text' },
    // { id: 5, name: 'Pump E', flow: 110, col4: 'some text', col5: 'more text' },
    {
      id: 10, name: 'New Name', flow: 130, col4: 'some text', "col6": [
        {
          "UploadedFileName": "table-export (5).pdf",
          "RelativeFilePath": "https://ttapi.ipmsbmc.com/uploads/1/t_task/49_3b95dd0c-0bf4-4f48-93c8-6880ecfee166_table-export (5).pdf"
        },
        {
          "UploadedFileName": "table-export (4).pdf",
          "RelativeFilePath": "https://ttapi.ipmsbmc.com/uploads/1/t_task/49_f58c62d6-72f0-4f84-af47-0d3ae2a029b5_table-export (4).pdf"
        },
        {
          "UploadedFileName": "table-export.pdf",
          "RelativeFilePath": "https://ttapi.ipmsbmc.com/uploads/1/t_task/49_8e707fea-9820-4855-98e9-3510e687dacf_table-export.pdf"
        }
      ]
    }
  ];

  // columns: any[] = [];

  ngOnInit(): void {

    this.reUsableTableColumn = [

      { id: 'id', name: 'Id', width: '5%', type: 'integer', align: 'right' },

      {
        id: 'name', name: 'Name', width: '20%',
      },

      // {
      //   id: 'name', name: 'Name', width: '20%', type: 'chip',
      //   chipStyle: {
      //     fontFamily: 'monospace',
      //     fontWeight: '800',
      //     fontSize: '24px',
      //     color: '#0d47a1',
      //     backgroundColor: '#fff3cd'
      //   }
      // },
      {
        id: 'flow', name: 'Flow', width: '10%', type: 'number', align: 'right', digits: '1.2-2',
        // style: {
        //   fontFamily: 'monospace',
        //   fontWeight: '600',
        //   fontSize: '20px',
        //   color: '#0d47a1',
        //   // backgroundColor: '#fff3cd',
        // },
      },
      {
        id: 'col4', name: 'Col4', width: '20%',

      },
      { id: 'col5', name: 'Col5', width: '20%', type: 'multiline', displayField: 'TextToDisplay',
        exportFormatter: (val: any[]) =>
          val?.map(v => v.TextToDisplay).join(', ') || ''
       },
      {
        id: 'col6', name: 'col6', width: '20%', type: 'link', displayField: 'UploadedFileName', linkField: 'RelativeFilePath',
        exportFormatter: (val: any[]) =>
          val?.map(v => v.UploadedFileName).join(', ') || ''
      },

      {
        id: 'actions',
        name: 'Actions',
        width: '5%',
        type: 'actions',
        align: 'center',
        actions: {
          select: { show: true, color: 'primary' },
          edit: { show: true, color: 'accent' },
          delete: { show: true, color: 'warn' }
        }
      }
    ];



    this.reUsableTableConfig = {
      searchTextMode: 'displayed',
      appearance: {
        zebraColor: '#bfd4f1',
        hoverColor: 'e3f2fd',
        selectedRowColor: 'ffe0b2',
      },
      pagination: {
        enabled: true,
        threshold: 50,
        defaultPageSize: 10,
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
      }

    }

  }

  onEdit(row: any) {
    console.log('Editing', row);
  }

  onSelect(row: any) {
    console.log('Selected', row);
  }

  onDelete(row: any) {
    console.log('Delete Clicked', row);
  }

}

