// Component representing an individual legend item

/* eslint-disable react/react-in-jsx-scope */

import * as constants from '../constants';

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * <LegendItem /> Component definition
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
export default class LegendItem extends React.Component {
  static propTypes = {
    clickCallback: React.PropTypes.func.isRequired,
    type: React.PropTypes.string.isRequired,
  };

  constructor( props ) {
    super( props );

    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     * Styles
     * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
    this.legendItemStyle = {
      height: 20,
      paddingBottom: 5,
    };

    this.toggleLinkStyle = {
      textDecoration: 'none',
      fontWeight: 'normal',
      cursor: 'pointer',
      // Transition for when we become inactive
      WebkitTransition: 'color 500ms ease-out',
      MozTransition: 'color 500ms ease-out',
      OTransition: 'color 500ms ease-out',
      transition: 'color 500ms ease-out',
    };

    this.circleStyle = {
      display: 'inline-block',
      width: 15,
      height: 15,
      borderRadius: '50%',
      // This is what lets us get the text centered
      marginTop: 3,
      marginBottom: -2,
      // Transition for when we become inactive
      WebkitTransition: 'background-color 500ms ease-out',
      MozTransition: 'background-color 500ms ease-out',
      OTransition: 'background-color 500ms ease-out',
      transition: 'background-color 500ms ease-out',
    };

    // Set our initial state
    this.state = { active: true };
  }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   * Behaviours
   * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
  handleLinkClick( e ) {
    e.preventDefault();
    const newActive = !this.state.active;
    this.setState( { active: newActive } );
    this.props.clickCallback( this.props.type, newActive );
    return false;
  }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   * Final Render
   * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
  render() {
    let itemText = '';

    switch (this.props.type) {
    case 'r':
      itemText = 'Red';
      break;
    case 'o':
      itemText = 'Orange';
      break;
    case 'g':
      itemText = 'Green';
      break;
    case 'b':
      itemText = 'Blue';
      break;
    case 'p':
      itemText = 'Purple';
      break;
    default:
      itemText = 'Red';
    }

    if (!this.state.active) {
      this.toggleLinkStyle.color = '#555';
      this.circleStyle.backgroundColor = '#555';
    } else {
      this.toggleLinkStyle.color = '#ddd';
      this.circleStyle.backgroundColor = '#' + constants.COLOUR_MAP[ this.props.type ].getHexString();
    }

    return (
      <li style={this.legendItemStyle} className="series">
        <div style={this.toggleLinkStyle} onClick={this.handleLinkClick.bind(this)} role="checkbox" aria-checked={this.state.active}>
          <div style={this.circleStyle}></div> - {itemText}
        </div>
      </li>
    );
  }
}
