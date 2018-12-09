import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource, MatDialog, MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import { Book, BookService} from '../../services/book.service';
import { Inject } from '@angular/core';
import * as moment from 'moment';
import { EditBookComponent } from '../edit-book/edit-book.component';
import * as _ from 'lodash';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-booklist-mat',
    templateUrl: './booklist.component.html',
    styleUrls: ['./booklist.component.css']
})
export class BookListComponent implements OnInit {
    displayedColumns: string[] = ['isbn', 'author', 'title', 'editor', 'actions'];
    dataSource: MatTableDataSource<Book>;
    basketSource: Book[];

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    constructor(private bookService: BookService, public authService: AuthService,
         public dialog: MatDialog, public snackBar: MatSnackBar) {
    }

    ngOnInit() {
        this.refresh();
    }

    refresh() {
        this.bookService.getAll().subscribe(books => {
            this.dataSource = new MatTableDataSource(books);
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

    private add_basket(book: Book) {
        this.dataSource.data = _.filter(this.dataSource.data, b => b._id !== book._id);
        this.basketSource = _.filter(this.basketSource);
        this.basketSource.push(book);
        this.bookService.delete(book);
    }

    private delete_basket(book: Book) {
        this.dataSource.data = _.filter(this.basketSource, b => b._id === book._id);
        this.basketSource = _.filter(this.basketSource);
        this.dataSource.data.push(book);
        this.dataSource.data = _.filter(this.dataSource.data);
    }

    private confirm_basket() {
        this.clear_basket();
    }

    private clear_basket() {
        this.ngOnInit();
        this.basketSource =  _.filter(this.basketSource.splice(this.basketSource.length));
    }


    private edit(book: Book) {
        const dlg = this.dialog.open(EditBookComponent, { data: book });
        dlg.beforeClose().subscribe(res => {
            if (res) {
                _.assign(book, res);
            }
        });
    }

    private delete(book: Book) {
        const backup = this.dataSource.data;
        this.dataSource.data = _.filter(this.dataSource.data, b => b._id !== book._id);
        const snackBarRef = this.snackBar.open(`Book  '${book.title}'  will be deleted`, 'Undo', { duration: 10000 });
        snackBarRef.afterDismissed().subscribe(res => {
            if (!res.dismissedByAction) {
                this.bookService.delete(book).subscribe();
            } else {
                this.dataSource.data = backup;
            }
        });
    }

    private create() {
        const book = new Book({});
        const dlg = this.dialog.open(EditBookComponent, { data: book });
        dlg.beforeClose().subscribe(res => {
            if (res) {
                this.dataSource.data = [...this.dataSource.data, res];
            }
        });
    }

}
