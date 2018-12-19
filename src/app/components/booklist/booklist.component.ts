import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource, MatDialog, MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import { Book, BookService} from '../../services/book.service';
import { MemberCommonService} from '../../services/member-common.service';
import { Member } from '../../services/member.service';
import { Inject } from '@angular/core';
import * as moment from 'moment';
import { EditBookComponent } from '../edit-book/edit-book.component';
import * as _ from 'lodash';
import { AuthService } from '../../services/auth.service';
import {Rental, RentalService} from '../../services/rental.service';
import { FormBuilder } from '@angular/forms';


@Component({
    selector: 'app-booklist-mat',
    templateUrl: './booklist.component.html',
    styleUrls: ['./booklist.component.css']
})
export class BookListComponent implements OnInit {
    displayedColumns: string[] = ['isbn', 'author', 'title', 'editor', 'actions'];
    dataSource: MatTableDataSource<Book>;
    selectedMember: Member;
    basketSource: Book[];
    membersSource: Member[] = [];
    public current: Member;

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    constructor(private bookService: BookService, public rentalService: RentalService,
         public memberService: MemberCommonService,
         public authService: AuthService, private fb: FormBuilder,
         public dialog: MatDialog, public snackBar: MatSnackBar) {
         this.memberService.getAll().subscribe(members => {
              members.forEach(m => {
                if (m.admin === false) {
                this.membersSource.push(m);
                }
              });
         });
         this.memberService.getOne(authService.currentUser).subscribe(m => this.current = m);
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

    isEmpty(b: Book[] = []): Boolean {
        return b.length === 0;
    }

    isMemberSelected (m: Member): Boolean {
        return m === undefined;
    }

    private add_basket(book: Book) {
        this.dataSource.data = _.filter(this.dataSource.data, b => b._id !== book._id);
        this.basketSource = _.filter(this.basketSource);
        this.basketSource.push(book);
        this.bookService.delete(book);
        console.log(this.basketSource.length);
    }

    private delete_basket(book: Book) {
        this.basketSource = _.filter(this.basketSource, b => b._id !== book._id);
        this.dataSource.data.push(book);
        this.dataSource.data = _.filter(this.dataSource.data);
    }

    private confirm_basket() {
        const books = this.basketSource;
        const items = [];
        const rentals = [];
        if (this.basketSource.length > 0) {
        const rental = new Rental({ member: this.current, orderDate: new Date().toLocaleString()});
        books.forEach(b => items.push({ book: b, returnDate: null }));
        rental.items = items;
        this.rentalService.add(rental).subscribe(res => {
            if (this.current.rentals.length === 0) {
                this.current.rentals = rentals;
            }
            this.current.rentals.push(res);
            this.memberService.update(this.current).subscribe();
        });
        this.clear_basket();
        }
    }

    private confirm_basket_admin() {
        const books = this.basketSource;
        const items = [];
        const rentals = [];
        if (this.basketSource.length > 0) {
        const rental = new Rental({ member: this.selectedMember, orderDate: new Date().toLocaleString()});
        books.forEach(b => items.push({ book: b, returnDate: null }));
        rental.items = items;
        this.rentalService.add(rental).subscribe(res => {
            if (this.current.rentals.length === 0) {
                this.current.rentals = rentals;
            }
            this.selectedMember.rentals.push(res);
            this.memberService.update(this.selectedMember).subscribe();
        });
        this.clear_basket();
        }
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

    onMemberSelected (val: any) {
          this.selectedMember = val;
    }

}
