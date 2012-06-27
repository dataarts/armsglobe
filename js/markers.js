var markers = [];

function onMarkerHover( event ){
	var hx = event.clientX - window.innerWidth * 0.5;
	var hy = event.clientY - window.innerHeight * 0.5;
	var dx = mouseX - hx;
	var dy = mouseY - hy;
	var d = Math.sqrt( dx * dx + dy * dy );
	if( event.target.style.visibility == 'visible' )
		console.log('clicked on something!!');				
}

function attachMarkerToCountry( countryName ){
	//	look up the name to mesh
	countryName = countryName.toUpperCase();
	var country = countryData[countryName];
	if( country === undefined )
		return;
	country.marker = new SVGToy( assetList[0], overlay );
	country.marker.update = function(){
		var matrix = rotating.matrixWorld;
		var abspos = matrix.multiplyVector3( country.center.clone() );
		var screenPos = screenXY(abspos);
		country.marker.setPosition( screenPos.x, screenPos.y,0 );	
		if( abspos.z > 60 )
			country.marker.show();
		else
			country.marker.hide();
	}

	country.marker.svg.addEventListener( 'click', onMarkerHover, false );

	markers.push( country.marker );
}		

function removeMarkerFromCountry( countryName ){
	countryName = countryName.toUpperCase();
	var country = countryData[countryName];
	if( country === undefined )
		return;
	if( country.marker === undefined )
		return;

	var index = markers.indexOf(country.marker);
	if( index >= 0 )
		markers.splice( index, 1 );
	country.marker.removeFromDom();
	country.marker = undefined;		
}