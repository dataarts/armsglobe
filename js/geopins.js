function loadGeoData( latlonData ){
    //	-----------------------------------------------------------------------------
    //	Load the world geo data json, per country

	//	iterate through each set of country pins
	for ( var i in latlonData.countries ) {
		var country = latlonData.countries[i];

		//	can we even find the country in the list?
		// if( countryLookup[country.n.toUpperCase()] === undefined ){
		// 	console.log('could not find country that has country code: ' + country.n)
		// 	continue;
		// }

		//	save out country name and code info
		country.countryCode = i;
		country.countryName = countryLookup[i];

		//	take the lat lon from the data and convert this to 3d globe space
		var center = convertLatLonToVector( country.lat, country.lon );

		//	save and catalogue
		country.center = center;
		countryData[country.countryName] = country;
	}

	// console.log(countryData);
}

// Convert arbitrary lat/lon to a vector within the globe's space
function convertLatLonToVector( lat, lon ) {
	var rad = 100;

	lon -= 90;

	var phi = Math.PI/2 - lat * Math.PI / 180 - Math.PI * 0.01;
	var theta = 2 * Math.PI - lon * Math.PI / 180 + Math.PI * 0.06;

	var vec = new THREE.Vector3();
	vec.x = Math.sin(phi) * Math.cos(theta) * rad;
	vec.y = Math.cos(phi) * rad;
	vec.z = Math.sin(phi) * Math.sin(theta) * rad;

	return vec;
}

//	convenience function to get the country object by name
function getCountry(name){
	return countryData[name.toUpperCase()]
}
