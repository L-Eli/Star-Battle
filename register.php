<?php

$pdo = new PDO('mysql:host=localhost;dbname=star_battle;charset=utf8', 'root', '');

$pdo->prepare('insert into records (name, score, time) values (?, ?, ?)')->execute([$_POST['name'], $_POST['score'], $_POST['time']]);

$records = $pdo->query('select * from records')->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($records);
