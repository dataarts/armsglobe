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

function getVisualizedMesh( linearData, scene ){
	if( !linearData.lineGeometry ) {
		return null;
	}

	var linesGeo = new THREE.Geometry();
	var lineColors = [];

	var particlesGeo = new THREE.Geometry();
	var particleColors = [];

	var exporterName = linearData.e.toUpperCase();
	var importerName = linearData.i.toUpperCase();

	var lineColor = new THREE.Color(importColor);//thisLineIsExport ? new THREE.Color(exportColor) : new THREE.Color(importColor);

	var lastColor;

	//	grab the colors from the vertices
	for( var s in linearData.lineGeometry.vertices ){
		var v = linearData.lineGeometry.vertices[s];
		lineColors.push(lineColor);
		lastColor = lineColor;
	}

	//	merge it all together
	THREE.GeometryUtils.merge( linesGeo, linearData.lineGeometry );

	var particleColor = lastColor.clone();
	var points = linearData.lineGeometry.vertices;
	var particleCount = Math.floor(linearData.v / 8000 / linearData.lineGeometry.vertices.length) + 1;
	particleCount = constrain(particleCount,1,100);
	var particleSize = linearData.lineGeometry.size;
	for( s=0; s<particleCount; s++ ){
		// var rIndex = Math.floor( Math.random() * points.length );
		// var rIndex = Math.min(s,points.length-1);

		var desiredIndex = s / particleCount * points.length;
		var rIndex = constrain(Math.floor(desiredIndex),0,points.length-1);

		var point = points[rIndex];
		var particle = point.clone();
		particle.moveIndex = rIndex;
		particle.nextIndex = rIndex+1;
		if(particle.nextIndex >= points.length )
			particle.nextIndex = 0;
		particle.lerpN = 0;
		particle.path = points;
		particlesGeo.vertices.push( particle );
		particle.size = particleSize;
		particleColors.push( particleColor );
	}

	// console.log(selectedCountry);

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

	for( var x = 0; x < vertices.length; x++ ) {
		values_size[ x ] = pSystem.geometry.vertices[x].size;
		values_color[ x ] = particleColors[x];
	}

	pSystem.update = function(){
		// var time = Date.now()
		for( var i in this.geometry.vertices ){
			var particleDone = false;
			var particle = this.geometry.vertices[i];
			var path = particle.path;
			var moveLength = path.length;

			particle.lerpN += 0.15;
			if(particle.lerpN > 1){
				particle.lerpN = 0;
				particle.moveIndex = particle.nextIndex;
				particle.nextIndex++;
				if( particle.nextIndex >= path.length ){
					// TODO: This is the indicator that we've reached the end of the path.
					//       Need to figure out how to delete this system at this point
					particle.moveIndex = 0;
					particle.nextIndex = 1;
					scene.remove( splineOutline );
					particleDone = true;
				}
			}

			if( !particleDone ) {
				var currentPoint = path[particle.moveIndex];
				var nextPoint = path[particle.nextIndex];


				particle.copy( currentPoint );
				particle.lerpSelf( nextPoint, particle.lerpN );
			}
		}
		this.geometry.verticesNeedUpdate = true;
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
	for( i in sampleData ) {
		var mesh = getVisualizedMesh( sampleData[i], visualizationMesh );
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
