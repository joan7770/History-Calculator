import { Component, OnInit, Input } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-mat-table',
  templateUrl: './mat-table.component.html',
  styleUrls: ['./mat-table.component.scss']
})
export class MatTableComponent implements OnInit {
  tableDataSrc: any;
  @Input('tableColumns') tableCols: string[];
  @Input() tableData: {}[];

  constructor() {

  }

  ngOnInit(): void {
    this.tableDataSrc = new MatTableDataSource(this.tableData);
  }
}
