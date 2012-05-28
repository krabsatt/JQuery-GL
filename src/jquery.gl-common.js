// Copyright (c) 2011 Kevin Rabsatt
//
// The .x object we add to the WebGLRenderContext.

/**
 * Creates a function that is called or adds a callback.
 *
 * @param {function} f  The initial function to call.
 * @param {WebGLRenderContext} defaultGL  The default param when calling.
 * @return Contructed method.
 */
function createAddOrCall(f, defaultGl) {
  return function(optFunc) {
    if (optFunc) {
      var oldF = this[f];
      this[f] = function(gl) {
        oldF.apply(this, [gl]);
        optFunc.apply(this, [gl]);
      };
    } else {
      this[f](defaultGl);
    }
    return this;
  };
}
