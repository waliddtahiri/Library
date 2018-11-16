# V14 - Gestion liste des numéros de téléphone

Afin de montrer l'utilisation de relations 0-N, on ajoute le concept de numéros de téléphone pour les membres. Un membre peut donc avoir aucun, un ou plusieurs numéros de téléphone.

## Serveur

```typescript
export interface IMember extends mongoose.Document {
    ...
    phones: [{type: string, number: string}];
}

const memberSchema = new mongoose.Schema({
    ...
    phones: [{type: {type: String, default: ''}, number: {type: String, default: ''}}]
});
```
Ajout dans l'interface et dans le schéma de la propriété `phones` qui est un tableau d'objets. Chaque objet est constitué de 2 strings : une pour le type de numéro (privé, professionnel, gsm, ...), l'autre pour le numéro proprement dit.

## Angular

### Dans la couche Service 

Changement correspondant dans la classe `Member` 

### Composant `edit-member`

Les changements applicatifs se font lors de l'édition d'un membre

#### Template

Le formulaire d'édition d'un membre utilise maintenant une balise  `<mat-tab-group>` afin de créer 2 onglets : l'un pour les données de base, et l'autre pour introduire les numéros de téléphone. Les deux onglets sont regroupés dans un formulaire afin que les boutons *update* et *cancel* soient accessibles dans ces onglets.

Par ailleurs, l'onglet concernant les téléphones est constitué d'une `<div>` dont la classe est définie dans le fichier *css* `edit-member.component.css`.

#### Logique du composant

```typescript
export class EditMemberComponent implements OnInit {
    ...
    public frmPhone: FormGroup;
    ...
    public ctlPhoneType: FormControl;
    public ctlPhoneNumber: FormControl;

    public phones;

    constructor(public dialogRef: MatDialogRef<EditMemberComponent>,
        @Inject(MAT_DIALOG_DATA) public data: Member,
        private fb: FormBuilder,
        private memberService: MemberService,
        private memberCommonService: MemberCommonService) {
        ...
        this.ctlPhoneType = this.fb.control('', []);
        this.ctlPhoneNumber = this.fb.control('', []);
        ...
        this.frmPhone = this.fb.group({
            type: this.ctlPhoneType,
            number: this.ctlPhoneNumber
        });
        ...
        this.phones = _.cloneDeep(data.phones);
    }

```

On constate l'utilisation de deux contrôles et d'un nouveau `FormGroup` pour la gestion des zones d'édition de l'onglet *téléphones*.
Dans le constructeur, on fait une copie profonde (via la fonction `cloneDeep` de la librairie *lodash*) des téléphones du membre.

```typescript
    update() {
        const data = this.frm.value;
        data.phones = this.phones;
        ...
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
```
Lors de l'*update*, on recopie les données de la variable locale `phones` dans la variable générale liée au membre.
Les fonctions `phoneAdd`et `phoneDelete` modifient la variable `phones` et marquent le formulaire comme étant *dirty* (nécessaire car le formulaire ne peut pas *sentir* qu'il a été modifié lors d'un ajout ou retrait d'un élément du tableau des téléphones).

# V15 - Gestion des images des membres

Dans cette version, on montre comment gérer des fichiers liés aux données (ici une image pour un membre).

## Modification des classes de modèle `Member`

Tant sur le serveur que dans l'application cliente, on ajoute une propriété `pircturePath` qui contient le chemin du fichier image stockée sur le serveur (on ne stocke pas directement l'image dans la DB. Cette manière de faire est courante dans les applications Web.)

### Sur le serveur (fichier `member.ts`)

```typescript
export interface IMember extends mongoose.Document {
    ...
    picturePath: string;
    ...
}
```

### Application Angular (fichier `member.service.ts`)

```typescript
export class Member {
    ...
    picturePath: string;
    ...
    constructor(data) {
        ...
        this.picturePath = data.picturePath;
        ...
    }
}
```

La gestion des images est relativement subtile et on va détailler le flux d'information qui passe du client au serveur (et vice-versa).

## 1. Introduction d'une image dans la fiche d'un membre

### Modification du composant `edit-member.component`

