export function wrap( value, min, rangeSize ) {
  rangeSize -= min;
  while( value < min ) {
    value += rangeSize;
  }

  return value % rangeSize;
}

export function screenXY( vec3, camera ) {
  let projector = new THREE.Projector();
  let vector = projector.projectVector( vec3.clone(), camera );
  let result = {};

  let windowWidth = ( windowWidth < 1280 ) ? 1280 : window.innerWidth;

  result.x = Math.round( vector.x * (windowWidth/2) ) + windowWidth/2;
  result.y = Math.round( (0-vector.y) * (window.innerHeight/2) ) + window.innerHeight/2;

  return result;
}
