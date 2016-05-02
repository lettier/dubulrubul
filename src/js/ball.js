/*
  David Lettier (C) 2016
  http://www.lettier.com/
*/

function Ball() {}

// Inherit from the CanvasElement object.
Ball.prototype = Object.create(CanvasElement.prototype);
// Set the constructor though to Ball.
Ball.prototype.constructor = Ball;

Ball.prototype.WIDTH = (function () {
  // Get the height from the hidden ballLeft element.
  var attr = getcomputedStyleAttr("ballLeft", "width");

  // The style attribute has "px" so remove it
  // before parsing the string into an integer.
  return parseInt(attr.replace("px", ""), 10);
})();

Ball.prototype.HEIGHT = (function () {
  // Get the height from the hidden ballLeft element.
  var attr = getcomputedStyleAttr("ballLeft", "height");

  // The style attribute has "px" so remove it
  // before parsing the string into an integer.
  return parseInt(attr.replace("px", ""), 10);
})();
