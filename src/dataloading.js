import constants from './constants';

export function loadWorldPins( latLonFile, callback ) {
  _getDataFromServer( latLonFile, callback );
}

export function loadCountryCodes( isoFile, callback ) {
  _getDataFromServer( isoFile, callback );
}

export function loadContentData( callback ) {
  let filePath = encodeURI( "categories/All.json" );
  _getDataFromServer( filePath, callback );
}

// Generates randomized src/dest data, for when you want something slightly
// more "interesting"
export function loadRandomizedContentData( numPoints, countries, callback ) {
  let toRet = [];
  let keys = Object.keys( countries );
  let now = Date.now();

  for( let idx = 0; idx < numPoints; idx++ ) {
    let srcIdx = Math.floor( Math.random() * keys.length );
    let destIdx = Math.floor( Math.random() * keys.length );
    let colourIdx = constants.COLOUR_TYPES[ Math.floor( Math.random() * constants.COLOUR_TYPES.length ) ];

    // generate a random timestamp within the last week
    let backInTime = Math.floor( Math.random() * constants.ONE_WEEK_IN_MILLIS );

    // account for the rare cases where we get the same index
    if( srcIdx === destIdx ) {
      destIdx = (destIdx === keys.length - 1) ? 0 : destIdx + 1;
    }

    let point = {};
    point.src = countries[ keys[ srcIdx ] ];
    point.dest = countries[ keys[ destIdx ] ];
    point.colour = colourIdx;
    point.time = new Date( now - backInTime );
    toRet.push( point );
  }

  callback( toRet );
}

// private helper method
function _getDataFromServer( path, callback ) {
  // We're going to ask a file for the JSON data.
  let xhr = new XMLHttpRequest();

  // Where do we get the data?
  xhr.open( 'GET', path, true );

  // What do we do when we have it?
  xhr.onreadystatechange = function() {
    // If we've received the data
    if( xhr.readyState === 4 && xhr.status === 200 ) {
      // Parse the JSON
      let parsedData = JSON.parse( xhr.responseText );
      if( callback ) callback( parsedData );
    }
  };

  // Begin request
  xhr.send( null );
}
