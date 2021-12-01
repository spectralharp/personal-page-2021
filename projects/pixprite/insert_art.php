<?php
  # Name: Chao Hsu Lin
  # Date: 11-29-18
  # Section: CSE 154 AI
  #
  # Pixprite is a online pixel art editor with a simple interface
  # Users can store their artwork in an online database
  #
  # put_art.php:
  #   Inserts art to the Pixprite web service database.

  #----------------------------------------------------------------------------------------------#

  # Query 1: Insert artwork to the artworks table
  # Request Format: insert_art.php
  # Request Type: POST
  # POST Body:
  #   name     - Required - Name of the artwork
  #   artwork  - Required - A string that encodes the colors on the grid
  #   x        - Required - The width of the canvas
  #   y        - Required - The height of the canvas
  #   password - Optional - Password for the artwork
  # Returned Data Format: JSON
  # Description:
  #   This request inserts the artwork into the database, returns a JSON object with
  #   status "success" if the operation is successful
  # Fail Condition:
  # - If the artwork with the given name already exists in the database, a JSON object with status
  #   "fail" will be returned

  #----------------------------------------------------------------------------------------------#

  include('common.php');

  #----------------------------------------- Messages -------------------------------------------#

  # Variables for messages
  define('MSG_NO_NAME', "Please provide the 'name' parameter");
  define('MSG_NO_ART', "Please provide the 'artwork' parameter");
  define('MSG_NO_SIZE', "Please provide the canvas size with 'x' and 'y' parameter");

  # Get the post parameters
  $art_name = check_post("name", MSG_NO_NAME);
  $art_artwork = check_post("artwork", MSG_NO_ART);
  $art_x = check_post("x", MSG_NO_SIZE);
  $art_y = check_post("y", MSG_NO_SIZE);

  define('MSG_OVERWRITE', "'{$art_name}' already exists!");
  define('MSG_SUCCESS', "Successfully added '{$art_name}' into the Pixprite database!");

  #------------------------------------------- Logic --------------------------------------------#

  # Check if name already exists
  $sql = "SELECT EXISTS (SELECT * FROM Artworks WHERE name = :name);";
  $params = array("name" => $art_name);
  $stmt = secure_query($db, $sql, $params);
  $rows = $stmt->fetchAll();

  # This ALWAYS returns only one row, in the row there's a field with the key 0 that stores a
  # boolean that is true if the subquery statement exists

  $name_exists = $rows[0][0];

  # Sometimes PHP feels like dark magic

  if($name_exists) {
    output_json(array("status"=> get_status("fail", MSG_OVERWRITE)));
  } else {
    # Insert art to database
    $params = array("name" => $art_name,
                    "art" => $art_artwork,
                    "x" => $art_x,
                    "y" => $art_y);

    if(!isset($_POST["password"])) {
      $sql = "INSERT INTO Artworks (name, art, x, y) VALUES (:name, :art, :x, :y );";
    } else {
      $sql = "INSERT INTO Artworks (name, art, password, x, y) VALUES (:name, :art, :pw, :x, :y);";
      $params["pw"] = $_POST["password"];
    }

    secure_query($db, $sql, $params);
    output_json(array("status"=> get_status("success", MSG_SUCCESS)));
  }
?>
