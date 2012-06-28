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

function attachMarkerToCountry( countryName, importance ){
	//	look up the name to mesh
	countryName = countryName.toUpperCase();
	var country = countryData[countryName];
	if( country === undefined )
		return;

	var container = document.getElementById( 'visualization' );	
	var template = document.getElementById( 'marker_template' );
	var marker = template.cloneNode(true);

	country.marker = marker;
	container.appendChild( marker );

	marker.importance = importance;

	marker.setPosition = function(x,y,z){
		this.style.left = x + 'px';
		this.style.top = y + 'px';	
		this.style.zIndex = z;
	}

	marker.setVisible = function( vis ){
		if( ! vis )
			this.style.display = 'none';
		else{
			this.style.display = 'inline';
		}
	}

	var detailLayer = marker.querySelector( '#detailText' );
	marker.detailLayer = detailLayer;

	marker.setSize = function( s ){		
		this.style.fontSize = s + 'pt';		
		this.detailLayer.style.fontSize = Math.floor( 2 + s/2 ) + 'pt';
	}

	marker.update = function(){
		var matrix = rotating.matrixWorld;
		var abspos = matrix.multiplyVector3( country.center.clone() );
		var screenPos = screenXY(abspos);			

		var s = 0.2 + camera.scale.z * 3;
		var importanceScale = this.importance / 10000000;
		importanceScale = constrain( importanceScale, 0, 18 );
		s += importanceScale;
		this.setSize( s ); 

		this.setVisible( ( abspos.z > 60 ) && s > 6 );	

		var zIndex = Math.floor( 1000 - abspos.z + s );
		this.setPosition( screenPos.x, screenPos.y, zIndex );	
	}

	var nameLayer = marker.querySelector( '#countryText' );
	nameLayer.innerHTML = countryName;
	
	if( country.exportedAmount > 0 )
		detailLayer.innerHTML = "exported: $" + numberWithCommas(country.exportedAmount) + "<br>";

	if( country.importedAmount > 0 )
		detailLayer.innerHTML += "imported: $" + numberWithCommas(country.importedAmount);	

	// country.marker = new SVGToy( assetList[0], overlay );
	// country.marker.update = function(){
	// 	var matrix = rotating.matrixWorld;
	// 	var abspos = matrix.multiplyVector3( country.center.clone() );
	// 	var screenPos = screenXY(abspos);
	// 	country.marker.setPosition( screenPos.x, screenPos.y,0 );	
	// 	if( abspos.z > 60 )
	// 		country.marker.show();
	// 	else
	// 		country.marker.hide();
	// }

	// country.marker.svg.addEventListener( 'click', onMarkerHover, false );

	markers.push( marker );
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
	var container = document.getElementById( 'visualization' );		
	container.removeChild( country.marker );
	country.marker = undefined;		
}