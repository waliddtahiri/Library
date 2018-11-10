import { Component, OnInit } from '@angular/core';
import { MemberService, Member } from './member.service';
import { Observable, pipe } from 'rxjs';
import { tap, map, switchMap, flatMap, concatMap, mergeMap, delay,  } from 'rxjs/operators';

@Component({
    selector: 'app-member-list',
    templateUrl: 'memberlist.component.html'
})

export class MemberListComponent implements OnInit {
    public members: Member[];

    constructor(private memberService: MemberService) { }

    ngOnInit() {
        this.memberService.getAll().subscribe(res => {
            this.members = res;
        });
    }
}
