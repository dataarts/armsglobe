/**
 * Usage:
 * Include Three.js r59 and Tween.js r9.
 * (Optional: have an HTML DOM element with id 'selectedCountryName' if want to
 * display selected country's name to user)
 * 
 * var container = HTML DOM element to contain the globe;
 * var globe = new com.google.Globe(container);
 * 
 * var data = arcs or spikes, see function {@link loadContentData} for expected format.
 *
 * // Load new data and redraw globe.
 * globe.loadContentData(data);
 *
 * // Select arcs/spikes from all countries on globe.
 * globe.selectAllCountries();
 * 
 * // Change display scale.
 * var scale = <globe.scaleEnum> desired scale to display;
 * var power = <int> desired exponent to apply to each normalized volume/height;
 * globe.changeDisplayScale(scale, power);
 * 
 * // Fade into selected time's mesh.
 * var time = <int> specified when we loaded the data (t value in each set);
 * var switchVisualizedMeshes = <boolean> whether we want to actually display a new mesh after switching time;
 * var animationDuration = <optional int> how long fading into selected time's mesh should take;
 * globe.selectTime(time, switchVisualizedMeshes, animationDuration);
 * 
 * // Change the globe map texture.
 * var fileName = <string>, where the containing directory is IMAGE_DIR;
 * globe.setGlobeImage(fileName);
 * 
 * // Start crazy mode: random colors, pulsating arcs, and rapid spinning.
 * globe.startCrazyMode();
 * 
 * // Stop crazy mode.
 * globe.stopCrazyMode();
 */

var com = com || {};
com.google = com.google || {};

var IMAGE_DIR = 'images/';

var mapIndexedImage;
var mapOutlineImage;

var outlinedMapTexture;

//	where in html to hold all our things
var glContainer;

//	contains a list of country codes with their matching country names
var isoFile = 'country_iso3166.json';
var latlonFile = 'country_lat_lon.json';

var camera, scene, renderer;

var lookupCanvas;
var lookupTexture;
var sphere;
var rotating;	
var visualizationMesh;							

var mapUniforms;

//	contains the loaded data
var timeBins;

//	contains latlon data for each country
var latlonData;			    

//	contains above but organized as a mapped list via ['countryname'] = countryobject
//	each country object has data like center of country in 3d space, lat lon, country name, and country code
var countryData = new Object();		

//	contains a list of country code to country name for running lookups
var countryLookup;		    

//  map from time to arc/spike data
var selectableTimes = {};
var selectableCountries = [];			    

var allCountries = [];

var Selection = function(){
  this.selectedTime = 0;
  this.selectedCountry = 'UNITED STATES';
};

//	the currently selected country
var selectedCountry = null;
var previouslySelectedCountry = null;

//	contains info about what year, what countries, categories, etc that's being visualized
var selectionData = new Selection();

//  contains meshes currently being shown
var currMeshes;

var time = 0;
var increment = 0;

//	TODO
//	use underscore and ".after" to load these in order
//	don't look at me I'm ugly
com.google.Globe = function( container ) {	
	//	detect for webgl and reject everything else
	if ( ! Detector.webgl ) {
		Detector.addGetWebGLMessage();
	}
	else{
	  glContainer = container;
	  this.loadContentData = loadContentData;
	  this.selectAllCountries = selectAllCountries;
	  this.changeDisplayScale = changeDisplayScale;
	  this.selectTime = selectTime;
	  this.setGlobeImage = setGlobeImage;
	  this.startCrazyMode = startCrazyMode;
	  this.stopCrazyMode = stopCrazyMode;
		//	ensure the map images are loaded first!!
		mapIndexedImage = new Image();
		mapIndexedImage.src = IMAGE_DIR + 'map_indexed_corrected_offset.png';
		mapIndexedImage.onload = function() {
			mapOutlineImage = new Image();
			mapOutlineImage.src = IMAGE_DIR + 'map_outline_corrected_offset.png';
			mapOutlineImage.onload = function() {
				loadCountryCodes(
					function() {
						loadWorldPins(
							function() {															
								initScene();
								animate();											
							}
						);
					}
				);
			};			
		};		
	};
};


