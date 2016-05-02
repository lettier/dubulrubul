/*
  David Lettier (C) 2016
  http://www.lettier.com/
*/

function Application() {}

Application.prototype.init = function () {
  // Get the window dimensions.
  this.windowWidth  = window.innerWidth;
  this.windowHeight = window.innerHeight;

  // Used for pausing the game.
  this.pause = false;

  // Get the left and right color defined in the CSS.
  this.leftColor  = getcomputedStyleAttr("paddleLeft",  "color");
  this.rightColor = getcomputedStyleAttr("paddleRight", "color");

  // Initialize all of our components.
  this.scoreboard = new Scoreboard();
  this.referee = new Referee();
  this.playerPaddleControls = new PlayerPaddleControls();
  this.computerPaddleControls = new ComputerPaddleControls();

  // Create the canvas component.
  // Store the object on this
  // so that it can be accessed in
  // update.
  this.canvas = new Canvas();

  // Initialize the canvas
  // expanding it to the size of the
  // window. Do not render the physics
  // simulation.
  this.canvas.init(
    {
      canvasId: "canvas",
      physicsCanvasId: "physics",
      renderPhysics: false,
      bounds: {
        top: this.scoreboard.HEIGHT,
        bottom: this.windowHeight,
        left: 0,
        right: this.windowWidth
      }
    }
  );

  // Setup the scoreboard.
  this.scoreboard.init({scoreLeftId: "scoreLeft", scoreRightId: "scoreRight"});

  // Setup the referee that handles most of the game logic.
  this.referee.init();

  // Subscribe to the gameOver message.
  // This occurs when all the blocks are
  // smashed.
  this.pubSubTokens = [
    ["gameover", PubSub.subscribe("gameOver", this.reset.bind(this))]
  ];

  // Initialize the paddle and balls.
  this.initPaddlesBalls();
  // Initialize the block grid.
  this.initBlocks();

  // Start the game loop with the first call to update.
  window.requestAnimationFrame(this.update.bind(this));

  // Call reset if the player resizes the browser window.
  window.addEventListener("resize", this.reset.bind(this));

  // Call the key-up handler when the player presses a key.
  window.addEventListener("keyup", this.keyUpHandler.bind(this));
};

// Create the two paddles and balls--one for each side.
Application.prototype.initPaddlesBalls = function () {
  var playerPaddle = null;
  var computerPaddle = null;

  computerPaddle = this.canvas.addPaddle(
    {
      name: "paddleLeft",
      x: 5,
      y: this.windowHeight / 2 - Paddle.prototype.HEIGHT / 2,
      color: this.leftColor
    }
  );
  this.canvas.addBall(
    {
      name: "ballLeft",
      x: 5 + Paddle.prototype.WIDTH,
      y: this.windowHeight / 2 - Ball.prototype.HEIGHT / 2,
      color: this.leftColor
    }
  );
  playerPaddle = this.canvas.addPaddle(
    {
      name: "paddleRight",
      x: this.windowWidth - 5 - Paddle.prototype.WIDTH,
      y: this.windowHeight / 2 - Paddle.prototype.HEIGHT / 2,
      color: this.rightColor
    }
  );
  this.canvas.addBall(
    {
      name: "ballRight",
      x: this.windowWidth - 5 - Paddle.prototype.WIDTH - Ball.prototype.WIDTH,
      y: this.windowHeight / 2 - Ball.prototype.HEIGHT / 2,
      color: this.rightColor
    }
  );

  // Give the *PaddleControls their respective paddles.
  this.playerPaddleControls.init({paddle: playerPaddle});
  this.computerPaddleControls.init({paddle: computerPaddle});
};

// Creates a M x N grid of blocks with some blocks
// being prizes for their respective sides.
Application.prototype.initBlocks = function () {
  var blockSpacing = 2;
  var blocksWidthPercent  = 0.15;

  // Define the initial grid size of the blocks.
  var blockBounds = {
    left:   (this.windowWidth  / 2) - (this.windowWidth  * blocksWidthPercent),
    right:  (this.windowWidth  / 2) + (this.windowWidth  * blocksWidthPercent),
    top:    this.canvas.bounds.top + blockSpacing,
    bottom: this.canvas.bounds.bottom - blockSpacing
  };

  var rows = [];
  var cols = [];

  // Adjust the block height and width based on the bounds.
  Block.prototype.HEIGHT = Block.prototype.WIDTH = (blockBounds.bottom - blockBounds.top) / 10;

  rows = range(blockBounds.top,  blockBounds.bottom, Block.prototype.HEIGHT + blockSpacing);
  cols = range(blockBounds.left, blockBounds.right,  Block.prototype.WIDTH  + blockSpacing);

  // For each block row.
  fjs.each(function (row, i) {
    // For each block column.
    fjs.each(function (col, j) {
      var isPrize = Math.random() > 0.6 ? true : false;
      var prizeFor = null;
      var blockColor = null;

      // Will this block be a prize?
      if (isPrize) {
        result = (
          Math.random() > 0.5 ? {
            color: this.leftColor,
            prizeFor: "paddleLeft"
          } : {
            color: this.rightColor,
            prizeFor: "paddleRight"
          }
        );
        prizeFor = result.prizeFor;
        blockColor = result.color;
      } else {
        blockColor = Block.prototype.COLOR;
        prizeFor = null;
      }

      // Tell the canvas to add this block.
      this.canvas.addBlock(
        {
          name: "block" + i + "_" + j,
          x: col,
          y: row,
          color: blockColor,
          prizeFor: prizeFor
        }
      );
    }.bind(this), cols);
  }.bind(this), rows);
};

// Runs the game loop.
Application.prototype.update = function () {
  var delta = null;

  // If the player paused the game, just call this function
  // asynchronously.
  if (this.pause) {
    this.requestAnimationFrameId = window.requestAnimationFrame(
      this.update.bind(this)
    );
    return;
  }

  // Get the current time.
  this.now = Date.now();

  if (!this.then) {
    // If then isn't defined, set it to now.
    this.then = this.now;
  }

  delta = (this.now - this.then) / 1000;

  // Canvas returns true if it is ready.
  if (this.canvas.update(delta) === true) {
    this.requestAnimationFrameId = window.requestAnimationFrame(
      this.update.bind(this)
    );
  } else {
    // Canvas returned false so cancel the next request.
    window.cancelAnimationFrame(this.requestAnimationFrameId);
  }

  // Reset then to now.
  this.then = this.now;
};

// Initialize the reset function.
// This is called if the window is resized
// or when a round is over.
Application.prototype.reset = function () {
  // Reset all components.
  this.canvas.reset();
  this.scoreboard.reset();
  this.referee.reset();
  this.playerPaddleControls.reset();
  this.computerPaddleControls.reset();

  // Remove all objects listening
  // for messages.
  PubSub.clearAllSubscriptions();

  // Do not listen for the resize event.
  window.removeEventListener("resize", this.reset);

  // Unsubscribe from the gameOver message.
  fjs.each(function (pubSubToken) {
    PubSub.unsubscribe(pubSubToken[1]);
  }.bind(this), this.pubSubTokens);

  // Initialize the game over from scratch.
  this.init();
};

// Handles any key-up events.
Application.prototype.keyUpHandler = function (event) {
  if (event.which === 80) {
    this.togglePause();
  }
};

// Toggles the pause flag on and off.
Application.prototype.togglePause = function () {
  this.pause = !this.pause;
};
