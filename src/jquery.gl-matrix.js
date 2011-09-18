// Copyright (c) 2011 Kevin Rabsatt
//
// Defines the .m object we attach to the WebGLRenderContext.

/**
 * Emulates the gl matrix stack with additional helpers.
 * Requires Sylvester
 */
function MatrixManager() {  // No touchie gl
  this._stack = [];
  this.m = Matrix.I(4);
  this.p = Matrix.I(4);
  this.c = Matrix.I(4);
}

/**
 * Creates a look-at transformation matrix and sets this.c.
 *
 * To use this, ensure that you are setting a uniform to DefaultMatrix.C
 * TODO: Create an abstract camera object.
 *
 * @return {Matrix}  The created matrix.
 */
MatrixManager.prototype.lookAt = function(eye, focus, up) {
  var eye = $V(eye);
  var up = $V(up).toUnitVector();
  var f = $V($V(focus).subtract(eye)).toUnitVector();
  var s = f.cross(up);
  var u = s.cross(f);
  var m=$M(
      [[s.elements[0], s.elements[1], s.elements[2],0],
       [u.elements[0],u.elements[1],u.elements[2],0],
       [-f.elements[0],-f.elements[1],-f.elements[2],0],
       [0, 0, 0, 1]]);
  var t = createTranslation(eye.x(-1));
  this.c = m.x(t);
}

/**
 * Creates a perspective projection matrix and sets this.p.
 *
 * To use this, ensure that you are setting a uniform to DefaultMatrix.P
 *
 * @param {Number} near  The near z-plane distance.
 * @param {Number} far  The far z-plane distance.
 * @param {Number} width  The width of your render context.
 * @param {Number} height  The height of your render context.
 * @param {Number} fov  The FOV angle in degrees.
 * @return {Matrix}  The created matrix.
 */
MatrixManager.prototype.perspective = function(
    near, far, width, height, fov) {
  var aspect = width * 1.0 / height;
  // Adjust width, height from image space to projection space.
  height = 2.0 * near * Math.tan(fov * Math.PI / 360.0);
  width = aspect * height;
  var a = 2.0 * near / width;
  var b = 2.0 * near / height;
  var c = -(far + near) / (far - near);
  var d = -2.0 * (far * near) / (far - near);
  this.p = $M(
      [[a, 0, 0, 0],
       [0, b, 0, 0],
       [0, 0, c, d],
       [0, 0, -1, 0]]);
  return this.p;
};

MatrixManager.prototype.push = function() {
  this._stack.push(this.m.dup());
}

MatrixManager.prototype.pop = function() {
  this.m = this._stack.pop()
}

/**
 * Multiplies the matrix with current state matrix in transformation order.
 *
 * @return {Matrix}  The result of m * this.m.
 */
MatrixManager.prototype.apply = function(m) {
  this.m = m.x(this.m);
  return this.m;
}

/**
 * Creates an identity matrix.
 *
 * @return {Matrix}  The created matrix.
 */
MatrixManager.prototype.identity = function() {
  this.m = Matrix.I(4);
  return this.m;
}

/**
 * Creates an identity matrix.
 *
 * @return {Matrix}  The created matrix.
 */
MatrixManager.prototype.i = function() {
  return this.identity();
}

var createTranslation = function(v) {
  var t = Matrix.I(4);
  // If a Vector is passed
  if (v.elements) {
    v = v.elements;
  }
  for (var i = 0; i < v.length; ++i) {
    t.elements[i][3] = v[i];
  }
  return t;
}

/**
 * Creates and applies a translation matrix.
 *
 * @param {Array(3)} v  The translation vector.
 * @return {Matrix}  The created matrix.
 */
MatrixManager.prototype.translate = function(v) {
  var t = createTranslation(v);
  this.apply(t);
  return t;
}

/**
 * Creates and applies a rotation matrix.
 *
 * This is a "right hand rule" rotation.
 *
 * @param {Number} theta  The angle to rotate in degrees.
 * @param {Array(3)} v  The axis vector to rotate around.
 * @return {Matrix}  The created matrix.
 */
MatrixManager.prototype.rotate = function(theta, v) {
  theta = theta * Math.PI / 180.0;
  v = $V(v).toUnitVector();
  var x = v.elements[0];
  var y = v.elements[1];
  var z = v.elements[2];
  var c = Math.cos(theta);
  var s = Math.sin(theta);
  var t = 1 - c;
  var r = $M([
      [t*x*x+c,   t*x*y-s*z, t*x*z+s*y, 0],
      [t*x*y+s*z, t*y*y+c,   t*y*z-s*x, 0],
      [t*x*z-s*y, t*y*z+s*x, t*z*z+c,   0],
      [0,         0,         0,         1]]);

  this.apply(r);
  return r;
}


