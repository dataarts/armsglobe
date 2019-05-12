// Colour Constants
export const COLOUR_MAP = {
  r: new THREE.Color( 0xFF1E00 ),
  o: new THREE.Color( 0xFF7F00 ),
  b: new THREE.Color( 0x008EAF ),
  g: new THREE.Color( 0x00CA35 ),
  p: new THREE.Color( 0xDC0068 ),
};
export const COLOUR_TYPES = [ 'r', 'o', 'b', 'g', 'p' ];

export const PARTICLE_SPEED = 0.22;
export const NUM_TRAIL_PARTICLES = 12;
export const TRAIL_OPACITY_MULTIPLIER = 0.083; // this is just 1.0 / NUM_TRAIL_PARTICLES

// This number was reached by multiple trials in which a particle curve never
// exceeded 40 vertices; just add a bit of buffer
export const TRACE_LINE_VERTEX_COUNT = 50;

export const TRACE_LINE_OPACITY_LERP = 0.005; // 0.3/60

// Constants for the explosion effect (mostly just "magic numbers" that were
// determined by trial and error)
export const EXPLOSION_INITIAL_LERP_FACTOR = 0.06;
export const EXPLOSION_INCREMENTAL_LERP = 0.001;
export const EXPLOSION_OPACITY_LERP = 0.1;
export const EXPLOSION_ROTATION_ANGLE = 0.12;

export const MESH_POOL_SIZE = 100;

// For generating random dates
export const ONE_WEEK_IN_MILLIS = 604800000;

// Determines how long (in ms) we want one "loop" of the viz to run
export const VIZ_LOOP_LENGTH = 300000; // default: 5min
export const VIZ_POLLING_INTERVAL = 500;
