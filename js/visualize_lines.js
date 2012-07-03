function makeConnectionLineGeometry( exporter, importer, value, type ){
	if( exporter.countryName == undefined || importer.countryName == undefined )
		return undefined;

	// console.log("making connection between " + exporter.countryName + " and " + importer.countryName + " with code " + type );

	var distanceBetweenCountryCenter = exporter.center.clone().subSelf(importer.center).length();	

	var globeRadius = exporter.center.length();

	//	how high we want to shoot the curve upwards
	var anchorHeight = globeRadius + distanceBetweenCountryCenter * 0.7;

	//	start of the line
	var start = exporter.center.clone();

	//	start anchor point
	var startA = start.clone().normalize().multiplyScalar( anchorHeight );;					

	//	end of the line
	var end = importer.center.clone();

	//	end anchor point
	var endA = end.clone().normalize().multiplyScalar( anchorHeight );
	
	//	midpoint for the curve
	var mid = start.clone().lerpSelf(end,0.5);		
	var midLength = mid.length()
	mid.normalize();
	mid.multiplyScalar( midLength + distanceBetweenCountryCenter * 0.7 );			

	//	the normal from start to end
	var normal = (new THREE.Vector3()).sub(start,end);
	normal.normalize();

	if( exporter.connection === undefined )
		exporter.connection = new Object();

	if( exporter.connection[importer.countryName] === undefined )
		exporter.connection[importer.countryName] = 0;
	else{
		exporter.connection[importer.countryName]++;
		// console.log('duplicate found ' + exporter.countryName + ' to ' + importer.countryName + ' with wc ' + type);
	}


	//	there may be multiple types of sales to a country
	//	split them up a bit so they don't overlap
	// var crossNormal = mid.clone().normalize().crossSelf( normal );
	// crossNormal.normalize();	
	// mid.addSelf( crossNormal.clone().multiplyScalar( exporter.connection[importer.countryName] * 2.0) );

	/*				     
				The curve looks like this:
				
				midStartAnchor---- mid ----- midEndAnchor
			  /											  \
			 /											   \
			/												\
	start/anchor 										 end/anchor

		splineCurveA							splineCurveB
	*/

	var startAnchor = start.clone();
	var midStartAnchor = mid.clone().addSelf( normal.clone().multiplyScalar(distanceBetweenCountryCenter * 0.5) );					
	var midEndAnchor = mid.clone().addSelf( normal.clone().multiplyScalar(-distanceBetweenCountryCenter * 0.5) );
	var endAnchor = end.clone();

	//	now make a bezier curve out of the above like so in the diagram
	var splineCurveA = new THREE.CubicBezierCurve3( start, startAnchor, midStartAnchor, mid);											
	splineCurveA.updateArcLengths();

	var splineCurveB = new THREE.CubicBezierCurve3( mid, midEndAnchor, endAnchor, end);
	splineCurveB.updateArcLengths();

	//	how many vertices do we want on this guy? this is for *each* side
	var vertexCountDesired = Math.floor( splineCurveA.getLength()/ 5 + 6 ) * 2;	

	//	collect the vertices
	var points = splineCurveA.getPoints( vertexCountDesired );
	points = points.concat( splineCurveB.getPoints( vertexCountDesired ) );

	//	add one final point to the center of the earth
	//	we need this for drawing multiple arcs, but piled into one geometry buffer
	points.push( new THREE.Vector3(0,0,0) );

	// var color = (new THREE.Color()).setHSV( exporter.hue, exporter.saturation, 0.2 );
	// var val = value / 1000000;
	// var hue = constrain( 0.4-val * 0.04, 0,1 );
	// var brightness = constrain( 0.3 + val * 0.8, 0, 1 );//constrain( 0.1 + val * 0.01, 0, 1 );
	// var color = (new THREE.Color()).setHSV( hue, Math.max(0.8,0.8+val * 0.2), brightness );
	// var color = new THREE.Color();

	var val = value / 1000000;
	// var hue = 0.55;
	// if( type == 'mil' )
	// 	hue = 0.0;
	// if( type == 'civ' )
	// 	hue = 0.5;
	// if( type == 'ammo' )
	// 	hue = 0.2;

	// var brightness = 1.0;//constrain(val,0,1);
	// var saturation = 1.0;

	var color = new THREE.Color( categoryColors[type] );

	// var color = new THREE.Color().setHSV( hue, saturation, brightness );

	var size = 10 + Math.sqrt(val * 100);

	//	just stuff the vertex color into the vertex...
	for( var i in points ){
		var v = points[i];
		v.color = color;
		v.size = size;
	}

	//	create a line geometry out of these
	var curveGeometry = THREE.Curve.Utils.createLineGeometry( points );

	return curveGeometry;

	//	keep a parallel colors array
	// for( var s in spacedPoints.vertices ){
	// 	lineColors.push( color );
	// }
}

function constrain(v, min, max){
	if( v < min )
		v = min;
	else
	if( v > max )
		v = max;
	return v;
}