function wrap(value, min, rangeSize) {
	rangeSize-=min;
    while (value < min) {
    	value += rangeSize;
	}
	return value % rangeSize;
}

THREE.Curve.Utils.createLineGeometry = function( points ) {
	var geometry = new THREE.Geometry();
	for( var i = 0; i < points.length; i ++ ) {
		geometry.vertices.push( points[i] );
	}
	return geometry;
};

function screenXY(vec3){
	var projector = new THREE.Projector();
	var vector = projector.projectVector( vec3.clone(), camera );
	var result = new Object();
    var windowWidth = window.innerWidth;
    var minWidth = 1280;
    if(windowWidth < minWidth) {
        windowWidth = minWidth;
    }
	result.x = Math.round( vector.x * (windowWidth/2) ) + windowWidth/2;
	result.y = Math.round( (0-vector.y) * (window.innerHeight/2) ) + window.innerHeight/2;
	return result;
}

 function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
