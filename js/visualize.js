var com = com || {};
com.google = com.google || {};

var COUNTRY_TRANSITION_MILLISECONDS = 300;
var CHANGE_SCALE_MILLISECONDS = 300;

com.google.scaleEnum = {
  LINEAR: 'linear',
  LOG: 'log'
};

function colorFn( val ) {
  var lineColor = new THREE.Color();
  lineColor.setHSL( 0.6 - (val * 0.6), 1.0, 0.5 );
  return lineColor;
};

function buildDataVizGeometries( linearData ){	

	for( var i in linearData ){
		var timeBin = linearData[i].data;		

		var time = linearData[i].t;
		selectableTimes[time] = timeBin;	

		console.log('Building data for ...' + time);
		for( var s in timeBin ){
			var set = timeBin[s];
			
			if ( set.e !== undefined && set.i !== undefined ) {  // arcs
        var exporterLoc = latLonTo3dSpace( set.e.lat, set.e.lon );
        var importerLoc = latLonTo3dSpace( set.i.lat, set.i.lon );
        
  	    //	  visualize this event
        if ( !exporterLoc.equals( importerLoc ) ) {
          var exporter = { center: exporterLoc, countryName: set.e.c.toUpperCase() };
          var importer = { center: importerLoc, countryName: set.i.c.toUpperCase() };
          set.arcInfo = makeArcInfo( exporter, importer, set.v, set.lin_v, set.log_v, colorFn( set.log_v ), 20);
        } else {
          set.spikeMesh = makeSpikeMesh( set.e.lat, set.e.lon, (set.v * 200) + 0.1, colorFn( set.log_v ) );
        }
			} else if ( set.loc !== undefined ) {  // spikes
			  set.spikeMesh = makeSpikeMesh( set.loc.lat, set.loc.lon, (set.v * 200) + 0.1, colorFn( set.log_v ) );
			}
	  }
	}			
};

function getVisualizedMeshes( time, countries ){
	//	for comparison purposes, all caps the country names
	for( var i in countries ){
		countries[i] = countries[i].toUpperCase();
	}

	var affectedCountries = [];

	var bin = selectableTimes[time];	

	var meshes = [];
	var linewidthToArcsInfo = {};
	var spikeGeometries = new THREE.Geometry();

	//	go through the data from time, and find all relevant geometries
	for( i in bin ){
		var set = bin[i];
    
		var exporterName;
		var importerName;
		//	filter out countries we don't care about
		if ( set.e !== undefined && set.i !== undefined ) {  // arcs
		  exporterName = set.e.c.toUpperCase();
	    importerName = set.i.c.toUpperCase();
    } else if ( set.loc !== undefined ) {  // spikes
      exporterName = set.loc.c.toUpperCase();
      importerName = set.loc.c.toUpperCase();
    }
		var relevantExport = $.inArray( exporterName, countries ) >= 0;
		var relevantImport = $.inArray( importerName, countries ) >= 0;

		var useExporter = relevantExport;
		var useImporter = relevantImport;

		if( (useImporter || useExporter) ){
			//	we may not have line geometry... (?)
			if( set.arcInfo === undefined && set.spikeMesh === undefined ) {
				continue;
			}
			
			if ( set.arcInfo !== undefined ) {
			  var arcWidth = set.arcInfo.width;
			  if ( linewidthToArcsInfo[arcWidth] === undefined ) {
			    linewidthToArcsInfo[arcWidth] = [];
			  }
			  linewidthToArcsInfo[arcWidth].push( set.arcInfo );
			} else if ( set.spikeMesh !== undefined ) {
			  THREE.GeometryUtils.merge( spikeGeometries, set.spikeMesh );
			}

			if ( $.inArray( exporterName, affectedCountries ) < 0 ) {
				affectedCountries.push( exporterName );
			}							

			if ( $.inArray( importerName, affectedCountries ) < 0 ) {
				affectedCountries.push( importerName );
			}

			var vb = set.v;
			var exporterCountry = countryData[exporterName];
			if ( exporterCountry !== undefined ) {
  			if ( exporterCountry.mapColor === undefined ){
  				exporterCountry.mapColor = vb;
  			}
  			else {				
  				exporterCountry.mapColor += vb;
  			}
			}

			var importerCountry = countryData[importerName];
			if ( importerCountry !== undefined ) {
  			if ( importerCountry.mapColor === undefined ){
  				importerCountry.mapColor = vb;
  			}
  			else {				
  				importerCountry.mapColor += vb;
  			}
			}
		}		
	}
	
  for ( var width in linewidthToArcsInfo ) {
    var relevantArcsInfo = linewidthToArcsInfo[width];
    var arcsGeometry = createLineGeometry( relevantArcsInfo );
    var arcsMesh = makeArcMesh( arcsGeometry, width );
    meshes.push( arcsMesh );
  }
	var spikesMesh = new THREE.Mesh( spikeGeometries,
	    new THREE.MeshBasicMaterial( {vertexColors: THREE.FaceColors,
	      blending: THREE.AdditiveBlending, transparent: true}));
  spikesMesh.material.fullOpacity = 1;
  spikesMesh.material.side = THREE.FrontSide;
  meshes.push( spikesMesh );
	
	currMeshes = meshes;
	var meshesAndAffectedCountries = {};
  meshesAndAffectedCountries.meshes = meshes;
  meshesAndAffectedCountries.affectedCountries = affectedCountries;

	return meshesAndAffectedCountries;	
};

