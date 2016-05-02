/*
  David Lettier (C) 2016
  http://www.lettier.com/
*/

function Canvas () {
}

Canvas.prototype.init = function (params) {
  this.initParams = params;

  this.bounds = params.bounds;

  this.canvasId = params.canvasId;
  this.physicsCanvasId = params.physicsCanvasId;
  this.renderPhysics = params.renderPhysics;

  this.canvasNode = getNodeById(this.canvasId);

  this.canvasNode.width  = window.innerWidth;
  this.canvasNode.height = window.innerHeight;

  this.paddles = [];
  this.balls   = [];
  this.blocks  = [];
  this.prizes  = [];

  // Need for time-based animation.
  this.delta = 0;

  // Handles drawing all the objects to the canvas.
  this.stage = new createjs.Stage(this.canvasId);

  // These are added to each balls' velocity
  // each physics world step.
  this.ballVelX = this.ballVelY = 1.0;

  // Initialize all of the world physics.
  this.initPhysics();

  // Subscribe to the updatePaddle message
  // sent from the Computer/PlayerPaddleControls components.
  this.pubSubTokens = [];
  this.pubSubTokens.push(
    [
      "updatePaddle",
      PubSub.subscribe("updatePaddle", this.updatePaddleFromMessage.bind(this))
    ],
    [
      "updateBlock",
      PubSub.subscribe("updateBlock", this.updateBlockFromMessage.bind(this))
    ],
    [
      "shakeCanvas",
      PubSub.subscribe("shakeCanvas", this.shakeCanvasAsync.bind(this))
    ]
  );

  // If not ready, the Canvas will not update.
  this.ready = true;
};

Canvas.prototype.initPhysics = function () {
  var physicsRenderer = null;
  var physicsCanvasElement = null;

  this.world = Physics();

  if (this.renderPhysics) {
    // For debug purposes, draw the physics
    // objects over their canvasElements.
    physicsRenderer = Physics.renderer(
      "canvas",
      {
            el: this.physicsCanvasId,
         width: this.canvasNode.width,
        height: this.canvasNode.height
      }
    );
    this.world.add(physicsRenderer);
  } else {
    // Otherwise just remove the canvas node.
    physicsCanvasElement = getNodeById(this.physicsCanvasId);
    if (physicsCanvasElement) {
      physicsCanvasElement.parentNode.removeChild(physicsCanvasElement);
    }
  }

  // Add gravity, collision detection, collision response, and
  // an optimization procedure.
  this.world.add(Physics.behavior('constant-acceleration'));
  this.world.add(Physics.behavior("body-impulse-response"));
  this.world.add(Physics.behavior("body-collision-detection"));
  this.world.add(Physics.behavior("sweep-prune"));

  // Surround the canvas with a bounding box
  // so that the balls do not leave the arena.
  this.worldBoundingBox = Physics.aabb(
    this.bounds.left,
    this.bounds.top,
    this.bounds.right,
    this.bounds.bottom
  );
  // Initialize the canvas bounding box
  // collision detection.
  this.worldBoundingBox = Physics.behavior(
    "edge-collision-detection",
    {
      aabb: this.worldBoundingBox,
      restitution: 0.5, // Add some rebound bounce to each collision.
      cof: 0 // Remove all friction.
    }
  );
  // Set the canvasElement type for later logic.
  this.worldBoundingBox.body.canvasElementType = "aabb";
  this.world.add(this.worldBoundingBox);

  // Send all collisions to the bodyCollisions
  // function.
  this.world.on(
    "collisions:detected",
    this.bodyCollisions.bind(this)
  );
};

Canvas.prototype.update = function (delta) {
  // If not ready, just exit.
  if (this.ready === false) {return false;}

  // Update the delta for this current update.
  this.delta = delta;

  // Alter any current physics body state
  // before it goes through the next physics step.
  this.updateToPhysics();

  // Move forward one step in the physics simulation.
  this.world.step(Date.now());

  // Update the Stage elements based on their
  // physics simulation states.
  this.updateFromPhysics();

  // Render the physics simulation for debugging.
  if (this.renderPhysics) { this.world.render(); }

  // Clear and redraw the canvas.
  this.stage.update();

  return true;
};

