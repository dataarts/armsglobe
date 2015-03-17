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
