# All our dependencies
dataLoading = require './dataloading'
mouseKeyboard = require './mousekeyboard'
visualize = require './visualize'
geopins = require './geopins'
constants = require './constants'

# React components
Legend = require './components/legend'
Progress = require './components/progress'

masterContainer = document.getElementById 'visualization'
overlay = document.getElementById 'visualization'
glContainer = document.getElementById 'glContainer'

# Visualization components that need to be accessible throughout this module
mapIndexedImage = null
mapOutlineImage = null
rotating = null
renderer = null
scene = null
camera = null
visualizationMesh = null
progressViz = null

# contains a list of country codes with their matching country names
isoFile = 'country_iso3166.json'
latlonFile = 'country_lat_lon.json'

# Holds all the data we get back from the server
_countryLookup = null
_latLonData = null
_sampleData = null

# Detect WebGL
if not Detector.webgl
  Detector.addGetWebGLMessage()
else
  # ensure the map images are loaded first!!
  mapIndexedImage = new Image()
  mapIndexedImage.src = 'images/map_indexed.png'

  mapIndexedImage.onload = ->

    mapOutlineImage = new Image()
    mapOutlineImage.src = 'images/map_outline.png'
    mapOutlineImage.onload = ->
      dataLoading.loadCountryCodes isoFile, ( isoData ) ->
        _countryLookup = isoData
        dataLoading.loadWorldPins latlonFile, ( latLonData ) ->
          _latLonData = latLonData
          dataLoading.loadContentData ( sampleData ) ->
            _sampleData = sampleData
            initScene()
            visualize.init( scene )
            visualize.initMeshPool( 100 )

            # Render our React components
            reactInit()

            animate()
            startDataPump()

# used with the data pump
currIndexIntoData = 0
nextIndexIntoData = 5

startDataPump = ->
  window.setInterval ->
    endIndex = currIndexIntoData + 5
    if endIndex > _sampleData.length
      endIndex = _sampleData.length

    visualize.selectVisualization( _sampleData.slice( currIndexIntoData, endIndex ), visualizationMesh )
    progressViz.setState( { currVal: endIndex / _sampleData.length } )
    currIndexIntoData = (currIndexIntoData + 5) % _sampleData.length
  , 500

# All the initialization stuff for THREE.js
initScene = ->
  scene = new THREE.Scene()
  scene.matrixAutoUpdate = false

  light1 = new THREE.SpotLight 0xeeeeee, 3
  light1.position.x = 730
  light1.position.y = 520
  light1.position.z = 626
  light1.castShadow = true
  scene.add light1

  light2 = new THREE.SpotLight 0xeeeeee, 1.5
  light2.position.x = -730
  light2.position.y = 520
  light2.position.z = 626
  light2.castShadow = true
  scene.add light2

  light3 = new THREE.PointLight 0x222222, 14.8
  light3.position.x = 0
  light3.position.y = -750
  light3.position.z = 0
  scene.add light3

  rotating = new THREE.Object3D()
  scene.add rotating

  lookupCanvas = document.createElement 'canvas'
  lookupCanvas.width = 256
  lookupCanvas.height = 1

  lookupTexture = new THREE.Texture lookupCanvas
  lookupTexture.magFilter = THREE.NearestFilter
  lookupTexture.minFilter = THREE.NearestFilter
  lookupTexture.needsUpdate = true

  indexedMapTexture = new THREE.Texture mapIndexedImage
  indexedMapTexture.needsUpdate = true
  indexedMapTexture.magFilter = THREE.NearestFilter
  indexedMapTexture.minFilter = THREE.NearestFilter

  outlinedMapTexture = new THREE.Texture mapOutlineImage
  outlinedMapTexture.needsUpdate = true

  uniforms =
    'mapIndex': { type: 't', value: indexedMapTexture  }
    'lookup': { type: 't', value: lookupTexture }
    'outline': { type: 't', value: outlinedMapTexture }
    'outlineLevel': {type: 'f', value: 1 }

  shaderMaterial = new THREE.MeshLambertMaterial { map: outlinedMapTexture }

  # Create the backing (sphere)
  sphere = new THREE.Mesh( new THREE.SphereGeometry( 100, 40, 40 ), shaderMaterial )
  sphere.doubleSided = false
  sphere.rotation.x = Math.PI
  sphere.rotation.y = -Math.PI/2
  sphere.rotation.z = Math.PI
  sphere.id = "base"
  rotating.add sphere

  countryData = geopins.loadGeoData _latLonData, _countryLookup
  visualize.buildDataVizGeometries _sampleData, countryData

  visualizationMesh = new THREE.Object3D()
  rotating.add visualizationMesh

  # Set up our renderer
  renderer = new THREE.WebGLRenderer {antialias:false, alpha: true}
  renderer.setSize window.innerWidth, window.innerHeight
  renderer.autoClear = false

  renderer.sortObjects = false
  renderer.generateMipmaps = false

  glContainer.appendChild renderer.domElement

  # Setup our camera
  camera = new THREE.PerspectiveCamera( 12, window.innerWidth / window.innerHeight, 1, 20000 )
  camera.position.z = 1400
  camera.position.y = 0
  scene.add camera

  # Event listeners
  masterContainer.addEventListener 'mousemove', mouseKeyboard.onDocumentMouseMove, true
  masterContainer.addEventListener 'mousedown', mouseKeyboard.onDocumentMouseDown, true
  masterContainer.addEventListener 'mouseup', mouseKeyboard.onDocumentMouseUp, false

  masterContainer.addEventListener 'click', mouseKeyboard.onClick, true
  masterContainer.addEventListener 'mousewheel', mouseKeyboard.onMouseWheel.bind( null, camera ), false

  # firefox
  masterContainer.addEventListener 'DOMMouseScroll', (e) ->
    evt = window.event or e
    mouseKeyboard.onMouseWheel camera, evt
  , false

  windowResize = THREEx.WindowResize renderer, camera

  # Get the globe spinning (defined in mousekeyboard.js)
  mouseKeyboard.startAutoRotate()

animate = ->
  mouseKeyboard.updateRotation()

  rotating.rotation.x = mouseKeyboard.rotateX
  rotating.rotation.y = mouseKeyboard.rotateY

  requestAnimationFrame animate
  renderer.render scene, camera

  rotating.traverse ( mesh ) ->
    if mesh? and mesh.update?
      mesh.update()

# Loads our React components into the scene
reactInit = ->
  # Legend
  React.render(
    React.createElement( Legend,
      types: constants.COLOUR_TYPES
      clickCallback: visualize.toggleVisualizationType
    )
    document.getElementById 'legend'
  )

  # ... and our progress bar. We hold on to a ref so we can update its state as
  # we cycle through our data
  progressViz = React.render(
    React.createElement( Progress, null )
    document.getElementById 'progress'
  )
