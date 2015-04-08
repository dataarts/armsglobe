constants = require './constants'
vizLines = require './visualize_lines'

vec3_origin = new THREE.Vector3 0, 0, 0
vec3_x_axis = new THREE.Vector3 1, 0, 0
vec3_y_axis = new THREE.Vector3 0, 1, 0
vec3_z_axis = new THREE.Vector3 0, 0, 1

_meshPool = []

# Used to keep track of which types we're not currently displaying
_typeStatus = {}
for type in constants.COLOUR_TYPES
  _typeStatus[ type ] = true

module.exports =
  buildDataVizGeometries: ( linearData, countryData ) ->
    loadLayer = document.getElementById 'loading'
    count = 0

    for set in linearData
      exporterName = set.src.toUpperCase()
      importerName = set.dest.toUpperCase()

      exporter = countryData[exporterName]
      importer = countryData[importerName]

      # we couldn't find the country, it wasn't in our list...
      if not exporter? or not importer?
        continue

      # visualize this event
      set.lineGeometry = vizLines.makeConnectionLineGeometry exporter, importer

    loadLayer.style.display = 'none'
    return

  initMeshPool: ( poolSize, visualizationMesh ) ->
    _meshPool.push new ParticleMesh( visualizationMesh ) for i in [0...poolSize]

  initParticleViz: ( linearData ) ->
    return null if not linearData.lineGeometry?
    # Don't display if we've toggled this type off
    return null if not _typeStatus[ linearData.colour ]

    _getMeshFromPool ( meshObj ) ->
      # get our colour
      color = _getColourFromTypeStr linearData.colour

      # merge it all together
      meshObj.linesGeo.merge linearData.lineGeometry
      points = linearData.lineGeometry.vertices
      point = points[0]
      particle = point.clone()
      particle.moveIndex = 0
      particle.nextIndex = 1
      particle.lerpN = 0
      particle.path = points
      meshObj.particlesGeo.vertices.push particle

      # "Bundle" our trace line points at the start
      meshObj.traceLine.geometry.vertices = ( particle.clone() for num in [1..particle.path.length] )
      meshObj.traceLineMat.opacity = 1.0

      meshObj.attributes.alpha.value.push 1.0
      meshObj.attributes.customColor.value.push color

      # Create a trail for the particles by adding extra, slightly offset, particles
      for num in [1..constants.NUM_TRAIL_PARTICLES]
        trail = particle.clone()
        trail.moveIndex = 0
        trail.nextIndex = 1
        trail.lerpN = -1 * constants.PARTICLE_SPEED * num
        trail.path = points
        meshObj.particlesGeo.vertices.push trail
        meshObj.attributes.alpha.value.push( 1.0 - ( constants.TRAIL_OPACITY_MULTIPLIER * num ) )
        meshObj.attributes.customColor.value.push color

      # Set the explosion color, too
      meshObj.explosionSphere.material.color = color
      meshObj.traceLineMat.color = color

      # since colours have been updated, tell THREE to force an update
      meshObj.attributes.alpha.needsUpdate = true
      meshObj.attributes.customColor.needsUpdate = true

      meshObj.vizMesh.add meshObj.splineOutline
      meshObj.vizMesh.add meshObj.traceLine
      meshObj.startParticleUpdates()

  initVisualization: ( linearData ) ->
    # build the meshes. One for each entry in our data
    for data in linearData
      module.exports.initParticleViz data

  toggleVisualizationType: ( type, active ) ->
    _typeStatus[ type ] = active

# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# HELPER METHODS
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
_getMeshFromPool = ( callback ) ->
  if _meshPool.length > 0
    callback _meshPool.shift()
  else
    window.setTimeout _getMeshFromPool, 500, callback

_returnMeshToPool = ( mesh ) ->
  # clean up the two geometries
  mesh.linesGeo.vertices = []
  mesh.particlesGeo.vertices = []
  mesh.pSystem.systemComplete = false
  mesh.explosionSphere.complete = false
  mesh.explosionSphere.lerpVal = constants.EXPLOSION_INITIAL_LERP_FACTOR
  mesh.explosionSphere.finalPos = null
  mesh.explosionSphere.rotationAxis = null
  mesh.explosionSphere.material.opacity = 1.0
  mesh.traceLine.geometry.vertices = []
  mesh.attributes.alpha.value = []
  mesh.attributes.customColor.value = []

  window.clearInterval mesh.particleUpdateId
  window.clearInterval mesh.explosionUpdateId

  # have to remove from the scene or else bad things happen
  mesh.vizMesh.remove mesh.splineOutline
  mesh.vizMesh.remove mesh.traceLine
  mesh.vizMesh.remove mesh.explosionSphere

  _meshPool.push mesh

_getColourFromTypeStr = ( colorStr ) ->
  colour = constants.COLOUR_MAP[colorStr]
  colour = constants.COLOUR_MAP.r if not colour

  return colour

