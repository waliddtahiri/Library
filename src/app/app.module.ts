import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { JwtModule } from '@auth0/angular-jwt';
import {
    MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule,
    MatTableModule, MatPaginatorModule, MatSortModule, MatIconModule,
    MatSlideToggleModule, MatDialogModule, MatSnackBarModule
} from '@angular/material';
import { AppComponent } from './app.component';
import { MemberService } from './services/member.service';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { UnknownComponent } from './components/unknown/unknown.component';
import { SecuredHttp } from './services/securedhttp.service';
import { AuthGuard, AdminGuard } from './services/auth-guard.service';
import { AuthService } from './services/auth.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RestrictedComponent } from './components/restricted/restricted.component';
import { LogoutComponent } from './components/logout/logout.component';
import { EditMemberComponent } from './components/edit-member/edit-member.component';
import { SetFocusDirective } from './directives/setfocus.directive';
import { MemberCommonService } from './services/member-common.service';
import { MemberListComponent } from './components/memberlist/memberlist.component';

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
        EditMemberComponent,
        SetFocusDirective,
    ],
    entryComponents: [EditMemberComponent],
    imports: [
        HttpClientModule,
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule,
        MatTableModule, MatPaginatorModule, MatSortModule, MatIconModule,
        MatSlideToggleModule, MatDialogModule, MatSnackBarModule,
        RouterModule.forRoot([
            { path: '', redirectTo: 'home', pathMatch: 'full' },
            { path: 'login', component: LoginComponent },
            {
                path: '',
                canActivate: [AuthGuard],
                children: [
                    { path: 'logout', component: LogoutComponent },
                    { path: 'home', component: HomeComponent },
                    {
                        path: '',
                        canActivate: [AdminGuard],
                        children: [
                            { path: 'members', component: MemberListComponent },
                        ]
                    },
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
        AdminGuard,
        AuthService,
        MemberService,
        MemberCommonService,
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
