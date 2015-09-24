// Convert arbitrary lat/lon to a vector within the globe's space
export function convertLatLonToVector( lat, lon ) {
  const rad = 100;
  const calcLon = lon - 90;

  const phi = Math.PI / 2 - lat * Math.PI / 180 - Math.PI * 0.01;
  const theta = 2 * Math.PI - calcLon * Math.PI / 180 + Math.PI * 0.06;

  const vec = new THREE.Vector3();
  vec.x = Math.sin(phi) * Math.cos(theta) * rad;
  vec.y = Math.cos(phi) * rad;
  vec.z = Math.sin(phi) * Math.sin(theta) * rad;

  return vec;
}

export function loadGeoData( latlonData, countryLookup ) {
  const countryData = {};

  Object.keys( latlonData.countries ).forEach( ( key ) => {
    const country = latlonData.countries[key];

    // save out country name and code info
    country.countryCode = key;
    country.countryName = countryLookup[key];

    // take the lat lon from the data and convert this to 3d globe space
    const center = convertLatLonToVector( country.lat, country.lon );

    country.center = center;
    countryData[country.countryName] = country;
  });

  return countryData;
}
