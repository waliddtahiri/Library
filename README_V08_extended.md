# V08 - Ajouter la sécurité côté client et serveur

Dans cette version, nous ajoutons la sécurité tant au niveau du serveur qu'au niveau du client.

L'idée générale qui est implémentée ici est basée sur le principe du jeton (*token*) de sécurité : au lieu de transmettre à chaque appel REST le login et le mot de passe de l'utilisateur, nous allons les transmettre une seule fois au serveur dans un appel à une API spécifique qui nous renverra en réponse un jeton sécurisé.

Nous utilisons ici le standard JWT (voir [https://en.wikipedia.org/wiki/JSON_Web_Token](https://en.wikipedia.org/wiki/JSON_Web_Token)), dans lequel le jeton est constitué d'un en-tête, d'une *charge utile* et d'une clé de hachage cryptée calculée sur base de l'en-tête et de la charge utile.

Etant donné que l'information est stockée en clair dans le jeton (elle est simplement codée en Base64) elle peut être lue par n'importe qui (et par conséquant la partie cliente de notre application). Par contre, seule la partie qui connaît la clé de cryptage, en l'occurence ici le serveur, pourra vérifier grâce à la clé de hachage que la charge utile est fiable et n'a pas été modifié.

On peut résumer le principe de fonctionnement comme ceci :

* Le client demande à l'utilisateur d'entrer son pseudo et son mot de passe. Il les stocke dans le _sessionStorage_ du navigateur pour pouvoir y accéder quand il en a besoin.
* Le client utilise une API spécifique du serveur pour demander un jeton en lui passant les _credentials_ de l'utilisateur.
* Le serveur génère un jeton dans lequel il stocke le pseudo. Ce jeton est assorti d'un délai d'expiration et est signé par le serveur avec une clé secrète.
* Le client reçoit le jeton et le stocke en local dans le _sessionStorage_ du navigateur.
* A partir d'ici, à chaque fois que le client doit accéder à une API du serveur, voici ce qui va se passer :
    * Le client récupère le jeton du _sessionStorage_.
    * Le client vérifie que le jeton n'est pas expiré. S'il est expiré, il s'adresse au serveur pour redemander un nouveau jeton en lui repassant les _credentials_ de l'utilisateur (qu'il a conservés dans le _sessionStorage_).
    * Le client ajoute le jeton dans le header HTTP `Authorization` de sa requête (ceci est géré automatiquement par `angular-jwt`).
    * Le serveur récupère ce header et en extrait le jeton.
    * Le serveur recalcule la clé de hachage de la partie publique du jeton grâce à sa clé secrète et vérifie qu'elle est conforme à la signature stockée dans le jeton. Si ce n'est pas le cas, où si le jeton ne se trouve pas dans le header, le serveur rejette la requête.

> Remarque : la différence entre le *localStorage* et le *sessionStorage* réside dans le fait que le second n'est conservé que pour la session courante du navigateur, alors que le premier est stocké à durée indéterminée, c'est-à-dire jusqu'à ce qu'on le supprime explicitement (voir [https://stackoverflow.com/a/5523174](https://stackoverflow.com/a/5523174)). 

## Passage en revue du code

Voici les fichiers qui y ont été modifiés par rapport à la V07 :

![](images/image_000003.png)

## Côté serveur

Nous avons ajouté un nouveau router `authentication.router.ts` dont le but est :

* d'implémenter l'API REST qui permet de demander un jeton. 
* de définir un filtre Express qui va se charger de vérifier si une requête HTTP peut être autorisée.

**server\routes\authentication.router.ts**

```typescript
import { Router, Request, Response, NextFunction } from 'express';
import * as mongoose from 'mongoose';
import * as jwt from 'jsonwebtoken';
import Member from '../models/member';

export class AuthentificationRouter {
    public router: Router;

    constructor() {
        this.router = Router();
        this.router.post('/', this.getToken);
    }

    /**
     * Cette méthode est un filtre Express, c'est-à-dire une méthode qui
     * reçoit une requête HTTP dans req et va simplement la transférer au
     * filtre suivant d'Express (next) après avoir fait un certain nombre
     * de vérifications. Si par contre ces vérifications s'avèrent fausses,
     * le filtre va rompre la chaîne des filtres en retournant directement
     * une réponse au client via l'objet res.
     *
     * Dans ce cas-ci, le but de ce filtre est de vérifier s'il y a bien un
     * jeton dans la requête, et si ce jeton est valide.
     */
    public static checkAuthorization(req, res, next) {
        // normalement le jeton se trouve dans le header Authorization, mais
        // on pourrait aussi imaginer qu'il soit dans le body ou même dans l'url
        let token = req.body.token || req.query.token || req.headers['x-access-token'] || req.headers['authorization'];
        // s'il y a bien un token
        if (token) {
            // si le jeton est dans Authorization, il est précédé par cette string dont on se débarrasse
            token = token.replace('Bearer ', '');
            // on demande à JWT de valider le jeton sur base de la clé secrète
            jwt.verify(token, 'my-super-secret-key', function (err, decoded) {
                if (err) {
                    // si le jeton est corrompu, on renvoie un message d'erreur au client
                    return res.json({ success: false, message: 'Failed to authenticate token.' });
                } else {
                    // si le jeton est correct, on stocke sa version "décodée", càd la charge utile,
                    // dans la requête afin que les filtres suivants puissent y avoir directement accès.
                    req.decoded = decoded;
                    // on appelle le filtre suivant
                    next();
                }
            });
        } else {
            // s'il n'y a pas de token, on retourne une erreur HTTP 403 (accès refusé)
            return res.status(403).send({
                success: false,
                message: 'No token provided.'
            });
        }
    }

    /**
     * Cette méthode permet de calculer et de renvoyer au client un jeton
     * JWT. La requête doit être un POST et doit contenir dans son body
     * le pseudo et le password. Sur base du pseudo, on cherche dans la db
     * le membre correspondant et on vérifie que le mot de passe reçu
     * dans la requête est conforme à celui stocké en db. S'il est conforme,
     * on utilise la librairie JWT pour générer un token dont la charge utile
     * contient simplement un objet JSON { pseudo: <pseudo> } et on définit
     * un délai de validité de 60 secondes (idéalement on mettrait un délai
     * plus long, mais pour pouvoir observer le phénomène de timeout, on
     * l'a volontairement fait court).
     */
    public getToken(req: Request, res: Response, next: NextFunction) {
        // récupère le pseudo et le mdp depuis le corps de la requête
        const pseudo = req.body.pseudo || null;
        const password = req.body.password || null;
        // via mongoose, cherche le membre correspondant en db
        Member.find({ pseudo: pseudo }, (err, members) => {
            // si on l'a trouvé
            if (!err) {
                // on reçoit un tableau d'un seul élément
                const member = members[0];
                // on vérifie le mot de passe
                if (member && member['password'] === password) {
                    // si le mot de passe est correct, on génère le token et on le renvoie au client
                    const token = jwt.sign({ pseudo: req.body.pseudo }, 'my-super-secret-key', { expiresIn: 60 });
                    res.json({ success: true, message: 'logged in', token: token });
                } else {
                    res.json({ success: false, message: 'bad password' });
                }
            } else {
                res.json({ success: false, message: 'bad pseudo' });
            }
        });
    }
}
```

**server\routes\members.router.ts**

Dans ce fichier, on ajoute simplement le filtre dans la séquence des filtres de routage :

```typescript
...
import { AuthentificationRouter } from './routes/authentication.router';
...
export class Server {
	...
    private routes() {
        this.express.use('/api/token', new AuthentificationRouter().router);
        this.express.use(AuthentificationRouter.checkAuthorization);    // à partir d'ici il faut être authentifié
        this.express.use('/api/members', new MembersRouter().router);
    }
	...
}
```

On voit donc que le router `/api/token` peut être accédé sans passer par le filtre d'authentification. Par contre, le router `/api/members` lui se trouve après ce filtre. Cela signifie que cette API ne sera accessible que si le filtre d'authentification l'autorise, c'est-à-dire si la requête contient un jeton valide.

Voilà! C'est tout pour le côté serveur. Vérifions tout cela avec Postman.

Lancez mongo et le serveur express :

```cmd
run-mongo.bat
```

```cmd
run-express.bat
```

Simulons un login en faisant un POST sur [`http://localhost:3000/api/token`](http://localhost:3000/api/token) :

![](images/image_000004.png)

On reçoit bien un token :

```json
{
    "success": true,
    "message": "logged in",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwc2V1ZG8iOiJiZW4iLCJpYXQiOjE1MDkwMDM0NDEsImV4cCI6MTUwOTAwMzUwMX0.sEFSdbUcvvupsP4gYKi2KrXO-Pm-i5nvUKXPGeVXTBw"
}
```

Vous pouvez décoder et vérifier les tokens JWT sur le site [https://jwt.io/](https://jwt.io/), à condition de connaître la clé secrète (ici `my-super-secret-key`) :

![](images/image_000005.png)

Si je fais une requête sans en-tête sur [`http://localhost:3000/api/members`](http://localhost:3000/api/members), j'obtiens une erreur :

![](images/image_000006.png)

Si maintenant j'ajouter l'entête `Authorization: Bearer <token>`, ça marche :

![](images/image_000007.png)

Par contre, si j'attends une minute, le token sera expiré et j'obtiendrai ceci :

![](images/image_000008.png)

## Côté client

Passons en revue les principaux aspects de l'implémentation de la sécurité du côté d'Angular.

### Le service `SecuredHttp`

Le fichier `securedhttp.service.ts` définit un service `SecuredHttp`. L'objectif est que ce service puisse remplacer de façon totalement transparente le service `HttpClient` que nous avons utilisé jusqu'ici.

Ainsi, par exemple, nous pourrons simplement modifier la classe `MemberService` pour qu'elle utilise notre service HTTP sécurisé au lieu du service HTTP standard. A part un petit changement dans la déclaration du service dans le constructeur (et l'une ou l'autre optimisation par rapport à la V07), il n'y a aucun impact sur l'utilisation du service :

![](images/image_000010.png)

Voyons maintenant comment fonctionne ce service HTTP sécurisé.

Du côté angular, nous utilisons la librairie `@auth0/angular-jwt` qui offre une couche au dessus de JWT, spécialisée pour angular. Elle a pour principal intérêt de permettre de faire des requêtes HTTP en y insérant automatiquement l'en-tête de sécurité contenant le token.

Pour que `angular-jwt` sache où il doit récupérer le token quand il en a besoin, il faut ajouter le code suivant dans `app.module.ts` :

**src\app\app.module.ts**

```typescript
...
import { JwtModule } from '@auth0/angular-jwt';
...
export function tokenGetter() {
    return sessionStorage.getItem('id_token');
}

@NgModule({
	...
    imports: [
        ...
        JwtModule.forRoot({
            config: {
                tokenGetter: tokenGetter,
                whitelistedDomains: ['localhost:3000'],
                blacklistedRoutes: ['localhost:3000/api/']
            }
        })
    ],
    ...
})
...
```

Dans la fonction `tokenGetter`, on va chercher le token dans le *sessionStorage* avec la clé d'accès `id_token`. Nous verrons plus loin que c'est bien là que nous l'avons préalablement stockée au moment du login. Cette fonction est utilisée automatiquement par `angular-jwt` grâce à la configuration `tokenGetter: tokenGetter`.

**src\app\securedhttp.service.ts**

Voici maintenant à quoi ressemble le fichier `securedhttp.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable, of } from 'rxjs';
import { map, flatMap, catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export const BASE_URL = environment.production ? '/' : '/';

const URL = BASE_URL;

@Injectable()
export class SecuredHttp {
    /**
     * Instance privée de ce helper qui nous aidera à vérifier si
     * un token est expiré ou non.
     */
    private jwt: JwtHelperService = new JwtHelperService();

    /**
     * Ici on a besoin à la fois du service HttpClient pour accéder aux URL non sécurisées
     * (en l'occurence /api/token).
     */
    constructor(private http: HttpClient) {
    }

    /**
     * Cette méthode permet de faire le login en interaction avec le serveur.
     * Elle reçoit en paramètres les credentials de l'utilisateur.
     */
    public login(username, password): Observable<boolean> {
        // headers nécessaire pour le post
        const headers: HttpHeaders = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
        // requête POST non sécurisée pour demander un token
        return this.http.post<any>(URL + 'api/token',
            'pseudo=' + encodeURIComponent(username) +
            '&password=' + encodeURIComponent(password),
            { headers: headers })
            .pipe(
                map(data => {
                    if (data.success) {
                        // si les credentials sont corrects, on reçoit une réponse qui contient le token
                        const token = data.token;
                        console.log('TOKEN_RENEWED');
                        // le login est bon : on stocke les credentials et le token dans le sessionStorage
                        sessionStorage.setItem('pseudo', username);
                        sessionStorage.setItem('password', password);
                        sessionStorage.setItem('id_token', token);
                        return true;
                    } else {
                        return false;
                    }
                }),
                catchError(res => {
                    return of(false);
                })
            );
    }

    /**
     * Pour faire le logout, il suffit de supprimer toutes les infos stockées dans le sessionStorage.
     */
    public logout(): void {
        sessionStorage.removeItem('pseudo');
        sessionStorage.removeItem('password');
        sessionStorage.removeItem('id_token');
    }

    /**
     * On définit les 4 méthodes get, delete, post et put qui correspondent aux 4
     * requêtes HTTP correspondantes. Chacune de ces méthodes se contente d'appeler
     * la méthode call() en lui passant une fonction qui permettra d'exécuter la
     * requêtre HTTP via AuthHttp.
     *
     * Voir rôle de call() ci-dessous.
     */

    public get<T>(url: string, options?: HttpHeaders): Observable<T> {
        return this.call(() => this.http.get(url, { headers: options }));
    }

    public delete<T>(url: string, options?: HttpHeaders): Observable<T> {
        return this.call(() => this.http.delete(url, { headers: options }));
    }

    public post<T>(url: string, body: any, options?: HttpHeaders): Observable<T> {
        return this.call(() => this.http.post(url, body, { headers: options }));
    }

    public put<T>(url: string, body: any, options?: HttpHeaders): Observable<T> {
        return this.call(() => this.http.put(url, body, { headers: options }));
    }

    /**
     * Le but de la méthode call() est de préalablement vérifier si le token existe
     * et s'il n'est pas expiré. S'il est expiré, elle en redemande un nouveau. Ensuite
     * elle exécute la fonction lambda (func) qu'elle a reçue en paramètre et qui, elle,
     * fait réellement appel au serveur via AuthHttp. De cette manière, on peut appeler
     * les méthodes ci-dessus sans se préoccuper de vérifier si le token est encore
     * valide. Cette vérification est faite de manière automatique et transparente pour
     * le code qui utilise ce service.
     */
    private call<T>(func): Observable<T> {
        // Récupère le token depuis le sessionStorage
        const token = sessionStorage.getItem('id_token');
        // Si le token n'existe pas ou s'il est expiré ...
        if (!token || this.jwt.isTokenExpired(token)) {
            const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
            // on demande un nouveau token
            return this.http.post<any>(URL + 'api/token',
                'pseudo=' + encodeURIComponent(sessionStorage.getItem('pseudo')) +
                '&password=' + encodeURIComponent(sessionStorage.getItem('password')),
                { headers: headers }).pipe(
                    // L'opérateur flatMap permet ici d'enchaîner les requêtes en utilisant
                    // le résultat de la première pour effectuer la seconde.
                    // Voir http://stackoverflow.com/a/35268597
                    flatMap(res => {
                        // on reçoit le token du serveur
                        const newToken = res.token;
                        console.log('TOKEN_RENEWED');
                        // on le stocke dans sessionStorage
                        sessionStorage.setItem('id_token', newToken);
                        // on peut maintenant, finalement, faire l'appel à l'API protégée
                        return func();
                    })
                );
        } else {
            // si le token est valide et n'est pas expiré, on peut directement
            // faire appel à l'API protégée
            return func();
        }
    }
}
```

### Le service `AuthService`

Ce petit service offre les méthodes `login()` et `logout()` qui elles-mêmes vont utiliser `SecuredHttp` pour réellement effectuer ces opérations. Le service offre également un *getter* `currentUser` qui permet de savoir quel utilisateur est connecté.

```typescript
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { SecuredHttp } from './securedhttp.service';

@Injectable()
export class AuthService {
    isLoggedIn: boolean;

    // store the URL so we can redirect after logging in
    redirectUrl: string;

    constructor(private secHttp: SecuredHttp) {
        this.isLoggedIn = sessionStorage.getItem('id_token') != null;
    }

    login(username, password): Observable<boolean> {
        return this.secHttp.login(username, password).pipe(
            map(res => {
                this.isLoggedIn = res;
                return res;
            })
        );
    }

    logout(): void {
        this.isLoggedIn = false;
        this.secHttp.logout();
    }

    public get currentUser(): string {
        return sessionStorage.getItem('pseudo');
    }
}
```

### Le composant `LoginComponent`

Ce composant contient un formulaire. En angular, il y a deux manières d'implémenter les *forms* :

* Les *Template-driven forms* ([https://angular.io/guide/forms](https://angular.io/guide/forms))
* Les *Reactive forms* ([https://angular.io/guide/reactive-forms](https://angular.io/guide/reactive-forms))

Une description et un comparatif de ces deux approches est donné dans les URL ci-dessus. Nous avons choisi d'utiliser les reactive forms car elles permettent de simplifier la partie HTML en implémentant la majorité de la logique d'affichage et de validation du côté du code TypeScript.

**src\app\login.component.html**

```html
<div class="row">
    <div class="col-sm-6">
        <h1>Login</h1>
    </div>
</div>
<div class="row">
    <div class="col-sm-10">
        <form class="form-horizontal" [formGroup]="frm" novalidate>
            <div class="form-group" [ngClass]="ctlPseudo.pristine ? null : (ctlPseudo.dirty && ctlPseudo.invalid ? 'has-error' : 'has-success')">
                <div class="col-sm-2">
                    <label class="control-label" for="pseudo">Pseudo</label>
                </div>
                <div class="col-sm-6 help-block">
                    <input #pseudo id="pseudo" class="form-control" type="text" pTextInput formControlName="pseudo">
                    <div class="col-sm-12 help-block" *ngIf="ctlPseudo.dirty && ctlPseudo.invalid">
                        <small *ngIf="ctlPseudo.errors.required">This field is required</small>
                        <small *ngIf="ctlPseudo.errors.minlength">{{'Minimum length is ' + ctlPseudo.errors.minlength.requiredLength}}</small>
                    </div>
                </div>
            </div>
            <div class="form-group" [ngClass]="ctlPassword.pristine ? null : (ctlPassword.dirty && ctlPassword.invalid ? 'has-error' : 'has-success')">
                <div class="col-sm-2">
                    <label class="control-label" for="password">Password</label>
                </div>
                <div class="col-sm-6 help-block">
                    <input id="password" type="password" class="form-control" formControlName="password">
                    <div class="col-sm-12 help-block" *ngIf="ctlPassword.dirty && ctlPassword.invalid">
                        <small *ngIf="ctlPassword.errors.required">This field is required</small>
                        <small *ngIf="ctlPassword.errors.minlength">{{'Minimum length is ' + ctlPassword.errors.minlength.requiredLength}}</small>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <div class="col-sm-offset-2 col-sm-10">
                    <button class="btn dtn-default" type="submit" (click)="login()" [disabled]="frm.invalid">Login</button>
                </div>
            </div>
        </form>
    </div>
</div>
```

Quelques remarques sur ce code :

* Le form est bindé à un attribut `frm` de type `FormGroup` dans la classe associée au composant (voir attribut `formGroup`).

* Chaque champ du formulaire est encapsulé dans une structure de `<DIV>` associés à des classes bootstrap :
  * un `<DIV>` de classe `form-group` qui contient :
    * un `<DIV>` sur 2 colonnes (`class="col-sm-2"`) qui contient :
      * un `<LABEL>` (`class="control-label"`)
    * un `<DIV>` sur 6 colonnes (`class="col-sm-6"`) qui contient :
      * le champ d'input (ex: `<INPUT>`)
      * un `<DIV>` sur 12 colonnes et de classe `help-block` qui contient les éventuelles erreurs :
        * un `<SMALL>` pour chaque erreur. 

* Chaque champ d'input est bindé à un attribut de type `FormControl` dans la classe associée (voir attribut `formControlName`). Ce binding est bidirectionnel. Cela signifie que la valeur affichée dans le champ est toujours synchrone avec la valeur stockée dans le `FormControl` associé au niveau du code.

* Les classes CSS bootstrap et la visibilité des champs sont contrôlés par des conditions dynamiques sur certains attributs des `FormControl` qui sont gérés automatiquement pour vous par angular :
  * attribut `pristine` : signifie que la valeur du champ n'a pas été modifié par l'utilisateur
  * attribut `dirty` : signifie que la valeur du champ a été modifiée par l'utilisateur (c'est le contraire de `pristine`)
  * attribut `invalid` : signifie que la valeur du champ est non valide (voir principe des validations plus loin)
  * attribut `errors` : contient un objet JSON avec la liste des erreurs et les messages d'erreur associés, avec éventuellement des paramètres.

**src\app\login.component.ts**

Voir les commentaires dans le code ci-dessous.

```typescript
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
```

### L'affichage dynamique du menu

Le menu doit être adapté dynamiquement en fonction du fait qu'on est loggué ou pas. Voici les adaptations faites dans le code pour cela :

**src\app\app.component.html**

![](images/image_000011.png)

**src\app\app.component.ts**

![](images/image_000012.png)

### Le composant `LogoutComponent`

Il s'agit ici d'un composant non visuel (son template est vide) qui sera instancié par le routeur quand on clique sur le menu "Logout".

La seule chose qu'il fait, dans son constructeur, c'est d'utiliser `AuthService` pour faire un logout, puis utiliser le routeur pour rediriger vers la page de login.

```typescript
import { Component } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Component({
    template: ''
})

export class LogoutComponent {
    constructor(private authService: AuthService, private router: Router) {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
```

### Le service `AuthGuardService`

Pour que la sécurité soit complète du côté client, il faut aussi la gérer au niveau du routeur. Cela signifie qu'il faut trouver un moyen d'indiquer au routeur que certains URL sont accessibles ou non en fonction du fait qu'on est identifié ou pas.

Pour cela, on définit un service qui implémente une interface particulière `CanActivate`. Grâce à ce service, on peut modifier nos règles de routage pour y introduire des "conditions de garde". Voici ce qu'on trouve à ce sujet dans `app.module.ts` :

![](images/image_000013.png)

On voit que maintenant les routes clientes `logout`, `home` et `members` sont des enfant d'une route parent vide (`path: ''`), mais sur laquelle on applique une condition de garde d'activation : `canActivate: [AuthGuard]`. Grâce à cela, chaque fois qu'on demande d'accéder à une de ces trois URL, le routeur va d'abord évaluer la condition de garde pour voir s'il peut accepter ou non ce routage.

Voici le code du `AuthGuardService` :

```typescript
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const url: string = state.url;
        return this.checkLogin(url);
    }

    checkLogin(url: string): boolean {
        if (this.authService.isLoggedIn) {
            return true;
        }

        // Store the attempted URL for redirecting
        this.authService.redirectUrl = url;

        // Navigate to the login page with extras
        this.router.navigate(['/restricted']);
        return false;
    }
}
```

On peut y voir qu'il contient une méthode `canActivate()` qui sera appelée par le routeur et qui retourne un booléen. Dans notre cas, cette méthode utilise une méthode `checkLogin()` qui, en fonction de ce que lui dit `AuthService` sur l'état du login, va accepter ou non la route demandée. Si la route est refusée, on demande au routeur de faire une redirection vers l'URL `/restricted` qui affichera un message adapté.

Notez qu'au passage on stocke dans `authService.redirectUrl` l'URL demandé. Grâce à cela, on pourra, au prochain login correct, directement redirigé l'utilisateur vers la page qu'il souhaitait atteindre initialement mais dont l'accès lui a été refusé car il n'était pas loggué.

### Composant `RestrictedComponent`

Voici le petit composant qui est affiché quand on essaye d'accéder à une page sécurisée sans être loggué. Elle affiche un message d'erreur, puis redirige automatiquement vers la page de login après 2 secondes.

```typescript
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-restricted',
    template: `
    <h1>Restricted Access</h1>
    <p>You will be redirected automatically to the login page...</p>
    `
})

export class RestrictedComponent implements OnInit {
    constructor(private router: Router) { }

    ngOnInit() {
        setTimeout(() => {
            this.router.navigate(['/login']);
        }, 2000);
    }
}
```

### Autres modifications diverses

**nodemon.json**

Il ne faut "watcher" (observer) que le dossier `server` puisque c'est là que se trouvent tous les codes sources de cette partie de l'application.

```json
{
  "watch": ["server"],
  ...
}
```

**package.json**

Voici les deux packages qu'il faut ajouter à la solution pour JWT.

```
{
  ...
  "dependencies": {
    ...
    "@auth0/angular-jwt": "2.0.0",
    ...
    "jsonwebtoken": "8.3.0",
    ...
  },
  ...
}
```
