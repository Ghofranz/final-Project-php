<?php
/**
 * API - Changement de mot de passe
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

$currentPassword = $_POST['current_password'] ?? '';
$newPassword     = $_POST['new_password'] ?? '';
$confirmPassword = $_POST['confirm_password'] ?? '';

if (empty($currentPassword) || empty($newPassword) || empty($confirmPassword)) {
    echo json_encode([
        'success' => false,
        'type'    => 'error',
        'message' => 'Veuillez remplir tous les champs.'
    ]);
    exit;
}

if ($newPassword !== $confirmPassword) {
    echo json_encode([
        'success' => false,
        'type'    => 'error',
        'message' => 'Les mots de passe ne correspondent pas.'
    ]);
    exit;
}

if (strlen($newPassword) < 6) {
    echo json_encode([
        'success' => false,
        'type'    => 'error',
        'message' => 'Le mot de passe doit contenir au moins 6 caractères.'
    ]);
    exit;
}

try {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $userData = $stmt->fetch();

    if ($userData && password_verify($currentPassword, $userData['password'])) {
        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
        $stmt->execute([$newHash, $_SESSION['user_id']]);

        echo json_encode([
            'success' => true,
            'type'    => 'success',
            'message' => 'Mot de passe mis à jour avec succès !'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'type'    => 'error',
            'message' => 'Mot de passe actuel incorrect.'
        ]);
    }
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'type'    => 'error',
        'message' => 'Erreur lors de la mise à jour du mot de passe.'
    ]);
}