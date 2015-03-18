constants = require './constants'
vizLines = require './visualize_lines'

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

      # since colours have been updated, tell THREE to force an update
      meshObj.attributes.alpha.needsUpdate = true
      meshObj.attributes.customColor.needsUpdate = true

      meshObj.vizMesh.add meshObj.splineOutline
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
  mesh.explosionSphere.lerpN = 0
  mesh.attributes.alpha.value = []
  mesh.attributes.customColor.value = []

  window.clearInterval mesh.particleUpdateId
  window.clearInterval mesh.explosionUpdateId

  # have to remove from the scene or else bad things happen
  mesh.vizMesh.remove mesh.splineOutline
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

    @lineMat = new THREE.LineBasicMaterial
      color: 0xffffff
      opacity: 0.0
      blending: THREE.AdditiveBlending
      transparent: true
      depthWrite: false
      vertexColors: false
      linewidth: 1
    @splineOutline = new THREE.Line null, @lineMat

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

    # Elements for the explosion effect
    explosionMat = new THREE.MeshBasicMaterial
      color: 0xffffff
      transparent: true
      opacity: 0.75
    explosionGeo = new THREE.SphereGeometry 3, 32, 32
    @explosionSphere = new THREE.Mesh explosionGeo, explosionMat
    @explosionSphere.complete = false
    @explosionSphere.lerpN = 0

    @explosionSphere.update = ->
      return if @complete

      @lerpN += constants.PARTICLE_SPEED
      if @lerpN > 5
        @complete = true
        @dispatchEvent { type: 'ExplosionComplete' }
        return

      return


    @pSystem.addEventListener( 'ParticleSystemComplete', @runExplosion.bind( this ) )
    @explosionSphere.addEventListener( 'ExplosionComplete', _returnMeshToPool.bind( this, this ) )

    # This update method is what actually gets our points moving across the scene.
    # Once the point has finished its path, this method will emit a "ParticleSystemComplete"
    # event, to allow us to re-pool the mesh.
    @pSystem.update = ->
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

        @geometry.verticesNeedUpdate = true

  runExplosion: ->
    path = @particlesGeo.vertices[0].path

    # The final array element is the origin, hence the -2 offset
    finalPt = path[ path.length - 2 ]
    color = @attributes.customColor.value[0].getHex()

    @explosionSphere.position.set finalPt.x, finalPt.y, finalPt.z
    @explosionUpdateId = window.setInterval( @explosionSphere.update.bind( @explosionSphere ), 16 )
    @vizMesh.add @explosionSphere

  startParticleUpdates: ->
    # 16ms interval is approx a 60FPS refresh rate
    @particleUpdateId = window.setInterval( @pSystem.update.bind( @pSystem ), 16 )
