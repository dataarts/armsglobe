// Main component for the interactive legend
const LegendItem = require( './legend-item' );

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * <Legend /> Component definition
 *~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
module.exports = React.createClass({
  /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   * Styles
   *~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
  headerStyle: {
    fontSize: 18,
    marginTop: 0
  },

  listStyle: {
    listStyleType: 'none',
    margin: 0,
    padding: 0
  },

  /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   * Final Render
   *~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
  render() {
    let callback = this.props.clickCallback;

    /* jshint ignore: start */
    return (
      <div>
        <h2 style={this.headerStyle}>Legend</h2>
        <ul style={this.listStyle}>
          {this.props.types.map( function( type ) {
            return( <LegendItem key={type} type={type} clickCallback={callback}/> );
          })}
        </ul>
      </div>
    );
    /* jshint ignore: end */
  }
});
