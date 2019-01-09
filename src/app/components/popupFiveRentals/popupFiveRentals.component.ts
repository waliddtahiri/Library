import { Component, Input } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'popupFiveRentalsComponent',
  templateUrl: './popupFiveRentals.component.html',
})
export class popupFiveRentalsComponent {
  constructor(public authService: AuthService,
    public dialogRef: MatDialogRef<popupFiveRentalsComponent>) { }

  public popupFiveRentalsMessage: string;
}