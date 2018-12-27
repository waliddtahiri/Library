import { Component, OnInit } from '@angular/core';
import { FormControl, ValidationErrors } from '@angular/forms';
import { Validators } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { Inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import * as _ from 'lodash';
import { MemberCommonService } from '../../services/member-common.service';
import { Member, MemberService } from '../../services/member.service';

@Component({
    // selector: 'app-edit-member-mat',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.css']
})
export class SignupComponent {
    public frm: FormGroup;
    public pseudo: FormControl;
    public password: FormControl;
    public confPassword: FormControl;
    public message = '';

    constructor(
        public authService: AuthService, // pour pouvoir faire le login
        public router: Router,           // pour rediriger vers la page d'accueil en cas de login
        private fb: FormBuilder,         // pour construire le formulaire, du côté TypeScript
        private memberService: MemberService,
        private memberCommonService: MemberCommonService) {
        this.setMessage();

        this.pseudo = this.fb.control('', [Validators.required, Validators.minLength(3),
        this.forbiddenValue('abc')], );
        this.password = this.fb.control('', [Validators.required, Validators.minLength(3)]);
        this.confPassword = this.fb.control('', [Validators.required]);
        this.frm = this.fb.group({
            // _id: null,
            pseudo: this.pseudo,
            password: this.password,
            confPassword: this.confPassword},
            { validator: this.confirmPassword,  }

        );
    }


    setMessage() {
        this.message = 'Create a new account !!!';
    }

    // Validateur bidon qui vérifie que la valeur est différente
    forbiddenValue(val: string): any {
        console.log('Ok je rentre dans forbiddenValue');
        return (ctl: FormControl) => {
            if (ctl.value === val) {
                return { forbiddenValue: { currentValue: ctl.value, forbiddenValue: val } };
            }
            return null;
        };
    }

    // Validateur asynchrone qui vérifie si le pseudo n'est pas déjà utilisé par un autre membre
    pseudoUsed(): any {
        console.log('Ok je rentre dans pseudoUsed');
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
    confirmPassword(group: FormGroup): ValidationErrors {


        const pass = group.controls.password.value;
        const passConfirm = group.controls.confPassword.value;
        console.log(pass);
        console.log(passConfirm);
        if (pass !== passConfirm) {
          return ({notSame : true});
        // return (ctl: FormControl) => {
        //     if (ctl.value !== this.password) {
        //         return { forbiddenValue: { currentValue: ctl.value} };
        //     }
        //       return null;
        //  };
        //  // return ({notSame : false});
        }
    }

    signup() {
        console.log('ok je rentre');

        const data = this.frm.value;

        this.memberService.add(data).subscribe(m => data._id = m._id);

     /*   this.authService.signup(this.pseudo.value , this.password.value).subscribe(() => {
          // const redirect = this.authService.redirectUrl || '/home';
          this.router.navigate(['/home']);
          // console.log("fini l appel de sign up ds signup component ");
    }); */
    }

}
