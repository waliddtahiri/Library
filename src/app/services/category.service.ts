import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { SecuredHttp } from './securedhttp.service';
import {Book} from 'src/app/services/book.service';

export class Category {
    _id: string;
    name: string;
    books: Book[];

    constructor(data) {
        this._id = data._id;
        this.name = data.name;
        this.books = data.books;
    }
}

const URL = '/api/categories/';

@Injectable()
export class CategoryService {
    constructor(private http: SecuredHttp) {
    }

    public getAll(): Observable<Category[]> {
        return this.http.get<Category[]>(URL).pipe(
            map(res => res.map(b => new Category(b))),
            catchError(err => {
                console.error(err);
                return [];
            })
        );
    }

    public getOne(name: string): Observable<Category> {
        return this.http.get<Category[]>(URL + name).pipe(
            map(res => res.length > 0 ? new Category(res[0]) : null),
            catchError(err => {
                console.error(err);
                return of(null);
            })
        );
    }

    public update(c: Category): Observable<boolean> {
        return this.http.put<Category>(URL + c.name, c).pipe(
            map(res => true),
            catchError(err => {
                console.error(err);
                return of(false);
            })
        );
    }

    public delete(c: Category): Observable<boolean> {
        return this.http.delete<boolean>(URL + c.name).pipe(
            catchError(err => {
                console.error(err);
                return of(false);
            })
        );
    }

    public add(c: Category): Observable<Category> {
        return this.http.post<Category>(URL, c).pipe(
            map(res => new Category(res)),
            catchError(err => {
                console.error(err);
                return of(null);
            })
        );
    }
}
