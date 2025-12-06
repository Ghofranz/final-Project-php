// Debug optionnel
// alert('settings.js chargé');
// console.log('settings.js chargé');

function showSettingsMessage(type, text) {
    const box = document.getElementById('settings-message');
    if (!box) return;

    box.className = 'alert ' + (type === 'success' ? 'alert-success' : 'alert-error');
    box.textContent = text;
    box.style.display = 'block';
}

// Charger la sidebar et activer le bouton mobile
async function loadSidebarSettings() {
    try {
        const res = await fetch('includes/sidebar.php?page=settings.html');
        const html = await res.text();
        const container = document.getElementById('sidebar-container');
        if (container) {
            container.innerHTML = html;

            // Très important : réutiliser le code de app.js
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

// Récupérer le nom de l’utilisateur pour l’afficher en haut (on réutilise profile_data.php)
async function loadUserForSettings() {
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
            return;
        }

        const user = data.user;
        const nameEl = document.getElementById('user-full-name');
        if (nameEl) {
            nameEl.textContent = user.full_name;
        }
    } catch (e) {
        console.error(e);
    }
}

// Soumission du formulaire "changer le mot de passe"
function handlePasswordForm() {
    const form = document.getElementById('password-form');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = new FormData(form);

        try {
            const res = await fetch('change_password.php', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            const type = data.type || (data.success ? 'success' : 'error');
            showSettingsMessage(type, data.message || 'Réponse inconnue.');

            if (data.success) {
                form.reset();
            }
        } catch (e) {
            console.error(e);
            showSettingsMessage('error', 'Erreur lors de la mise à jour du mot de passe.');
        }
    });
}

// Sélection du thème (juste visuel + tu peux ajouter du localStorage plus tard)
function initThemeSelection() {
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.addEventListener('click', function () {
            themeOptions.forEach(o => o.classList.remove('active'));
            this.classList.add('active');

            const theme = this.getAttribute('data-theme');
            // Exemple si tu veux sauvegarder :
            // localStorage.setItem('dashboard-theme', theme);
        });
    });
}

// Sélection de la couleur d’accent
function initColorSelection() {
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', function () {
            colorOptions.forEach(o => o.classList.remove('active'));
            this.classList.add('active');

            const color = this.getAttribute('data-color');
            // Exemple si tu veux sauvegarder :
            // localStorage.setItem('dashboard-color', color);
        });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    loadSidebarSettings();   // charge la sidebar + App.initMobileMenu()
    loadUserForSettings();   // charge juste le nom de l’utilisateur
    handlePasswordForm();    // active le POST vers change_password.php
    initThemeSelection();    // gestion visuelle des thèmes
    initColorSelection();    // gestion visuelle des couleurs
});
