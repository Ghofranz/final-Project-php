<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/5c631a13-e692-4eb5-97d4-43faeef3801c" /># Dashboard PHP – Gestion des commandes (PHP / MySQL / AJAX)

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

📸 Screenshots

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/523e24db-93eb-4093-a724-68f5ae899f24" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/edadc651-0ef3-466a-8692-c8dfd596786e" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/8193c4b5-30e9-437b-99aa-0b121f665c7a" /><img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/95913d70-5eb6-4700-b570-9f1970714b1d" />

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/632a13b4-6399-4eed-9128-7a9edc10dae8" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/2140b271-0a56-45ac-ab13-12e3ffae0777" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/4e85c228-4842-4262-bf1a-b636afdb1939" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/e50ff6cb-ae3a-4bc2-a52c-cb5cf75af376" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/91f33900-beeb-403d-94a3-827d0ccc78f8" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/3db5760e-d17d-43e1-a9fd-8393421108cd" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/4b0b757b-f652-482c-946b-c9fcb47ed4be" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/11514a43-6658-4fbf-8dd4-97bd596a1d53" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/ac45e1b5-1532-4744-917f-fa72c067850b" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/7b55e9ce-3ad4-48df-81cd-8becba968cf6" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/5aa3a71e-26cb-4f72-adcb-d6a8592510d8" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/ab12dd0c-4e8e-40b0-b7af-09ee4f566351" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/fafc8c13-089d-41e2-b37a-f1c7a975c0e5" />
<img width="873" height="931" alt="image" src="https://github.com/user-attachments/assets/86a746bb-9b52-4975-9d14-2a20f106d9de" />
<img width="873" height="931" alt="image" src="https://github.com/user-attachments/assets/fc774aa2-024b-48e1-9288-125d6c36a556" />
<img width="891" height="932" alt="image" src="https://github.com/user-attachments/assets/ed3cca71-5ad2-47b5-b244-f6633bed770b" />
<img width="882" height="939" alt="image" src="https://github.com/user-attachments/assets/db251034-7202-44c2-a17b-090a90ab94be" />















