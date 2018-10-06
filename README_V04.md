# V04 - Ajouter l'application cliente angular

## Objectifs

- ajouter au projet une application cliente angular minimale

## Info

Ici l'application a été créée pour vous. Si vous vouliez le refaire vous-même, voici comment créer cette application :

    mkdir tmp
    cd tmp
    ..\..\npm-global\ng new prid1819-tuto

On déplace ensuite les fichiers créés dans `tmp/prid1819-tuto` dans le dossier du projet en prenant bien soin de fusionner comme il faut les fichiers `package.json` et `.gitignore`.

## Tests

Pour tester l'application angular, lancez la commande :

    run-angular.bat

Votre browser va s'ouvrir sur l'url [http://localhost:4200](http://localhost:4200).

## Gestion des packages node

Par défaut, les packages installés par `npm` sont stockés dans les sous-dossier `node_modules` dans le dossier du projet. Cela signifie que tous les packages sont installés localement pour tous les projets. Or, vous constaterez que la quantité de packages installés pour Angular est énorme (plus de 30 000 fichiers pour un total d'environ 265 MB).

Pour éviter cette redondance, on peut envisager de partager le dossier `node_modules` entre plusieurs projets. Voici comment procéder :

* Déplacez le dossier `node_modules` dans le dossier parent du projet.
* Créez un lien symbolique (sous Windows, ça s'appelle une `junction`) en vous plaçant dans le dossier du projet et en lançant la commande suivante :
    
    ```
    mklink /J node_modules ..\node_modules
    ```

* Il faut encore préciser à Angular qu'il doit suivre les liens symboliques. Pour cela, ajoutez l'option suivante dans le fichier `angular.json` :

    ```json
    {
        ...
        "prid1819-tuto": {
        ...
        "architect": {
            "build": {
            ...
            "options": {
                ...
                "preserveSymlinks": true
            },
            ...
        }
        }
    },
    ...
    }
    ```

Il est possible que vous voyiez apparaître des avertissements comme celui qui suit quand vous lancez angular ; vous pouvez les ignorer :

    WARNING in ./node_modules/@angular/core/fesm5/core.js
    5560:15-36 Critical dependency: the request of a dependency is an expression

La contre-partie évidente de cette manière de faire est que tous les projets qui partagent les packages doivent utiliser les mêmes versions (voir `package.json`).
