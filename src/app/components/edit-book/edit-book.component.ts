import { Component, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Inject } from '@angular/core';
import { Book, BookService } from '../../services/book.service';
import { FormGroup } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { Category, CategoryService } from '../../services/category.service';
import * as _ from 'lodash';
import { ChangeDetectionStrategy } from '@angular/core';
import { Member } from '../../services/member.service';
import { BookCommonService } from '../../services/book-common.service';
import { AuthService } from '../../services/auth.service';
import { MemberCommonService } from '../../services/member-common.service';


@Component({
    selector: 'app-edit-book-mat',
    templateUrl: './edit-book.component.html',
    styleUrls: ['./edit-book.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditBookComponent implements OnInit {
    public frm: FormGroup;
    public ctlIsbn: FormControl;
    public ctlAuthor: FormControl;
    public ctlTitle: FormControl;
    public ctlEditor: FormControl;
    public categories;
    public current: Member;
    categoriesSource: Category[] = [];
    categoriesBook: Category[] = [];
    selectionTableft: Category[];
    selectionTabright: Category[];


    private updateCounter = new Date().getTime();
    private tempPicturePath: string;


    constructor(public dialogRef: MatDialogRef<EditBookComponent>,
        @Inject(MAT_DIALOG_DATA) public data: Book,
        private fb: FormBuilder, public authService: AuthService,
        public memberService: MemberCommonService,
        public categoryService: CategoryService,
        private bookService: BookService,
        private bookCommonService: BookCommonService) {
        this.ctlIsbn = this.fb.control('', [Validators.required,
        this.forbiddenValue('abc')], [this.isbnUsed()]);
        this.ctlAuthor = this.fb.control('', [Validators.required]);
        this.ctlTitle = this.fb.control('', [Validators.required]);
        this.ctlEditor = this.fb.control('', [Validators.required]);
        this.frm = this.fb.group({
            _id: null,
            isbn: this.ctlIsbn,
            author: this.ctlAuthor,
            title: this.ctlTitle,
            editor: this.ctlEditor,
        });

        this.frm.patchValue(data);
        this.tempPicturePath = data.picturePath;

        this.memberService.getOne(authService.currentUser).subscribe(m => {
            this.current = m;
        });
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
    isbnUsed(): any {
        let timeout;
        return (ctl: FormControl) => {
            clearTimeout(timeout);
            const isbn = ctl.value;
            return new Promise(resolve => {
                timeout = setTimeout(() => {
                    if (ctl.pristine) {
                        resolve(null);
                    } else {
                        this.bookCommonService.getOne(isbn).subscribe(book => {
                            resolve(book ? { isbnUsed: true } : null);
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
        this.initTab();
    }

    update() {
        const data = this.frm.value;
        if(data._id !== undefined){
        data.categories = this.categoriesBook;
        }

        if (this.tempPicturePath && !this.tempPicturePath.endsWith(data.isbn)) {
            this.bookCommonService.confirmPicture(data.isbn, this.tempPicturePath).subscribe();
            data.picturePath = 'uploads/' + data.isbn;
        }
        if (data._id === undefined) {
            this.bookService.add(data).subscribe(m => data._id = m._id);
        } else {
            this.bookService.update(data).subscribe();
        }
        this.dialogRef.close();
    }

    cancel() {
        this.cancelTempPicture();
        this.dialogRef.close();
    }

    get picturePath(): string {
        // Le compteur updateCounter sert à générer un URL différent quand on change d'image
        // car sinon l'image ne se rafraîchit pas parce que l'url ne change pas.
        return this.tempPicturePath && this.tempPicturePath !== '' ?
            (this.tempPicturePath + '?' + this.updateCounter) : 'uploads/cover.png';
    }

    fileChange(event) {
        const fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            const file = fileList[0];
            this.bookCommonService.uploadPicture(this.frm.value.isbn || 'empty', file).subscribe(path => {
                this.cancelTempPicture();
                this.tempPicturePath = path;
                this.frm.markAsDirty();
            });
        }
    }

    cancelTempPicture() {
        const data = this.frm.value;
        if (this.tempPicturePath && !this.tempPicturePath.endsWith(data.isbn)) {
            this.bookCommonService.cancelPicture(this.tempPicturePath).subscribe();
        }
    }


    isCatSelected(val: any) {
        if (val > 0) {
            return 'false';
        } else {
            return 'true';
        }

    }

    onSelectionleft(e, v) {
        this.selectionTableft = [];

        v.forEach(c => {
            this.selectionTableft.push(c.value);
        });

        console.log(v.length);
    }

    onSelectionright(e, v) {
        this.selectionTabright = [];

        v.forEach(c => {
            this.selectionTabright.push(c.value);
        });

        console.log(v.length);
    }

    addToBook() {
        this.selectionTableft.forEach(c => {
            c.books.push(this.data);
            this.categoriesBook.push(c);
            const index = this.categoriesSource.indexOf(c);
            this.categoriesSource.splice(index, 1);
        });
        this.selectionTableft = [];
        this.frm.markAsDirty();
    }

    removeFromBook() {
        this.selectionTabright.forEach(c => {
            this.categoriesSource.push(c);
            const index = this.categoriesBook.indexOf(c);
            this.categoriesBook.splice(index, 1);
            const index2 = c.books.indexOf(this.data);
            c.books.splice(index2, 1);
        });
        this.selectionTabright = [];
        this.frm.markAsDirty();
    }



    initTab() {
        // on initialise les tableaux categories
        if (this.data._id !== undefined) {
            this.categoryService.getAll().subscribe(cat => {
                cat.forEach(c => {
                    this.data.categories.forEach(c2 => {
                        if (c._id === c2.toString()) {
                            this.categoriesBook.push(c);
                        }
                    });
                    if (!this.categoriesBook.includes(c)) {
                        this.categoriesSource.push(c);
                    }
                });
            });
        }
    }
}

