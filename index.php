<?php
/**
 * Dashboard - Page principale
 * Affichage des statistiques avec rafraîchissement AJAX
 */
require_once 'config/database.php';
requireLogin();

$user = getCurrentUser();

// On rend la vue HTML (qui contient le code HTML + les petits bouts de PHP)
include 'dashboard.html';