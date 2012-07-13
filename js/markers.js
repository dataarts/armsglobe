var markers = [];

function onMarkerHover( event ){
	var hx = event.clientX - window.innerWidth * 0.5;
	var hy = event.clientY - window.innerHeight * 0.5;
	var dx = mouseX - hx;
	var dy = mouseY - hy;
	var d = Math.sqrt( dx * dx + dy * dy );
	// if( event.target.style.visibility == 'visible' )
	// 	console.log('clicked on something!!');				
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
    var countryLayer = marker.querySelector( '#countryText');
    marker.countryLayer = countryLayer;
	var detailLayer = marker.querySelector( '#detailText' );
	marker.detailLayer = detailLayer;
    marker.jquery = $(marker);
	marker.setSize = function( s ){
	    var detailSize = Math.floor(2 + s * 0.5);	
		this.detailLayer.style.fontSize = detailSize + 'pt';
        var totalHeight = detailSize * 2;
		this.style.fontSize = totalHeight * 1.125 + 'pt';
		if(detailSize <= 8) {
            this.countryLayer.style.marginTop = "0px";  
		} else {
		    this.countryLayer.style.marginTop = "-1px";
		}
	}

	marker.update = function(){
		var matrix = rotating.matrixWorld;
		var abspos = matrix.multiplyVector3( country.center.clone() );
		var screenPos = screenXY(abspos);			

		var s = 0.3 + camera.scale.z * 1;
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
			this.setVisible( ( abspos.z > 60 ) && s > 3 );	

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
		nameLayer.innerHTML = countryName.replace(' ','&nbsp;');	

	// marker.nameLayer = nameLayer;
	// marker.nameLayerText = countryName;
	// marker.nameLayerShorten = country.countryCode;;	
	
	var importExportText = "";
	if(country.exportedAmount > 0 && country.importedAmount > 0) {
	   importExportText += "imported:&nbsp;$" + numberWithCommas(country.importedAmount) + "<br />" +
	       "exported:&nbsp;$"+numberWithCommas(country.exportedAmount);
	} else if(country.exportedAmount > 0 && country.importedAmount == 0) {
	   importExportText += "exported:&nbsp;$"+numberWithCommas(country.exportedAmount)+"<br />&nbsp;";
	} else if(country.exportedAmount == 0 && country.importedAmount > 0) {
	   importExportText += "imported:&nbsp;$"+numberWithCommas(country.importedAmount)+"<br />&nbsp;";
	}

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
	marker.addEventListener('click', markerSelect, true);

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