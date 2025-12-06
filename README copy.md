# 📊 Dashboard PHP/MySQL - Mini-Projet

Dashboard interactif développé en **HTML, CSS, JavaScript natif et PHP** avec une base de données **MySQL**.

## ✨ Fonctionnalités

### Communication JavaScript ↔ PHP (AJAX natif)
- ✅ Envoi de formulaires via JavaScript vers PHP (création de commandes)
- ✅ Rafraîchissement de sections de page avec données PHP (statistiques)
- ✅ Lecture de données MySQL via appels JS → PHP (liste des commandes)
- ✅ Mise à jour et suppression de données via AJAX

### Fonctionnalités principales
- ✅ **Tri dynamique** des colonnes du tableau
- ✅ **Filtrage** par recherche textuelle et statut
- ✅ **Pagination** côté serveur
- ✅ **Graphiques interactifs** avec Chart.js (local)
- ✅ **Rafraîchissement périodique** automatique (toutes les 10 secondes)

### Fonctionnalités PHP
- ✅ **Lecture/écriture** des données dans MySQL
- ✅ **Authentification** via sessions PHP
- ✅ **Export CSV** des données

## 🗂 Structure du projet

```
dashboard-php/
├── config/
│   ├── database.php          # Configuration PDO + fonctions auth
│   └── init_database.sql     # Script d'initialisation MySQL
├── api/
│   ├── orders.php            # API REST-like pour les commandes
│   └── export.php            # Export CSV
├── includes/
│   └── sidebar.php           # Template de navigation
├── assets/
│   ├── css/
│   │   ├── global.css        # Styles globaux
│   │   ├── dashboard.css     # Styles dashboard
│   │   ├── tables.css        # Styles tableaux
│   │   └── statistics.css    # Styles statistiques
│   └── js/
│       ├── app.js            # JavaScript principal (AJAX)
│       ├── dashboard.js      # Logique dashboard
│       ├── tables.js         # Logique tableaux CRUD
│       └── statistics.js     # Logique graphiques
├── index.php                 # Dashboard principal
├── login.php                 # Page de connexion
├── logout.php                # Déconnexion
├── tables.php                # Gestion des commandes
├── statistics.php            # Graphiques et stats
├── settings.php              # Paramètres
├── profile.php               # Profil utilisateur
└── README.md                 # Documentation
```

## 🚀 Installation

### Prérequis
- PHP 7.4+ avec PDO MySQL
- MySQL 5.7+ ou MariaDB
- Serveur web (Apache, Nginx, ou serveur PHP intégré)

### Étapes d'installation

1. **Cloner/Copier le projet** dans votre répertoire web
   ```bash
   # Exemple avec XAMPP
   cp -r dashboard-php /var/www/html/
   # ou
   cp -r dashboard-php C:/xampp/htdocs/
   ```

2. **Créer la base de données**
   ```bash
   mysql -u root -p < config/init_database.sql
   ```
   
   Ou via phpMyAdmin : importer le fichier `config/init_database.sql`

3. **Configurer la connexion** (si nécessaire)
   
   Éditer `config/database.php` :
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'dashboard_db');
   define('DB_USER', 'root');
   define('DB_PASS', ''); // Votre mot de passe
   ```

4. **Lancer le serveur**
   ```bash
   # Avec le serveur PHP intégré
   cd dashboard-php
   php -S localhost:8000
   
   # Ou accéder via Apache/XAMPP
   # http://localhost/dashboard-php/
   ```

5. **Se connecter**
   - URL : `http://localhost:8000/login.php`
   - Identifiants de démo :
     - Utilisateur : `admin` ou `ghofran`
     - Mot de passe : `password`

## 📡 API Endpoints

### GET `/api/orders.php`

| Action | Paramètres | Description |
|--------|-----------|-------------|
| `list` | `page`, `limit`, `search`, `status`, `sort`, `direction` | Liste paginée |
| `get` | `id` | Détails d'une commande |
| `stats` | - | Statistiques globales |
| `chart_data` | `type` (week/month/status) | Données pour graphiques |

### POST `/api/orders.php`
Créer une nouvelle commande (JSON body)

### PUT `/api/orders.php`
Modifier une commande (JSON body avec `id`)

### DELETE `/api/orders.php?id=X`
Supprimer une commande

### GET `/api/export.php`
| Type | Description |
|------|-------------|
| `orders` | Export CSV des commandes |
| `statistics` | Export CSV des statistiques |

## 🔐 Authentification

L'authentification utilise les **sessions PHP** :

```php
// Démarrer la session
session_start();

// Vérifier la connexion
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

// Récupérer l'utilisateur
$user = getCurrentUser();
```

## 🔄 Communication AJAX (JavaScript natif)

Exemple de requête GET :
```javascript
const response = await fetch('api/orders.php?action=list');
const data = await response.json();
```

Exemple de requête POST :
```javascript
const response = await fetch('api/orders.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer: 'Test', product: 'Item', amount: 100 })
});
```

## 📊 Rafraîchissement automatique

Les statistiques et graphiques se rafraîchissent automatiquement toutes les 10 secondes :

```javascript
setInterval(() => {
    loadStatistics();
    loadChartData();
}, 10000);
```

## 🛠 Technologies utilisées

- **Frontend** : HTML5, CSS3, JavaScript ES6+ (Vanilla)
- **Backend** : PHP 7.4+ (PDO)
- **Base de données** : MySQL / MariaDB
- **Graphiques** : Chart.js 4.4
- **Aucun framework** utilisé (conforme aux exigences du projet)

## 📝 Licence

Projet académique - Mini-projet Dashboard PHP/MySQL

---

**Auteur** : Projet de démonstration
**Version** : 1.0.0
