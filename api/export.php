<?php
/**
 * API PHP pour l'export des données au format CSV
 */
require_once '../config/database.php';

startSession();

// Vérifier l'authentification
if (!isLoggedIn()) {
    header('Location: ../login.php');
    exit;
}

$pdo = getDBConnection();
$type = $_GET['type'] ?? 'orders';

switch ($type) {
    case 'orders':
        exportOrders($pdo);
        break;
    case 'statistics':
        exportStatistics($pdo);
        break;
    default:
        exportOrders($pdo);
}

/**
 * Exporter les commandes au format CSV
 */
function exportOrders($pdo) {
    // Appliquer les mêmes filtres que la liste
    $search = $_GET['search'] ?? '';
    $status = $_GET['status'] ?? 'all';
    
    $whereConditions = [];
    $params = [];
    
    if (!empty($search)) {
        $whereConditions[] = "(customer LIKE ? OR product LIKE ? OR id LIKE ?)";
        $searchTerm = "%$search%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }
    
    if ($status !== 'all' && in_array($status, ['Pending', 'Processing', 'Delivered', 'Cancelled'])) {
        $whereConditions[] = "status = ?";
        $params[] = $status;
    }
    
    $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
    
    $sql = "SELECT id, customer, product, amount, status, order_date, created_at FROM orders $whereClause ORDER BY id DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $orders = $stmt->fetchAll();
    
    // Définir les headers pour le téléchargement
    $filename = 'orders_export_' . date('Y-m-d_H-i-s') . '.csv';
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    // Ouvrir la sortie
    $output = fopen('php://output', 'w');
    
    // BOM UTF-8 pour Excel
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
    
    // En-têtes du CSV
    fputcsv($output, ['ID', 'Client', 'Produit', 'Montant', 'Statut', 'Date de commande', 'Date de création'], ';');
    
    // Données
    foreach ($orders as $order) {
        fputcsv($output, [
            $order['id'],
            $order['customer'],
            $order['product'],
            number_format($order['amount'], 2, ',', ' ') . ' €',
            $order['status'],
            date('d/m/Y', strtotime($order['order_date'])),
            date('d/m/Y H:i', strtotime($order['created_at']))
        ], ';');
    }
    
    fclose($output);
    exit;
}

/**
 * Exporter les statistiques au format CSV
 */
function exportStatistics($pdo) {
    // Récupérer les statistiques
    $stats = [];
    
    // Revenu total
    $stmt = $pdo->query("SELECT COALESCE(SUM(amount), 0) FROM orders");
    $stats['Revenu total'] = number_format($stmt->fetchColumn(), 2, ',', ' ') . ' €';
    
    // Nombre de commandes
    $stmt = $pdo->query("SELECT COUNT(*) FROM orders");
    $stats['Nombre de commandes'] = $stmt->fetchColumn();
    
    // Clients uniques
    $stmt = $pdo->query("SELECT COUNT(DISTINCT customer) FROM orders");
    $stats['Clients uniques'] = $stmt->fetchColumn();
    
    // Par statut
    $stmt = $pdo->query("SELECT status, COUNT(*) as count, SUM(amount) as total FROM orders GROUP BY status");
    while ($row = $stmt->fetch()) {
        $stats['Commandes ' . $row['status']] = $row['count'];
        $stats['Revenu ' . $row['status']] = number_format($row['total'], 2, ',', ' ') . ' €';
    }
    
    // Définir les headers
    $filename = 'statistics_export_' . date('Y-m-d_H-i-s') . '.csv';
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    $output = fopen('php://output', 'w');
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
    
    fputcsv($output, ['Métrique', 'Valeur'], ';');
    
    foreach ($stats as $key => $value) {
        fputcsv($output, [$key, $value], ';');
    }
    
    fclose($output);
    exit;
}
?>
