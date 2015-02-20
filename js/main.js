var masterContainer = document.getElementById('visualization');
var overlay = document.getElementById('visualization');
var glContainer = document.getElementById( 'glContainer' );

/*
Colour Constants
*/
COLOUR_MAP = {
	r: new THREE.Color( 0xFF1E00 ),
	o: new THREE.Color( 0xFF7F00 ),
	b: new THREE.Color( 0x008EAF ),
	g: new THREE.Color( 0x00CA35 ),
	p: new THREE.Color( 0xDC0068 )
};

//	contains a list of country codes with their matching country names
var isoFile = 'country_iso3166.json';
var latlonFile = 'country_lat_lon.json';

var camera, scene, renderer, controls,
		mapIndexedImage, mapOutlineImage,
		pinsBase, pinsBaseMat,
		lookupCanvas, lookupTexture, backTexture, worldCanvas,
		sphere, rotating, visualizationMesh;

//	contains our sample data, loaded from categories/All.json
var sampleData;

//	contains latlon data for each country
var latlonData;

//	contains above but organized as a mapped list via ['countryname'] = countryobject
//	each country object has data like center of country in 3d space, lat lon, country name, and country code
var countryData = {};

//	contains a list of country code to country name for running lookups
var countryLookup;

//	TODO
//	use underscore and ".after" to load these in order
//	don't look at me I'm ugly
$(function() {
	//	detect for webgl and reject everything else
	if ( ! Detector.webgl ) {
		Detector.addGetWebGLMessage();
	}
	else{
		//	ensure the map images are loaded first!!
		mapIndexedImage = new Image();
		mapIndexedImage.src = 'images/map_indexed.png';
		mapIndexedImage.onload = function() {
			mapOutlineImage = new Image();
			mapOutlineImage.src = 'images/map_outline.png';
			mapOutlineImage.onload = function(){
				loadCountryCodes(
					function(){
						loadWorldPins(
							function(){
								loadContentData(
									function(){
										initScene();
										initMeshPool( 100 ); // defined in visualize.js
										animate();
										startDataPump();
									}
								);
							}
						);
					}
				);
			};
		};
	}
});

var currIndexIntoData = 0;
var nextIndexIntoData = 5;
function startDataPump() {
	window.setInterval( function() {
		var endIndex = currIndexIntoData + 5;
		if( endIndex > sampleData.length ) {
			endIndex = sampleData.length;
		}
		selectVisualization( sampleData.slice( currIndexIntoData, endIndex ) );
		currIndexIntoData = (currIndexIntoData + 5) % sampleData.length;
	}, 500 );
}

