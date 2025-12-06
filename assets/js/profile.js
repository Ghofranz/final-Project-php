// Debug optionnel
// alert('profile.js chargé');
// console.log('profile.js chargé');

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showMessage(type, text) {
    const box = document.getElementById('profile-message');
    if (!box) return;

    box.className = 'alert ' + (type === 'success' ? 'alert-success' : 'alert-error');
    box.textContent = text;
    box.style.display = 'block';
}

// On passe ?page=profile.html pour que le lien "Profil" soit bien actif
async function loadSidebar() {
    try {
        const res = await fetch('includes/sidebar.php?page=profile.html');
        const html = await res.text();
        const container = document.getElementById('sidebar-container');
        if (container) {
            container.innerHTML = html;

            // 🔴 Très important : ré-initialiser le menu mobile de app.js
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

async function loadProfile() {
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
        if (!data.success) {
            showMessage('error', data.message || 'Erreur chargement profil.');
            return;
        }

        const user  = data.user;
        const stats = data.stats;

        // Avatar / nom / rôle
        const initials = (user.full_name || '?').substring(0, 2).toUpperCase();
        const avatarEl = document.getElementById('profile-avatar');
        const nameEl   = document.getElementById('profile-name');
        const roleEl   = document.getElementById('profile-role');

        if (avatarEl) avatarEl.textContent = initials;
        if (nameEl)   nameEl.textContent   = user.full_name;
        if (roleEl)   roleEl.textContent   = capitalize(user.role) + ' / ' + user.email;

        // Stats
        const ordersEl = document.getElementById('stat-orders');
        const amountEl = document.getElementById('stat-amount');
        const sinceEl  = document.getElementById('stat-member-since');

        if (ordersEl) ordersEl.textContent = stats.orders_count;
        if (amountEl) amountEl.textContent =
            '$' + Math.round(stats.total_amount).toLocaleString('en-US');

        const date = new Date(user.created_at);
        if (sinceEl) {
            sinceEl.textContent =
                isNaN(date.getTime()) ? user.created_at : date.toLocaleDateString('fr-FR');
        }

        // Formulaire
        const usernameInput  = document.getElementById('username');
        const fullNameInput  = document.querySelector('input[name="full_name"]');
        const emailInput     = document.querySelector('input[name="email"]');
        const roleInput      = document.getElementById('role');

        if (usernameInput) usernameInput.value = user.username;
        if (fullNameInput) fullNameInput.value = user.full_name;
        if (emailInput)    emailInput.value    = user.email;
        if (roleInput)     roleInput.value     = capitalize(user.role);

        // Infos compte
        const userIdEl    = document.getElementById('user-id');
        const sessionIdEl = document.getElementById('session-id');

        if (userIdEl)    userIdEl.textContent    = '#' + user.id;
        if (sessionIdEl) sessionIdEl.textContent = (data.session?.id_preview || '...') + '...';

    } catch (e) {
        console.error(e);
        showMessage('error', 'Erreur lors du chargement du profil.');
    }
}

async function handleProfileForm() {
    const form = document.getElementById('profile-form');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = new FormData(form);

        try {
            const res = await fetch('update_profile.php', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            const type = data.type || (data.success ? 'success' : 'error');
            showMessage(type, data.message || 'Réponse inconnue.');

            if (data.success && data.user) {
                const user = data.user;

                const nameEl = document.getElementById('profile-name');
                const roleEl = document.getElementById('profile-role');
                const avatarEl = document.getElementById('profile-avatar');

                if (nameEl) nameEl.textContent = user.full_name;
                if (roleEl) roleEl.textContent =
                    capitalize(user.role) + ' / ' + user.email;

                const initials = (user.full_name || '?').substring(0, 2).toUpperCase();
                if (avatarEl) avatarEl.textContent = initials;

                const fullNameInput = document.querySelector('input[name="full_name"]');
                const emailInput    = document.querySelector('input[name="email"]');
                if (fullNameInput) fullNameInput.value = user.full_name;
                if (emailInput)    emailInput.value    = user.email;
            }
        } catch (e) {
            console.error(e);
            showMessage('error', 'Erreur lors de la mise à jour du profil.');
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    loadSidebar();      // charge la sidebar puis App.initMobileMenu()
    loadProfile();      // charge les données du profil
    handleProfileForm();// gère le submit du formulaire
});
