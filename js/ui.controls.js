/**
ui.control.js
Created by Pitch Interactive
Created on 6/26/2012
This code will control the primary functions of the UI in the ArmsGlobe app
**/
d3.selection.prototype.moveToFront = function() { 
    return this.each(function() { 
        this.parentNode.appendChild(this); 
    }); 
}; 

var d3Graphs = {
    barGraphWidth: 300,
	barGraphHeight: 800,
    barWidth: 14,
	barGraphTopPadding: 20,
	barGraphBottomPadding: 50,
	histogramWidth: 686,
	histogramHeight: 160,
	histogramLeftPadding:31,
	histogramRightPadding: 31,
	histogramVertPadding:20,
	barGraphSVG: d3.select("#wrapper").append("svg").attr('id','barGraph'),
	histogramSVG: null,
	histogramYScale: null,
	histogramXScale: null,
	cumImportY: 0,cumExportY: 0,
    cumImportLblY: 0,cumExportLblY: 0,
    inited: false,
    histogramOpen: false,
    handleLeftOffset: 12,
    handleInterval: 35,
    windowResizeTimeout: -1,
    histogramImports: null,
    histogramExports: null,
    histogramAbsMax: 0,
    previousImportLabelTranslateY: -1,
    previousExportLabelTranslateY: -1,
    zoomBtnInterval: -1,


    setCountry: function(country) {
        $("#hudButtons .countryTextInput").val(country);
        d3Graphs.updateViz();
    },
    initGraphs: function() {
        // return;
        this.showHud();
        // this.drawBarGraph();
        // this.drawHistogram();
    },
    showHud: function() {
        if(this.inited) return;
        this.inited = true;
        d3Graphs.windowResize();
        $("#hudHeader").show();
        // $("#hudButtons").show();
        // $("#history").show();
        // $("#graphIcon").show();
        $("#importExportBtns").show();
        $("#graphIcon").click(d3Graphs.graphIconClick);
        $("#history .close").click(d3Graphs.closeHistogram);
        $("#history ul li").click(d3Graphs.clickTimeline);
        $("#handle").draggable({axis: 'x',containment: "parent",grid:[this.handleInterval, this.handleInterval],  stop: d3Graphs.dropHandle, drag: d3Graphs.dropHandle });
        $("#hudButtons .searchBtn").click(d3Graphs.updateViz);
        $("#importExportBtns .imex>div").not(".label").click(d3Graphs.importExportBtnClick);
        $("#importExportBtns .imex .label").click(d3Graphs.importExportLabelClick);
        $("#hudButtons .countryTextInput").autocomplete({ source:selectableCountries, autoFocus: true });
        $("#hudButtons .countryTextInput").keyup(d3Graphs.countryKeyUp);
        $("#hudButtons .countryTextInput").focus(d3Graphs.countryFocus);
        $("#hudButtons .aboutBtn").click(d3Graphs.toggleAboutBox);
        $(document).on("click",".ui-autocomplete li",d3Graphs.menuItemClick);
        $(window).resize(d3Graphs.windowResizeCB);
        $(".zoomBtn").mousedown(d3Graphs.zoomBtnClick);
        $(".zoomBtn").mouseup(d3Graphs.zoomBtnMouseup);
        
    },
    zoomBtnMouseup: function() {
        clearInterval(d3Graphs.zoomBtnInterval);
    },
    zoomBtnClick:function() {
        var delta;
        if($(this).hasClass('zoomOutBtn')) {
            delta = -0.5;
        } else {
            delta = 0.5;
        }
        d3Graphs.doZoom(delta);
        d3Graphs.zoomBtnInterval = setInterval(d3Graphs.doZoom,50,delta);
    },
    doZoom:function(delta) {
        camera.scale.z += delta * 0.1;
        camera.scale.z = constrain( camera.scale.z, 0.8, 5.0 );
    },
    toggleAboutBox:function() {
        $("#aboutContainer").toggle();
    },
    clickTimeline:function() {
        var year = $(this).html();
        if(year < 10) {
            year = (year * 1) + 2000;
        }
        if(year < 100) {
            year = (year * 1) + 1900
        }
        var index = year - 1992;
        var leftPos = d3Graphs.handleLeftOffset + d3Graphs.handleInterval * index;
        $("#handle").css('left',leftPos+"px");
        d3Graphs.updateViz();
    },
    windowResizeCB:function() {
        clearTimeout(d3Graphs.windowResizeTimeout);
        d3Graphs.windowResizeTimeout = setTimeout(d3Graphs.windowResize, 50);
    },
    windowResize: function() {
        var windowWidth = $(window).width();
        var windowHeight = $(window).height();
        d3Graphs.positionHistory(windowWidth);
        var minWidth = 1280;
        var minHeight = 860;
        var w = windowWidth < minWidth ? minWidth : windowWidth;
        var hudButtonWidth = 489;
        $('#hudButtons').css('left',w - hudButtonWidth-20);        
        var importExportButtonWidth = $("#importExportBtns").width();
        $("#importExportBtns").css('left',w-importExportButtonWidth - 20);
        var barGraphHeight = 800;
        var barGraphBottomPadding = 10;
        console.log(windowHeight+ " " + barGraphHeight + " " + barGraphBottomPadding);
        var barGraphTopPos = (windowHeight < minHeight ? minHeight : windowHeight) - barGraphHeight - barGraphBottomPadding;
        console.log(barGraphTopPos);
        
        $("#barGraph").css('top',barGraphTopPos+'px');
        /*
        var hudHeaderLeft = $("#hudHeader").css('left');
        hudHeaderLeft = hudHeaderLeft.substr(0,hudHeaderLeft.length-2)
        console.log(hudHeaderLeft);
        var hudPaddingRight = 30;
        $("#hudHeader").width(w-hudHeaderLeft - hudPaddingRight);
        */
    },
    positionHistory: function(windowWidth) {
        var graphIconPadding = 20;
        var historyWidth = $("#history").width();
        var totalWidth = historyWidth + $("#graphIcon").width() + graphIconPadding;
//        var windowWidth = $(window).width();
        var historyLeftPos = (windowWidth - totalWidth) / 2.0;
        var minLeftPos = 280;
        if(historyLeftPos < minLeftPos) {
            historyLeftPos = minLeftPos;
        }
        $("#history").css('left',historyLeftPos+"px");
        $("#graphIcon").css('left',historyLeftPos + historyWidth + graphIconPadding+'px');
    },
    countryFocus:function(event) {
        //console.log("focus");
        setTimeout(function() { $('#hudButtons .countryTextInput').select() },50);
    },
    menuItemClick:function(event) {
        d3Graphs.updateViz();
    },
    countryKeyUp: function(event) {
        if(event.keyCode == 13 /*ENTER */) {
            d3Graphs.updateViz();
        }
    },
    
    updateViz:function() {
        var yearOffset = $("#handle").css('left');
        yearOffset = yearOffset.substr(0,yearOffset.length-2);
        yearOffset -= d3Graphs.handleLeftOffset;
        yearOffset /= d3Graphs.handleInterval;
        var year = yearOffset + 1992;
        
        var country = $("#hudButtons .countryTextInput").val().toUpperCase();
        if(typeof countryData[country] == 'undefined') {
            return;
        }
        
        //exports first
        var exportArray = []
        var exportBtns = $("#importExportBtns .exports>div").not(".label");
        for(var i = 0; i < exportBtns.length; i++) {
            var btn = $(exportBtns[i]);
            var weaponTypeKey = btn.attr('class');
            var weaponName = reverseWeaponLookup[weaponTypeKey];

            if(btn.find('.inactive').length == 0) {
                exportArray.push(weaponName);
                selectionData.exportCategories[weaponName] = true;
            } else {
                selectionData.exportCategories[weaponName] = false;
            }
        }
        //imports esecond
        var importArray = []
        var importBtns = $("#importExportBtns .imports>div").not(".label");
        for(var i = 0; i < importBtns.length; i++) {
            var btn = $(importBtns[i]);
            var weaponTypeKey = btn.attr('class');
            var weaponName = reverseWeaponLookup[weaponTypeKey];
            if(btn.find('.inactive').length == 0) {
                importArray.push(weaponName);
                selectionData.importCategories[weaponName] = true;
            } else {
                selectionData.importCategories[weaponName] = false;
            }
        }
        selectionData.selectedYear = year;
        selectionData.selectedCountry = country;
        selectVisualization(timeBins, year,[country],exportArray, importArray);
    },
    dropHandle:function() {
        d3Graphs.updateViz();
    },
    importExportLabelClick: function() {
        var btns = $(this).prevAll();
        var numInactive = 0;
        for(var i = 0; i < btns.length; i++) {
            if($(btns[i]).find('.inactive').length > 0) {
                numInactive++;
            }
        }
        if(numInactive <= 1) {
            //add inactive
            $(btns).find('.check').addClass('inactive');
        } else {
            //remove inactive
            $(btns).find('.check').removeClass('inactive');
        }
        d3Graphs.updateViz();
    },
    importExportBtnClick:function() { 
        var check = $(this).find('.check');
        if(check.hasClass('inactive')) {
            check.removeClass('inactive');
        } else {
            check.addClass('inactive');
        }
        d3Graphs.updateViz();
    },
    graphIconClick: function() {
        if(!d3Graphs.histogramOpen) {
            d3Graphs.histogramOpen = true;
            $("#history .graph").slideDown();
        } else {
            d3Graphs.closeHistogram();
        }
    },
    closeHistogram: function() {
        d3Graphs.histogramOpen = false;
        $("#history .graph").slideUp();
    },
    line: d3.svg.line()
        // assign the X function to plot our line as we wish
    .x(function(d,i) { 
        if(d == null) {
            return null;
        }
        return d3Graphs.histogramXScale(d.x) + d3Graphs.histogramLeftPadding; 
     })
    .y(function(d) { 
        if(d == null) {
            return null;
        }
        return d3Graphs.histogramYScale(d.y) + d3Graphs.histogramVertPadding; 
    }),
    setHistogramData:function() {
        var importArray = [];
        var exportArray = [];
        var historical = selectedCountry.summary.historical;
        var numHistory = historical.length;
        var absMax = 0;
        var startingImportIndex = 0;
        var startingExportIndex = 0;
        
        while(startingImportIndex < historical.length && historical[startingImportIndex].imports == 0) {
            startingImportIndex++;
        }
        while(startingExportIndex < historical.length && historical[startingExportIndex].exports == 0) {
            startingExportIndex++;
        }
        for(var i = 0; i < startingImportIndex; i++) {
//            importArray.push({x:i, y:null});
        }
        if(startingImportIndex != numHistory) {
            importArray.push({x: startingImportIndex, y:0});
        }
        for(var i = startingImportIndex + 1; i < numHistory; i++) {
            var importPrev = historical[startingImportIndex].imports;
            var importCur = historical[i].imports;
            var importDiff = (importCur - importPrev) / importPrev * 100;
            importArray.push({x:i, y:importDiff});
            if(Math.abs(importDiff) > absMax) {
                absMax = Math.abs(importDiff);
            }
            
        }
        for(var i = 0; i < startingExportIndex; i++) {
        //    exportArray.push(null);
        }
        if(startingExportIndex != numHistory) {
            exportArray.push({x: startingExportIndex, y: 0});
        }
        for(var i = startingExportIndex + 1; i < numHistory; i++) {    
            var exportPrev = historical[startingExportIndex].exports;
            var exportCur = historical[i].exports;
            var exportDiff = (exportCur - exportPrev) / exportPrev * 100;
            exportArray.push({x: i, y: exportDiff}); 
            if(Math.abs(exportDiff) > absMax) {
                absMax = Math.abs(exportDiff);
            }
            
        }
        this.histogramImportArray = importArray;
        this.histogramExportArray = exportArray;
        this.histogramAbsMax = absMax;
    },
    drawHistogram:function() {
        if(this.histogramSVG == null) {
            this.histogramSVG = d3.select('#history .container').append('svg');
            this.histogramSVG.attr('id','histogram').attr('width',this.histogramWidth).attr('height',this.histogramHeight);
        }
        this.setHistogramData();
        
        this.histogramYScale = d3.scale.linear().domain([this.histogramAbsMax,-this.histogramAbsMax]).range([0, this.histogramHeight - this.histogramVertPadding*2]);
        var maxX = selectedCountry.summary.historical.length - 1;
        this.histogramXScale = d3.scale.linear().domain([0,maxX]).range([0, this.histogramWidth - this.histogramLeftPadding - this.histogramRightPadding]);
        
        var tickData = this.histogramYScale.ticks(4);
        var containsZero = false;
        var numTicks = tickData.length;
        for(var i = 0; i < numTicks; i++) {
            if(tickData[i] == 0) {
                containsZero = true;
                break;
            }
        }
        if(!containsZero && numTicks != 0) {
            tickData.push(0);
        }
        //tick lines
        var ticks = this.histogramSVG.selectAll('line.tick').data(tickData);
        ticks.enter().append('svg:line').attr('class','tick');
        ticks.attr('y1',function(d) {
            return d3Graphs.histogramYScale(d) + d3Graphs.histogramVertPadding;
        }).attr('y2', function(d) {
            return d3Graphs.histogramYScale(d) + d3Graphs.histogramVertPadding;
        }).attr('x1',this.histogramLeftPadding).attr('x2',this.histogramWidth - this.histogramRightPadding)
        .attr('stroke-dasharray',function(d) {
            if(d == 0) {
              return null;
            }
            return '3,1';
        }).attr('stroke-width',function(d) {
            if(d == 0) {
                return 2;
            }
            return 1;
        });
        //tick labels
        var tickLabels = this.histogramSVG.selectAll("text.tickLblLeft").data(tickData);
        tickLabels.enter().append('svg:text').attr('class','tickLbl tickLblLeft').attr('text-anchor','end');
        tickLabels.attr('x', d3Graphs.histogramLeftPadding-3).attr('y',function(d) {
            return d3Graphs.histogramYScale(d) + d3Graphs.histogramVertPadding + 4;
        }).text(function(d) { return Math.abs(d); }).attr('display', function(d) {
            if(d == 0) { return 'none'; }
            return null;
        });
        var tickLabelsRight = this.histogramSVG.selectAll("text.tickLblRight").data(tickData);
        tickLabelsRight.enter().append('svg:text').attr('class','tickLbl tickLblRight');
        tickLabelsRight.attr('x', d3Graphs.histogramWidth - d3Graphs.histogramRightPadding+3).attr('y',function(d) {
            return d3Graphs.histogramYScale(d) + d3Graphs.histogramVertPadding + 4;
        }).text(function(d) { return Math.abs(d); }).attr('display', function(d) {
            if(d == 0) { return 'none'; }
            return null;
        });
        ticks.exit().remove();
        tickLabels.exit().remove();
        tickLabelsRight.exit().remove();
        //+ and -
        var plusMinus = this.histogramSVG.selectAll("text.plusMinus").data(["+","—","+","—"]); //those are &mdash;s
        plusMinus.enter().append('svg:text').attr('class','plusMinus').attr('text-anchor',function(d,i) {
            if(i < 2) return 'end';
            return null;
        }).attr('x',function(d,i) {
            var plusOffset = 3;
            if(i < 2) return d3Graphs.histogramLeftPadding + (d == '+' ? -plusOffset : 0) -2;
            return d3Graphs.histogramWidth - d3Graphs.histogramRightPadding + (d == '+' ? plusOffset : 0)+2;
        }).attr('y',function(d,i) {
            var yOffset = 10;
            return d3Graphs.histogramYScale(0) + d3Graphs.histogramVertPadding +  6 + (d == '+' ? -yOffset : yOffset); 
        }).text(String);
        //lines
        var importsVisible = $("#importExportBtns .imports .check").not(".inactive").length != 0;
        var exportsVisible = $("#importExportBtns .exports .check").not(".inactive").length != 0;
        $("#history .labels .exports").css('display', exportsVisible ? 'block' : 'none');
        $("#history .labels .imports").css('display', importsVisible ? 'block' : 'none');
        
    
        var importLine = this.histogramSVG.selectAll("path.import").data([1]);
        importLine.enter().append('svg:path').attr('class','import');
        importLine.attr('d',
        function(){
            if(d3Graphs.histogramImportArray.length == 0) {
                return 'M 0 0';
            } else {
                return d3Graphs.line(d3Graphs.histogramImportArray);
            }
        }).attr('visibility',importsVisible ? 'visible' : 'hidden');
        var exportLine = this.histogramSVG.selectAll("path.export").data([1]);
        exportLine.enter().append('svg:path').attr('class','export');
        exportLine.attr('d',function() {
            if(d3Graphs.histogramExportArray.length == 0) {
                return 'M 0 0';
            } else {
                return d3Graphs.line(d3Graphs.histogramExportArray);
            }
        }).attr('visibility', exportsVisible ? 'visible' : 'hidden');
        importLine.moveToFront();
        exportLine.moveToFront();
        //active year labels
        var yearOffset = $("#handle").css('left');
        yearOffset = yearOffset.substr(0,yearOffset.length-2);
        yearOffset -= d3Graphs.handleLeftOffset;
        yearOffset /= d3Graphs.handleInterval;
        var activeYearImports = null;
        for(var i = 0; i < this.histogramImportArray.length; i++) {
            var curYearData = this.histogramImportArray[i];
            if(curYearData.x == yearOffset) {
                activeYearImports = curYearData;
                break;
            }
        }
        var activeYearExports = null;
        for(var i = 0; i < this.histogramExportArray.length; i++) {
            var curYearData = this.histogramExportArray[i];
            if(curYearData.x == yearOffset) {
                activeYearExports = curYearData;
                break;
            }
        }
        var maxVal;
        if(activeYearImports != null && activeYearExports!= null) {
            maxVal = activeYearImports.y > activeYearExports.y ? activeYearImports.y : activeYearExports.y;
        } else if(activeYearImports != null) {
            maxVal = activeYearImports.y;
        } else if(activeYearExports != null) {
            maxVal = activeYearExports.y;
        } else {
            maxVal = -1;
        }

        var activeYearData = [{x:yearOffset, y: activeYearImports != null ? activeYearImports.y : -1, max: maxVal, show: activeYearImports!=null, type:"imports"},
            {x: yearOffset, y: activeYearExports != null ? activeYearExports.y : -1, max: maxVal, show:activeYearExports!=null, type:'exports'}];
        var yearDots = this.histogramSVG.selectAll("ellipse.year").data(activeYearData);
        var yearDotLabels = this.histogramSVG.selectAll("text.yearLabel").data(activeYearData);
        yearDots.enter().append('ellipse').attr('class','year').attr('rx',4).attr('ry',4)
            .attr('cx',function(d) { return d3Graphs.histogramLeftPadding + d3Graphs.histogramXScale(d.x); })
            .attr('cy',function(d) { return d3Graphs.histogramVertPadding + d3Graphs.histogramYScale(d.y); });
        yearDotLabels.enter().append('text').attr('class','yearLabel').attr('text-anchor','middle');
        var importsVisible = $("#importExportBtns .imports .check").not(".inactive").length != 0;
        var exportsVisible = $("#importExportBtns .exports .check").not(".inactive").length != 0;
        
        yearDots.attr('cx', function(d) { return d3Graphs.histogramLeftPadding + d3Graphs.histogramXScale(d.x); })
            .attr('cy',function(d) { return d3Graphs.histogramVertPadding + d3Graphs.histogramYScale(d.y); } )
            .attr('visibility', function(d) {
                if(d.show == false) {
                    return 'hidden';
                }
                if(d.type == "imports") {
                    return importsVisible ? 'visible' : 'hidden';
                } else if(d.type == "exports") {
                    return exportsVisible ? 'visible' : 'hidden';
                }
            });
        yearDotLabels.attr('x',function(d) { return d3Graphs.histogramLeftPadding + d3Graphs.histogramXScale(d.x); })
        .attr('y',function(d) {
            var yVal = d3Graphs.histogramYScale(d.y) + d3Graphs.histogramVertPadding;
            if(d.y == maxVal) {
                yVal -= 7;  
            } else {
                yVal += 19;
            }
            if(yVal > d3Graphs.histogramHeight + d3Graphs.histogramVertPadding) {
                yVal -= 26;
            }
            return yVal;
            
        }).text(function(d) {
            var numlbl = Math.round(d.y*10)/10;
            var lbl = "";
            if(d.y > 0) {
                lbl = "+";
            }
            lbl += ""+numlbl+"%";
            return lbl;

        }).attr('visibility', function(d) {
            if(d.show == false) {
                return 'hidden';
            }
            if(d.type == "imports") {
                return importsVisible ? 'visible' : 'hidden';
            } else if(d.type == "exports") {
                return exportsVisible ? 'visible' : 'hidden';
            }
        });
        yearDots.moveToFront();
        yearDotLabels.moveToFront();

    },
    drawBarGraph: function() {
        this.barGraphSVG.attr('id','barGraph').attr('width',d3Graphs.barGraphWidth).attr('height',d3Graphs.barGraphHeight).attr('class','overlayCountries noPointer');
        var importArray = [];
        var exportArray = [];
        var importTotal = selectedCountry.summary.imported.total;
        var exportTotal = selectedCountry.summary.exported.total;
        var minImExAmount = Number.MAX_VALUE;
        var maxImExAmount = Number.MIN_VALUE;
        for(var type in reverseWeaponLookup) {
            var imAmnt = selectedCountry.summary.imported[type];
            var exAmnt = selectedCountry.summary.exported[type];
            if(imAmnt < minImExAmount) {
                minImExAmount = imAmnt;
            }
            if(imAmnt > maxImExAmount) {
                maxImExAmount = imAmnt;
            }
            if(exAmnt < minImExAmount) {
                minImExAmount = exAmnt;
            }
            if(exAmnt > maxImExAmount) {
                maxImExAmount = exAmnt;
            }
            importArray.push({"type":type, "amount": imAmnt});
            exportArray.push({"type":type, "amount": exAmnt});
        }
        var max = importTotal > exportTotal ? importTotal : exportTotal;
        var yScale = d3.scale.linear().domain([0,max]).range([0,this.barGraphHeight - this.barGraphBottomPadding - this.barGraphTopPadding]);
        var importRects = this.barGraphSVG.selectAll("rect.import").data(importArray);
        var midX = this.barGraphWidth / 2;
        this.cumImportY = this.cumExportY = 0;
        importRects.enter().append('rect').attr('class', function(d) {
            return 'import '+d.type;
        }).attr('x',midX - this.barWidth).attr('width',this.barWidth);
        
        importRects.attr('y',function(d) {
            var value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumImportY - yScale(d.amount) ;
            d3Graphs.cumImportY += yScale(d.amount);
            return value;
        }).attr('height',function(d) { return yScale(d.amount); });
        var exportRects = this.barGraphSVG.selectAll('rect.export').data(exportArray);
        exportRects.enter().append('rect').attr('class',function(d) {
            return 'export '+ d.type;
        }).attr('x',midX + 10).attr('width',this.barWidth);
        
        exportRects.attr('y',function(d) {
            var value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumExportY - yScale(d.amount);
            d3Graphs.cumExportY += yScale(d.amount);
            return value;
        }).attr('height',function(d) { return yScale(d.amount); });
        //bar graph labels
        this.cumImportLblY = 0;
        this.cumExportLblY = 0;
        this.previousImportLabelTranslateY = 0;
        this.previousExportLabelTranslateY = 0;
        var paddingFromBottomOfGraph = 00;
        var heightPerLabel = 25;
        var fontSizeInterpolater = d3.interpolateRound(10,28);
        var smallLabelSize = 22;
        var mediumLabelSize = 40;
        //import labels
        var importLabelBGs = this.barGraphSVG.selectAll("rect.barGraphLabelBG").data(importArray);
        importLabelBGs.enter().append('rect').attr('class',function(d) {
            return 'barGraphLabelBG ' + d.type; });
        var importLabels = this.barGraphSVG.selectAll("g.importLabel").data(importArray);
        importLabels.enter().append("g").attr('class',function(d) {
            return 'importLabel '+d.type;
        });
        importLabels.attr('transform',function(d) { 
            var translate = 'translate('+(d3Graphs.barGraphWidth / 2 - 25)+",";
            var value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumImportLblY - yScale(d.amount)/2;
            d3Graphs.cumImportLblY += yScale(d.amount);
            translate += value+")";
            this.previousImportLabelTranslateY = value;
            return translate;
        }).attr('display',function(d) {
            if(d.amount == 0) { return 'none';}
            return null;
        });
        importLabels.selectAll("*").remove();
        var importLabelArray = importLabels[0];
        var importLabelBGArray = importLabelBGs[0];
        for(var i = 0; i < importLabelArray.length; i++) {
            var importLabelE = importLabelArray[i];
            var importLabel = d3.select(importLabelE);
            var data = importArray[i];
            importLabel.data(data);
            var pieceHeight = yScale(data.amount);
            var labelHeight = -1;
            var labelBGYPos = -1;
            var labelWidth = -1;
            var importLabelBG = d3.select(importLabelBGArray[i]);
            if(pieceHeight < smallLabelSize) {
                //just add number
                //console.log("small label");
                var numericLabel = importLabel.append('text').text(function(d) {
                    return abbreviateNumber(d.amount);
                }).attr('text-anchor','end').attr('alignment-baseline','central')
                .attr('font-size',function(d) {
                    return fontSizeInterpolater((d.amount-minImExAmount)/(maxImExAmount - minImExAmount));
                });
                labelHeight = fontSizeInterpolater((data.amount-minImExAmount)/(maxImExAmount-minImExAmount));
                labelBGYPos = - labelHeight / 2;
                var numericLabelEle = numericLabel[0][0];
                labelWidth = numericLabelEle.getComputedTextLength();
            } else if(pieceHeight < mediumLabelSize || data.type == 'ammo') {
                //number and type
                //console.log('medium label');
                var numericLabel = importLabel.append('text').text(function(d) {
                    return abbreviateNumber(d.amount);
                }).attr('text-anchor','end').attr('font-size',function(d) {
                    return fontSizeInterpolater((d.amount-minImExAmount)/(maxImExAmount - minImExAmount));
                });
                var textLabel = importLabel.append('text').text(function(d) {
                    return reverseWeaponLookup[d.type].split(' ')[0].toUpperCase();
                }).attr('text-anchor','end').attr('y',15).attr('class',function(d) { return 'import '+d.type});
                labelHeight = fontSizeInterpolater((data.amount-minImExAmount)/(maxImExAmount-minImExAmount));
                labelBGYPos = -labelHeight;
                labelHeight += 16;
                var numericLabelEle = numericLabel[0][0];
                var textLabelEle = textLabel[0][0];
                labelWidth = numericLabelEle.getComputedTextLength() > textLabelEle.getComputedTextLength() ? numericLabelEle.getComputedTextLength() : textLabelEle.getComputedTextLength();
            } else {
                //number type and 'weapons'
                //console.log('large label');
                var numericLabel = importLabel.append('text').text(function(d) {
                    return abbreviateNumber(d.amount);
                }).attr('text-anchor','end').attr('font-size',function(d) {
                    return fontSizeInterpolater((d.amount-minImExAmount)/(maxImExAmount - minImExAmount));
                }).attr('y',-7);
                var textLabel = importLabel.append('text').text(function(d) {
                    return reverseWeaponLookup[d.type].split(' ')[0].toUpperCase();
                }).attr('text-anchor','end').attr('y',8).attr('class',function(d) { return 'import '+d.type});
                var weaponLabel  =importLabel.append('text').text('WEAPONS').attr('text-anchor','end').attr('y',21)
                    .attr('class',function(d) { return'import '+d.type} );
                labelHeight = fontSizeInterpolater((data.amount-minImExAmount)/(maxImExAmount-minImExAmount));
                labelBGYPos = -labelHeight - 7;
                labelHeight += 16 +14;
                var numericLabelEle = numericLabel[0][0];
                var textLabelEle = textLabel[0][0];
                var weaponLabelEle = weaponLabel[0][0];
                labelWidth = numericLabelEle.getComputedTextLength() > textLabelEle.getComputedTextLength() ? numericLabelEle.getComputedTextLength() : textLabelEle.getComputedTextLength();
                if(weaponLabelEle.getComputedTextLength() > labelWidth) {
                    labelWidth = weaponLabelEle.getComputedTextLength();
                }
            }
            if(labelHeight != -1 && labelBGYPos != -1 && labelWidth != -1) {
                importLabelBG.attr('x',-labelWidth).attr('y',labelBGYPos).attr('width',labelWidth).attr('height',labelHeight)
                    .attr('transform',importLabel.attr('transform'));
            }
        }
        //export labels
        var exportLabelBGs = this.barGraphSVG.selectAll("rect.barGraphLabelBG.exportBG").data(exportArray);
        exportLabelBGs.enter().append('rect').attr('class',function(d) {
            return 'barGraphLabelBG exportBG ' + d.type; });
        var exportLabels = this.barGraphSVG.selectAll("g.exportLabel").data(exportArray);
        exportLabels.enter().append("g").attr('class',function(d) {
            return 'exportLabel '+d.type;
        });
        exportLabels.attr('transform',function(d) { 
            var translate = 'translate('+(d3Graphs.barGraphWidth / 2 + 35)+",";
            var value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumExportLblY - yScale(d.amount)/2;
            d3Graphs.cumExportLblY += yScale(d.amount);
            translate += value+")";
            this.previousExportLabelTranslateY = value;
            return translate;
        }).attr('display',function(d) {
            if(d.amount == 0) { return 'none';}
            return null;
        });
        exportLabels.selectAll("*").remove();
        var exportLabelArray = exportLabels[0];
        var exportLabelBGArray = exportLabelBGs[0];
        for(var i = 0; i < exportLabelArray.length; i++) {
            var exportLabelE = exportLabelArray[i];
            var exportLabel = d3.select(exportLabelE);
            var data = exportArray[i];
            exportLabel.data(data);
            var pieceHeight = yScale(data.amount);
            var labelHeight = -1;
            var labelBGYPos = -1;
            var labelWidth = -1;
            var exportLabelBG = d3.select(exportLabelBGArray[i]);
            if(pieceHeight < smallLabelSize) {
                //just add number
                //console.log("small label");
                var numericLabel = exportLabel.append('text').text(function(d) {
                    return abbreviateNumber(d.amount);
                }).attr('text-anchor','start').attr('alignment-baseline','central')
                .attr('font-size',function(d) {
                    return fontSizeInterpolater((d.amount-minImExAmount)/(maxImExAmount - minImExAmount));
                });
                labelHeight = fontSizeInterpolater((data.amount-minImExAmount)/(maxImExAmount-minImExAmount));
                labelBGYPos = - labelHeight / 2;
                var numericLabelEle = numericLabel[0][0];
                labelWidth = numericLabelEle.getComputedTextLength();
            } else if(pieceHeight < mediumLabelSize || data.type == 'ammo') {
                //number and type
                var numericLabel = exportLabel.append('text').text(function(d) {
                    return abbreviateNumber(d.amount);
                }).attr('text-anchor','start').attr('font-size',function(d) {
                    return fontSizeInterpolater((d.amount-minImExAmount)/(maxImExAmount - minImExAmount));
                });
                var textLabel = exportLabel.append('text').text(function(d) {
                    return reverseWeaponLookup[d.type].split(' ')[0].toUpperCase();
                }).attr('text-anchor','start').attr('y',15).attr('class',function(d) { return 'export '+d.type});
                labelHeight = fontSizeInterpolater((data.amount-minImExAmount)/(maxImExAmount-minImExAmount));
                labelBGYPos = -labelHeight;
                labelHeight += 16;
                var numericLabelEle = numericLabel[0][0];
                var textLabelEle = textLabel[0][0];
                labelWidth = numericLabelEle.getComputedTextLength() > textLabelEle.getComputedTextLength() ? numericLabelEle.getComputedTextLength() : textLabelEle.getComputedTextLength();
            } else {
                //number type and 'weapons'
                var numericLabel = exportLabel.append('text').text(function(d) {
                    return abbreviateNumber(d.amount);
                }).attr('text-anchor','start').attr('font-size',function(d) {
                    return fontSizeInterpolater((d.amount-minImExAmount)/(maxImExAmount - minImExAmount));
                }).attr('y',-7);
                var textLabel = exportLabel.append('text').text(function(d) {
                    return reverseWeaponLookup[d.type].split(' ')[0].toUpperCase();
                }).attr('text-anchor','start').attr('y',8).attr('class',function(d) { return 'export '+d.type});
                var weaponLabel  =exportLabel.append('text').text('WEAPONS').attr('text-anchor','start').attr('y',21)
                    .attr('class',function(d) { return'export '+d.type} );
                labelHeight = fontSizeInterpolater((data.amount-minImExAmount)/(maxImExAmount-minImExAmount));
                labelBGYPos = -labelHeight - 7;
                labelHeight += 16 +14;
                var numericLabelEle = numericLabel[0][0];
                var textLabelEle = textLabel[0][0];
                var weaponLabelEle = weaponLabel[0][0];
                labelWidth = numericLabelEle.getComputedTextLength() > textLabelEle.getComputedTextLength() ? numericLabelEle.getComputedTextLength() : textLabelEle.getComputedTextLength();
                if(weaponLabelEle.getComputedTextLength() > labelWidth) {
                    labelWidth = weaponLabelEle.getComputedTextLength();
                }
            }
            if(labelHeight != -1 && labelBGYPos != -1 && labelWidth != -1) {
                exportLabelBG.attr('x',0).attr('y',labelBGYPos).attr('width',labelWidth).attr('height',labelHeight)
                    .attr('transform',exportLabel.attr('transform'));
            }
        }
        //over all numeric Total Import/Export labels
        var importsVisible = $("#importExportBtns .imports .check").not(".inactive").length != 0;
        var exportsVisible = $("#importExportBtns .exports .check").not(".inactive").length != 0;
        var importTotalLabel = this.barGraphSVG.selectAll('text.totalLabel').data([1]);
        importTotalLabel.enter().append('text').attr('x',midX).attr('text-anchor','end')
            .attr('class','totalLabel').attr('y',this.barGraphHeight- this.barGraphBottomPadding + 25);
        importTotalLabel.text(abbreviateNumber(importTotal)).attr('visibility',importsVisible ? "visible":"hidden");
        var exportTotalLabel = this.barGraphSVG.selectAll('text.totalLabel.totalLabel2').data([1]);
        exportTotalLabel.enter().append('text').attr('x',midX+10).attr('class','totalLabel totalLabel2').attr('y', this.barGraphHeight - this.barGraphBottomPadding+25);
        exportTotalLabel.text(abbreviateNumber(exportTotal)).attr('visibility',exportsVisible ? "visible":"hidden");
        //Import label at bottom
        var importLabel = this.barGraphSVG.selectAll('text.importLabel').data([1]);
        importLabel.enter().append('text').attr('x',midX).attr('text-anchor','end').text('IMPORTS')
            .attr('class','importLabel').attr('y', this.barGraphHeight - this.barGraphBottomPadding + 45);
        importLabel.attr('visibility',importsVisible ? "visible":"hidden");
        //Export label at bottom
        var exportLabel = this.barGraphSVG.selectAll('text.exportLabel').data([1]);
        exportLabel.enter().append('text').attr('x',midX+10).text('EXPORTS')
            .attr('class','exportLabel').attr('y', this.barGraphHeight - this.barGraphBottomPadding + 45);
        exportLabel.attr('visibility',exportsVisible ? "visible":"hidden")        
    },
    dragHandleStart: function(event) {
        console.log('start');
        event.dataTransfer.setData('text/uri-list','yearHandle.png');
        event.dataTransfer.setDragImage(document.getElementById('handle'),0,0);
        event.dataTransfer.effectAllowed='move';
    }
}

/*
This is going to be a number formatter. Example of use:

var bigNumber = 57028715;
var formated = abbreviateNumber(57028715);
return formated; //should show 57B for 57 Billion

*/
function abbreviateNumber(value) {
    
    var newValue = value;
    if (value >= 1000) {
        var suffixes = ["", "K", "M", "B","T"];
        var suffixNum = Math.floor( (""+value).length/3 );
        var shortValue = '';
        for (var precision = 3; precision >= 1; precision--) {
            shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum) ) : value).toPrecision(precision));
            var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
            if (dotLessShortValue.length <= 3) { break; }
        }
        if (shortValue % 1 != 0)  shortNum = shortValue.toFixed(1);
        newValue = shortValue+suffixes[suffixNum];
    }
    return '$' + newValue;
}