//	-----------------------------------------------------------------------------
//	All the initialization stuff for THREE
function initScene() {

	//	-----------------------------------------------------------------------------
    //	Let's make a scene		
	scene = new THREE.Scene();
	scene.matrixAutoUpdate = false;	

	rotating = new THREE.Object3D();
	scene.add( rotating );

	lookupCanvas = document.createElement('canvas');	
	lookupCanvas.width = 256;
	lookupCanvas.height = 1;
	
	lookupTexture = new THREE.Texture( lookupCanvas );
	lookupTexture.magFilter = THREE.NearestFilter;
	lookupTexture.minFilter = THREE.NearestFilter;
	lookupTexture.needsUpdate = true;

	var indexedMapTexture = new THREE.Texture( mapIndexedImage );
	indexedMapTexture.needsUpdate = true;
	indexedMapTexture.magFilter = THREE.NearestFilter;
	indexedMapTexture.minFilter = THREE.NearestFilter;

	outlinedMapTexture = new THREE.Texture( mapOutlineImage );
	outlinedMapTexture.needsUpdate = true;

	var uniforms = {
		'mapIndex': { type: 't', value: indexedMapTexture  },		
		'lookup': { type: 't', value: lookupTexture },
		'outline': { type: 't', value: outlinedMapTexture },
		'outlineLevel': {type: 'f', value: 1 }
	};
	mapUniforms = uniforms;

	var shaderMaterial = new THREE.ShaderMaterial( {

		uniforms: 		uniforms,
		vertexShader:   Shaders.globeVertexShader,
		fragmentShader: Shaders.globeFragmentShader
	});
	shaderMaterial.side = THREE.FrontSide;
					
	sphere = new THREE.Mesh( new THREE.SphereGeometry( globeRadius, 40, 40 ), shaderMaterial );
	sphere.rotation.x = Math.PI;				
	sphere.rotation.y = -Math.PI/2;
	sphere.rotation.z = Math.PI;
	sphere.id = "base";
	rotating.add( sphere );	
	
	// load geo data (country lat lons in this case)
	console.time('loadGeoData');
	loadGeoData( latlonData );				
	console.timeEnd('loadGeoData');		

	visualizationMesh = new THREE.Object3D();
	rotating.add( visualizationMesh );	

	buildGUI();
  
	for ( var countryCode in countryLookup ) {
	  if ( countryLookup.hasOwnProperty( countryCode ) ) {
	    allCountries.push(countryLookup[countryCode]);
	  }
	}

    //	-----------------------------------------------------------------------------
    //	Setup our renderer
	renderer = new THREE.WebGLRenderer( {antialias:true} );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.autoClear = false;

	glContainer.appendChild( renderer.domElement );									

    //	-----------------------------------------------------------------------------
    //	Event listeners
	document.addEventListener( 'windowResize', onDocumentResize, false );
	
	glContainer.addEventListener( 'mousedown', onDocumentMouseDown, true );	
	glContainer.addEventListener( 'mouseup', onDocumentMouseUp, false );	
	glContainer.addEventListener( 'mousemove', onDocumentMouseMove, true );
	
	glContainer.addEventListener( 'click', onClick, true );	
	glContainer.addEventListener( 'mousewheel', onMouseWheel, false );
	
	//	firefox	
	document.addEventListener( 'DOMMouseScroll', function(e){
		    var evt=window.event || e; //equalize event object
    		onMouseWheel(evt);
	}, false );

	document.addEventListener( 'keydown', onKeyDown, false );

    //	-----------------------------------------------------------------------------
    //	Setup our camera
  camera = new THREE.PerspectiveCamera( 12, window.innerWidth / window.innerHeight, 1, 20000 ); 		        
	camera.position.z = 1400;
	camera.position.y = 0;
	camera.lookAt( vec3_origin );
	scene.add( camera );	  

	var windowResize = THREEx.WindowResize( renderer, camera );		
};
	