Canvas.prototype.reset = function () {
  // Signal that the canvas is not ready for updating.
  this.ready = false;

  // Clear out all objects.
  this.paddles = [];
  this.balls   = [];
  this.blocks  = [];
  this.prizes  = [];

  // Clear the stage.
  this.stage.removeAllChildren();
  this.stage.removeAllEventListeners();
  this.stage = undefined;

  // Unsubscribe from all messages.
  fjs.each(function (pubSubToken) {
    PubSub.unsubscribe(pubSubToken[1]);
  }.bind(this), this.pubSubTokens);

  // Remove the physics simulation.
  this.world.destroy();
  this.world = undefined;
};

Canvas.prototype.addPaddle = function (params) {
  // Add a paddle to the Canvas object.
  var paddle = this.addCanvasElement(Paddle, params);

  // Add the actual canvas shape to
  // be drawn each frame.
  this.addStageRect(paddle);

  // Add to the physical world
  // simulation and associate the
  // physics body with the paddle
  // canvasElement.
  this.addPhysics(
    paddle,
    paddle.constructor.name,
    "rectangle",
    {
      x: paddle.x + (paddle.WIDTH / 2),
      y: paddle.y + (paddle.HEIGHT / 2),
      width: paddle.WIDTH,
      height: paddle.HEIGHT,
      treatment: "static",
      restitution: 1,
      cof: 0
    }
  );

  return paddle;
};

Canvas.prototype.addBlock = function (params) {
  // Add a block to the Canvas object.
  var block = this.addCanvasElement(Block, params);

  // Add the actual canvas shape to
  // be drawn each frame.
  this.addStageRect(block);

  // Add to the physical world
  // simulation and associate the
  // physics body with the paddle
  // canvasElement.
  this.addPhysics(
    block,
    block.constructor.name,
    "rectangle",
    {
      x: block.x + (block.WIDTH / 2),
      y: block.y + (block.HEIGHT / 2),
      width: block.WIDTH,
      height: block.HEIGHT,
      mass: 10,
      vy: 1,
      restitution: 1,
      cof: 1
    }
  );
};

Canvas.prototype.addBall = function (params) {
  // Add a ball to the Canvas object.
  var ball = this.addCanvasElement(Ball, params);

  // Add the actual canvas shape to
  // be drawn each frame.
  this.addStageCirc(ball);

  // Add to the physical world
  // simulation and associate the
  // physics body with the paddle
  // canvasElement.
  this.addPhysics(
    ball,
    ball.constructor.name,
    "circle",
    {
      x: ball.x + (ball.WIDTH / 2),
      y: ball.y + (ball.HEIGHT / 2),
      // Depending on the side, adjust the velocity in the X direction.
      vx: params.name.toLowerCase().indexOf("right") != -1 ? -2.0 : 2.0,
      vy: 0.5,
      radius: ball.WIDTH / 2,
      mass: 5,
      restitution: 1,
      cof: 1
    }
  );
};

Canvas.prototype.addCanvasElement = function (Type, params) {
  // Add either a ball, block, or paddle based on the Type.
  var typeStrPlural = this.getArrayKeyByType(Type);
  var canvasElement = null;

  canvasElement = new Type();
  canvasElement.init(params);

  // Add it to the other objects of the same type.
  this[typeStrPlural].push(canvasElement);

  return canvasElement;
};

Canvas.prototype.addPhysics = function (canvasElement, canvasElementType, bodyType, bodyParams) {
  // Based on the type, add a physical body to the world
  // physics simulation.
  var physics = Physics.body(bodyType, bodyParams);

  if (physics) {
    // Associate the physics body with its canvasElement.
    // This will be needed later for color changing and scoring.
    physics.canvasElementType = canvasElementType;
    physics.canvasElement = canvasElement;
    canvasElement.physics = physics;
    this.world.add(physics);
  }

  return physics;
};

Canvas.prototype.addStageRect = function (canvasElement) {
  // Add a rectangular Stage shape object.
  return this.addStageShape(canvasElement, "drawRect");
};

Canvas.prototype.addStageCirc = function (canvasElement) {
  // Add a circular Stage shape object.
  return this.addStageShape(canvasElement, "drawEllipse");
};

Canvas.prototype.addStageShape = function (canvasElement, drawFunct) {
  var view, displayObject = null;

  // Create the Stage shape.
  view = new createjs.Shape();
  view.graphics.beginFill(
    canvasElement.color
  )[drawFunct](0, 0, canvasElement.WIDTH, canvasElement.HEIGHT);
  view.x = canvasElement.x;
  view.y = canvasElement.y;
  view.regX = canvasElement.WIDTH / 2; // The center of the object.
  view.regY = canvasElement.HEIGHT / 2; // The center of the object.

  // Associate the Stage object with the canvasElement object.
  displayObject = this.stage.addChild(view);
  displayObject.canvasElement = canvasElement;
  canvasElement.view = displayObject;
  canvasElement.id = displayObject.id;

  return view;
};

