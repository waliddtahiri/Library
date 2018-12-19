import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { SecuredHttp } from './securedhttp.service';
import {Category} from 'src/app/services/category.service';


export class Book {
    _id: string;
    isbn: string;
    author: string;
    title: string;
    editor: string;
    picturePath: string;
    categories: Category[];

    constructor(data) {
        this._id = data._id;
        this.isbn = data.isbn;
        this.author = data.author;
        this.title = data.title;
        this.editor = data.editor;
        this.picturePath = data.picturePath;
        this.categories = data.categories;
    }

    public addCategories(...args: Category[]): void {
        for (const b of args) {
            if (!this.categories.includes(b)) {
                this.categories.push(b);
            }
            if (!b.books.includes(this)) {
                b.books.push(this);
            }
        }
    }
}

const URL = '/api/books/';

@Injectable()
export class BookService {
    constructor(private http: SecuredHttp) {
    }

    public getAll(): Observable<Book[]> {
        return this.http.get<Book[]>(URL).pipe(
            map(res => res.map(b => new Book(b))),
            catchError(err => {
                console.error(err);
                return [];
            })
        );
    }

    public getOne(isbn: string): Observable<Book> {
        return this.http.get<Book[]>(URL + isbn).pipe(
            map(res => res.length > 0 ? new Book(res[0]) : null),
            catchError(err => {
                console.error(err);
                return of(null);
            })
        );
    }

    public update(b: Book): Observable<boolean> {
        return this.http.put<Book>(URL + b.isbn, b).pipe(
            map(res => true),
            catchError(err => {
                console.error(err);
                return of(false);
            })
        );
    }

    public delete(b: Book): Observable<boolean> {
        return this.http.delete<boolean>(URL + b.isbn).pipe(
            catchError(err => {
                console.error(err);
                return of(false);
            })
        );
    }

    public add(b: Book): Observable<Book> {
        return this.http.post<Book>(URL, b).pipe(
            map(res => new Book(res)),
            catchError(err => {
                console.error(err);
                return of(null);
            })
        );
    }


    public update_picture_path(isbn: string, path: string): Observable<boolean> {
        return this.http.put<Book>(URL, { picturePath: path }).pipe(
            map(res => true),
            catchError(err => {
                console.error(err);
                return of(false);
            })
        );
    }

    public uploadPicture(isbn, file): Observable<string> {
        const formData = new FormData();
        formData.append('isbn', isbn);
        formData.append('picture', file);
        return this.http.post<string>(URL + 'upload', formData).pipe(
            catchError(err => {
                console.error(err);
                return of(null);
            })
        );
    }

    public confirmPicture(isbn, path): Observable<string> {
        console.log(isbn, path);
        return this.http.post<string>(URL + 'confirm', { isbn: isbn, picturePath: path }).pipe(
            catchError(err => {
                console.error(err);
                return of(null);
            })
        );
    }

    public cancelPicture(path): Observable<string> {
        return this.http.post<string>(URL + 'cancel', { picturePath: path }).pipe(
            catchError(err => {
                console.error(err);
                return of(null);
            })
        );
    }

}
