var controllers = {
	speed: 			3,							
	multiplier: 	0.5,
	backgroundColor:"#000000",
	zoom: 			1,
	spin: 			0,
	transitionTime: 2000,
};	

function buildGUI(){	
	var selection = new Selection();
	selectionData = selection;
    /*
	var updateVisualization = function(){
		selectVisualization( timeBins, selection.selectedYear, [selection.selectedCountry], selection.getExportCategories(), selection.getImportCategories() );	
	}		    	

	var changeFunction = function(v){
		updateVisualization();
	}	

	var categoryFunction = function(v){
		updateVisualization();
	}

	var gui = new dat.GUI();
	var c = gui.add( selection, 'selectedYear', selectableYears );
	c.onFinishChange( changeFunction );

	c = gui.add( selection, 'selectedCountry', selectableCountries );
	c.onFinishChange( changeFunction );		

	// c = gui.add( selection, 'showExports' );
	// c.onFinishChange( filterFunction );

	// c = gui.add( selection, 'showImports' );
	// c.onFinishChange( filterFunction );

	var catFilterExports = gui.addFolder('Exports');
	for( var i in selection.exportCategories ){
		var catSwitch = selection.exportCategories[i];
		c = catFilterExports.add( selection.exportCategories, i );	
		c.onFinishChange( categoryFunction );
	}

	var catFilterImports = gui.addFolder('Imports');
	for( var i in selection.importCategories ){
		var catSwitch = selection.importCategories[i];
		c = catFilterImports.add( selection.importCategories, i );	
		c.onFinishChange( categoryFunction );
	}	
	gui.close();
	*/
}