<?php
/**
 * API - Données du profil
 */
require_once 'config/database.php';
requireLogin();

header('Content-Type: application/json; charset=utf-8');

try {
    $user = getCurrentUser();
    if (!$user) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Utilisateur non authentifié.'
        ]);
        exit;
    }

    $pdo = getDBConnection();
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) AS orders_count,
            COALESCE(SUM(amount), 0) AS total_amount
        FROM orders
        WHERE created_by = ?
    ");
    $stmt->execute([$_SESSION['user_id']]);
    $userStats = $stmt->fetch();

    echo json_encode([
        'success' => true,
        'user' => [
            'id'         => $user['id'],
            'username'   => $user['username'],
            'full_name'  => $user['full_name'],
            'email'      => $user['email'],
            'role'       => $user['role'],
            'created_at' => $user['created_at'],
        ],
        'stats' => [
            'orders_count' => (int)($userStats['orders_count'] ?? 0),
            'total_amount' => (float)($userStats['total_amount'] ?? 0),
        ],
        'session' => [
            'id_preview' => substr(session_id(), 0, 20),
            'auth_type'  => 'Session PHP',
            'status'     => 'connected',
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur serveur.'
    ]);
}