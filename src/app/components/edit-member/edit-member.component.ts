import { Component, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Inject } from '@angular/core';
import { Member, MemberService } from '../../services/member.service';
import { FormGroup } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import * as _ from 'lodash';
import { MemberCommonService } from '../../services/member-common.service';

@Component({
    selector: 'app-edit-member-mat',
    templateUrl: './edit-member.component.html',
    styleUrls: ['./edit-member.component.css']
})
export class EditMemberComponent implements OnInit {
    public frm: FormGroup;
    public frmPhone: FormGroup;
    public ctlPseudo: FormControl;
    public ctlProfile: FormControl;
    public ctlPassword: FormControl;
    public ctlBirthDate: FormControl;
    public ctlAdmin: FormControl;
    public ctlPhoneType: FormControl;
    public ctlPhoneNumber: FormControl;

    public phones;

    constructor(public dialogRef: MatDialogRef<EditMemberComponent>,
        @Inject(MAT_DIALOG_DATA) public data: Member,
        private fb: FormBuilder,
        private memberService: MemberService,
        private memberCommonService: MemberCommonService) {
        this.ctlPseudo = this.fb.control('', [Validators.required, Validators.minLength(3),
        this.forbiddenValue('abc')], [this.pseudoUsed()]);
        this.ctlPassword = this.fb.control('', [Validators.required, Validators.minLength(3)]);
        this.ctlProfile = this.fb.control('', []);
        this.ctlBirthDate = this.fb.control('', []);
        this.ctlAdmin = this.fb.control(false, []);
        this.ctlPhoneType = this.fb.control('', []);
        this.ctlPhoneNumber = this.fb.control('', []);
        this.frm = this.fb.group({
            _id: null,
            pseudo: this.ctlPseudo,
            password: this.ctlPassword,
            profile: this.ctlProfile,
            birthdate: this.ctlBirthDate,
            admin: this.ctlAdmin
        });

        this.frmPhone = this.fb.group({
            type: this.ctlPhoneType,
            number: this.ctlPhoneNumber
        });

        this.frm.patchValue(data);
        this.phones = _.cloneDeep(data.phones);
    }

    // Validateur bidon qui vérifie que la valeur est différente
    forbiddenValue(val: string): any {
        return (ctl: FormControl) => {
            if (ctl.value === val) {
                return { forbiddenValue: { currentValue: ctl.value, forbiddenValue: val } };
            }
            return null;
        };
    }

    // Validateur asynchrone qui vérifie si le pseudo n'est pas déjà utilisé par un autre membre
    pseudoUsed(): any {
        let timeout;
        return (ctl: FormControl) => {
            clearTimeout(timeout);
            const pseudo = ctl.value;
            return new Promise(resolve => {
                timeout = setTimeout(() => {
                    if (ctl.pristine) {
                        resolve(null);
                    } else {
                        this.memberCommonService.getOne(pseudo).subscribe(member => {
                            resolve(member ? { pseudoUsed: true } : null);
                        });
                    }
                }, 300);
            });
        };
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    ngOnInit() {
    }

    update() {
        const data = this.frm.value;
        data.phones = this.phones;
        if (data._id === undefined) {
            this.memberService.add(data).subscribe(m => data._id = m._id);
        } else {
            this.memberService.update(data).subscribe();
        }
        this.dialogRef.close(data);
    }

    cancel() {
        this.dialogRef.close();
    }

    phoneAdd() {
        if (!this.phones) {
            this.phones = [];
        }
        this.phones.push(this.frmPhone.value);
        this.frmPhone.reset();
        this.frm.markAsDirty();
    }

    phoneDelete(phone) {
        _.remove(this.phones, phone);
        this.frm.markAsDirty();
    }
}
