// Name: Chao Hsu Lin
// Date: 11-30-18
// Section: CSE 154 AI
//
// Handles the front end the Pixprite, coloring pixels, requesting artworks from database,
// and requesting to save the artwork in the database

(function(){
  "use strict";

  /* --------------------------------------- Constants -------------------------------------- */

  // Default pallete for the app
  const PALLETE = ["4D1F4D", "A63A82", "A64B4B", "15788C", "266EFF", "283B73", "341F34",
                   "FFBCA6", "FF5983", "F37C55", "14CC80", "00D5FF", "8CB2FF", "642DB3",
                   "FFFFFF", "FFEECC", "FFC34D", "CBE545", "80FFEA", "DAEAF2", "6F66CC"];

  // Size of the boxes that represent the pixels
  const PIXEL_SIZE_BOX = 30;
  // Size of the pixels in showcase canvases
  const PIXEL_SIZE_SHOWCASE = 10;
  // Default width and length for the canvas
  const DEFAULT_SIZE = 16;
  // Number of artwork to request in the showcase area
  const SHOWCASE_COUNT = 12;
  // Time before invalid input return to normal style
  const INVALID_WAIT_TIME = 800;
  // Time before message box disappears
  const MESSAGE_BOX_STAY_TIME = 3000;
  // Message to show when name is empty
  const MSG_EMPTY_NAME = "Name cannot be empty";
  // Message to show when password is empty
  const MSG_EMPTY_PASSWORD = "Password cannot be empty";
  // Message to show when name consist of invalid characters
  const MSG_INVALID_NAME = "Name can only consist of alphanumeric characters or spaces";
  // Message to show when password consist of invalid characters
  const MSG_INVALID_PASSWORD = "Password needs to be at least 4 characters long, and can only consist of alphanumeric characters and certain special characters (@, !, #, ?, %, -, +, _)";

 /* ------------------------------------- Module-Global ------------------------------------ */

  // Current stroke color
  let currentColor = "FFFFFF";
  // Grid represented as 2D array
  let grid;
  // True when mouse is down
  let mouseDown = false;
  // Size of the current canvas
  let gridSizeX = DEFAULT_SIZE;
  let gridSizeY = DEFAULT_SIZE;

  /* ------------------------------------- Initialization ----------------------------------- */

  // Add a function that will be called when the window is loaded
  window.addEventListener("load", initialize);

  /**
   * Initializes the grid and populates the pallete, set up buttons
   * @returns {void}
   */
  function initialize() {
    populatePallete();
    initializeGrid(gridSizeX, gridSizeY);
    // Set custom color when the input is changed
    $("set-color").addEventListener("click", setCustomPallete);
    $("color-input").addEventListener("input", capitalizeInput);
    $("color-input").addEventListener("change", checkHex);
    // Set up toggles
    $("show-border").addEventListener("change", toggleBorder);
    $("art-private").addEventListener("change", togglePassword);
    // Set up fetch
    $("save-art").addEventListener("click", saveArt);
    $("get-art").addEventListener("click", getArt);

    $("show-more").addEventListener("click", function() {getArtRandom(SHOWCASE_COUNT);});
    getArtRandom(SHOWCASE_COUNT);
  }

  /**
   * Populates the pallete with default colors
   * @param {Object} pokemon - pokemon to update position
   * @returns {void}
   */
  function populatePallete() {
    let palleteContainer = $("pallete");
    for(let i = 0; i < PALLETE.length; i++) {
      palleteContainer.appendChild(createPalleteTile(PALLETE[i]));
    }
  }

  /**
   * Creates and returns a pallete tile with the given tile color
   * @param {string} palleteColor - color of the tile
   * @returns {HTMLElement} a pallete tile
   */
  function createPalleteTile(palleteColor) {
    let tile = document.createElement("div");
    tile.classList.add("pallete-tile");
    tile.style.backgroundColor = "#" + palleteColor;
    tile.dataset.color = palleteColor;
    tile.addEventListener("click", setStrokeColor);
    return tile;
  }

  /* ------------------------------------ Grid Generation ----------------------------------- */

  /**
   * Initializes the grid with the given size with a white background
   * @param {number} xSize - width of the canvas
   * @param {number} ySize - height of the canvas
   * @returns {void}
   */
  function initializeGrid(xSize, ySize) {
    // Didn't have time to implement resizable canvas but it's possible!

    // Resize the frame of the physical grid element before adding boxes
    resizeGridFrame(xSize, ySize);
    // Append boxes to both the physical grid element and the grid array in background
    grid = [];
    let gridElement = $("grid");
    for (let y = 0; y < ySize; y++) {
      let row = [];
      for (let x = 0; x < xSize; x++) {
        gridElement.appendChild(createBox(x, y, currentColor));
        row.push("FFFFFF");
      }
      grid.push(row);
    }
  }

  /**
   * Resizes the physical grid element so that the boxes will fit nicely
   * @param {number} xSize - width of the canvas
   * @param {number} ySize - height of the canvas
   * @returns {void}
   */
  function resizeGridFrame(xSize, ySize) {
    let gridElement = $("grid");
    // Clear all existing boxes
    gridElement.innerHTML = "";
    let xStyle = PIXEL_SIZE_BOX * xSize + "px";
    let yStyle = PIXEL_SIZE_BOX * ySize + "px";
    gridElement.style.width = xStyle;
    gridElement.style.height = yStyle;
    gridElement.style.minWidth = xStyle;
    gridElement.style.minHeight = yStyle;
    // Save size to variable
    gridSizeX = xSize;
    gridSizeY = ySize;
  }

  /**
   * Create a box element that fills in the chosen color when clicked or draged over
   * @param {number} x - x coordinate of the box
   * @param {number} y - y coordinate of the box
   * @param {string} color - color of the box
   * @returns {void}
   */
  function createBox(x, y, color) {
    let box = document.createElement("div");
    box.classList.add("box");
    box.dataset.x = x;
    box.dataset.y = y;
    box.addEventListener("mousedown", fillColorClick);
    box.addEventListener("mouseenter", fillColorDrag);
    // Event listener that records when the mouse is down or up
    box.addEventListener("mousedown", function() { mouseDown = true; });
    box.addEventListener("mouseup", function() { mouseDown = false; });
    fillColor(box, color);
    return box;
  }

  /* ----------------------------------------- Update --------------------------------------- */

  /**
   * Checks if the input area contains a valid hex code, add a hashtag in front if it's missing
   * @returns {void}
   */
  function checkHex() {
    let inputValue = this.value;
    let isHex = /^#?[A-Fa-f\d]{6}$/.test(inputValue);
    if(isHex) {
      this.classList.remove("invalid");
      if(inputValue.length === 6) {
        this.value = "#" + this.value;
      }
    } else {
      this.classList.add("invalid");
    }
  }

  /**
   * Capitalize the input in the color input area
   * @returns {void}
   */
  function capitalizeInput() {
    this.value = this.value.toUpperCase();
  }

  /**
   * Sets the selected pallete tile to the color in the color input field
   * @returns {void}
   */
  function setCustomPallete() {
    $("color-input").value.replace(/^#?([A-Fa-f\d]{6})$/, function(match, color) {
      let tile = qs(".selected");
      tile.style.backgroundColor = "#" + color;
      tile.dataset.color = color;
      currentColor = color;
    });
  }

  /**
   * Sets the current color to the selected pallete tile
   * @returns {void}
   */
  function setStrokeColor() {
    let selected = qs(".selected");
    if(selected !== null) {
      selected.classList.remove("selected");
    }
    this.classList.add("selected");
    currentColor = this.dataset.color;
  }

  /**
   * Fills the box element with the given color
   * @param {HTMLElement} box - box to fill in color
   * @param {string} color - color to fill in
   * @returns {void}
   */
  function fillColor(box, color) {
    box.style.backgroundColor = "#" + color;
  }

  /**
   * Fills in the clicked box element with current color
   * @returns {void}
   */
  function fillColorClick() {
    fillColor(this, currentColor);
    grid[this.dataset.x][this.dataset.y] = currentColor;
  }

  /**
   * Fills in the hover overed box element with current color if the mouse is down
   * @returns {void}
   */
  function fillColorDrag() {
    if(mouseDown) {
      fillColor(this, currentColor);
      grid[this.dataset.x][this.dataset.y] = currentColor;
    }
  }

  /* ---------------------------------------- Toggles --------------------------------------- */

  /**
   * Toggles the border on the grid
   * @returns {void}
   */
  function toggleBorder() {
    if(this.checked) {
      $("grid").classList.add("show-border");
    } else {
      $("grid").classList.remove("show-border");
    }
  }

  /**
   * Toggles password field
   * @returns {void}
   */
  function togglePassword() {
    if(this.checked) {
      showElement($("password") , true);
    } else {
      showElement($("password") , false);
    }
  }

  /* --------------------------------------- AJAX calls ------------------------------------- */

  /**
   * Saves the current artwork to the database
   * @returns {void}
   */
  function saveArt() {
    let params = getParams();
    params.append("x", gridSizeX);
    params.append("y", gridSizeY);
    if(params !== null) {
      fetch("insert_art.php", { method : "POST", body : params })
        .then(checkStatus)
        .then(JSON.parse)
        .then(function(response) {
          showStatusMessage(response.status);
        })
        .catch(console.log);
    }
  }

  /**
   * Gets an artwork from the database and put it on the grid
   * @returns {void}
   */
  function getArt() {
    let params = getParams();
    params.append("mode", "single");
    if(params !== null) {
    fetch("get_art.php", { method : "POST", body : params })
      .then(checkStatus)
      .then(JSON.parse)
      .then(putArtToGrid)
      .catch(console.log);
    }
  }

  /**
   * Gets a number of random artworks from database and put them in showcase area
   * @param {number} count - number of artworks to retrieve
   * @returns {void}
   */
  function getArtRandom(count) {
    let params = new FormData();
    params.append("mode", "random");
    params.append("count", count);
    if(params !== null) {
    fetch("get_art.php", { method : "POST", body : params })
      .then(checkStatus)
      .then(JSON.parse)
      .then(putArtToShowcase)
      .catch(console.log);
    }
  }

  /* ------------------------------------ Handle Response ----------------------------------- */


  /**
   * Puts the returned artwork to the grid
   * @param {Object} response - response from get_art.php, contains an artwork
   * @returns {void}
   */
  function putArtToGrid(response) {
    showStatusMessage(response.status);
    // Set the grid array in background to returned value
    grid = response.result[0].art;
    // Resize the frame of the physical grid element before adding boxes
    let size = response.result[0].size;
    resizeGridFrame(size.x, size.y);
    // Append boxes to both the physical grid element
    let gridElement = $("grid");
    for (let y = 0; y < size.y; y++) {
      for (let x = 0; x < size.x; x++) {
        gridElement.appendChild(createBox(x, y, grid[x][y]));
      }
    }
  }

  /**
   * Puts the artworks returned to the showcase area
   * @param {Object} response - response from get_art.php, contains artworks
   * @returns {void}
   */
  function putArtToShowcase(response) {
    // Clear all showcase items
    $("canvas-container").innerHTML = "";

    let pixelSize = PIXEL_SIZE_SHOWCASE;

    for(let i = 0; i < response.result.length; i++) {
      let artGrid = response.result[i].art;
      let size = response.result[i].size;

      let showcase = document.createElement("div");
      showcase.classList.add("showcase");
      showcase.classList.add("flex-column");

      // Create a canvas to draw on
      let canvas = document.createElement("canvas");
      // Setup canvas size
      canvas.width = size.x * pixelSize;
      canvas.height = size.y * pixelSize;
      let ctx = canvas.getContext("2d");
      // Use context to draw out the pixel art
      for (let y = 0; y < size.y; y++) {
        for (let x = 0; x < size.x; x++) {
          ctx.fillStyle = "#" + artGrid[x][y];
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
      }
      // Add the artworks name
      let name = document.createElement("h3");
      name.classList.add("showcase-art-name");
      name.innerText = response.result[i].name;
      // Append to showcase area
      showcase.appendChild(canvas);
      showcase.appendChild(name);
      $("canvas-container").appendChild(showcase);
    }
  }

  /* ----------------------------------- Input Verification --------------------------------- */

  /**
   * Returns the params to use in requests, making sure the name and password inputs
   * are valid.
   * Returns null if the inputs are invalid
   * @returns {FormData} params to use in requests
   */
  function getParams() {
    let nameInput = $("art-name");
    let passwordInput = $("art-password");
    let privateInput = $("art-private");

    if(nameInput.checkValidity()) {
      let params = new FormData();

      params.append("name", nameInput.value);
      params.append("artwork", getGridString());

      if(privateInput.checked) {
        // Is private
        if(passwordInput.checkValidity()) {
          params.append("password", passwordInput.value);
          return params;
        } else {
          showInvalidInputMessage(passwordInput, MSG_EMPTY_PASSWORD, MSG_INVALID_PASSWORD);
          return null;
        }
      } else {
        return params;
      }
    } else {
      showInvalidInputMessage(nameInput, MSG_EMPTY_NAME, MSG_INVALID_NAME);
      return null;
    }
  }

  /**
   * Shows the empty message if the input is empty, shows the invalid message if the input
   * contains invalid values
   * @param {HTMLElement} input - input to ckeck
   * @param {string} empty - empty message to show
   * @param {string} invalid - invalid message to show
   * @returns {void}
   */
  function showInvalidInputMessage(input, empty, invalid) {
    if(input.value.length === 0) {
      styleInvalidInput(input);
      showStatusMessage(getFailStatus(empty));
    } else {
      styleInvalidInput(input);
      showStatusMessage(getFailStatus(invalid));
    }
  }

  /**
   * Adds invalid class to input, clear the input, and set it back after a short amount
   * of time
   * @param {HTMLElement} input - input to style
   * @returns {void}
   */
  function styleInvalidInput(input) {
    input.classList.add("invalid");
    input.value = "";
    setTimeout(function() { input.classList.remove("invalid"); }, INVALID_WAIT_TIME);
  }

  /* -------------------------------------- Message box ------------------------------------- */

  /**
   * Returns a status object that indicates a fail type with the given message
   * @param {string} message - message of the failed status
   * @returns {Object} status object that indicates a fail type with the given message
   */
  function getFailStatus(message) {
    let status = {type: "fail", message: message};
    return status;
  }

  /**
   * Shows the message in the status object, coloring the message box depending on the
   * status type
   * @param {Object} status - status object
   * @returns {void}
   */
  function showStatusMessage(status) {
    let messageBox = $("message-box");
    if(status.type === "success") {
      messageBox.classList.remove("message-fail");
      messageBox.classList.add("message-success");
    } else if (status.type === "fail") {
      messageBox.classList.remove("message-success");
      messageBox.classList.add("message-fail");
    }
    messageBox.innerText = status.message;
    showElement(messageBox, true);
    setTimeout(function(){ showElement(messageBox, false); }, MESSAGE_BOX_STAY_TIME);
  }

  /**
   * Shows the element or hide the element
   * @param {HTMLElement} el - element to show / hide
   * @param {boolean} show - whether the element should be shown
   * @returns {void}
   */
  function showElement(el, show) {
    if(show) {
      el.classList.remove("hidden");
    } else {
      el.classList.add("hidden");
    }
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
   * Returns the first element that matches the given CSS selector.
   * @param {string} query - CSS query selector.
   * @returns {object} The first DOM object matching the query.
   */
  function qs(query) {
    return document.querySelector(query);
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

  /**
   * Formats the array representation of the grid into a long string
   * Each element in the grid holds a color string (ex. "FFFFFF")
   * This function joins all of them together column by column
   * ex.
   * [["DDDDDD", "FFFFFF", "FFFFFF"],["DDDDDD", "FFFFFF", "FFFFFF"]]
   * becomes
   * "DDDDDDFFFFFFFFFFFFDDDDDDFFFFFFFFFFFF"
   * @returns {string} array representation of the grid in a long string format
   */
  function getGridString() {
    let gridString = "";
    for(let x = 0; x < gridSizeX; x++) {
      for(let y = 0; y < gridSizeY; y++) {
        gridString += grid[x][y];
      }
    }
    return gridString;
  }

})();
