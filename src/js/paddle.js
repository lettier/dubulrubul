/*
  David Lettier (C) 2016
  http://www.lettier.com/
*/

function Paddle() {}

// Inherit from CanvasElement.
Paddle.prototype = Object.create(CanvasElement.prototype);
// But set the constructor that creates the object to
// the Paddle function.
Paddle.prototype.constructor = Paddle;

// Get the width from the CSS that styles
// the paddleLeft node.
Paddle.prototype.WIDTH = (function () {
  var attr = getcomputedStyleAttr("paddleLeft", "width");

  // Remove "px" and convert the string to an integer.
  return parseInt(attr.replace("px", ""), 10);
})();

// Get the height from the CSS that styles
// the paddleLeft node.
Paddle.prototype.HEIGHT = (function () {
  var attr = getcomputedStyleAttr("paddleLeft", "height");

  // Remove "px" and convert the string to an integer.
  return parseInt(attr.replace("px", ""), 10);
})();
