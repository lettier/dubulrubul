/*
  David Lettier (C) 2016
  http://www.lettier.com/
*/

function PaddleControls () {}

PaddleControls.prototype.init = function (params) {
  if (!params || !params.paddle) {return;}

  this.initParams = params;
  this.paddle = params.paddle;

  this.enable();
};

PaddleControls.prototype.movePaddle = function () {
  // Needs to be implemented.
};

PaddleControls.prototype.enable = function () {
  // Needs to be implemented.
};

PaddleControls.prototype.disable = function () {
  // Needs to be implemented.
};

PaddleControls.prototype.reset = function () {
  this.disable();
};
