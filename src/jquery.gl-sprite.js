// Copyright (c) 2011 Kevin Rabsatt
//
// Sprites and SpriteModifiers.

function _delegateTo(obj, fname) {
  return function() {
    obj[fname].apply(obj, arguments);
    return this;
  };
}


/**
 * Mix sprite functionality into the owning Model.
 *
 * @param {Model} model  The model to mix sprite methods into.
 * @param {SpriteModifier} modifier  The modifier to handle sprite calls.
 * @return The Model mixed.
 */
function MixInSprite(model, modifier) {
  model.setSequence = _delegateTo(modifier, 'setSequence');
  model.useSequence = _delegateTo(modifier, 'useSequence');
  model.nextFrame = function() { modifier.nextFrame(); };
  return model;
}

/**
 * Model Attribute Modifier for multi-frame texture coord modification.
 * Abstraction of a set of frames in a single texture.
 *
 * @param {WebGLRenderContext} gl  The owning context.
 * @param {Number} width  The texture width in pixels.
 * @param {Number} height  The texture hieght.
 * @param {Number} fWidth  The frame width in pixels.
 * @param {Number} fHeight  The frame height.
 * @param {Object?} opts  Not implemented
 * @constructor
 */
function SpriteModifier(gl, width, height, fWidth, fHeight, opts) {
  this._frame = 0;
  this._width = width;
  this._height = height;
  this._fWidth = fWidth;
  this._fHeight = fHeight;
  this._sequences = {};
  this._sequence = null;
  if (opts) {
    // TODO set up a default sequence or starting frame
  }
  this._maxFrames = Math.floor(width/fWidth * height/fHeight);
  this._gl = gl;
  this._changed = true;
}

/**
 * Show next frame.
 */
SpriteModifier.prototype.nextFrame = function() {
  if (this._sequence) {
    var seq = this._sequence;
    if (this._frame < seq.end) {
      this._frame++;
      // Sequence can change underneath us.
      if (this._frame < seq.start) {
        this._frame = seq.start;
      }
    } else {
      if (seq.loop) {
        this._frame = seq.start;
      }
    }
  } else {
    this._frame = (this._frame + 1) % this._maxFrames;
  }
  this._changed = true;
  return this;
};

/**
 * Sets the named sequence as current.
 *
 * @param {string} name  The name of the sequence to use.
 */
SpriteModifier.prototype.useSequence = function(name) {
  this._sequence = this._sequences[name];
  return this;
};

/**
 * Creates a new named sequence.
 *
 * @param {string} name  The name of the sequence.
 * @param {Number} start  The first frame of the sequence.
 * @param {Number} end  The last frame of the sequence.
 * @param {boolean} loop  If the sequence should loop or not.
 */
SpriteModifier.prototype.setSequence = function(name, start, end, loop) {
  this._sequences[name] = {
    start: start,
    end: end,
    loop: loop
  };
  return this;
};

SpriteModifier.prototype._uvForFrame = function() {
  var cols =  Math.floor(this._width/this._fWidth);
  var rows =  Math.floor(this._height/this._fHeight);
  var row = Math.floor(this._frame / cols);
  var col = this._frame % cols;
  // v-direction is opposite y-direction
  var u0 = (col * this._fWidth) / this._width;
  var u1 = ((col + 1) * this._fWidth) / this._width;
  var v1 =  (row * this._fHeight) / this._height;
  var v0 =  ((row + 1) * this._fHeight) / this._height;
  var uv = [u1, v1,
            u0, v1,
            u1, v0,
            u0, v0];
  return uv;
};

/**
 * Attribute modifier interface.
 *
 * Called by the model on the buffer this modifier was assigned.
 * Attribute and buffer are bound before calling this function.
 *
 * @param {WebGLBuffer} buffer  The buffer to modify.  // TODO broken. Verify.
 */
SpriteModifier.prototype.modifyAttributeBuffer = function(buffer) {
  if (!this._changed) {
    return;
  }
  var gl = this._gl;
  var array = this._uvForFrame();
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(array), gl.STATIC_DRAW);
  this._changed = false;
};
