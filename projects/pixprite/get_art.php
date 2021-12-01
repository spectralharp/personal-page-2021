<?php
  # Name: Chao Hsu Lin
  # Date: 11-29-18
  # Section: CSE 154 AI
  #
  # Pixprite is a online pixel art editor with a simple interface
  # Users can store their artwork in an online database
  #
  # get_art.php:
  #   Retrieves art from the Pixprite web service database.

  #----------------------------------------------------------------------------------------------#

  # Query 1: Retrieve random artwork
  # Request Format: get_art.php
  # Request Type: POST
  # POST Body:
  #   mode     - Required - 'random'
  #   count    - Optional - Number of artwork to return, defaults to one
  # Returned Data Format: JSON
  # Description: This request returns a random artwork in the database that is public

  # Query 2: Retrieve artwork with the given name
  # Request Format: get_art.php
  # Request Type: POST
  # POST Body:
  #   mode     - Required - 'single'
  #   name     - Required - The name of the artwork to retrieve
  #   password - Optional - Password for the artwork
  # Returned Data Format: JSON
  # Description:
  #   This request returns a artwork with the given name in the database, password is required
  #   if the artwork is not public
  # Fail Condition:
  # - If the artwork with the given name can't be found, a JSON object with status "fail" will
  #   be returned
  # - If the artwork with the given name is protected by password, and no password is set, a
  #   JSON object with status "fail" will be returned
  # - If the artwork with the given name is protected by password, and the given password doesn't
  #   match, a JSON object with status "fail" will be returned

  #----------------------------------------------------------------------------------------------#

  include('common.php');

  #----------------------------------------- Messages -------------------------------------------#

  # Variables for messages
  define('MSG_NO_MODE', "A 'mode' parameter is required");
  define('MSG_INVALID_MODE', "Please provide a 'mode' parameter of 'random' or 'single'");
  define('MSG_NO_NAME', "Please provide a 'name' parameter for 'mode' of 'single'");
  define('MSG_SUCCESS', "Retrieved artwork from the Pixprite database");

  $mode = check_post("mode", MSG_NO_MODE);

  if(isset($_POST["name"])) {
    define('MSG_CANT_FIND_NAME', "'{$_POST["name"]}' can not be found in the Pixprite database");
    define('MSG_NO_PASSWORD', "'{$_POST["name"]}' is protected by password");
    define('MSG_INVALID_PASSWORD', "Incorrect password for '{$_POST["name"]}'");
  }

  #------------------------------------------- Logic --------------------------------------------#

  if($mode === "random"){
    output_random($db);
  } else if ($mode === "single") {

    $name = check_post("name", MSG_NO_NAME);

    # Query artwork with given name
    $sql = "SELECT id, name, art, x, y, password FROM Artworks WHERE name = :name LIMIT 1;";
    $params = array('name' => $name);
    $stmt = secure_query($db, $sql, $params);

    $result = $stmt->fetchAll();

    # Check if there is result at all
    if(!empty($result)) {
      $result_password = $result[0]["password"];
      # Check if there is password
      if(!is_null($result_password)){
        # If there is password, check if password is POST
        if(isset($_POST["password"])) {
          # If password is POST check if password matches
          if($result_password === $_POST["password"]) {
            # Matching password! Output
            output_json(pdo_to_artwork($result));
          } else {
            # Password doesn't match
            output_json(array("status"=> get_status("fail", MSG_INVALID_PASSWORD)));
          }
        } else {
          # Password not POST
          output_json(array("status"=> get_status("fail", MSG_NO_PASSWORD)));
        }
      } else {
        # No password! Output
        output_json(pdo_to_artwork($result));
      }
    } else {
      # No results
      output_json(array("status"=> get_status("fail", MSG_CANT_FIND_NAME)));
    }
  } else {
    # Mode not set
    error_message(MSG_INVALID_MODE);
  }

  #----------------------------------------- Functions ------------------------------------------#

  /**
   * Outputs a random public artwork in JSON format
   * @param {PDOObject} $db - PDO object to query the database with
   * @returns {void}
   */
  function output_random($db) {
    try {
      # Get a random public artwork (password is NULL)
      $sql = "SELECT * FROM Artworks WHERE password IS NULL ORDER BY RAND() LIMIT :count;";
      $count = isset($_POST["count"]) ? (int)($_POST["count"]) : 1;
      $stmt = $db->prepare($sql);
      # For what ever reason, MySQL interprets the statement as LIMIT '1' instead of LIMIT 1
      # if you do it the usual way, so you have to bind param manually to set the type
      $stmt->bindParam(':count', $count, PDO::PARAM_INT);
      $stmt->execute();
    }
    catch (PDOException $ex) {
      error_message_exception("Can not query the database.", $ex);
    }

    output_json(pdo_to_artwork($stmt));
  }

  /**
   * Returns a formatted JSON object with status message from the given query result
   * @param {PDOStatement|mixed[]} $pdo_result - query result
   * @returns {mixed[]} formatted JSON object
   */
  function pdo_to_artwork($pdo_result) {
    $output = array("status"=> get_status("success", MSG_SUCCESS), "result" => array());
    # Loop through each row of data from the query result
    foreach($pdo_result as $row) {
      $art_row = array();
      $art_row["id"] = $row["id"];

      $art_row["name"] = $row["name"];
      $art_row["art"] = grid_str_to_array($row["art"], $row["x"], $row["y"]);

      $art_row["size"] = array();
      $art_row["size"]["x"] = $row["x"];
      $art_row["size"]["y"] = $row["y"];

      $output["result"][] = $art_row;
    }
    return $output;
  }

  /**
   * Returns a 2D array that represents the grid string
   * @param {string} $grid_str - grid string
   * @param {int} $sizeX - width of the grid
   * @param {int} $sizeY - height of the grid
   * @returns {mixed[]} 2D array that represents the grid
   */
  function grid_str_to_array($grid_str, $sizeX, $sizeY) {
    # Might not be the most efficient but probably the easiest to read
    $colors = array_reverse(str_split($grid_str, 6));
    $grid = array();
    try {
      for($y = 0; $y < $sizeY; $y++) {
        $row = array();
        for($x = 0; $x < $sizeX; $x++) {
          $row[] = array_pop($colors);
        }
        $grid[] = $row;
      }
    }
    catch (OutOfBoundsException $ex) {
      $expected = $sizeX * $sizeY;
      $got = count($colors);
      $msg = "Artwork size mismatch! Expected {$expected}pxs ({$sizeX}, {$sizeY}), got {$got}.";
      error_message_exception($msg, $ex);
    }
    return $grid;
  }
?>
