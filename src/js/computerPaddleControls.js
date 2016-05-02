/*
  David Lettier (C) 2016
  http://www.lettier.com/
*/

function ComputerPaddleControls () {}

// Inherit from the PaddleControls object.
ComputerPaddleControls.prototype = Object.create(PaddleControls.prototype);
// Set the constructor to ComputerPaddleControls.
ComputerPaddleControls.prototype.constructor = ComputerPaddleControls;

ComputerPaddleControls.prototype.init = function (params) {
  this.pubSubTokens = [];

  // Call PaddleControls's init function after
  // defining the pubSubTokens.
  PaddleControls.prototype.init.call(this, params);
};

ComputerPaddleControls.prototype.movePaddle = function (message, params) {
  // This is where we define the "AI" for the computer paddle.
  var ball = null;

  // If params are not defined, just return.
  if (!params) {return;}

  ball = params.ball;

  // If the ball is not defined, just return.
  if (!ball) {return;}

  if (ball.name === "ballRight") {
    // We could make the computer paddle
    // perfect by just following its own ball.
    // However, will make it follow the
    // player's ball which is the right ball.
    // Later on we will construct a more robust
    // AI for the computer's paddle.
    PubSub.publish(
      'updatePaddle',
      {
        name: this.paddle.name,
        y: ball.y - (ball.HEIGHT / 2)
      }
    );
  }
};

ComputerPaddleControls.prototype.enable = function () {
  if (!this.pubSubTokens) {return;}

  // Listen for the ballUpdated message
  // from the Canvas.
  this.pubSubTokens.push(
    [
      "ballUpdated",
      PubSub.subscribe("ballUpdated", this.movePaddle.bind(this))
    ]
  );
};

ComputerPaddleControls.prototype.disable = function () {
  if (!this.pubSubTokens) {return;}

  // Unsubscribe from any message which was
  // subscribed to previously.
  fjs.each(function (pubSubToken) {
    PubSub.unsubscribe(pubSubToken[1]);
  }.bind(this), this.pubSubTokens);
};
