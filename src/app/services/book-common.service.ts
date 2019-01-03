import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Http, RequestOptions } from '@angular/http';
import { SecuredHttp } from './securedhttp.service';
import { Book } from './book.service';

const URL = '/api/books-common/';

@Injectable()
export class BookCommonService {
    constructor(private http: SecuredHttp) {
    }

    public getCount(): Observable<number> {
        return this.http.get<number>(URL + 'count').pipe(
            catchError(err => {
                console.error(err);
                return of(-1);
            })
        );
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
