import { Component, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Inject } from '@angular/core';
import { Rental, RentalService } from '../../services/rental.service';
import { BookService } from '../../services/book.service';
import { FormGroup } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import * as _ from 'lodash';


@Component({
    selector: 'app-rental-rental-mat',
    templateUrl: './edit-rental.component.html',
    styleUrls: ['./edit-rental.component.css']
})
export class EditRentalComponent implements OnInit {
    public frm: FormGroup;
    public ctlreturnDate: FormControl;

    private updateCounter = new Date().getTime();

    constructor(public dialogRef: MatDialogRef<EditRentalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private fb: FormBuilder,  private datePipe: DatePipe,
        private rentalService: RentalService, private bookService: BookService) {
        this.ctlreturnDate = this.fb.control('', []);
        this.frm = this.fb.group({
            _id: null,
            returnDate: this.ctlreturnDate,
        });
        this.frm.patchValue(data);
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    ngOnInit() {
    }


    update() {
        const data = this.frm.value;
        this.rentalService.getRentalByItem(data._id).subscribe(res => {
            const array = res[0].items;
            const val = array.find(i => i._id === data._id); // equivalent a getOne(item)
            const index = res[0].items.indexOf(val);
            if (index > -1) {
                val.returnDate = new Date();
            }
            this.rentalService.update(res[0]).subscribe();
        });
        this.dialogRef.close(data);
    }


    cancel() {
        this.dialogRef.close();
    }
}
