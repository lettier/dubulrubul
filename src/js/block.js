/*
  David Lettier (C) 2016
  http://www.lettier.com/
*/

function Block() {}

// Inherits from the CanvasElement object.
Block.prototype = Object.create(CanvasElement.prototype);

// Set the constructor to block.
Block.prototype.constructor = Block;

Block.prototype.WIDTH = (function () {
  // This allows the block width to be set
  // via CSS.
  var attr = getcomputedStyleAttr("blockBase", "width");

  return parseInt(attr.replace("px", ""), 10);
})();

Block.prototype.HEIGHT = (function () {
  // This allows the block height to be set
  // via CSS.
  var attr = getcomputedStyleAttr("blockBase", "height");

  return parseInt(attr.replace("px", ""), 10);
})();

Block.prototype.COLOR = (function () {
  // This allows the block color to be set
  // via CSS.
  return getcomputedStyleAttr("blockBase", "color");
})();

Block.prototype.init = function (params) {
  // Call CanvasElement's init first.
  CanvasElement.prototype.init.call(this, params);

  // Then set prizeFor and deleted which
  // are specific to just blocks.

  // The prizeFor can be for the left or right side.
  // If this block is a prize, it will give extra
  // points to the same side and no points for the
  // other side not matter what ball smashes the block.
  //
  // For example, say prizeFor is right.
  // A right ball smashes the block. The player side
  // gets the points. Now say a left ball smashes the
  // block. The player side still gets the points.
  this.prizeFor = params.prizeFor || null;
  this.deleted = false;
};

Block.prototype.isPrize = function () {
  // If the prizeFor is null, it is not a prize.
  return this.prizeFor !== null;
};

Block.prototype.isPrizeForRight = function () {
  return this.isPrizeFor("right");
};

Block.prototype.isPrizeForLeft = function () {
  return this.isPrizeFor("left");
};

Block.prototype.isPrizeFor = function (side) {
  // If it is not a prize, return false.
  if (!this.isPrize()) {return false;}

  // Look for either right or left in the prizeFor string.
  return this.prizeFor.toLowerCase().indexOf(side.toLowerCase()) > -1;
};