Dans le constructeur, initialisation de la variable `tempPicturePath` (ou *undefined* si aucune image n'est associée au membre) :
```typescript
    constructor(public dialogRef: MatDialogRef<EditMemberComponent>,
        @Inject(MAT_DIALOG_DATA) public data: Member,
        private fb: FormBuilder,
        private memberService: MemberService,
        private memberCommonService: MemberCommonService) {
        ...
        this.tempPicturePath = data.picturePath;
    }
```

Dans le *template*, ajout d'un onglet

```typescript
    <mat-tab label="Picture">
        <div class="picture-container">
            <img class="img-responsive" [src]="picturePath" width="200px">
            <input type="file" (change)="fileChange($event)" placeholder="Upload file" accept=".png,.jpg,.gif">
        </div>
    </mat-tab>
```

Dans cet onglet, on ajoute un container pour l'image (balise `<img>`) et pour un bouton permettant de choisir un fichier (balise `<input type="file" ...>`). 

Comme toute balise `<img>`, celle-ci va chercher son image via l'attribut `src`. On "bind" cet attribut à la propriété `picturePath` du composant. Cette propriété est virtuelle (il n'existe pas de variable de ce nom dans le composant) mais, en typescript, on peut configurer un *getter* sur une propriété via le mot clé `get`. Voici donc le *getter* de `picturePath`:

```typescript
    get picturePath(): string {
        // Le compteur updateCounter sert à générer un URL différent quand on change d'image
        // car sinon l'image ne se rafraîchit pas parce que l'url ne change pas.
        return this.tempPicturePath && this.tempPicturePath !== '' ?
            (this.tempPicturePath + '?' + this.updateCounter) : 'uploads/unknown-user.jpg';
    }
```
L'idée étant que, si aucune image n'existe pour le membre, on en propose une par défaut.

