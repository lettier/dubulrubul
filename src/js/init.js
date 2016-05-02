/*
  David Lettier (C) 2016
  http://www.lettier.com/
*/

function init() {
  // The instructions overlay before the game starts.
  var overLay = getNodeById("overlay");

  // Create the game application.
  var application = new Application();

  // Initialize the game application.
  application.init();

  // Hide the instructions.
  overlay.style.visibility = "hidden";
}

