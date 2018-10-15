import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { MemberService } from './member.service';
import { MemberListComponent } from './memberlist.component';
import { LoginComponent } from './login.component';
import { HomeComponent } from './home.component';
import { UnknownComponent } from './unknown.component';

@NgModule({
    declarations: [
        AppComponent,
        MemberListComponent,
        LoginComponent,
        HomeComponent,
        UnknownComponent
    ],
    imports: [
        HttpClientModule,
        BrowserModule,
        RouterModule.forRoot([
            { path: '', redirectTo: 'home', pathMatch: 'full' },
            { path: 'login', component: LoginComponent },
            { path: 'home', component: HomeComponent },
            { path: 'members', component: MemberListComponent },
            { path: '**', component: UnknownComponent }
        ])
    ],
    providers: [
        MemberService
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
