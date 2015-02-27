module.exports =
  loadWorldPins: ( latLonFile, callback ) -> _getDataFromServer latLonFile, callback

  loadCountryCodes: ( isoFile, callback ) -> _getDataFromServer isoFile, callback

  loadContentData: ( callback ) ->
    filePath = encodeURI "categories/All.json"
    _getDataFromServer filePath, callback

# private helper method
_getDataFromServer = ( path, callback ) ->
  # We're going to ask a file for the JSON data.
  xhr = new XMLHttpRequest()

  # Where do we get the data?
  xhr.open 'GET', path, true

  # What do we do when we have it?
  xhr.onreadystatechange ->
    # If we've received the data
    if xhr.readyState is 4 and xhr.status is 200
      # Parse the JSON
      parsedData = JSON.parse xhr.responseText
      callback parsedData if callback

  # Begin request
  xhr.send null
