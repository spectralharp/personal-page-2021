/*
 * Name: Chao Hsu Lin
 * Date: 10-16-2018
 * Section: CSE 154 AI
 * This JS manages options for my cryptogram generator. It changes size of the font in the
 * input/output area, capitalize input, and switches between available options of differenc
 * cipher types
 */

(function() {
  "use strict";

  window.addEventListener("load", initialize);

  /**
   * Called when the window is loaded, initialize event listeners
   * @returns {void}
   */
  function initialize() {
    closeAllEncryptOption();
    $("switch-button").addEventListener("click", switchSide);
    $("all-caps").addEventListener("click", capitalizeInput);
    $("font-size").addEventListener("change", changeFontSize);
    $("encrypt-type").addEventListener("change", updateOption);

    $("hacker-mode").addEventListener("change", engageHackerMode);

    $("open-import-button").addEventListener("click", function() { showBox("map-import-box"); });
    $("open-export-button").addEventListener("click", function() { showBox("map-export-box"); });

    $("close-import-button").addEventListener("click", closeAllBox);
    $("close-export-button").addEventListener("click", closeAllBox);

    $("output-copy-button").addEventListener("click", function() { copy("output"); });
    $("map-copy-button").addEventListener("click", function() { copy("map-export"); });
  }

  /**
   * Switches text in input and output field
   * @returns {void}
   */
  function switchSide() {
    let tmp = $("input").value;
    $("input").value = $("output").value;
    $("output").value = tmp;
  }

  /**
   * Capitalizes text in input field
   * @returns {void}
   */
  function capitalizeInput() {
    $("input").value = $("input").value.toUpperCase();
  }

  /**
   * Changes the font size of input and output field
   * @returns {void}
   */
  function changeFontSize() {
    let newFontSize = $("font-size").value + "px";
    $("input").style.fontSize = newFontSize;
    $("output").style.fontSize = newFontSize;
  }

  /**
   * Updates the option based on selected encrypt type
   * @returns {void}
   */
  function updateOption() {
    let encryptType = $("encrypt-type").value;
    closeAllEncryptOption();

    if(encryptType.length > 0) {
      showElement(encryptType + "-option");
    }
  }

  /**
   * Hides all encrypt options
   * @returns {void}
   */
  function closeAllEncryptOption() {
    let options = $("encrypt-type").options;
    for(let i = 0; i < options.length; i++) {
      if(options[i].value.length > 0) {
        hideElement(options[i].value + "-option");
      }
    }
  }

  /**
   * Make textarea and button lime and black
   * @returns {void}
   */
  function engageHackerMode() {
    let hackerElements = qsa("textarea, button, h1");
    if($("hacker-mode").checked) {
      for(let i = 0; i < hackerElements.length; i++) {
        hackerElements[i].classList.add("hacker");
      }
    } else {
      for(let i = 0; i < hackerElements.length; i++) {
        hackerElements[i].classList.remove("hacker");
      }
    }
  }

  /**
   * Shows an element by removing "hidden" from the element's class list
   * @param {string} id - The id of the element
   * @returns {void}
   */
  function showElement(id) {
    $(id).classList.remove("hidden");
  }

  /**
   * Hides an element by adding "hidden" from the element's class list
   * @param {string} id - The id of the element
   * @returns {void}
   */
  function hideElement(id) {
    $(id).classList.add("hidden");
  }

  /**
   * Shows a box with the id
   * @param {string} id - The id of the box
   * @returns {void}
   */
  function showBox(id) {
    closeAllBox();
    showElement("overlay");
    showElement(id);
  }

  /**
   * Hides all overlay boxes
   * @returns {void}
   */
  function closeAllBox() {
    $("map-import").value = "";
    hideElement("overlay");
    let boxes = qsa(".box");
    for(let i = 0; i < boxes.length; i++) {
      boxes[i].classList.add("hidden");
    }
  }

  /**
   * Copies text from output to clipboard
   * @param {string} id - The id of the element containing the text to copy
   * @returns {void}
   */
  function copy(id) {
    let copyText = $(id);
    copyText.select();
    document.execCommand("copy");
  }

  /**
   * Returns the element in the document with the given id
   * @param {string} id - The id of the element
   * @returns {Object} element with the given id
   */
  function $(id) {
    return document.getElementById(id);
  }

  /**
   * Returns the element in the document with the given id
   * @param {string} selector - The selector to use
   * @returns {Object} elements that match the selector
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }
})();

/*
 *  (\__/)
 *  (•ㅅ•)
 */
