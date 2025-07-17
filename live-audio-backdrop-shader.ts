/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
const vs = `precision highp float;

// attribute vec3 position; // For WebGL1. GLSL3 uses 'in'
in vec3 position; // Standard for GLSL 300 es / WebGL2

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}`;

const fs = `precision highp float;

// out vec4 fragmentColor; // For GLSL 300 es / WebGL2
// For broader compatibility, especially if WebGL1 fallback is a concern, use gl_FragColor
// However, the example specifies GLSL3 in visual-3d.ts, so 'out' should be fine.
// Let's stick to the example's GLSL3 'out' syntax.
out vec4 out_FragColor;


uniform vec2 resolution;
uniform float rand;

void main() {
  float aspectRatio = resolution.x / resolution.y; 
  vec2 vUv = gl_FragCoord.xy / resolution;
  float noise = (fract(sin(dot(vUv, vec2(12.9898 + rand,78.233)*2.0)) * 43758.5453));

  vUv -= .5;
  vUv.x *= aspectRatio;

  float factor = 4.;
  float d = factor * length(vUv);
  vec3 from = vec3(3.) / 255.;
  // vec3 to = vec3(16., 12., 20.) / 2550.; // Original example had 2550, likely a typo, should be 255
  vec3 to = vec3(16., 12., 20.) / 255.; // Corrected

  // fragmentColor = vec4(mix(from, to, d) + .005 * noise, 1.); // Original variable name
  out_FragColor = vec4(mix(from, to, d) + .005 * noise, 1.);
}
`;

export {fs, vs};