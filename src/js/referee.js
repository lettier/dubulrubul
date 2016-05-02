/*
  David Lettier (C) 2016
  http://www.lettier.com/
*/

function Referee() {}

Referee.prototype.init = function (params) {
  if (!params) {
    params = {};
  }

  this.initParams = params;

  this.pubSubTokens = [];
  this.pubSubTokens.push(
    [
      "blockBallHit",
      PubSub.subscribe("blockBallHit", this.blockBallHit.bind(this))
    ],
    [
      "ballPaddleHit",
      PubSub.subscribe("ballPaddleHit", this.ballPaddleHit.bind(this))
    ],
    [
      "boundingBoxBallHit",
      PubSub.subscribe("boundingBoxBallHit", this.boundingBoxBallHit.bind(this))
    ],
    [
      // This message will eventually end the game loop.
      "noMoreBlocks",
      PubSub.subscribe("noMoreBlocks", this.gameOver.bind(this))
    ]
  );
};

Referee.prototype.reset = function () {
  // Unsubscribe from all PubSub messages.
  this.pubSubTokens.forEach(function (pubSubToken) {
    PubSub.unsubscribe(pubSubToken[1]);
  });
};

Referee.prototype.blockBallHit = function (message, params) {
  var ball = params.ball;
  var block = params.block;

  if (!ball || !block) {return;}

  if (ball.isRight() & !block.isPrize()) { // For the right side.
    // The ball is for the right side and the block is for any side.
    PubSub.publish("updateScore", {scoreRight: {score: 1}});
    PubSub.publish("updateBlock", {name: block.name, color: "#f1c40f"});
  } else if (ball.isRight() && block.isPrizeForRight()) {
    // The ball is for the right side and the block is for the right side.
    PubSub.publish("updateScore", {scoreRight: {score: 20}});
    PubSub.publish("updateBlock", {name: block.name, color: "#7459FF"});
  } else if (ball.isRight() && block.isPrizeForLeft()) {
    // The ball is for the right side and the block is for the left side.
    PubSub.publish("updateScore", {scoreLeft: {score: 10}});
    PubSub.publish("shakeCanvas", {});
    PubSub.publish("updateBlock", {name: block.name, color: "#e74c3c"});
  } else if (ball.isLeft() && !block.isPrize()) { // For the left side.
    // The ball is for the left side and the block is for any side.
    PubSub.publish("updateScore", {scoreLeft: {score: 1}});
    PubSub.publish("updateBlock", {name: block.name, color: "#f1c40f"});
  } else if (ball.isLeft() && block.isPrizeForLeft()) {
    // The ball is for the left side and the block is for the left side.
    PubSub.publish("updateScore", {scoreLeft: {score: 20}});
    PubSub.publish("updateBlock", {name: block.name, color: "#7459FF"});
  } else if (ball.isLeft() && block.isPrizeForRight()) {
    // The ball is for the left side and the block is for the right side.
    PubSub.publish("updateScore", {scoreRight: {score: 10}});
    PubSub.publish("updateBlock", {name: block.name, color: "#e74c3c"});
  }
};

Referee.prototype.ballPaddleHit = function (message, params) {
  var ball = params.ball;
  var paddle = params.paddle;

  if (!ball || !paddle) {return;}

  if (ball.isRight() && paddle.isLeft()) {
    // If the ball is for the right side but the paddle
    // is for the left side, give the right side 5 points.
    PubSub.publish("updateScore", {scoreRight: {score: 5}});
  } else if (ball.isLeft() && paddle.isRight()) {
    // If the ball is for the left side but the paddle
    // is for the right side, give the left side 5 points.
    PubSub.publish("updateScore", {scoreLeft: {score: 5}});
    PubSub.publish("shakeCanvas", {});
  }
};

Referee.prototype.boundingBoxBallHit = function (message, params) {
  var ball = params.ball;

  if (!ball) {return;}

  if (ball.isRight()) {
    // The right (player side) ball hit the bounding box.
    // Give the computer 1 point and tell the Canvas
    // to shake.
    PubSub.publish("updateScore", {scoreLeft: {score: 1}});
    PubSub.publish("shakeCanvas", {});
  } else if (ball.isLeft()) {
    // The left (computer side) ball hit the bounding box.
    // Give the player one point.
    PubSub.publish("updateScore", {scoreRight: {score: 1}});
  }
};

Referee.prototype.gameOver = function (message, params) {
  // Signal that the game is over.
  // This will trigger the reset
  // function initialized in init.js.
  PubSub.publish("gameOver", {});
};
