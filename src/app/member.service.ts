import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { SecuredHttp } from './securedhttp.service';

export class Member {
    _id: string;
    pseudo: string;
    password: string;
    profile: string;

    constructor(data) {
        this._id = data._id;
        this.pseudo = data.pseudo;
        this.password = data.password;
        this.profile = data.profile;
    }
}

const URL = '/api/members/';

@Injectable()
export class MemberService {
    constructor(private http: SecuredHttp) {
    }

    public getAll(): Observable<Member[]> {
        return this.http.get<Member[]>(URL).pipe(
            // map(res => res),
            catchError(err => {
                console.error(err);
                return [];
            })
        );
    }

    public getOne(pseudo: string): Observable<Member> {
        return this.http.get<Member[]>(URL + pseudo).pipe(
            map(res => res.length > 0 ? res[0] : null),
            catchError(err => {
                console.error(err);
                return of(null);
            })
        );
    }

    public update(m: Member): Observable<boolean> {
        return this.http.put<Member>(URL + m.pseudo, m).pipe(
            map(res => true),
            catchError(err => {
                console.error(err);
                return of(false);
            })
        );
    }

    public delete(m: Member): Observable<boolean> {
        return this.http.delete<boolean>(URL + m.pseudo).pipe(
            catchError(err => {
                console.error(err);
                return of(false);
            })
        );
    }

    public add(m: Member): Observable<Member> {
        return this.http.post<Member>(URL, m).pipe(
            catchError(err => {
                console.error(err);
                return of(null);
            })
        );
    }
}
