// Name: Chao Hsu Lin
// Date: 11-24-18
// Section: CSE 154 AI
//
// Sets up the editor

(function(){
  "use strict";
  window.addEventListener("load", setupEditor);

  function setupEditor() {
    let editor = ace.edit("editor");
    // monokai FTW
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/css");
    editor.session.setTabSize(2);
    editor.session.setUseSoftTabs(true);
    editor.session.setUseWorker(false);
  }
})();

/*
(\__/)
(•ㅅ•)
*/
