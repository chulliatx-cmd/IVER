# Journal du chiot

Petite app web pour noter les pipis, cacas, repas et siestes du chiot, à deux.

- **Accueil** : dernier pipi (avec rappel « Sortir bientôt »), totaux du jour, pipis sur 7 jours, événements du jour.
- **Ajouter** : type, heure (bouton « Maintenant »), dehors / accident, quantité de repas, début et fin de sieste, qui note, note libre.
- **Historique** : toutes les entrées par jour, avec suppression.

Aucune installation : ce sont des fichiers HTML/CSS/JS statiques.

## 1. Personnaliser

Ouvrez `config.js` et changez le nom du chiot, vos prénoms, initiales et couleurs.

## 2. Mettre en ligne avec GitHub Pages

1. Sur GitHub : **Settings › Pages**.
2. *Source* : « Deploy from a branch », branche `main`, dossier `/ (root)`. Enregistrez.
3. Après une minute, l'app est sur `https://<votre-pseudo>.github.io/<nom-du-depot>/chiot/`.
4. Sur le téléphone, ouvrez ce lien puis « Ajouter à l'écran d'accueil » : elle s'ouvre comme une app.

## 3. Partager les données entre vos deux téléphones (Firebase, gratuit)

Sans cette étape, l'app marche en **mode local** : chaque téléphone garde ses propres données.

1. Allez sur <https://console.firebase.google.com>, **Créer un projet** (Google Analytics inutile).
2. Menu **Build › Firestore Database › Créer une base de données**, mode production, région `europe-west`.
3. Onglet **Règles**, collez puis publiez :
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /journals/{journal}/events/{id} {
         allow read, write: if true;
       }
     }
   }
   ```
4. **Paramètres du projet** (roue dentée) › *Vos applications* › icône `</>` (Web) › enregistrez l'app.
   Copiez `apiKey`, `authDomain`, `projectId`, `appId` dans `config.js` à la place de `firebase: null`.
5. Dans `config.js`, remplacez `journalId` par une suite de lettres au hasard (c'est la « clé » de votre journal).
6. Poussez sur GitHub. L'accueil affiche « Synchronisé » : tout ce que l'un note apparaît chez l'autre en direct.

> Les règles ci-dessus ne demandent pas de mot de passe : quelqu'un qui connaîtrait à la fois votre config
> Firebase et votre `journalId` pourrait lire ou écrire. Pour un journal de chiot c'est acceptable ;
> gardez juste un `journalId` difficile à deviner.

## Tester sur l'ordinateur

```bash
cd chiot && python3 -m http.server 8000
```
puis ouvrez <http://localhost:8000>.
