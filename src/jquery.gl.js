// Copyright (c) 2011 Kevin Rabsatt
//
// JQuery GL strives to simplify the creation of webgl content by
// abstracting tedium associated with setup and initializaiton
// freeing the developer to focus on actual content.

(function($) {

  /**
   * Manages binding and associating buffers.
   * @constructor
   */
  function BufferManager(gl) {
    this._gl = gl;
    // TODO: Make this an associative container and add ability to
    // selectively bind.
    this._buffers = [];
  }

  /**
   * Binds all buffers we know about.
   */
  BufferManager.prototype.bindAll = function() {
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
   * Set a binding for us to track.
   * Along the way, we create a gl buffer and attribute location,
   * associating the two for future binding.
   * @param {Array} array
   * @param {String} attributeName
   * @param {Number} l 
   */
  BufferManager.prototype.setBinding = function(array, attributeName, l) {
    var gl = this._gl;
    if (!l){
      l = 3;
    }

    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(array), gl.STATIC_DRAW);

    attribute = gl.getAttribLocation(gl.x.prog, attributeName);
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
   * @param {WebGLRenderingContext} context  A webgl context.
   * @param {String} scriptId  The id of the script element containing shader.
   * @return {WebGLShader?} An initialized (but not attached) shader.
   */
  var createShader = function(context, scriptId) {
    var script = $('#' + scriptId);
    var src = script.text();
    if (!src || src == '') {
      alert('Unable to find source for shader: ' + scriptId);
      return null;
    }
    var type = script.attr('type');
    var shader = null;
    if (type == 'x-shader/x-vertex') {
      shader = context.createShader(context.VERTEX_SHADER);
    }  else if (type == 'x-shader/x-fragment') {
      shader = context.createShader(context.FRAGMENT_SHADER);
    } else {
      alert('Shader script must have type "x-shader/x-fragment" or' +
            ' "x-shader/x-vertex"');
      return null;
    }
    context.shaderSource(shader, src);
    context.compileShader(shader);
    if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
      alert('Shader compilation failed: ' + scriptId + ': ' +
            context.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  };


  /**
   * Creates a shader program, attaches vs and fs, then links it.
   *
   * @param context {WebGLRenderingContext} context  A webgl context.
   * @param vs {WebGLShader} vs  A vertex shader.
   * @param vs {WebGLShader} vs  A vertex shader.
   * @return {WebGLProgram}  The linked shader program.
   */
  var createShaderProgram = function(context, vs, fs) {
    prog = context.createProgram();
    context.attachShader(prog, vs);
    context.attachShader(prog, fs);
    context.linkProgram(prog);
    if (!context.getProgramParameter(prog, context.LINK_STATUS)) {

      alert('Shader program link failed: ' +
            context.getProgramInfoLog(prog));
    }
    return prog;
  };


  /**
   * Mix in our extension properties.
   *
   * @param {WebGLRenderContext} gl  The context to add properties to.
   * @param {WebGLProgram} prog  The shader program bound to gl.
   */
  var mixIn = function(gl, prog) {
    gl.x = {
      prog: prog,
      buffers: new BufferManager(gl),
      uMatrix: function(m, name) {  // TODO Defining this here feels dirty.
        var loc = gl.getUniformLocation(gl.prog, name);
        gl.uniformMatrix4fv(loc, false, new Float32Array(m.flatten()));

      }
    }
  }


  /**
   * Create and initialize a webgl rendering context.
   *
   * This function only operates on the first element if multiple are matched.
   *
   * @param {Object} opts  An options object.  Required members:
   *                       vsID: The id of the vertex shader script element.
   *                       fsID: The id of the fragment shader script element.
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
    if (!opts || !opts.vsId || !opts.fsId) {
      alert('A gl() required parameter is malformed or missing:' +
            ' vsID and fsID are required properties.');
      return null;
    }
    var gl = getContext(this[0]);
    var vs = createShader(gl, opts.vsId);
    var fs = createShader(gl, opts.fsId);
    var prog = createShaderProgram(gl, vs, fs);
    gl.useProgram(prog);
    mixIn(gl, prog);

    if (opts.init) {
      opts.init(gl);
    }
    if (opts.draw) {
      if (opts.framerate && opts.framerate > 0) {
        setTimeout(function() { opts.draw(gl); }, 1000.0/opts.framerate);
      } else {
        opts.draw(gl);
      }
    }
    return gl;
  };
})(jQuery);
