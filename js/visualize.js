function buildDataVizGeometries( linearData ){

	var loadLayer = document.getElementById('loading');

	var count = 0;
	for( var i in linearData ){
		var set = linearData[i];

		var exporterName = set.e.toUpperCase();
		var importerName = set.i.toUpperCase();

		exporter = countryData[exporterName];
		importer = countryData[importerName];

		//	we couldn't find the country, it wasn't in our list...
		if( exporter === undefined || importer === undefined )
			continue;

		//	visualize this event
		set.lineGeometry = makeConnectionLineGeometry( exporter, importer, set.v, set.wc );

		// if( s % 1000 == 0 )
		// 	console.log( 'calculating ' + s + ' of ' + yearBin.length + ' in year ' + year);
	}

	loadLayer.style.display = 'none';
}

function getVisualizedMesh( linearData ){
	if( !linearData.lineGeometry ) {
		return null;
	}

	var linesGeo = new THREE.Geometry();
	var lineColors = [];

	var particlesGeo = new THREE.Geometry();
	var particleColors = [];

	var lineColor = new THREE.Color(importColor);//thisLineIsExport ? new THREE.Color(exportColor) : new THREE.Color(importColor);

	var lastColor;

	//	grab the colors from the vertices
	for( var s in linearData.lineGeometry.vertices ){
		var v = linearData.lineGeometry.vertices[s];
		lineColors.push(lineColor);
		lastColor = lineColor;
	}

	//	merge it all together
	linesGeo.merge( linearData.lineGeometry );

	var particleColor = lastColor.clone();
	var points = linearData.lineGeometry.vertices;
	var particleCount = 1;
	particleCount = constrain(particleCount,1,100);
	var particleSize = linearData.lineGeometry.size;

	var point = points[0];
	var particle = point.clone();
	particle.moveIndex = 0;
	particle.nextIndex = 1;
	particle.lerpN = 0;
	particle.isFinished = false;
	particle.path = points;
	particlesGeo.vertices.push( particle );
	particle.size = particleSize;
	particleColors.push( particleColor );

	linesGeo.colors = lineColors;

	//	make a final mesh out of this composite
	var splineOutline = new THREE.Line( linesGeo, new THREE.LineBasicMaterial(
		{ 	color: 0xffffff, opacity: 0.0, blending:
			THREE.AdditiveBlending, transparent:true,
			depthWrite: false, vertexColors: false,
			linewidth: 1 } )
	);

	splineOutline.renderDepth = false;


	attributes = {
		size: {	type: 'f', value: [] },
		customColor: { type: 'c', value: [] }
	};

	uniforms = {
		amplitude: { type: "f", value: 1.0 },
		color:     { type: "c", value: new THREE.Color( 0xffffff ) },
		texture:   { type: "t", value: 0, texture: THREE.ImageUtils.loadTexture( "images/particleA.png" ) },
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
	var particleMat = new THREE.PointCloudMaterial( { map: particleGraphic, color: 0xffffff, size: 60,
														blending: THREE.NormalBlending, transparent:true,
														depthWrite: false, vertexColors: true,
														sizeAttenuation: true } );
	particlesGeo.colors = particleColors;
	var pSystem = new THREE.PointCloud( particlesGeo, shaderMaterial );
	pSystem.dynamic = true;
	splineOutline.add( pSystem );

	var vertices = pSystem.geometry.vertices;
	var values_size = attributes.size.value;
	var values_color = attributes.customColor.value;

	for( var x = 0; x < vertices.length; x++ ) {
		values_size[ x ] = pSystem.geometry.vertices[x].size;
		values_color[ x ] = particleColors[x];
	}

	pSystem.update = function(){
		// var time = Date.now()
		var finishedCtr = 0;
		for( var i in this.geometry.vertices ){
			var particle = this.geometry.vertices[i];

			// no point doing all the calculations if the particle is already done
			if( particle.isFinished ) {
				finishedCtr++;
				continue;
			}

			var path = particle.path;
			var moveLength = path.length;

			particle.lerpN += 0.15;
			if(particle.lerpN > 1){
				particle.lerpN = 0;
				particle.moveIndex = particle.nextIndex;
				particle.nextIndex++;
				if( particle.nextIndex >= path.length ){
					particle.moveIndex = 0;
					particle.nextIndex = 0;
					particle.isFinished = true;
					// Need to clean up after ourselves so we don't leak memory. Note that
					// scene is a global variable leaked into this scope from main.js
					scene.remove( splineOutline );
				}
			}

			if( !particle.isFinished ) {
				var currentPoint = path[particle.moveIndex];
				var nextPoint = path[particle.nextIndex];


				particle.copy( currentPoint );
				particle.lerp( nextPoint, particle.lerpN );
			}
		}

		// only mark the vertices as dirty if something actually changed
		if( finishedCtr !== this.geometry.vertices.length ) {
			this.geometry.verticesNeedUpdate = true;
		}
	};

	return splineOutline;
}

function selectVisualization( linearData ){
	//	clear off the country's internally held color data we used from last highlight
	for( var i in countryData ){
		var country = countryData[i];
		country.exportedAmount = 0;
		country.importedAmount = 0;
		country.mapColor = 0;
	}

  /* Removing markers for now until I decide how to use them */
	//	clear markers
	// for( var i in selectableCountries ){
	// 	removeMarkerFromCountry( selectableCountries[i] );
	// }

	// build the meshes. One for each entry in our data
	// TODO: ensure this isn't a horrible memory sinkhole
	for( i in linearData ) {
		var mesh = getVisualizedMesh( linearData[i] );
		if( mesh !== null ) {
			visualizationMesh.add( mesh );
		}
	}

  /* Removing markers for now until I decide how to use them */
	// for( var i in mesh.affectedCountries ){
	// 	var countryName = mesh.affectedCountries[i];
	// 	var country = countryData[countryName];
	// 	attachMarkerToCountry( countryName, country.mapColor );
	// }
}
