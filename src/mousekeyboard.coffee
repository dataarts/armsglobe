# Ugly variable declarations
mouseX = 0; mouseY = 0; pmouseX = 0; pmouseY = 0; pressX = 0; pressY = 0
dragging = false; rotateX = 0; rotateY = 0; rotateVX = 0; rotateVY = 0
rotateTargetX = 0; rotateTargetY = 0

rotateXMax = 90 * Math.PI/180
_autoRotateId = null

keyboard = new THREEx.KeyboardState()

module.exports =
  onDocumentMouseMove: ( event ) ->
    pmouseX = mouseX
    pmouseY = mouseY

    mouseX = event.clientX - window.innerWidth * 0.5
    mouseY = event.clientY - window.innerHeight * 0.5

    if dragging
      if keyboard.pressed "shift" is false
        rotateVY += (mouseX - pmouseX) / 2 * Math.PI / 180 * 0.3
        rotateVX += (mouseY - pmouseY) / 2 * Math.PI / 180 * 0.3
      else
        camera.position.x -= (mouseX - pmouseX) * 0.5
        camera.position.y += (mouseY - pmouseY) * 0.5

  onDocumentMouseDown: ( event ) ->
    if event.target.className.indexOf 'noMapDrag' isnt -1
      return

    dragging = true
    pressX = mouseX
    pressY = mouseY
    rotateTargetX = undefined
    rotateTargetX = undefined
    stopAutoRotate()

  onDocumentMouseUp: ( event ) ->
    dragging = false
    histogramPressed = false
    startAutoRotate()

  onClick: ( event ) ->
    if Math.abs(pressX - mouseX) > 3 or Math.abs(pressY - mouseY) > 3
      return

  handleMWheel: ( delta ) ->
    camera.scale.z += delta * 0.1
    camera.scale.z = constrain camera.scale.z, 0.7, 5.0

  onMouseWheel: ( event ) ->
    delta = 0

    if event.wheelDelta
      delta = event.wheelDelta / 120
    else if event.detail
      delta = -event.detail/3

    if delta?
      handleMWheel delta

    event.returnValue = false

  startAutoRotate: ->
    _autoRotateId = window.setInterval ->
      rotateVY += 0.1 * Math.PI / 180 * 0.3
    , 100

  stopAutoRotate: -> window.clearInterval _autoRotateId
