// Copyright (c) 2011 Kevin Rabsatt
//
// Models.


/**
 * Abstraction of a set of buffers using a single shader program.
 * @constructor
 */
function Model(gl, material, type, length) {
  if (!gl) {
    gl.x.error('Tried to create a model with undefined context.');
  }
  if (!type) {
    gl.x.error('Tried to create a model with undefined geometry type.');
  }
  if (!length) {
    gl.x.error('Tried to create a model with undefined length.');
  }
  // Reserved for user use.
  this.state = null;
  this.orientation = new MatrixManager();
  this.o = this.orientation;
  this.o.perspective = undefined;
  this._vert_length = length;
  this._type = type;
  this._buffers = [];
  this._gl = gl;
  this._material = material;
  this._enabled = true;
  if (!material) {
    this._material = gl.x.currentMaterial;
  }
  if (! this._material) {
    gl.x.error('Must create a material before you can create a Model.');
  }
  this._elementArray = null;

  this._modifiers = {};

  this._update = function () {};
  this.update = createAddOrCall('_update', this._gl);
  this.draw = createAddOrCall('_draw', this._gl);
}
// Overwritten in the constructor, but defined on the prototype
// so that Iterator picks them up.
Model.prototype.update = function(gl) {};
Model.prototype.draw = function(gl) {};

/**
 * Binds all buffers we know about.
 */
Model.prototype._setAttributes = function() {
  var gl = this._gl;
  for (var i = 0; i < this._buffers.length; ++i) {
    var name = this._buffers[i].name;
    var attr = this._buffers[i].attr;
    var buffer = this._buffers[i].buffer;
    var l = this._buffers[i].l;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // Run attribute modifiers
    var mods = this._modifiers[name];
    if (mods) {
      for (var j =0; j < mods.length; j++) {
        mods[j].modifyAttributeBuffer(buffer);
      }
    }
    gl.vertexAttribPointer(attr, l, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attr);
  }
  if (this._elementArray) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._elementArray);
  }
};

/**
 * Set attribute binding for this model.
 * Along the way, we create a gl buffer and attribute location,
 * associating the two.
 * @param {Array} array
 * @param {String} attributeName
 * @param {Number?} l The length of each element in array (eg. 3 for
 *                    verts in 3 dimensions)
 */
Model.prototype.addAttribute = function(array, attributeName, l) {
  var gl = this._gl;
  if (!l){
    l = 3;
  }

  var attribute = gl.getAttribLocation(this._material.prog, attributeName);
  if (attribute == -1) {
    gl.x.error('Unable to find attribute name ' + attributeName + ' in shaders.');
  }

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(array), gl.STATIC_DRAW);
  this._buffers.push({
    name: attributeName,
    attr: attribute,
    buffer: buffer,
    l: l
  });
  return this;
};

Model.prototype.attr = Model.prototype.addAttribute;

/**
 * Sets the element index array buffer.
 *
 * @raram {Array} An array of ints representing the element indices.
 */
Model.prototype.addElementArray = function(elements) {
  var gl = this._gl;
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(elements), gl.STATIC_DRAW);
  this._elementArray = buffer;
  return this;
};

Model.prototype.elem = Model.prototype.addElementArray;

/**
 * Tells this model to use its own orientation matrix for drawing.
 * TODO Delete.  No longer needed.
 */
Model.prototype.useOrientation = function() {
  this.orientation = new MatrixManager();
  this.o = this.orientation;
  this.o.perspective = undefined;
};

/**
 * Draws the model.
 */
Model.prototype._draw = function() {
  if (!this._enabled) {
    return this;
  }
  var gl = this._gl;
  if (this.o) {
    gl.m.push().apply(this.o.m);
  }
  gl.useProgram(this._material.prog);
  this._setAttributes();
  this._material.setTextures();
  this._material.setUniforms();
  if (this.o) {
    gl.m.pop();
  }
  if (this._elementArray) {
    gl.drawElements(this._type, this._vert_length, gl.UNSIGNED_SHORT, 0);
  } else {
    gl.drawArrays(this._type, 0, this._vert_length);
  }
  return this;
};

Model.prototype.show = function() {
  this._enabled = true;
  return this;
};
Model.prototype.hide = function() {
  this._enabled = false;
  return this;
};
Model.prototype.toggle = function() {
  this._enabled = !this._enabled;
  return this;
};

/**
 * Add an AttributeModifier for an attribute.
 * 
 * @param {string} attrName  The name of the attribute the modifier modifies.
 * @param {Object} modifier  The modifier.
 */
Model.prototype.addModifier = function(attrName, modifier) {
  if (this._modifiers[attrName]) {
    this._modifiers[attrName].push(modifier);
  } else {
    this._modifiers[attrName] = [modifier];
  }
};

