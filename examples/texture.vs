// Simple texturing vertex shader
attribute vec3 aPos;
attribute vec2 aTex;
uniform mat4 uM;
uniform mat4 uP;
varying highp vec2 vTex;
void main(void) {
  gl_Position = uP * uM * vec4(aPos, 1.0);
  vTex = aTex;
}
