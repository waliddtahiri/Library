import { Component, OnInit } from '@angular/core';
import { FormControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
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
        this.forbiddenValue('abc')], [this.pseudoUsed()]);
        this.password = this.fb.control('', [Validators.required, Validators.minLength(3)]);
        this.confPassword = this.fb.control('', [Validators.required], [this.confirmPassword()]);
        this.frm = this.fb.group({
            _id: null,
            pseudo: this.pseudo,
            password: this.password,
            confPassword: this.confPassword
        },
            { validator: this.confirmPassword, }

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
    pseudoUsed(): AsyncValidatorFn {
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
                        this.authService.isPseudoAvailable(pseudo).subscribe(member => {

                            resolve(member ? { pseudoUsed: true } : null);
                        });
                    }
                }, 300);
            });
        };
    }
    confirmPassword(): AsyncValidatorFn {

        let timeout;
        return (ctl: FormControl) => {
            clearTimeout(timeout);
            return new Promise(resolve => {
                timeout = setTimeout(() => {
                    if (ctl.value === this.password.value) {
                        return resolve(null);

                    }
                    return resolve({ passwordConfirm: { currentValue: ctl.value, passwordConfirm: this.password.value } });

                }, 300);
            });
        };


    }

    signup() {
        //  console.log('rentre dans signup.component');

        this.authService.signup(this.frm.value.pseudo, this.frm.value.password).subscribe(() => {
            if (this.authService.isLoggedIn) {
                const redirect = this.authService.redirectUrl || '/home';
                this.authService.redirectUrl = null;
                this.router.navigate([redirect]);
            }
        });

    }

}