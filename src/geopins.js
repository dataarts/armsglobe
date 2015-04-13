export function loadGeoData( latlonData, countryLookup ) {
  let countryData = {};

  Object.keys( latlonData.countries ).forEach( ( key ) => {
    let country = latlonData.countries[key];

    // save out country name and code info
    country.countryCode = key;
    country.countryName = countryLookup[key];

    // take the lat lon from the data and convert this to 3d globe space
    let center = convertLatLonToVector( country.lat, country.lon );

    country.center = center;
    countryData[country.countryName] = country;
  });

  return countryData;
}

// Convert arbitrary lat/lon to a vector within the globe's space
export function convertLatLonToVector( lat, lon ) {
  let rad = 100;
  lon -= 90;

  let phi = Math.PI/2 - lat * Math.PI / 180 - Math.PI * 0.01;
  let theta = 2 * Math.PI - lon * Math.PI / 180 + Math.PI * 0.06;

  let vec = new THREE.Vector3();
  vec.x = Math.sin(phi) * Math.cos(theta) * rad;
  vec.y = Math.cos(phi) * rad;
  vec.z = Math.sin(phi) * Math.sin(theta) * rad;

  return vec;
}
