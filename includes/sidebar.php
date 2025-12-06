<?php
/**
 * Template de la sidebar
 * Inclure dans toutes les pages avec: include 'includes/sidebar.php';
 */

require_once __DIR__ . '/../config/database.php';

// Si on passe ?page=xxx dans l'URL (pour les appels via fetch depuis un .html),
// on l'utilise. Sinon, on garde le comportement classique avec PHP_SELF.
$currentPage = isset($_GET['page']) ? $_GET['page'] : basename($_SERVER['PHP_SELF']);

$user = getCurrentUser();
?>

<!-- Mobile Menu Toggle -->
<button class="mobile-menu-toggle" id="mobileMenuToggle" aria-label="Toggle menu">
    <svg viewBox="0 0 24 24" fill="none" stroke-width="2">
        <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
</button>

<!-- Sidebar Overlay -->
<div class="sidebar-overlay" id="sidebarOverlay"></div>

<!-- SIDEBAR -->
<aside class="sidebar" id="sidebar">
    <div class="brand">
        <div class="logo">📊</div>
        <div class="brand__name">My Dashboard</div>
    </div>

    <nav class="nav">
        <a class="nav__item <?php echo $currentPage === 'index.php' ? 'active' : ''; ?>" href="index.php">
            <span class="nav__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
            </span>
            Dashboard
        </a>

        <a class="nav__item <?php echo $currentPage === 'tables.html' ? 'active' : ''; ?>" href="tables.html">
            <span class="nav__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M3 12h18M3 18h18" />
                </svg>
            </span>
            Tables
        </a>

        <a class="nav__item <?php echo $currentPage === 'settings.html' ? 'active' : ''; ?>" href="settings.html">
            <span class="nav__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3" />
                    <path
                        d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
                </svg>
            </span>
            Paramètres
        </a>

        <a class="nav__item <?php echo $currentPage === 'statistics.html' ? 'active' : ''; ?>" href="statistics.html">
            <span class="nav__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 3v18h18" />
                    <path d="M18 17V9M13 17V5M8 17v-3" />
                </svg>
            </span>
            Statistiques
        </a>

        <div class="nav__section">Pages du compte</div>

        <!-- Ici on teste bien 'profile.html' -->
        <a class="nav__item <?php echo $currentPage === 'profile.html' ? 'active' : ''; ?>" href="profile.html">
            <span class="nav__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M3 21a9 9 0 0118 0" />
                </svg>
            </span>
            Profil
        </a>
    </nav>

    <!-- User Info -->
    <?php if ($user): ?>
    <div class="user-info">
        <div class="user-avatar">
            <?php echo strtoupper(substr($user['full_name'], 0, 2)); ?>
        </div>
        <div class="user-details">
            <div class="user-name"><?php echo htmlspecialchars($user['full_name']); ?></div>
            <div class="user-role"><?php echo ucfirst($user['role']); ?></div>
        </div>
        <a href="logout.php" class="logout-btn" title="Déconnexion">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
        </a>
    </div>
    <?php endif; ?>
</aside>