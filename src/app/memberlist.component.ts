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
    public log = '';

    constructor(private memberService: MemberService) { }

    ngOnInit() {
        this.memberService.getAll().subscribe(res => {
            this.members = res;
        });

        const m = new Member({ pseudo: 'xyz', password: 'xyz', profile: 'XYZ' });

        this.memberService.getOne('ben').pipe(
            tap(res => this.log += `Found member '${JSON.stringify(res)}'\nWaiting...\n`),
            delay(1000),
            concatMap(_ => this.memberService.getOne('boris')),
            tap(res => this.log += `Found member '${JSON.stringify(res)}'\n`),
            concatMap(_ => this.memberService.add(m)),
            tap(res => this.log += `Added member '${JSON.stringify(res)}'\n`),
            concatMap(_ => this.memberService.delete(m)),
            tap(res => this.log += `Delete member '${JSON.stringify(res)}'\n`),
        )
        .subscribe(res => console.log(res));
    }
}
