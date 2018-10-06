import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { MemberService } from './member.service';

@NgModule({
    declarations: [
        AppComponent
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
