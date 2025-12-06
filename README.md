# Dashboard PHP – Gestion des commandes (PHP / MySQL / AJAX)

Application de tableau de bord en PHP avec authentification par sessions, gestion de commandes MySQL, profils utilisateurs, statistiques dynamiques et graphiques Chart.js.  
Frontend en HTML/CSS/JS (Fetch API) et backend en PHP 8 + PDO/MySQL. 

---

## 1. Fonctionnalités principales

- **Authentification**
  - Connexion via `login.php` (sessions PHP)
  - Déconnexion via `logout.php`
  - Accès protégé : toutes les pages sensibles utilisent `requireLogin()` (dans `config/database.php`) pour rediriger vers `login.php` si l’utilisateur n’est pas connecté.

- **Dashboard (index.php / dashboard.html)**
  - Affichage des métriques globales (revenus totaux, nombre de commandes, nouveaux clients, commande moyenne).
  - Rafraîchissement périodique des statistiques via AJAX (`api/orders.php?action=stats`).
  - Interface responsive avec sidebar et bouton de menu mobile.

- **Gestion des commandes (tables.html / tables.js)**
  - Liste paginée et filtrable (recherche texte + filtre par statut).
  - Actions de modification / suppression via modale.
  - Chargement / sauvegarde des données via `api/orders.php` (CRUD complet).
  - Export CSV via `api/export.php?type=orders`.

- **Statistiques avancées (statistics.html / statistics.js)**
  - Graphiques Chart.js (revenus mensuels, utilisateurs mensuels, répartition des statuts de commande, commandes semaine / mois).
  - Données récupérées dynamiquement via `api/orders.php?action=chart_data&type=...`.
  - Indicateur de rafraîchissement automatique (toutes les 10 secondes).

- **Profil utilisateur (profile.html / profile.js)**
  - Affichage du profil : nom complet, email, rôle, initiales, statistiques personnelles (commandes, montants, date d’inscription).
  - Mise à jour du profil (nom complet, email) via `update_profile.php` (Fetch POST).
  - Les données sont chargées via `profile_data.php` (retour JSON).

- **Paramètres / Mot de passe (settings.html / change_password.php / settings.js)**
  - Changement de mot de passe (vérification de l’ancien mot de passe, hash du nouveau).
  - Quelques options d’interface (thème, couleur d’accent) gérées côté front (démonstration).

- **Recherche globale (search.js / api/search.php)**
  - Barre de recherche en haut des pages.
  - Requête AJAX vers `api/search.php` pour retrouver rapidement des commandes (ou d’autres entités selon ton implémentation).

- **UI responsive moderne**
  - Layout type “dashboard SaaS” (sidebar, topbar, cartes, graphiques).
  - CSS centralisé dans `assets/css/global.css` + feuilles spécifiques par page.

---

## 2. Architecture / arborescence

```text
project-root/
│
├── api/
│   ├── orders.php          # API JSON pour les commandes (CRUD + stats + données graphiques)
│   ├── export.php          # Export CSV (commandes / statistiques)
│   └── search.php          # API de recherche globale
│
├── assets/
│   ├── css/
│   │   ├── global.css      # Styles globaux (layout, sidebar, boutons, etc.)
│   │   ├── login.css       # Page de connexion
│   │   ├── dashboard.css   # Page Dashboard
│   │   ├── profile.css     # Page Profil
│   │   ├── settings.css    # Page Paramètres
│   │   ├── statistics.css  # Page Statistiques
│   │   └── tables.css      # Page Tables
│   │
│   └── js/
│       ├── app.js          # Objet App (AJAX générique, menu mobile, notifications)
│       ├── dashboard.js    # Logique spécifique au dashboard (stats temps réel)
│       ├── profile.js      # Chargement / mise à jour du profil
│       ├── settings.js     # Gestion paramètres + changement de mot de passe
│       ├── statistics.js   # Initialisation et rafraîchissement des graphiques Chart.js
│       └── tables.js       # CRUD commandes + pagination + filtres
│
├── config/
│   └── database.php        # Connexion PDO, helpers de session (startSession, isLoggedIn, requireLogin, getCurrentUser, getDBConnection, etc.)
│
├── includes/
│   └── sidebar.php         # Template PHP de la sidebar (utilisé partout)
│
├── dashboard.html          # Vue HTML du dashboard (incluse par index.php)
├── index.php               # Entrée principale authentifiée (include 'dashboard.html')
│
├── login.html              # Formulaire de connexion (frontend)
├── login.php               # Traitement de la connexion (PHP : vérif user + password_verify + session)
├── logout.php              # Déconnexion (session_destroy + redirection)
│
├── profile.html            # Vue Profil (frontend, charge sidebar et données en JS)
├── profile_data.php        # API JSON qui renvoie { success, user, stats, session }
├── update_profile.php      # API JSON pour mettre à jour full_name / email
│
├── settings.html           # Vue Paramètres (frontend)
├── change_password.php     # Traitement du changement de mot de passe
│
├── statistics.html         # Vue Statistiques (frontend)
├── tables.html             # Vue Tables / Liste des commandes
│
└── README.md               # (ce fichier)
