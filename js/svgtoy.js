var assets = {};

function loadSVGAssets( filelist, callback ){
	var _this = this;
	this.svgList = [];

	this.tempCallback = function( svgToy ){		
		_this.svgList.push(svgToy);
		_this.checkFinished();
	}	

	this.checkFinished = function(){
		if( _this.svgList.length < filelist.length )
			loadSVGAsset( filelist[_this.svgList.length], _this.tempCallback );
		else
			callback( this.svgList );
	}	

	loadSVGAsset( filelist[0], this.tempCallback );	

}

function loadSVGAsset( filename, callback ){
	var _this = this;
	_this.filename = filename;				

	if( (filename in assets) === false ){					
		console.log("loading " + filename);
		//	reserve it so that multiple calls to this don't load multiple times
		assets[filename] = "";
		xhr = new XMLHttpRequest();
		xhr.open( 'GET', filename, true );
		xhr.send( null );	
		xhr.onreadystatechange = function() {					
			if ( xhr.readyState === 4 && xhr.status === 200 ) {
		    	var svgString = xhr.responseText;  	
				var dXML = new DOMParser();
				dXML.async = false;
				var svg = dXML.parseFromString( svgString, 'text/xml').documentElement;
				svg.svgText = svgString;
				assets[_this.filename] = svg;					
				console.log("loaded " + _this.filename);	
				callback(svg);
		    }
		};	
	}
}		


function SVGToy( svgFile, domContainer ){		
	var _this = this;	
	this.container = document.createElement('div');
	if( domContainer )
		domContainer.appendChild( this.container );

	this.parentContainer = domContainer;

	this.container.style['-webkit-transform-style'] = 'preserve-3d';
	this.container.style.position = 'absolute';
	this.container.style['pointer-events'] = 'none';

	//	find the asset
	this.svg = assets[svgFile].cloneNode(true);
	this.svg.style.position = 'relative';
	this.svg.style.display = 'block';
	this.svg.style['pointer-events'] = 'visibleFill';
	this.container.appendChild( this.svg );		

	this.origin = this.getOriginFromFile();
	this.setOrigin( this.origin.x, this.origin.y );

	this.TransformHelper = function(){
		this.value = '';

		this.translate = function(x,y){
			this.value += 'translate(' + x + ',' + y + ') ';
			return this;
		}
		this.rotate = function(angle){
			this.value += 'rotate(' + angle + ') ';
			return this;
		}
		this.rotateOrigin = function(angle, originX, originY){
			this.value += 'translate(' + originX + ',' + originY + ') ';
			this.value += 'rotate(' + angle + ') ';
			this.value += 'translate(' + -originX + ',' + -originY + ') ';				
			return this;
		}
		this.scale = function(s){
			this.value += 'scale(' + s + ') ';
			return this;
		}
		this.scaleOrigin = function(s, originX, originY){
			this.value += 'translate(' + originX + ',' + originY + ') ';
			this.value += 'scale(' + s + ') ';
			this.value += 'translate(' + -originX + ',' + -originY + ') ';	
			return this;
		}
		this.endTransform = function(){
			return this.value;
		}
	}	

	this.prepVars = function( vars ){
		if( vars._ox === undefined )
			vars._ox = _this.origin.x;
		if( vars._oy === undefined )
			vars._oy = _this.origin.y;		
		if( vars._tx === undefined )
			vars._tx = 0;
		if( vars._ty === undefined )
			vars._ty = 0;
		if( vars._ro === undefined )
			vars._ro = 0;
		if( vars._so === undefined )
			vars._so = 1;
		return vars;
	}

	this.getInitialStateFromElement = function( element, vars ){
		var state = {t:element};
		// console.log(state);
		for( prop in element ){
			// if( typeof element[prop] == 'SVGAnimatedLength' )
				// console.log(prop);
			console.log( typeof element[prop] );
		}
		// return state;
		return {};
	}

	this.setAnimation = function( elementName, keyframes ){
		var element = this.svg.getElementById( elementName );
		if( element === undefined || element === null )
			return;	

		// _this.getInitialStateFromElement( element, keyframes[0].vars );
		
		var lastEndState;
		var lastTween;
		var firstTween;		
		for( var i = 0; i<keyframes.length; i++ ){		
			var keyframe = keyframes[i];
			var duration = keyframe.duration !== undefined ? keyframe.duration : 1000;
			var easing = keyframe.easing !== undefined ? keyframe.easing : TWEEN.Easing.Linear.EaseNone;
			var loop = keyframe.loop;
			var loopedVars = keyframe.loopedVars;

			var beginState = {};	

			for( prop in keyframe.vars ){
				// console.log(prop);
				if( _this.isEscapeProperty(prop) )
					continue;
				if( (prop in beginState) == false ){
					beginState[prop] = 0;
				}
			}

			if( i > 0 ){
				beginState = keyframes[i - 1].vars;			
			}			

			//	copy over from begin state to keep the state from last animation
			var endState = keyframe.vars;
			for( var prop in beginState ) {
				if (!(prop in endState)) {
					endState[prop] = beginState[prop];
				}

				//	additive
				// else {
				// 	endState[prop] += beginState[prop];
				// }
			}

			var tween = _this.setTweenStates( elementName, beginState, endState, duration, easing );

			if( i == 0 ){
				firstTween = tween;
			}
			else{
				lastTween.chain( tween );
			}

			if( loop ){
				tween.chain( tween );
			}

			if( loopedVars !== undefined ){
				tween.onComplete( function(){
					for( var prop in loopedVars ){
						beginState[prop] = loopedVars[prop];
					}
				});
			}

			lastTween = tween;
		}
		firstTween.start();	
	}

	this.setTweenStates = function( elementName, beginState, endState, duration, easing ){
		_this.prepVars( beginState );
		_this.prepVars( endState );

		var state = beginState;
		var tween = _this.makeTween( state, endState, duration, easing, function(){
			var value = _this.beginTransform()		
			.translate( state._tx, state._ty)
			.rotateOrigin( state._ro, state._ox, state._oy )
			.scaleOrigin( state._so, state._ox, state._oy )							
			.endTransform();
			_this.setProperty( elementName, 'transform', value );
			for( prop in state ){
				if( _this.isEscapeProperty(prop) )
					continue;
				// console.log(state[prop]);
				_this.setProperty( elementName, prop, state[prop] );
			}
		});
		return tween;
	}

	this.makeTween = function( start, end, duration, easing, updatefunction ){
		var tween = new TWEEN.Tween( start );
		tween.to( end, duration );
		tween.easing( easing );
		tween.onUpdate(updatefunction);
		return tween;
	}

	this.isEscapeProperty = function( propName ){
		if( propName === '_ox' || propName === '_oy' || 
			propName === '_tx' || propName === '_ty' ||
			propName === '_ro' || propName === '_so' || 
			propName === 'duration' || propName === 'easing' ||
			propName === 'vars' || propName === 'loop' || 
			propName === 'loopedVars' )
			return true;
		return false;
	}		


}

