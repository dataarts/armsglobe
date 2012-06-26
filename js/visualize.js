/*
	930100 – military weapons, and includes some light weapons and artillery as well as machine guns and assault rifles etc.  
	930190 – military firearms – eg assault rifles, machineguns (sub, light, heavy etc), combat shotguns, machine pistols etc
	930200 – pistols and revolvers
	930320 – Sporting shotguns (anything that isn’t rated as a military item).
	930330 – Sporting rifles (basically anything that isn’t fully automatic).
	930621 – shotgun shells
	930630 – small caliber ammo (anything below 14.5mm which isn’t fired from a shotgun.
*/

var weaponLookup = {
	'Military Weapons' 		: 'mil',
	'Civilian Weapons'		: 'civ',
	'Ammunition'			: 'ammo',
};

var categoryColors = {
	'mil' : 0xdd380c,
	'civ' : 0x3dba00,
	'ammo' : 0x154492,
}

var reverseWeaponLookup = new Object();
for( var i in weaponLookup ){
	var name = i;
	var code = weaponLookup[i];
	reverseWeaponLookup[code] = name;
}

var selectableYears = [];
var selectableCountries = [];

function buildDataVizGeometries( linearData ){	
	for( var i in linearData ){
		var yearBin = linearData[i].data;

		var year = linearData[i].t;
		selectableYears.push(year);	

		var count = 0;
		console.log('Building data for ...' + year);
		for( var s in yearBin ){
			var set = yearBin[s];

			var exporterName = set.e.toUpperCase();
			var importerName = set.i.toUpperCase();

			exporter = countryData[exporterName];
			importer = countryData[importerName];	
			
			//	we couldn't find the country, it wasn't in our list...
			if( exporter === undefined || importer === undefined )
				continue;			

			//	visualize this event
			set.lineGeometry = makeConnectionLineGeometry( exporter, importer, set.v, set.wc );	
		}

		//	clear out temp connections data
		for( var s in yearBin ){
			var set = yearBin[s];
			var exporterName = set.e.toUpperCase();
			var importerName = set.i.toUpperCase();

			exporter = countryData[exporterName];
			if( exporter === undefined || importer === undefined )
				continue;			
			exporter.connections = undefined;
		}

		//	hack now to only do one year... as this operation takes a while		
		//	todo:
		//	cache the vertex data into json and simply serve it
		// break;
		// if( parseInt(year) > 1992 ) {
			break;
		// }		
	}			
}

