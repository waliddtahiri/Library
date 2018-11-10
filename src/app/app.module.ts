import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { JwtModule } from '@auth0/angular-jwt';
import {
    MatButtonModule, MatFormFieldModule, MatInputModule
} from '@angular/material';
import { AppComponent } from './app.component';
import { MemberService } from './member.service';
import { MemberListComponent } from './memberlist.component';
import { LoginComponent } from './login.component';
import { HomeComponent } from './home.component';
import { UnknownComponent } from './unknown.component';
import { SecuredHttp } from './securedhttp.service';
import { AuthGuard } from './auth-guard.service';
import { AuthService } from './auth.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RestrictedComponent } from './restricted.component';
import { LogoutComponent } from './logout.component';
import { SetFocusDirective } from './setfocus.directive';

export function tokenGetter() {
    return sessionStorage.getItem('id_token');
}


@NgModule({
    declarations: [
        AppComponent,
        MemberListComponent,
        LoginComponent,
        LogoutComponent,
        HomeComponent,
        UnknownComponent,
        RestrictedComponent,
        SetFocusDirective,
    ],
    imports: [
        HttpClientModule,
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule, MatFormFieldModule, MatInputModule,
        RouterModule.forRoot([
            { path: '', redirectTo: 'home', pathMatch: 'full' },
            { path: 'login', component: LoginComponent },
            {
                path: '',
                canActivate: [AuthGuard],
                children: [
                    { path: 'logout', component: LogoutComponent },
                    { path: 'home', component: HomeComponent },
                    { path: 'members', component: MemberListComponent },
                ]
            },
            { path: 'restricted', component: RestrictedComponent },
            { path: '**', component: UnknownComponent }
        ]),
        JwtModule.forRoot({
            config: {
                tokenGetter: tokenGetter
            }
        })
    ],
    providers: [
        SecuredHttp,
        AuthGuard,
        AuthService,
        MemberService
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
