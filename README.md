# Suivi Carrosserie

Appli simple pour suivre les voitures en carrosserie : entrée au PCL, réparation, finition, contrôle final, lavage, prête. Urgences, retards, messages atelier ↔ deviseur et photos. S'installe sur les tablettes Android depuis Chrome.

## Comment c'est construit

- `docs/` : l'appli (HTML, CSS, JavaScript), mise en ligne par GitHub Pages. Pas de compilation.
- `docs/config.js` : l'adresse du projet Supabase et sa clé publique (prévue pour être publique).
- `supabase/schema.sql` : la base de données (à exécuter une fois dans Supabase).

Les données (voitures, messages, photos) ne sont pas dans ce dépôt : elles sont dans Supabase, protégées par le mot de passe de l'atelier.

## Mise en place (une seule fois)

1. **Supabase** : SQL Editor → coller `supabase/schema.sql` → Run.
2. **Supabase** : Authentication → Users → Add user → e-mail + mot de passe de l'atelier (cocher « Auto Confirm User »).
3. **Supabase** : Authentication → Sign In / Providers → Email → désactiver « Allow new users to sign up ».
4. Mettre l'URL et la clé publishable dans `docs/config.js`.
5. **GitHub** : Settings → Pages → Source « Deploy from a branch » → Branch `main`, dossier `/docs` → Save.
   L'appli est en ligne à `https://<pseudo>.github.io/suivi-carrosserie/` après une minute.

## Installer sur une tablette Android

Ouvrir l'adresse dans Chrome → se connecter → menu ⋮ → **Installer l'application**.

## Mettre à jour

Chaque modification envoyée sur la branche `main` est mise en ligne automatiquement (1 à 2 minutes).
