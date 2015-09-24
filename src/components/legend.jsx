// Main component for the interactive legend

/* eslint-disable react/react-in-jsx-scope */

import LegendItem from './legend-item.jsx';

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * <Legend /> Component definition
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
export default class Legend extends React.Component {
  constructor( props ) {
    super( props );

    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     * Styles
     * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
    this.headerStyle = {
      fontSize: 18,
      marginTop: 0,
    };

    this.listStyle = {
      listStyleType: 'none',
      margin: 0,
      padding: 0,
    };
  }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   * Final Render
   * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
  render() {
    const callback = this.props.clickCallback;

    return (
      <div>
        <h2 style={this.headerStyle}>Legend</h2>
        <ul style={this.listStyle}>
          {this.props.types.map( function mapTypes( type ) {
            return (<LegendItem key={type} type={type} clickCallback={callback}/>);
          })}
        </ul>
      </div>
    );
  }
}

Legend.propTypes = {
  clickCallback: React.PropTypes.func.isRequired,
  types: React.PropTypes.array.isRequired,
};
