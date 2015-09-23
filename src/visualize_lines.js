const vec3_origin = new THREE.Vector3( 0, 0, 0 ); // eslint-disable-line camelcase

export function makeConnectionLineGeometry( exporter, importer ) {
  if (!exporter.countryName || !importer.countryName) {
    return undefined;
  }

  const distanceBetweenCountryCenter = exporter.center.clone().sub(importer.center).length();

  // start/end of the line
  const start = exporter.center;
  const end = importer.center;

  // midpoint for the curve
  const mid = start.clone().lerp( end, 0.5 );
  const midLength = mid.length();
  mid.normalize();
  mid.multiplyScalar( midLength + distanceBetweenCountryCenter * 0.45 );

  // the normal from start to end
  const normal = (new THREE.Vector3()).subVectors( start, end );
  normal.normalize();

  // The curve looks like this:
  //
  //       midStartAnchor---- mid ----- midEndAnchor
  //       /                                  \
  //      /                                    \
  //     /                                      \
  // start/anchor                             end/anchor
  //
  // splineCurveA                               splineCurveB

  const distanceHalf = distanceBetweenCountryCenter * 0.5;

  const startAnchor = start;
  const midStartAnchor = mid.clone().add( normal.clone().multiplyScalar( distanceHalf ) );
  const midEndAnchor = mid.clone().add( normal.clone().multiplyScalar( -distanceHalf ) );
  const endAnchor = end;

  // now make a bezier curve out of the above like so in the diagram
  const splineCurveA = new THREE.CubicBezierCurve3( start, startAnchor, midStartAnchor, mid );
  const splineCurveB = new THREE.CubicBezierCurve3( mid, midEndAnchor, endAnchor, end );

  // how many vertices do we want on this guy? this is for *each* side
  const vertexCountDesired = Math.floor( distanceBetweenCountryCenter * 0.02 + 6 ) * 2;

  // collect the vertices
  let points = splineCurveA.getPoints( vertexCountDesired );

  // remove the very last point since it will be duplicated on the next half of the curve
  points = points.splice( 0, points.length - 1 );
  points = points.concat( splineCurveB.getPoints( vertexCountDesired ) );

  // add one final point to the center of the earth
  // we need this for drawing multiple arcs, but piled into one geometry buffer
  points.push( vec3_origin );

  // create a line geometry out of these
  const curveGeometry = new THREE.Geometry();
  points.forEach( (point) => {
    curveGeometry.vertices.push( point );
  });

  return curveGeometry;
}

export function constrain(v, min, max) {
  let modV = v;
  if (v < min) {
    modV = min;
  } else if (v > max) {
    modV = max;
  }

  return modV;
}
