// Name: Chao Hsu Lin
// Date: 11-24-18
// Section: CSE 154 AI
//
// Lints CSS files!

(function() {
  "use strict";

  // URL of the W3C Validator API
  const CSS_VALIDATOR = "https://jigsaw.w3.org/css-validator/validator";
  // Profile to use for the API, change to lint CSS4: electric boogaloo
  const PROFILE = "css3";
  // Ruleset for CSSLint
  const RULESET = {
    "display-property-grouping":1,
    "duplicate-properties":1,
    "empty-rules":1,
    "compatible-vendor-prefixes":1,
    "gradients":1,
    "text-indent":1,
    "star-property-hack":1,
    "underscore-property-hack":1,
    "bulletproof-font-face":1,
    "duplicate-background-images":1,
    "regex-selectors":1,
    "universal-selector":1,
    "unqualified-attributes":1,
    "overqualified-elements":1,
    "shorthand":1,
    "floats":1,
    "font-sizes":1,
    "important":1,
    "qualified-headings":1,
    "minimize-redundant-css":1,
    "fallback-font":1,
    "no-vendor-prefix":1,
    "line-formatting":1,
    "zero-units":1
  };

  // For easy access to editor
  let editor = null;

  // Add a function that will be called when the window is loaded.
  window.addEventListener("load", initialize);

  /**
   * Add event to run lint button to lint, assign editor value
   * @returns {void}
   */
  function initialize() {
    editor = ace.edit("editor");
    $("run-lint").addEventListener("click", runLint);
    $("run-lint").disabled = false;
  }

  /**
   * Run the linter, lint from both W3C Validator and CSSLint
   * @param {string} css - CSS text to lint
   * @returns {void}
   */
  function runLint() {
    // Debounce
    $("run-lint").disabled = true;
    // Remove every node that's a result content
    qsa(".result-content").forEach(e => e.parentNode.removeChild(e));

    let css = editor.getValue();

    checkW3C(css);
    checkCustomRules(css);
  }

  /* ------------------------------------ Checking Result ----------------------------------- */

  /**
   * Fetches validation data from W3C's Validator API
   * @param {string} css - CSS text to lint
   * @returns {void}
   */
  function checkW3C(css) {
    // Transform special characters in CSS (";", "{", "}", etc.) to URI component
    let text = "text=" + encodeURIComponent(css);
    // Lint CSS3 code
    let profile = "profile=" + PROFILE;
    // It's intersting how JSON works even when it's not documented at all
    let output = "output=json";
    // Output in English
    let lang = "lang=en";

    let url = CSS_VALIDATOR + "?" + lang + "&"+ profile + "&"+ output + "&" + text;

    fetch(url, {mode : "cors"})
      .then(checkStatus)
      .then(JSON.parse)
      .then(function(response) {
        updateCategoryResults("w3c", processW3CResult(response.cssvalidation));
        // Only enable when result is fetched and processed and updated to category
        $("run-lint").disabled = false;
      })
      .catch(console.log);
  }

  /**
   * Fetches validation data from W3C's Validator API
   * @param {string} css - CSS text to lint
   * @returns {void}
   */
  function checkCustomRules(css) {
    let linted = CSSLint.verify(css, RULESET);
    updateCategoryResults("cse154", processCSSLintResult(linted));
  }

  /**
   * Update the category with the given result
   * @param {string} category - category to update
   * @param {Object} result - object that contains value for "errors" and "warnings"
   * @returns {void}
   */
  function updateCategoryResults(category, result) {
    let categoryElement = $(category);
    if (result.errors.length > 0) {
      categoryElement.appendChild(createResultContent("Error", "error", result.errors));
    } else {
      // If there are only warnings, count as passing
      categoryPass(categoryElement);
    }
    if(result.warnings.length > 0) {
      categoryElement.appendChild(createResultContent("Warning", "warning", result.warnings));
    }
  }

  /* ------------------------------------ Process Result ------------------------------------ */

  /**
   * Process cssvalidation into generic result object that contains value for "errors"
   * and "warnings"
   * @param {Object} cssvalidation - cssvalidation returned by W3C Validator
   * @returns {Object} JSON object that contains value for "errors" and "warnings"
   */
  function processW3CResult(cssvalidation) {

    let errors = validationToResult(cssvalidation.errors);
    let warnings = validationToResult(cssvalidation.warnings);

    return {errors: errors, warnings: warnings};
  }

  /**
   * Transform validation data to generic result object
   * @param {Object} validation - errors or warnings from cssvalidation
   * @returns {Object[]}
   */
  function validationToResult(validation) {
    if(validation === undefined) {
      return [];
    }
    let results = [];
    for (let i = 0; i < validation.length; i++) {
      let line = validation[i].line;
      let text = validation[i].message;
      let type = validation[i].type;
      let label = "line " + line + ":";
      results.push(getResult(label, text, type, line, 1));
    }
    return results;
  }

  /**
   * Process object returned by CSSLint into generic result object that contains value for "errors"
   * and "warnings"
   * @param {Object} linted - Object returned by CSSLint
   * @returns {Object} JSON object that contains value for "errors" and "warnings"
   */
  function processCSSLintResult(linted) {
    let errors = [];
    let warnings = [];

    for(let i = 0; i < linted.messages.length; i++) {
      let message = linted.messages[i];
      let rule = message.rule;

      let header = "line " + message.line + ", col " + message.col + ": " + message.message;
      let result = getResult(header, rule.desc, rule.id, message.line, message.col);

      if(message.type === "error") {
        errors.push(result);
      } else if(message.type === "warning") {
        warnings.push(result);
      }
    }

    return {errors: errors, warnings: warnings};
  }

  /* ------------------------------------ DOM Manipulation ---------------------------------- */

  /**
   * Adds a Pass result to the category
   * @param {HTMLElement} category - category to add passing message to
   * @returns {void}
   */
  function categoryPass(category) {
    let passMessage = [getResult("Passed:", "No major errors found. Good work!", "", 0, 1)];
    category.appendChild(createResultContent("Passed", "pass", passMessage));
  }

  /**
   * Create a result content that with a header that shows the type of result (Pass/Warning/Error)
   * and create a list that shows all the results
   * @param {string} headerText - text to show in header
   * @param {string} headerClass - class of header (error/warning/pass)
   * @param {Object[]} results - array of result object defined in getResult
   * @returns {HTMLElement} "div" element that displays the header and results
   */
  function createResultContent(headerText, headerClass, results) {
    let content = document.createElement("div");
    content.classList.add("result-content");

    let header = document.createElement("div");
    header.classList.add("result-header");
    header.classList.add(headerClass);

    let headerTextElement = document.createElement("h3");
    headerTextElement.innerText = headerText;

    let resultList = document.createElement("ul");

    header.appendChild(headerTextElement);
    content.appendChild(header);
    content.appendChild(resultList);

    for(let i = 0; i < results.length; i++) {
      resultList.appendChild(createResultItem(results[i]));
    }
    return content;
  }

  /**
   * Create a result item that has a clickable label that jumps the editor to the line, description
   * of result, and type of result, all given in the result object
   * @param {Object} result - result object defined in getResult
   * @returns {HTMLElement} "li" element that displays the result
   */
  function createResultItem(result) {
    let item = document.createElement("li");

    let labelElement = document.createElement("strong");
    labelElement.innerText = result.label;
    labelElement.addEventListener("click", function() {
      editorGoToLine(result.line, result.column);
    });
    item.appendChild(labelElement);

    if(result.type.length > 0) {
      let typeElement = document.createElement("span");
      typeElement.classList.add("error-type");
      typeElement.innerText = result.type;
      item.appendChild(typeElement);
    }

    let textElement = document.createElement("p");
    textElement.innerText = result.text;
    item.appendChild(textElement);

    return item;
  }

  /* ------------------------------ Helper Functions  ------------------------------ */

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} id - element ID
   * @returns {object} DOM object associated with id.
   */
  function $(id) {
    return document.getElementById(id);
  }

  /**
   * Returns the array of elements that match the given CSS selector.
   * @param {string} query - CSS query selector
   * @returns {object[]} array of DOM objects matching the query.
   */
  function qsa(query) {
    return document.querySelectorAll(query);
  }

  /**
   * Helper function to return the response's result text if successful, otherwise
   * returns the rejected Promise result with an error status and corresponding text
   * @param {object} response - response to check for success/error
   * @returns {object} - valid result text if response was successful, otherwise rejected
   *                     Promise result
   */
  function checkStatus(response) {
    if (response.status >= 200 && response.status < 300 || response.status == 0) {
      return response.text();
    } else {
      return Promise.reject(new Error(response.status + ": " + response.statusText));
    }
  }

  /**
   * Move the cursor of the editor to given line and column
   * @param {object} line - line to jump to
   * @param {object} column - column to jump to
   * @returns {void}
   */
  function editorGoToLine(line, column) {
    window.scrollTo(0, 0);
    editor.focus();
    editor.gotoLine(line, column - 1);
  }

  /**
   * Returns a generic result object with given parameter
   * @param {string} label - label for result message displayed in strong
   * @param {string} text - description of result displayed in paragraph
   * @param {string} type - type/id of error
   * @param {number} line - line number associated with result
   * @param {number} column - column number associated with result
   * @returns {void}
   */
  function getResult(label, text, type, line, column) {
    let result = {};
    result.label = label;
    result.text = text;
    result.type = type;
    result.line = line;
    result.column = column;
    return result;
  }

})();

/*
(\__/)
(•ㅅ•)
*/
