function loadWorldPins( callback ){					
	xhr = new XMLHttpRequest();
	xhr.open( 'GET', latlonFile, true );
	xhr.onreadystatechange = function() {
	  if ( xhr.readyState === 4 && xhr.status === 200 ) {
	      latlonData = JSON.parse( xhr.responseText );
	      if( callback )
	      	callback();				     
	    }
	};
	xhr.send( null );			    	
};

/**
 * @param data Input in either of the following formats:
 * // If e and i are identical, globe will display spike at that location; otherwise arc.
 * arcs: [{data: [{e: {countryCode: <country>, lat: <degrees>, lon: <degrees>},
 *                 i: {countryCode: <country>, lat: <degrees>, lon: <degrees>},
 *                 v: <linewidth/height>, log_v: <color/opacity>},
 *                 {e: {...}, i: {...}, v: ..., log_v: ...},
 *                 {e: {...}, i: {...}, v: ..., log_v: ...},
 *                 ...
 *               ],
 *         t: 0},
 *        {data: [...], t: 1},
 *        {data: [...], t: 2},
 *        ...
 *       ];
 * spikes: [{data: [{loc: {countryCode: <country>, lat: <degrees>, lon: <degrees>},
 *                   v: <linewidth/height>, log_v: <color/opacity>},
 *                  {loc: {...}, v: ..., log_v: ...},
 *                  {loc: {...}, v: ..., log_v: ...},
 *                  ...
 *                 ],
 *           t: 0},
 *          {data: [...], t: 1},
 *          {data: [...], t: 2},
 *          ...
 *         ];
 */
function loadContentData( data ) {
  timeBins = data;
  // Iterates through all of the time bins, each of which has a data array and a
  // time value. One of these time values should be t = 0.
  for ( var i = 0; i < timeBins.length; i++ ) {
    var bin = timeBins[i].data;
    for ( var j = 0; j < bin.length; j++ ) {
      var set = bin[j];
      if ( set.i !== undefined && set.e !== undefined ) {  // arc
        set.i.c = countryLookup[set.i.countryCode];
        if (set.i.c === undefined) {
          set.i.c = 'Invalid Country';
        }
        set.e.c = countryLookup[set.e.countryCode];
        if (set.e.c === undefined) {
          set.e.c = 'Invalid Country';
        }
      } else if ( set.loc !== undefined ) {  // spike
        set.loc.c = countryLookup[set.loc.countryCode];
        if (set.loc.c === undefined) {
          set.loc.c = 'Invalid Country';
        }
      }
      set.v = set.lin_v;
    }
  }

  selectableCountries = [];
  for ( var i in timeBins ){         
    var bin = timeBins[i].data;
    for ( var s in bin ){
      var set = bin[s];
      
      if ( set.e !== undefined && set.i !== undefined ) {  //arcs
        var exporterName = set.e.c.toUpperCase();
        var importerName = set.i.c.toUpperCase();
        //  let's track a list of actual countries listed in this data set
        //  this is actually really slow... consider re-doing this with a map
        if ( $.inArray(exporterName, selectableCountries) < 0 )
          selectableCountries.push( exporterName );
  
        if ( $.inArray(importerName, selectableCountries) < 0 )
          selectableCountries.push( importerName );
      }
      else if ( set.loc !== undefined ) {  //spikes
        var countryName = set.loc.c.toUpperCase();
        if ( $.inArray(countryName, selectableCountries) < 0 )
          selectableCountries.push( countryName );
      }
    }
  }
  console.log('finished loading content data');
  
  selectableTimes = {};
  
  console.time('buildDataVizGeometries');
  var vizilines = buildDataVizGeometries( timeBins );
  console.timeEnd('buildDataVizGeometries');
  
  controllers.spin = DEFAULT_SPIN;
  
  selectVisualization( selectionData.selectedTime, allCountries );
};

function loadCountryCodes( callback ){
	cxhr = new XMLHttpRequest();
	cxhr.open( 'GET', isoFile, true );
	cxhr.onreadystatechange = function() {
		if ( cxhr.readyState === 4 && cxhr.status === 200 ) {
	    	countryLookup = JSON.parse( cxhr.responseText );	
	    	console.log("loaded country codes");
	    	callback();
	    }
	};
	cxhr.send( null );
};
