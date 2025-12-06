<?php
try {
    $pdo = new PDO(
        "mysql:host=127.0.0.1;port=3307;dbname=livre0s",
        "root",
        "",
        array(
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        )
    );
    echo "Connexion PDO OK";
} catch (PDOException $e) {
    echo $e->getMessage();
}
?>