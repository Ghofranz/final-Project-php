<?php
/**
 * API PHP pour la gestion des commandes
 * communication JS <-> PHP via AJAX natif
 */
require_once '../config/database.php';

// Démarrer la session et vérifier l'authentification
startSession();

header('Content-Type: application/json; charset=utf-8');

// Vérifier si l'utilisateur est connecté
if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Non autorisé. Veuillez vous connecter.']);
    exit;
}

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'GET':
            handleGetRequest($pdo, $action);
            break;
        case 'POST':
            handlePostRequest($pdo, $action);
            break;
        case 'PUT':
            handlePutRequest($pdo);
            break;
        case 'DELETE':
            handleDeleteRequest($pdo);
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur serveur: ' . $e->getMessage()]);
}

/**
 * Gérer les requêtes GET
 */
function handleGetRequest($pdo, $action) {
    switch ($action) {
        case 'list':
            getOrdersList($pdo);
            break;
        case 'get':
            getOrderById($pdo);
            break;
            case 'chart_data':
        $type = $_GET['type'] ?? 'week';
        
        if ($type === 'week') {
            $stmt = $pdo->query("
                SELECT DATE(order_date) as date, COUNT(*) as count, SUM(amount) as revenue
                FROM orders WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                GROUP BY DATE(order_date) ORDER BY date
            ");
            $data = $stmt->fetchAll();
            $result = [];
            $days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
            for ($i = 6; $i >= 0; $i--) {
                $date = date('Y-m-d', strtotime("-$i days"));
                $dayName = $days[date('N', strtotime($date)) - 1];
                $found = array_filter($data, fn($r) => $r['date'] === $date);
                $row = $found ? array_values($found)[0] : null;
                $result[] = ['label' => $dayName, 'count' => $row ? (int)$row['count'] : 0, 'revenue' => $row ? (float)$row['revenue'] : 0];
            }
            echo json_encode(['success' => true, 'data' => $result]);
        } elseif ($type === 'month') {
            $stmt = $pdo->query("
                SELECT DATE(order_date) as date, COUNT(*) as count
                FROM orders WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
                GROUP BY DATE(order_date) ORDER BY date
            ");
            $data = $stmt->fetchAll();
            $result = [];
            for ($i = 29; $i >= 0; $i--) {
                $date = date('Y-m-d', strtotime("-$i days"));
                $found = array_filter($data, fn($r) => $r['date'] === $date);
                $row = $found ? array_values($found)[0] : null;
                $result[] = ['label' => date('j', strtotime($date)), 'count' => $row ? (int)$row['count'] : 0];
            }
            echo json_encode(['success' => true, 'data' => $result]);
        } elseif ($type === 'status') {
            $stmt = $pdo->query("SELECT status, COUNT(*) as count FROM orders GROUP BY status");
            echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        } elseif ($type === 'monthly_revenue') {
            $stmt = $pdo->query("
                SELECT DATE_FORMAT(order_date, '%Y-%m') as month, SUM(amount) as revenue
                FROM orders WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                GROUP BY month ORDER BY month
            ");
            $data = $stmt->fetchAll();
            $months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
            $result = [];
            for ($i = 5; $i >= 0; $i--) {
                $key = date('Y-m', strtotime("-$i months"));
                $found = array_filter($data, fn($r) => $r['month'] === $key);
                $row = $found ? array_values($found)[0] : null;
                $result[] = ['label' => $months[date('n', strtotime("-$i months")) - 1], 'revenue' => $row ? (float)$row['revenue'] : 0];
            }
            echo json_encode(['success' => true, 'data' => $result]);
        } elseif ($type === 'monthly_users') {
            $stmt = $pdo->query("
                SELECT DATE_FORMAT(order_date, '%Y-%m') as month, COUNT(DISTINCT customer) as users
                FROM orders WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                GROUP BY month ORDER BY month
            ");
            $data = $stmt->fetchAll();
            $months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
            $result = [];
            for ($i = 5; $i >= 0; $i--) {
                $key = date('Y-m', strtotime("-$i months"));
                $found = array_filter($data, fn($r) => $r['month'] === $key);
                $row = $found ? array_values($found)[0] : null;
                $result[] = ['label' => $months[date('n', strtotime("-$i months")) - 1], 'users' => $row ? (int)$row['users'] : 0];
            }
            echo json_encode(['success' => true, 'data' => $result]);
        }
        break;
        case 'stats':
            getStatistics($pdo);
            break;
        case 'chart_data':
            getChartData($pdo);
            break;
        default:
            getOrdersList($pdo);
    }
}

/**
 * Récupérer la liste des commandes avec filtres, tri et pagination
 */
function getOrdersList($pdo) {
    // Paramètres de filtrage
    $search = $_GET['search'] ?? '';
    $status = $_GET['status'] ?? 'all';
    $sortColumn = $_GET['sort'] ?? 'id';
    $sortDirection = $_GET['direction'] ?? 'desc';
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = max(1, min(100, intval($_GET['limit'] ?? 10)));
    $offset = ($page - 1) * $limit;
    
    // Colonnes autorisées pour le tri
    $allowedColumns = ['id', 'customer', 'product', 'amount', 'status', 'order_date'];
    if (!in_array($sortColumn, $allowedColumns)) {
        $sortColumn = 'id';
    }
    $sortDirection = strtoupper($sortDirection) === 'ASC' ? 'ASC' : 'DESC';
    
    // Construction de la requête
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
    
    // Compter le total
    $countSql = "SELECT COUNT(*) FROM orders $whereClause";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $totalItems = $countStmt->fetchColumn();
    
    // Récupérer les données
    $sql = "SELECT id, customer, product, amount, status, order_date, created_at 
            FROM orders 
            $whereClause 
            ORDER BY $sortColumn $sortDirection 
            LIMIT $limit OFFSET $offset";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $orders = $stmt->fetchAll();
    
    // Formater les données
    foreach ($orders as &$order) {
        $order['amount'] = floatval($order['amount']);
        $order['avatar'] = $order['customer'];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $orders,
        'pagination' => [
            'currentPage' => $page,
            'totalPages' => ceil($totalItems / $limit),
            'totalItems' => intval($totalItems),
            'itemsPerPage' => $limit
        ]
    ]);
}

/**
 * Récupérer une commande par ID
 */
function getOrderById($pdo) {
    $id = intval($_GET['id'] ?? 0);
    
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID invalide']);
        return;
    }
    
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$id]);
    $order = $stmt->fetch();
    
    if (!$order) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Commande non trouvée']);
        return;
    }
    
    $order['amount'] = floatval($order['amount']);
    echo json_encode(['success' => true, 'data' => $order]);
}

