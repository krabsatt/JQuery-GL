// Copyright (c) 2013 Kevin Rabsatt
//
// The .const object we add to the WebGLRenderContext.
// Contains constant data objects used often.

var glConst = {};

glConst.vsPMN =
  'attribute vec3 aPos;\n' +
  'attribute vec3 aN;\n' +
  'uniform mat4 uM;\n' +
  'uniform mat4 uP;\n' +
  'uniform mat4 uN;\n' +
  'varying highp vec3 vN;\n' +
  'void main(void) {\n' +
  '  gl_Position = uP * uM * vec4(aPos, 1.0);\n' +
  '  vN = (uN * vec4(aN, 1.0)).xyz;\n' +
  '}\n';
  
/**
 * Default uniform names for P, N and M matrices.
 */
glConst.uPMN = {
    p: 'uP',
    m: 'uM',
    n: 'uN'
};

/**
 * Default uniform names for P, N M and C matrices.
 */
glConst.uPMNC = {
    p: 'uP',
    m: 'uM',
    n: 'uN',
    c: 'uC'
};

/**
 * Default vertex set for a 2-unit quad.
 */
glConst.vQuad = [ 1.0, 1.0, 0.0,
                 -1.0, 1.0, 0.0,
                  1.0,-1.0, 0.0,
                 -1.0,-1.0, 0.0];

/**
 * Default uv set for above 2-unit quad.
 */
glConst.uvQuad = [1.0, 1.0,
                  0.0, 1.0,
                  1.0, 0.0,
                  0.0, 0.0];