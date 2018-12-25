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
    selector: 'app-home-mat',
    templateUrl: 'home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
    public current: Member;
    private updateCounter = new Date().getTime();
    displayedColumnsAdmin: string[] = ['orderDate', 'member.pseudo', 'book.title', 'returnDate', 'actions'];
    displayedColumns: string[] = ['orderDate', 'book.title'];
    dataSource: MatTableDataSource<Rental>;
    dataSourceAdmin: MatTableDataSource<Rental>;
    userRentals: Rental[] = [];


    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    constructor(public authService: AuthService,
        public memberCommonService: MemberCommonService,
        public rentalService: RentalService,
        public memberService: MemberService) {
        this.memberCommonService.getOne(authService.currentUser).subscribe(m => {
            this.current = m;
            m.rentals.forEach(r => this.userRentals.push(r));
        });
    }

    ngOnInit() {
        this.refresh();
    }


    refresh() {
        this.rentalService.getOne(this.authService.currentUser).subscribe(rentals => {
            this.dataSource = new MatTableDataSource(rentals);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
        });
        this.rentalService.getAll().subscribe(rentals => {
            this.dataSourceAdmin = new MatTableDataSource(rentals);
            this.dataSourceAdmin.paginator = this.paginator;
            this.dataSourceAdmin.sort = this.sort;
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
