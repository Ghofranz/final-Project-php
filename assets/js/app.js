/**
 * Application Dashboard - JavaScript Principal
 * Communication AJAX native avec PHP
 */

const App = {
    // Configuration
    config: {
        apiBaseUrl: 'api/',
        refreshInterval: 10000, // 10 secondes
        itemsPerPage: 10
    },

    // État de l'application
    state: {
        refreshTimer: null,
        autoRefresh: true
    },

    /**
     * Initialisation de l'application
     */
    init() {
        this.initMobileMenu();
        this.initModals();
        console.log('App initialized');
    },

    /**
     * Menu mobile
     */
    initMobileMenu() {
        const toggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        if (!toggle || !sidebar) return;

        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay?.classList.toggle('show');
            document.body.classList.toggle('menu-open');
        });

        overlay?.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
            document.body.classList.remove('menu-open');
        });

        // Fermer avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                overlay?.classList.remove('show');
                document.body.classList.remove('menu-open');
            }
        });
    },

    /**
     * Gestion des modals
     */
    initModals() {
        // Fermer les modals en cliquant à l'extérieur
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    },

    /**
     * Ouvrir un modal
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    },

    /**
     * Fermer un modal
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    },

    /**
     * Requête AJAX native
     * @param {string} url - URL de l'API
     * @param {Object} options - Options de la requête
     * @returns {Promise}
     */
    async ajax(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        const config = { ...defaultOptions, ...options };

        // Ajouter le body si présent
        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(this.config.apiBaseUrl + url, config);
            
            // Vérifier si la réponse est OK
            if (!response.ok) {
                if (response.status === 401) {
                    // Non autorisé - rediriger vers login
                    window.location.href = 'login.php';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erreur AJAX:', error);
            this.showNotification('Erreur de communication avec le serveur', 'error');
            throw error;
        }
    },

    /**
     * GET request
     */
    get(url) {
        return this.ajax(url, { method: 'GET' });
    },

    /**
     * POST request
     */
    post(url, data) {
        return this.ajax(url, { method: 'POST', body: data });
    },

    /**
     * PUT request
     */
    put(url, data) {
        return this.ajax(url, { method: 'PUT', body: data });
    },

    /**
     * DELETE request
     */
    delete(url) {
        return this.ajax(url, { method: 'DELETE' });
    },

    /**
     * Afficher une notification
     */
    showNotification(message, type = 'info') {
        // Supprimer les notifications existantes
        document.querySelectorAll('.notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;

        // Style de la notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 20px',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: '10000',
            animation: 'slideIn 0.3s ease',
            backgroundColor: type === 'success' ? '#d1fae5' : type === 'error' ? '#fee2e2' : '#dbeafe',
            color: type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : '#1e40af'
        });

        document.body.appendChild(notification);

        // Auto-fermeture après 5 secondes
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    },

    /**
     * Formater un montant en devise
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('fr-TN', {
            style: 'currency',
            currency: 'TND',
            minimumFractionDigits: 2
        }).format(amount).replace('TND', '$');
    },

    /**
     * Formater une date
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },

    /**
     * Formater une date relative
     */
    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) return 'À l\'instant';
        if (diffMin < 60) return `Il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
        if (diffHour < 24) return `Il y a ${diffHour} heure${diffHour > 1 ? 's' : ''}`;
        return `Il y a ${diffDay} jour${diffDay > 1 ? 's' : ''}`;
    },

    /**
     * Démarrer le rafraîchissement automatique
     */
    startAutoRefresh(callback) {
        this.stopAutoRefresh();
        if (this.state.autoRefresh) {
            this.state.refreshTimer = setInterval(callback, this.config.refreshInterval);
        }
    },

    /**
     * Arrêter le rafraîchissement automatique
     */
    stopAutoRefresh() {
        if (this.state.refreshTimer) {
            clearInterval(this.state.refreshTimer);
            this.state.refreshTimer = null;
        }
    },

    /**
     * Basculer le rafraîchissement automatique
     */
    toggleAutoRefresh(callback) {
        this.state.autoRefresh = !this.state.autoRefresh;
        if (this.state.autoRefresh) {
            this.startAutoRefresh(callback);
        } else {
            this.stopAutoRefresh();
        }
        return this.state.autoRefresh;
    }
};

// Ajouter les styles d'animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .notification button {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        opacity: 0.7;
    }
    .notification button:hover {
        opacity: 1;
    }
`;
document.head.appendChild(style);

// Initialiser l'application au chargement
document.addEventListener('DOMContentLoaded', () => App.init());

// Exporter pour utilisation globale
window.App = App;
