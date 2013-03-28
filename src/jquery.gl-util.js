// Copyright (c) 2011 Kevin Rabsatt
//
// The .util object we add to the WebGLRenderContext.

function GLUtil(gl) {
  this._gl = gl;
}

/**
 * Creates a model and a material for use with a fragment shader.
 * 
 * Usage:
 *   $('#canvas_id').gl().util.imageShader('fragment_shader_id');
 * 
 * @param {String}  fsId:  The id of the fragment shader to sue.
 */
GLUtil.prototype.imageShader = function(fsId) {
  var vsSrc =
    'attribute vec3 aPos;\n' +
    'attribute vec2 aTex;\n' +
    'varying highp vec2 vTex;\n' +
    'void main(void) {\n' +
    '  gl_Position = vec4(aPos, 1.0);\n' +
    '  vTex = aTex;\n' +
    '}\n';
    
  var gl = this._gl;
  gl.x.initDepth(1.0);
  var material = gl.x.createMaterial(vsSrc, fsId);
  var model = gl.x.createModel(material, gl.TRIANGLE_STRIP, 4);
  model.addAttribute(gl.c.vQuad, "aPos");
  model.addAttribute(gl.c.uvQuad, "aTex", 2);
  gl.x.draw(function(gl) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.x.models().draw();
  });
  return material;
};

/**
 * Incomplete Image Convolution helper.
 */
GLUtil.prototype.imageFilterConvolution = function(image, filter) {
  var fsSrc =
    'varying highp vec2 vTex;' +
    'uniform sampler2D uTex;' +
    'void main(void) {' +
    // TODO ADD filter loops here
    '  gl_FragColor += texture2D(uTex, vec2(vTex.s, vTex.t));' +
    '}';
  
  var gl = this._gl;
  var material = this.imageShader(fsSrc).texture(image, "uTex", function() {
    gl.x.draw();
  });
  gl.x.draw(function(gl) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.x.models().draw();
  });
  return material;
}