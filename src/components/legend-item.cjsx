# Component representing an individual legend item

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# <LegendItem /> Component definition
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
module.exports = React.createClass
  #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  # Styles
  #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  legendItemStyle:
    height: 20
    paddingBottom: 5

  toggleLinkStyle:
    textDecoration: 'none'
    fontWeight: 'normal'
    # Transition for when we become inactive
    WebkitTransition: 'color 500ms ease-out'
    MozTransition:    'color 500ms ease-out'
    OTransition:      'color 500ms ease-out'
    transition:       'color 500ms ease-out'

  circleStyle:
    display: 'inline-block'
    width: 15
    height: 15
    borderRadius: '50%'
    # This is what lets us get the text centered
    marginTop: 3
    marginBottom: -2
    # Transition for when we become inactive
    WebkitTransition: 'background-color 500ms ease-out'
    MozTransition:    'background-color 500ms ease-out'
    OTransition:      'background-color 500ms ease-out'
    transition:       'background-color 500ms ease-out'

  #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  # Behaviours
  #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  getInitialState: ->
    return { active: true }

  handleLinkClick: ->
    @setState { active: !@state.active }

  #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  # Final Render
  #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  render: ->
    itemText = ''

    switch @props.type
      when "r"
        itemText = 'Red'
        @circleStyle.backgroundColor = '#ff1e00'
      when "o"
        itemText = 'Orange'
        @circleStyle.backgroundColor = '#ff7f00'
      when "g"
        itemText = 'Green'
        @circleStyle.backgroundColor = '#00ca35'
      when "b"
        itemText = 'Blue'
        @circleStyle.backgroundColor = '#008eaf'
      when "p"
        itemText = 'Purple'
        @circleStyle.backgroundColor = '#dc0068'

    if !@state.active
      @toggleLinkStyle.color = '#555'
      @circleStyle.backgroundColor = '#555'
    else
      @toggleLinkStyle.color = '#ddd'

    <li style={@legendItemStyle} className="series">
      <a style={@toggleLinkStyle} onClick={@handleLinkClick} href="#">
        <div style={@circleStyle}></div> - {itemText}
      </a>
    </li>
