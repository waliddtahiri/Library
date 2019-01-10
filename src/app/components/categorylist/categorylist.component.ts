import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource, MatDialog, MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import { Category, CategoryService } from '../../services/category.service';
import { Inject } from '@angular/core';
import * as moment from 'moment';
import * as _ from 'lodash';
import { FormGroup } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { popCategoryDeleteComponent } from '../popCategoryDelete/popCategoryDelete.component';

@Component({
    selector: 'app-categorylist-mat',
    templateUrl: './categorylist.component.html',
    styleUrls: ['./categorylist.component.css']
})
export class CategoryListComponent implements OnInit {
    displayedColumns: string[] = ['name', 'actions'];
    dataSource: MatTableDataSource<Category>;
    catName: string;
    public frm: FormGroup;
    public ctlName: FormControl;


    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    constructor(private categoryService: CategoryService, private fb: FormBuilder,
        public dialog: MatDialog, public snackBar: MatSnackBar) {
        this.ctlName = this.fb.control('', [Validators.required,
        this.forbiddenValue('123')], [this.nameUsed()]);
        this.frm = this.fb.group({
            _id: null,
            name: this.ctlName,
        });
    }

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

    ngOnInit() {
        this.refresh();
    }

    refresh() {
        this.categoryService.getAll().subscribe(categories => {
            this.dataSource = new MatTableDataSource(categories);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
        });
    }

    applyFilter(filterValue: string) {
        this.dataSource.filter = filterValue.trim().toLowerCase();
        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    private edit(category: Category) {
        this.frm.patchValue(category);
    }

    private delete(category: Category) {
        const dlg = this.dialog.open(popCategoryDeleteComponent, { data: category });
        dlg.beforeClose().subscribe(() => {
            this.refresh();
        });
    }


    update() {
        const data = this.frm.value;
        if (data._id === undefined || data._id === null) {
            this.categoryService.add(data).subscribe(m => data._id = m._id);
        } else {
            this.categoryService.update(data).subscribe();
        }
        this.frm.reset();
        this.refresh();
    }

}
