<?php
/**
 * API de recherche globale
 */
require_once '../config/database.php';

startSession();

header('Content-Type: application/json; charset=utf-8');

// Vérifier authentification
if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'message' => 'Non autorisé']);
    exit;
}

$query = isset($_GET['q']) ? trim($_GET['q']) : '';

if (strlen($query) < 2) {
    echo json_encode(['success' => false, 'message' => 'Requête trop courte', 'data' => []]);
    exit;
}

$results = [];

// 1. Recherche dans les pages
$pages = [
    ['title' => 'Dashboard', 'url' => 'index.php', 'icon' => '🏠', 'keywords' => 'accueil home tableau bord'],
    ['title' => 'Commandes', 'url' => 'tables.php', 'icon' => '📦', 'keywords' => 'orders liste commandes'],
    ['title' => 'Tables', 'url' => 'tables.php', 'icon' => '📋', 'keywords' => 'tableau données data'],
    ['title' => 'Statistiques', 'url' => 'statistics.php', 'icon' => '📊', 'keywords' => 'stats graphiques charts analytics'],
    ['title' => 'Paramètres', 'url' => 'settings.php', 'icon' => '⚙️', 'keywords' => 'settings configuration options'],
    ['title' => 'Profil', 'url' => 'profile.php', 'icon' => '👤', 'keywords' => 'profile compte user utilisateur'],
];

// Utiliser strtolower au lieu de mb_strtolower
$queryLower = strtolower($query);
foreach ($pages as $page) {
    $searchable = strtolower($page['title'] . ' ' . $page['keywords']);
    if (strpos($searchable, $queryLower) !== false) {
        $results[] = [
            'type' => 'page',
            'title' => $page['title'],
            'url' => $page['url'],
            'icon' => $page['icon']
        ];
    }
}

// 2. Recherche dans les commandes
try {
    $pdo = getDBConnection();
    $searchTerm = '%' . $query . '%';
    $stmt = $pdo->prepare("
        SELECT id, customer, product, amount, status, order_date 
        FROM orders 
        WHERE customer LIKE ? OR product LIKE ?
        ORDER BY order_date DESC
        LIMIT 10
    ");
    $stmt->execute([$searchTerm, $searchTerm]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($orders as $order) {
        $results[] = [
            'type' => 'order',
            'id' => $order['id'],
            'customer' => $order['customer'],
            'product' => $order['product'],
            'amount' => number_format($order['amount'], 2, ',', ' '),
            'status' => $order['status'],
            'date' => $order['order_date']
        ];
    }
} catch (PDOException $e) {
    error_log("Search DB error: " . $e->getMessage());
}

echo json_encode(['success' => true, 'data' => $results]);