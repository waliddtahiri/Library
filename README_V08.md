# V08 - Ajouter la sécurité côté client et serveur

## Objectifs

Côté client :

- ajout d'un composant pour le login et d'un composant pour le logout
- utilisation de la librairie `@auth0/angular-jwt` pour gérer les jetons du côté client (essentiellement pour vérifier s'ils sont expirés)
- création d'une classe `SecuredHttp` qui encapsule la gestion des jetons (demande d'un nouveau si inexistant ou expiré, ajout du jetons dans le header des requêtes http).
- ajout d'une classe `AuthService` qui sert d'interface pour tout ce qui concerne l'authentification
- création de la classe `AuthGuard` qui sert à rendre le routage conditionnel en fonction du fait qu'on est authentifié ou pas.

Côté serveur :

- utilisation de la librairie `jsonwebtoken` pour générer les jetons JWT.
- ajout d'une route `/api/token` pour faire l'authentification et retourner le jeton.
- ajout d'un filtre qui restreint l'accès aux urls de l'api `/api/members` en vérifiant l'existence et la validité du jeton dans les headers http.
