// Name: Chao Hsu Lin
// Date: 11-24-18
// Section: CSE 154 AI
//
// Sets up custom rules
// Really thankful that we learned how to use event right from the beginning

(function(){
  "use strict";
  window.addEventListener("load", setupCSE154Ruleset);

  function setupCSE154Ruleset() {
    addRuleMinimizeRedundantCSS();
    addRuleFallbackFont();
    addRuleNoVendorPrefix();
    addRuleLineFormatting();
  }

  // I feel like these are all very self documenting code

  function addRuleMinimizeRedundantCSS() {
    CSSLint.addRule({
    	//rule information
    	id: "minimize-redundant-css",
    	name: "Minimize Redundant CSS",
    	desc: "If you repeat the same styles two or more times, and the styles are related in some way, find a way to remove the redundant code so that it appears only once. (This is particularly important for properties like colors and font-families)",
    	url: "https://courses.cs.washington.edu/courses/cse154/18au/resources/styleguide/html-css/css-properties.html#redundancy",
    	browsers: "Affected browsers",

    	//initialization
    	init: function(parser, reporter){
        "use strict";
        let rule = this;

        let definedProp = [];

        parser.addListener("property", function(event) {
        	let property = event.property.toString().toLowerCase();
        	let value = event.value.toString();
        	let line = event.line;
        	let col = event.col;

          let dupe = false;
          for(let i = 0; i < definedProp.length; i++) {
            if (definedProp[i].property === property && definedProp[i].value === value) {
              reporter.warn("Common rule '" + property + ": " + value + "' found.", line, col, rule);
            }
          }
          if(!dupe) {
            definedProp.push({property: property, value: value});
          }
        });
    	}
    });
  }

  function addRuleFallbackFont() {
    CSSLint.addRule({
    	//rule information
    	id: "fallback-font",
    	name: "Include fallback font",
    	desc: "Always include at least one generic family name in a font-family list, since there's no guarantee that any given font is available.",
    	url: "https://developer.mozilla.org/en-US/docs/Web/CSS/font-family",
    	browsers: "Affected browsers",

    	//initialization
    	init: function(parser, reporter){
        "use strict";
        let rule = this;
        let genericName = ["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui"];

        parser.addListener("property", function(event) {
        	let property = event.property.toString().toLowerCase();
        	let value = event.value.toString();
        	let line = event.line;
        	let col = event.col;

          if(property === "font-family") {
            // Regex remove white space
            let fonts = value.trim().split(/\s*,\s*/);;
            if(!genericName.includes(fonts[fonts.length - 1])) {
              reporter.error("Font (" + fonts[fonts.length - 1] + ") is not a web safe fallback font.", line, col, rule);
            }
          }
        });
    	}
    });
  }

  function addRuleNoVendorPrefix() {
    CSSLint.addRule({
    	//rule information
    	id: "no-vendor-prefix",
    	name: "No vendor prefix",
    	desc: "Do not use vendor-specific properties in your homework assignments unless you are specifically granted permission to do so.",
    	url: "https://courses.cs.washington.edu/courses/cse154/18au/resources/styleguide/html-css/css-properties.html#vendor-specific-css",
    	browsers: "Affected browsers",

    	//initialization
    	init: function(parser, reporter){
        "use strict";
        let rule = this;

        parser.addListener("property", function(event) {
        	let property = event.property.toString().toLowerCase();
        	let line = event.line;
        	let col = event.col;

          // Regex that matches "-webkit-" in "-webkit-border-radius"
          let vendor = property.match(/^(-\w+-)/g);

          if(vendor !== null) {
            reporter.error("Vendor prefix (" + vendor[0] + ") is not allowed.", line, col, rule);
          }
        });
    	}
    });
  }

  function addRuleLineFormatting() {
    CSSLint.addRule({
    	//rule information
    	id: "line-formatting",
    	name: "Line formatting",
    	desc: "Each CSS rule should be on its own line. Place a blank line between each CSS selector. You should never have more than one blank line in a row.",
    	url: "https://courses.cs.washington.edu/courses/cse154/18au/resources/styleguide/html-css/spacing-indentation-css.html#lines-css",
    	browsers: "Affected browsers",

    	//initialization
    	init: function(parser, reporter){
        "use strict";
        let rule = this;
        let ruleStartLine = null;
        let lastPropertyLine = null;

        parser.addListener("property", function(event) {
          let line = event.line;
          let col = event.col;

          // Check if all parts of the property are on the same line
          let propertyParts = event.value.parts;

          for(let i = 0; i < propertyParts.length; i++) {
            let partLine = propertyParts[i].line;
            if(propertyParts[i].type !== "operator" && (line - partLine) !== 0) {

              reporter.error("Value should be on the same line as the property.", partLine, propertyParts[i].col, rule);
            }
          }

          // Check if there is a line difference of 1 or more between the start of rule and this property
          if(ruleStartLine !== null && (line - ruleStartLine) < 1) {
            reporter.error("Selector and rule should be on seperate lines", line, col, rule);
          }

          // Check if there is 1 and only 1 line difference between the last property and this
          if(lastPropertyLine !== null && (line - lastPropertyLine) < 1) {
            reporter.error("CSS rule should be on its own line.", line, col, rule);
          }

          lastPropertyLine = line;
        });

        parser.addListener("startrule", function(event) {
        	let line = event.line;
        	let col = event.col;

          // If the last property and the start of the rule has line difference of 2
          // It's impossible that there is a blank line between the rulesets
          if(lastPropertyLine !== null && (line - lastPropertyLine) <= 2) {
            reporter.error("Missing a blank line between CSS ruleset.", line, col, rule);
          }

          ruleStartLine = line;
          lastPropertyLine = null;
        });
    	}
    });
  }

})();

/*
(\__/)
(•ㅅ•)
*/
