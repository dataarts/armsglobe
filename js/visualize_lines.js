var EPSILON = 0.5;
var MAX_LINE_WIDTH = 40.0;
var NUM_LINEWIDTH_BINS = 20;
var LINEWIDTH_BIN_SIZE = 1 / NUM_LINEWIDTH_BINS;

var globeRadius = 100;
var vec3_origin = new THREE.Vector3( 0, 0, 0 );

var spikeWidth = latLonTo3dSpace( 0, 0 ).distanceTo( latLonTo3dSpace( 0.1, 0 ) );
var spike = new THREE.CubeGeometry( spikeWidth, spikeWidth, 1, 1, 1, 1 );
var curveGeometry = new THREE.Geometry();

var uniforms = {
    scale: {
      type: 'f',
      value: 1
    },
    randomColor: {
      type: 'c',
      value: new THREE.Color( 0xffffff )
    },
    isCrazy: {
      type: 'f',
      value: 0
    }
};

var attributes = {
    opacity: {type: 'f', value: null}
};


function getConnectionLinePoints( exporter, importer ){
	if( exporter.countryName == undefined || importer.countryName == undefined )
		return undefined;

	var distanceBetweenCountryCenter = exporter.center.clone().sub( importer.center ).length();

	//	start of the line
	var start = exporter.center;

	//	end of the line
	var end = importer.center;
	
	//	midpoint for the curve
	var mid = start.clone().lerp( end, 0.5 );		
	var midLength = mid.length();
	mid.normalize();
	mid.multiplyScalar( midLength + distanceBetweenCountryCenter * 0.7 );			

	//	the normal from start to end
	var normal = ( new THREE.Vector3() ).subVectors( start, end );
	normal.normalize();

	/*				     
				The curve looks like this:
				
				midStartAnchor---- mid ----- midEndAnchor
			  /											  \
			 /											   \
			/												\
	start/anchor 										 end/anchor

		splineCurveA							splineCurveB
	*/

	var distanceHalf = distanceBetweenCountryCenter * 0.5;

	var startAnchor = start;
	var midStartAnchor = mid.clone().add( normal.clone().multiplyScalar( distanceHalf ) );					
	var midEndAnchor = mid.clone().add( normal.clone().multiplyScalar( -distanceHalf ) );
	var endAnchor = end;

	//	now make a bezier curve out of the above like so in the diagram
	var splineCurveA = new THREE.CubicBezierCurve3( start, startAnchor, midStartAnchor, mid );											

	var splineCurveB = new THREE.CubicBezierCurve3( mid, midEndAnchor, endAnchor, end );

	//	how many vertices do we want on this guy? this is for *each* side
	var vertexCountDesired = Math.floor( distanceBetweenCountryCenter * 0.02 + 6 ) * 2;	

	//	collect the vertices
	var points = splineCurveA.getPoints( vertexCountDesired );

	//	remove the very last point since it will be duplicated on the next half of the curve
	points = points.splice( 0, points.length-1 );

	points = points.concat( splineCurveB.getPoints( vertexCountDesired ) );

	//	add one final point to the center of the earth
	//	we need this for drawing multiple arcs, but piled into one geometry buffer
	points.push( vec3_origin );
	
  return points;
};

function createLineGeometry( arcsInfo ) {
  var vertexList = [];
  var opacityPerVertex = [];
  var fullOpacityPerVertex = [];
  var colorPerVertex = [];
  for ( var i = 0; i < arcsInfo.length; i++ ) {
    var arcInfo = arcsInfo[i];
    for ( var j = 0; j < arcInfo.points.length; j++ ) {
      vertexList.push( arcInfo.points[j] );
      opacityPerVertex.push( arcInfo.opacity );
      fullOpacityPerVertex.push( arcInfo.fullOpacity );
      colorPerVertex.push( arcInfo.color );
    }
  }
  var geometry = new THREE.BufferGeometry();
  geometry.dynamic = true;
  geometry.attributes = {
    position: {
      itemSize: 3,
      array: new Float32Array( vertexList.length * 3 )
    },
    color: {
      itemSize: 3,
      array: new Float32Array( vertexList.length * 3 )
    },
    opacity: {
      itemSize: 1,
      array: new Float32Array( vertexList.length )
    }
  }
  var positions = geometry.attributes.position.array;
  var colors = geometry.attributes.color.array;
  var opacities = geometry.attributes.opacity.array;
  for ( var i = 0; i < vertexList.length; i++ ) {
    var vertex = vertexList[i];
    positions[i * 3] = vertex.x;
    positions[i * 3 + 1] = vertex.y;
    positions[i * 3 + 2] = vertex.z;
    
    var color = colorPerVertex[i];
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
    
    var opacity = opacityPerVertex[i];
    opacities[i] = opacity;
  }
  geometry.fullOpacityPerVertex = fullOpacityPerVertex;
  return geometry;
};

/**
 * For linewidth, follow documentation for roundLineWidth function.
 */
function makeArcInfo( exporter, importer, linewidth, linVolume, logVolume, lineColor ) {
  var arcPoints = getConnectionLinePoints( exporter, importer );
  return {
    points: arcPoints,
    width: roundLinewidth( linewidth ),
    opacity: logVolume,
    fullOpacity: logVolume,
    color: lineColor
  };
};

/**
 * Input width between 0.0 and 1.0.
 * Output linewidth between EPSILON and MAX_LINE_WIDTH + EPSILON, separated into
 *     numLinewidthBins number of distinct bins.
 */
function roundLinewidth( width ) {
  return EPSILON + (Math.round( width / LINEWIDTH_BIN_SIZE ) * LINEWIDTH_BIN_SIZE) * MAX_LINE_WIDTH;
};

function makeArcMesh( geometry, linewidth ) {
  var arcMaterial = new THREE.ShaderMaterial( {
    uniforms: uniforms,
    attributes: attributes,
    vertexShader: Shaders.arcsVertexShader,
    fragmentShader: Shaders.arcsFragmentShader,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    transparent: true,
    linewidth: linewidth
  });
  return new THREE.Line( geometry, arcMaterial );
};

function makeSpikeMesh( lat, lon, size, color ) {
  var spikeMesh = new THREE.Mesh( spike.clone(), new THREE.MeshBasicMaterial() );
  for ( var i = 0; i < spikeMesh.geometry.faces.length; i++ ) {
    spikeMesh.geometry.faces[i].color = color;
  }
  spikeMesh.position = latLonTo3dSpace( lat, lon );
  spikeMesh.lookAt( rotating.position );
  spikeMesh.scale.z = size;
  spikeMesh.updateMatrix();
  return spikeMesh;
};

function constrain( v, min, max ){
	if ( v < min ) {
		v = min;
	} else if ( v > max ) {
		v = max;
	}
	return v;
};