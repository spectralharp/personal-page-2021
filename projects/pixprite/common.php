<?php
# Name: Chao Hsu Lin
# Date: 11-29-18
# Section: CSE 154 AI
#
# Pixprite is a online pixel art editor with a simple interface
# Users can store their artwork in an online database
#
# common.php:
#   Helper functions for Pixprite web service.

  #------------------------------------------- Debug --------------------------------------------#

  error_reporting(E_ALL);
  ini_set('display_errors', 1);
  $debug = TRUE;

  #--------------------------------------- MySQL Config -----------------------------------------#

  # Variables for connections to the database.
  $host =  'chao0226.vergil.u.washington.edu';
  $port = '4343';
  $user = 'root';
  $password = 'E125355127j';
  $dbname = 'pixprite';

  # Make a data source string that will be used in creating the PDO object
  $ds = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8";

  #----------------------------------------- Functions ------------------------------------------#

  /**
   * Display an error message and end the program, use only when user sends invalid request
   * @param {string} $msg - message to display
   * @returns {void}
   */
  function error_message($msg) {
    header("HTTP/1.1 400 Invalid Request");
    header("Content-Type: text/plain");
    die($msg);
  }

  /**
   * Display an error message and exception and end the program
   * @param {string} $msg - message to display
   * @param {Exception} $ex - Exception to display
   * @returns {void}
   */
  function error_message_exception($msg, $ex) {
    global $debug;

    header("HTTP/1.1 400 Invalid Request");
    header("Content-Type: text/plain");
    if ($debug) {
      $msg .= "\n Error details: {$ex} \n";
    }
    die($msg);
  }

  /**
   * Runs a one statement query and returns the resulting PDOStatement
   * @param {PDOObject} $db - PDOObject used to query
   * @param {string} $sql - query statement
   * @param {mixed[]} $params - array that contains values to replace in query statement
   * @returns {PDOStatement} result of the query
   */
  function secure_query($db, $sql, $params) {
    try {
      $stmt = $db->prepare($sql);
      $stmt->execute($params);
      return $stmt;
    }
    catch (PDOException $ex) {
      error_message_exception("Can not query the database.", $ex);
    }
  }

  /**
   * Returns a array that represents the status of the result
   * @param {string} $status_type - status type ("success", "fail", etc.)
   * @param {string} $status_message - message that describes the status
   * @returns {mixed[]} array that represents the status of the result
   */
  function get_status($status_type, $status_message) {
    $status = array("type" => $status_type, "message" => $status_message);
    return $status;
  }

  /**
   * Outputs the given array in JSON format
   * @param {mixed[]} $output - array to output
   * @returns {void}
   */
  function output_json($output) {
    header("Content-Type: application/json");
    print(json_encode($output));
  }

  /**
   * Returns the value of the key if it's POST, show error message and kill the program otherwise
   * @param {PDOObject} $db - PDO object to query the database with
   * @returns {void}
   */
   function check_post($key, $error_msg) {
     if(!isset($_POST[$key])) {
       error_message($error_msg);
     }
     return $_POST[$key];
   }


  #-------------------------------------------- PDO ---------------------------------------------#

  # Setup PDO before query
  try {
    $db = new PDO($ds, $user, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  }
  catch (PDOException $ex) {
    error_message_exception("Can not connect to the database.", $ex);
  }
?>
