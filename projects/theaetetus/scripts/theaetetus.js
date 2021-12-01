// Name: Chao Hsu Lin
// Date: 11-15-18
// Section: CSE 154 AI
//
// Fetches from the Wise Words From Theaetetus web service to show a random quote from Theaetetus
// in the header. Also allows the user to make sample queries on the page.
//

(function() {
  "use strict";
  /* --------------------------------------- Constants -------------------------------------- */

  // Character limit for the quote displayed in the header
  const THEAETETUS_LIMIT = 30;
  // Tab spacing for try-it section output
  const TAB_SPACING = 2;

  /* --------------------------------------- Initialize ------------------------------------- */

  // Add function that be called when the page finishes loading
  window.addEventListener("load", initialize);

  /**
   * Add events for the button to fetch quote and the button to test the web service
   * @returns {void}
   */
  function initialize() {
    $("quote-btn").addEventListener("click", fetchRandomTheaetetusQuote);
    $("try-btn").addEventListener("click", function() {
      // Use what ever is in the parameter input box as query parameter
      fetchQuotes($("php-param").value);
    });
  }

  /* ------------------------------------------ Fetch --------------------------------------- */

  /**
   * Fetch a random quote from Theaetetus from the Theaetetus under the character count
   * and output it into the block quote in the header
   * @returns {void}
   */
  function fetchRandomTheaetetusQuote() {
    // Whew exactly 100!
    let url = "theaetetus.php?mode=random_quote&speaker=theaetetus&char_limit=" + THEAETETUS_LIMIT;
    fetch(url, { mode : "cors" })
      .then(checkStatus)
      .then(function(text) {
        $("quote").innerText = text;
      })
      .catch(function(error) {
        $("quote").innerText = error;
      });
  }

  /**
   * Output the response data into the text area in the try-it section
   * If there is an error, outputs the error message into the text area
   * @param {Object} phpParam - parameter to use in the web service query
   * @returns {void}
   */
  function fetchQuotes(phpParam) {
    let url = "theaetetus.php" + phpParam;
    fetch(url, { mode : "cors" })
      .then(checkStatus)
      .then(JSON.parse)
      // Parse and stringify for pretty print, 2 is tab spacing
      .then(function(response) {
        $("try-output").value = JSON.stringify(response, null, TAB_SPACING);
      })
      .catch(function(error) {
        $("try-output").value = error;
      });
  }

  /* ------------------------------------ Helper Function ----------------------------------- */

  // From CSE 154 template

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} id - element ID
   * @returns {object} DOM object associated with id.
   */
  function $(id) {
    return document.getElementById(id);
  }

  /**
   * Helper function to return the response's result text if successful, otherwise
   * returns the rejected Promise result with an error status and corresponding text.
   * @param {object} response - response to check for success/error.
   * @returns {object} - valid result text if response was successful, otherwise rejected
   *                     Promise result.
   */
  function checkStatus(response) {
    if (response.status >= 200 && response.status < 300 || response.status == 0) {
      return response.text();
    } else {
      return Promise.reject(new Error(response.status + ": " + response.statusText));
    }
  }
})();

/*
(\__/)
(•ㅅ•)
*/
