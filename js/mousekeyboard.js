var mouseX = 0, mouseY = 0, pmouseX = 0, pmouseY = 0;
var pressX = 0, pressY = 0;

var dragging = false;						

var rotateX = 0, rotateY = 0;
var rotateVX = 0, rotateVY = 0;
var rotateXMax = 90 * Math.PI/180;	

var rotateTargetX = undefined;
var rotateTargetY = undefined;

var keyboard = new THREEx.KeyboardState();

function onDocumentMouseMove( event ) {

	pmouseX = mouseX;
	pmouseY = mouseY;

	mouseX = event.clientX - window.innerWidth * 0.5;
	mouseY = event.clientY - window.innerHeight * 0.5;

	if ( dragging ) {
		rotateVY += (mouseX - pmouseX) / 2 * Math.PI / 180 * 0.3;
  	rotateVX += (mouseY - pmouseY) / 2 * Math.PI / 180 * 0.3;	
	}
};

function onDocumentMouseDown( event ) {	
    dragging = true;			   
    pressX = mouseX;
    pressY = mouseY;   	
    rotateTargetX = undefined;
    rotateTargetX = undefined;
    controllers.spin = 0;
    event.preventDefault();
};	

function onDocumentMouseUp( event ){
	dragging = false;
};

function onClick( event ){
	//	make the rest not work if the event was actually a drag style click
	if( Math.abs(pressX - mouseX) > 3 || Math.abs(pressY - mouseY) > 3 ) {
	  return;
	}

	var pickColorIndex = getPickColor();	
	//	find it
	for ( var i in countryColorMap ) {
		var countryCode = i;
		var countryColorIndex = countryColorMap[i];
		if ( pickColorIndex == countryColorIndex ) {
			var countryName = countryLookup[countryCode];
			if ( countryName === undefined ) {
				return;			
			}
			if ( $.inArray(countryName, selectableCountries) <= -1 ) {
				return;
			}
			var selection = selectionData;
			selection.selectedCountry = countryName;
			selectVisualization( selection.selectedTime, [selection.selectedCountry] );	
			return;
		}
	}	
};

function onKeyDown( event ){	
  switch ( event.keyCode ) {
    case 37:
      controllers.spin += 0.1;
      event.preventDefault();
      break;
    case 38:
      handleMWheel( 2.5 );
      event.preventDefault();
      break;
    case 39:
      controllers.spin -= 0.1;
      event.preventDefault();
      break;
    case 40:
      handleMWheel( -2.5 );
      event.preventDefault();
      break;
  }
};

function handleMWheel( delta ) {
	camera.scale.z += delta * 0.1;
	camera.scale.z = constrain( camera.scale.z, 0.7, 5.0 );
};

function onMouseWheel( event ){
	var delta = 0;

	if ( event.wheelDelta ) { /* IE/Opera. */
    delta = event.wheelDelta/120;
	} 
	//	firefox
	else if ( event.detail ) {
		delta = -event.detail/3;
	}
	if ( delta ) {
	  handleMWheel( delta );
	}

	event.returnValue = false;			
};	

function onDocumentResize( e ) {
};
