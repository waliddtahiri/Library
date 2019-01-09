
import { Component, OnInit, ViewChild } from '@angular/core';
import {
  MatPaginator, MatSort, MatTableDataSource, MatDialog, MAT_DIALOG_DATA, MatDialogRef,
  MatRadioChange, MatRadioButton, MatSnackBar
} from '@angular/material';
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
  rentals: Rental[];



  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;


  constructor(public authService: AuthService,
    public memberCommonService: MemberCommonService,
    public rentalService: RentalService,
    public memberService: MemberService,
    public dialog: MatDialog, public snackBar: MatSnackBar) {
    this.memberCommonService.getOne(authService.currentUser).subscribe(m => {
      this.current = m;
    });
  }



  ngOnInit() {
    this.refresh();
  }

  applyFilter(filterValue: string) {
    console.log(filterValue);
    this.dataSourceAdmin.filter = filterValue.trim().toLowerCase();
    /*  if (this.dataSource.paginator) {
          this.dataSource.paginator.firstPage();
      } */
  }


  filterValueMember: any;

  memberFilter(filterValue: string) {
    console.log(filterValue);
    this.filterValueMember = filterValue.trim().toLowerCase();
    if (this.filterValueMember !== '') {
      this.dataSourceAdmin.filterPredicate = (data: any, fitlerString: string) => {
        if (this.filterValueMember !== '' && this.filterValueBook !== undefined) {
          return data.member.pseudo.trim().toLowerCase().startsWith(this.filterValueMember) &&
            data.book.title.trim().toLowerCase().startsWith(this.filterValueBook);
        }
        else if (this.filterValueMember !== '') {
          return data.member.pseudo.trim().toLowerCase().startsWith(this.filterValueMember);

        }
      };
      this.dataSourceAdmin.filter = filterValue;
    }
    else {
      this.dataSourceAdmin.filterPredicate = (data: any, fitlerString: string) => {
        if (this.filterValueBook !== '') {
          return data.book.title.trim().toLowerCase().startsWith(this.filterValueBook);

        }

      };
      this.dataSourceAdmin.filter = this.filterValueBook;

    }
  }

  filterValueBook: any;
  bookFilter(filterValue: string) {
    this.filterValueBook = filterValue.trim().toLowerCase();
    if (this.filterValueBook !== '') {
      this.dataSourceAdmin.filterPredicate = (data: any, fitlerString: string) => {
        if (this.filterValueBook !== '' && this.filterValueMember !== undefined) {
          return data.book.title.trim().toLowerCase().startsWith(this.filterValueBook) &&
            data.member.pseudo.trim().toLowerCase().startsWith(this.filterValueMember);
        } else if (this.filterValueBook !== '') {
          return data.book.title.trim().toLowerCase().startsWith(this.filterValueBook);
        }
      };
      this.dataSourceAdmin.filter = filterValue;
    } else {
      this.dataSourceAdmin.filterPredicate = (data: any, fitlerString: string) => {
        if (this.filterValueMember !== '') {
          return data.member.pseudo.trim().toLowerCase().startsWith(this.filterValueMember);
        }
      };
      this.dataSourceAdmin.filter = this.filterValueMember;

    }
  }

  filterValueDate: any;
  dateFilter(filterValue: Date) {
    // console.log(filterValue);
    this.filterValueDate = filterValue;

    this.dataSourceAdmin.filterPredicate = (data: any, fitlerString: string) => {
      return new Date(data.orderDate).getTime() >= new Date(filterValue).getTime();
    };
    this.dataSourceAdmin.filter = this.filterValueDate;

  }


  private delete(any: any) {
    console.log("delete component", any);
    const backup = this.dataSourceAdmin.data;
    this.dataSourceAdmin.data = _.filter(this.dataSourceAdmin.data, b => {
      return b._id !== any._id;
    });

    const snackBarRef = this.snackBar.open('The rental  will be deleted', 'Undo', { duration: 1000 });
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
    dlg.beforeClose().subscribe(res => {
      if (res) {
        _.assign(any, res);
        console.log(res);
      }
      this.refresh();
      this.refresh();
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
    this.rentalService.getAll().subscribe(rentals => {
      this.dataSourceAdmin = new MatTableDataSource(rentals);
      this.dataSourceAdmin.paginator = this.paginator;
      this.dataSourceAdmin.sort = this.sort;
      console.log(this.dataSourceAdmin.data);
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

  onChange(val: MatRadioChange) {
    // console.log(val.value);
    // const myButton: MatRadioButton = val.source;
    // console.log(myButton.name);
    // console.log(myButton.checked);

    switch (val.value) {
      case 'open':
        // code block
        console.log('on filtre avec open');
        this.dataSourceAdmin.filterPredicate = (data: any, fitlerString: string) => {
          console.log(data);
          return data.returnDate === null;

        };
        this.dataSourceAdmin.filter = val.value;
        break;
      case 'returned':
        // code block
        console.log('on filtre avec returned');
        this.dataSourceAdmin.filterPredicate = (data: any, fitlerString: string) => {
          console.log(data);
          return data.returnDate !== null;

        };
        this.dataSourceAdmin.filter = val.value;
        break;
      case 'all':
        console.log('on filtre avec all');
        // code block
        this.dataSourceAdmin.filterPredicate = (data: any, fitlerString: string) => {
          console.log(data);
          return data.returnDate !== null || data.returnDate === null;

        };
        this.dataSourceAdmin.filter = val.value;
        break;
      default:
      // code block
    }
  }
}
