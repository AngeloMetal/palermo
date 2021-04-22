<?php

include "db.php";

$username = $_POST["username"];
$pass = "";
for($i=0; $i<5; $i++){
	$pass .= chr(rand(65,90));
}

$sql = "INSERT INTO rooms (players, pass) VALUES('".$username."', '".$pass."')";

mysqli_query($con, $sql) or die('createRoom.php failed');

echo($pass);
?>

