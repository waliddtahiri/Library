# Projet PRID1819-TUTO

## Procédure pour installer le projet et passer en revue les différentes versions

### 0. Fichiers de base pour le projet

Téléchargez le fichier [PRID1819.7z](https://bitbucket.org/benoit_penelle/prid1819-tuto/downloads/PRID1819.7z) et décompressez-le dans un dossier d'un disque dur local ou d'un disque dur externe (pas sur une clé USB, ni sur un drive réseau car les performances seront beaucoup trop lentes).

Ouvrez une boîte DOS et placez-vous dans ce dossier `PRID1819`.

### 1. Installation des packages globaux

> **Ce qui est décrit dans cette section est informatif et vous ne devez pas l'exécuter car la version du projet que vous venez de dézipper contient déjà les packages globaux dont vous aurez besoin.**

A l'EPFC vous n'avez pas les droits d'administration de vos machines. En conséquence, vous devez installer les packages globaux dans un sous-dossier spécifique du projet, à savoir `npm-global`. Pour cela, il faut informer npm qu'il doit dorénavant y installer les packages globaux en utilisant la commande :

```
npm config set prefix %~dp0npm-global
```

On peut ensuite installer les packages :

    npm install -g @angular/cli@6.1.3
    npm install -g nodemon@1.18.3
    npm install -g ts-node@7.0.1
    npm install -g typescript@3.0.1

Les commandes qui précèdent sont reprises dans le fichier batch `npm-config.bat`. Il faut ensuite ajouter ce dossier dans le `PATH`, ce que vous ferez en début de chaque script `.bat` ou manuellement dans la console avec la commande :

```
set path=%~dp0npm-global;%path%
```

Pour vérifier la liste des packages installés globallement :

    npm list -g --depth=0

### 2. Cloner le dépôt

Placez-vous dans le dossier `PRID1819` et clonez le dépôt comme suit :

    git clone https://bitbucket.org/benoit_penelle/prid1819-tuto
Ce dossier contient les sources du projet tutoriel que vous allez examiner tout au long de ce cours. Ce projet consiste en plusieurs versions incrémentales grâce auxquelles nous allons introduire progressivement tous les éléments technologiques et les bonnes pratiques liées au développement "MEAN".

### 3. Extraire une version particulière

Se mettre dans le dossier du projet et faire un checkout de la version souhaitée :

    cd prid1819-tuto
    git checkout <commit>

où `<commit>` représente le numéro du commit que l'on souhaite examiner.

### 4. Installer les packages requis pour la version

Certaines versions introduisent de nouveaux packages dans le projet. Pour installer ces packages, faire :

    npm install

Cette commande se base sur le contenu du fichier `package.json` pour déterminer la liste des packages à installer.

Les packages locaux sont installés dans le sous-dossier `node_modules` du projet.

### 5. Exécuter et tester une version

Chaque version est accompagnée d'un fichier `README_VXX.md` (où `XX` désigne le numéro de la version) qui décrit les objectifs de chaque version et donne des indications sur la manière de l'exécuter et de la tester.

A partir de la version 5, il faut faire tourner trois serveurs dans trois terminaux différents : le serveur MongoDB, le serveur node/express et le serveur angular. Pour cela, trois fichiers de commande sont à votre disposition :

    run-mongo.bat
    run-express.bat
    run-angular.bat

Vous pouvez directement lancer les trois serveurs en exécutant simplement le fichier de commande :

    run-servers.bat

### 6. Environnement de développement

Vous utiliserez "Visual Studio Code" (vscode) qui permet d'éditer, d'exécuter et de déboguer le code node/express et le code angular.

Afin de vous permettre de conserver vos configurations de vscode d'une séance de cours à l'autre, vous le lancerez, non pas à partir du menu "Start" de Windows, mais bien en exécutant le batch `vscode.bat`.

Vous aurez besoin d'utiliser quelques "extensions" pour vscode. Ces extensions ont été pré-installées pour vous.
