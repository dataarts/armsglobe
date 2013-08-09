var RADIUS = 100;

function loadGeoData( latlonData ){
    //	-----------------------------------------------------------------------------
    //	Load the world geo data json, per country	
  
	//	iterate through each set of country pins
	for ( var i in latlonData.countries ) {										
		var country = latlonData.countries[i];

		//	save out country name and code info
		country.countryCode = i;
		country.countryName = countryLookup[i];			  	
	
		//	save and catalogue       
		country.center = latLonTo3dSpace( country.lat, country.lon );
		countryData[country.countryName] = country;	
	}		
};					

// take the lat lon from the data and convert this to 3d globe space
function latLonTo3dSpace( lat, lon ) {
  lon = lon - 90;
  
  var phi = Math.PI/2 - lat * Math.PI / 180;
  var theta = 2 * Math.PI - lon * Math.PI / 180;

  var pos = new THREE.Vector3();                
  pos.x = Math.sin(phi) * Math.cos(theta) * RADIUS;
  pos.y = Math.cos(phi) * RADIUS;
  pos.z = Math.sin(phi) * Math.sin(theta) * RADIUS;
  
  return pos;
};