function selectVisualization( time, countries ){
  
	//	we're only doing one country for now so...
	var cName = countries[0].toUpperCase();
	
	previouslySelectedCountry = selectedCountry;
	if ( countries == allCountries ) {
	  selectedCountry = countryData['UNITED STATES'];
	  selectionData.selectedCountry = 'ALL';
	} else {
	  selectedCountry = countryData[cName];
	  if ( selectedCountry === undefined ) {
	    return;
	  }
	  selectionData.selectedCountry = selectedCountry.countryName;
	}
	$('#selectedCountryName').text( selectionData.selectedCountry );

	//	clear off the country's internally held color data we used from last highlight
	for( var i in countryData ){
		var country = countryData[i];
		country.mapColor = 0;
	}

	var prevMeshes = currMeshes;
	
	//	build the mesh
	console.time('getVisualizedMesh');
	var meshes = getVisualizedMeshes( time, countries );				
	console.timeEnd('getVisualizedMesh');
	
	animateBetweenMeshes( prevMeshes, meshes.meshes, COUNTRY_TRANSITION_MILLISECONDS );

	if( previouslySelectedCountry !== selectedCountry ){
		if( selectedCountry ){
			rotateTargetX = selectedCountry.lat * Math.PI/180;
			var targetY0 = -(selectedCountry.lon - 9) * Math.PI / 180;
      var piCounter = 0;
			while ( true ) {
        var targetY0Neg = targetY0 - Math.PI * 2 * piCounter;
        var targetY0Pos = targetY0 + Math.PI * 2 * piCounter;
        if( Math.abs(targetY0Neg - rotating.rotation.y) < Math.PI ) {
          rotateTargetY = targetY0Neg;
          break;
        } else if ( Math.abs(targetY0Pos - rotating.rotation.y) < Math.PI ) {
          rotateTargetY = targetY0Pos;
          break;
        }
        piCounter++;
        rotateTargetY = wrap( targetY0, -Math.PI, Math.PI );
			}
            //lines commented below source of rotation error
			//is there a more reliable way to ensure we don't rotate around the globe too much? 
			/*
			if( Math.abs(rotateTargetY - rotating.rotation.y) > Math.PI )
				rotateTargetY += Math.PI;		
			*/
			rotateVX *= 0.6;
			rotateVY *= 0.6;		
		}	
	}
};

function selectAllCountries() {
  selectVisualization( selectionData.selectedTime, allCountries );
};

