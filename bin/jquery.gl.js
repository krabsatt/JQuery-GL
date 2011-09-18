// Copyright (c) 2011 Kevin Rabsatt
//
// JQuery GL strives to simplify the creation of webgl content by
// abstracting tedium associated with setup and initializaiton
// freeing the developer to focus on actual content.

(function($) {

  var INFO = {
    version: '0.8'
  }

  // The INJECTION_POINT line is replaced with the jquery.gl-*.js files.
  // It must not be modified.
  

// Copyright (c) 2011 Kevin Rabsatt
//
// The .x object we add to the WebGLRenderContext.

/**
 * Defines some shortcuts we will add to the context.
 * @constructor
 */
function GLExtension(gl) {
  this.info = INFO;
  this._models = [];
  this._gl = gl;
}

/**
 * Create a model that uses the given material.
 *
 * @param {Material}  material  A material to use to draw the new model.
 * @return The created material.
 */
GLExtension.prototype.createModel = function(material, type, len) {
  model = new Model(this._gl, material, type, len);
  this._models.push(model);
  return model
}

/**
 * Creates a new material from shader script elements.
 *
 * @param {String} vsId:  The vertex shader script element id.
 * @param {String} fsId:  The fragment shader script element id.
 * @return {Material}  A new material object.
 */
GLExtension.prototype.createMaterial = function(vsId, fsId) {
  var gl = this._gl;
  this.currentMaterial = new Material(gl);
  material = this.currentMaterial;
  material.loadShader(vsId,  gl.VERTEX_SHADER);
  material.loadShader(fsId,  gl.FRAGMENT_SHADER);
  material.link();
  return material;
};

/**
 * Initializes depth function and value.
 *
 * @param {Number} depth  Default depth (default 1.0)
 */
GLExtension.prototype.initDepth = function(depth) {
  if (!depth) {
    depth = 1.0;
  }
  var gl = this._gl;
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(depth);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
}

/**
 * Gets the first model (temporary)
 */
GLExtension.prototype.models = function(selector) {
  if (typeof(selector) == 'number') {
    return this._models[selector];
  }
  // TODO Add iteration
  return this._models[0];
};


// Copyright (c) 2011 Kevin Rabsatt
//
// Materials.

/**
 * A thin wrapper around a shader program.
 * @constructor
 */
function Material(gl) {
  if (!gl) {
    alert('Tried to create a material with undefined context.');
  }
  this._gl = gl;
  this.prog = gl.createProgram();
  this._shaders = {};
  this._uniforms = {};
  this._textures = {};
  this.DefaultMatrix = {
    P: 0,  // Projection
    M: 1,  // Movement
    C: 2,  // Camera Orientation
    N: 3   // Normals (inverse transpose of M)
  }
};

/**
 * Links the underlying shader program.
 */
Material.prototype.link = function() {
  var gl = this._gl;
  var prog = this.prog;
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    alert('Shader program link failed: ' + gl.getProgramInfoLog(prog));
  }
};

Material.prototype._createShader = function(e, type) {
  var gl = this._gl;
  var src = e.val();  // Check if input/textarea first.
  if ('' == src) {
    src = e.text();
  }
  var id = e.attr('id');
  if (!src || src == '') {
    alert('No source for shader with id: ' + id);
    return null;
  }
  if (!type) {
    type = getScriptType(e, gl);
    if (!type) {
      alert('Shader script must have type attribute set to ' +
            ' "x-shader/x-fragment" or "x-shader/x-vertex"');
      return null;
    }
  }

  var shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('Shader compilation failed: ' + id + ': ' +
          gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
};

var getScriptType = function(script, gl) {
  var type = script.attr('type');
  if (type == 'x-shader/x-vertex') {
    return compileShader(gl, src, scriptId, gl.VERTEX_SHADER);
  }  else if (type == 'x-shader/x-fragment') {
    return compileShader(gl, src, scriptId, gl.FRAGMENT_SHADER);
  } else {
    return null;
  }
};

/**
 * Loads a shader for the given type from an element with given id.
 *
 * @param {String} id  The id of the element containing source.
 * @param {gl.FRAGMENT_SHADER|gl.VERTEX_SHADER} type  The shader type.
 */
Material.prototype.loadShader = function(id, type) {
  var gl = this._gl;
  var e = $('#' + id);
  if (!type) {
    type = getType(e);
  }
  var shader = this._createShader(e, type);
  if (shader) {
    if (this._shaders[type]) {
      gl.detachShader(this.prog, this._shaders[type]);
    }
    gl.attachShader(this.prog, shader);
    this._shaders[type] = shader;
    // Only marks for deletion.  Deleted when it becomes unused.
    gl.deleteShader(shader);
  }
};

/**
 * Add a binding between a matrix and a uniform matrix.
 *
 * @param {Matrix|DefaultMatrix|Vector} matrix  A sylvester matrix.
 */
Material.prototype.addUniform = function(matrix, name) {
  this._uniforms[name] = matrix
};

/**
 * Adds a texture to be used by the shader.
 *
 * Texture image must be a square with size 2^n.
 *
 * @param {String} src  The location of the texture image.
 * @param {String} name  The uniform name of the sampler.
 * @param {function} callback  A function to be called when img loaded.
 */
Material.prototype.addTexture = function(src, name, callback) {
  if (!name) {
    alert('No uniform name supplied for texture: ' + src);
  }
  gl = this._gl;
  texture = gl.createTexture();
  image = new Image();
  var outerThis = this;
  var onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(
        gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    outerThis._textures[name] = texture;
    callback();
  }
  image.onload = onload;
  image.src = src;
};

/**
 * Sets texture samplers for shaders to use.
 */
Material.prototype.setTextures = function() {
  var i = 0;
  for (name in this._textures) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._textures[name]);
    gl.uniform1i(gl.getUniformLocation(this.prog, name), i);
    i++;
  }
}