//	-----------------------------------------------------------------------------
//	All the initialization stuff for THREE
function initScene() {

	//	-----------------------------------------------------------------------------
  //	Let's make a scene
	scene = new THREE.Scene();
	scene.matrixAutoUpdate = false;

	var light1 = new THREE.SpotLight( 0xeeeeee, 3 );
	light1.position.x = 730;
	light1.position.y = 520;
	light1.position.z = 626;
	light1.castShadow = true;
	scene.add( light1 );
  
  var light3 = new THREE.SpotLight( 0xeeeeee, 1.5 );
	light3.position.x = -730;
	light3.position.y = 520;
	light3.position.z = 626;
	light3.castShadow = true;
	scene.add( light3 );

	var light2 = new THREE.PointLight( 0x222222, 14.8 );
	light2.position.x = 0;
	light2.position.y = -750;
	light2.position.z = 0;
	scene.add( light2 );

	rotating = new THREE.Object3D();
	scene.add(rotating);

	lookupCanvas = document.createElement('canvas');
	lookupCanvas.width = 256;
	lookupCanvas.height = 1;

	lookupTexture = new THREE.Texture( lookupCanvas );
	lookupTexture.magFilter = THREE.NearestFilter;
	lookupTexture.minFilter = THREE.NearestFilter;
	lookupTexture.needsUpdate = true;

	var indexedMapTexture = new THREE.Texture( mapIndexedImage );
	//THREE.ImageUtils.loadTexture( 'images/map_indexed.png' );
	indexedMapTexture.needsUpdate = true;
	indexedMapTexture.magFilter = THREE.NearestFilter;
	indexedMapTexture.minFilter = THREE.NearestFilter;

	var outlinedMapTexture = new THREE.Texture( mapOutlineImage );
	outlinedMapTexture.needsUpdate = true;
	// outlinedMapTexture.magFilter = THREE.NearestFilter;
	// outlinedMapTexture.minFilter = THREE.NearestFilter;

	var uniforms = {
		'mapIndex': { type: 't', value: indexedMapTexture  },
		'lookup': { type: 't', value: lookupTexture },
		'outline': { type: 't', value: outlinedMapTexture },
		'outlineLevel': {type: 'f', value: 1 },
	};

	var shaderMaterial = new THREE.MeshLambertMaterial( { map: outlinedMapTexture } );/*new THREE.ShaderMaterial( {
		uniforms: 		uniforms,
		vertexShader:   document.getElementById( 'globeVertexShader' ).textContent,
		fragmentShader: document.getElementById( 'globeFragmentShader' ).textContent
	});*/

  //	-----------------------------------------------------------------------------
  //	Create the backing (sphere)
	sphere = new THREE.Mesh( new THREE.SphereGeometry( 100, 40, 40 ), shaderMaterial );
	sphere.doubleSided = false;
	sphere.rotation.x = Math.PI;
	sphere.rotation.y = -Math.PI/2;
	sphere.rotation.z = Math.PI;
	sphere.id = "base";
	rotating.add( sphere );

	loadGeoData( latlonData );
	buildDataVizGeometries(sampleData);

	visualizationMesh = new THREE.Object3D();
	rotating.add(visualizationMesh);

  //	-----------------------------------------------------------------------------
  //	Setup our renderer
	renderer = new THREE.WebGLRenderer({antialias:false, alpha: true});
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.autoClear = false;

	renderer.sortObjects = false;
	renderer.generateMipmaps = false;

	glContainer.appendChild( renderer.domElement );


  //	-----------------------------------------------------------------------------
  //	Event listeners
	document.addEventListener( 'mousemove', onDocumentMouseMove, true );
	document.addEventListener( 'windowResize', onDocumentResize, false );

	document.addEventListener( 'mousedown', onDocumentMouseDown, true );
	document.addEventListener( 'mouseup', onDocumentMouseUp, false );

	masterContainer.addEventListener( 'click', onClick, true );
	masterContainer.addEventListener( 'mousewheel', onMouseWheel, false );

	//	firefox
	masterContainer.addEventListener( 'DOMMouseScroll', function(e){
		    var evt=window.event || e; //equalize event object
    		onMouseWheel(evt);
	}, false );

	document.addEventListener( 'keydown', onKeyDown, false);

  //	-----------------------------------------------------------------------------
  //	Setup our camera
  camera = new THREE.PerspectiveCamera( 12, window.innerWidth / window.innerHeight, 1, 20000 );
	camera.position.z = 1400;
	camera.position.y = 0;
	scene.add( camera );

	var windowResize = THREEx.WindowResize(renderer, camera);

	// Get the globe spinning (defined in mousekeyboard.js)
	startAutoRotate();
}


function animate() {

	if( rotateTargetX !== undefined && rotateTargetY !== undefined ){

		rotateVX += (rotateTargetX - rotateX) * 0.012;
		rotateVY += (rotateTargetY - rotateY) * 0.012;

		if( Math.abs(rotateTargetX - rotateX) < 0.1 && Math.abs(rotateTargetY - rotateY) < 0.1 ){
			rotateTargetX = undefined;
			rotateTargetY = undefined;
		}
	}

	rotateX += rotateVX;
	rotateY += rotateVY;

	rotateVX *= 0.98;
	rotateVY *= 0.98;

	if(dragging || rotateTargetX !== undefined ){
		rotateVX *= 0.6;
		rotateVY *= 0.6;
	}

	rotateY += controllers.spin * 0.01;

	//	constrain the pivot up/down to the poles
	//	force a bit of bounce back action when hitting the poles
	if(rotateX < -rotateXMax){
		rotateX = -rotateXMax;
		rotateVX *= -0.95;
	}
	if(rotateX > rotateXMax){
		rotateX = rotateXMax;
		rotateVX *= -0.95;
	}

	TWEEN.update();

	rotating.rotation.x = rotateX;
	rotating.rotation.y = rotateY;

  requestAnimationFrame( animate );
	// renderer.clear();
	renderer.render( scene, camera );

	rotating.traverse(
		function(mesh) {
			if( mesh && mesh.update !== undefined) {
				mesh.update();
			}
		}
	);

  /* Removing markers until I decide what to do with them */
	// for( var i in markers ){
	// 	var marker = markers[i];
	// 	marker.update();
	// }
}
