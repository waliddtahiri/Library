import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { MemberService } from './member.service';
import { MemberListComponent } from './memberlist.component';

@NgModule({
    declarations: [
        AppComponent,
        MemberListComponent
    ],
    imports: [
        HttpClientModule,
        BrowserModule
    ],
    providers: [
        MemberService
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
