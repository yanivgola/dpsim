/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
const vs = `#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
  varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

uniform float time;

uniform vec4 inputData;  // x: freq[0], y: freq[1], z: freq[2]
uniform vec4 outputData; // x: freq[0], y: freq[1], z: freq[2]

// #define PI 3.14159265 // Already defined in <common>

vec3 calc( vec3 pos ) {

  vec3 dir = normalize( pos );
  vec3 p = dir + vec3( time, 0., 0. );
  // Use inputData and outputData components more directly if they map to specific frequencies
  // Example: inputData.x could be bass, .y mid, .z treble intensity
  return pos +
    1. * inputData.x * inputData.y * dir * (.5 + .5 * sin(inputData.z * pos.x + time)) +
    1. * outputData.x * outputData.y * dir * (.5 + .5 * sin(outputData.z * pos.y + time));
}

vec3 spherical( float r, float theta, float phi ) {
  return r * vec3(
    cos( theta ) * cos( phi ),
    sin( theta ) * cos( phi ),
    sin( phi )
  );
}

void main() {
  #include <uv_vertex>
  #include <color_vertex>
  #include <morphinstance_vertex>
  #include <morphcolor_vertex>
  #include <batching_vertex>
  #include <beginnormal_vertex>
  #include <morphnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <defaultnormal_vertex>
  #include <normal_vertex>
  #include <begin_vertex>

  float inc = 0.001;

  float r = length( position );
  // Correct UV to spherical coordinates mapping if original model is a UV sphere
  // Assuming standard UV sphere where u maps to theta (0 to 2*PI) and v to phi (-PI/2 to PI/2 or 0 to PI)
  // uv.x is [0,1], uv.y is [0,1]
  float theta = uv.x * 2. * PI; // Longitude
  float phi = (uv.y - 0.5) * PI; // Latitude, from -PI/2 to PI/2

  vec3 np = calc( spherical( r, theta, phi )  );

  vec3 tangent = normalize( calc( spherical( r, theta + inc, phi ) ) - np );
  vec3 bitangent = normalize( calc( spherical( r, theta, phi + inc ) ) - np );
  
  // Ensure the cross product order gives an outward normal if that's intended
  // The example used -normalMatrix, let's retain that specific detail from the example's sphere shader if it was intentional
  // However, typically for outward normals it's positive. If lighting looks inverted, this is the place to check.
  // The previous version of this file had: transformedNormal = normalMatrix * normalize( cross( tangent, bitangent ) );
  // The example's sphere-shader.ts (the one provided just now) has:
  // transformedNormal = -normalMatrix * normalize( cross( tangent, bitangent ) );
  // Let's stick to the example's version for now.
  objectNormal = normalize( cross( tangent, bitangent ) ); // Calculate object normal
  transformedNormal = normalMatrix * objectNormal; // Transform to view space

  // vNormal is used by the fragment shader, ensure it's correctly transformed
  vNormal = normalize( transformedNormal ); 

  transformed = np;

  #include <morphtarget_vertex>
  #include <skinning_vertex>
  #include <displacementmap_vertex>
  #include <project_vertex>
  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
  vViewPosition = - mvPosition.xyz;
  #include <worldpos_vertex>
  #include <shadowmap_vertex>
  #include <fog_vertex>
  #ifdef USE_TRANSMISSION
    vWorldPosition = worldPosition.xyz;
  #endif
}`;

export {vs};