class ParticleMesh
  constructor: ( @vizMesh ) ->
    @particleUpdateId = null
    @explosionUpdateId = null
    @linesGeo = new THREE.Geometry()
    @particlesGeo = new THREE.Geometry()
    # Particle size now set in custom shader
    # @particleSize = 150

    @splineOutline = new THREE.Line null, new THREE.LineBasicMaterial( { visible: false } )

    # Use custom shader to have the trail taper off in transparency
    @attributes =
      alpha: { type: 'f', value: [] }
      customColor: { type: 'c', value: [] }

    @uniforms =
      color: { type: 'c', value: new THREE.Color( 0xffffff ) }
      texture: { type: 't', value: THREE.ImageUtils.loadTexture "images/particleB.png" }

    @shaderMaterial = new THREE.ShaderMaterial
      uniforms:       @uniforms
      attributes:     @attributes
      vertexShader:   document.getElementById( 'vertexshader' ).textContent
      fragmentShader: document.getElementById( 'fragmentshader' ).textContent
      blending:       THREE.AdditiveBlending
      transparent:    true
      depthTest:      true
      depthWrite:     false

    @pSystem = new THREE.PointCloud @particlesGeo, @shaderMaterial

    @splineOutline.renderDepth = false
    @pSystem.dynamic = true
    @pSystem.systemComplete = false # So we can know when to re-pool this mesh
    @splineOutline.add @pSystem
    @splineOutline.geometry = @linesGeo

    # Trace line
    @traceLineMat = new THREE.LineBasicMaterial
      color: 0xffffff
      opacity: 1.0
      transparent: true

    @traceLine = new THREE.Line new THREE.Geometry(), @traceLineMat

    # Elements for the explosion effect
    explosionMat = new THREE.MeshBasicMaterial
      color: 0xffffff
      transparent: true
      opacity: 1.0
      map: THREE.ImageUtils.loadTexture 'images/explosion_texture.png'
    explosionGeo = new THREE.SphereGeometry 5, 32, 32
    @explosionSphere = new THREE.Mesh explosionGeo, explosionMat
    @explosionSphere.complete = false
    @explosionSphere.lerpVal = constants.EXPLOSION_INITIAL_LERP_FACTOR
    @explosionSphere.finalPos = null
    @explosionSphere.rotationAxis = null

    @explosionSphere.update = ( traceLineMat ) ->
      return if @complete

      if not @visible
        @visible = true

      if @lerpVal <= 0.0
        @complete = true
        @visible = false
        @dispatchEvent { type: 'ExplosionComplete' }
        return

      @lerpVal -= constants.EXPLOSION_INCREMENTAL_LERP
      @position.set @finalPos.x, @finalPos.y, @finalPos.z
      @position.lerp vec3_origin, @lerpVal

      @rotateOnAxis @rotationAxis, constants.EXPLOSION_ROTATION_ANGLE

      # Don't start fading out until we're half done
      if @lerpVal <= constants.EXPLOSION_INITIAL_LERP_FACTOR / 2
        @material.opacity -= constants.EXPLOSION_OPACITY_LERP
        traceLineMat.opacity -= constants.EXPLOSION_OPACITY_LERP

      return


    @pSystem.addEventListener( 'ParticleSystemComplete', @runExplosion.bind( this ) )
    @explosionSphere.addEventListener( 'ExplosionComplete', _returnMeshToPool.bind( this, this ) )

    # This update method is what actually gets our points moving across the scene.
    # Once the point has finished its path, this method will emit a "ParticleSystemComplete"
    # event, to allow us to re-pool the mesh.
    @pSystem.update = ( traceLine ) ->
      # no point doing all the calculations if the particle is already done
      return if @systemComplete

      # Ensure we're visible
      if not @visible
        @visible = true

      for particle in @geometry.vertices
        path = particle.path

        particle.lerpN += constants.PARTICLE_SPEED
        if particle.lerpN > 1
          particle.lerpN = 0
          particle.moveIndex = particle.nextIndex
          particle.nextIndex++
          if particle.nextIndex >= path.length
            particle.moveIndex = 0
            particle.nextIndex = 0

            # Even though there are multiple particles in the system now, we still
            # do things this way as we don't really care if the "trail" has completed
            @systemComplete = true

            # Make ourselves invisible. This resolves an issue where a pooled mesh
            # would "flicker" when being reset
            @visible = false
            @dispatchEvent { type: 'ParticleSystemComplete' }
            return

        currentPoint = path[particle.moveIndex]
        nextPoint = path[particle.nextIndex]

        particle.copy currentPoint
        particle.lerp nextPoint, particle.lerpN

      for vertex, index in traceLine.geometry.vertices
        if index >= particle.moveIndex
          vertex.copy currentPoint
          vertex.lerp nextPoint, particle.lerpN
      traceLine.geometry.verticesNeedUpdate = true

      @geometry.verticesNeedUpdate = true

  runExplosion: ->
    path = @particlesGeo.vertices[0].path

    # The final array element is the origin, hence the -2 offset
    finalPt = path[ path.length - 2 ]
    color = @attributes.customColor.value[0].getHex()

    # Decide which axis this explosion is going to rotate about
    choice = Math.floor( Math.random() * 3 )
    switch choice
      when 0 then @explosionSphere.rotationAxis = vec3_x_axis
      when 1 then @explosionSphere.rotationAxis = vec3_y_axis
      when 2 then @explosionSphere.rotationAxis = vec3_z_axis

    @explosionSphere.finalPos = finalPt.clone()
    @explosionSphere.position.set finalPt.x, finalPt.y, finalPt.z
    @explosionSphere.position.lerp vec3_origin, @explosionSphere.lerpVal
    @explosionUpdateId = window.setInterval( @explosionSphere.update.bind( @explosionSphere, @traceLineMat ), 16 )
    @vizMesh.add @explosionSphere

  startParticleUpdates: ->
    # 16ms interval is approx a 60FPS refresh rate
    @particleUpdateId = window.setInterval( @pSystem.update.bind( @pSystem, @traceLine ), 16 )
