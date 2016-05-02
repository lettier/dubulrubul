/*
  David Lettier (C) 2016
  http://www.lettier.com/
*/

function CanvasElement () {}

CanvasElement.prototype.init = function (params) {
  this.initParams = params;
  this.id = params.id;
  this.name = params.name;
  this.x = params.x;
  this.y = params.y;
  this.color = params.color;
  this.rotRad = params.rotRad || 0;
  this.view = null; // The Stage object.
  this.physics = null; // The PhysicsJS world body object.
};

CanvasElement.prototype.changeColor = function (color) {
  if (!this.view || !color) {return;}

  // Change the color used when drawing this
  // object on the canvas.
  this.view.graphics._fill.style = color;
};

CanvasElement.prototype.isRight = function () {
  return this.isSide("right");
};

CanvasElement.prototype.isLeft = function () {
  return this.isSide("left");
};

CanvasElement.prototype.isSide = function (side) {
  if (!this.name || !side) {return false;}

  // Return turn or false that this CanvasElement is for either
  // the left or right side.
  return this.name.toLowerCase().indexOf(side.toLowerCase()) > -1;
};
