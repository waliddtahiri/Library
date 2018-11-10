# V09 - Ajouter Angular Material et une directive intéressante

## Angular Material

A partir de cette version, on va utiliser intensément la librairie `Angular Material (https://material.angular.io)` pour construire des interfaces graphiques riches. Grâce à cette librairie, le développement des templates HTML sera simplifié.

Le composant `login.component` devient 
```html
<form class="form" [formGroup]="frm" novalidate>
    <h1 class="header">Login</h1>
    <mat-form-field>
        <input matInput placeholder="Pseudo" [formControl]="pseudo" required appSetFocus>
        <mat-error class="float-right" *ngIf="pseudo.hasError('required')">Required</mat-error>
        <mat-error class="float-right" *ngIf="pseudo.hasError('minlength')">Minimum length is {{pseudo.errors['minlength'].requiredLength}}</mat-error>
    </mat-form-field>
    <mat-form-field>
        <input type="password" matInput placeholder="Password" [formControl]="password" required>
        <mat-error class="float-right" *ngIf="password.hasError('required')">Required</mat-error>
        <mat-error class="float-right" *ngIf="password.hasError('minlength')">Minimum length is {{password.errors['minlength'].requiredLength}}</mat-error>
    </mat-form-field>
    <div>
        <button mat-stroked-button (click)="login()" [disabled]="frm.invalid">Login</button>
    </div>
    <div [ngClass]="'alert alert-' + (message.includes('failed') ? 'danger' : 'info')">{{message}}</div>
</form>
```

On voit l'utilisation de la balise `<mat-form-field>` qui "emballe" un `TextField`. Elle permet d'associer un label, ainsi que des zones pour les messages de validation.
De même, grâce à *Material*, on donne un style au bouton login`.

## Directive

En Angular, on peut construire ses propres directives qui servent à personnaliser l'aspect ou le comportement d'un élément du template HTML.
Pour ce faire, on annote une classe avec `@Directive`.
Ici, on crée une directive permettant de donner le focus à un élément quelconque.

```typescript
import { Directive, AfterViewInit, OnInit } from '@angular/core';
import { ElementRef } from '@angular/core';

@Directive({
    selector: '[appSetFocus]'
})
export class SetFocusDirective implements OnInit {

    constructor(private el: ElementRef) {
    }

    ngOnInit() {
        this.el.nativeElement.focus();
    }
}
```

Dans le template, on utilise cette directive en ajoutant `appSetFocus` à l'élément `input` :

```<input matInput placeholder="Pseudo" [formControl]="pseudo" required``` **appSetFocus** ```>```

# V10 - Ajout du rôle *admin*

Dans cette version, on ajoute le rôle *admin* : seul ce dernier a accès à la liste des membres. 
Pour cela, plusieurs modifications sont nécessaires.

Sur le serveur:
- Ajout du champ *admin* dans le schéma. Par ailleurs, on en profite pour créer une interface `IMember`, ce qui permet de paramétrer le type `Member` exporté dans le fichier `member.ts`.
- Ajout de la classe `MembersCommonRouter` qui sert à servir toute requête provenant d'un user loggé. Le seul service que rend cette classe est de donner le nombre de membres existants.
- Dans la classe `AuthentificationRouter`, ajout du *middleware* `checkAdmin` qui sert à filtrer les accès pour les *admins* (voir l'ordre d'utilisation des middlewares dans la méthode `routes` de la classe `Server`).

Côté client:
- Ajout de la classe `MemberCommonService` qui sert à interroger `MembersCommonRouter` du serveur.
- Ajout à la classe `Member` du champ `admin`
- Ajout de la classe `AdminGuard` qui gère les accès (côté client) à la partie réservée aux *admins* (voir configuration des routes dans le module de l'application).
- Refactoring des composants afin de montrer d'office le nombre de membres existants pour tout utilisateur loggé, et suppression de tests liés aux versions précédentes.

# V11 - Restructuration des dossiers

Côté client, création d'un dossier par composant. Ce qui est la bonne manière de structurer une application Angular.

# V12 - Liste des membres sous forme de table Material

Dans cette version, la liste des membres est affichée sous forme d'une table. On utilise pour cela des composants de Angular Material qui permettent d'afficher des colonnes pour des actions (edition, delete - non encore implémentées dans cette version), un paginateur, etc ...

Dans le composant `MemberListComponent`, on définit la source de données, le tableau des colonnes à afficher, un paginateur, ainsi qu'une fonctionnalité de filtre : la méthode `applyFilter` associe la valeur filtrée au filtre de la source de données.

Dans le template, on configure le binding vers les variables du composant.

# V13 - CRUD des membres + gestion de la date de naissance

Dans les schémas (côté serveur et client), on ajoute le champ `birthdate`.

Dans l'application Angular :
- Nouveau composant : `EditMemberComponent` qui sert aux opérations CRUD pour un membre. Il sera utilisé par le composant `MemberListComponent` qui l'ouvrira comme une boîte de dialogue. `EditMemberComponent` reçoit (via injection) une référence vers la boîte de dialogue associée, ce qui lui permettra de demander la fermeture de celle-ci (dans les méthodes `update` et `cancel`).

- Utilisation du composant prédéfini de Angular Material `MatSnackBar`. Ce composant permet d'être affiché un temps déterminé en affichant un message et puis de disparaître. Le code suivant, la méthode `delete` de `MemberListComponent` explique le fonctionnement du *snackBar* :
```typescript
    private delete(member: Member) {
        const backup = this.dataSource.data;
        this.dataSource.data = _.filter(this.dataSource.data, m => m._id !== member._id);
        const snackBarRef = this.snackBar.open(`Member '${member.pseudo}' will be deleted`, 'Undo', { duration: 10000 });
        snackBarRef.afterDismissed().subscribe(res => {
            if (!res.dismissedByAction) {
                this.memberService.delete(member).subscribe();
            } else {
                this.dataSource.data = backup;
            }
        });
    }

