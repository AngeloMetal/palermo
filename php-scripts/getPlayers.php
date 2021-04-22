<?php

include "db.php";

$pass = $_POST["pass"];
 
$sql = "SELECT players FROM rooms WHERE pass = '".$pass."' AND done = FALSE";
if($result = mysqli_query($link, $sql)){
    if(mysqli_num_rows($result) > 0){

        while($row = mysqli_fetch_array($result)){
               echo $row[0];
       
        }
  
        // Close result set
        mysqli_free_result($result);
    } else{
        echo "Nothing";
    }
} else{
    echo "ERROR: Could not able to execute $sql. " . mysqli_error($link);
}
 
// Close connection
mysqli_close($link);
?>