/**
 * Sets shader uniform matrices added.
 */
Material.prototype.setUniforms = function() {
  var gl = this._gl;
  for (name in this._uniforms) {
    var matrix = this._uniforms[name];
    if (matrix == this.DefaultMatrix.M) {
      matrix = gl.m.m;
    } else if (matrix == this.DefaultMatrix.P) {
      matrix = gl.m.p;
    } else if (matrix == this.DefaultMatrix.C) {
      matrix = gl.m.c;
    } else if (matrix == this.DefaultMatrix.N) {
      matrix = gl.m.m.inverse().transpose();
    }
    var uniform = gl.getUniformLocation(this.prog, name);
    if (!uniform) {
      alert('Unable to find uniform name ' + name + ' in shaders.');
    }

    var flat = [];
    var len = 4;
    for (var i = 0; i < len; ++i) {
      for (var j = 0; j < len; ++j) {
        flat.push(matrix.elements[j][i]);
      }
    }

    gl.uniformMatrix4fv(uniform, false, new Float32Array(flat));
  }
}



// Copyright (c) 2011 Kevin Rabsatt
//
// Defines the .m object we attach to the WebGLRenderContext.

/**
 * Emulates the gl matrix stack with additional helpers.
 * Requires Sylvester
 */
function MatrixManager() {  // No touchie gl
  this._stack = [];
  this.m = Matrix.I(4);
  this.p = Matrix.I(4);
  this.c = Matrix.I(4);
}

/**
 * Creates a look-at transformation matrix and sets this.c.
 *
 * To use this, ensure that you are setting a uniform to DefaultMatrix.C
 * TODO: Create an abstract camera object.
 *
 * @return {Matrix}  The created matrix.
 */
MatrixManager.prototype.lookAt = function(eye, focus, up) {
  var eye = $V(eye);
  var up = $V(up).toUnitVector();
  var f = $V($V(focus).subtract(eye)).toUnitVector();
  var s = f.cross(up);
  var u = s.cross(f);
  var m=$M(
      [[s.elements[0], s.elements[1], s.elements[2],0],
       [u.elements[0],u.elements[1],u.elements[2],0],
       [-f.elements[0],-f.elements[1],-f.elements[2],0],
       [0, 0, 0, 1]]);
  var t = createTranslation(eye.x(-1));
  this.c = m.x(t);
}

/**
 * Creates a perspective projection matrix and sets this.p.
 *
 * To use this, ensure that you are setting a uniform to DefaultMatrix.P
 *
 * @param {Number} near  The near z-plane distance.
 * @param {Number} far  The far z-plane distance.
 * @param {Number} width  The width of your render context.
 * @param {Number} height  The height of your render context.
 * @param {Number} fov  The FOV angle in degrees.
 * @return {Matrix}  The created matrix.
 */
MatrixManager.prototype.perspective = function(
    near, far, width, height, fov) {
  var aspect = width * 1.0 / height;
  // Adjust width, height from image space to projection space.
  height = 2.0 * near * Math.tan(fov * Math.PI / 360.0);
  width = aspect * height;
  var a = 2.0 * near / width;
  var b = 2.0 * near / height;
  var c = -(far + near) / (far - near);
  var d = -2.0 * (far * near) / (far - near);
  this.p = $M(
      [[a, 0, 0, 0],
       [0, b, 0, 0],
       [0, 0, c, d],
       [0, 0, -1, 0]]);
  return this.p;
};

