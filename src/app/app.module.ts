import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { JwtModule } from '@auth0/angular-jwt';
import {
    MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule,
    MatTableModule, MatPaginatorModule, MatSortModule, MatIconModule,
    MatSlideToggleModule, MatDialogModule, MatSnackBarModule,
    MatTabsModule, MatSelectModule, MatRadioModule,
} from '@angular/material';
import { AppComponent } from './app.component';
import { MemberService } from './services/member.service';
import { BookService } from './services/book.service';
import { RentalService } from './services/rental.service';
import { CategoryService } from './services/category.service';
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
import { BookListComponent } from './components/booklist/booklist.component';
import { CategoryListComponent } from './components/categorylist/categorylist.component';
import { EditBookComponent } from './components/edit-book/edit-book.component';
import { EditCategoryComponent } from './components/edit-category/edit-category.component';

export function tokenGetter() {
    return sessionStorage.getItem('id_token');
}


@NgModule({
    declarations: [
        AppComponent,
        MemberListComponent,
        BookListComponent,
        CategoryListComponent,
        LoginComponent,
        LogoutComponent,
        HomeComponent,
        UnknownComponent,
        RestrictedComponent,
        EditMemberComponent,
        EditBookComponent,
        EditCategoryComponent,
        SetFocusDirective,
    ],
    entryComponents: [EditMemberComponent, EditBookComponent, EditCategoryComponent],
    imports: [
        HttpClientModule,
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule,
        MatTableModule, MatPaginatorModule, MatSortModule, MatIconModule,
        MatSlideToggleModule, MatDialogModule, MatSnackBarModule, MatTabsModule, MatSelectModule,
        MatRadioModule,
        RouterModule.forRoot([
            { path: '', redirectTo: 'home', pathMatch: 'full' },
            { path: 'login', component: LoginComponent },
            {
                path: '',
                canActivate: [AuthGuard],
                children: [
                    { path: 'logout', component: LogoutComponent },
                    { path: 'home', component: HomeComponent },
                    { path: 'books', component: BookListComponent },
                    {
                        path: '',
                        canActivate: [AdminGuard],
                        children: [
                            { path: 'members', component: MemberListComponent },
                            { path: 'categories', component: CategoryListComponent },
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
        BookService,
        CategoryService,
        MemberCommonService,
        RentalService,
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
