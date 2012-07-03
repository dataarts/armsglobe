var controllers = {
	category: 		"All",
	speed: 			3,							
	multiplier: 	0.5,
	lineWidth: 		2,		
	useOpacity: 	false,	
	opacityAmount: 	1,
	hueDiff: 		0.03,
	borderColor: 	"#6b647d",
	sphereColor: 	"#090903",
	backgroundColor:"#000000",
	textColor: 		"#ffffff",
	baseSize: 		165,
	ignoreUS: 		false,		
	zoom: 			1,
	spin: 			0,
	transitionTime: 2000,
	con: 			"",
};	

function buildGUI(){	
	var selection = new Selection();
	selectionData = selection;

	var updateVisualization = function(){
		var categories = selection.getCategories();		    		
		selectVisualization( timeBins, selection.selectedYear, [selection.selectedCountry], selection.importExportFilter, categories );	
	}		    	

	var changeFunction = function(v){
		updateVisualization();
	}	

	var filterFunction = function(v){
		if( selection.showExports && !selection.showImports )
			selection.importExportFilter = 'exports';
		else
		if( !selection.showExports && selection.showImports )
			selection.importExportFilter = 'imports';
		else
		if( selection.showExports && selection.showImports )
			selection.importExportFilter = 'both';
		else
			selection.importExportFilter = 'none';

		updateVisualization();	
	}	    	

	var categoryFunction = function(v){
		var selectedCategories = selection.getCategories();
		updateVisualization();
	}

	var gui = new dat.GUI();
	var c = gui.add( selection, 'selectedYear', selectableYears );
	c.onFinishChange( changeFunction );

	c = gui.add( selection, 'selectedCountry', selectableCountries );
	c.onFinishChange( changeFunction );		

	c = gui.add( selection, 'showExports' );
	c.onFinishChange( filterFunction );

	c = gui.add( selection, 'showImports' );
	c.onFinishChange( filterFunction );

	var catFilter = gui.addFolder('Weapon Types');
	for( var i in selection.categories ){
		var catSwitch = selection.categories[i];
		c = catFilter.add( selection.categories, i );	
		c.onFinishChange( categoryFunction );
	}
	
}