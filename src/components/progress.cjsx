#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# <Progress/> component definition
#
# This component inspired by:
# http://jsfiddle.net/oskar/Aapn8/ and
# https://github.com/pughpugh/react-countdown-clock
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
tween = require 'react-tween-state'

module.exports = React.createClass
  mixins: [tween.Mixin]

  #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  # Component state definition
  #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  getInitialState: ->
    currVal: 0.0

  #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  # Styles
  #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  canvasStyle:
    display: 'block'

  strokeStyle:
    radius: 25
    width: 5.0
    color: '#008EAF'

  #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  # Instance Variables
  #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  _canvas: null
  _context: null

  #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  # Component Methods
  #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  componentDidMount: ->
    if @_canvas then return

    @_canvas = @getDOMNode()
    @_context = @_canvas.getContext '2d'

    # additional bootstrapping
    @_context.beginPath()
    @_context.strokeStyle = @strokeStyle.color
    @_context.lineCap = 'square'
    @_context.closePath()
    @_context.fill()
    @_context.lineWidth = @strokeStyle.width
    @_context.globalAlpha = 0.33

  componentDidUpdate: ->
    @_updateProgress()

  handleProgressUpdate: (newVal) ->
    onEndFunc = undefined

    # Handles weird case where a currVal of 1.0 gives us no circle. Basically
    # we tween to a value that will appear to be a full circle and then as soon
    # as it's done, tween back to the start value (i.e. empty circle)
    if newVal is 1.0
      newVal = 0.99999
      onEndFunc = =>
        @tweenState( 'currVal', { endValue: 0.0 } )

    @tweenState( 'currVal',
      endValue: newVal,
      onEnd: onEndFunc
    )

  #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  # Behaviours
  #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  _updateProgress: ->
    if !@_context then return

    # Clear out our previous strokes
    @_context.clearRect 0, 0, @_canvas.width, @_canvas.height

    # Basic idea: angle has to be between PI * -0.5 (12 o'clock) and PI * 1.5
    # (full circle) - since a circle is 2PI radians
    endAngle = (2 * @getTweeningValue( 'currVal' )) - 0.5

    @_context.beginPath()
    @_context.arc(
      @strokeStyle.radius # x-coordinate of origin
      @strokeStyle.radius # y-coordinate of origin
      @strokeStyle.radius - @strokeStyle.width # radius of arc (less the stroke width)
      Math.PI * 1.5 # starting angle in radians. PI * -0.5 is the 12 o'clock position
      Math.PI * endAngle # ending angle in radians
      false # stroke counterclockwise?
    )
    @_context.stroke()

  #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  # Final Render
  #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  render: ->
    <canvas style={@canvasStyle}></canvas>
