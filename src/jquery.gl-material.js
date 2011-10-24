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

Material.prototype.p = function(name) {
 return this.addUniform(this.DefaultMatrix.P, name);
};

Material.prototype.m = function(name) {
 return this.addUniform(this.DefaultMatrix.M, name);
};

Material.prototype.c = function(name) {
 return this.addUniform(this.DefaultMatrix.C, name);
};

Material.prototype.n = function(name) {
 return this.addUniform(this.DefaultMatrix.N, name);
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
  return this;
};

Material.prototype.loadShaderSource = function(src, type) {
  var gl = this._gl;
  var shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('Shader compilation failed: \n' + src + '\n\n' +
          gl.getShaderInfoLog(shader));
    return null;
  }
  if (shader) {
    if (this._shaders[type]) {
      gl.detachShader(this.prog, this._shaders[type]);
    }
    gl.attachShader(this.prog, shader);
    this._shaders[type] = shader;
    // Only marks for deletion.  Deleted when it becomes unused.
    gl.deleteShader(shader);
  }

  return shader;
}

Material.prototype._createShader = function(src, type) {
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
  return this.loadShaderSource(src, type);
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
  if (!e || (e.length && (e.length == 0))) {
    alert('Unable to find shader element with id ' + id);
  }
  if (!type) {
    type = getType(e);
  }
  var shader = this._createShader(e, type);
  return this;
};

/**
 * Add a binding between a matrix and a uniform matrix.
 *
 * @param {Matrix|DefaultMatrix|Vector} matrix  A sylvester matrix.
 */
Material.prototype.addUniform = function(matrix, name) {
  this._uniforms[name] = matrix;
  return this;
};

Material.prototype.uniform = Material.prototype.addUniform;

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
    if (callback) {
      callback();
    }
  }
  image.onload = onload;
  image.src = src;
  return this;
};

Material.prototype.texture = Material.prototype.addTexture;

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

