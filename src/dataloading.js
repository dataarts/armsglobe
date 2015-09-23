import * as constants from './constants';

// private helper method
function _getDataFromServer( path, callback ) {
  // We're going to ask a file for the JSON data.
  const xhr = new XMLHttpRequest();

  // Where do we get the data?
  xhr.open( 'GET', path, true );

  // What do we do when we have it?
  xhr.onreadystatechange = function readyStateChanged() {
    // If we've received the data
    if (xhr.readyState === 4 && xhr.status === 200) {
      // Parse the JSON
      const parsedData = JSON.parse( xhr.responseText );
      if (callback) { callback( parsedData ); }
    }
  };

  // Begin request
  xhr.send( null );
}

export function loadWorldPins( latLonFile, callback ) {
  _getDataFromServer( latLonFile, callback );
}

export function loadCountryCodes( isoFile, callback ) {
  _getDataFromServer( isoFile, callback );
}

export function loadContentData( callback ) {
  const filePath = encodeURI( 'categories/All.json' );
  _getDataFromServer( filePath, callback );
}

// Generates randomized src/dest data, for when you want something slightly
// more "interesting"
export function loadRandomizedContentData( numPoints, countries, callback ) {
  const toRet = [];
  const keys = Object.keys( countries );
  const now = Date.now();

  for (let idx = 0; idx < numPoints; idx++) {
    const srcIdx = Math.floor( Math.random() * keys.length );
    const colourIdx = constants.COLOUR_TYPES[ Math.floor( Math.random() * constants.COLOUR_TYPES.length ) ];
    let destIdx = Math.floor( Math.random() * keys.length );

    // generate a random timestamp within the last week
    const backInTime = Math.floor( Math.random() * constants.ONE_WEEK_IN_MILLIS );

    // account for the rare cases where we get the same index
    if (srcIdx === destIdx) {
      destIdx = (destIdx === keys.length - 1) ? 0 : destIdx + 1;
    }

    const point = {};
    point.src = countries[ keys[ srcIdx ] ];
    point.dest = countries[ keys[ destIdx ] ];
    point.colour = colourIdx;
    point.time = new Date( now - backInTime );
    toRet.push( point );
  }

  callback( toRet );
}