function changeDisplayScale( scale, power ) {
  if ( timeBins === undefined ) {
    return;
  }
  for ( var i = 0; i < timeBins.length; i++ ) {
    var bin = timeBins[i].data;
    for ( var j = 0; j < bin.length; j++ ) {
      var set = bin[j];
      if ( scale == com.google.scaleEnum.LINEAR ) {
        set.v = Math.pow( set.lin_v, power );
      } else if ( scale == com.google.scaleEnum.LOG ) {
        set.v = Math.pow( set.log_v, power );
      }
      if ( set.arcInfo !== undefined ) {
        set.arcInfo.width = roundLinewidth( set.v );
      } else if ( set.spikeMesh !== undefined ) {
        set.spikeMesh.scale.z = (set.v * 200) + 0.1;
      }
    }
  }
  selectVisualization( selectionData.selectedTime, getSelectedCountries() );
};

function selectTime( time, switchVisualizedMeshes, animationDuration ) {
  selectionData.selectedTime = time;
  
  if ( !switchVisualizedMeshes ) {
    return;
  }
  
  var prevMeshes = currMeshes;
  
  console.time('getVisualizedMesh');
  var destinationMeshes =
      getVisualizedMeshes( selectionData.selectedTime, getSelectedCountries() ).meshes;
  console.timeEnd('getVisualizedMesh');
  
  animateBetweenMeshes( prevMeshes, destinationMeshes, animationDuration );
};

function animateBetweenMeshes( fromMeshes, toMeshes, animationDuration ) {
  //  add it to scene graph
  for ( var i = 0; i < toMeshes.length; i++ ) {
    if ( toMeshes[i].geometry.fullOpacityPerVertex !== undefined ) {  // arcs
      var opacities = toMeshes[i].geometry.attributes.opacity.array;
      for ( var j = 0; j < opacities.length; j++ ) {
        opacities[j] = 0;
      }
      toMeshes[i].geometry.attributes.opacity.needsUpdate = true;
    } else {
      toMeshes[i].material.opacity = 0;
    }
    visualizationMesh.add( toMeshes[i] );
  }
  for ( var i = 0; i < toMeshes.length; i++ ) {
    if ( toMeshes[i].geometry.fullOpacityPerVertex !== undefined ) {  // arcs
      tweenArcOpacities(toMeshes[i], 0, 1, animationDuration);
    } else {  // spikes
      tweenSpikeOpacity(toMeshes[i], 1, animationDuration);
    }
  }
  if ( fromMeshes !== undefined ) {
    for ( var i = 0; i < fromMeshes.length; i++ ) {
      if ( fromMeshes[i].geometry.fullOpacityPerVertex !== undefined ) {  // arcs
        tweenArcOpacities( fromMeshes[i], 1, 0, animationDuration );
      } else {  // spikes
        tweenSpikeOpacity( fromMeshes[i], 0, animationDuration );
      }
    }
    setTimeout( function() {
      for ( var i = 0; i < fromMeshes.length; i++ ) {
        visualizationMesh.remove( fromMeshes[i] );
      }
    }, animationDuration);
  }
};

function tweenArcOpacities( mesh, startT, endT, duration ) {
  var geometry = mesh.geometry;
  var opacities = geometry.attributes.opacity.array;
  var fullOpacities = geometry.fullOpacityPerVertex;
  new TWEEN.Tween( {t: startT} )
      .to( {t: endT}, duration )
      .easing( TWEEN.Easing.Linear.None )
      .onUpdate( function() {
          for ( var j = 0; j < opacities.length; j++ ) {
            opacities[j] = this.t * fullOpacities[j];
          }
          geometry.attributes.opacity.needsUpdate = true;
      })
      .start();
};

function tweenSpikeOpacity( mesh, endOpacity, duration ) {
  new TWEEN.Tween( mesh.material )
      .to( {opacity: endOpacity}, duration )
      .easing( TWEEN.Easing.Linear.None )
      .start();
};

function getSelectedCountries() {
  var countries = [selectionData.selectedCountry];
  if ( selectionData.selectedCountry == 'ALL' ) {
    countries = allCountries;
  }
  return countries;
};