function animate() {  
	if ( rotateTargetX !== undefined && rotateTargetY !== undefined ) {

		rotateVX += (rotateTargetX - rotateX) * 0.012;
		rotateVY += (rotateTargetY - rotateY) * 0.012;

		if ( Math.abs(rotateTargetX - rotateX) < 0.1 && Math.abs(rotateTargetY - rotateY) < 0.1 ) {
			rotateTargetX = undefined;
			rotateTargetY = undefined;
		}
	}
	
	rotateX += rotateVX;
	rotateY += rotateVY;

	rotateVX *= 0.98;
	rotateVY *= 0.98;

	if (dragging || rotateTargetX !== undefined ) {
		rotateVX *= 0.6;
		rotateVY *= 0.6;
	}	     

	rotateY += controllers.spin * 0.01;

	//	constrain the pivot up/down to the poles
	//	force a bit of bounce back action when hitting the poles
	if (rotateX < -rotateXMax) {
		rotateX = -rotateXMax;
		rotateVX *= -0.95;
	}
	if (rotateX > rotateXMax) {
		rotateX = rotateXMax;
		rotateVX *= -0.95;
	}		   
	
	time += increment;
	uniforms.scale.value = 1 + (Math.sin(time) * 0.25);
	uniforms.randomColor.value = colorFn( Math.random() );

	TWEEN.update();		

	rotating.rotation.x = rotateX;
	rotating.rotation.y = rotateY;	

  render();	
  		        		       
  requestAnimationFrame( animate );	
};

function render() {	
	renderer.clear();		    					
  renderer.render( scene, camera );				
};		   

function findCode( countryName ){
	countryName = countryName.toUpperCase();
	for( var i in countryLookup ){
		if( countryLookup[i] === countryName )
			return i;
	}
	return 'not found';
};

//	ordered lookup list for country color index
//	used for GLSL to find which country needs to be highlighted
var countryColorMap = {'PE':1,
'BF':2,'FR':3,'LY':4,'BY':5,'PK':6,'ID':7,'YE':8,'MG':9,'BO':10,'CI':11,'DZ':12,'CH':13,'CM':14,'MK':15,'BW':16,'UA':17,
'KE':18,'TW':19,'JO':20,'MX':21,'AE':22,'BZ':23,'BR':24,'SL':25,'ML':26,'CD':27,'IT':28,'SO':29,'AF':30,'BD':31,'DO':32,'GW':33,
'GH':34,'AT':35,'SE':36,'TR':37,'UG':38,'MZ':39,'JP':40,'NZ':41,'CU':42,'VE':43,'PT':44,'CO':45,'MR':46,'AO':47,'DE':48,'SD':49,
'TH':50,'AU':51,'PG':52,'IQ':53,'HR':54,'GL':55,'NE':56,'DK':57,'LV':58,'RO':59,'ZM':60,'IR':61,'MM':62,'ET':63,'GT':64,'SR':65,
'EH':66,'CZ':67,'TD':68,'AL':69,'FI':70,'SY':71,'KG':72,'SB':73,'OM':74,'PA':75,'AR':76,'GB':77,'CR':78,'PY':79,'GN':80,'IE':81,
'NG':82,'TN':83,'PL':84,'NA':85,'ZA':86,'EG':87,'TZ':88,'GE':89,'SA':90,'VN':91,'RU':92,'HT':93,'BA':94,'IN':95,'CN':96,'CA':97,
'SV':98,'GY':99,'BE':100,'GQ':101,'LS':102,'BG':103,'BI':104,'DJ':105,'AZ':106,'MY':107,'PH':108,'UY':109,'CG':110,'RS':111,'ME':112,'EE':113,
'RW':114,'AM':115,'SN':116,'TG':117,'ES':118,'GA':119,'HU':120,'MW':121,'TJ':122,'KH':123,'KR':124,'HN':125,'IS':126,'NI':127,'CL':128,'MA':129,
'LR':130,'NL':131,'CF':132,'SK':133,'LT':134,'ZW':135,'LK':136,'IL':137,'LA':138,'KP':139,'GR':140,'TM':141,'EC':142,'BJ':143,'SI':144,'NO':145,
'MD':146,'LB':147,'NP':148,'ER':149,'US':150,'KZ':151,'AQ':152,'SZ':153,'UZ':154,'MN':155,'BT':156,'NC':157,'FJ':158,'KW':159,'TL':160,'BS':161,
'VU':162,'FK':163,'GM':164,'QA':165,'JM':166,'CY':167,'PR':168,'PS':169,'BN':170,'TT':171,'CV':172,'PF':173,'WS':174,'LU':175,'KM':176,'MU':177,
'FO':178,'ST':179,'AN':180,'DM':181,'TO':182,'KI':183,'FM':184,'BH':185,'AD':186,'MP':187,'PW':188,'SC':189,'AG':190,'BB':191,'TC':192,'VC':193,
'LC':194,'YT':195,'VI':196,'GD':197,'MT':198,'MV':199,'KY':200,'KN':201,'MS':202,'BL':203,'NU':204,'PM':205,'CK':206,'WF':207,'AS':208,'MH':209,
'AW':210,'LI':211,'VG':212,'SH':213,'JE':214,'AI':215,'MF_1_':216,'GG':217,'SM':218,'BM':219,'TV':220,'NR':221,'GI':222,'PN':223,'MC':224,'VA':225,
'IM':226,'GU':227,'SG':228};

