/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * <Progress/> component definition
 *
 * This component inspired by:
 * http://jsfiddle.net/oskar/Aapn8/ and
 * https://github.com/pughpugh/react-countdown-clock
 *~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
// Keep this in CommonJS syntax as third-party libraries aren't necessarily es6
var tween = require( 'react-tween-state' );

const Progress = React.createClass({
  mixins: [tween.Mixin],

  /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   * Styles
   *~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
  canvasStyle: { display: 'block' },
  strokeStyle: {
    radius: 25,
    width: 5.0,
    color: '#008EAF'
  },

  /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   * Instance Variables
   *~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
  _canvas: null,
  _context: null,

  getInitialState() {
    return { currVal: 0.0 };
  },

  /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   * Component Methods
   *~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
  componentDidMount() {
    if( this._canvas ) return;

    this._canvas = this.getDOMNode();
    this._context = this._canvas.getContext( '2d' );

    // additional bootstrapping
    this._context.beginPath();
    this._context.strokeStyle = this.strokeStyle.color;
    this._context.lineCap = 'square';
    this._context.closePath();
    this._context.fill();
    this._context.lineWidth = this.strokeStyle.width;
    this._context.globalAlpha = 0.33;
  },

  componentDidUpdate() {
    this._updateProgress();
  },

  handleProgressUpdate( newVal ) {
    let onEndFunc;

    // Handles weird case where a currVal of 1.0 gives us no circle. Basically
    // we tween to a value that will appear to be a full circle and then as soon
    // as it's done, tween back to the start value (i.e. empty circle)
    if( newVal === 1.0 ) {
      newVal = 0.99999;
      onEndFunc = () => {
        this.tweenState( 'currVal', { endValue: 0.0 } );
      };
    }

    this.tweenState( 'currVal', {
      endValue: newVal,
      onEnd: onEndFunc
    });
  },

  /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   * Behaviours
   *~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
  _updateProgress() {
    if( !this._context ) return;

    // Clear out our previous strokes
    this._context.clearRect( 0, 0, this._canvas.width, this._canvas.height );

    // Basic idea: angle has to be between PI * -0.5 (12 o'clock) and PI * 1.5
    // (full circle) - since a circle is 2PI radians
    let endAngle = (2 * this.getTweeningValue( 'currVal' )) - 0.5;

    this._context.beginPath();
    this._context.arc(
      this.strokeStyle.radius, // x-coordinate of origin
      this.strokeStyle.radius, // y-coordinate of origin
      this.strokeStyle.radius - this.strokeStyle.width, // radius of arc (less the stroke width)
      Math.PI * 1.5, // starting angle in radians. PI * -0.5 is the 12 o'clock position
      Math.PI * endAngle, // ending angle in radians
      false // stroke counterclockwise?
    );
    this._context.stroke();
  },

  /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   * Final Render
   *~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
  render() {
    /* jshint ignore: start */
    return( <canvas style={this.canvasStyle} width="50" height="50"></canvas> );
    /* jshint ignore: end */
  }
});

export default Progress;
