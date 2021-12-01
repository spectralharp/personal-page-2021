<?php
  # Name: Chao Hsu Lin
  # Date: 11-16-18
  # Section: CSE 154 AI
  #
  # Web service that return lines in the Theaetetus that matches given queries
  #
  # Data of Theaetetus from https:#www.gutenberg.org/files/1726/1726-h/1726-h.htm
  # Re-used under the terms of the Project Gutenberg License at www.gutenberg.org
  # I might(?) push more functions over the weekend, not that it matters

  #----------------------------------------------------------------------------------------------#

  # All query parameters are optional. If no parameter is set, the request would return all lines
  # in the Theaetetus

  # Query 1: Get lines from a certain speaker
  # Request Format: theaetetus.php?speaker={name}
  # Request Type: GET
  # Returned Data Format: JSON
  # Description: This request takes any speaker in the Theaetetus as a parameter and returns all
  # lines spoken by the speaker.

  # Query 2: Get lines that contain a certain word
  # Request Format: theaetetus.php?contain={word}
  # Request Type: GET
  # Returned Data Format: JSON
  # Description: This request takes a word as a parameter and returns all lines under that contains
  # the word.

  # Query 3: Get lines under than a certain character count
  # Request Format: theaetetus.php?char_limit={number}
  # Request Type: GET
  # Returned Data Format: JSON
  # Description: This request takes a character count as a parameter and returns all lines under
  # than the character count.

  # Query 4: Get a random line
  # Request Format: theaetetus.php?mode=random_quote
  # Request Type: GET
  # Returned Data Format: plain text
  # Description: This request returns a random line from all lines that matches other query
  # parameters in a formatted string ("{dialogue}" - {speaker})

  #----------------------------------------------------------------------------------------------#

  $theaetetus = get_data("data/theaetetus.json");

  $quotes = $theaetetus;

  $quotes = handle_speaker($quotes, $theaetetus);
  $quotes = handle_contain($quotes);
  $quotes = handle_char_limit($quotes);

  $mode = $_GET["mode"];
  if(isset($mode)) {
    if($mode === "random_quote") {
      output_random_quote($quotes);
    } else {
      handleError("Invalid Mode: {$mode}. Please pass in mode 'random_quote'");
    }
  } else {
    output_json_quote($quotes);
  }

  #----------------------------------------- Functions ------------------------------------------#

  /**
   * If speaker is set, remove quotes not from the speaker from the quotes that will be returned,
   * returns remaining quotes
   * @param {Object} $quotes - current quotes to return
   * @param {Object} $theaetetus - Associative array representing the all lines from Theaetetus
   * @returns {mixed[]]} Associative array representing JSON that will be returned
   */
  function handle_speaker($quotes, $theaetetus) {
    $speaker = $_GET["speaker"];
    if(isset($speaker)) {
      if(is_valid_speaker($speaker)) {
        return get_quotes_from($speaker, $theaetetus);
      } else {
        # Print error message if speaker is not valid
        handleError("Invalid Speaker: {$speaker}. Please pass in 'narrator', 'euclid', " .
                    "'terpsion', 'theaetetus', 'theodorus', or 'socrates'");
      }
    }
  }


  /**
   * If contain is set, remove quotes that doesn't contain the text from the quotes that will be
   * returned, returns remaining quotes
   * @param {Object} $quotes - current quotes to return
   * @returns {mixed[]]} Associative array representing JSON that will be returned
   */
  function handle_contain($quotes) {
    $contain = $_GET["contain"];
    if(isset($contain)) {
      return remove_quote_without_text($contain, $quotes);
    } else {
      return $quotes;
    }
  }

  /**
   * If char_limit is set, remove quotes that are over the character limit from the quotes that
   * will be returned, returns remaining quotes
   * @param {Object} $quotes - current quotes to return
   * @returns {mixed[]]} Associative array representing JSON that will be returned
   */
  function handle_char_limit($quotes) {
    $char_limit = $_GET["char_limit"];
    if(isset($char_limit)) {
      return remove_over_limit($char_limit, $quotes);
    } else {
      return $quotes;
    }
  }

  /**
   * Output a random quote in plain text in a '"{dialogue}" - {speaker}' format
   * @param {Object} $quotes - possible quotes
   * @returns {void}
   */
  function output_random_quote($quotes) {
    header("Content-type: text/plain");
    $quote = $quotes["quotes"][array_rand($quotes["quotes"])];
    echo get_format_quote($quote);
  }

  /**
   * Output the remaining quotes in JSON format
   * @param {Object} $quotes - quotes to output
   * @returns {void}
   */
  function output_json_quote($quotes) {
    header("Content-type: application/json");
    echo json_encode($quotes);
  }

  /**
   * Retrieve data as JSON stored in the file from the given path
   * @param {Object} $path - path to the file
   * @returns {mixed[]]} Associative array representing JSON stored in the file
   */
  function get_data($path) {
    $plain = file_get_contents($path);
    return json_decode($plain, true);
  }

  /**
   * Returns true if the speaker is valid, returns false otherwise
   * @param {string} $speaker - speaker to check
   * @returns {boolean} true if the speaker is valid, false otherwise
   */
  function is_valid_speaker($speaker) {
    $valid_speakers = array("narrator", "euclid", "terpsion",
                            "theaetetus", "theodorus", "socrates");
    for($i = 0; $i < count($valid_speakers); $i++) {
      if($speaker === $valid_speakers[$i]) {
        return TRUE;
      }
    }
    return FALSE;
  }

  /**
   * Returns an associative array representing JSON of all quotes from a speaker from Theaetetus
   * @param {string} $speaker - name of the speaker
   * @param {mixed[]} $theaetetus - Associative array representing the all lines from Theaetetus
   * @returns {mixed[]} Associative array representing JSON of all quotes from a speaker
   */
  function get_quotes_from($speaker, $theaetetus) {
    $quotes = array("quotes" => array());
    $speaker = strtoupper($speaker[0]) . substr($speaker, 1);
    for($i = 0; $i < count($theaetetus["quotes"]); $i++) {
      if($theaetetus["quotes"][$i]["speaker"] === $speaker) {
        $quotes["quotes"][] = $theaetetus["quotes"][$i];
      }
    }
    return $quotes;
  }

  /**
   * Returns an associative array of quotes from the given quotes that contains given text
   * @param {string} $text - text the quote should contain
   * @param {mixed[]} $quotes - Associative array representing quotes to check
   * @returns {mixed[]} Associative array representing JSON of all quotes that contains given text
   */
  function remove_quote_without_text($text, $quotes) {
    $contain_text = array("quotes" => array());
    for($i = 0; $i < count($quotes["quotes"]); $i++) {
      if(preg_match("/{$text}/", $quotes["quotes"][$i]["dialogue"])) {
        $contain_text["quotes"][] = $quotes["quotes"][$i];
      }
    }
    return $contain_text;
  }

  /**
   * Returns an associative array of quotes from the given quotes under the character limit
   * @param {int} $limit - limit of the number of characters
   * @param {mixed[]} $quotes - Associative array representing quotes to check
   * @returns {mixed[]} Associative array representing JSON of all quotes under the character limit
   */
  function remove_over_limit($limit, $quotes) {
    $under_limit = array("quotes" => array());
    for($i = 0; $i < count($quotes["quotes"]); $i++) {
      if(strlen($quotes["quotes"][$i]["dialogue"]) <= $limit) {
        $under_limit["quotes"][] = $quotes["quotes"][$i];
      }
    }
    return $under_limit;
  }

  /**
   * Returns a formatted string of the given quote ("{dialogue}" - {speaker})
   * @param {mixed[]} $quote - quote to format
   * @returns {string} formatted string of the given quote ("{dialogue}" - {speaker})
   */
  function get_format_quote($quote) {
    $speaker = $quote["speaker"];
    $dialogue = $quote["dialogue"];
    return "\"{$dialogue}\" - {$speaker}";
  }

  /**
   * Handles a 400 error and print out the given message
   * @param {string} $message - message to print out
   * @returns {void}
   */
  function handleError($message) {
    header("HTTP/1.1 400 Invalid Request");
    header("Content-type: text/plain");
    die($message);
  }

  #(\__/)
  #(•ㅅ•)
?>