function highlightCountry( countries ){	
	var countryCodes = [];
	for( var i in countries ){
		var code = findCode( countries[i] );
		countryCodes.push( code );
	}

	var ctx = lookupCanvas.getContext('2d');	
	ctx.clearRect(0,0,256,1);

	//	color index 0 is the ocean, leave it something neutral
	
	//	this fixes a bug where the fill for ocean was being applied during pick
	//	all non-countries were being pointed to 10 - bolivia
	//	the fact that it didn't select was because bolivia shows up as an invalid country due to country name mismatch
	//	...
	var pickMask = countries.length == 0 ? 0 : 1;
	var oceanFill = 10 * pickMask;
	ctx.fillStyle = 'rgb(' + oceanFill + ',' + oceanFill + ',' + oceanFill +')';
	ctx.fillRect( 0, 0, 1, 1 );

	var selectedCountryCode = selectedCountry.countryCode;
	
	for( var i in countryCodes ){
		var countryCode = countryCodes[i];
		var colorIndex = countryColorMap[ countryCode ];
    
		if ( countryData[countries[i]] !== undefined ) {
		  var mapColor = countryData[countries[i]].mapColor;
		}
		var fillCSS = '#333333';
		if( countryCode === selectedCountryCode ) {
		  fillCSS = '#eeeeee';
		}
		ctx.fillStyle = fillCSS;
		ctx.fillRect( colorIndex, 0, 1, 1 );
	}
	
	lookupTexture.needsUpdate = true;
};

function getPickColor(){
	var affectedCountries = undefined;
	if ( visualizationMesh.children[0] !== undefined ) {
		affectedCountries = visualizationMesh.children[0].affectedCountries;
	}

	highlightCountry([]);
	rotating.remove(visualizationMesh);
	mapUniforms['outlineLevel'].value = 0;
	lookupTexture.needsUpdate = true;

	renderer.autoClear = false;
	renderer.autoClearColor = false;
	renderer.autoClearDepth = false;
	renderer.autoClearStencil = false;	

  renderer.clear();
  renderer.render(scene,camera);

  var gl = renderer.context;
  gl.preserveDrawingBuffer = true;

	var mx = ( mouseX + renderer.context.canvas.width/2 );
	var my = ( -mouseY + renderer.context.canvas.height/2 );
	mx = Math.floor( mx );
	my = Math.floor( my );

	var buf = new Uint8Array( 4 );		
	gl.readPixels( mx, my, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf );

	renderer.autoClear = true;
	renderer.autoClearColor = true;
	renderer.autoClearDepth = true;
	renderer.autoClearStencil = true;

	gl.preserveDrawingBuffer = false;

	mapUniforms['outlineLevel'].value = 1;
	rotating.add(visualizationMesh);

	if( affectedCountries !== undefined ){
		highlightCountry(affectedCountries);
	}
	return buf[0];
};

function setGlobeImage( fileName ) {
  var newTextureImage = new Image();
  newTextureImage.src = IMAGE_DIR + fileName;
  newTextureImage.onload = function() {
    outlinedMapTexture.image = newTextureImage;
    outlinedMapTexture.needsUpdate = true;
  };
};

function startCrazyMode() {
  increment = 0.539;
  uniforms.isCrazy.value = 1;
  controllers.spin = -50;
};

function stopCrazyMode() {
  increment = 0;
  time = 0;
  uniforms.isCrazy.value = 0;
  controllers.spin = 0;
};
