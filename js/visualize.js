function buildDataVizGeometries( linearData ){

	var loadLayer = document.getElementById('loading');

	var count = 0;
	for( var i in linearData ){
		var set = linearData[i];

		var exporterName = set.src.toUpperCase();
		var importerName = set.dest.toUpperCase();

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

var _meshPool = [];
function initMeshPool( poolSize ) {
	for( var i = 0; i < poolSize; i++ ) {
		_meshPool.push( new ParticleMesh() );
	}
}

function _getMeshFromPool( callback ) {
	if( _meshPool.length > 0 ) {
		callback( _meshPool.pop() );
	} else {
		window.setTimeout( _getMeshFromPool, 500, callback );
	}
}

function _returnMeshToPool( mesh ) {
	// clean up the two geometries
	mesh.linesGeo.vertices = [];
	mesh.particlesGeo.vertices = [];
	mesh.pSystem.systemComplete = false;

	// have to remove from the scene or else bad things happen. 'scene' is leaked
	// into this scope from main.js
	scene.remove( mesh.splineOutline );

	_meshPool.push( mesh );
}

function getVisualizedMesh( linearData, callback ){
	if( !linearData.lineGeometry ) {
		return null;
	}

	_getMeshFromPool( function( meshObj ) {
		//	merge it all together
		meshObj.linesGeo.merge( linearData.lineGeometry );
		var points = linearData.lineGeometry.vertices;
		var point = points[0];
		var particle = point.clone();
		particle.moveIndex = 0;
		particle.nextIndex = 1;
		particle.lerpN = 0;
		particle.path = points;
		particle.size = meshObj.particleSize;
		meshObj.particlesGeo.vertices.push( particle );

		// set the colour
		meshObj.setParticleColour( linearData.colour );

		return callback( meshObj.splineOutline );
	});
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
	for( i in linearData ) {
		getVisualizedMesh( linearData[i], _addMeshToViz );
	}

  /* Removing markers for now until I decide how to use them */
	// for( var i in mesh.affectedCountries ){
	// 	var countryName = mesh.affectedCountries[i];
	// 	var country = countryData[countryName];
	// 	attachMarkerToCountry( countryName, country.mapColor );
	// }
}

function _addMeshToViz( mesh ) {
	if( mesh !== null ) {
		visualizationMesh.add( mesh );
	}
}

function ParticleMesh() {
	this.linesGeo = new THREE.Geometry();
	this.particlesGeo = new THREE.Geometry();
	this.particleColor = COLOUR_MAP.r;
	this.particleSize = 150;

	this.lineMat = new THREE.LineBasicMaterial({
		color: 0xffffff,
		opacity: 0.0,
		blending: THREE.AdditiveBlending,
		transparent: true,
		depthWrite: false,
		vertexColors: false,
		linewidth: 1
	});
	this.splineOutline = new THREE.Line( null, this.lineMat );

	this.shaderMaterial = new THREE.PointCloudMaterial({
		map: 					THREE.ImageUtils.loadTexture( "images/particleA.png" ),
		size: 				this.particleSize,
		blending: 		THREE.AdditiveBlending,
		depthTest: 		true,
		depthWrite: 	false,
		transparent:	true,
		color: 				this.particleColor
	});
	this.pSystem = new THREE.PointCloud( null, this.shaderMaterial );

	this.splineOutline.renderDepth = false;
	this.pSystem.dynamic = true;
	this.pSystem.systemComplete = false; // So we can know when to re-pool this mesh
	this.splineOutline.add( this.pSystem );
	this.splineOutline.geometry = this.linesGeo;
	this.pSystem.geometry = this.particlesGeo;

	this.pSystem.addEventListener( 'ParticleSystemComplete', _returnMeshToPool.bind( this, this ) );

	/*
	This update method is what actually gets our points moving across the scene.
	Once the point has finished its path, this method will emit a "ParticleSystemComplete"
	event, to allow us to re-pool the mesh.
	*/
	this.pSystem.update = function(){
		/*
		Simplified this as our particle geometry will only ever have one point
		*/
		var particle = this.geometry.vertices[0];

		// no point doing all the calculations if the particle is already done
		if( this.systemComplete || !particle ) {
			return;
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

				this.systemComplete = true;
				this.dispatchEvent( { type: 'ParticleSystemComplete' } );
				return;
			}
		}

		var currentPoint = path[particle.moveIndex];
		var nextPoint = path[particle.nextIndex];

		particle.copy( currentPoint );
		particle.lerp( nextPoint, particle.lerpN );

		this.geometry.verticesNeedUpdate = true;
	};
}

ParticleMesh.prototype.setParticleColour = function( colourStr ) {
	var colour = COLOUR_MAP[colourStr];
	if( !colour ) {
		colour = COLOUR_MAP.r;
	}

	this.particleColor = colour;
	this.shaderMaterial.color = colour;
};
