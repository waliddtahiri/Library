
import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { MatTableDataSource, MatSnackBar, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE,
   MatPaginator, MatSort, MatDialog } from '@angular/material';
import { AuthService } from '../../services/auth.service';
import { MemberCommonService } from '../../services/member-common.service';
import { Member, MemberService } from '../../services/member.service';
import { map, flatMap } from 'rxjs/operators';
import { FormBuilder } from '@angular/forms';
import { Inject } from '@angular/core';
import * as moment from 'moment';
import { Rental, RentalService } from '../../services/rental.service';
import * as mongoose from 'mongoose';
import { Db } from 'mongodb';
import { FormControl } from '@angular/forms';
import { EditRentalComponent } from '../edit-rental/edit-rental.component';
import * as _ from 'lodash';
import { DatePipe } from '@angular/common';
import { MomentDateAdapter, MAT_MOMENT_DATE_FORMATS } from '@angular/material-moment-adapter';
import {MatDatepickerModule} from '@angular/material/datepicker';


@Component({
  selector: 'app-home-mat',
  templateUrl: 'home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [

    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
  ],
})

export class HomeComponent implements OnInit {
  public current: Member;
  private updateCounter = new Date().getTime();
  displayedColumnsAdmin: string[] = ['orderDate', 'member.pseudo', 'book.title', 'returnDate', 'actions'];
  displayedColumns: string[] = ['orderDate', 'book.title'];
  dataSource: MatTableDataSource<Rental>;
  dataSourceAdmin: MatTableDataSource<any>;
  userRentals: Rental[] = [];
  rentals: Rental[];
  memberFilter = new FormControl('');
  bookFilter = new FormControl('');
  dateFilter: Date = null;
  radioFilter: string;
  backup: any[];
  filterValues = {
    member: '',
    book: '',
  };



  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;


  constructor(public authService: AuthService,
    public memberCommonService: MemberCommonService,
    public rentalService: RentalService,
    private changeDetectorRefs: ChangeDetectorRef,
    public memberService: MemberService,
    public dialog: MatDialog, public snackBar: MatSnackBar, private datePipe: DatePipe) {
    this.memberCommonService.getOne(authService.currentUser).subscribe(m => {
      this.current = m;
    });
  }



  ngOnInit() {

    this.getAllRentals();
    this.memberFilter.valueChanges
      .subscribe(
        member => {
          this.filterValues.member = member;
          this.dataSourceAdmin.filter = JSON.stringify(this.filterValues);
        }
      );
    this.bookFilter.valueChanges
      .subscribe(
        book => {
          this.filterValues.book = book;
          this.dataSourceAdmin.filter = JSON.stringify(this.filterValues);
        }
      );

      this.refresh();
  }

  getAllRentals() {
    this.rentalService.getAll().subscribe(rentals => {
      this.dataSourceAdmin = new MatTableDataSource(rentals);
      this.dataSourceAdmin.filterPredicate = this.createFilter();
      this.dataSourceAdmin.paginator = this.paginator;
      this.dataSourceAdmin.sort = this.sort;
      this.backup = rentals; 
    });
    
  }



  private delete(any: any) {
    console.log("delete component", any);
    const backup = this.dataSourceAdmin.data;
    this.dataSourceAdmin.data = _.filter(this.dataSourceAdmin.data, b => {
      return b._id !== any._id;
    });

    const snackBarRef = this.snackBar.open('The rental  will be deleted', 'Undo', { duration: 5000 });
    snackBarRef.afterDismissed().subscribe(res => {
      if (!res.dismissedByAction) {

        this.rentalService.getRentalByItem(any._id).subscribe(res => {
          console.log(res);
          let array = res[0].items;
          let val = array.find(i => i._id === any._id); //equivalent a getOne(item)
          const index = res[0].items.indexOf(val);

          res[0].items.splice(index, 1);
          this.rentalService.update(res[0]).subscribe();

          if (res[0].items.length === 0) {
            this.rentalService.delete(res[0]).subscribe();
          }
        });

      } else {
        this.dataSourceAdmin.data = backup;
      }
    });
  }

  private edit(any: any) {
    const dlg = this.dialog.open(EditRentalComponent, { data: any });
    dlg.afterClosed().subscribe(res => {
      this.rentalService.getAll().subscribe(rentals => {
        this.dataSourceAdmin = new MatTableDataSource(rentals);
      });
    });
  }


  refresh() {
    this.rentalService.getOne(this.authService.currentUser).subscribe(rentals => {
      this.dataSource = new MatTableDataSource(rentals);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.dataSource.filterPredicate = (data: any, fitlerString: string) => {
        return data.returnDate === null;
      };
      this.dataSource.filter = "filtre";
    });
    
  }


  fileChange(event) {
    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      const file: File = fileList[0];
      this.memberService.uploadPicture(this.current.pseudo, file).pipe(
        flatMap(path => this.memberService.confirmPicture(this.current.pseudo, path))
      ).subscribe(path => {
        this.updateCounter++;
        this.current.picturePath = path;
        this.memberService.update_picture_path(this.current.pseudo, path).subscribe();
      });
    }
  }

  get picturePath(): string {
    // Le compteur updateCounter sert � g�n�rer un URL diff�rent quand on change d'image
    // car sinon l'image ne se rafra�chit pas parce que l'url ne change pas.
    return this.current && this.current.picturePath !== '' ?
      (this.current.picturePath + '?' + this.updateCounter) : 'uploads/unknown-user.jpg';
  }

  createFilter(): (data: any, filter: string) => boolean {
    const filterFunction = function (data, filter): boolean {
      const searchTerms = JSON.parse(filter);
      return data.member.pseudo.toLowerCase().indexOf(searchTerms.member) !== -1 && (
        data.book.author.toLowerCase().indexOf(searchTerms.book) !== -1 ||
        data.book.title.toLowerCase().indexOf(searchTerms.book) !== -1 ||
        data.book.isbn.toLowerCase().indexOf(searchTerms.book) !== -1 ||
        data.book.editor.toLowerCase().indexOf(searchTerms.book) !== -1
      );

    };
    return filterFunction;
  }

filterDateAndRadio() {
    this.dataSourceAdmin.data = this.backup;
    if (this.radioFilter === 'open') { // open
      this.dataSourceAdmin.data = _.filter(this.dataSourceAdmin.data, d => d.returnDate === null);
    } else if (this.radioFilter === 'returned') { // close
      this.dataSourceAdmin.data = _.filter(this.dataSourceAdmin.data, d => d.returnDate !== null);
    }
    if (this.dateFilter !== null) {
      const date = this.datePipe.transform(this.dateFilter, 'yyyy-MM-dd');
      this.dataSourceAdmin.data = _.filter(this.dataSourceAdmin.data, d => this.datePipe.transform(d.orderDate, 'yyyy-MM-dd') === date);
    }

  }

}