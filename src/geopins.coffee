module.exports =
  loadGeoData: ( latlonData, countryLookup ) ->
    countryData = {}
    for index, country of latlonData.countries
      # save out country name and code info
      country.countryCode = index
      country.countryName = countryLookup[index]

      # take the lat lon from the data and convert this to 3d globe space
      center = module.exports.convertLatLonToVector country.lat, country.lon

      country.center = center
      countryData[country.countryName] = country

    return countryData

  # Convert arbitrary lat/lon to a vector within the globe's space
  convertLatLonToVector: ( lat, lon ) ->
    rad = 100
    lon -= 90

    phi = Math.PI/2 - lat * Math.PI / 180 - Math.PI * 0.01
    theta = 2 * Math.PI - lon * Math.PI / 180 + Math.PI * 0.06

    vec = new THREE.Vector3
    vec.x = Math.sin(phi) * Math.cos(theta) * rad
    vec.y = Math.cos(phi) * rad
    vec.z = Math.sin(phi) * Math.sin(theta) * rad

    return vec