MatrixManager.prototype.push = function() {
  this._stack.push(this.m.dup());
}

MatrixManager.prototype.pop = function() {
  this.m = this._stack.pop()
}

/**
 * Multiplies the matrix with current state matrix in transformation order.
 *
 * @return {Matrix}  The result of m * this.m.
 */
MatrixManager.prototype.apply = function(m) {
  this.m = m.x(this.m);
  return this.m;
}

/**
 * Creates an identity matrix.
 *
 * @return {Matrix}  The created matrix.
 */
MatrixManager.prototype.identity = function() {
  this.m = Matrix.I(4);
  return this.m;
}

/**
 * Creates an identity matrix.
 *
 * @return {Matrix}  The created matrix.
 */
MatrixManager.prototype.i = function() {
  return this.identity();
}

var createTranslation = function(v) {
  var t = Matrix.I(4);
  // If a Vector is passed
  if (v.elements) {
    v = v.elements;
  }
  for (var i = 0; i < v.length; ++i) {
    t.elements[i][3] = v[i];
  }
  return t;
}

/**
 * Creates and applies a translation matrix.
 *
 * @param {Array(3)} v  The translation vector.
 * @return {Matrix}  The created matrix.
 */
MatrixManager.prototype.translate = function(v) {
  var t = createTranslation(v);
  this.apply(t);
  return t;
}

/**
 * Creates and applies a rotation matrix.
 *
 * This is a "right hand rule" rotation.
 *
 * @param {Number} theta  The angle to rotate in degrees.
 * @param {Array(3)} v  The axis vector to rotate around.
 * @return {Matrix}  The created matrix.
 */
MatrixManager.prototype.rotate = function(theta, v) {
  theta = theta * Math.PI / 180.0;
  v = $V(v).toUnitVector();
  var x = v.elements[0];
  var y = v.elements[1];
  var z = v.elements[2];
  var c = Math.cos(theta);
  var s = Math.sin(theta);
  var t = 1 - c;
  var r = $M([
      [t*x*x+c,   t*x*y-s*z, t*x*z+s*y, 0],
      [t*x*y+s*z, t*y*y+c,   t*y*z-s*x, 0],
      [t*x*z-s*y, t*y*z+s*x, t*z*z+c,   0],
      [0,         0,         0,         1]]);

  this.apply(r);
  return r;
}




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



  /**
   * Mix in our extension properties.
   *
   * @param {WebGLRenderContext} gl  The context to add properties to.
   */
  var mixIn = function(gl) {
    gl.m = new MatrixManager();
    gl.x = new GLExtension(gl);
  }

  /**
   * Create a new gl context in the given canvas element.
   *
   * @param {DomElement} canvas  Canvas html element.
   * @return {WebGLRenderingContext?} Newly created webgl context.
   */
  var getContext = function(canvas) {
    var context = null;
    try {
      context = canvas.getContext('webgl');
      if (!context) {
        context = canvas.getContext('experimental-webgl');
      }
    } catch(e) {
      alert('Error creating webgl context: ' + e);
    }
    if (!context) {
      alert('Failed to create webgl context.');
    }
    return context;
  }


  /**
   * Create and initialize a webgl rendering context.
   *
   * This function only operates on the first element if multiple are matched.
   *
   * @param {Object} opts  An options object.  Required members:
   *                       init: A one-time initialization function.
   *                       draw: A draw function that takes context as a param.
   *                       framerate: The framerate to call draw.
   *                                  If not set or set to 0, scene is rendered
   *                                  once.
   *
   * @return {WebGLRenderingContext?}  The context.
   */
  $.fn.gl = function(opts) {
    if (this.length == 0) {
      return this;
    }
    var e = this[0];
    var gl = null;
    if (e._jquery_gl) {
      gl = e._jquery_gl;
    } else {
      gl = getContext(this[0]);
      e._jquery_gl = gl;
    }
    mixIn(gl);

    if (opts.init) {
      opts.init(gl);
    }
    if (opts.draw) {
      if (opts.framerate && opts.framerate > 0) {
        setInterval(function() { opts.draw(gl); }, 1000.0/opts.framerate);
      } else {
        opts.draw(gl);
      }
    }
    return gl;
  };
})(jQuery);