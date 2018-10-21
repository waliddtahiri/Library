import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';

@Component({
    templateUrl: './login.component.html'
})
export class LoginComponent implements AfterViewInit {
    public frm: FormGroup;
    public ctlPseudo: FormControl;
    public ctlPassword: FormControl;
    public message: string;

    /**
     * Le décorateur ViewChild permet de récupérer une référence vers un objet de type ElementRef
     * qui encapsule l'élément DOM correspondant. On peut ainsi accéder au DOM et le manipuler grâce
     * à l'attribut 'nativeElement'. Le paramètre 'pseudo' que l'on passe ici correspond au tag
     * que l'on a associé à cet élément dans le template HTML sous la forme de #<tag>. Ici par
     * exemple <input #pseudo id="pseudo"...>.
     *
     * Dans ce cas précis-ci, on a besoin d'accéder au DOM de ce champ car on veut mettre le focus
     * sur ce champ quand la page s'affiche. Pour cela, il faut passer par le DOM.
     */
    @ViewChild('pseudo') pseudo: ElementRef;

    constructor(
        public authService: AuthService, // pour pouvoir faire le login
        public router: Router,           // pour rediriger vers la page d'accueil en cas de login
        private fb: FormBuilder          // pour construire le formulaire, du côté TypeScript
    ) {
        this.setMessage();

        /**
         * Ici on construit le formulaire réactif. On crée un 'group' dans lequel on place deux
         * 'controls'. Remarquez que la méthode qui crée les controls prend comme paramêtre une
         * valeur initiale et un tableau de validateurs. Les validateurs vont automatiquement
         * vérifier les valeurs encodées par l'utilisateur et reçue dans les FormControls grâce
         * au binding, en leur appliquant tous les validateurs enregistrés. Chaque validateur
         * qui identifie une valeur non valide va enregistrer une erreur dans la propriété
         * 'errors' du FormControl. Ces erreurs sont accessibles par le template grâce au binding.
         */
        this.ctlPseudo = this.fb.control('', [Validators.required, Validators.minLength(3)]);
        this.ctlPassword = this.fb.control('', [Validators.required, Validators.minLength(3)]);
        this.frm = this.fb.group({
            pseudo: this.ctlPseudo,
            password: this.ctlPassword
        });
    }

    /**
     * Event standard d'angular qui nous donne la main juste après l'affichage du composant.
     * C'est le bon endroit pour mettre le focus dans le champ 'pseudo'.
     */
    ngAfterViewInit() {
        /**
         * le focus est un peu tricky : pour que ça marche, il faut absolument faire l'appel
         * à la méthode focus() de l'élément de manière asynchrone. Voilà la raison du setTimeout().
         */
        setTimeout(_ => { this.setFocus(); });
    }

    setFocus() {
        if (this.pseudo) {
            this.pseudo.nativeElement.focus();
        }
    }

    setMessage() {
        this.message = 'You are logged ' + (this.authService.isLoggedIn ? 'in' : 'out') + '.';
    }

    /**
     * Cette méthode est bindée sur le click du bouton de login du template. On va y faire le
     * login en faisant appel à notre AuthService.
     */
    login() {
        this.message = 'Trying to log in ...';
        this.authService.login(this.frm.value.pseudo, this.frm.value.password).subscribe(() => {
            this.setMessage();
            if (this.authService.isLoggedIn) {
                // Get the redirect URL from our auth service
                // If no redirect has been set, use the default
                const redirect = this.authService.redirectUrl || '/home';
                this.authService.redirectUrl = null;
                // Redirect the user
                this.router.navigate([redirect]);
            } else {
                this.message = 'Login failed!';
            }
        });
    }

    logout() {
        this.authService.logout();
        this.setMessage();
        this.frm.reset();   // réinitialise le formulaire avec les valeurs par défaut
        setTimeout(_ => { this.setFocus(); });
    }
}
