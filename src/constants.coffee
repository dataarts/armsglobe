module.exports =
  # Colour Constants
  COLOUR_MAP:
    r: new THREE.Color 0xFF1E00
    o: new THREE.Color 0xFF7F00
    b: new THREE.Color 0x008EAF
    g: new THREE.Color 0x00CA35
    p: new THREE.Color 0xDC0068
  COLOUR_TYPES: [ 'r', 'o','b', 'g', 'p' ]

  PARTICLE_SPEED: 0.22
  NUM_TRAIL_PARTICLES: 12
  TRAIL_OPACITY_MULTIPLIER: 0.083 # this is just 1.0 / NUM_TRAIL_PARTICLES

  # Constants for the explosion effect (mostly just "magic numbers" that were
  # determined by trial and error)
  EXPLOSION_INITIAL_LERP_FACTOR: 0.06
  EXPLOSION_INCREMENTAL_LERP: 0.0035
  EXPLOSION_OPACITY_LERP: 0.2
  EXPLOSION_ROTATION_ANGLE: 0.06

  MESH_POOL_SIZE: 100

  # For generating random dates
  ONE_WEEK_IN_MILLIS: 604800000

  # Determines how long (in ms) we want one "loop" of the viz to run
  VIZ_LOOP_LENGTH: 300000 # default: 5min
  VIZ_POLLING_INTERVAL: 500
