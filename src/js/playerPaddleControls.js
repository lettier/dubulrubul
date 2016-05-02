/*
  David Lettier (C) 2016
  http://www.lettier.com/
*/

function PlayerPaddleControls () {}

// Inherit from the PaddleControls object.
PlayerPaddleControls.prototype = Object.create(PaddleControls.prototype);
// Set the constructor to PlayerPaddleControls.
PlayerPaddleControls.prototype.constructor = PlayerPaddleControls;

PlayerPaddleControls.prototype.movePaddle = function (event) {
  // The height the mouse is at on the screen.
  var y = event.clientY;

  // The paddle rotation in radians.
  // If the mouse is all the way to the left,
  // the rotation is 0 radians.
  // If the mouse is all the way to the right,
  // the rotation is ~6.283 radians or ~360 degrees.
  // By rotating the paddle, the player can aim or
  // deflect the ball where they want it to go.
  var rotRad = (event.clientX / window.innerWidth) * 6.283185307179586;

  // Tell the canvas to update the player's paddle canvasElement.
  PubSub.publish(
    "updatePaddle",
    {
      name: this.paddle.name,
      y: y,
      rotRad: rotRad
    }
  );
};

PaddleControls.prototype.enable = function () {
  // Listen for the mousemove event.
  // When the player moves their mouse, call movePaddle.
  window.addEventListener("mousemove", this.movePaddle.bind(this));
};

PaddleControls.prototype.disable = function () {
  // Do not listen for the mousemove event.
  window.removeEventListener("mousemove", this.movePaddle.bind(this));
};
