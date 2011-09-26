// Copyright (c) 2011 Kevin Rabsatt
//
// The .util object we add to the WebGLRenderContext.

function GLUtil(gl) {
  this._gl = gl;
}

/**
 * varying highp vec2 vTex;
 */
GLUtil.prototype.imageShader = function(fsId) {
  // TODO(krabsatt): Load src from string directly.
  var vsSrc =
    '<script id="__vs" type="x-shader/x-vertex">\n' +
    'attribute vec3 aPos;\n' +
    'attribute vec2 aTex;\n' +
    'varying highp vec2 vTex;\n' +
    'void main(void) {\n' +
    '  gl_Position = vec4(aPos, 1.0);\n' +
    '  vTex = aTex;\n' +
    '}\n</script>';
  $('body').append(vsSrc);
  var verts = [1.0,-1.0, 0.0,
              -1.0,-1.0, 0.0,
               1.0, 1.0, 0.0,
              -1.0, 1.0, 0.0];
  var uv = [1.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            0.0, 0.0];
  var gl = this._gl;
  gl.x.initDepth(1.0);
  var material = gl.x.createMaterial("__vs", fsId);
  var model = gl.x.createModel(material, gl.TRIANGLE_STRIP, 4);
  model.addAttribute(verts, "aPos");
  model.addAttribute(uv, "aTex", 2);
  gl.x.draw(function(gl) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.x.models().draw();
  });
  return material;
};