```
La méthode `open` ouvre le *snackBar* avec, comme premier paramètre le message indiquant quel membre a été supprimé. Le deuxième paramètre indique le message du bouton d'annulation et le troisième paramètre est un objet contenant la durée d'affichage du snackBar. Ensuite, on configure le comportement si l'utilisateur a cliqué sur *Undo* : restauration du membre via la variable `backup` qui contient la liste initiale avant suppression.

**Remarque** : pour supprimer un membre, on filtre les données du *dataSource* en excluant le membre sélectionné. Pour cela, on utilise une librairie très utile : `lodash (https://lodash.com)`. Cette librairie contient de nombreuses fonctions pour gérer des listes. Ici on appelle la fonction `filter`. 

Puisque le membre est supprimé du *dataSource*, on voit le résultat directement à l'écran. Mais ce n'est que 10 secondes plus tard (dans notre cas) que la suppression effective se fait sur le serveur (via l'appel à `memberService.delete`).

- Toujours dans le composant `MemberListComponent`, méthode `edit` :
```typescript
    private edit(member: Member) {
        const dlg = this.dialog.open(EditMemberComponent, { data: member });
        dlg.beforeClose().subscribe(res => {
            if (res) {
                _.assign(member, res);
            }
        });
    }
```
Juste avant la fermeture de la boîte de dialogue, on assigne à l'objet `member` toutes les propriétés de l'objet `res` reçu à l'aide de la fonction `assign` de la librairie `lodash`. Comme cela, les modifications sont visibles directement après la fermeture de la boîte de dialogue. 

Mais la logique effective de mise à jour ou (d'ajout d'un nouveau membre) se fait dans le composant `EditMemberComponent`, méthode `update` :
```typescript
    update() {
        const data = this.frm.value;
        if (data._id === undefined) {
            this.memberService.add(data).subscribe(m => data._id = m._id);
        } else {
            this.memberService.update(data).subscribe();
        }
        this.dialogRef.close(data);
    }
```
Appel aux fonctions de `memberService`. Une particularité importante : la méthode `add` de `memberService` reçoit un objet (de type `Membre`). Angular attribue automatiquement la valeur *null* pour la propriété `_id` du nouvel objet. Ceci pose un problème côté serveur pour *Mongo*. Si une valeur (même *null*) est attribué à cette propriété, *Mongo* n'attribuera pas de valeur générée. Donc, dans la méthode `create` (sur le serveur), on retire la propriété `_id` avant de créer et sauver le membre. De cette façon, *Mongo* génère bien un identifiant valide.
```typescript
    public async create(req: Request, res: Response, next: NextFunction) {
        // _id vient avec la valeur nulle d'angular (via reactive forms) => on doit l'enlever pour qu'il reçoive une valeur
        delete req.body._id;
        try {
            const member = new Member(req.body);
            const newMember = await member.save();
            res.json(newMember);
        } catch (err) {
            res.status(500).send(err);
        }
    }
``` 

C'est pour cela qu'au retour de l'appel au serveur, dans la fonction `update`, on ré-attribue la bonne valeur à la propriété `_id` :
```typescript
    this.memberService.add(data).subscribe(m => data._id = m._id);
```

- Dans le template de `MemberListComponent`, on affiche la date de naissance en utilisant un *pipe* pour gérer le format d'affichage :
```html
                <ng-container matColumnDef="birthdate">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header> BirthDate </th>
                    <td mat-cell *matCellDef="let row"> {{row.birthdate | date:'dd/MM/yyyy'}} </td>
                </ng-container>
```