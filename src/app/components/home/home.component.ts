import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource, MatDialog, MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import { AuthService } from '../../services/auth.service';
import { MemberCommonService } from '../../services/member-common.service';
import { Member, MemberService } from '../../services/member.service';
import { map, flatMap } from 'rxjs/operators';
import {Rental, RentalService} from '../../services/rental.service';
import * as mongoose from 'mongoose';
import { Db } from 'mongodb';

@Component({
    templateUrl: 'home.component.html'
})
export class HomeComponent implements OnInit {
    public current: Member;
    private updateCounter = new Date().getTime();
    displayedColumns: string[] = ['orderDate', 'book'];
    dataSource: MatTableDataSource<Rental>;


    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    constructor(public authService: AuthService,
        public memberCommonService: MemberCommonService,
        public rentalService: RentalService,
        public memberService: MemberService) {
        this.memberCommonService.getOne(authService.currentUser).subscribe(m => {
            this.current = m;
            console.log(this.current._id);
        });
    }

    ngOnInit() {
        this.refresh();
    }


    refresh() {
        this.rentalService.getAll().subscribe(rentals => {
            this.dataSource = new MatTableDataSource(rentals);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            console.log(rentals);
        });
    }


    fileChange(event) {
        const fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            const file: File = fileList[0];
            this.memberCommonService.uploadPicture(this.current.pseudo, file).pipe(
                flatMap(path => this.memberCommonService.confirmPicture(this.current.pseudo, path))
            ).subscribe(path => {
                this.updateCounter++;
                this.current.picturePath = path;
                this.memberCommonService.update_picture_path(this.current.pseudo, path).subscribe();
            });
        }
    }

    get picturePath(): string {
        // Le compteur updateCounter sert � g�n�rer un URL diff�rent quand on change d'image
        // car sinon l'image ne se rafra�chit pas parce que l'url ne change pas.
        return this.current && this.current.picturePath !== '' ?
            (this.current.picturePath + '?' + this.updateCounter) : 'uploads/unknown-user.jpg';
    }
}
