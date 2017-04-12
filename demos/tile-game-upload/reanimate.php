<?php
require_once("./database_credentials.php");

$mysqli = mysqli_connect(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE);
if(!$mysqli) {
  echo "Could not connect to MySQL server.";
  exit;
}
$logs = $mysqli->query("SELECT `uuid`, `updated_timestamp`, `log` FROM `".DB_TABLENAME."` ORDER BY `updated_timestamp` DESC");
if(!$logs) {
  echo "Error getting logs from server. MySQL Error: ".$mysqli->error;
  exit;
}
?>

<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Home</title>
  <style>
    body {
      text-align: center;
    }

    iframe, p {
      display: block;
      margin: auto;

      width: 393px;
      height: 258px;
    }

    p {
      height: auto;
      margin: 1em;
      text-align: left;
    }

    button, select {
      font-size: 1em;
      margin: .5em auto;
      padding: 1em;
    }
  </style>
</head>
<body>
  <p>
    The image is the work <a href="http://fav.me/d24n0v9">Re-Animator</a> and is
    copyright (c) 2009 <a href="http://cool-slayer.deviantart.com/">~cool-slayer</a>
    and made available under an <a href="http://creativecommons.org/licenses/by-nc-nd/3.0/">Attribution-Noncommercial-No Derivative Works 3.0 License</a>.
  </p>

  <select id="logs">
    <?php
    while($logs_row = mysqli_fetch_assoc($logs)) {
      echo '<option value=\'' . $logs_row['log'] . '\'>'.$logs_row['updated_timestamp'] . " " . $logs_row['uuid'].'</option>';
    }
    ?>
  </select>
  <br>
  <button class="reanimate">Reanimate!</button>
  <iframe id="target" class="target" src="game.html?replay"></iframe>
  <script src='reanimator-jquery.3.2.0.js'></script>
  <script>
    $(document).ready(function () {
      var target = window.targetFrame = $('iframe.target')[0].contentWindow;

      $('#target').on('load', function(){
        target.postMessage($("#logs").val(), '*');
      });

      $('.reanimate').on('click', function () {

        $('#target').attr('src', 'game.html?replay');
      });
    });
  </script>
</body>
</html>
