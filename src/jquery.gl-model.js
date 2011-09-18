// Copyright (c) 2011 Kevin Rabsatt
//
// Models.


/**
 * Abstraction of a set of buffers using a single shader program.
 * @constructor
 */
function Model(gl, material, type, length) {
  if (!gl) {
    alert('Tried to create a model with undefined context.');
  }
  if (!type) {
    alert('Tried to create a model with undefined geometry type.');
  }
  if (!length) {
    alert('Tried to create a model with undefined length.');
  }
  this.orientation = new MatrixManager();
  this.o = this.orientation;
  this.o.perspective = undefined;
  this._vert_length = length;
  this._type = type;
  this._buffers = [];
  this._gl = gl;
  this._material = material
  if (!material) {
    this._material = gl.x.currentMaterial;
  }
  if (! this._material) {
    alert('Must create a material before you can create a Model.');
  }
  this._elementArray = null;
}

/**
 * Binds all buffers we know about.
 */
Model.prototype._setAttributes = function() {
  for (i = 0; i < this._buffers.length; ++i) {
    attr = this._buffers[i].attr;
    buffer = this._buffers[i].buffer;
    l = this._buffers[i].l;

    var gl = this._gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
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
    alert('Unable to find attribute name ' + attributeName + ' in shaders.');
  }

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(array), gl.STATIC_DRAW);
  this._buffers.push({
    attr: attribute,
    buffer: buffer,
    l: l
  });
};

/**
 * Sets the element index array buffer.
 *
 * @raram {Array} An array of ints representing the element indices.
 */
Model.prototype.addElementArray = function(elements) {
  var gl = this._gl;
  buffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(elements), gl.STATIC_DRAW);
  this._elementArray = buffer;
}

/**
 * Tells this model to use its own orientation matrix for drawing.
 */
Model.prototype.useOrientation = function() {
  this.orientation = new MatrixManager();
  this.o = this.orientation;
  this.o.perspective = undefined;
}

/**
 * Draws the model.
 */
Model.prototype.draw = function() {
  var gl = this._gl;
  if (this.o) {
    gl.m.push();
    gl.m.apply(this.o.m);
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
}

