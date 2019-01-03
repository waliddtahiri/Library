import { Component, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Inject } from '@angular/core';
import { Rental, RentalService } from '../../services/rental.service';
import { FormGroup } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import * as _ from 'lodash';


@Component({
    selector: 'app-rental-rental-mat',
    templateUrl: './edit-rental.component.html',
    styleUrls: ['./edit-rental.component.css']
})
export class EditRentalComponent implements OnInit {
    public frm: FormGroup;
    public ctlName: FormControl;

    private updateCounter = new Date().getTime();

    constructor(public dialogRef: MatDialogRef<EditRentalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: Rental,
        private fb: FormBuilder,
        private rentalService: RentalService) {
        this.ctlName = this.fb.control('', [Validators.required,
        this.forbiddenValue('abc')], [this.nameUsed()]);
        this.frm = this.fb.group({
            _id: null,
            name: this.ctlName,
        });

        this.frm.patchValue(data);
    }

    // Validateur bidon qui vérifie que la valeur est différente
    forbiddenValue(val: string): any {
        return (ctl: FormControl) => {
            if (ctl.value === val) {
                return { forbiddenValue: { currentValue: ctl.value, forbiddenValue: val } };
            }
            return null;
        };
    }

    // Validateur asynchrone qui vérifie si le pseudo n'est pas déjà utilisé par un autre membre
    nameUsed(): any {
        let timeout;
        return (ctl: FormControl) => {
            clearTimeout(timeout);
            const name = ctl.value;
            return new Promise(resolve => {
                timeout = setTimeout(() => {
                    if (ctl.pristine) {
                        resolve(null);
                    } else {
                        this.rentalService.getOne(name).subscribe(rental => {
                            resolve(rental ? { nameUsed: true } : null);
                        });
                    }
                }, 300);
            });
        };
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    ngOnInit() {
    }

    update() {
        const data = this.frm.value;
        if (data._id === undefined) {
            this.rentalService.add(data).subscribe(m => data._id = m._id);
        } else {
            this.rentalService.update(data).subscribe();
        }
        this.dialogRef.close(data);
    }

    cancel() {
        this.dialogRef.close();
    }
}