function getVisualizedMesh( linearData, year, countries, action, categories ){
	//	for comparison purposes, all caps the country names
	for( var i in countries ){
		countries[i] = countries[i].toUpperCase();
	}

	//	pick out the year first from the data
	var indexFromYear = parseInt(year) - 1992;
	if( indexFromYear >= timeBins.length )
		indexFromYear = timeBins.length-1;

	var affectedCountries = [];

	var bin = linearData[indexFromYear].data;	

	var linesGeo = new THREE.Geometry();
	var lineColors = [];

	var particlesGeo = new THREE.Geometry();
	var particleColors = [];			

	var careAboutExports = ( action === 'exports' );
	var careAboutImports = ( action === 'imports' );
	var careAboutBoth = ( action === 'both' );

	//	go through the data from year, and find all relevant geometries
	for( i in bin ){
		var set = bin[i];

		//	filter out countries we don't care about
		var exporterName = set.e.toUpperCase();
		var importerName = set.i.toUpperCase();
		var relevantExport = $.inArray(exporterName, countries) >= 0;
		var relevantImport = $.inArray(importerName, countries) >= 0;
		var useExporter = (careAboutBoth || careAboutExports) && relevantExport;
		var useImporter = (careAboutBoth || careAboutImports) && relevantImport;

		var categoryName = reverseWeaponLookup[set.wc];
		var relevantCategory = $.inArray(categoryName,categories) >= 0;		

		if( (useImporter || useExporter) && relevantCategory ){
			//	we may not have line geometry... (?)
			if( set.lineGeometry === undefined )
				continue;

			var lastColor;
			//	grab the colors from the vertices
			for( s in set.lineGeometry.vertices ){
				var v = set.lineGeometry.vertices[s];		
				lineColors.push(v.color);
				lastColor = v.color;
			}

			//	merge it all together
			THREE.GeometryUtils.merge( linesGeo, set.lineGeometry );

			var particleColor = lastColor.clone();		
			// particleColor.r *= 8;
			// particleColor.g *= 8;
			// particleColor.b *= 8;
			particleColor.r = Math.min(particleColor.r, 1);
			particleColor.g = Math.min(particleColor.g, 1);
			particleColor.b = Math.min(particleColor.b, 1);
			var points = set.lineGeometry.vertices;
			var particleCount = Math.floor(set.v / 2000 / set.lineGeometry.vertices.length) + 1;
			for( var s=0; s<particleCount; s++ ){
				// var rIndex = Math.floor( Math.random() * points.length );
				// var rIndex = Math.min(s,points.length-1);

				var desiredIndex = s / particleCount * points.length;
				var rIndex = constrain(Math.floor(desiredIndex),0,points.length-1);

				var point = points[rIndex];						
				var particle = point.clone();
				particle.moveIndex = rIndex;
				particle.path = points;
				particlesGeo.vertices.push( particle );	
				particle.size = point.size;
				particleColors.push( particleColor );						
			}			

			if( $.inArray( exporterName, affectedCountries ) < 0 ){
				affectedCountries.push(exporterName);
			}			

			if( $.inArray( importerName, affectedCountries ) < 0 ){
				affectedCountries.push(importerName);
			}
		}		
	}

	linesGeo.colors = lineColors;	

	//	make a final mesh out of this composite
	var splineOutline = new THREE.Line( linesGeo, new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1.0, blending: THREE.NormalBlending, transparent:true, depthWrite: false, vertexColors: true, linewidth: 1 } ) );
	splineOutline.renderDepth = false;


	attributes = {
		size: {	type: 'f', value: [] },
		customColor: { type: 'c', value: [] }
	};

	uniforms = {
		amplitude: { type: "f", value: 1.0 },
		color:     { type: "c", value: new THREE.Color( 0xffffff ) },
		texture:   { type: "t", value: 0, texture: THREE.ImageUtils.loadTexture( "images/map_mask.png" ) },
	};

	var shaderMaterial = new THREE.ShaderMaterial( {

		uniforms: 		uniforms,
		attributes:     attributes,
		vertexShader:   document.getElementById( 'vertexshader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentshader' ).textContent,

		blending: 		THREE.AdditiveBlending,
		depthTest: 		true,
		depthWrite: 	false,
		transparent:	true,
		// sizeAttenuation: true,
	});



	var particleGraphic = THREE.ImageUtils.loadTexture("images/map_mask.png");
	var particleMat = new THREE.ParticleBasicMaterial( { map: particleGraphic, color: 0xffffff, size: 60, 
														blending: THREE.NormalBlending, transparent:true, 
														depthWrite: false, vertexColors: true,
														sizeAttenuation: true } );
	particlesGeo.colors = particleColors;
	var pSystem = new THREE.ParticleSystem( particlesGeo, shaderMaterial );
	pSystem.dynamic = true;
	splineOutline.add( pSystem );

	var vertices = pSystem.geometry.vertices;
	var values_size = attributes.size.value;
	var values_color = attributes.customColor.value;

	for( var v = 0; v < vertices.length; v++ ) {		
		values_size[ v ] = pSystem.geometry.vertices[v].size;
		values_color[ v ] = pSystem.geometry.colors[v];
	}

	pSystem.update = function(){	
		// var time = Date.now()									
		for( var i in this.geometry.vertices ){						
			var particle = this.geometry.vertices[i];
			var path = particle.path;
			var moveLength = path.length;
			particle.moveIndex ++;
			if( particle.moveIndex >= moveLength )
				particle.moveIndex = 0;							
			particle.copy( path[particle.moveIndex] );
			// var noiseY = time + particle.moveIndex;
			// noiseY = 0;
			// var offsetX = PerlinNoise.noise(particle.x * 0.1, noiseY, 0 );
			// var offsetY = PerlinNoise.noise(particle.y * 0.1, noiseY, 0 );
			// var offsetZ = PerlinNoise.noise(particle.z * 0.1, noiseY, 0 );
			// var off = this.geometry.colors[i].r * 10;
			// particle.x += offsetX * off;
			// particle.y += offsetY * off;			
			// particle.z += offsetZ * off;		
		}
		this.geometry.verticesNeedUpdate = true;
	};		

	//	return this info as part of the mesh package, we'll use this in selectvisualization
	splineOutline.affectedCountries = affectedCountries;


	return splineOutline;	
}

function selectVisualization( linearData, year, countries, action, categories ){

	//	clear markers
	for( var i in selectableCountries ){
		removeMarkerFromCountry( selectableCountries[i] );
	}

	//	clear children
	while( visualizationMesh.children.length > 0 ){
		var c = visualizationMesh.children[0];
		visualizationMesh.remove(c);
	}

	//	build the mesh
	console.time('getVisualizedMesh');
	var mesh = getVisualizedMesh( timeBins, year, countries, action, categories );				
	console.timeEnd('getVisualizedMesh');

	//	add it to scene graph
	visualizationMesh.add( mesh );	

	for( var i in mesh.affectedCountries ){
		var country = mesh.affectedCountries[i];
		attachMarkerToCountry( country );
	}

	// console.log( mesh.affectedCountries );
	// highlightCountry( mesh.affectedCountries );

}
