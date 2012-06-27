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
var backMat;
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

	//	render a world map
	worldCanvas = document.createElement('canvas');
	worldCanvas.id = 'worldCanvas';
	worldCanvas.width = 1024;
	worldCanvas.height = 1024;							

    //	-----------------------------------------------------------------------------
    //	Create the backing (sphere)
    var mapGraphic = new THREE.Texture(worldCanvas);//THREE.ImageUtils.loadTexture("images/map.png");
    backTexture =  mapGraphic;
    mapGraphic.needsUpdate = true;
	backMat = new THREE.MeshBasicMaterial(
		{
			// color: 		0xffffff, 
			// shininess: 	10, 
// 			specular: 	0x333333,
			map: 		mapGraphic,
			// lightMap: 	mapGraphic
		}
	);				
	// backMat.ambient = new THREE.Color(255,255,255);							
	sphere = new THREE.Mesh( new THREE.SphereGeometry( 100, 40, 40 ), backMat );				
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

	//	escape doing for this for now since it takes too long per load
	//	find a better way to render countries on globe
	// highlightCountry( [] );
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

function highlightCountry( countries ){				
	var countryCodes = [];
	for( var i in countries ){
		var code = findCode(countries[i]);
		countryCodes.push(code);
	}

	var start = "<svg x='0px' y='0px' width='4096px' height='2048px' viewBox='-1833.626 -529.136 4096 2048'>";
	var end = "</svg>";

	var loadedSVG = assets['images/worldmap_equirectangular_simplified.svg'];				

	var list = loadedSVG.querySelectorAll( 'path' );
	for( var i in list ){
		var element = list[i];
		if( element.setAttribute === undefined )
			continue;
		element.setAttribute( 'fill', '#222222' );					
		element.setAttribute( 'stroke', '#ffffff' );		
	}
	
	for( var i in countryCodes ){
		//	well.. country codes in the svg are lower case so..
		var code = countryCodes[i].toLowerCase();
		var selected = loadedSVG.getElementById(code);
		if( selected === undefined || selected === null ){
			console.log(selected);
			continue;
		}
			
		if( selected.setAttribute === undefined ){
			continue;
		}
		selected.setAttribute('visibility', 'visible' );
		list = selected.querySelectorAll( 'g,path' );				
		for( var s in list ){
			var element = list[s];
			if( element.setAttribute === undefined )
				continue;
			element.setAttribute('fill', '#ff0000');
		}							
	}				

	console.time('canvg');
	canvg( worldCanvas, start + loadedSVG.innerHTML + end );	
	console.timeEnd('canvg');
	backMat.needsUpdate = true;			
}
