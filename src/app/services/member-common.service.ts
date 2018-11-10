import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Http, RequestOptions } from '@angular/http';
import { SecuredHttp } from './securedhttp.service';
import { Member } from './member.service';

const URL = '/api/members-common/';

@Injectable()
export class MemberCommonService {
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

    public getOne(pseudo: string): Observable<Member> {
        return this.http.get<Member[]>(URL + pseudo).pipe(
            map(res => res.length > 0 ? new Member(res[0]) : null),
            catchError(err => {
                console.error(err);
                return of(null);
            })
        );
    }
}
