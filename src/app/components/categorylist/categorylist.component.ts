import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource, MatDialog, MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import { Category, CategoryService } from '../../services/category.service';
import { Inject } from '@angular/core';
import * as moment from 'moment';
import { EditCategoryComponent } from '../edit-category/edit-category.component';
import * as _ from 'lodash';

@Component({
    selector: 'app-categorylist-mat',
    templateUrl: './categorylist.component.html',
    styleUrls: ['./categorylist.component.css']
})
export class CategoryListComponent implements OnInit {
    displayedColumns: string[] = ['name', 'actions'];
    dataSource: MatTableDataSource<Category>;

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    constructor(private categoryService: CategoryService, public dialog: MatDialog, public snackBar: MatSnackBar) {
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

    private create() {
        const category = new Category({});
        const dlg = this.dialog.open(EditCategoryComponent, { data: category });
        dlg.beforeClose().subscribe(res => {
            if (res) {
                this.dataSource.data = [...this.dataSource.data, res];
            }
        });
    }

}
