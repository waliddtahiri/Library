import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource, MatDialog, MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import { Book, BookService } from '../../services/book.service';
import { MemberCommonService } from '../../services/member-common.service';
import { Member } from '../../services/member.service';
import { Category, CategoryService } from '../../services/category.service';
import { Inject } from '@angular/core';
import * as moment from 'moment';
import { EditBookComponent } from '../edit-book/edit-book.component';
import * as _ from 'lodash';
import { AuthService } from '../../services/auth.service';
import { Rental, RentalService } from '../../services/rental.service';
import { FormBuilder } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { popupFiveRentalsComponent } from '../popupFiveRentals/popupFiveRentals.component';


@Component({
    selector: 'app-booklist-mat',
    templateUrl: './booklist.component.html',
    styleUrls: ['./booklist.component.css']
})
export class BookListComponent implements OnInit {
    displayedColumns: string[] = ['isbn', 'author', 'title', 'editor', 'actions'];
    dataSource: MatTableDataSource<Book>;
    selectedMember: Member;
    selectedCategory: Category;
    basketSource: Book[];
    membersSource: Member[] = [];
    categoriesSource: Category[] = [];
    current: Member;
    dataRentals: MatTableDataSource<Rental>;
    public rentalCount: any[] = [];
    public rentalCountAdmin: any[] = [];

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;



    constructor(private bookService: BookService, public rentalService: RentalService,
        public memberService: MemberCommonService,
        public categoryService: CategoryService,
        private datePipe: DatePipe,
        public authService: AuthService, private fb: FormBuilder,
        public dialog: MatDialog, public snackBar: MatSnackBar) {
        this.memberService.getAll().subscribe(members => {
            members.forEach(m => {
                if (m.admin === false) {
                    this.membersSource.push(m);
                }
            });
        });
        this.memberService.getOne(authService.currentUser).subscribe(m => {
            this.current = m;
            console.log(this.current);
        });
        this.categoryService.getAll().subscribe(categories => {
            categories.forEach(c => {
                this.categoriesSource.push(c);
            });
        });
        this.rentalService.getOne(authService.currentUser).subscribe(rentals => {
            rentals.forEach(r => {
                if (r.returnDate == null) {
                    this.rentalCount.push(r);
                }
            });
        });
    }

    ngOnInit() {
        this.refresh();
    }

    formatDate() {
        const date = this.datePipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss');
        return date;
    }

    refresh() {
        this.bookService.getAll().subscribe(books => {
            this.dataSource = new MatTableDataSource(books);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
        });
    }

    filterValueBook: any;

    applyFilter(filterValue: string) {
        this.dataSource.filter = filterValue.trim().toLowerCase();
        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    applyFilterCategory() {
        console.log(this.selectedCategory);
        if (this.selectedCategory === undefined) {
            this.dataSource.filter = '';
        } else {
            this.dataSource.filter = this.selectedCategory._id;
        }
    }

    isEmpty(b: Book[] = []): Boolean {
        return b.length === 0;
    }

    isMemberSelected(m: Member): Boolean {
        return m === undefined;
    }

    private add_basket(book: Book) {
        this.dataSource.data = _.filter(this.dataSource.data, b => b._id !== book._id);
        this.basketSource = _.filter(this.basketSource);
        this.basketSource.push(book);
        this.bookService.delete(book);
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
        this.rentalService.getOne(this.authService.currentUser).subscribe(rentals => {
            rentals.forEach(r => {
                if (r.returnDate == null) {
                    this.rentalCount.push(r);
                }
            });
        });
        if (this.basketSource.length > 0) {
            const rental = new Rental({ member: this.current, orderDate: new Date() });
            books.forEach(b => items.push({ book: b, returnDate: null }));
            rental.items = items;
            if (this.rentalCount.length + this.basketSource.length <= 5) {
                this.rentalService.add(rental).subscribe(res => {
                    if (this.current.rentals.length === 0) {
                        this.current.rentals = rentals;
                    }
                    this.current.rentals.push(res);
                    this.memberService.update(this.current).subscribe();
                });
                this.clear_basket();
            }
            else {
                const dlg = this.dialog.open(popupFiveRentalsComponent);
                dlg.beforeClose().subscribe(res => {
                    this.clear_basket();
                });
            }
        }
    }

    private confirm_basket_admin() {
        const books = this.basketSource;
        const items = [];
        const rentals = [];
        if (this.basketSource.length > 0) {
            const rental = new Rental({ member: this.selectedMember, orderDate: this.formatDate() });
            books.forEach(b => items.push({ book: b, returnDate: null }));
            rental.items = items;
            console.log(this.rentalCountAdmin.length);
            if (this.rentalCountAdmin.length + this.basketSource.length <= 5) {
            this.rentalService.add(rental).subscribe(res => {
                if (this.selectedMember.rentals.length === 0) {
                    this.selectedMember.rentals = rentals;
                }
                this.selectedMember.rentals.push(res);
                this.memberService.update(this.selectedMember).subscribe();
            });
            this.clear_basket();
        }
        else {
            const dlg = this.dialog.open(popupFiveRentalsComponent);
            dlg.beforeClose().subscribe(res => {
                this.clear_basket();
            });
            this.rentalCountAdmin.splice(this.rentalCountAdmin.length);
        }
        }
    }

    private clear_basket() {
        this.refresh();
        this.basketSource = _.filter(this.basketSource.splice(this.basketSource.length));
        this.rentalCountAdmin = [];
        this.rentalService.getOne(this.selectedMember.pseudo).subscribe(rentals => {
            rentals.forEach(r => {
                if (r.returnDate == null) {
                    this.rentalCountAdmin.push(r);
                    console.log(this.rentalCountAdmin.length);
                }
            });
        });
    }


    private edit(book: Book) {
        const dlg = this.dialog.open(EditBookComponent, { data: book });
        dlg.beforeClose().subscribe(res => {
            if (res) {
                _.assign(book, res);
                console.log(res);
            }
            this.refresh();
        });
    }

    private visualize(book: Book) {
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
        const snackBarRef = this.snackBar.open(`Book  ' ${ book.title } '  will be deleted`, 'Undo', { duration: 1000 });
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
            console.log(res);
            if (res) {
                this.dataSource.data = [...this.dataSource.data, res];
            }
            this.refresh();
        });
    }

    onMemberSelected(val: any) {
        this.selectedMember = val;
        this.rentalCountAdmin= [];
        console.log(this.rentalCountAdmin.length);
        this.rentalService.getOne(this.selectedMember.pseudo).subscribe(rentals => {
            rentals.forEach(r => {
                if (r.returnDate == null) {
                    this.rentalCountAdmin.push(r);
                    console.log(this.rentalCountAdmin.length);
                }
            });
        });
    }

    onCategorySelected(val: any) {
        this.selectedCategory = val;
    }

}
