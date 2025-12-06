/**
 * Dashboard JavaScript
 * Rafraîchissement automatique des données via AJAX
 */

const Dashboard = {
    /**
     * Initialisation
     */
    init() {
        this.loadStatistics();
        this.initNewOrderModal();
        this.initQuickActions();
        
        // Rafraîchissement automatique toutes les 10 secondes
        App.startAutoRefresh(() => this.loadStatistics());
    },

    /**
     * Charger les statistiques depuis PHP
     */
    async loadStatistics() {
        try {
            const response = await App.get('orders.php?action=stats');
            
            if (response.success) {
                this.updateStats(response.data);
                this.updateLastActivity(response.data.lastOrder);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error);
        }
    },

    /**
     * Mettre à jour les cartes de statistiques
     */
    updateStats(data) {
        // Revenu total
        const revenueEl = document.getElementById('statRevenue');
        if (revenueEl) {
            revenueEl.textContent = App.formatCurrency(data.totalRevenue);
        }

        // Nombre de commandes
        const ordersEl = document.getElementById('statOrders');
        if (ordersEl) {
            ordersEl.textContent = data.totalOrders.toLocaleString();
        }

        // Clients uniques
        const clientsEl = document.getElementById('statClients');
        if (clientsEl) {
            clientsEl.textContent = '+' + data.uniqueCustomers.toLocaleString();
        }

        // Commande moyenne
        const avgEl = document.getElementById('statAvgOrder');
        if (avgEl) {
            avgEl.textContent = App.formatCurrency(data.avgOrder);
        }

        // Mettre à jour l'indicateur de dernière mise à jour
        const refreshTime = document.getElementById('lastRefresh');
        if (refreshTime) {
            refreshTime.textContent = new Date().toLocaleTimeString('fr-FR');
        }
    },

    /**
     * Mettre à jour la dernière activité
     */
    updateLastActivity(lastOrder) {
        if (!lastOrder) return;

        const titleEl = document.querySelector('.activity-item .activity-title');
        const amountEl = document.querySelector('.activity-item .activity-amount');
        const timeEl = document.querySelector('.activity-item .activity-time');

        if (titleEl) {
            titleEl.textContent = `Nouvelle commande #${lastOrder.id}`;
        }
        if (amountEl) {
            amountEl.textContent = '+' + App.formatCurrency(lastOrder.amount);
        }
        if (timeEl) {
            timeEl.textContent = App.formatRelativeTime(lastOrder.created_at);
        }
    },

    /**
     * Initialiser le modal de nouvelle commande
     */
    initNewOrderModal() {
        const newOrderBtn = document.getElementById('newOrderBtn');
        const modal = document.getElementById('newOrderModal');
        const cancelBtn = document.getElementById('cancelNewOrder');
        const form = document.getElementById('newOrderForm');

        if (!newOrderBtn || !modal) return;

        // Ouvrir le modal
        newOrderBtn.addEventListener('click', () => {
            App.openModal('newOrderModal');
            // Définir la date par défaut à aujourd'hui
            const dateInput = document.getElementById('orderDate');
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
        });

        // Fermer le modal
        cancelBtn?.addEventListener('click', () => {
            App.closeModal('newOrderModal');
            form?.reset();
        });

        // Soumettre le formulaire
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createOrder(form);
        });
    },

    /**
     * Créer une nouvelle commande via AJAX
     */
    async createOrder(form) {
        const formData = new FormData(form);
        const data = {
            customer: formData.get('customer'),
            product: formData.get('product'),
            amount: parseFloat(formData.get('amount')) || 0,
            status: formData.get('status'),
            order_date: formData.get('order_date')
        };

        // Validation basique
        if (!data.customer || !data.product) {
            App.showNotification('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

        try {
            const response = await App.post('orders.php', data);
            
            if (response.success) {
                App.showNotification('Commande créée avec succès!', 'success');
                App.closeModal('newOrderModal');
                form.reset();
                this.loadStatistics(); // Rafraîchir les stats
            } else {
                App.showNotification(response.error || 'Erreur lors de la création', 'error');
            }
        } catch (error) {
            App.showNotification('Erreur de connexion au serveur', 'error');
        }
    },

    /**
     * Initialiser les actions rapides
     */
    initQuickActions() {
        // Export CSV
        const exportBtn = document.getElementById('exportDataBtn');
        exportBtn?.addEventListener('click', () => {
            window.location.href = 'api/export.php?type=orders';
        });

        // Bouton de synchronisation
        const syncBtn = document.getElementById('syncBtn');
        syncBtn?.addEventListener('click', () => {
            this.loadStatistics();
            App.showNotification('Données synchronisées', 'success');
        });
    }
};

// Initialiser au chargement de la page
document.addEventListener('DOMContentLoaded', () => Dashboard.init());