// Adapts the updatePaddle function for use with PubSub.
Canvas.prototype.updatePaddleFromMessage = function (message, params) {
  this.updatePaddle(params.name, params);
};

// Adapts the updateBlock function for use with PubSub.
Canvas.prototype.updateBlockFromMessage = function (message, params) {
  this.updateBlock(params.name, params);
};

Canvas.prototype.updatePaddle = function (name, params) {
  this.updateType(
    name,
    params,
    Paddle
  );
};

Canvas.prototype.updateBall = function (name, params) {
  this.updateType(
    name,
    params,
    Ball
  );
};

Canvas.prototype.updateBlock = function (name, params) {
  this.updateType(
    name,
    params,
    Block
  );
};

Canvas.prototype.updateType = function (name, params, Type) {
  // Find the object in the various arrays.
  var found = this.findByNameType(name, Type);
  // Normalize the type name.
  var typeName = Type.name.toLowerCase();

  if (found) {
    // If X is set, update the X position
    // for the model and Stage object.
    if (params.x) {
      found.x = params.x;
      found.view.x = params.x;
    }

    // If Y is set, update the Y position
    // for the model and Stage object.
    if (params.y) {
      found.y = params.y;
      found.view.y = params.y;
    }

    // If the rotation is set, update the rotation
    // for the Stage object.
    if (params.rotRad) {
      found.rotRad = params.rotRad;
      // Stage only deals with degrees.
      // The rotation comes from PhysicsJS which deals
      // only with radians.
      found.view.rotation = radToDeg(params.rotRad);
    }

    // Update the canvasElement color if given.
    if (params.color) {
      found.changeColor(params.color);
    }

    // Let any component listening know that
    // we updated this object that has a
    // certain canvasElement Type.
    params = {};
    params[typeName] = found;
    PubSub.publish(
      typeName + "Updated",
      params
    );
  }
};

Canvas.prototype.removeByNameType = function (name, Type) {
  // Find the object in the various arrays.
  var found = this.findByNameType(name, Type);
  // Get the string plural form of the Type.
  var arrayKey = this.getArrayKeyByType(Type);

  if (found && this[arrayKey]) {
    // Filter out any in the array
    // that has the same name
    // as the object we are removing.
    // Uses an anonymous function.
    this[arrayKey] = fjs.select(
      "x => x.name !== '" + name + "'",
      this[arrayKey]
    );

    if (arrayKey == "blocks" && this[arrayKey].length <= 0) {
      // If the array of blocks is empty
      // (they were all smashed), let any
      // component listening know.
      // This will signal the end of the game.
      PubSub.publish("noMoreBlocks", {});
    }
  }
};

Canvas.prototype.findByNameType = function (name, Type) {
  // Get the string plural lowercase form of the Type.
  var arrayKey = this.getArrayKeyByType(Type);

  // Return the first object with the same name
  // in the array of objects with Type.
  return fjs.first(
    "x => x.name === '" + name + "'",
    this[arrayKey]
  );
};

Canvas.prototype.getArrayKeyByType = function (Type) {
  // Takes a type and returns the array object key.
  // For example, it turns 'Paddle' into 'paddles'.
  // 'Paddle' => 'paddles' => this['paddles'] => this.paddles
  if (!Type) {return "";}

  return Type.name.toLowerCase() + "s";
};

Canvas.prototype.updateToPhysics = function () {
  if (!this.world) {
    return;
  }

  fjs.each(function (body) {
    var vel = null;

    if (body.canvasElementType === "Ball") {
      // Increase the magnitude of each ball's
      // velocity vector.
      // Without it, the balls would eventually
      // come to rest.
      vel = body.state.vel;
      body.state.vel = Physics.vector(
        // Make sure to get the sign right
        // to maintain the same direction
        // but increase the magnitude.
        vel.x + sign(vel.x) * this.ballVelX * this.delta,
        vel.y + sign(vel.y) * this.ballVelY * this.delta
      );
    } else if (body.canvasElementType === "Paddle") {
      // Update the paddle positions in the physics
      // simulation based on the positions
      // set by the *PaddleControls.
      body.state.pos = Physics.vector(
        body.canvasElement.x,
        body.canvasElement.y
      );
      body.state.angular.pos = body.canvasElement.rotRad;
    }
  }.bind(this), this.world.getBodies());
};

