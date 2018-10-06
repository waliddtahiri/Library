import { Component, OnInit } from '@angular/core';
import { MemberService, Member } from './member.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    public members: Member[];

    constructor(private memberService: MemberService) { }

    ngOnInit() {
        this.memberService.getAll().subscribe(
            res => this.members = res,
            err => { console.log(err); this.members = []; });
    }
}
