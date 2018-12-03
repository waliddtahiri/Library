import { Component, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Inject } from '@angular/core';
import { Category, CategoryService } from '../../services/category.service';
import { FormGroup } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import * as _ from 'lodash';


@Component({
    selector: 'app-edit-category-mat',
    templateUrl: './edit-category.component.html',
    styleUrls: ['./edit-category.component.css']
})
export class EditCategoryComponent implements OnInit {
    public frm: FormGroup;
    public ctlName: FormControl;

    private updateCounter = new Date().getTime();

    constructor(public dialogRef: MatDialogRef<EditCategoryComponent>,
        @Inject(MAT_DIALOG_DATA) public data: Category,
        private fb: FormBuilder,
        private categoryService: CategoryService) {
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
                        this.categoryService.getOne(name).subscribe(category => {
                            resolve(category ? { nameUsed: true } : null);
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
            this.categoryService.add(data).subscribe(m => data._id = m._id);
        } else {
            this.categoryService.update(data).subscribe();
        }
        this.dialogRef.close(data);
    }

    cancel() {
        this.dialogRef.close();
    }
}