Canvas.prototype.updateFromPhysics = function () {
  var updateParams = null;

  if (!this.world) {
    return;
  }

  // After the world physics state has updated,
  // update the canvasElement balls and blocks
  // with their new positions and rotations.
  // This will be sent to Stage which will
  // redraw them on the canvas at their new locations
  // and rotations based on the physics calculations.
  // This bridges the gap between PhysicsJS and EaselJS.
  fjs.each(function (body) {
    updateParams = {
           x: body.state.pos.x,
           y: body.state.pos.y,
      rotRad: body.state.angular.pos
    };

    if (body.canvasElementType === "Ball") {
      this.updateBall(
        body.canvasElement.name,
        updateParams
      );
    } else if (body.canvasElementType === "Block") {
      this.updateBlock(
        body.canvasElement.name,
        updateParams
      );
    }
  }.bind(this), this.world.getBodies());
};

Canvas.prototype.bodyCollisions = function (data) {
  var collisions = data.collisions;

  // Helper function that we will curry.
  function getType(bodyA, bodyB, typeName) {
    // Using an anonymous function,
    // find the first with the same typeName.
    return fjs.first(
      "x => x.canvasElementType === '" + typeName + "'",
      [bodyA, bodyB]
    );
  }

  fjs.each(function (collision) {
    var bodyA = collision.bodyA;
    var bodyB = collision.bodyB;
    var find = fjs.curry(getType)(bodyA, bodyB);
    var bodyBlock   = find("Block");
    var bodyBall    = find("Ball");
    var bodyPaddle  = find("Paddle");
    var boundingBox = find("aabb");

    function removeBlock() {
      if (!this.ready) {return;}

      // Remove the block from Stage.
      this.stage.removeChild(bodyBlock.canvasElement.view);

      // Remove the block from PhysicsJS.
      this.world.remove(bodyBlock);

      // Mark the block deleted.
      bodyBlock.canvasElement.deleted = true;

      // Remove the block from the this.blocks array.
      this.removeByNameType(bodyBlock.canvasElement.name, Block);
    }

    // Different collision cases.

    // Ball hit a block.
    if (bodyBlock && bodyBall) {
      PubSub.publish(
        'blockBallHit',
        {ball: bodyBall.canvasElement, block: bodyBlock.canvasElement}
      );

      // Go ahead a remove the block in 200 milliseconds.
      window.setTimeout(removeBlock.bind(this), 200);
    }

    // A ball hit a paddle.
    if (bodyBall && bodyPaddle) {
      // Let the Referee know.
      PubSub.publish(
        'ballPaddleHit',
        {ball: bodyBall.canvasElement, paddle: bodyPaddle.canvasElement}
      );

      // Increase the added ball velocity.
      this.ballVelX = this.ballVelY += 0.0001;
    }

    // A ball hit the bounding box that surrounds the canvas.
    if (bodyBall && boundingBox) {
      // Let the Referee know.
      PubSub.publish(
        'boundingBoxBallHit',
        {ball: bodyBall.canvasElement, boundingBox: boundingBox}
      );
    }
  }.bind(this), collisions);
};

Canvas.prototype.shakeCanvasAsync = function () {
  // Calls shakeCanvas in 0 milliseconds.
  window.setTimeout(this.shakeCanvas.bind(this), 0);
};

Canvas.prototype.shakeCanvas = function () {
  // If not set.
  if (!this.shakeCanvasSteps) {
    // Set it to zero.
    this.shakeCanvasSteps = 0;
  }

  // Shake the canvas 20 times.
  if (this.shakeCanvasSteps <= 20) {
    // If even.
    if (this.shakeCanvasSteps % 2 === 0) {
      // Shake it up.
      this.canvasNode.style.position = "absolute";
      this.canvasNode.style.top = "-5px";
    } else {
      // Shake it down.
      this.canvasNode.style.position = "absolute";
      this.canvasNode.style.top = "10px";
    }

    // Update the number of shakes and call this function
    // in 10 milliseconds.
    this.shakeCanvasSteps += 1;
    window.setTimeout(this.shakeCanvas.bind(this), 10);
  } else {
    // All shakes were performed so reset the canvas
    // back to its normal position.
    this.shakeCanvasSteps = 0;
    this.canvasNode.style.position = "absolute";
    this.canvasNode.style.top = "0px";
  }
};
