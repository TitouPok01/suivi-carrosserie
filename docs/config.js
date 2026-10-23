// Connexion à Supabase (la "mémoire commune" de l'appli).
// Ces deux valeurs peuvent être publiques : la sécurité est assurée par la connexion
// (identifiant de l'atelier) et par les règles de la base (voir supabase/schema.sql).
window.APP_CONFIG = {
  supabaseUrl: "https://VOTRE-PROJET.supabase.co",
  supabaseKey: "VOTRE-CLE-PUBLISHABLE"
};
