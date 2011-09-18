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
  //{{INJECTION_POINT}}//

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
