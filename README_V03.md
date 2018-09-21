# V03 - Accéder à MongoDB via `mongoose`

## Introduction

Mongoose est une librairie qui permet d'associer des schémas de données aux collections stockées dans MongDB et par là de bénéficier de validations sur ces données et de règles d'intégrité similaires à ce qu'on peut trouver dans les bases de données relationnelles.

Pour plus d'informations, voir [http://mongoosejs.com/](http://mongoosejs.com/).

## Objectifs

- définir un schéma pour la collection `members`
- au démarrage du serveur express, ajouter des données de test si la collection `members` est vide
- utiliser mongoose pour faire les opérations CRUDL sur les membres
- création d'une route `/api/members` pour accéder aux données des membres
- restructuration du code

## Tests

Utilisez `postman` ([https://www.getpostman.com/](https://www.getpostman.com/)) pour tester l'API en faisant les requêtes HTTP suivantes. Le fichier [tests.v03.postman_collection](tests.v03.postman_collection) contient ces requêtes et peut être importé dans postman.

Une version de postman est disponible dans l'environnement de projet. Pour la lancer, tapez :

    run-postman.bat

**Rechercher tous les membres :**

    GET http://localhost:3000/api/members

Réponse (remarquez que, assez logiquement, vous obtenez des identifiants différents pour les objets ; ceux-ci sont stockés dans l'attribut `_id`) :

    [
        {
            "_id": "596ce7fac634283e04086021",
            "pseudo": "alain",
            "profile": "Hi, I'm alain!",
            "password": "alain"
        },
        {
            "_id": "596ce7fac634283e0408601e",
            "pseudo": "ben",
            "profile": "Hi, I'm ben!",
            "password": "ben"
        },
        {
            "_id": "596ce7fac634283e04086020",
            "pseudo": "boris",
            "profile": "Hi, I'm boris!",
            "password": "boris"
        },
        {
            "_id": "596ce7fac634283e0408601f",
            "pseudo": "bruno",
            "profile": "Hi, I'm bruno!",
            "password": "bruno"
        },
        {
            "_id": "596ce7fac634283e0408601d",
            "pseudo": "test",
            "profile": "Hi, I'm test!",
            "password": "test"
        }
    ]

**Rechercher un membre sur base de son pseudo :**

    GET http://localhost:3000/api/members/ben

Réponse :

    [
        {
            "_id": "596ce7fac634283e0408601e",
            "pseudo": "ben",
            "profile": "Hi, I'm ben!",
            "password": "ben"
        }
    ]

**Créer un nouveau membre :**

    POST http://localhost:3000/api/members
    Content-Type: application/x-www-form-urlencoded
    Body:
        pseudo:     xxx
        password:   xxx
        profile:    Hi, I'm xxx!

Réponse :

    {
        "__v": 0,
        "pseudo": "xxx",
        "_id": "596ce852c634283e04086022",
        "profile": "Hi, I'm xxx!",
        "password": "xxx"
    }

Si vous postez une deuxième fois, vous recevez l'erreur suivante :

    {
        "code": 11000,
        "index": 0,
        "errmsg": "E11000 duplicate key error collection: msn.members index: pseudo_1 dup key: { : \"xxx\" }",
        "op": {
            "pseudo": "xxx",
            "_id": "596ce867c634283e04086023",
            "profile": "Hi, I'm xxx!",
            "password": "xxx",
            "__v": 0
        }
    }

**Modifier un membre :**

    PUT http://localhost:3000/api/members/xxx
    Content-Type: application/x-www-form-urlencoded
    Body:
        profile:    New profile for xxx!

Réponse :

    {
        "_id": "596ce852c634283e04086022",
        "pseudo": "xxx",
        "__v": 0,
        "profile": "New profile for xxx!",
        "password": "xxx"
    }

**Supprimer un membre :**

    DELETE http://localhost:3000/api/members/xxx

Réponse :

    true
