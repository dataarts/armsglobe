constants = require './constants'

module.exports =
  loadWorldPins: ( latLonFile, callback ) -> _getDataFromServer latLonFile, callback

  loadCountryCodes: ( isoFile, callback ) -> _getDataFromServer isoFile, callback

  loadContentData: ( callback ) ->
    filePath = encodeURI "categories/All.json"
    _getDataFromServer filePath, callback

  # Generates randomized src/dest data, for when you want something slightly
  # more "interesting"
  loadRandomizedContentData: ( numPoints, countries, callback ) ->
    toRet = []
    keys = Object.keys countries

    for idx in [0...numPoints]
      srcIdx = Math.floor( Math.random() * keys.length )
      destIdx = Math.floor( Math.random() * keys.length )
      colourIdx = constants.COLOUR_TYPES[ Math.floor( Math.random() * constants.COLOUR_TYPES.length ) ]

      # account for the rare cases where we get the same index
      if srcIdx is destIdx
        destIdx = if destIdx is keys.length - 1 then 0 else destIdx + 1

      point = {}
      point.src = countries[ keys[ srcIdx ] ]
      point.dest = countries[ keys[ destIdx ] ]
      point.colour = colourIdx
      toRet.push point

    callback toRet

# private helper method
_getDataFromServer = ( path, callback ) ->
  # We're going to ask a file for the JSON data.
  xhr = new XMLHttpRequest()

  # Where do we get the data?
  xhr.open 'GET', path, true

  # What do we do when we have it?
  xhr.onreadystatechange = ->
    # If we've received the data
    if xhr.readyState is 4 and xhr.status is 200
      # Parse the JSON
      parsedData = JSON.parse xhr.responseText
      callback parsedData if callback

  # Begin request
  xhr.send null
