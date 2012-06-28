var masterContainer = document.getElementById('visualization');

var overlay = document.getElementById('visualization');

//	where in html to hold all our things
var glContainer = document.getElementById( 'glContainer' );

//	contains a list of country codes with their matching country names
var isoFile = 'country_iso3166.json';
var latlonFile = 'country_lat_lon.json'

var camera, scene, renderer, controls,
geometry, material, colors;

var pinsBase, pinsBaseMat;
var lookupCanvas
var lookupTexture;
var backTexture;
var worldCanvas;
var sphere;
var rotating;	
var visualizationMesh;							

//	contains the data loaded from the arms data file
//	contains a list of years, followed by trades within that year
//	properties for each "trade" is: e - exporter, i - importer, v - value (USD), wc - weapons code (see table)
var timeBins;

//	contains latlon data for each country
var latlonData;			    

//	contains above but organized as a mapped list via ['countryname'] = countryobject
//	each country object has data like center of country in 3d space, lat lon, country name, and country code
var countryData = new Object();		

//	contains a list of country code to country name for running lookups
var countryLookup;		    

var selectableYears = [];
var selectableCountries = [];			    

/*
	930100 – military weapons, and includes some light weapons and artillery as well as machine guns and assault rifles etc.  
	930190 – military firearms – eg assault rifles, machineguns (sub, light, heavy etc), combat shotguns, machine pistols etc
	930200 – pistols and revolvers
	930320 – Sporting shotguns (anything that isn’t rated as a military item).
	930330 – Sporting rifles (basically anything that isn’t fully automatic).
	930621 – shotgun shells
	930630 – small caliber ammo (anything below 14.5mm which isn’t fired from a shotgun.
*/

//	a list of weapon 'codes'
//	now they are just strings of categories
//	Category Name : Category Code
var weaponLookup = {
	'Military Weapons' 		: 'mil',
	'Civilian Weapons'		: 'civ',
	'Ammunition'			: 'ammo',
};

//	a list of the reverse for easy lookup
var reverseWeaponLookup = new Object();
for( var i in weaponLookup ){
	var name = i;
	var code = weaponLookup[i];
	reverseWeaponLookup[code] = name;
}	    	

//	A list of category colors
var categoryColors = {
	'mil' : 0xdd380c,
	'civ' : 0x3dba00,
	'ammo' : 0x154492,
}

//	the currently selected country
var selectedCountry = null;

//	when the app is idle this will be true
var idle = false;

//	for svg loading
var assetList = [	"images/crosshair.svg", 'images/worldmap_equirectangular_simplified.svg'	];

//	TODO
//	use underscore and ".after" to load these in order
//	only load the data file once we've loaded our world pins


function start( e ){
	loadSVGAssets( assetList,
		function(){
			loadCountryCodes(
				function(){
					loadWorldPins(
						function(){										
							loadContentData(
								controllers.category,
								function(){																	
									initScene();
									animate();		
								}
							);														
						}
					);
				}
			);
		}
	);
}			



var Selection = function(){
	this.selectedYear = '1992';
	this.selectedCountry = 'United States';
	this.showExports = true;
	this.showImports = true;
	this.importExportFilter = 'both';

	this.categories = new Object();
	for( var i in weaponLookup ){
		this.categories[i] = true;
	}				

	this.getCategories = function(){
		var list = [];
		for( var i in this.categories ){
			if( this.categories[i] )
				list.push(i);
		}
		return list;
	}
};

