function makeGeoPins( pinsdata ){
	var combinedMesh = new THREE.Object3D();

    //	-----------------------------------------------------------------------------
    //	Load the world pins via pins json, per country	

	var hexGeo = buildHexColumnGeo(1, 4);	

	var faceIndices = [ 'a', 'b', 'c', 'd' ];				
	for ( var i = 0; i < hexGeo.faces.length; i ++ ) {			
		f  = hexGeo.faces[ i ];
		n = ( f instanceof THREE.Face3 ) ? 3 : 4;
		if(i<4)
			color = new THREE.Color( 0x000000 );
		else
		if(i>=4 && i<8)
			color = new THREE.Color( 0xffffff );				
		else
		if(i>=8 && i<10)
			color = new THREE.Color( 0x333333 );					
		else
		if(i>=12 && i<14)
			color = new THREE.Color( 0xeeeeee );											
		else
		if(i>=16 && i<20)
			color = new THREE.Color( 0x000000 );		
		else
		if(i>=20 && i<30)
			color = new THREE.Color( 0x000000 );		
		else
			color = new THREE.Color( 0x666666 );
		for( var j = 0; j < n; j++ ) {
			vertexIndex = f[ faceIndices[ j ] ];
			p = hexGeo.vertices[ vertexIndex ].position;
			f.vertexColors[ j ] = color;
		}
	}

	var center = new THREE.Vector3(0,0,0);
	var up = new THREE.Vector3(0,-1,0);	
	var sphereRad = 1;				
	var rad = 100;

	//	iterate through each set of country pins
	for ( var i in pinsdata.countries ) {										
		var country = pinsdata.countries[i];	
		
		//	can we even find the country in the list?
		// if( countryLookup[country.n.toUpperCase()] === undefined ){
		// 	console.log('could not find country that has country code: ' + country.n)
		// 	continue;				
		// }

		//	convert country code to country names
		country.n = countryLookup[i];

		//	build normal pin geometry, extruded geometry, and fat geometry (for picking)
		var countryGeo = new THREE.Geometry();

		var avgCenter = new THREE.Vector3();

		//	a list of all generated pins so we can combine them down to one mesh
		var zeroed = [];

        var lon = country.lon;
        var lat = country.lat;
        
        var phi = Math.PI/2 - lat * Math.PI / 180;
        var theta = 2 * Math.PI - lon * Math.PI / 180 + Math.PI * 0.05;
        
        
        avgCenter.x = Math.sin(phi) * Math.cos(theta) * rad;
        avgCenter.y = Math.cos(phi) * rad;
        avgCenter.z = Math.sin(phi) * Math.sin(theta) * rad;  

		// //	iterate through each pin
		// for( var s=0; s<country.p.length; s++ ){

		// 	//	extract the position of the country's surface
		// 	var position = JSON.parse(country.p[s]);												
			
		// 	//	blow it up onto a sphere the size we want										
		// 	var vecA = new THREE.Vector3( position[0] * sphereRad, -position[1] * sphereRad, position[2] * sphereRad );
		// 	// vecA.x += Math.random() * .4 - .2;
		// 	// vecA.y += Math.random() * .4 - .2;
		// 	// vecA.z += Math.random() * .4 - .2;
		// 	var out = sphereRad + .01;
		// 	var vecB = new THREE.Vector3( position[0] * out, -position[1] * out, position[2] * out );

		// 	// var geo = THREE.GeometryUtils.clone(hexGeo);
		// 	// var matrix = new THREE.Matrix4();
		// 	// var outVec = vecA.clone();
		// 	// outVec.negate();						
		// 	// matrix = matrix.setPosition( vecA );
		// 	// matrix = matrix.lookAt( center, outVec, up );
		// 	// geo.applyMatrix( matrix );						
		// 	// zeroed.push( geo );

		// 	avgCenter.addSelf( vecB );								
		// }	

		// for( var s=0; s<zeroed.length; s++ ){
		// 	THREE.GeometryUtils.merge( countryGeo, zeroed[s] );					
		// }					

		// avgCenter.divideScalar( country.p.length );
		// avgCenter.normalize();
		// avgCenter.multiplyScalar(100);

		var countryMaterial = new THREE.MeshPhongMaterial(
			{
				color: 0xffffff, 
				vertexColors: THREE.VertexColors,
			    shininess: 150, 
				specular: 0x333355 
			}
		);

		var mesh = new THREE.Mesh( countryGeo, countryMaterial );	

		appendCountryData( country, mesh, avgCenter );	
		// console.log(country);									

		combinedMesh.add( mesh );		
	}		

	return combinedMesh;
}					

// organization so we can reference these later by country
function appendCountryData( country, mesh, avgCenter ){		
	//	keep country code on the mesh in case we need to refer to this later (via picking, etc)
	mesh.countryName = country.n;

	//	keep information about where we think the center of the country is
	mesh.center = avgCenter;

	//	keep color data for the country
	//	randomly select for now
	mesh.hue = 0.12;
	mesh.saturation = 0.74;//0.7 + Math.random() * 0.2;
	mesh.brightness = 0.4;

	mesh.material.color = (new THREE.Color()).setHSV( mesh.hue, mesh.saturation, 0.2 + Math.random() * 0.4 );

	//	keep a global list by country name
	countryData[country.n] = mesh;		
}

function getCountry(name){
	return countryData[name.toUpperCase()]
}