// Name: Chao Hsu Lin
// Date: 11-01-18
// Section: CSE 154 AI
//
// Fetches data from PokeAPI and use it to draw bouncy pokemon's on canvas
//

(function() {
  "use strict";

  /* --------------------------------------- Constants -------------------------------------- */

  // Base URL to PokeAPI
  const POKEAPI_URL = "https://pokeapi.co/api/v2/";
  // How long a frame lasts in milliseconds
  const FRAME_LENGTH = 20;

  // Default size of pokemon on canvas
  const DEFAULT_SIZE = 100;
  // Maximum size of pokemon on canvas
  const MAX_SIZE = 200;
  // How much a pokemon's size increases when fed a berry
  const SIZE_INCREASE = 10;

  // Default speed of pokemon's movement in unit / frame^2
  const DEFAULT_SPEED = 5;
  // Scale of gravity in unit / frame
  const GRAVITY = 0.5;
  // Scale of velocity that is absorbed when pokemon hits the bottom of the canvas in unit / frame
  const ABSORBED = 0.5;

  // Base / minimum time between berry spawn
  const BERRY_TIME = 10000;
  // Random time added between berry spawn
  const BERRY_TIME_RANDOM = 10000;
  // Time the berry lasts on the page
  const BERRY_STAY_TIME = 9000;

  // Names of the fonts that should be used, including fall back fonts
  const NAME_FONT_NAME = "Lato, sans-serif";
  // Font size that should be used for the name in px
  const NAME_FONT_SIZE = 20;
  // The font's average height to width ratio, used to calculate width of text
  const FONT_HEIGHT_TO_WIDTH = 2;

  // Number of pokemon needed for the canvas to wobble
  const WOBBLE_COUNT = 10;

  // Language for pokedex entries, would probably add language option if I have time
  const LANGUAGE = "en";
  // Total number of pokemon's, included because v2/pokemon/ includes pokemon with different forms
  const TOTAL_POKEMON_COUNT = 802;

  /* ------------------------------------- Module-Global ------------------------------------ */

  // Information of the canvas
  let canvas = {
    width: 0,
    height: 0,
    context: null
  };

  // Information of pokemons on the canvas
  let pokemons = [];

  // Stores url to sprites of berries
  // TODO: cache berry sprites path in local storage
  let berrySprites = [];

  // Index of the pokemon that is selected, -1 when none is selected
  let selectedIndex = -1;

  // Timer that runs update
  let timer = null;

  /* ------------------------------------- Initialization ----------------------------------- */

  /**
   *  Add a function that will be called when the window is loaded.
   */
  window.addEventListener("load", initialize);

  /**
   * Set up events for buttons.
   * @returns {void}
   */
  function initialize() {
    $("unselect-btn").addEventListener("click", unselectPokemons);
    $("generate-btn").addEventListener("click", fetchPokemon);
    $("delete-btn").addEventListener("click", removeAllPokemons);
    $("feed-btn").addEventListener("click", feedPokemon);

    setUpCanvas();
    setUpBerry();
  }

  /**
   * Sets up the canvas to listen to click & double click and save the dimension and
   * context of the canvas for later use
   * @returns {void}
   */
  function setUpCanvas() {
    let canvasElement = $("canvas");
    canvasElement.addEventListener("click", selectPokemon);
    canvasElement.addEventListener("dblclick", removePokemon);

    canvas.height = canvasElement.height;
    canvas.width = canvasElement.width;
    canvas.context = canvasElement.getContext("2d");
  }

  /**
   * Sets up the berry system, fetching sprites of berries, getting number of
   * berries the user owns from local storage, and starting timer for the next
   * berry spawn
   * @returns {void}
   */
  function setUpBerry() {
    fetchBerries();
    updateBerryCount();
    // Start timer for next berry
    setTimeout(spawnBerry, getNextBerryTime());
  }

  /* ----------------------------------------- Update --------------------------------------- */

  /**
   * When startUpdate is called, update is called every FRAME_LENGTH milliseconds
   * This function is mostly used to draw frames on canvas
   * @returns {void}
   */
  function update() {
    // Adapted from
    // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Advanced_animations

    // Clear the canvas
    canvas.context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw calls
    for (let i = 0; i < pokemons.length; i++) {
      pokemons[i].draw();
      drawName(pokemons[i]);

      // Update position & velocity after draw call
      updatePosition(pokemons[i]);
      updateVelocity(pokemons[i]);
    }
  }

  /**
   * Starts an interval that calls update every FRAME_LENGTH milliseconds
   * @returns {void}
   */
  function startUpdate() {
    if (timer === null) {
      timer = setInterval(update, FRAME_LENGTH);
    }
  }

  /**
   * Stops the interval that calls update every FRAME_LENGTH milliseconds
   * @returns {void}
   */
  function stopUpdate() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  /**
   * Updates the position of a pokemon
   * @param {Object} pokemon - pokemon to update position
   * @returns {void}
   */
  function updatePosition(pokemon) {
    pokemon.x += pokemon.vx;
    pokemon.y += pokemon.vy;
  }

  /**
   * Updates the position of a pokemon
   * @param {Object} pokemon - pokemon to update velocity
   * @returns {void}
   */
  function updateVelocity(pokemon) {
    // Update velocity
    pokemon.vy += GRAVITY;
    // Calculate next position
    let nextYTop = pokemon.y + pokemon.vy;
    let nextYBottom = pokemon.y + pokemon.size + pokemon.vy;
    let nextXLeft = pokemon.x + pokemon.vx;
    let nextXRight = pokemon.x + pokemon.size + pokemon.vx;
    // If next position is out of bounds, reverse velocity so it bounces back
    // TODO: Actually fix pokemon getting stuck
    if (nextYBottom > canvas.height || nextYTop < 0) {
      pokemon.vy = -pokemon.vy + ABSORBED;
    }
    if (nextXRight > canvas.width || nextXLeft < 0) {
      pokemon.vx = -pokemon.vx;
    }
  }

  /**
   * Draws the name of a pokemon below the sprite
   * @param {Object} pokemon - pokemon to draw name under
   * @returns {void}
   */
  function drawName(pokemon) {
    if (pokemon.selected) {
      // Set up font
      canvas.context.font = NAME_FONT_SIZE + "px " + NAME_FONT_NAME;
      canvas.context.fillStyle = "#ffa851";
      // Calculate position for the top left of the text
      let nameWidth = NAME_FONT_SIZE * pokemon.name.length / FONT_HEIGHT_TO_WIDTH;
      let midPoint = pokemon.x + pokemon.size / 2;

      let nameX = midPoint - nameWidth / 2;
      let nameY = pokemon.y + pokemon.size;
      // Draw the text
      canvas.context.fillText(pokemon.name, nameX, nameY);
    }
  }

  /* --------------------------------------- Selection -------------------------------------- */

  /**
   * Select the clicked pokemon
   * @param {MouseEvent} e - event of the click
   * @returns {void}
   */
  function selectPokemon(e) {
    // Clear all selection
    unselectPokemons();
    // Get mouse position
    let mousePosition = getMousePosition(e);

    // Check every pokemon to see if the mouse is inside a pokemon's sprite rect
    for (let i = 0; i < pokemons.length; i++) {
      // Get the rect of the sprite of the pokemon
      let pokemonRect = getPokemonRect(pokemons[i]);

      if (boundedByRect(mousePosition, pokemonRect)) {
        // Update selected index
        pokemons[i].selected = true;
        selectedIndex = i;
        // Fetch pokedex entry of the selected pokemon
        fetchEntry(pokemons[i].id);
        // Enable feed button if the pokemon is not too big
        if (pokemons[i].size < MAX_SIZE) {
          $("feed-btn").disabled = false;
        }
        // Only one pokemon should be selected, break out of loop here
        break;
      }
    }
  }

  /**
   * Unselect all pokemons
   * @returns {void}
   */
  function unselectPokemons() {
    selectedIndex = -1;
    // Unselect all pokemons
    for (let i = 0; i < pokemons.length; i++) {
      pokemons[i].selected = false;
    }
    removeEntry();
    $("feed-btn").disabled = true;
  }

  /* ------------------------------------- Remove Pokemon ----------------------------------- */

  /**
   * Removes all pokemons, clearing the canvas and stops update
   * @returns {void}
   */
  function removeAllPokemons() {
    pokemons = [];

    stopUpdate();
    removeEntry();
    checkWobble();

    $("unselect-btn").disabled = true;
    $("delete-btn").disabled = true;
    canvas.context.clearRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * Removes clicked pokemon
   * @param {MouseEvent} e - event of the click
   * @returns {void}
   */
  function removePokemon(e) {
    let mousePosition = getMousePosition(e);

    for (let i = 0; i < pokemons.length; i++) {
      // Get the rect of the sprite of the pokemon
      let pokemonRect = getPokemonRect(pokemons[i]);

      if (boundedByRect(mousePosition, pokemonRect)) {
        pokemons.splice(i, 1);
        break;
      }
    }

    removeEntry();
  }

  /* ------------------------------------- Pokedex Entry ------------------------------------ */

  /**
   * Fetch pokedex entry of pokemon with the given id
   * @param {number} id - id number of the pokemon
   * @returns {void}
   */
  function fetchEntry(id) {
    let url = POKEAPI_URL + "pokemon-species/" + id + "/";

    fetch(url, {
        mode: "cors"
      })
      .then(checkStatus)
      .then(JSON.parse)
      .then(updateEntry)
      .catch(handleEntryError);

  }

  /**
   * Update pokedex area with fetched pokedex entry
   * @param {Object} data - fetched pokemon-species data
   * @returns {void}
   */
  function updateEntry(data) {
    let entries = data.flavor_text_entries;
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].language.name === LANGUAGE) {
        // Find either new line or return character, search globally, and replace with space
        // PokeAPI returns flavor text with really weird new line placements
        $("pokedexEntry").innerText = entries[i].flavor_text.replace(/\n|\r/g, " ");
      }
    }
    let names = data.names;
    for (let i = 0; i < names.length; i++) {
      if (names[i].language.name === LANGUAGE) {
        $("pokemonName").innerText = names[i].name;
        pokemons[selectedIndex].name = names[i].name;
      }
    }
  }

  /**
   * Removes pokedex entry from pokedex area and replace with default text
   * @returns {void}
   */
  function removeEntry() {
    $("pokemonName").innerText = "Pokedex";
    let msg = "Click on a pokemon to learn about them!\nDouble click to remove a pokemon!";
    $("pokedexEntry").innerText = msg;
  }

  /**
   * Handles error by printing error message to the pokedex box
   * @param {Object} error - error result from rejected fetch
   * @returns {void}
   */
  function handleEntryError(error) {
    $("pokemonName").innerText = "Pokedex";
    let msg = "Pokedex entry not found!\n" + error;
    $("pokedexEntry").innerText = msg;
  }

  /* --------------------------------------- Berry -------------------------------------- */

  /**
   * Fetches berries from the API
   * @returns {void}
   */
  function fetchBerries() {

    // This endpoint returns an object with "results"
    let url = POKEAPI_URL + "berry/";

    fetch(url, { mode: "cors" })
      .then(checkStatus)
      .then(JSON.parse)
      .then(fetchBerrySprite)
      .catch(handleBerryError);
  }

  /**
   * Fetches sprite of berries from the API and store it in an array
   * @param {Object} berries - berries object from v2/berry endpoint
   * @returns {void}
   */
  function fetchBerrySprite(berries) {
    // That's a lot of then's

    // Let me run this down

    // "count" represents the number of kinds of berries there are
    let berryCount = berries.count;

    for (let i = 1; i <= berryCount; i++) {
      // Luckily, to get the url for individual berries, we only need to add
      // a number to the end of the berry endpoint
      let url = POKEAPI_URL + "berry/" + i + "/";
      // This will ensure we get all the berries
      // Here we fetch from individual berries
      fetch(url, { mode: "cors" })
        .then(checkStatus)
        .then(JSON.parse)
        // "berry" is an object that has "item" because it is an item
        // Conveniently, all items have sprites
        // Unfortunately, "item" only contains an "url" instead of the actual object,
        // so we have to go down another layer to get the actual object
        .then(fetchItem)
        .then(checkStatus)
        .then(JSON.parse)
        // Here we have fetched the item object! Now we just have to push it to the array
        .then(storeSprite)
        .catch(handleBerryError);
    }
  }

  /**
   * Fetches item of berries from the API
   * @param {Object} berry - berries object from v2/berry/[id] endpoint
   * @returns {Promise} Promise object represents the item of the berry
   */
  function fetchItem(berry) {
    let item = berry.item;
    // Here we fetch from "url" from the "item"
    return fetch(item.url, { mode: "cors" });
  }

  /**
   * Stores sprite of a berry to an array
   * @param {Object} item - item object from v2/item/[id] endpoint
   * @returns {void}
   */
  function storeSprite(item) {
    berrySprites.push(item.sprites.default);
  }

  /**
   * Spawns a berry on the page that removes it self after an amount of time
   * @returns {void}
   */
  function spawnBerry() {
    // Create berry element
    let berry = document.createElement("img");
    berry.src = berrySprites[Math.floor(Math.random() * berrySprites.length)];
    berry.classList.add("berry");

    // This way the berry stays within 20 ~ 80 viewport height and width
    berry.style.top = (20 + Math.ceil(Math.random() * 60)) + "vh";
    berry.style.left = (20 + Math.ceil(Math.random() * 60)) + "vw";

    // Make the berry remove it self in a certain amount of time
    berry.addEventListener("click", berryClick);
    setTimeout(function() {
      berry.remove();
    }, BERRY_STAY_TIME);

    // Just append it to the body
    document.body.appendChild(berry);
    // Start timer for next berry
    setTimeout(spawnBerry, getNextBerryTime());
  }

  /**
   * Increase berry count, unlock ability to feed pokemons
   * @returns {void}
   */
  function berryClick() {

    let berryCount = parseInt(window.localStorage.getItem("berry"));
    if (!isNaN(berryCount)) {
      localStorage.setItem("berry", berryCount + 1);
    } else {
      window.localStorage.setItem("berry", 1);
    }

    updateBerryCount();
    // Remove berry when clicked
    this.remove();
  }

  /**
   * Update berry count on the page
   * @returns {void}
   */
  function updateBerryCount() {
    let berryCount = parseInt(window.localStorage.getItem("berry"));
    if(isNaN(berryCount)) {
      berryCount = 0;
    }
    $("berry-count").innerText = berryCount;
    // Show the feed button if the use has more than 0 berries
    if (berryCount > 0) {
      $("feed-btn").classList.remove("hidden");
    } else {
      $("feed-btn").classList.add("hidden");
    }
  }

  /**
   * Returns the time before next berry spawns, this is a random number
   * between BERRY_TIME + 1 and BERRY_TIME + BERRY_TIME_RANDOM
   * @returns {number} time before next berry spawns
   */
  function getNextBerryTime() {
    let nextTime =  BERRY_TIME + Math.ceil(Math.random() * BERRY_TIME_RANDOM);
    return nextTime;
  }


  /**
   * Handles error with an alert because this is a last second feature
   * @param {Object} error - error result from rejected fetch
   * @returns {void}
   */
  function handleBerryError(error) {
    alert("Failed to fetch berries, berries will be disabled in this session: " + error);
  }

  /**
   * Feed a pokemon, make it appear larger
   * @returns {void}
   */
  function feedPokemon() {

    let berryCount = parseInt(window.localStorage.getItem("berry"));
    if (!isNaN(berryCount) && berryCount > 0) {
      localStorage.setItem("berry", berryCount - 1);

      let selected = pokemons[selectedIndex];
      // Move the pokemon to make sure it doesn't get stuck
      if (selected.y - SIZE_INCREASE >= 0) {
        selected.y -= SIZE_INCREASE;
      }
      if (selected.x + SIZE_INCREASE >= canvas.width) {
        selected.x -= SIZE_INCREASE;
      }
      // Slow down the pokemon just because
      if (Math.abs(selected.vy) > 1) {
        selected.vy -= Math.sign(selected.vx) * 1;
      }
      if (Math.abs(selected.vx) > 1) {
        selected.vx -= Math.sign(selected.vx) * 1;
      }
      // Make pokemon big
      selected.size += SIZE_INCREASE;
    }

    // Disable feed button if the pokemon is too big
    if (pokemons[selectedIndex].size >= MAX_SIZE) {
      $("feed-btn").disabled = true;
    }

    updateBerryCount();
  }

  /* --------------------------------------- Constants -------------------------------------- */

  /**
   * Fetch a pokemon from the API
   * @returns {void}
   */
  function fetchPokemon() {
    startUpdate();

    let query = Math.ceil(Math.random() * TOTAL_POKEMON_COUNT);
    let pokemonName = $("pokemon-input").value;
    if (pokemonName.length > 0) {
      query = pokemonName;
    }

    let url = POKEAPI_URL + "pokemon/" + query + "/";

    fetch(url, { mode: "cors" })
      .then(checkStatus)
      .then(JSON.parse)
      .then(generatePokemon)
      .catch(showErrorInInput);
  }

  /**
   * Generate a pokemon from the pokemon object fetched
   * @param {Object} data - object with information about the pokemon
   * @returns {void}
   */
  function generatePokemon(data) {
    let pokemonSprite = document.createElement("img");
    pokemonSprite.src = data.sprites.front_default;
    // Create a pokemon object with a draw function that can be called in update
    let pokemon = {
      x: Math.floor(Math.random() * (canvas.width - DEFAULT_SIZE)),
      y: Math.floor(Math.random() * (canvas.height - DEFAULT_SIZE)),
      vx: Math.ceil(Math.random() * DEFAULT_SPEED),
      vy: Math.ceil(Math.random() * DEFAULT_SPEED),
      size: DEFAULT_SIZE,
      name: data.species.name,
      selected: false,
      id: data.id,
      draw: function() {
        canvas.context.drawImage(pokemonSprite, this.x, this.y, this.size, this.size);
      }
    };

    pokemons.push(pokemon);
    checkWobble();

    $("unselect-btn").disabled = false;
    $("delete-btn").disabled = false;
  }

  /**
   * Makes the canvas wobble if there's more than a certain amount of pokemons
   * @returns {void}
   */
  function checkWobble() {
    if (pokemons.length >= WOBBLE_COUNT) {
      $("canvas").classList.add("wobble");
    } else {
      $("canvas").classList.remove("wobble");
    }
  }

  /**
   * Shows the error message in the input box
   * @param {Object} error - error result from rejected fetch
   * @returns {void}
   */
  function showErrorInInput(error) {
    let input = $("pokemon-input");
    input.value = "";
    input.placeholder = error;
    input.classList.add("invalid");
    $("generate-btn").disabled = true;
    setTimeout(resetPlaceholder, 1000);
  }

  /**
   * Resets how the input box looks
   * @returns {void}
   */
  function resetPlaceholder() {
    let input = $("pokemon-input");
    input.placeholder = "Enter a Pokemon!";
    input.classList.remove("invalid");
    $("generate-btn").disabled = false;
  }

  /* ------------------------------ Helper Functions  ------------------------------ */
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

  /**
   * Returns an object representing a 2D rectangle that bounds the sprite of the
   * pokemon with the x and y coordinates of each of it's edges.
   * @param {Object} pokemon - pokemon to get rect from.
   * @returns {Object} rect of the pokemon.
   */
  function getPokemonRect(pokemon) {
    let spriteRect = {
      left: pokemon.x,
      right: pokemon.x + pokemon.size,
      top: pokemon.y,
      bottom: pokemon.y + pokemon.size
    };
    return spriteRect;
  }

  /**
   * Returns true if the position is bounded by the rect, returns false
   * otherwise.
   * @param {Object} position - position to check.
   * @param {Object} rect - rect to check.
   * @returns {boolean} True if the position is bounded by the rect, false otherwise.
   */
  function boundedByRect(position, rect) {

    let xBounded = rect.left <= position.x && position.x <= rect.right;
    let yBounded = rect.top <= position.y && position.y <= rect.bottom;

    return xBounded && yBounded;
  }

  /**
   * Returns the position of the mouse on the canvas from the event
   * Adapted from
   * https://www.html5canvastutorials.com/advanced/html5-canvas-mouse-coordinates/
   * @param {MouseEvent} e - mouse event
   * @returns {Object} position of the mouse on canvas
   */
  function getMousePosition(e) {

    // First, get the rect of the canvas
    let rect = $("canvas").getBoundingClientRect();

    // Use the event to find mouse position on whole window
    let mousePosition = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    return mousePosition;
  }

})();

/*
(\__/)
(•ㅅ•)
*/