Si l'utilisateur choisit une image via le bouton de choix de fichier, il faut qu'elle soit immédiatement visible. Pour cela, il faut immédiatement la transférer au serveur (pour que le balise `<img>` puisse y accéder via l'url stockée dans son attribut `src`). 

```typescript
    fileChange(event) {
        const fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            const file = fileList[0];
            this.memberCommonService.uploadPicture(this.frm.value.pseudo || 'empty', file).subscribe(path => {
                ...
            });
        }
    }
```

Le service `uploadPicture`, auquel on fournit le pseudo du membre ou *empty* si on est en train de créer un nouveau membre, appelle le serveur ...

## 2. Réception sur le serveur de l'image choisie (mais non encore validée)

### Configuration du stockage de fichiers sur le serveur

Les fichiers images seront conservés dans un dossier `uploads`.

Pour la gestion des *uploads*, on a besoin de plusieurs librairies facilitant les opérations de gestion de fichiers.

#### Ajout de middelwares dans `server.ts`

```typescript
    private middleware(): void {
        const staticRoot = path.resolve(__dirname + '/..');
        this.express.use(express.static(staticRoot));
        ...
    }
```

La méthode `static` d'*express* permet d'ajouter le chemin racine à partir duquel on cherchera les ressources statiques utiles à l'application (ici les fichiers images). Dans notre application, ce chemin racine se trouvera au-dessus de celui qui contient le fichier exécuté (`server.ts`). En effet, la variable `__dirname` conserve le chemin du fichier exécuté.

Cette configuration permet de garder dans la propriété `picturePath` uniquement un chemin relatif par rapport à ce chemin racine.

#### Configuration des routes et des actions associées à l'*upload*

Dans le fichier `member-common.router.ts` : ajoute les éléments suivants :

```typescript
const UPLOAD_DIR = './uploads/';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const pseudo = req.body.pseudo;
        cb(null, pseudo + '-' + Date.now());
    }
});
const upload = multer({ storage: storage });
```

La librairie `multer` offre des fonctionnalités pour gérer les *uploads*. Ici, on configure l'objet `storage` avec deux fonctions : une pour le dossier de destination et l'autre pour la gestion des noms de fichiers. Cette dernière donne comme nom de fichier, le pseudo du membre + une valeur de date (et heure). Ensuite l'appel à la fonction *factory* `multer` utilise l'objet de configuration `storage` pour construire l'objet `upload` qui sera utilisé dans la route.

```typescript
    constructor() {
        this.router = Router();
        ...
        this.router.post('/upload', upload.single('picture'), this.upload);
        this.router.post('/confirm', this.confirm);
        this.router.post('/cancel', this.cancel);
    }

```

On configure la route `/upload` de telle sorte que son gestionnaire associé utilise l'objet `upload` en appelant sa méthode `single('picture')`. Celle-ci va chercher le contenu du fichier dans la propriété `picture` de l'objet `req`. Grâce à l'objet de configuration `storage`, elle sait où elle doit enregistrer le fichier sur le disque et sous quel nom. Elle stocke également le fichier dans la propriété `req.file`. Ensuite, on fait appel à `this.upload` qui va récupérer le nom du fichier créé pour le renvoyer au client (avec un remplacement des `\\` en `/`).

```typescript
    public upload(req: Request, res: Response, next: NextFunction) {
        const file = req['file'];
        if (file) {
            const filePath = file.path.replace('\\', '/');
            res.json(filePath);
        } else {
            res.status(500).send('No file received');
        }
    }
```

## 3. Retour dans l'appli Angular

Suite de la méthode `fileChange` (exécution du lambda du *subscribe*) :

```typescript
    fileChange(event) {
        const fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            const file = fileList[0];
            this.memberCommonService.uploadPicture(this.frm.value.pseudo || 'empty', file).subscribe(path => {
                this.cancelTempPicture();
                this.tempPicturePath = path;
                this.frm.markAsDirty();
            });
        }
    }
    ...

    cancelTempPicture() {
        const data = this.frm.value;
        if (this.tempPicturePath && !this.tempPicturePath.endsWith(data.pseudo)) {
            this.memberCommonService.cancelPicture(this.tempPicturePath).subscribe();
        }
    }

```

On commence par remplacer une image éventuelle précédemment choisie mais non validée (méthode `cancelTempPicture`). En effet, on ne veut pas que le serveur garde des fichiers non utiles (non validés). C'est ici que l'ajout de la datation dans le nom du fichier image intervient : toute image validée aura comme nom le pseudo du membre **sans** datation (voir plus bas). Donc si le nom de l'image temporaire ne se termine pas par le pseudo du membre, on supprime cette image via le service `cancelPicture` 

## 4. Suppression d'une image sur le serveur

L'appli *Angular* vient d'appeler la route `/cancel` (via la méthode `cancelPicture`). Voici le code de la méthode associée :
```typescript
    public cancel(req: Request, res: Response, next: NextFunction) {
        const picturePath = req.body.picturePath;
        if (picturePath) {
            const src = path.resolve(__dirname + '/../../' + picturePath);
            fs.removeSync(src);
            res.json(picturePath);
        } else {
            res.status(500).send('No picturePath received');
        }
    }
```
La suppression se fait à l'aide de la librairie `fs` (méthode `removeSync`). 

## 5. Re-retour vers l'appli Angular

Après la suppression (éventuelle) d'une image temporaire sur le serveur, la méthode `fileChange` sauvegarde le chemin de l'image actuellement choisie (sur le poste client) dans la variable `tempPicturePath` et marque le formulaire comme *dirty*.

```typescript
    fileChange(event) {
        const fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            const file = fileList[0];
            this.memberCommonService.uploadPicture(this.frm.value.pseudo || 'empty', file).subscribe(path => {
                ...
                this.tempPicturePath = path;
                this.frm.markAsDirty();
            });
        }
    }
```

Plus tard, si l'utilisateur choisit de faire *cancel*, la méthode `cancelTempPicture` sera ré-appelée et donc l'image temporaire supprimée sur le serveur. Si, par contre, il décide de valider son choix via l'appel à `update` :

```typescript
    update() {
        ...
        if (this.tempPicturePath && !this.tempPicturePath.endsWith(data.pseudo)) {
            this.memberCommonService.confirmPicture(data.pseudo, this.tempPicturePath).subscribe();
            data.picturePath = 'uploads/' + data.pseudo;
        }
        ...
    }
```

A nouveau le test vérifie que l'utilisateur a choisi une nouvelle image (dont le nom ne se termine donc pas par son *pseudo*). Si c'est le cas, un dernier appel au serveur est fait avant de mettre à jour le chemin dans la propriété `data.picturePath`

## 6. Sauvegarde finale sur le serveur

L'appli *Angular* vient d'appeler la route `/confirm` (via la méthode `confirmPicture`). Voici le code de la méthode associée : 

```typescript
    public confirm(req: Request, res: Response, next: NextFunction) {
        const picturePath = req.body.picturePath;
        const pseudo = req.body.pseudo;
        if (picturePath) {
            const filePath = 'uploads/' + pseudo;
            const src = path.resolve(__dirname + '/../../' + picturePath);
            const tgt = path.resolve(__dirname + '/../../' + filePath);
            fs.moveSync(src, tgt, { overwrite: true });
            res.json(filePath);
        } else {
            res.status(500).send('No picturePath received');
        }
    }
```

Deux paramètres sont fournis à cette méthode (via, bien sûr, l'objet `req`) : le *pseudo* du membre et le nom du fichier temporaire. Le code de cette méthode sert à donner le nom définitif (celui se terminant par le *pseudo*) au fichier image.

# V16 - Gestion des relations entre membres et modification de l'image du profil du membre

Dans cette dernière version, on va montrer comment mettre en oeuvre des relations plusieurs à plusieurs. On va illustrer cela en permettant d'avoir des relations de suivi entre membres : un membre peut en suivre un ou plusieurs autres.

Par ailleurs, on va permettre au membre de mettre à jour son image lui-même. 

Commençons par cette dernière fonctionnalité. 

## Modification de l'image par le membre

On va fournir une logique similaire à ce qui est expliqué dans la *V15*. Cependant, cette logique est simplifiée dans la mesure où l'utilisateur pourra choisir son image mais ne pourra pas faire *cancel* comme c'est le cas dans le formulaire d'édition du membre par l'administrateur. 

### Dans l'application Angular

Voici la méthode `fileChange` dans le composant `home.component` :
```typescript
    fileChange(event) {
        const fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            const file: File = fileList[0];
            this.memberCommonService.uploadPicture(this.current.pseudo, file).pipe(
                flatMap(path => this.memberCommonService.confirmPicture(this.current.pseudo, path))
            ).subscribe(path => {
                this.updateCounter++;
                this.current.picturePath = path;
            });
        }
    }
```
On remarque qu'on fait suivre immédiatement l'appel à `uploadPicture` par celui à `confirmPicture` (via le *pipe* et le *flatMap* qui transforme le premier *Observable* en le second). On souscrit à ce dernier *Observable* pour modifier artificiellement la valeur du champ `picturePath` du membre courant afin de forcer un *refresh* du composant.

Remarque : à nouveau la propriété `picturePath` dans le *template* est virtuelle. Voici le *getter* à cette propriété :

```typescript
    get picturePath(): string {
        // Le compteur updateCounter sert à générer un URL différent quand on change d'image
        // car sinon l'image ne se rafraîchit pas parce que l'url ne change pas.
        return this.current && this.current.picturePath !== '' ?
            (this.current.picturePath + '?' + this.updateCounter) : 'uploads/unknown-user.jpg';
    }
```
### Du côté du serveur

Dans le fichier `members-common.router.ts`, on ajoute la route `/` pour un *put*. On associe la méthode `update` ci-dessous :

```typescript
    public async update(req: Request, res: Response, next: NextFunction) {
        if (!req.body.hasOwnProperty('picturePath')) {
            console.error('No picturePath received');
            return;
        }
        try {
            const currentUser = req['decoded'].pseudo;
            const updatedMember = await Member.findOneAndUpdate({ pseudo: currentUser },
                req.body,
                { new: true });  // pour renvoyer le document modifié
            res.json(updatedMember);
        } catch (err) {
            res.status(500).send(err);
        }
    }
```

Cette méthode vérifie que le body de l'objet requête contient bien une propriété `picturePath`. Si c'est le cas, on récupère le pseudo à partir du jeton (afin qu'un utilisateur ne puisse usurper l'identité d'un autre et modifier l'image d'un autre...). Ensuite, la méthode fait un appel asynchrone pour mettre à jour dans la DB et retourne le membre ainsi modifié.

## Gestion des relations de suivi

Pour cette fonctionnalité, on doit une dernière fois modifier le modèle :

### Sur le serveur (fichier `member.ts`) :
```typescript
export interface IMember extends mongoose.Document {
    ...
    followers: mongoose.Types.Array<IMember>;
    followees: mongoose.Types.Array<IMember>;
}

const memberSchema = new mongoose.Schema({
    ...
    followers: [{ type: Schema.Types.ObjectId, ref: 'Member' }],
    followees: [{ type: Schema.Types.ObjectId, ref: 'Member' }]
});
```

Les deux propriétés ajoutées sont des tableaux, de type *référence* de Membre. Pour un membre donné, le tableau de *followers* représentent les membres qui suivent le membre tandis que le tableau de *followees* représentent les membres que le membre suit.

### Angular (fichier `member.service.ts`)

Idem du côté de l'appli Angular :

```typescript
export class Member {
    ...
    followers: Member[];
    followees: Member[];

    constructor(data) {
        ...
        this.followees = data.followees;
        this.followers = data.followers;
    }
}
```

### Gestion des routes

-   Comme les membres non administrateurs doivent connaître (et modifier éventuellement) leurs relations de suivi avec les autres membres, on rappatrie la méthode `getAll` dans le fichier `members-common.router.ts`
-   On associe des gestionnaires aux routes `/follow` et `/unfollow`. Les voici :

```typescript
    public async follow(req: Request, res: Response, next: NextFunction) {
        try {
            const currentUser = req['decoded'].pseudo;
            const [follower, followee] = await Promise.all([
                Member.findOne({ pseudo: currentUser }),
                Member.findOne({ pseudo: req.body.followee })
            ]);
            follower.followees.push(followee);
            followee.followers.push(follower);
            await Promise.all([
                Member.findByIdAndUpdate(followee._id, followee),
                Member.findByIdAndUpdate(follower._id, follower)
            ]);
            res.json(true);
        } catch (err) {
            res.status(500).send(err);
        }
    }

    public async unfollow(req: Request, res: Response, next: NextFunction) {
        try {
            const currentUser = req['decoded'].pseudo;
            const [follower, followee] = await Promise.all([
                Member.findOne({ pseudo: currentUser }),
                Member.findOne({ pseudo: req.body.followee })
            ]);
            follower.followees.remove(followee);
            followee.followers.remove(follower);
            await Promise.all([
                Member.findByIdAndUpdate(followee._id, followee),
                Member.findByIdAndUpdate(follower._id, follower)
            ]);
            res.json(true);
        } catch (err) {
            res.status(500).send(err);
        }
    }
```

Ces deux méthodes fonctionnent de la manière suivante : appel en parallèle (via `Promise.all`) pour retrouver d'une part, l'utilisateur courant (le *suiveur*) et l'attribuer à la variable `follower` et, d'autre part, l'utilisateur *suivi* et attribuer celui-ci à la variable `followee`. Ensuite, lorsque les deux actions sont terminées (c'est la raison du `await`), chacune de ces méthodes fait son travail (`follow` ajoute les liens de suivi via les deux *push* tandis que `unfollow` retire les liens de suivi via les deux *remove*).

### Appli Angular : composant `relationships.component`

La logique de suivi et son rendu dans le template est relativement simple : dans le template, on fait un *switch* sur la valeur retournée par la méthode `getRelationShip(member)`. En fonction du résultat, on affiche la bonne flèche et le bon message.

Dans le composant, voici la méthode en question :

```typescript
    getRelationShip(member: Member): RelationshipType {
        const user = this.authService.currentUser;
        const follower = member.followees.findIndex(m => m.pseudo === user) !== -1;
        const followee = member.followers.findIndex(m => m.pseudo === user) !== -1;
        const mutual = followee && follower;
        if (mutual) {
            return 'mutual';
        } else if (followee) {
            return 'followee';
        } else if (follower) {
            return 'follower';
        } else {
            return 'none';
        }
    }
```

Pour un membre donné, elle cherche s'il apparaît comme *follower* ou *followee* et, en fonction retourne la valeur correspondante.

Les deux méthodes `follow` et `drop` ci-dessous font appel au service correspondant, ce qui se traduira par un appel à la bonne route sur le serveur

```typescript
    follow(member: Member) {
        member.followers.push(this.current);
        this.memberCommonService
            .follow(this.authService.currentUser, member)
            .subscribe(res => this.refresh());
    }

    drop(member: Member) {
        member.followers.splice(member.followers.indexOf(this.current));
        this.memberCommonService
            .unfollow(this.authService.currentUser, member)
            .subscribe(res => this.refresh());
    }
```