//	-----------------------------------------------------------------------------
//	All the initialization stuff for THREE
function initScene() {
    //	-----------------------------------------------------------------------------
    //	Setup our renderer
	renderer = new THREE.WebGLRenderer({antialias:false});
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.autoClear = false;	
	
	renderer.sortObjects = false;		
	renderer.generateMipmaps = false;					

	glContainer.appendChild( renderer.domElement );							


	//	-----------------------------------------------------------------------------
    //	Let's make a scene		
	scene = new THREE.Scene();
	scene.matrixAutoUpdate = false;				


    //	-----------------------------------------------------------------------------
    //	Event listeners
	document.addEventListener( 'mousemove', onDocumentMouseMove, true );
	document.addEventListener( 'windowResize', onDocumentResize, false );

	masterContainer.addEventListener( 'mousedown', onDocumentMouseDown, true );	
	masterContainer.addEventListener( 'mouseup', onDocumentMouseUp, false );	
	masterContainer.addEventListener( 'click', onClick, false );	
	masterContainer.addEventListener( 'mousewheel', onMouseWheel, false );

	document.addEventListener( 'keydown', onKeyDown, false);												    			    	

    //	-----------------------------------------------------------------------------
    //	Setup our camera
    camera = new THREE.PerspectiveCamera( 12, window.innerWidth / window.innerHeight, 1, 20000 ); 		        
	camera.position.z = 1400;
	camera.position.y = 0;
	camera.lookAt(scene.width/2, scene.height/2);	
	scene.add( camera );	  

	var windowResize = THREEx.WindowResize(renderer, camera)	


	// scene.fog = new THREE.FogExp2( 0xBBBBBB, 0.00003 );		        		       

	scene.add( new THREE.AmbientLight( 0x505050 ) );				

	light1 = new THREE.SpotLight( 0xeeeeee, 3 );
	light1.position.x = 730; 
	light1.position.y = 520;
	light1.position.z = 626;
	light1.castShadow = true;
	scene.add( light1 );

	light2 = new THREE.PointLight( 0x222222, 14.8 );
	light2.position.x = -640;
	light2.position.y = -500;
	light2.position.z = -1000;
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

	var indexedMapTexture = THREE.ImageUtils.loadTexture( 'images/map_indexed.png' );
	indexedMapTexture.needsUpdate = true;
	indexedMapTexture.magFilter = THREE.NearestFilter;
	indexedMapTexture.minFilter = THREE.NearestFilter;

	var outlinedMapTexture = THREE.ImageUtils.loadTexture( 'images/map_outline.png' );
	// outlinedMapTexture.magFilter = THREE.NearestFilter;
	// outlinedMapTexture.minFilter = THREE.NearestFilter;

	var uniforms = {
		'mapIndex': { type: 't', value: 0, texture: indexedMapTexture  },		
		'lookup': { type: 't', value: 1, texture: lookupTexture },
		'outline': { type: 't', value: 2, texture: outlinedMapTexture },
	};

	var shaderMaterial = new THREE.ShaderMaterial( {

		uniforms: 		uniforms,
		// attributes:     attributes,
		vertexShader:   document.getElementById( 'globeVertexShader' ).textContent,
		fragmentShader: document.getElementById( 'globeFragmentShader' ).textContent,
		// sizeAttenuation: true,
	});


    //	-----------------------------------------------------------------------------
    //	Create the backing (sphere)
    // var mapGraphic = new THREE.Texture(worldCanvas);//THREE.ImageUtils.loadTexture("images/map.png");
    // backTexture =  mapGraphic;
    // mapGraphic.needsUpdate = true;
	backMat = new THREE.MeshBasicMaterial(
		{
			// color: 		0xffffff, 
			// shininess: 	10, 
// 			specular: 	0x333333,
			// map: 		mapGraphic,
			// lightMap: 	mapGraphic
		}
	);				
	// backMat.ambient = new THREE.Color(255,255,255);							
	sphere = new THREE.Mesh( new THREE.SphereGeometry( 100, 40, 40 ), shaderMaterial );				
	sphere.rotation.x = - 90 * Math.PI / 180;
	// sphere.receiveShadow = true;
	// sphere.castShadow = true;
	sphere.doubleSided = false;
	sphere.rotation.x = Math.PI;				
	sphere.rotation.y = Math.PI;
	sphere.rotation.z = Math.PI;
	sphere.id = "base";	
	rotating.add( sphere );	

	for( var i in timeBins ){					
		var bin = timeBins[i].data;
		for( var s in bin ){
			var set = bin[s];
			// if( set.v < 1000000 )
			// 	continue;

			var exporterName = set.e.toUpperCase();
			var importerName = set.i.toUpperCase();

			//	let's track a list of actual countries listed in this data set
			//	this is actually really slow... consider re-doing this with a map
			if( $.inArray(exporterName, selectableCountries) < 0 )
				selectableCountries.push( exporterName );

			if( $.inArray(importerName, selectableCountries) < 0 )
				selectableCountries.push( importerName );
		}
	}

	// console.log( selectableCountries );
	
	// load geo data (country lat lons in this case)
	console.time('loadGeoData');
	loadGeoData( latlonData );				
	console.timeEnd('loadGeoData');				

	console.time('buildDataVizGeometries');
	var vizilines = buildDataVizGeometries(timeBins);
	console.timeEnd('buildDataVizGeometries');

	visualizationMesh = new THREE.Object3D();
	rotating.add(visualizationMesh);	

	buildGUI();

	selectVisualization( timeBins, '1992', ['United States'], 'both', ['Military Weapons','Civilian Weapons', 'Ammunition'] );					

	//	test for highlighting specific countries
	// highlightCountry( ["United States", "Switzerland", "China"] );
}
	

