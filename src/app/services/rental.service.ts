import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { SecuredHttp } from './securedhttp.service';
import {Member} from 'src/app/services/member.service';
import {Book} from 'src/app/services/book.service';

export class Rental {
    _id: string;
    orderDate: string;
    member: Member;
    items: { book: Book, returnDate: string }[];

    constructor(data) {
        this._id = data._id;
        this.orderDate = data.orderDate;
        this.member = data.member;
        this.items = data.items;
    }
}

const URL = '/api/rentals/';

@Injectable()
export class RentalService {
    constructor(private http: SecuredHttp) {
    }

    public getAll(): Observable<Rental[]> {
        return this.http.get<Rental[]>(URL).pipe(
            map(res => res.map(r => new Rental(r))),
            catchError(err => {
                console.error(err);
                return [];
            })
        );
    }

    public getOne(s: String): Observable<Rental[]> {
        return this.http.get<Rental[]>(URL + s).pipe(
            map(res => res.length > 0 ? new Rental(res[0]) : null),
            catchError(err => {
                console.error(err);
                return of(null);
            })
        );
    }

    public update(r: Rental): Observable<boolean> {
        return this.http.put<Rental>(URL + r.orderDate, r).pipe(
            map(res => true),
            catchError(err => {
                console.error(err);
                return of(false);
            })
        );
    }

    public delete(r: Rental): Observable<boolean> {
        return this.http.delete<boolean>(URL + r.orderDate).pipe(
            catchError(err => {
                console.error(err);
                return of(false);
            })
        );
    }

    public add(r: Rental): Observable<Rental> {
        console.log('ddd');
        return this.http.post<Rental>(URL, r).pipe(
            map(res => new Rental(res)),
            catchError(err => {
                console.error(err);
                return of(null);
            })
        );
    }
}