/**
 * Récupérer les statistiques du dashboard
 */
function getStatistics($pdo) {
    // Revenu total
    $stmt = $pdo->query("SELECT COALESCE(SUM(amount), 0) as total FROM orders");
    $totalRevenue = floatval($stmt->fetchColumn());
    
    // Nombre total de commandes
    $stmt = $pdo->query("SELECT COUNT(*) FROM orders");
    $totalOrders = intval($stmt->fetchColumn());
    
    // Nombre de clients uniques
    $stmt = $pdo->query("SELECT COUNT(DISTINCT customer) FROM orders");
    $uniqueCustomers = intval($stmt->fetchColumn());
    
    // Commande moyenne
    $avgOrder = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;
    
    // Dernière commande
    $stmt = $pdo->query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 1");
    $lastOrder = $stmt->fetch();
    
    // Commandes par statut
    $stmt = $pdo->query("SELECT status, COUNT(*) as count FROM orders GROUP BY status");
    $statusCounts = [];
    while ($row = $stmt->fetch()) {
        $statusCounts[$row['status']] = intval($row['count']);
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'totalRevenue' => $totalRevenue,
            'totalOrders' => $totalOrders,
            'uniqueCustomers' => $uniqueCustomers,
            'avgOrder' => round($avgOrder, 2),
            'lastOrder' => $lastOrder,
            'statusCounts' => $statusCounts
        ]
    ]);
}

/**
 * Récupérer les données pour les graphiques
 */
