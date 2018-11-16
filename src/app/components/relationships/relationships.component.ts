import { Component, OnInit } from '@angular/core';
import { MemberCommonService } from '../../services/member-common.service';
import { Member } from '../../services/member.service';
import { AuthService } from '../../services/auth.service';
import * as _ from 'lodash';

declare type RelationshipType = 'none' | 'follower' | 'followee' | 'mutual';

@Component({
    selector: 'app-relationships',
    templateUrl: './relationships.component.html',
    styleUrls: ['./relationships.component.css']
})
export class RelationshipsComponent implements OnInit {

    private members: Member[] = [];
    private current: Member;

    constructor(private memberCommonService: MemberCommonService,
        private authService: AuthService) {
        this.refresh();
    }

    ngOnInit() {
    }

    private refresh() {
        this.memberCommonService.getAll().subscribe(members => {
            this.current = _.remove(members, m => m.pseudo === this.authService.currentUser)[0];
            this.members = members;
        });
    }

    getRelationShip(member: Member): RelationshipType {
        const user = this.authService.currentUser;
        const follower = member.followees.findIndex(m => m.pseudo === user) !== -1;
        const followee = member.followers.findIndex(m => m.pseudo === user) !== -1;
        const mutual = followee && follower;
        if (mutual) {
            return 'mutual';
        } else if (followee) {
            return 'followee';
        } else if (follower) {
            return 'follower';
        } else {
            return 'none';
        }
    }

    follow(member: Member) {
        member.followers.push(this.current);
        this.memberCommonService
            .follow(this.authService.currentUser, member)
            .subscribe(res => this.refresh());
    }

    drop(member: Member) {
        member.followers.splice(member.followers.indexOf(this.current));
        this.memberCommonService
            .unfollow(this.authService.currentUser, member)
            .subscribe(res => this.refresh());
    }

}
