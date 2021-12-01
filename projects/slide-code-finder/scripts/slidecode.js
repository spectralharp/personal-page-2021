
(function(){

  const URL = "https://courses.cs.washington.edu/courses/cse154/19sp/lectures/";
  let data = [];

  requestSlideData();
  window.addEventListener("load", init);

  function init() {
    id("search-button").addEventListener("click", handleSearch);
  }

  /**
   * Handles searching slides, update table with slides that matches keywords in
   * search bar
   */
  function handleSearch() {
    window.scrollTo(0, 0);
    let tableBody = id("output");
    tableBody.innerHTML = "";

    let what = id("input-search").value;

    for(let i = 0; i < data.length; i++) {
      let result = search(what, sanitizeHTML(data[i].text), false);
      if(result) {
        let row = document.createElement("tr");
        let slide = createSlideCell(search(what, data[i].html, true), data[i].source);
        let text = createTextCell(result);
        let cellSource = createSourceCell(data[i]);

        row.appendChild(slide);
        row.appendChild(text);
        row.appendChild(cellSource);

        tableBody.appendChild(row);
      }
    }
  }

  /**
   * Create a cell that contains the slide
   * @param  {string}      html - HTML text of slide
   * @return {HTMLElement} cell with the slide represented by html
   */
  function createSlideCell(html, source) {
    let slide = document.createElement("td");
    slide.classList.add("slide");
    let textContainer = document.createElement("div");
    textContainer.classList.add("cell-text-container");
    // Replace absolute positioned elements
    html = html.replace(/position *: *absolute *;*/gi, '');
    // Attempt to fix sources of images
    html = html.replace(/src *= *["'](?=[^http])(.+?)["']/gi, function (match, rel) {
      return "src=\"" + absolute(source, rel) + "\"";
    });
    textContainer.innerHTML = html;
    slide.appendChild(textContainer);

    let button = document.createElement("button");
    let icon = document.createElement("i");
    button.classList.add("btn", "btn-success");
    button.dataset.toggle = "modal";
    button.dataset.target = "#slide-modal";
    button.addEventListener("click", getSlideForModal);
    icon.classList.add("fas", "fa-search-plus");
    button.appendChild(icon);
    slide.appendChild(button);

    return slide;
  }

  function getSlideForModal() {
    let slide = this.parentElement.firstElementChild.cloneNode(true);
    id("slide-modal-content").innerHTML = "";
    id("slide-modal-content").appendChild(slide);
  }

  function absolute(base, relative) {
    let stack = base.split("/");
    let parts = relative.split("/");
    stack.pop(); // remove current file name (or empty string)
                 // (omit if "base" is the current folder without trailing slash)
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] !== ".") {
        if (parts[i] === "..") {
          stack.pop();
        } else {
          stack.push(parts[i]);
        }
      }
    }
    return stack.join("/");
  }

  /**
   * Create a cell that contains the given HTML text with highlighted text
   * @param  {string}      result - HTML text with highlighted text
   * @return {HTMLElement} cell with highlighted text
   */
  function createTextCell(result) {
    let text = document.createElement("td");
    let textContainer = document.createElement("div");
    textContainer.classList.add("cell-text-container");
    textContainer.innerHTML = result;
    text.appendChild(textContainer);
    return text;
  }

  /**
   * Create a cell that contains the source of the data
   * @param  {Object}      data - slide data
   * @return {HTMLElement} cell with a link to slide
   */
  function createSourceCell(data) {
    let cellSource = document.createElement("td");

    let anchorSource = document.createElement("a");
    anchorSource.href = data.source;
    anchorSource.innerText = data.source.substring(data.source.indexOf("19sp") + 5);

    cellSource.appendChild(anchorSource);

    return cellSource;
  }

  /**
   * Search for keywords from given HTML text
   * @param  {string} what - search keyword
   * @param  {string} text - HTML text to search
   * @return {string} HTML string that highlights all words that matched,
   *                  null if nothing matches
   */
  function search(what, text, excludeTag) {
    if(what.length === 0) return;
    let searchWords = what.split(' ');
    let found = false;
    let matchall = id("input-matchall").checked;
    let boundary = id("input-wholeword").checked ? "\\b" : "";
    let checkTag = excludeTag ? "(?=[^>]*(?:<))" : "";
    for(let i = 0; i < searchWords.length; i++) {
      // (?=[^>]*(?:<)): Must not match ">" any number ahead before a "<" appears
      let regexString = `${boundary}(${searchWords[i]})${boundary}${checkTag}`;
      let regex = new RegExp(regexString, 'gi');
      if(regex.test(text)) {
        text = text.replace(regex, '<span class="highlight">$1</span>');
        found = true;
      } else if(matchall) {
        return null;
      }
    }
    if(found) {
      return text;
    } else {
      return null;
    }
  }

  function loadData(response) {
    data = response;
    data.sort((a, b) => (a.source > b.source) ? 1 : -1);
  }

  function requestSlideData() {
    let url = "data/slidecode.json";
    fetch(url, {mode : "cors"})
      .then(checkStatus)
      .then(JSON.parse)
      .then(loadData)
      .catch(console.log)
  }


  /* ------------------------------------- Helper Function ---------------------------------- */

  /**
   * Returns the element in the document with the given id
   * @param {string} id - The id of the element
   * @returns {Object} element with the given id
   */
  function id(id) {
    return document.getElementById(id);
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

  function sanitizeHTML(unclean) {
    let e = document.createElement("div");
    e.innerText = unclean;
    return e.innerHTML;
  }

})();
