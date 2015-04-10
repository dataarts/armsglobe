let globeRadius = 1000;
let vec3_origin = new THREE.Vector3( 0, 0, 0 );

export function makeConnectionLineGeometry( exporter, importer ) {
  if( !exporter.countryName || !importer.countryName ) {
    return undefined;
  }

  let distanceBetweenCountryCenter = exporter.center.clone().sub(importer.center).length();

  // how high we want to shoot the curve upwards
  let anchorHeight = globeRadius + distanceBetweenCountryCenter * 0.7;

  // start/end of the line
  let start = exporter.center;
  let end = importer.center;

  // midpoint for the curve
  let mid = start.clone().lerp( end, 0.5 );
  let midLength = mid.length();
  mid.normalize();
  mid.multiplyScalar( midLength + distanceBetweenCountryCenter * 0.45 );

  // the normal from start to end
  let normal = (new THREE.Vector3()).subVectors( start, end );
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

  let distanceHalf = distanceBetweenCountryCenter * 0.5;

  let startAnchor = start;
  let midStartAnchor = mid.clone().add( normal.clone().multiplyScalar( distanceHalf ) );
  let midEndAnchor = mid.clone().add( normal.clone().multiplyScalar( -distanceHalf ) );
  let endAnchor = end;

  // now make a bezier curve out of the above like so in the diagram
  let splineCurveA = new THREE.CubicBezierCurve3( start, startAnchor, midStartAnchor, mid );
  let splineCurveB = new THREE.CubicBezierCurve3( mid, midEndAnchor, endAnchor, end );

  // how many vertices do we want on this guy? this is for *each* side
  let vertexCountDesired = Math.floor( distanceBetweenCountryCenter * 0.02 + 6 ) * 2;

  // collect the vertices
  let points = splineCurveA.getPoints( vertexCountDesired );

  // remove the very last point since it will be duplicated on the next half of the curve
  points = points.splice( 0, points.length - 1 );
  points = points.concat( splineCurveB.getPoints( vertexCountDesired ) );

  // add one final point to the center of the earth
  // we need this for drawing multiple arcs, but piled into one geometry buffer
  points.push( vec3_origin );

  // create a line geometry out of these
  let curveGeometry = new THREE.Geometry();
  points.forEach( (point) => {
    curveGeometry.vertices.push( point );
  });

  return curveGeometry;
}

export function constrain(v, min, max) {
  if( v < min ) {
    v = min;
  } else if( v > max ) {
    v = max;
  }

  return v;
}