function getChartData($pdo) {
    $type = $_GET['type'] ?? 'week';
    
    switch ($type) {
        case 'week':
            // Commandes de la semaine courante (par jour)
            $sql = "SELECT DATE(order_date) as date, COUNT(*) as count, SUM(amount) as revenue
                    FROM orders 
                    WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
                    AND order_date <= DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 6 DAY)
                    GROUP BY DATE(order_date)
                    ORDER BY date";
            break;
        case 'month':
            // Commandes du mois courant (par jour)
            $sql = "SELECT DATE(order_date) as date, COUNT(*) as count, SUM(amount) as revenue
                    FROM orders 
                    WHERE YEAR(order_date) = YEAR(CURDATE()) AND MONTH(order_date) = MONTH(CURDATE())
                    GROUP BY DATE(order_date)
                    ORDER BY date";
            break;
        case 'status':
            // Répartition par statut
            $sql = "SELECT status, COUNT(*) as count FROM orders GROUP BY status";
            $stmt = $pdo->query($sql);
            $data = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $data]);
            return;
        default:
            $sql = "SELECT DATE(order_date) as date, COUNT(*) as count, SUM(amount) as revenue
                    FROM orders 
                    WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                    GROUP BY DATE(order_date)
                    ORDER BY date";
    }
    
    $stmt = $pdo->query($sql);
    $data = $stmt->fetchAll();
    
    // Formater les données
    foreach ($data as &$row) {
        $row['count'] = intval($row['count']);
        $row['revenue'] = floatval($row['revenue']);
    }
    
    echo json_encode(['success' => true, 'data' => $data]);
}

/**
 * Gérer les requêtes POST (création)
 */
function handlePostRequest($pdo, $action) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        // Essayer avec $_POST si le JSON est vide
        $input = $_POST;
    }
    
    if (empty($input)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Données manquantes']);
        return;
    }
    
    // Validation des données
    $customer = trim($input['customer'] ?? '');
    $product = trim($input['product'] ?? '');
    $amount = floatval($input['amount'] ?? 0);
    $status = $input['status'] ?? 'Pending';
    $orderDate = $input['order_date'] ?? $input['date'] ?? date('Y-m-d');
    
    if (empty($customer) || empty($product)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Client et produit sont obligatoires']);
        return;
    }
    
    // Valider le statut
    $validStatuses = ['Pending', 'Processing', 'Delivered', 'Cancelled'];
    if (!in_array($status, $validStatuses)) {
        $status = 'Pending';
    }
    
    // Insérer la commande
    $stmt = $pdo->prepare("INSERT INTO orders (customer, product, amount, status, order_date, created_by) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$customer, $product, $amount, $status, $orderDate, $_SESSION['user_id']]);
    
    $newId = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message' => 'Commande créée avec succès',
        'data' => [
            'id' => intval($newId),
            'customer' => $customer,
            'product' => $product,
            'amount' => $amount,
            'status' => $status,
            'order_date' => $orderDate
        ]
    ]);
}

/**
 * Gérer les requêtes PUT (modification)
 */
function handlePutRequest($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID de commande manquant']);
        return;
    }
    
    $id = intval($input['id']);
    
    // Vérifier que la commande existe
    $stmt = $pdo->prepare("SELECT id FROM orders WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Commande non trouvée']);
        return;
    }
    
    // Préparer les champs à mettre à jour
    $updates = [];
    $params = [];
    
    if (isset($input['customer'])) {
        $updates[] = "customer = ?";
        $params[] = trim($input['customer']);
    }
    if (isset($input['product'])) {
        $updates[] = "product = ?";
        $params[] = trim($input['product']);
    }
    if (isset($input['amount'])) {
        $updates[] = "amount = ?";
        $params[] = floatval($input['amount']);
    }
    if (isset($input['status'])) {
        $validStatuses = ['Pending', 'Processing', 'Delivered', 'Cancelled'];
        if (in_array($input['status'], $validStatuses)) {
            $updates[] = "status = ?";
            $params[] = $input['status'];
        }
    }
    if (isset($input['order_date']) || isset($input['date'])) {
        $updates[] = "order_date = ?";
        $params[] = $input['order_date'] ?? $input['date'];
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Aucune donnée à mettre à jour']);
        return;
    }
    
    $params[] = $id;
    $sql = "UPDATE orders SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    echo json_encode(['success' => true, 'message' => 'Commande mise à jour avec succès']);
}

/**
 * Gérer les requêtes DELETE
 */
function handleDeleteRequest($pdo) {
    $id = intval($_GET['id'] ?? 0);
    
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID invalide']);
        return;
    }
    
    // Vérifier que la commande existe
    $stmt = $pdo->prepare("SELECT id FROM orders WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Commande non trouvée']);
        return;
    }
    
    // Supprimer la commande
    $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
    $stmt->execute([$id]);
    
    echo json_encode(['success' => true, 'message' => 'Commande supprimée avec succès']);
}
?>