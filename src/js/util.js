/*
  David Lettier (C) 2016
  http://www.lettier.com/
*/

function getcomputedStyleAttr(nodeId, styleAttr) {
  var node = getNodeById(nodeId);

  return getComputedStyle(node)[styleAttr];
}

function getNodeById(id) {
  return document.getElementById(id);
}

// Returns an array: [min, min + step, ..., max].
function range(min, max, step) {
  var r = [];

  if (typeof(step) === "undefined") {
    step = 1;
  }

  if (min && max && step) {
    while (min <= max) {
      r.push(min);
      min += step;
    }
  }

  return r;
}

// Converts radians to degrees.
function radToDeg(rad) {
  if (typeof(rad) !== "number") {return 0.0;}

  return rad * (180 / 3.141592653589793);
}

// Returns the sign of a number.
function sign(num) {
  if (typeof(num) !== "number") {return 1;}

  if (num >= 0) {
    return 1;
  } else {
    return -1;
  }
}
