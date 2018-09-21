# V02 - Accéder à MongoDB

## Objectifs

- lancer le serveur mongodb
- créer une base de données et une première "collection" avec des données
- faire des requêtes dans cette collection (avec la console client)
- faire des requêtes dans cette collection (à partir d'express)
- retourner le résultat dans une page html

## Lancer le serveur mongodb

Dans le dossier du projet, créez un dossier vide `db`.

Lancez le serveur MongoDB :

    ..\mongodb\mongod -dbpath db

## Créer une base de données et une première "collection" avec des données

Dans un autre terminal, lancez la console client MongoDB :

    ..\mongodb\mongo

Dans cette console, lancez les commandes suivantes :

1. Créer une base de données `msn` :

        use msn

1. Voir la liste des db's (`msn` pas encore créée car vide) :

        show dbs

1. Voir la db courante et quelques statistiques :

        db.stats()

1. Ajouter un membre dans la collection `members` (et la créer au passage) :

        db.members.insertOne({
            pseudo: "ben",
            password: "ben",
            profile: "Hi, I'm ben!"
        })

## Faire des requêtes dans cette collection (avec la console client)

1. Voir tous les documents de la collection `member` :

        db.members.find()

1. Voir toutes les collections de la db courante :

        show collections

1. Insérer plusieurs documents d'un coup :

        db.members.insert([
            {pseudo: "test", password: "test", profile: "Hi, I'm test!"},
            {pseudo: "bruno", password: "bruno", profile: "Hi, I'm bruno!"},
            {pseudo: "boris", password: "boris", profile: "Hi, I'm boris!"},
            {pseudo: "alain", password: "alain", profile: "Hi, I'm alain!"}
        ])

1. Chercher tous les membres dont le pseudo est "ben" :

        db.members.find({pseudo: 'ben'})

1. Chercher tous les membres dont le pseudo répond à l'expression régulière    `/^b/i` :

        db.members.find({pseudo: /b/i})

## Faire des requêtes dans cette collection (à partir d'express)

Voir code

## Retourner le résultat dans une page html

Tester l'URL [http://localhost:3000/](http://localhost:3000/) et vérifier que la réponse ressemble à :

    [{"_id":"596cbaf0ea475fcebe28e2dd","pseudo":"ben","password":"ben","profile":"Hi, I'm ben!"},{"_id":"596cbc55ea475fcebe28e2de","pseudo":"test","password":"test","profile":"Hi, I'm test!"},{"_id":"596cbc55ea475fcebe28e2df","pseudo":"bruno","password":"bruno","profile":"Hi, I'm bruno!"},{"_id":"596cbc55ea475fcebe28e2e0","pseudo":"boris","password":"boris","profile":"Hi, I'm boris!"},{"_id":"596cbc55ea475fcebe28e2e1","pseudo":"alain","password":"alain","profile":"Hi, I'm alain!"}]

## Utiliser NoSQLBooster pour accéder à la base de données

Lancez le programme NoSQLBooster :

        .\run-nosqlbooster.bat
