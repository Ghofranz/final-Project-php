/**
 * Tables JavaScript
 * Gestion des commandes avec AJAX natif
 * Tri, filtrage, pagination côté serveur
 */
// Charger la sidebar pour la page Tables
async function loadSidebarTables() {
    try {
        // IMPORTANT : on passe ?page=tables.html pour que le lien soit "active"
        const res = await fetch('includes/sidebar.php?page=tables.html');
        const html = await res.text();
        const container = document.getElementById('sidebar-container');
        if (container) {
            container.innerHTML = html;

            // Rebrancher le bouton mobile (code dans app.js)
            if (window.App && typeof App.initMobileMenu === 'function') {
                App.initMobileMenu();
            } else {
                console.warn('App.initMobileMenu non disponible');
            }
        }
    } catch (e) {
        console.error('Erreur chargement sidebar', e);
    }
}

// Charger le nom de l'utilisateur pour le header
async function loadUserForTables() {
    try {
        const res = await fetch('profile_data.php');

        if (!res.ok) {
            if (res.status === 401) {
                window.location.href = 'login.php';
                return;
            }
            throw new Error('Erreur HTTP ' + res.status);
        }

        const data = await res.json();
        if (data.success && data.user) {
            const el = document.getElementById('user-full-name');
            if (el) el.textContent = data.user.full_name;
        }
    } catch (e) {
        console.error(e);
    }
}

