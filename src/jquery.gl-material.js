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
  };
}

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

/**
 * Extracts source from a script or textbox element.
 */
Material.prototype._srcFromElement = function(e) {
  var src = e.val();
  if ('' === src) {
    src = e.text();
  }
  var id = e.attr('id');
  if (!src || src === '') {
    alert('No source for shader with id: ' + id);
    return null;
  }
  return src;
};

/**
 * Extracts source from an element if an id is given.
 * 
 * @return {String}  Source code.
 */
Material.prototype._extractSrc = function(idOrSrc) {
  if (idOrSrc.indexOf('{') >= 0) {
    return idOrSrc;
  } else {
    var id = idOrSrc;
    var e = $('#' + id);
    if (!e || (e.length && (e.length === 0))) {
      alert('Unable to find shader element with id ' + id);
    }
    return this._srcFromElement(e);
  }
};

/**
 * Loads a vertex shader.
 * 
 * You will need to call link() after loading any shaders.
 * 
 * @param {String}  idOrSrc  Either the id of an element to pull source from or
 *                           actual source to laod.
 */
Material.prototype.vs = function(idOrSrc) {
  var src = this._extractSrc(idOrSrc);
  return this._loadShaderSource(src, this._gl.VERTEX_SHADER);  // this
};

/**
 * Loads a fragment shader.
 * 
 * You will need to call link() after loading any shaders.
 * 
 * @param {String}  idOrSrc  Either the id of an element to pull source from or
 *                           actual source to laod.
 */
Material.prototype.fs = function(idOrSrc) {
  var src = this._extractSrc(idOrSrc);
  return this._loadShaderSource(src, this._gl.FRAGMENT_SHADER);  // this
};

/**
 * Loads a shader for the given type from the source code provided.
 *
 * @param {String} src  Source code for the shader.
 * @param {gl.FRAGMENT_SHADER|gl.VERTEX_SHADER} type  The shader type.
 */
Material.prototype._loadShaderSource = function(src, type) {
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
  var gl = this._gl;
  var texture = gl.createTexture();
  var image = new Image();
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
  };
  image.onload = onload;
  image.src = src;
  return this;
};

Material.prototype.texture = Material.prototype.addTexture;

/**
 * Sets texture samplers for shaders to use.
 * 
 * Used by jquery-gl during drawing.
 */
Material.prototype.setTextures = function() {
  var gl = this._gl;
  var i = 0;
  for (var name in this._textures) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._textures[name]);
    gl.uniform1i(gl.getUniformLocation(this.prog, name), i);
    i++;
  }
};

/**
 * Sets shader uniform matrices added.
 * 
 * Used by jquery-gl during drawing.
 */
Material.prototype.setUniforms = function() {
  var gl = this._gl;
  for (var name in this._uniforms) {
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
};

