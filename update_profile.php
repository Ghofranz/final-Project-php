<?php
/**
 * API - Mise à jour du profil
 */
require_once 'config/database.php';
requireLogin();

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'type'    => 'error',
        'message' => 'Méthode non autorisée.'
    ]);
    exit;
}

$fullName = trim($_POST['full_name'] ?? '');
$email    = trim($_POST['email'] ?? '');

if (empty($fullName) || empty($email)) {
    echo json_encode([
        'success' => false,
        'type'    => 'error',
        'message' => 'Veuillez remplir tous les champs obligatoires.'
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        'success' => false,
        'type'    => 'error',
        'message' => 'Adresse email invalide.'
    ]);
    exit;
}

try {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("
        UPDATE users 
        SET full_name = ?, email = ? 
        WHERE id = ?
    ");
    $stmt->execute([$fullName, $email, $_SESSION['user_id']]);

    // Rafraîchir la session
    $_SESSION['full_name'] = $fullName;
    $user = getCurrentUser();

    echo json_encode([
        'success' => true,
        'type'    => 'success',
        'message' => 'Profil mis à jour avec succès !',
        'user'    => [
            'id'         => $user['id'],
            'username'   => $user['username'],
            'full_name'  => $user['full_name'],
            'email'      => $user['email'],
            'role'       => $user['role'],
            'created_at' => $user['created_at'],
        ]
    ]);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        echo json_encode([
            'success' => false,
            'type'    => 'error',
            'message' => 'Cette adresse email est déjà utilisée.'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'type'    => 'error',
            'message' => 'Erreur lors de la mise à jour.'
        ]);
    }
}