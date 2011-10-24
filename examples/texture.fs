// Simple texturing fragment shader
varying highp vec2 vTex;
uniform sampler2D uTex;
void main(void) {
  gl_FragColor = texture2D(uTex, vec2(vTex.s, vTex.t));
}
