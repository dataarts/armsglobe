// Component representing an individual legend item

const constants = require( '../constants' );

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * <LegendItem /> Component definition
 *~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
module.exports = React.createClass({
  /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   * Styles
   *~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
  legendItemStyle: {
    height: 20,
    paddingBottom: 5
  },

  toggleLinkStyle: {
    textDecoration: 'none',
    fontWeight: 'normal',
    // Transition for when we become inactive
    WebkitTransition: 'color 500ms ease-out',
    MozTransition:    'color 500ms ease-out',
    OTransition:      'color 500ms ease-out',
    transition:       'color 500ms ease-out',
  },

  circleStyle: {
    display: 'inline-block',
    width: 15,
    height: 15,
    borderRadius: '50%',
    // This is what lets us get the text centered
    marginTop: 3,
    marginBottom: -2,
    // Transition for when we become inactive
    WebkitTransition: 'background-color 500ms ease-out',
    MozTransition:    'background-color 500ms ease-out',
    OTransition:      'background-color 500ms ease-out',
    transition:       'background-color 500ms ease-out',
  },

  /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   * Behaviours
   *~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
  getInitialState() {
    return { active: true };
  },

  handleLinkClick( e ) {
    e.preventDefault();
    let newActive = !this.state.active;
    this.setState( { active: newActive } );
    this.props.clickCallback( this.props.type, newActive );
    return false;
  },

  /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   * Final Render
   *~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
  render() {
    let itemText = '';

    switch( this.props.type ) {
      case "r":
        itemText = 'Red';
        break;
      case "o":
        itemText = 'Orange';
        break;
      case "g":
        itemText = 'Green';
        break;
      case "b":
        itemText = 'Blue';
        break;
      case "p":
        itemText = 'Purple';
        break;
    }

    if( !this.state.active ) {
      this.toggleLinkStyle.color = '#555';
      this.circleStyle.backgroundColor = '#555';
    } else {
      this.toggleLinkStyle.color = '#ddd';
      this.circleStyle.backgroundColor = '#' + constants.COLOUR_MAP[ this.props.type ].getHexString();
    }

    /* jshint ignore: start */
    return (
      <li style={this.legendItemStyle} className="series">
        <a style={this.toggleLinkStyle} onClick={this.handleLinkClick} href="#">
          <div style={this.circleStyle}></div> - {itemText}
        </a>
      </li>
    );
    /* jshint ignore: end */
  }
});
