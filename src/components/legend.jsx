// Main component for the interactive legend
import * as LegendItem from './legend-item';

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * <Legend /> Component definition
 *~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
export class Legend extends React.Component {
  constructor( props ) {

    super( props );

    /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     * Styles
     *~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
    this.headerStyle = {
      fontSize: 18,
      marginTop: 0
    };

    this.listStyle = {
      listStyleType: 'none',
      margin: 0,
      padding: 0
    };
  }

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
}
