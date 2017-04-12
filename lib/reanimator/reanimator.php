<?php

require_once("./database_credentials.php");

$mysqli = mysqli_connect(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE);
if(!$mysqli) {
  echo "Could not connect to MySQL server.";
  exit;
}
$uuid = $_POST['uuid'];
$log = $_POST['log'];
$mysqli->query("INSERT INTO `".DB_TABLENAME."` (`uuid`, `log`) VALUES ('$uuid', '$log') ON DUPLICATE KEY UPDATE `log`='$log'");

?>
