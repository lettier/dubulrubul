/*
  David Lettier (C) 2016
  http://www.lettier.com/
*/

function Scoreboard() {}

Scoreboard.prototype.init = function (params) {
  this.initParams = params;
  this.scoreLeftId  = params.scoreLeftId;
  this.scoreRightId = params.scoreRightId;

  // Get the computer's score div.
  this.scoreLeftElement = getNodeById(this.scoreLeftId);
  // Get the player's score div.
  this.scoreRightElement = getNodeById(this.scoreRightId);

  this.scoreElements = [this.scoreLeftElement, this.scoreRightElement];

  // Listen for the updateScore message.
  // This will come from the Referee.
  this.updateScorePubSubToken = PubSub.subscribe(
    "updateScore",
    this.updateScore.bind(this)
  );

  // Initialize each score to zero.
  this.setEachScore(params.initialScore || 0);
};

Scoreboard.prototype.HEIGHT = (function () {
  var attr = getcomputedStyleAttr("scoreLeft", "height");

  // Useful for determining the height of the bounding
  // box so it does not overlap with the scoreboard.
  return parseInt(attr.replace("px", ""), 10);
})();

Scoreboard.prototype.reset = function () {
  // Reset both scores to zero.
  this.setEachScore(0);
  this.scoreElements = undefined;

  // Unsubscribe from the updateScore message.
  PubSub.unsubscribe(this.updateScorePubSubToken);
};

Scoreboard.prototype.setEachScore = function (score) {
  // For each score board element.
  fjs.each(function (element) {
    // Set the score text to score.
    element.innerHTML = score;
  }.bind(this), this.scoreElements);
};

Scoreboard.prototype.updateScore = function (message, params) {
  // If score left is defined.
  if (params.scoreLeft) {
    // Update the computer's onscreen score.
    this.updateScoreLeft(params.scoreLeft.score);
  }

  // If score left is defined.
  if (params.scoreRight) {
    // Update the player's onscreen score.
    this.updateScoreRight(params.scoreRight.score);
  }
};

Scoreboard.prototype.updateScoreLeft = function (score) {
  // Update the left side.
  this.updateScoreSide(score, 0);
};

Scoreboard.prototype.updateScoreRight = function (score) {
  // Update the right side.
  this.updateScoreSide(score, 1);
};

Scoreboard.prototype.updateScoreSide = function (score, side) {
  var currentScorce = this.scoreElements[side].innerHTML;

  if (side < this.scoreElements.length) {
    // Update the onscreen score text for side.
    this.scoreElements[side].innerHTML = parseInt(currentScorce, 10) + score;
  }
};
