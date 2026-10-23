# Suivi Carrosserie

Appli simple pour suivre les voitures en carrosserie : entrée au PCL, réparation, finition, contrôle final, lavage, prête. Urgences, retards, messages atelier ↔ deviseur et photos. S'installe sur les tablettes Android depuis Chrome.

## Comment c'est construit

- `public/` : l'écran de l'appli (HTML, CSS, JavaScript). Pas de compilation.
- `public/config.js` : l'adresse du projet Supabase et sa clé publique.
- `supabase/schema.sql` : la base de données (à exécuter une fois dans Supabase).
- `render.yaml` : le Blueprint Render qui met `public/` en ligne.

## Mise en place (une seule fois)

1. **Supabase** : SQL Editor → coller `supabase/schema.sql` → Run.
2. **Supabase** : Authentication → Users → Add user → e-mail + mot de passe de l'atelier (cocher « Auto Confirm User »).
3. **Supabase** : Authentication → Sign In / Providers → Email → désactiver « Allow new users to sign up » (personne d'autre ne peut créer de compte).
4. Mettre l'URL et la clé publishable dans `public/config.js`.
5. **Render** : New → Blueprint → choisir ce dépôt → Apply. L'adresse de l'appli s'affiche (`https://suivi-carrosserie-xxxx.onrender.com`).

## Installer sur une tablette Android

Ouvrir l'adresse dans Chrome → se connecter → menu ⋮ → **Installer l'application**.

## Mettre à jour

Chaque modification poussée sur GitHub est mise en ligne automatiquement par Render.
