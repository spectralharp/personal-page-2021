/*
* Name: Chao Hsu Lin
* Date: 10-16-2018
* Section: CSE 154 AI
* This JS implements the logic for my cryptogram generator. It generates encrypted text using
* shift cipher, XOR cipher, and homophonic substitution cipher from user input.
*/

(function() {
  "use strict";

  /* --------------------------------------- Constants -------------------------------------- */

  // Upper case latin alphabet
  const LATIN_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  // Lower case latin alphabet
  const LATIN_ALPHABET_LOW = "abcdefghijklmnopqrstuvwxyz";
  // Numbers 0 through 9
  const NUMBERS = "0123456789";
  // Frequency of the alphabet character based on amount of tiles in Scrabble divided by 4
  // Every number in this list that is not a 1 causes a warning in JSLint
  const FREQUENCY = [2, 1, 1, 1, 4, 1, 1, 1, 2, 1, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1];
  // Character code for "A"
  const CHAR_CODE_UPPER_A = 65;
  // Character code for "Z"
  const CHAR_CODE_UPPER_Z = 90;
  // Character code for "a"
  const CHAR_CODE_LOWER_A = 97;
  // Character code for "z"
  const CHAR_CODE_LOWER_Z = 122;

  /* ------------------------------------- Module-Global ------------------------------------ */

  // Used by encryptHomophonic to encrypt text with homophonic substitution cipher
  let homophonicMap = null;
  // Used by custom cipher
  let map = [];
  // Used to edit mapped value
  let mapCellList = [];
  // Morse code object
  let morseData = null;

  /* ------------------------------------- Initialization ----------------------------------- */

  /**
   *  Add a function that will be called when the window is loaded.
   */
  window.addEventListener("load", initialize);

  /**
   * Called when the window is loaded, initialize event listeners
   * @returns {void}
   */
  function initialize() {
    $("encrypt-button").addEventListener("click", encrypt);
    $("decrypt-button").addEventListener("click", decrypt);
    $("homophonic-map-button").addEventListener("click", generateHomophonicMap);
    $("map-import-button").addEventListener("click", importMap);
    $("edit-map-button").addEventListener("click", modifyMap);
    $("finish-edit-map-button").addEventListener("click", finishModifyMap);
    $("add-item-button").addEventListener("click", function() {
      putToMap(map, $("add-item-input").value, ["[placeholder]"]);
      finishModifyMap();
      modifyMap();
    });
    makeRequest();
  }

  /**
   * Encrypts the text in input text area and change the output text area to the encrypted text
   * @returns {void}
   */
  function encrypt() {
    // Get text from input field
    let text = $("input").value;
    let encryptType = $("encrypt-type").value;
    let encryptedText = "";

    // Do different things based on selected encrypt type
    switch (encryptType) {
      case "shift": {
        // This end up being the bug that took me the most time to figure out:
        // <input>s, even when the type is set to number, returns string as values
        let shift = parseInt($("shift").value);
        encryptedText = encryptShift(text, shift);
        // Generate map between alphabet and encrypted alphabet
        let shiftCharset = LATIN_ALPHABET.concat(LATIN_ALPHABET_LOW);
        map = generateCharacterMap(shiftCharset, encryptShift(shiftCharset, shift));
        // Update the table with map used
        changeMapTable(map);
        break;
      }
      case "xor": {
        let key = parseInt($("key").value);
        encryptedText = encryptXor(text, key);
        map = generateCharacterMap(LATIN_ALPHABET, encryptXor(LATIN_ALPHABET, key));
        changeMapTable(map);
        break;
      }
      case "morse": {
        encryptedText = encryptMorse(text);
        map = morseData;
        changeMapTable(morseData);
        break;
      }
      case "homophonic": {
        encryptedText = encryptHomophonic(text);
        map = homophonicMap;
        changeMapTable(homophonicMap);
        break;
      }
      case "custom": {
        encryptedText = encryptWithMap(text);
        break;
      }
      default: {
        encryptedText = text;
      }
    }
    if(!$("hacker-mode").checked) {
      // Set output to encrypted text
      $("output").value = encryptedText;
    } else {
      textTyper(encryptedText);
    }

    // Output the map to the map output text area
    $("map-export").value = JSON.stringify(map);
  }

  /**
   * Decrypts the text in input text area and change the output text area to the decrypted text
   * @returns {void}
   */
  function decrypt() {
    // Almost like the encrypt function, may refactor this in the future
    let text = $("input").value;
    let encryptType = $("encrypt-type").value;
    let decryptedText = "";

    switch (encryptType) {
      case "shift": {
        let shift = parseInt($("shift").value);
        decryptedText = encryptShift(text, LATIN_ALPHABET.length - shift);
        changeMapTable(generateCharacterMap(LATIN_ALPHABET, encryptShift(LATIN_ALPHABET, shift)));
        break;
      }
      case "xor": {
        let key = parseInt($("key").value);
        decryptedText = encryptXor(text, key);
        changeMapTable(generateCharacterMap(LATIN_ALPHABET, encryptXor(LATIN_ALPHABET, key)));
        break;
      }
      case "morse": {
        decryptedText = decryptMorse(text);
        changeMapTable(map);
        break;
      }
      case "homophonic": {
        decryptedText = decryptMap(text);
        changeMapTable(map);
        break;
      }
      case "custom": {
        decryptedText = decryptMap(text);
        changeMapTable(map);
        break;
      }
      default: {
        decryptedText = text;
      }
    }

    $("output").value = decryptedText;
  }


  /* -------------------------------------- Encrypt Types ----------------------------------- */

  /**
   * Encrypts the text using a shift cipher, shift cipher encrypts text by shifting an alphabet
   * a number of letters further in the alphabet.
   * @param {string} input - text to be encrypted
   * @param {number} shift - number of letter to shift
   * @returns {string} encrypted text
   */
  function encryptShift(input, shift) {
    let output = "";
    for (let i = 0; i < input.length; i++) {
      let charCode = input.charCodeAt(i);
      if (CHAR_CODE_UPPER_A <= charCode && charCode <= CHAR_CODE_UPPER_Z) {
        // If character is between A~Z, shift character code by shift amount bounded between A~Z
        let shiftedCharCode = repeat(charCode + shift, CHAR_CODE_UPPER_A, CHAR_CODE_UPPER_Z);
        output += String.fromCharCode(shiftedCharCode);
      } else if (CHAR_CODE_LOWER_A <= charCode && charCode <= CHAR_CODE_LOWER_Z) {
        // If character is between a~z, shift character code by shift amount bounded between a~z
        let shiftedCharCode = repeat(charCode + shift, CHAR_CODE_LOWER_A, CHAR_CODE_LOWER_Z);
        output += String.fromCharCode(shiftedCharCode);
      } else {
        // Don't do anything to original character if it's not between A~Z or a~z
        output += input.charAt(i);
      }
    }
    return output;
  }

  /**
   * Encrypts the text using an XOR cipher, XOR cipher encrypts text by comparing a character's
   * bits to a key.
   * @param {string} input - text to be encrypted
   * @param {number} key - key to compare text with
   * @returns {string} encrypted text
   */
  function encryptXor(input, key) {
    let output = "";
    for (let i = 0; i < input.length; i++) {
      // A ^ B = C and C ^ B = A
      // So if you take the bits of a character and xor it with a key and get a result
      // The result xor the key will turn it back to the character
      output += String.fromCharCode(input[i].charCodeAt() ^ key);
    }
    return output;
  }

  /**
   * Encrypts the text using an homophonic substitution cipher, homophonic substitution cipher
   * encrypts text with multiple substitutions to decrease the frequency of some characters.
   * @param {string} input - text to be encrypted
   * @returns {string} encrypted text
   */
  function encryptHomophonic(input) {
    if (homophonicMap === null) {
      generateHomophonicMap();
    }
    // Capitalize input because I'm too lazy to support lower case letters
    input = input.toUpperCase();

    let output = "";
    for (let i = 0; i < input.length; i++) {
      // Just use the map to get encrypted values
      output += getRandomFromMap(homophonicMap, input.charAt(i));
    }
    return output;
  }

  /**
   * Encrypts the text using an the morse code
   * @param {string} input - text to be encrypted
   * @returns {string} encrypted text
   */
  function encryptMorse(input) {
    input = input.toUpperCase();
    if (morseData !== null) {
      let output = "";
      for (let i = 0; i < input.length; i++) {
        // Just use the map to get encrypted values
        output += getFromMap(morseData, input.charAt(i)) + " ";
      }

      return output.trim();

    } else {
      return input;
    }
  }

  /**
   * Encrypts the text using an the map stored
   * @param {string} input - text to be encrypted
   * @returns {string} encrypted text
   */
  function encryptWithMap(input) {
    if (map !== null) {
      let output = "";
      for (let i = 0; i < input.length; i++) {
        // Just use the map to get encrypted values
        output += getRandomFromMap(map, input.charAt(i));
      }

      return output;
    } else {
      map = generateCharacterMap(LATIN_ALPHABET, LATIN_ALPHABET);
    }
  }

  /* -------------------------------------- Decrypt Types ----------------------------------- */

  /**
   * Decrypts the text using an the morse code
   * @param {string} input - text to be encrypted
   * @returns {string} encrypted text
   */
  function decryptMorse(input) {
    if (morseData !== null) {
      let output = "";
      let tokens = input.split(" ");
      for (let i = 0; i < tokens.length; i++) {
        // Just use the map to get encrypted values
        output += getKeyFromValue(morseData, tokens[i]);
      }
      return output;
    } else {
      return input;
    }
  }

  /**
   * Decrypts the text using the map
   * @param {string} input - text to be decrypted
   * @returns {string} decrypted text
   */
  function decryptMap(input) {
    // Only decrypt when there is a map
    if (map !== null) {
      let output = "";
      for (let i = 0; i < input.length; i++) {
        // Just use the map to get decrypted values
        output += getKeyFromValue(map, input.charAt(i));
      }
      return output;
    }
  }

  /* -------------------------------------- Map Generation ---------------------------------- */

  /**
   * Returns a map created from a character string and a substitution string.
   * @param {string} character - each character in the string is used as the key
   * @param {string} substitution - each character in the string is used as the value
   * @returns {Object[]} map generated from the given key and values
   */
  function generateCharacterMap(character, substitution) {
    let map = {};
    for (let i = 0; i < character.length; i++) {
      putToMap(map, character[i], substitution[i]);
    }
    return map;
  }

  /**
   * Generates a map for homophonic substitution cipher and update the substitution table
   * @returns {void}
   */
  function generateHomophonicMap() {
    // Create a map
    let newMap = {};
    // Add numbers to the alphabet so there is more values than keys
    let possibleCharacters = shuffle(Array.from(LATIN_ALPHABET.concat(NUMBERS)));
    for (let curKey = 0; curKey < LATIN_ALPHABET.length; curKey++) {
      // Based on frequency of a letter, add 1 or multiple substitutions to that letters
      // Letters like e or t has a higher frequency, encrypting them with multiple substitutions
      // decrease their frequency to counter frequency analysis
      let substitutionList = [];
      for (let s = 0; s < FREQUENCY[curKey]; s++) {
        // Substitution might happen to be the same character as the original character
        // Which could be a flaw? but could also make the code harder to crack
        let substitution = possibleCharacters.pop();
        substitutionList.push(substitution);
      }
      // All this reminds me of CSE 143, good times
      for(let i = 0; i < substitutionList.length; i++) {
        putToMap(newMap, LATIN_ALPHABET[curKey], substitutionList[i]);
      }
    }

    homophonicMap = newMap;
    map = newMap;
    changeMapTable(newMap);
    $("map-export").value = JSON.stringify(map);
  }

  /**
   * Import a custom map for custom ciphers
   * @returns {void}
   */
  function importMap() {
    try {
      map = JSON.parse($("map-import").value);
      $("map-export").value = JSON.stringify(map);
      changeMapTable(map);
    } catch (e) {
      alert("Map Format is invalid: " + e);
    }
  }

  /* -------------------------------------- Map Traversal ----------------------------------- */

  /**
   * Returns a random value of the given key from the given map
   * @param {Object[]} map - map to retrieve value from
   * @param {string} key - key of the value to retrieve
   * @returns {string[]} value of the given key from the given map
   */
  function getRandomFromMap(map, key) {
    if (key in map) {
      if(map[key].length > 0) {
        let randomIndex = Math.floor(Math.random() * map[key].length);
        return map[key][randomIndex];
      }
    }
    let placeholderText = $("ph-text").value;
    if(placeholderText.length > 0) {
      return placeholderText;
    } else {
      return key;
    }
  }

  /**
   * Returns the value of the given key from the given map
   * @param {Object[]} map - map to retrieve value from
   * @param {string} key - key of the value to retrieve
   * @returns {string[]} value of the given key from the given map
   */
  function getFromMap(map, key) {
    if(key in map) {
      return map[key];
    } else {
      return key;
    }
  }

  /**
   * Returns the first key of the given value from the given map, returns value if no key is
   * found
   * @param {Object[]} map - map to retrieve key from
   * @param {string} value - one of the value of the key to retrieve
   * @returns {string} key of the given value from the given map, "[NO-KEY]" if no key is found
   */
  function getKeyFromValue(map, value) {
    let keys = Object.keys(map);
    for (let i = 0; i < keys.length; i++) {
      let values = map[keys[i]];
      for(let v = 0; v < values.length; v++) {
        if (value === values[v]) {
          return keys[i];
        }
      }
    }
    return value;
  }

  /**
   * Adds a key-value pair to the map
   * @param {Object[]} map - the map to add the pair to
   * @param {string} key - the key of the key-value pair
   * @param {string[]} value - the value of the key-value pair
   * @returns {void}
   */
  function putToMap(map, key, value) {
    if(key in map) {
      map[key].push(value);
    } else {
      map[key] = [value];
    }
  }

  /**
   * Remove a key from the map
   * @param {Object[]} map - the map to remove key from
   * @param {string} key - the key of the key-value pair
   * @returns {void}
   */
  function removeKey(map, key) {
    delete map[key];
  }

  /**
   * Set a value of the map to an empty array
   * @param {Object[]} map - the map to add the pair to
   * @param {string} key - the key of the key-value pair
   * @returns {void}
   */
  function resetValueOfKey(map, key) {
    map[key] = [];
  }

  /* -------------------------------------- User Interface ---------------------------------- */

  /**
   * Changes the substitution table so that is shows the given map
   * @param {Object[]} map - map to show in the table
   * @returns {void}
   */
  function changeMapTable(map) {
    let rowChar = $("row-char");
    let rowSub = $("row-sub");
    let rowEdit = $("row-edit");

    clearOldMapTableRow(rowChar);
    clearOldMapTableRow(rowSub);
    clearOldMapTableRow(rowEdit);

    $("row-edit").classList.add("hidden");

    mapCellList = [];

    let keys = Object.keys(map);
    for (let i = 0; i < keys.length; i++) {
      let keyText = keys[i] === " " ?  "\" \"" : keys[i];
      appendCellWithText(rowChar, keyText);
      let subCell = appendCellWithText(rowSub, map[keys[i]]);
      let mapCell = {
        cell: subCell,
        key: keys[i]
      };
      mapCellList.push(mapCell);
    }
  }

  /**
   * Remove all except the first cell in a table row element
   * @param {Object} row - table row element to clear cells
   * @returns {void}
   */
  function clearOldMapTableRow(row) {
    let columnCount = row.cells.length;
    for (let i = 1; i < columnCount; i++) {
      row.deleteCell(1);
    }
  }

  /**
   * Appends a cell to the end of the given row with the given text as inner HTML
   * @param {Object} row - row to append cell to
   * @param {string} text - text to set as inner HTML in the appended cell
   * @returns {Object} cell added to row
   */
  function appendCellWithText(row, text) {
    let cell = row.insertCell(row.cells.length);
    cell.innerHTML = text;
    return cell;
  }

  /**
   * Sets encrypt type to custom and add options to map table to allow customization
   * @returns {void}
   */
  function modifyMap() {
    // Change encrypt type to custom so that map doesn't get override by maps generated by other
    // encrypt types
    $("encrypt-type").value = "custom";

    // change event doesn't get triggered because the input does not have focus
    // So I need to dispatch an event manually
    // https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events
    let event = document.createEvent('Event');
    // Define event name
    event.initEvent('change', true, true);
    // Dispatch event
    $("encrypt-type").dispatchEvent(event);

    for(let i = 0; i < mapCellList.length; i++) {
      addModifyMapOption(mapCellList[i].cell, mapCellList[i].key);
    }

    $("row-edit").classList.remove("hidden");
  }

  /**
   * Reset map table and output new map
   * @returns {void}
   */
  function finishModifyMap() {
    changeMapTable(map);
    $("map-export").value = JSON.stringify(map);
  }

  /**
   * Add a new cell to the edit row with inputs that will allow the user to edit the map
   * @param {Object} cell - cell that contains the value of the map
   * @param {string} key - key of the value in the cell
   * @returns {void}
   */
  function addModifyMapOption(cell, key)
  {
    // Create an edit cell
    let row = $("row-edit");
    let editCell = row.insertCell(row.cells.length);

    // Create a div to position the input options
    let editField = document.createElement("div");
    editField.classList.add("edit-field");

    // Create a input box for new values
    let input = document.createElement("input");
    input.classList.add("small-input");
    input.maxLength = 1;

    editField.appendChild(input);

    // Create a button for adding substitutions
    let addButton = generateSmallButton("Add Sub.");
    addButton.addEventListener("click", function() { addSubstitution(map, key, input, cell); });

    // Create a button for clearing all substitutions
    let clearButton = generateSmallButton("Clear Sub.");
    clearButton.addEventListener("click", function() { clearSubstitution(map, key, cell); });

    // Create a button for removing this key
    let removeButton = generateSmallButton("Remove Key");
    removeButton.addEventListener("click", function() { removeKeyFromTable(map, key); });

    // Append options to the div
    editField.appendChild(addButton);
    editField.appendChild(clearButton);
    editField.appendChild(removeButton);

    // Append the div to the new edit cell
    editCell.appendChild(editField);
  }

  /**
   * Returns a small button element with given text as inner text
   * @param {string} text - inner text for button
   * @returns {Object} button generated
   */
  function generateSmallButton(text) {
    let smallButton = document.createElement("button");
    smallButton.innerText = text;
    smallButton.classList.add("small-button");
    return smallButton;
  }

  /**
   * Put new value to map and change text in original cell
   * @param {string} map - map to change
   * @param {string} key - key of the value in the cell
   * @param {Object} input - input element with the value to add
   * @param {Object} cell - cell that contains the value of the map
   * @returns {void}
   */
  function addSubstitution(map, key, input, cell) {
    putToMap(map, key, input.value);
    cell.innerText = getFromMap(map, key);
  }

  /**
   * Remove all value from map and clear text in original cell
   * @param {string} map - map to change
   * @param {string} key - key of the value in the cell
   * @param {Object} cell - cell that contains the value of the map
   * @returns {void}
   */
  function clearSubstitution(map, key, cell) {
    resetValueOfKey(map, key);
    cell.innerText = "";
  }

  /**
   * Remove key from map and table
   * @param {string} map - map to change
   * @param {string} key - key of the value in the cell
   * @returns {void}
   */
  function removeKeyFromTable(map, key) {
    removeKey(map, key);
    finishModifyMap();
    modifyMap();
  }

  /**
   * Add a key to the map and table
   * @returns {void}
   */
  function addKeyToTable() {
    putToMap(map, $("add-item-input").value, ["[placeholder]"]);
    finishModifyMap();
    modifyMap();
  }



  /* ---------------------------------------- Animation ------------------------------------- */

  // Stores current index for text typer
  let textIndex = 0;
  // Timer for text typer
  let typerTimer = null;
  //
  const TEXT_TYPER_WAIT_TIME = 50;

  /**
   * Output text like a text typer
   * @param {string} text - text to add to output
   * @returns {void}
   */
  function textTyper(text) {
    $("output").value = "";
    textIndex = 0;
    if(typerTimer === null) {
      typerTimer = setInterval(addCharacter, TEXT_TYPER_WAIT_TIME, text);
    }
  }

  /**
   * Adds character at text index to output
   * @param {string} text - text to add to output
   * @returns {void}
   */
  function addCharacter(text) {
    if(textIndex < text.length) {
      $("output").value = $("output").value + text[textIndex];
      textIndex++;
    } else {
      clearInterval(typerTimer);
      typerTimer = null;
    }
  }

  /* ------------------------------------------ AJAX ---------------------------------------- */

  /**
   * Step 1: Write a function to "fetch" data from a URL (possibly with query/value pairs)
   */
  function makeRequest() {
    let url = "data/morse.json";
    fetch(url, {mode : "cors"})
      .then(checkStatus)
      .then(JSON.parse)
      .then(saveToMorse)
      .catch(console.log)
  }

  /**
   * Step 2: Write a function to do something with the response (if successful)
   */
  function saveToMorse(responseData) {
    morseData = responseData;
  }

  /* ------------------------------------- Helper Function ---------------------------------- */

  /**
   * Returns the element in the document with the given id
   * @param {string} id - The id of the element
   * @returns {Object} element with the given id
   */
  function $(id) {
    return document.getElementById(id);
  }

  /**
   * Loops the value t, so that it is never larger than end
   * and never lower than start.
   * @param {number} t - number to loop
   * @param {number} start - number to start from
   * @param {number} end - number to end at
   * @returns {number} looped number
   */
  function repeat(t, start, end) {
    // Interestingly it's a lot like the Mathf.repeat() function from Unity
    if(t > end) {
      let shift = (t - start) % (end - start + 1);
      t = start + shift;
    }
    return t;
  }

  /**
   * Shuffles elements in an array, adapted from https://bost.ocks.org/mike/shuffle/
   * @param {Object[]} array - array to shuffle
   * @returns {Object[]} shuffled array
   */
  function shuffle(array) {
    let elementCount = array.length;

    while (elementCount > 0) {

      // Pick random element that has not been shuffled
      let randomIndex = Math.floor(Math.random() * elementCount);
      elementCount--;

      // Swap
      let tmp = array[elementCount];
      array[elementCount] = array[randomIndex];
      array[randomIndex] = tmp;
    }

    return array;
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

})();

/*
 *  (\__/)
 *  (•ㅅ•)
 */
