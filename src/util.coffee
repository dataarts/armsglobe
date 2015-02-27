THREE.Curve.Utils.createLineGeometry = ( points ) ->
  geometry = new THREE.Geometry()
  for point in points
    geometry.vertices.push point

  return geometry

module.exports =
  wrap: ( value, min, rangeSize ) ->
    rangeSize -= min
    while value < min
      value += rangeSize

    return value % rangeSize

  screenXY: ( vec3, camera ) ->
    projector = new THREE.Projector()
    vector = projector.projectVector vec3.clone(), camera
    result = {}

    windowWidth = window.innerWidth
    minWidth = 1280
    if windowWidth < minWidth
      windowWidth = minWidth

    result.x = Math.round( vector.x * (windowWidth/2) ) + windowWidth/2
    result.y = Math.round( (0-vector.y) * (window.innerHeight/2) ) + window.innerHeight/2
    
    return result
