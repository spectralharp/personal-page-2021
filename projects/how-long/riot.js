(function() {
  "use strict";

  const API_URL = "riot.php";
  const PST_OFFSET = 480;

  window.addEventListener("load", initialize);

  function initialize() {
    fetchMatches();
  }

  function fetchMatches() {
	$("spinner").classList.remove("hidden");
    let url = API_URL;
    fetch(url, { mode : "cors"} )
      .then(checkStatus)
      .then(JSON.parse)
      .then(calculateTime)
      .catch(console.log);
  }

  function calculateTime(data) {
    console.log(data);
    let start = getMidnight();
    let totalTime = 0;
    for(let i = 0; i < data.matches.length; i++) {
      if(data.matches[i].gameCreation >= start)
      {
        totalTime += data.matches[i].gameDuration;
      }
    }

    $("total-time").innerText = getFormattedTime(totalTime);
	  $("spinner").classList.add("hidden");
  }

  function getFormattedTime(totalSeconds) {
    if (isNaN(totalSeconds) || totalSeconds <= 0) {
      return "00:00";
    }
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds - minutes * 60;

    let formattedMinutes = minutes >= 10 ? minutes : "0" + minutes;
    let formattedSeconds = seconds >= 10 ? seconds : "0" + seconds;

    return formattedMinutes + "\u5206 " + formattedSeconds + "\u79d2";
  }

  function getMidnight() {
    let d = new Date();
    d.setHours(0);
    d.setMinutes(0);
    d.setSeconds(0);
    return d.getTime();
  }

  function $(id) {
    return document.getElementById(id);
  }

  function checkStatus(response) {
    if (response.status >= 200 && response.status < 300 || response.status == 0) {
    return response.text();
    } else {
    return Promise.reject(new Error(response.status + ": " + response.statusText));
    }
  }

})();
