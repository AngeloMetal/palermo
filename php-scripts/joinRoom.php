<?php

include "db.php";

$pass = $_POST["pass"];
$username = $_POST["username"];
$everythingUnique = true;

$sql2 = "UPDATE rooms SET players = CONCAT(players, ',', '".$username."') WHERE pass = '".$pass."'";




$sql = "SELECT players FROM rooms WHERE pass = '".$pass."' AND done = FALSE";
if($result = mysqli_query($link, $sql)){
    if(mysqli_num_rows($result) > 0){

        while($row = mysqli_fetch_array($result)){
               for($i=0; $i<count(explode(",", $row[0])); $i++){
					
					if(explode(",", $row[0])[$i] == $username){
						$everythingUnique = false;
					}
				
			   }
		if($everythingUnique == true){
			mysqli_query($con, $sql2) or die('joinRoom.php failed');
		}

       
        }
  
        // Close result set
        mysqli_free_result($result);
    } else{
        echo "FAIL_NO_ROOM";
    }
} else{
    echo "ERROR: Could not able to execute $sql. " . mysqli_error($link);
}



if($everythingUnique == true){


$sql = "SELECT players FROM rooms WHERE pass = '".$pass."' AND done = FALSE";
if($result = mysqli_query($link, $sql)){
    if(mysqli_num_rows($result) > 0){

        while($row = mysqli_fetch_array($result)){
               for($i=0; $i<count(explode(",", $row[0])); $i++){
					echo explode(",", $row[0])[$i] . "\n";
			   }
       
        }
  
        // Close result set
        mysqli_free_result($result);
    } else{
        echo "Nothing";
    }
} else{
    echo "ERROR: Could not able to execute $sql. " . mysqli_error($link);
}


}else{
	echo "FAIL_USERNAME_ALREADY_EXIST";
}
?>
