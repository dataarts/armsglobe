globeRadius = 1000
vec3_origin = new THREE.Vector3 0, 0, 0

module.exports =
  makeConnectionLineGeometry: ( exporter, importer, value, type ) ->
    if not exporter.countryName? or not importer.countryName?
      return undefined

    distanceBetweenCountryCenter = exporter.center.clone().sub(importer.center).length()

    # how high we want to shoot the curve upwards
    anchorHeight = globeRadius + distanceBetweenCountryCenter * 0.3

    # start/end of the line
    start = exporter.center
    end = importer.center

    # midpoint for the curve
    mid = start.clone().lerp end, 0.5
    midLength = mid.length()
    mid.normalize()
    mid.multiplyScalar( midLength + distanceBetweenCountryCenter * 0.4 )

    # the normal from start to end
    normal = (new THREE.Vector3()).subVectors start, end
    normal.normalize()

    # The curve looks like this:
    #
    #       midStartAnchor---- mid ----- midEndAnchor
    #       /                                  \
    #      /                                    \
    #     /                                      \
    # start/anchor                             end/anchor
    #
    # splineCurveA                               splineCurveB

    distanceHalf = distanceBetweenCountryCenter * 0.5

    startAnchor = start
    midStartAnchor = mid.clone().add( normal.clone().multiplyScalar( distanceHalf ) )
    midEndAnchor = mid.clone().add( normal.clone().multiplyScalar( -distanceHalf ) )
    endAnchor = end

    # now make a bezier curve out of the above like so in the diagram
    splineCurveA = new THREE.CubicBezierCurve3 start, startAnchor, midStartAnchor, mid
    splineCurveB = new THREE.CubicBezierCurve3 mid, midEndAnchor, endAnchor, end

    # how many vertices do we want on this guy? this is for *each* side
    vertexCountDesired = Math.floor( distanceBetweenCountryCenter * 0.02 + 6 ) * 2

    # collect the vertices
    points = splineCurveA.getPoints vertexCountDesired

    # remove the very last point since it will be duplicated on the next half of the curve
    points = points.splice 0, points.length - 1
    points = points.concat( splineCurveB.getPoints( vertexCountDesired ) )

    # add one final point to the center of the earth
    # we need this for drawing multiple arcs, but piled into one geometry buffer
    points.push vec3_origin

    # create a line geometry out of these
    curveGeometry = THREE.Curve.Utils.createLineGeometry points

    return curveGeometry;

  constrain: (v, min, max) ->
    if v < min
      v = min
    else if v > max
      v = max

    return v
