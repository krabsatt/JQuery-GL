// Copyright (c) 2011 Kevin Rabsatt
//
// JQuery GL strives to simplify the creation of webgl content by
// abstracting tedium associated with setup and initializaiton
// freeing the developer to focus on actual content.

(function($) {
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
  }

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
  }

  /**
   * Create and initialize a webgl rendering context.
   *
   * This function only operates on the first element if multiple are matched.
   *
   * @param {Object} opts  An options object.  Required members:
   *                       vsID: The id of the vertex shader script element.
   *                       fsID: The id of the fragment shader script element.
   *                       TODO:
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
    var context = getContext(this[0]);
    var vs = createShader(context, opts.vsId);
    var fs = createShader(context, opts.fsId);
    var prog = createShaderProgram(context, vs, fs);
    // TODO: see below @context.pos
    context.prog = prog;
    context.useProgram(prog);

    var positionAttributeName = opts.posAttr;
    if (!positionAttributeName) {
      positionAttributeName = 'aPos';  // TODO: Choose a sensible default.
    }
    var pos = context.getAttribLocation(prog, positionAttributeName);
    // TODO: Wrap this as well as higher level gl* matric ops in a
    // new object or expand this object.
    context.pos = pos;

    context.enableVertexAttribArray(pos);

    if (opts.init) {
      opts.init(context);
    }
    if (opts.draw) {
      if (opts.framerate && opts.framerate > 0) {
        setTimeout(function() { opts.draw(context); }, 1000.0/opts.framerate);
      } else {
        opts.draw(context);
      }
    }
    return context;
  };
})(jQuery);
