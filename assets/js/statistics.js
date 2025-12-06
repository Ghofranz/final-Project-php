/**
 * STATISTICS.JS - Graphiques dynamiques depuis MySQL
 */

/* =========================
   1) Sidebar + User header
   ========================= */

async function loadSidebarStatistics() {
    try {
        // On passe ?page=statistics.html pour activer le lien dans sidebar.php
        const res = await fetch('includes/sidebar.php?page=statistics.html');
        const html = await res.text();
        const container = document.getElementById('sidebar-container');
        if (container) {
            container.innerHTML = html;

            // Réutiliser la logique du menu mobile de app.js
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

async function loadUserForStatistics() {
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

/* =========================
   2) Charts + Stats
   ========================= */

const chartColors = {
    primary: '#667eea',
    blue: '#11cdef',
    green: '#2dce89',
    orange: '#fb6340',
    yellow: '#ffd600',
    red: '#f5365c'
};

let revenueChart, usersChart, statusChart, weekChart, monthChart;

// Fetch API
async function fetchChartData(type) {
    try {
        const response = await fetch(`api/orders.php?action=chart_data&type=${type}`);
        const result = await response.json();
        return result.success ? result.data : null;
    } catch (error) {
        console.error('Erreur:', error);
        return null;
    }
}

async function fetchStats() {
    try {
        const response = await fetch('api/orders.php?action=stats');
        const result = await response.json();
        return result.success ? result.data : null;
    } catch (error) {
        console.error('Erreur stats:', error);
        return null;
    }
}

function formatCurrency(amount) {
    return amount.toLocaleString() + ' DT';
}

// Mettre à jour l'heure de dernière mise à jour
function updateLastRefreshTime() {
    const el = document.getElementById('lastRefreshTime');
    if (el) {
        const now = new Date();
        el.textContent = now.toLocaleTimeString('fr-FR');
    }
}

// Mise à jour des métriques (cartes en haut)
async function updateHeaderStats() {
    const stats = await fetchStats();
    if (!stats) return;

    const revenueEl = document.getElementById('statsRevenueValue');
    if (revenueEl) revenueEl.textContent = formatCurrency(stats.totalRevenue);

    const avgEl = document.getElementById('statsAvgOrderValue');
    if (avgEl) avgEl.textContent = formatCurrency(stats.avgOrder);

    const ordersEl = document.getElementById('statsOrdersValue');
    if (ordersEl) ordersEl.textContent = stats.totalOrders;

    const clientsEl = document.getElementById('statsClientsValue');
    if (clientsEl) clientsEl.textContent = stats.uniqueCustomers;

    updateLastRefreshTime();
}

// Graphique revenus 6 mois
async function initRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    const data = await fetchChartData('monthly_revenue');
    if (!data) return;

    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.label),
            datasets: [{
                data: data.map(d => d.revenue),
                borderColor: chartColors.primary,
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3,
                pointRadius: 5,
                pointBackgroundColor: '#fff',
                pointBorderColor: chartColors.primary,
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

// Graphique clients par mois
async function initUsersChart() {
    const ctx = document.getElementById('usersChart');
    if (!ctx) return;
    const data = await fetchChartData('monthly_users');
    if (!data) return;

    usersChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.label),
            datasets: [{
                data: data.map(d => d.users),
                backgroundColor: chartColors.blue,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true },
                x: { grid: { display: false } }
            }
        }
    });
}

// Graphique statuts (donut)
async function initStatusChart() {
    const ctx = document.getElementById('categoriesChart');
    if (!ctx) return;
    const data = await fetchChartData('status');
    if (!data) return;

    const labels = {
        Delivered:  'Livrée',
        Processing: 'En cours',
        Pending:    'En attente',
        Cancelled:  'Annulée'
    };
    const colors = {
        Delivered:  chartColors.green,
        Processing: chartColors.blue,
        Pending:    chartColors.yellow,
        Cancelled:  chartColors.red
    };

    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => labels[d.status] || d.status),
            datasets: [{
                data: data.map(d => d.count),
                backgroundColor: data.map(d => colors[d.status]),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// Graphique semaine
async function initWeekChart() {
    const ctx = document.getElementById('ordersWeekChart');
    if (!ctx) return;
    const data = await fetchChartData('week');
    if (!data) return;

    weekChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.label),
            datasets: [{
                data: data.map(d => d.count),
                backgroundColor: chartColors.green,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

// Graphique mois
async function initMonthChart() {
    const ctx = document.getElementById('usersMonthChart');
    if (!ctx) return;
    const data = await fetchChartData('month');
    if (!data) return;

    monthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.label),
            datasets: [{
                data: data.map(d => d.count),
                borderColor: chartColors.orange,
                backgroundColor: 'rgba(251,99,64,0.15)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

/**
 * Rafraîchir uniquement les données des charts (pour l'auto-refresh)
 */
async function refreshChartsData() {
    if (revenueChart) {
        const d = await fetchChartData('monthly_revenue');
        if (d) {
            revenueChart.data.datasets[0].data = d.map(x => x.revenue);
            revenueChart.update();
        }
    }
    if (usersChart) {
        const d = await fetchChartData('monthly_users');
        if (d) {
            usersChart.data.datasets[0].data = d.map(x => x.users);
            usersChart.update();
        }
    }
    if (statusChart) {
        const d = await fetchChartData('status');
        if (d) {
            statusChart.data.datasets[0].data = d.map(x => x.count);
            statusChart.update();
        }
    }
    if (weekChart) {
        const d = await fetchChartData('week');
        if (d) {
            weekChart.data.datasets[0].data = d.map(x => x.count);
            weekChart.update();
        }
    }
    if (monthChart) {
        const d = await fetchChartData('month');
        if (d) {
            monthChart.data.datasets[0].data = d.map(x => x.count);
            monthChart.update();
        }
    }
}

/* =========================
   3) Auto-refresh (bouton)
   ========================= */

function initAutoRefresh() {
    const indicator = document.getElementById('autoRefreshIndicator');
    const toggleBtn = document.getElementById('autoRefreshToggle');

    const callback = async () => {
        await updateHeaderStats();
        await refreshChartsData();
    };

    // Si App.* existe (défini dans app.js), on l'utilise
    if (window.App && typeof App.startAutoRefresh === 'function' && typeof App.toggleAutoRefresh === 'function') {
        App.startAutoRefresh(callback);

        if (toggleBtn && indicator) {
            toggleBtn.addEventListener('click', () => {
                const enabled = App.toggleAutoRefresh(callback);

                toggleBtn.classList.toggle('active', enabled);
                indicator.classList.toggle('active', enabled);
                toggleBtn.textContent = enabled ? 'Actif' : 'Pause';
            });
        }
    } else {
        // Fallback simple si jamais App n'est pas dispo
        let enabled = true;
        let intervalId = setInterval(callback, 10000);

        if (toggleBtn && indicator) {
            toggleBtn.addEventListener('click', () => {
                enabled = !enabled;
                if (!enabled) {
                    clearInterval(intervalId);
                    intervalId = null;
                } else {
                    callback();
                    intervalId = setInterval(callback, 10000);
                }
                toggleBtn.classList.toggle('active', enabled);
                indicator.classList.toggle('active', enabled);
                toggleBtn.textContent = enabled ? 'Actif' : 'Pause';
            });
        }
    }
}

/* =========================
   4) Initialisation globale
   ========================= */

document.addEventListener('DOMContentLoaded', async () => {
    // Sidebar + user
    loadSidebarStatistics();
    loadUserForStatistics();

    // Stats + charts init
    await updateHeaderStats();
    await Promise.all([
        initRevenueChart(),
        initUsersChart(),
        initStatusChart(),
        initWeekChart(),
        initMonthChart()
    ]);

    // Auto-refresh + bouton "Actif / Pause"
    initAutoRefresh();
});
