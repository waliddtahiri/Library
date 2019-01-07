import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource, MatDialog, MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import { Category, CategoryService } from '../../services/category.service';
import { Inject } from '@angular/core';
import * as moment from 'moment';
import { EditCategoryComponent } from '../edit-category/edit-category.component';
import * as _ from 'lodash';
import { FormGroup } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';

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
        public data: Category,
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
        const dlg = this.dialog.open(EditCategoryComponent, { data: category });
        dlg.beforeClose().subscribe(res => {
            if (res) {
                _.assign(category, res);
            }
        });
    }

    private delete(category: Category) {
        const backup = this.dataSource.data;
        this.dataSource.data = _.filter(this.dataSource.data, c => c._id !== category._id);
        const snackBarRef = this.snackBar.open(`Category  '${category.name}'  will be deleted`, 'Undo', { duration: 10000 });
        snackBarRef.afterDismissed().subscribe(res => {
            if (!res.dismissedByAction) {
                this.categoryService.delete(category).subscribe();
            } else {
                this.dataSource.data = backup;
            }
        });
    }

    private add(string: string) {
        const category = new Category({});
        category.name = string;
        this.categoryService.add(category).subscribe(m => category._id = category._id);
    }

}
