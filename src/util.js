export function wrap( value, min, rangeSize ) {
  const minRangeSize = rangeSize - min;
  let modValue = value;

  while (modValue < min) {
    modValue += minRangeSize;
  }

  return modValue % minRangeSize;
}

export function screenXY( vec3, camera ) {
  const projector = new THREE.Projector();
  const vector = projector.projectVector( vec3.clone(), camera );
  const result = {};

  const windowWidth = ( windowWidth < 1280 ) ? 1280 : window.innerWidth;

  result.x = Math.round( vector.x * (windowWidth / 2) ) + windowWidth / 2;
  result.y = Math.round( (0 - vector.y) * (window.innerHeight / 2) ) + window.innerHeight / 2;

  return result;
}
