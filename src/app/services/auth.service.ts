import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { SecuredHttp } from './securedhttp.service';

const URL = '/api/members-common/';

@Injectable()
export class AuthService {
    isLoggedIn: Boolean = false;

    // store the URL so we can redirect after logging in
    redirectUrl: string;

    constructor(private secHttp: SecuredHttp, private http: HttpClient) {
        this.isLoggedIn = sessionStorage.getItem('id_token') != null;
    }

    login(username, password): Observable<boolean> {
        return this.secHttp.login(username, password).pipe(
            map(res => {
                this.isLoggedIn = res;
                return res;
            })
        );
    }

    logout(): void {
        this.isLoggedIn = false;
        this.secHttp.logout();
    }

    public get currentUser(): string {
        return sessionStorage.getItem('pseudo');
    }

    public get isAdmin(): boolean {
        return sessionStorage.getItem('admin') === 'true';
    }

 

    public isPseudoAvailable(pseudo: string): Observable<boolean> {
        return this.http.get<any>(URL + pseudo).pipe(
            map(res =>{
                console.log(res)
                return    res.length > 0 ? res[0] : null}),
            catchError(err => {
                console.error(err);
                return (null);
            })
        );
    }

     public signup(pseudo: string, password: string): Observable<boolean> {    
         return this.http.post<any>(URL + 'create',
             { pseudo: pseudo, password: password })
             .pipe(
                 map(data => {
                     console.log(data.success);
                     if (data.success) {
                         console.log('rentre dans data.success');
                         const token = data.token;
                         sessionStorage.setItem('pseudo', pseudo);
                         sessionStorage.setItem('password', password);
                         sessionStorage.setItem('id_token', token);
                         this.isLoggedIn = true;
                         return true;
                     } else {
                        return false;
                     }

                 }),
             );

     }
}