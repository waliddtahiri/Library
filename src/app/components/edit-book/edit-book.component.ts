import { Component, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Inject } from '@angular/core';
import { Book, BookService } from '../../services/book.service';
import { FormGroup } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import * as _ from 'lodash';


@Component({
    selector: 'app-edit-book-mat',
    templateUrl: './edit-book.component.html',
    styleUrls: ['./edit-book.component.css']
})
export class EditBookComponent implements OnInit {
    public frm: FormGroup;
    public ctlIsbn: FormControl;
    public ctlAuthor: FormControl;
    public ctlTitle: FormControl;
    public ctlEditor: FormControl;

    private updateCounter = new Date().getTime();
    private tempPicturePath: string;


    constructor(public dialogRef: MatDialogRef<EditBookComponent>,
        @Inject(MAT_DIALOG_DATA) public data: Book,
        private fb: FormBuilder,
        private bookService: BookService) {
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
                        this.bookService.getOne(isbn).subscribe(book => {
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
    }

    update() {
        const data = this.frm.value;
        if (this.tempPicturePath && !this.tempPicturePath.endsWith(data.isbn)) {
            this.bookService.confirmPicture(data.isbn, this.tempPicturePath).subscribe();
            data.picturePath = 'uploads/' + data.isbn;
        }
        if (data._id === undefined) {
            this.bookService.add(data).subscribe(m => data._id = m._id);
        } else {
            this.bookService.update(data).subscribe();
        }
        this.dialogRef.close(data);
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
            this.bookService.uploadPicture(this.frm.value.isbn || 'empty', file).subscribe(path => {
                this.cancelTempPicture();
                this.tempPicturePath = path;
                this.frm.markAsDirty();
            });
        }
    }

    cancelTempPicture() {
        const data = this.frm.value;
        if (this.tempPicturePath && !this.tempPicturePath.endsWith(data.isbn)) {
            this.bookService.cancelPicture(this.tempPicturePath).subscribe();
        }
    }



}
