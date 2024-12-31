import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-error-alert',
  standalone: true,
  imports: [],
  templateUrl: './error-alert.component.html',
  styleUrl: './error-alert.component.scss'
})
export class ErrorAlertComponent {
  header: string;
  message: string;
  error = false;
  constructor(
    private _mdr: MatDialogRef<ErrorAlertComponent>,
    @Inject(MAT_DIALOG_DATA) data: any
  ) {
    this.header = data.header;
    this.message = data.message;
  }

  CloseDialog() {
    this._mdr.close(true);
  }
}
