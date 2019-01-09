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
            catchError(err => {
                console.error(err);
                return of(null);
            })
        );
    }

    public getOne(pseudo: String): Observable<any[]> {
        return this.http.get<any[]>(URL + pseudo).pipe(
            catchError(err => {
                console.error(err);
                return of(null);
            })
        );
    }

    public update(r: Rental): Observable<boolean> {
        return this.http.put<Rental>(URL + r._id, r).pipe(
            map(res => true),
            catchError(err => {
                console.error(err);
                return of(false);
            })
        );
    }

    public delete(rental: Rental): Observable<boolean> {
        return this.http.delete<boolean>(URL + rental._id).pipe(
            catchError(err => {
                console.error(err);
                return of(false);
            })
        );
    }

    public add(r: Rental): Observable<Rental> {
        return this.http.post<Rental>(URL, r).pipe(
            map(res => new Rental(res)),
            catchError(err => {
                console.error(err);
                return of(null);
            })
        );
    }

    public getRentalByItem(id: string){
        return this.http.get<Rental>(URL+'member/rental/item/'+id).pipe(
            catchError(err => {
                console.error(err);
                return of(false);
            })
        );
    }
    
    public getCount(pseudo: String){
        return this.http.get<number>(URL + pseudo).pipe(
            catchError(err => {
                console.error(err);
                return of(-1);
            })
        );
    }
   
}
