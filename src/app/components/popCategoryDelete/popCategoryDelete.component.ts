import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Category, CategoryService } from '../../services/category.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Inject } from '@angular/core';

@Component({
  selector: 'popCategoryDeleteComponent',
  templateUrl: './popCategoryDelete.component.html',
})
export class popCategoryDeleteComponent {
  constructor(public authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: Category,
    private categoryService: CategoryService,
    public dialogRef: MatDialogRef<popCategoryDeleteComponent>) { }


  delete(){
    this.categoryService.delete(this.data).subscribe();
    this.dialogRef.close();
  }

  onNoClick(): void {
        this.dialogRef.close();
    }

}