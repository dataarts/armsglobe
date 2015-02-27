# All our dependencies
dataLoading = require 'dataloading'
mouseKeyboard = require 'mousekeyboard'

masterContainer = document.getElementById 'visualization'
overlay = document.getElementById 'visualization'
glContainer = document.getElementById 'glContainer'

# Colour Constants
COLOUR_MAP =
  r: new THREE.Color 0xFF1E00
  o: new THREE.Color 0xFF7F00
  b: new THREE.Color 0x008EAF
  g: new THREE.Color 0x00CA35
  p: new THREE.Color 0xDC0068

# contains a list of country codes with their matching country names
isoFile = 'country_iso3166.json'
latlonFile = 'country_lat_lon.json'

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
      dataLoading.loadCountryCodes ->
        dataLoading.loadWorldPins ->
          dataLoading.loadContentData ->
            initScene()
            initMeshPool( 100 ) # defined in visualize.js
            animate()
            startDataPump()

# used with the data pump
currIndexIntoData = 0
nextIndexIntoData = 5

startDataPump = ->
  window.setInterval ->
    endIndex = currIndexIntoData + 5
    if endIndex > sampleData.length
      endIndex = sampleData.length

    selectVisualization( sampleData.slice( currIndexIntoData, endIndex ) )
    currIndexIntoData = (currIndexIntoData + 5) % sampleData.length
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

  loadGeoData latlonData
  buildDataVizGeometries sampleData

  visualizationMesh = new THREE.Object3D()
  rotating.add visualizationMesh

  # Set up our renderer
  renderer = new THREE.WebGLRenderer {antialias:false, alpha: true}
  renderer.setSize window.innerWidth, window.innerHeight
  renderer.autoClear = false

  renderer.sortObjects = false
  renderer.generateMipmaps = false

  glContainer.appendChild renderer.domElement


  # Event listeners
  document.addEventListener 'mousemove', onDocumentMouseMove, true
  document.addEventListener 'mousedown', onDocumentMouseDown, true
  document.addEventListener 'mouseup', onDocumentMouseUp, false

  masterContainer.addEventListener 'click', onClick, true
  masterContainer.addEventListener 'mousewheel', onMouseWheel, false

  # firefox
  masterContainer.addEventListener 'DOMMouseScroll', (e) ->
    evt = window.event or e
    onMouseWheel evt
  , false

  # Setup our camera
  camera = new THREE.PerspectiveCamera( 12, window.innerWidth / window.innerHeight, 1, 20000 )
  camera.position.z = 1400
  camera.position.y = 0
  scene.add camera

  windowResize = THREEx.WindowResize renderer, camera

  # Get the globe spinning (defined in mousekeyboard.js)
  mouseKeyboard.startAutoRotate()

animate = ->
  if rotateTargetX? and rotateTargetY?
    rotateVX += (rotateTargetX - rotateX) * 0.012
    rotateVY += (rotateTargetY - rotateY) * 0.012

    if Math.abs(rotateTargetX - rotateX) < 0.1 && Math.abs(rotateTargetY - rotateY) < 0.1
      rotateTargetX = undefined
      rotateTargetY = undefined

  rotateX += rotateVX
  rotateY += rotateVY

  rotateVX *= 0.98
  rotateVY *= 0.98

  if dragging or rotateTargetX?
    rotateVX *= 0.6
    rotateVY *= 0.6

  rotateY += controllers.spin * 0.01

  # constrain the pivot up/down to the poles
  # force a bit of bounce back action when hitting the poles
  if rotateX < -rotateXMax
    rotateX = -rotateXMax
    rotateVX *= -0.95

  if rotateX > rotateXMax
    rotateX = rotateXMax
    rotateVX *= -0.95

  rotating.rotation.x = rotateX
  rotating.rotation.y = rotateY

  requestAnimationFrame animate
  renderer.render scene, camera

  rotating.traverse ( mesh ) ->
    if mesh? and mesh.update?
      mesh.update()
