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

var _meshPool = [];
var MESH_POOL_SIZE = 100;

function _getMeshFromPool( callback ) {
	if( _meshPool.length > 0 ) {
		callback( _meshPool.pop() );
	} else {
		window.setTimeout( _getMeshFromPool, 500, callback );
	}
}

function _returnMeshToPool( mesh ) {
	_meshPool.push( mesh );
}

/*
 * TODO: This method should reuse a pool of meshes, rather than allocating new
 *       ones for every invocation.
 */
function getVisualizedMesh( linearData ){
	if( !linearData.lineGeometry ) {
		return null;
	}

	var meshObj = new ParticleMesh();

	//	merge it all together
	meshObj.linesGeo.merge( linearData.lineGeometry );
	var points = linearData.lineGeometry.vertices;
	var point = points[0];
	var particle = point.clone();
	particle.moveIndex = 0;
	particle.nextIndex = 1;
	particle.lerpN = 0;
	particle.isFinished = false;
	particle.path = points;
	particle.size = meshObj.particleSize;
	meshObj.particlesGeo.vertices.push( particle );

	return meshObj.splineOutline;
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

function ParticleMesh() {
	this.linesGeo = new THREE.Geometry();
	this.particlesGeo = new THREE.Geometry();
	this.particleColor = new THREE.Color( 0x154492 );
	this.particleSize = 50;

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

	this.shaderMaterial = new THREE.ShaderMaterial({
		uniforms: 		{
			amplitude: { type: "f", value: 1.0 },
			color:     { type: "c", value: new THREE.Color( 0xffffff ) },
			texture:   { type: "t", value: THREE.ImageUtils.loadTexture( "images/particleA.png" ) },
		},
		attributes:     {
			size: {	type: 'f', value: [ this.particleSize ] },
			customColor: { type: 'c', value: [ this.particleColor ] }
		},
		vertexShader:   document.getElementById( 'vertexshader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentshader' ).textContent,

		blending: 		THREE.AdditiveBlending,
		depthTest: 		true,
		depthWrite: 	false,
		transparent:	true,
	});
	this.pSystem = new THREE.PointCloud( null, this.shaderMaterial );

	this.splineOutline.renderDepth = false;
	this.pSystem.dynamic = true;
	this.splineOutline.add( this.pSystem );
	this.splineOutline.geometry = this.linesGeo;
	this.pSystem.geometry = this.particlesGeo;
	this.pSystem.update = function(){
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
					// See http://stackoverflow.com/questions/12945092/memory-leak-with-three-js-and-many-shapes?rq=1
					// for details
					// scene.remove( splineOutline );
					//splineOutline.dispose();
					// particlesGeo.dispose();
					//shaderMaterial.dispose();
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
}
