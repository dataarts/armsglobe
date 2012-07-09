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

	marker.countryName = countryName;

	marker.importance = importance;
	marker.selected = false;
	marker.hover = false;

	if( countryName === selectedCountry.countryName.toUpperCase() )
		marker.selected = true;

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
		this.detailLayer.style.fontSize = Math.floor( 2 + s * 0.5 ) + 'pt';
	}

	marker.update = function(){
		var matrix = rotating.matrixWorld;
		var abspos = matrix.multiplyVector3( country.center.clone() );
		var screenPos = screenXY(abspos);			

		var s = 0.2 + camera.scale.z * 3;
		var importanceScale = this.importance / 5000000;
		importanceScale = constrain( importanceScale, 0, 18 );
		s += importanceScale;

		if( this.tiny )
			s *= 0.75;

		if( this.selected )
			s = 30;

		if( this.hover )
			s = 15;
		
		this.setSize( s ); 

		// if( this.selected )
			// this.setVisible( true )
		// else
			this.setVisible( ( abspos.z > 60 ) && s > 5 );	

		var zIndex = Math.floor( 1000 - abspos.z + s );
		if( this.selected || this.hover )
			zIndex = 10000;

		this.setPosition( screenPos.x, screenPos.y, zIndex );	
	}

	var nameLayer = marker.querySelector( '#countryText' );		

	//	right now, something arbitrary like 10 mil dollars or more to be highlighted
	var tiny = (importance < 20000000) && (!marker.selected);	
	marker.tiny = tiny;

	// if( tiny )
	// 	nameLayer.innerHTML = country.countryCode;	
	// else
		nameLayer.innerHTML = countryName;	

	// marker.nameLayer = nameLayer;
	// marker.nameLayerText = countryName;
	// marker.nameLayerShorten = country.countryCode;;	
	
	var importExportText = "";
	if( country.exportedAmount > 0 )
		importExportText += "exported: $" + numberWithCommas(country.exportedAmount) + "<br>";

	if( country.importedAmount > 0 )
		importExportText += "imported: $" + numberWithCommas(country.importedAmount);		

	marker.importExportText = importExportText;


	var markerOver = function(e){
		this.detailLayer.innerHTML = importExportText;
		this.hover = true;
	}

	var markerOut = function(e){
		this.detailLayer.innerHTML = "";
		this.hover = false;
	}

	if( !tiny ) {		
		detailLayer.innerHTML = importExportText;
	}
	else{
		marker.addEventListener( 'mouseover', markerOver, false );
		marker.addEventListener( 'mouseout', markerOut, false );
	}


	var markerSelect = function(e){
		var selection = selectionData;
		selectVisualization( timeBins, selection.selectedYear, [this.countryName], selection.getExportCategories(), selection.getImportCategories() );	
	};
	marker.addEventListener('click', markerSelect, false);

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