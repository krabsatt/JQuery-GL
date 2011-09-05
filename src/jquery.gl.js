// Copyright (c) 2011 Kevin Rabsatt
//
// JQuery GL strives to simplify the creation of webgl content by
// abstracting tedium associated with setup and initializaiton
// freeing the developer to focus on actual content.

(function($) {

  /**
   * A thin wrapper around a shader program.
   * @constructor
   */
  function Material(prog, gl) {
    this._gl = gl;
    this.prog = prog;
    this._uniforms = {};
    this.DefaultMatrix = {
      P: 0,
      M: 1
    }
  }

  /**
   * Add a binding between a matrix and a uniform matrix.
   *
   * @param {Matrix|gl.m} matrix  A sylvester matrix.
   */
  Material.prototype.addUniform = function(matrix, name) {
    this._uniforms[name] = matrix
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
      }
      var uniform = gl.getUniformLocation(this.prog, name);
      if (uniform == -1) {
        alert('Unable to find uniform name ' + name + ' in shaders.');
      }

      var flat = [];
      var len = 4;
      for (var i = 0; i < len; ++i) {
        for (var j = 0; j < len; ++j) {
          flat.push(matrix.e(i, j));
        }
      }

      gl.uniformMatrix4fv(uniform, false, new Float32Array(flat));
    }
  }


  /**
   * Emulates the gl matrix stack with additional helpers.
   * Requires Sylvester
   */
  function MatrixManager() {  // No touchie gl
    this._mStack = [Matrix.I(4)];
    this.m = this._mStack[0];
    this.p = Matrix.I(4);
  }

  MatrixManager.prototype.push = function() {}
  MatrixManager.prototype.pop = function() {  }
  MatrixManager.prototype.identity = function() {
    this.m = Matrix.I(4)
  }
  MatrixManager.prototype.i = function() {
    this.identity();
  }
  MatrixManager.prototype.translate = function(v) {
    var t = Matrix.I(4);
    for (var i = 0; i < 4; ++i) {
      t.elements[i][3] = v[i];
    }
    this.m.x(t);
  }


  /**
   * Abstraction of a set of buffers using a single shader program.
   * @constructor
   */
  function Model(gl, material) {
    this._buffers = [];
    this._gl = gl;
    // TODO: Get this from elsewhere?
    this._vert_length = 0;
    this._material = material
    if (!material) {
      this._material = gl.x.currentMaterial;
    }
    if (!material) {
      alert('Must create a material before you can create a Model.');
    }
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
    }
  };

  /**
   * Set attribute binding for this model.
   * Along the way, we create a gl buffer and attribute location,
   * associating the two.
   * @param {Array} array
   * @param {String} attributeName
   * @param {Number} l 
   */
  Model.prototype.addAttribute = function(array, attributeName, l) {
    var gl = this._gl;
    if (!l){
      l = 3;
    }
    this._vert_length = array.length/l;

    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(array), gl.STATIC_DRAW);

    attribute = gl.getAttribLocation(this._material.prog, attributeName);
    if (attribute == -1) {
      alert('Unable to find attribute name ' + attributeName + ' in shaders.');
    }
    gl.enableVertexAttribArray(attribute);

    this._buffers.push({
      attr: attribute,
      buffer: buffer,
      l: l
    });
  };

  /**
   * Draws the model.
   */
  Model.prototype.draw = function() {
    var gl = this._gl;
    gl.useProgram(this._material.prog);
    this._setAttributes();
    this._material.setUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this._vert_length);
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
   * Creates a shader for the given context from the script with id scriptId,
   * @param {WebGLRenderingContext} gl  A webgl context.
   * @param {String} scriptId  The id of the script element containing shader.
   * @return {WebGLShader?} An initialized (but not attached) shader.
   */
  var createShader = function(gl, scriptId) {
    var script = $('#' + scriptId);
    var src = script.text();
    if (!src || src == '') {
      alert('Unable to find source for shader: ' + scriptId);
      return null;
    }
    var type = script.attr('type');
    var shader = null;
    if (type == 'x-shader/x-vertex') {
      shader = gl.createShader(gl.VERTEX_SHADER);
    }  else if (type == 'x-shader/x-fragment') {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else {
      alert('Shader script must have type "x-shader/x-fragment" or' +
            ' "x-shader/x-vertex"');
      return null;
    }
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert('Shader compilation failed: ' + scriptId + ': ' +
            gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  };


  /**
   * Creates a shader program, attaches vs and fs, then links it.
   *
   * @param gl {WebGLRenderingContext} context  A webgl context.
   * @param vs {WebGLShader} vs  A vertex shader.
   * @param vs {WebGLShader} vs  A vertex shader.
   * @return {WebGLProgram}  The linked shader program.
   */
  var createShaderProgram = function(gl, vs, fs) {
    prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {

      alert('Shader program link failed: ' +
            gl.getProgramInfoLog(prog));
    }
    return prog;
  };


  /**
   * Defines some shortcuts we will add to the context.
   * @constructor
   */
  function GLExtension(gl) {
    this._models = [];
    this._gl = gl;
  }

  /**
   * Create a model that uses the given material.
   *
   * @param {Material}  material  A material to use to draw the new model.
   * @return The created material.
   */
  GLExtension.prototype.createModel = function(material) {
    model = new Model(this._gl, material);
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
    var vs = createShader(gl, vsId);
    var fs = createShader(gl, fsId);
    var prog = createShaderProgram(gl, vs, fs);
    if (!prog) {
      alert('Failed to create program: ' + vs + ', ' + fs);
    }
    this.currentMaterial = new Material(prog, gl);
    return this.currentMaterial;
  };

  /**
   * Gets the first model (temporary)
   */
  GLExtension.prototype.models = function() {
    // TODO Add iteration
    return this._models[0];
  };


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
    var gl = getContext(this[0]);
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
