# V05 - Affiche la liste des membres dans angular

## Objectifs

- modifier l'application angular pour qu'elle affiche la liste des membres dans une page HTML en utilisant l'API du serveur express.

## Tests

Dans trois terminaux **différents**, lancez les commandes suivantes :

Terminal 1 :

    run-mongo

Terminal 2 :

    run-express

Terminal 3 :

    run-angular

La commande `run-angular` lance le serveur angular et ouvre le browser pour afficher la page d'accueil de l'application (`index.html`).

## Debogage

Il est possible de déboguer pas-à-pas à la fois le code serveur (express) et le code client (angular). Pour vous en convaincre, placez des points d'arrêts à la première ligne de la méthode `getAll()` de `members.router.ts` et à la première ligne de la méthode `getAll()` de `member.service.ts`.

Ensuite, dans l'onglet `Debug` de Visual Studio Code (`Ctrl-Shift-D`), lancez d'abord le débogueur Express, puis celui d'Angular. Une nouvelle instance de Chrome s'ouvre et vous affiche la page d'accueil. Vous devriez pouvoir déboguer.
