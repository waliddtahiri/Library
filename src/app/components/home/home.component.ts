import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { MemberCommonService } from '../../services/member-common.service';

@Component({
    templateUrl: 'home.component.html'
})
export class HomeComponent {
    public memberCount: number | '?' = '?';

    constructor(public authService: AuthService, public memberCommonService: MemberCommonService) {
        this.memberCommonService.getCount().subscribe(c => this.memberCount = c);
    }
}
