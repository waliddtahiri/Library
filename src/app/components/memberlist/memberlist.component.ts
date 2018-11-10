import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { Member, MemberService } from '../../services/member.service';
import * as _ from 'lodash';

@Component({
    selector: 'app-memberlist-mat',
    templateUrl: './memberlist.component.html',
    styleUrls: ['./memberlist.component.css']
})
export class MemberListComponent implements OnInit {
    displayedColumns: string[] = ['pseudo', 'profile', 'admin', 'actions'];
    dataSource: MatTableDataSource<Member>;

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    constructor(private memberService: MemberService) {
    }

    ngOnInit() {
        this.refresh();
    }

    refresh() {
        this.memberService.getAll().subscribe(members => {
            this.dataSource = new MatTableDataSource(members);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
        });
    }

    applyFilter(filterValue: string) {
        this.dataSource.filter = filterValue.trim().toLowerCase();
        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    private edit(member: Member) {
        console.warn('Edit member not implemented', member);
        alert('Edit member not implemented: ' + member.pseudo);
    }

    private delete(member: Member) {
        console.warn('Delete member not implemented', member);
        alert('Delete member not implemented: ' + member.pseudo);
    }

    private create() {
        console.warn('Create member not implemented');
        alert('Create member not implemented');
    }

}
