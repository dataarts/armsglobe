vizLines = require './visualize_lines'

# Ugly variable declarations
mouseX = 0; mouseY = 0; pmouseX = 0; pmouseY = 0; pressX = 0; pressY = 0
dragging = false; rotateVY = 0
rotateTargetX = 0; rotateTargetY = 0

rotateVX = 0.35 * Math.PI/180
rotateXMax = 90 * Math.PI/180
_autoRotateId = null

keyboard = new THREEx.KeyboardState()

module.exports =

  rotateX: 0
  rotateY: 0

  updateRotation: ->
    if rotateTargetX? and rotateTargetY?
      rotateVX += (rotateTargetX - this.rotateX) * 0.012
      rotateVY += (rotateTargetY - this.rotateY) * 0.012

      if Math.abs(rotateTargetX - this.rotateX) < 0.1 && Math.abs(rotateTargetY - this.rotateY) < 0.1
        rotateTargetX = undefined
        rotateTargetY = undefined

    this.rotateX += rotateVX
    this.rotateY += rotateVY

    rotateVX *= 0.98
    rotateVY *= 0.98

    if dragging or rotateTargetX?
      rotateVX *= 0.6
      rotateVY *= 0.6

    # constrain the pivot up/down to the poles
    # force a bit of bounce back action when hitting the poles
    if this.rotateX < -rotateXMax
      this.rotateX = -rotateXMax
      rotateVX *= -0.95

    if this.rotateX > rotateXMax
      this.rotateX = rotateXMax
      rotateVX *= -0.95

  onDocumentMouseMove: ( event ) ->
    pmouseX = mouseX
    pmouseY = mouseY

    mouseX = event.clientX - window.innerWidth * 0.5
    mouseY = event.clientY - window.innerHeight * 0.5

    if dragging
      if keyboard.pressed( "shift" ) is false
        rotateVY += (mouseX - pmouseX) / 2 * Math.PI / 180 * 0.3
        rotateVX += (mouseY - pmouseY) / 2 * Math.PI / 180 * 0.3
      else
        camera.position.x -= (mouseX - pmouseX) * 0.5
        camera.position.y += (mouseY - pmouseY) * 0.5

  onDocumentMouseDown: ( event ) ->
    if event.target.className.indexOf( 'noMapDrag' ) isnt -1
      return

    dragging = true
    pressX = mouseX
    pressY = mouseY
    rotateTargetX = undefined
    rotateTargetX = undefined
    module.exports.stopAutoRotate()
    return

  onDocumentMouseUp: ( event ) ->
    dragging = false
    histogramPressed = false
    module.exports.startAutoRotate()
    return

  onClick: ( event ) ->
    if Math.abs(pressX - mouseX) > 3 or Math.abs(pressY - mouseY) > 3
      return

  handleMWheel: ( delta, camera ) ->
    camera.scale.z += delta * 0.1
    camera.scale.z = vizLines.constrain camera.scale.z, 0.7, 5.0

  onMouseWheel: ( camera, event ) ->
    delta = 0

    if event.wheelDelta
      delta = event.wheelDelta / 120
    else if event.detail
      delta = -event.detail/3

    if delta?
      module.exports.handleMWheel delta, camera

    event.returnValue = false

  startAutoRotate: ->
    _autoRotateId = window.setInterval ->
      rotateVY += 0.1 * Math.PI / 180 * 0.3
    , 100

  stopAutoRotate: -> window.clearInterval _autoRotateId
