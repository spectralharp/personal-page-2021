/*
 * Name: Chao Hsu Lin
 * Date: 10-16-2018
 * Section: CSE 154 AI
 * This JS manages animation for my cryptogram generator. It animates the title text in the header
 * and the arrow between the input/output area
 */

(function() {
  "use strict";

  window.addEventListener("load", initialize);

  /**
   * Called when the window is loaded, initialize event listeners
   * @returns {void}
   */
  function initialize() {
    animateTitleText();
    $("encrypt-button").addEventListener("click", animateArrow);

    $("output-copy-button").addEventListener("click", function() {
      animateCopy("output-copy-message");
    });

    $("map-copy-button").addEventListener("click", function() {
      animateCopy("map-copy-message");
    });
  }

  /**
   * Animate the title text
   * @returns {void}
   */
  function animateTitleText() {
    let curFrame = 0;
    let frame = 5;
    let random = "Decipher@#$%!?";
    let title = "Decipher";

    let type = setInterval(typeTitle, 50);

    function typeTitle() {
      if (curFrame <= frame) {
        $("decipher").innerHTML = getRandomString();
        curFrame++;
      } else {
        $("decipher").innerHTML = title;
        clearInterval(type);
      }
    }

    function getRandomString() {
      let result = "";
      for (let i = 0; i < title.length; i++) {
        result += random[Math.floor(Math.random() * random.length)];
      }
      return result;
    }
  }

  /**
   * Animates the arrow
   * @returns {void}
   */
  function animateArrow() {
    let frame = 0;
    let arrow = $("arrow");
    let id = setInterval(playFrame, 10);

    function playFrame() {
      if (frame >= 2 * Math.PI) {
        arrow.removeAttribute("style");
        clearInterval(id);
      } else {
        frame += 0.1;
        arrow.style.transform = "translateX(" + -Math.sin(frame) * 10 + "px)";
      }
    }
  }

  /**
   * Animates the copy message
   * @param {string} id - The id of the element containing the message
   * @returns {void}
   */
  function animateCopy(id) {
    let copy = $(id);
    copy.classList.remove("hidden");
    setTimeout(function() { copy.classList.add("hidden"); }, 1000);
  }

  /**
   * Returns the element in the document with the given id
   * @param {string} id - The id of the element
   * @returns {Object} element with the given id
   */
  function $(id) {
    return document.getElementById(id);
  }
})();

/*
 *  (\__/)
 *  (•ㅅ•)
 */