function animate() {		    	
	if(keyboard.pressed('o') && keyboard.pressed('shift') == false)
		camera.rotation.z -= 0.08;		    	
	if(keyboard.pressed('p') && keyboard.pressed('shift') == false)
		camera.rotation.z += 0.08;		   

	rotateX += rotateVX;
	rotateY += rotateVY;

	rotateVX *= 0.98;
	rotateVY *= 0.98;

	if(dragging){
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

    render();	
    		        		       
    requestAnimationFrame( animate );	


	THREE.SceneUtils.traverseHierarchy( rotating, 
		function(mesh) {
			if (mesh.update !== undefined) {
				mesh.update();
			} 
		}
	);	

	for( var i in markers ){
		var marker = markers[i];
		marker.update();
	}		    	

}

function render() {	
	renderer.clear();		    					
    renderer.render( scene, camera );				
}		   

function findCode(countryName){
	countryName = countryName.toUpperCase();
	for( var i in countryLookup ){
		if( countryLookup[i] === countryName )
			return i;
	}
	return 'not found';
}

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
		var code = findCode(countries[i]);
		countryCodes.push(code);
	}

	var ctx = lookupCanvas.getContext('2d');	
	ctx.clearRect(0,0,256,1);

	//	color index 0 is the ocean, leave it something neutral
	ctx.fillStyle = 'rgb(10,10,10)';
	ctx.fillRect( 0, 0, 1, 1 );

	// for( var i = 0; i<255; i++ ){
	// 	var fillCSS = 'rgb(' + i + ',' + 0 + ',' + i + ')';
	// 	ctx.fillStyle = fillCSS;
	// 	ctx.fillRect( i, 0, 1, 1 );
	// }
	
	for( var i in countryCodes ){
		var countryCode = countryCodes[i];
		var colorIndex = countryColorMap[ countryCode ];

		var mapColor = countryData[countries[i]].mapColor;
		// var fillCSS = '#ff0000';
		var fillCSS = '#000000';
		if( mapColor !== undefined ){
			var k = map( mapColor, 0, 200000000, 0, 255 );
			k = Math.floor( constrain( k, 0, 255 ) );
			fillCSS = 'rgb(' + k + ',' + k + ',' + k + ')';
		}
		ctx.fillStyle = fillCSS;
		ctx.fillRect( colorIndex, 0, 1, 1 );
	}
	
	lookupTexture.needsUpdate = true;
}