/*-----------------------------------------------------*/
const Tables = {
    // État
    state: {
        currentPage: 1,
        itemsPerPage: 10,
        search: '',
        status: 'all',
        sortColumn: 'id',
        sortDirection: 'desc',
        editingOrderId: null
    },

    /**
     * Initialisation
     */
    init() {
        this.initFilters();
        this.initSorting();
        this.initEditModal();
        this.loadOrders();
    },

    /**
     * Charger les commandes depuis PHP
     */
    async loadOrders() {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;

        // Afficher le loader
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="loading">
                    <div class="spinner"></div>
                </td>
            </tr>
        `;

        try {
            const params = new URLSearchParams({
                action: 'list',
                page: this.state.currentPage,
                limit: this.state.itemsPerPage,
                search: this.state.search,
                status: this.state.status,
                sort: this.state.sortColumn,
                direction: this.state.sortDirection
            });

            const response = await App.get(`orders.php?${params}`);
            
            if (response.success) {
                this.renderTable(response.data);
                this.renderPagination(response.pagination);
            } else {
                this.showError(response.error || 'Erreur lors du chargement');
            }
        } catch (error) {
            this.showError('Erreur de connexion au serveur');
        }
    },

    /**
     * Afficher le tableau
     */
    renderTable(orders) {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;

        if (orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="empty-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 3h18a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1z"/>
                                <path d="M3 9h18M9 21V9"/>
                            </svg>
                            <h3>Aucune commande trouvée</h3>
                            <p>Modifiez vos filtres ou créez une nouvelle commande</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = orders.map(order => `
            <tr data-id="${order.id}">
                <td>
                    <input type="checkbox" class="order-checkbox" data-id="${order.id}">
                </td>
                <td><strong>#${order.id}</strong></td>
                <td>
                    <div class="customer-cell">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(order.customer)}" 
                             alt="Avatar" class="avatar">
                        <span class="customer-name">${this.escapeHtml(order.customer)}</span>
                    </div>
                </td>
                <td>${this.escapeHtml(order.product)}</td>
                <td><strong>${App.formatCurrency(order.amount)}</strong></td>
                <td>
                    <span class="status-badge status-${order.status.toLowerCase()}">
                        ${order.status}
                    </span>
                </td>
                <td>${App.formatDate(order.order_date)}</td>
                <td>
                    <button class="action-btn view" title="Voir" onclick="Tables.viewOrder(${order.id})">👁️</button>
                    <button class="action-btn edit" title="Modifier" onclick="Tables.editOrder(${order.id})">✏️</button>
                    <button class="action-btn delete" title="Supprimer" onclick="Tables.deleteOrder(${order.id})">🗑️</button>
                </td>
            </tr>
        `).join('');
    },

    /**
     * Afficher la pagination
     */
    renderPagination(pagination) {
        const info = document.getElementById('rowsInfo');
        const pagesContainer = document.getElementById('paginationPages');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');

        if (!pagination) return;

        const { currentPage, totalPages, totalItems, itemsPerPage } = pagination;
        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);

        // Info
        if (info) {
            if (totalItems === 0) {
                info.textContent = 'Aucune commande';
            } else {
                info.textContent = `Affichage ${startItem}–${endItem} sur ${totalItems}`;
            }
        }

        // Boutons précédent/suivant
        if (prevBtn) {
            prevBtn.disabled = currentPage <= 1;
            prevBtn.onclick = () => {
                if (currentPage > 1) {
                    this.state.currentPage = currentPage - 1;
                    this.loadOrders();
                }
            };
        }

        if (nextBtn) {
            nextBtn.disabled = currentPage >= totalPages;
            nextBtn.onclick = () => {
                if (currentPage < totalPages) {
                    this.state.currentPage = currentPage + 1;
                    this.loadOrders();
                }
            };
        }

        // Numéros de page
        if (pagesContainer) {
            pagesContainer.innerHTML = '';
            
            // Afficher max 5 pages autour de la page courante
            let startPage = Math.max(1, currentPage - 2);
            let endPage = Math.min(totalPages, currentPage + 2);

            if (startPage > 1) {
                this.addPageButton(pagesContainer, 1, currentPage);
                if (startPage > 2) {
                    pagesContainer.innerHTML += '<span style="padding: 0 8px;">...</span>';
                }
            }

            for (let p = startPage; p <= endPage; p++) {
                this.addPageButton(pagesContainer, p, currentPage);
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    pagesContainer.innerHTML += '<span style="padding: 0 8px;">...</span>';
                }
                this.addPageButton(pagesContainer, totalPages, currentPage);
            }
        }
    },

    /**
     * Ajouter un bouton de page
     */
    addPageButton(container, page, currentPage) {
        const btn = document.createElement('button');
        btn.className = `page-btn${page === currentPage ? ' active' : ''}`;
        btn.textContent = page;
        btn.onclick = () => {
            this.state.currentPage = page;
            this.loadOrders();
        };
        container.appendChild(btn);
    },

    /**
     * Initialiser les filtres
     */
    initFilters() {
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const filterBtn = document.getElementById('filterBtn');

        // Recherche avec debounce
        let searchTimeout;
        searchInput?.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.state.search = e.target.value;
                this.state.currentPage = 1;
                this.loadOrders();
            }, 300);
        });

        // Filtre de statut
        statusFilter?.addEventListener('change', (e) => {
            this.state.status = e.target.value;
            this.state.currentPage = 1;
            this.loadOrders();
        });

        // Bouton de filtre
        filterBtn?.addEventListener('click', () => {
            this.state.currentPage = 1;
            this.loadOrders();
        });
    },

    /**
     * Initialiser le tri
     */
    initSorting() {
        const headers = document.querySelectorAll('th[data-sort]');
        
        headers.forEach(th => {
            th.classList.add('sortable');
            th.addEventListener('click', () => {
                const column = th.dataset.sort;
                
                // Mettre à jour la direction
                if (this.state.sortColumn === column) {
                    this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this.state.sortColumn = column;
                    this.state.sortDirection = 'asc';
                }

                // Mettre à jour les classes CSS
                headers.forEach(h => {
                    h.classList.remove('asc', 'desc');
                });
                th.classList.add(this.state.sortDirection);

                this.state.currentPage = 1;
                this.loadOrders();
            });
        });
    },

    /**
     * Voir les détails d'une commande
     */
    async viewOrder(id) {
        try {
            const response = await App.get(`orders.php?action=get&id=${id}`);
            
            if (response.success) {
                const order = response.data;
                alert(`Commande #${order.id}\n\nClient: ${order.customer}\nProduit: ${order.product}\nMontant: ${App.formatCurrency(order.amount)}\nStatut: ${order.status}\nDate: ${App.formatDate(order.order_date)}`);
            }
        } catch (error) {
            App.showNotification('Erreur lors du chargement', 'error');
        }
    },

    /**
     * Ouvrir le modal d'édition
     */
    async editOrder(id) {
        try {
            const response = await App.get(`orders.php?action=get&id=${id}`);
            
            if (response.success) {
                const order = response.data;
                this.state.editingOrderId = id;

                // Remplir le formulaire
                document.getElementById('editCustomer').value = order.customer;
                document.getElementById('editProduct').value = order.product;
                document.getElementById('editAmount').value = order.amount;
                document.getElementById('editStatus').value = order.status;
                document.getElementById('editDate').value = order.order_date;

                App.openModal('editOrderModal');
            }
        } catch (error) {
            App.showNotification('Erreur lors du chargement', 'error');
        }
    },

    /**
     * Initialiser le modal d'édition
     */
    initEditModal() {
        const cancelBtn = document.getElementById('cancelEdit');
        const saveBtn = document.getElementById('saveEdit');

        cancelBtn?.addEventListener('click', () => {
            App.closeModal('editOrderModal');
            this.state.editingOrderId = null;
        });

        saveBtn?.addEventListener('click', async () => {
            await this.saveOrder();
        });
    },

    /**
     * Sauvegarder les modifications
     */
    async saveOrder() {
        if (!this.state.editingOrderId) return;

        const data = {
            id: this.state.editingOrderId,
            customer: document.getElementById('editCustomer').value,
            product: document.getElementById('editProduct').value,
            amount: parseFloat(document.getElementById('editAmount').value) || 0,
            status: document.getElementById('editStatus').value,
            order_date: document.getElementById('editDate').value
        };

        try {
            const response = await App.put('orders.php', data);
            
            if (response.success) {
                App.showNotification('Commande mise à jour!', 'success');
                App.closeModal('editOrderModal');
                this.state.editingOrderId = null;
                this.loadOrders();
            } else {
                App.showNotification(response.error || 'Erreur lors de la mise à jour', 'error');
            }
        } catch (error) {
            App.showNotification('Erreur de connexion', 'error');
        }
    },

    /**
     * Supprimer une commande
     */
    async deleteOrder(id) {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer la commande #${id} ?`)) {
            return;
        }

        try {
            const response = await App.delete(`orders.php?id=${id}`);
            
            if (response.success) {
                App.showNotification('Commande supprimée', 'success');
                this.loadOrders();
            } else {
                App.showNotification(response.error || 'Erreur lors de la suppression', 'error');
            }
        } catch (error) {
            App.showNotification('Erreur de connexion', 'error');
        }
    },

    /**
     * Afficher une erreur dans le tableau
     */
    showError(message) {
        const tbody = document.getElementById('ordersTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="alert alert-error" style="margin: 20px;">
                            ${this.escapeHtml(message)}
                        </div>
                    </td>
                </tr>
            `;
        }
    },

    /**
     * Échapper le HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => Tables.init());
//-------------------------------
document.addEventListener('DOMContentLoaded', () => {
    loadSidebarTables();
    loadUserForTables();
});
