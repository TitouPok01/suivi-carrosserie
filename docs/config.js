// Connexion à Supabase (la "mémoire commune" de l'appli).
// Ces deux valeurs peuvent être publiques : la sécurité est assurée par la connexion
// (identifiant de l'atelier) et par les règles de la base (voir supabase/schema.sql).
window.APP_CONFIG = {
  supabaseUrl: "https://lhbufaoiumslovbdxesm.supabase.co",
  supabaseKey: "sb_publishable_yzzb6Ap8xL5eZFZC62MjaA_d5gMOQtC",
  // Clé publique des notifications (la clé privée est uniquement dans Supabase)
  vapidPublicKey: "BKEug6BqISqlRL55OZvgtLtRGoGPMZJS6L391zDruETyjSZKUdQ2bUnWpEJiw77n02dSZagNJquXebPMJzTBizc"
};