SVGToy.prototype.getOriginFromFile = function(){
	if( this.svg === undefined )
		return {x:0,y:0};
	var originObject = this.svg.getElementById('Origin');					
	var p = {
		x : 0,
		y : 0
	};
	if( originObject === undefined || originObject === null )
		return {x:0,y:0};	

	p.x = parseFloat(originObject.getAttribute('cx'));
	p.y = parseFloat(originObject.getAttribute('cy'));

	return p;	
}

SVGToy.prototype.setOrigin = function( x, y ){
	this.svg.style.marginLeft = (-x) + 'px';
	this.svg.style.marginTop = (-y) + 'px';
	this.origin.x = x;
	this.origin.y = y;
};

SVGToy.prototype.setPosition = function( x, y, z ){
	this.container.style.left = x + 'px';
	this.container.style.top = y + 'px';			

	//	umm can't get this to work
	//	vvvvvvvvvvvvvvvvvvvvvvvvvv

	// this.container.style.webkitTransform = 'translate3d(' + x + ',' + y + ',' + 0 + ')';
	// var str = 'translate3d(' + x + 'px,' + y + 'px,' + z + 'px)';
	// console.log(str);
	// this.container.style['webkit-transform'] = str;
	// console.log(this.container.style.webkitTransform);
	// var fin = 'translate3d(' + x + ',' + y + ',' + '0' + ')'
	// console.log(fin);
	// console.log = function(){};
};

SVGToy.prototype.setAlpha = function( alpha ){
	this.container.style.opacity = alpha;
}

SVGToy.prototype.setZIndex = function( index ){
	this.container.style['z-index'] = index + '';
}

SVGToy.prototype.setScale = function( scale ){
	this.svg.style.width = (scale * 100) + "%";
	this.svg.style.height = (scale * 100) + "%";
	var transform = this.beginTransform().scaleOrigin(scale).endTransform();
	this.setProperty('transform', transform);
}

SVGToy.prototype.setProperty = function( elementName, elementProperty, value ){
	var element = this.svg.getElementById( elementName );
	if( element === undefined || element === null )
		return;
	element.setAttribute( elementProperty, value );
};

SVGToy.prototype.getProperty = function( elementName, elementProperty ){
	var element = this.svg.getElementById( elementName );
	if( element === undefined || element === null )
		return undefined;
	return element.getAttribute( elementProperty );
};

SVGToy.prototype.hide = function(){
	if( this.container.style.visibility === 'visibile' || this.container.style.visibility === undefined )
		if( this.hideEvent !== undefined )
			this.hideEvent();
	this.container.style.visibility = 'hidden';
	this.svg.style.visibility = 'hidden';
};

SVGToy.prototype.show = function(){
	if( this.container.style.visibility === 'hidden' || this.container.style.visibility === undefined )
		if( this.showEvent !== undefined )
			this.showEvent();		
	this.container.style.visibility = 'visible';
	this.svg.style.visibility = 'visible';
};

SVGToy.prototype.visibile = function(){
	return this.container.style.visibility == 'visible' ? true : false;
};

SVGToy.prototype.setText = function( elementName, value ){
	if( this.svg === undefined )
		return;
	var element = this.svg.getElementById( elementName );
	if( element === undefined || element === null )
		return undefined;
	element.textContent = value;
};

SVGToy.prototype.beginTransform = function(){
	return new this.TransformHelper();
};

SVGToy.prototype.removeFromDom = function(){
	this.parentContainer.removeChild( this.container );
};