/**
 * SEARCH.JS - Recherche globale dans le dashboard
 */

document.addEventListener('DOMContentLoaded', function() {
    // Sélectionner la barre de recherche dans le header
    const searchInput = document.querySelector('.topbar__right .search input');
    if (!searchInput) {
        console.log('Search input not found');
        return;
    }

    let searchTimeout;
    let resultsContainer;

    // Créer le conteneur de résultats
    function createResultsContainer() {
        resultsContainer = document.createElement('div');
        resultsContainer.className = 'search-results';
        searchInput.parentElement.style.position = 'relative';
        searchInput.parentElement.appendChild(resultsContainer);
    }

    createResultsContainer();

    // Recherche avec debounce
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim();

        if (query.length < 2) {
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
            return;
        }

        searchTimeout = setTimeout(() => performSearch(query), 300);
    });

    // Fermer les résultats si on clique ailleurs
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.style.display = 'none';
        }
    });

    // Focus sur la recherche
    searchInput.addEventListener('focus', function() {
        if (resultsContainer.innerHTML !== '' && this.value.length >= 2) {
            resultsContainer.style.display = 'block';
        }
    });

    // Navigation clavier
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            resultsContainer.style.display = 'none';
            searchInput.blur();
        }
        if (e.key === 'Enter') {
            const firstResult = resultsContainer.querySelector('.search-result-item');
            if (firstResult) {
                window.location.href = firstResult.getAttribute('href');
            }
        }
    });

    // Effectuer la recherche
    async function performSearch(query) {
        resultsContainer.innerHTML = '<div class="search-loading">🔍 Recherche...</div>';
        resultsContainer.style.display = 'block';

        try {
            const response = await fetch('api/search.php?q=' + encodeURIComponent(query));
            
            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }
            
            const result = await response.json();

            if (result.success && result.data && result.data.length > 0) {
                displayResults(result.data, query);
            } else {
                resultsContainer.innerHTML = '<div class="search-no-results">Aucun résultat pour "' + escapeHtml(query) + '"</div>';
            }
        } catch (error) {
            console.error('Erreur recherche:', error);
            resultsContainer.innerHTML = '<div class="search-error">Erreur de recherche</div>';
        }
    }

    // Afficher les résultats
    function displayResults(results, query) {
        const grouped = {
            pages: results.filter(r => r.type === 'page'),
            orders: results.filter(r => r.type === 'order')
        };

        let html = '';

        // Pages
        if (grouped.pages.length > 0) {
            html += '<div class="search-group"><div class="search-group-title">📄 Pages</div>';
            grouped.pages.forEach(item => {
                html += '<a href="' + item.url + '" class="search-result-item">' +
                    '<span class="search-icon">' + item.icon + '</span>' +
                    '<span class="search-text">' + highlightText(item.title, query) + '</span>' +
                '</a>';
            });
            html += '</div>';
        }

        // Commandes
        if (grouped.orders.length > 0) {
            html += '<div class="search-group"><div class="search-group-title">📦 Commandes</div>';
            grouped.orders.forEach(item => {
                html += '<a href="tables.php?search=' + encodeURIComponent(item.customer) + '" class="search-result-item">' +
                    '<div class="search-order-info">' +
                        '<span class="search-customer">' + highlightText(item.customer, query) + '</span>' +
                        '<span class="search-product">' + highlightText(item.product, query) + '</span>' +
                    '</div>' +
                    '<div class="search-order-meta">' +
                        '<span class="search-amount">' + item.amount + ' DT</span>' +
                        '<span class="search-status status-' + item.status.toLowerCase() + '">' + item.status + '</span>' +
                    '</div>' +
                '</a>';
            });
            html += '</div>';
        }

        resultsContainer.innerHTML = html;
    }

    // Surligner le texte recherché
    function highlightText(text, query) {
        if (!text) return '';
        const regex = new RegExp('(' + escapeRegex(query) + ')', 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});

