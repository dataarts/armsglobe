/**
ui.control.js
Created by Pitch Interactive
Created on 6/26/2012
This code will control the primary functions of the UI in the ArmsGlobe app
**/
var d3Graphs = {
    barGraphWidth: 300,
	barGraphHeight: 800,
	barGraphTopPadding: 20,
	barGraphBottomPadding: 50,
	barGraphSVG: d3.select("body").append("svg"),
	cumImportY: 0,cumExportY: 0,
    cumImportLblY: 0,cumExportLblY: 0,
    showHud: function() {
        $("#hudHeader").show();
    },
    drawBarGraph: function() {
        console.log('dbg');
        this.barGraphSVG.attr('id','barGraph').attr('width',d3Graphs.barGraphWidth).attr('height',d3Graphs.barGraphHeight);
        var importArray = [];
        var exportArray = [];
        var importTotal = selectedCountry.summary.imported.total;
        var exportTotal = selectedCountry.summary.exported.total;
        for(var type in reverseWeaponLookup) {
            importArray.push({"type":type, "amount":selectedCountry.summary.imported[type]});
            exportArray.push({"type":type, "amount":selectedCountry.summary.exported[type]});
        }
        var max = importTotal > exportTotal ? importTotal : exportTotal;
        var yScale = d3.scale.linear().domain([0,max]).range([0,this.barGraphHeight - this.barGraphBottomPadding - this.barGraphTopPadding]);
        var importRects = this.barGraphSVG.selectAll("rect.import").data(importArray);
        var midX = this.barGraphWidth / 2;
        this.cumImportY = this.cumExportY = 0;
        importRects.enter().append('rect').attr('class', function(d) {
            return 'import '+d.type;
        }).attr('x',midX - 20).attr('width',20);
        
        importRects.attr('y',function(d) {
            var value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumImportY - yScale(d.amount) ;
            d3Graphs.cumImportY += yScale(d.amount);
            return value;
        }).attr('height',function(d) { return yScale(d.amount); });
        var exportRects = this.barGraphSVG.selectAll('rect.export').data(exportArray);
        exportRects.enter().append('rect').attr('class',function(d) {
            return 'export '+ d.type;
        }).attr('x',midX + 10).attr('width',20);
        
        exportRects.attr('y',function(d) {
            var value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumExportY - yScale(d.amount);
            d3Graphs.cumExportY += yScale(d.amount);
            return value;
        }).attr('height',function(d) { return yScale(d.amount); });
        this.cumImportLblY = 0;
        this.cumExportLblY = 0;
        var importLabels = this.barGraphSVG.selectAll("g.importLabel").data(importArray);
        importLabels.enter().append("g").attr('class',function(d) {
            return 'importLabel '+d.type;
        });
        
        importLabels.attr('transform',function(d) { 
            var translate = 'translate('+(d3Graphs.barGraphWidth / 2 - 25)+",";
            var value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumImportLblY - yScale(d.amount)/2;
            d3Graphs.cumImportLblY += yScale(d.amount);
            translate += value+")";
            return translate;
        }).attr('display',function(d) {
            if(d.amount == 0) { return 'none';}
            return null;
        });
        importLabels.selectAll("*").remove();
        importLabels.append('text').text(function(d) {
            return reverseWeaponLookup[d.type].split(' ')[0].toUpperCase();
        }).attr('text-anchor','end').attr('y',15).attr('class',function(d){ return 'import '+d.type});
        importLabels.append('text').text(function(d) {
            return numberFormatCondens(d.amount);
        }).attr('text-anchor','end');
        var exportLabels = this.barGraphSVG.selectAll("g.exportLabel").data(exportArray);
        exportLabels.enter().append("g").attr('class',function(d) {
            return 'exportLabel '+d.type;
        })
        exportLabels.attr('transform',function(d) { 
            var translate = 'translate('+(d3Graphs.barGraphWidth / 2 + 35)+",";
            var value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumExportLblY - yScale(d.amount)/2;
            d3Graphs.cumExportLblY += yScale(d.amount);
            translate += value+")";
            return translate;
        }).attr('display',function(d) {
            if(d.amount == 0) { return 'none';}
            return null;
        });
        exportLabels.selectAll("*").remove();
        exportLabels.append('text').text(function(d) {
            return reverseWeaponLookup[d.type].split(' ')[0].toUpperCase();
        }).attr('y',15).attr('class',function(d) { return 'export '+ d.type});
        exportLabels.append('text').text(function(d) {
            return numberFormatCondens(d.amount);
        });
        
        var importTotalLabel = this.barGraphSVG.selectAll('text.totalLabel').data([1]);
        importTotalLabel.enter().append('text').attr('x',midX).attr('text-anchor','end')
            .attr('class','totalLabel').attr('y',this.barGraphHeight- this.barGraphBottomPadding + 25);
        console.log(importTotal);
        console.log(importTotalLabel);
        importTotalLabel.text(function(d) { console.log('total' + importTotal); return importTotal });
        var exportTotalLabel = this.barGraphSVG.selectAll('text.totalLabel.totalLabel2').data([1]);
        exportTotalLabel.enter().append('text').attr('x',midX+10).attr('class','totalLabel totalLabel2').attr('y', this.barGraphHeight - this.barGraphBottomPadding+25);
        exportTotalLabel.text(exportTotal);
        var importLabel = this.barGraphSVG.selectAll('text.importLabel').data([1]).enter().append('text').attr('x',midX).attr('text-anchor','end').text('IMPORTS')
            .attr('class','importLabel').attr('y', this.barGraphHeight - this.barGraphBottomPadding + 45);
        var exportLabel = this.barGraphSVG.selectAll('text.exportLabel').data([1]).enter().append('text').attr('x',midX+10).text('EXPORTS')
            .attr('class','exportLabel').attr('y', this.barGraphHeight - this.barGraphBottomPadding + 45);
        
    }
}

/*
This is going to be a number formatter. Example of use:

var bigNumber = 57028715;
var formated = numberFormatCondens(57028715);
return formated; //should show 57B for 57 Billion

*/
function numberFormatCondens( val ) {
    
    //strip out any strings ($,-etc)

    //how many decimal places
    //decPlaces = getDecimals(val);
    console.log("number"+ val);
    decPlaces = val.toString().length - 1;

    console.log( 'dec: ' + decPlaces );

    //enumerate abbreviations
    var abbrev = [ "K" , "M", "B", "T", "G" ]; //G would be a Gazillion! hopefully we won't ever see this.

    for( var i=abbrev.length - 1; i >= 0; i--) {

        var size = Math.pow(10, (i + 1) * 3 );

        if( size <= val ) {
            //round
            val = Math.round( val * decPlaces / size) / decPlaces;
            val = Math.round(val)/100; //allow for 2 decimal places

            //add letter for abbrev
            val += abbrev[i];

            break;
        }
    }
    return '$'+val;
}

