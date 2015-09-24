// 3rd Party libraries (keep this in CommonJS syntax since it's not yet es6)
const us = require( 'underscore' );

// All our dependencies
import * as dataLoading from './dataloading';
import * as mouseKeyboard from './mousekeyboard';
import * as visualize from './visualize';
import * as geopins from './geopins';
import * as constants from './constants';

// React components
import Legend from './components/legend.jsx';
import Progress from './components/progress.jsx';

const masterContainer = document.getElementById( 'visualization' );
const glContainer = document.getElementById( 'glContainer' );

// Visualization components that need to be accessible throughout this module
let rotating = null;
let renderer = null;
let scene = null;
let camera = null;
let visualizationMesh = null;
let progressViz = null;

// Holds all the data we get back from the server
let _countryLookup = null;
let _latLonData = null;
let _sampleData = null;

// Used with our data pump. Allows us to evenly distribute the points
let _minDataTimestamp = null;
let _maxDataTimestamp = null;
let _remainingData = null;

function getDataForTick( startTime, endTime ) {
  // We could be smarter about this algorithm and keep track of our last
  // index into the data to speed up processing, but given that we'll only
  // be operating on a few thousand points at a time, we kept it fairly simple

  // If we're starting at the beginning, all our data is technically "remaining"
  if (startTime === _minDataTimestamp.getTime()) {
    _remainingData = _sampleData;
  }

  // This will split our array into two pieces: those points which fall into
  // the given "tick", and those that don't. Since time's advancing we know that
  // once a point satisfies this condition we won't use it again until we loop
  const partitions = us.partition( _remainingData, ( point ) => {
    const time = point.time.getTime();
    return ( time >= startTime ) && ( time <= endTime );
  });

  _remainingData = partitions[1];

  return partitions[0];
}

function startDataPump() {
  // How many times we'll be polling for data in a single "loop"
  const numPollingIntervals = constants.VIZ_LOOP_LENGTH / constants.VIZ_POLLING_INTERVAL;

  // keep track of the current polling interval for the progress viz
  let currPollingInterval = 0;

  // How much "real time" elapses in the data set
  const timeRangeInData = _maxDataTimestamp.getTime() - _minDataTimestamp.getTime();

  // How much "real time" we'll consume on each tick of the data pump
  const tickLength = Math.floor( timeRangeInData / numPollingIntervals );

  // keep track of our last "start time"
  let lastTime = _minDataTimestamp.getTime();

  window.setInterval( () => {
    const dataToViz = getDataForTick( lastTime, lastTime + tickLength );
    lastTime += tickLength;
    currPollingInterval++;

    if (lastTime >= _maxDataTimestamp.getTime()) {
      lastTime = _minDataTimestamp.getTime();
      currPollingInterval = 0;
    }

    visualize.initVisualization( dataToViz );
    progressViz.handleProgressUpdate( currPollingInterval / numPollingIntervals );
  }, constants.VIZ_POLLING_INTERVAL );
}

// All the initialization stuff for THREE.js
function initScene() {
  scene = new THREE.Scene();
  scene.matrixAutoUpdate = false;

  const light1 = new THREE.SpotLight( 0xeeeeee, 3 );
  light1.position.x = 730;
  light1.position.y = 520;
  light1.position.z = 626;
  light1.castShadow = true;
  scene.add( light1 );

  const light2 = new THREE.SpotLight( 0xeeeeee, 1.5 );
  light2.position.x = -730;
  light2.position.y = 520;
  light2.position.z = 626;
  light2.castShadow = true;
  scene.add( light2 );

  const light3 = new THREE.PointLight( 0x222222, 14.8 );
  light3.position.x = 0;
  light3.position.y = -750;
  light3.position.z = 0;
  scene.add( light3 );

  rotating = new THREE.Object3D();
  scene.add( rotating );

  const shaderMaterial = new THREE.MeshLambertMaterial({
    map: THREE.ImageUtils.loadTexture( 'images/map_outline.png' ),
  });

  // Create the backing (sphere)
  const sphere = new THREE.Mesh( new THREE.SphereGeometry( 100, 40, 40 ), shaderMaterial );
  sphere.doubleSided = false;
  sphere.rotation.x = Math.PI;
  sphere.rotation.y = -Math.PI / 2;
  sphere.rotation.z = Math.PI;
  rotating.add( sphere );

  visualizationMesh = new THREE.Object3D();
  rotating.add( visualizationMesh );

  // Set up our renderer
  renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.autoClear = false;
  renderer.sortObjects = false;
  renderer.generateMipmaps = false;
  glContainer.appendChild( renderer.domElement );

  // Setup our camera
  camera = new THREE.PerspectiveCamera( 12, window.innerWidth / window.innerHeight, 1, 20000 );
  camera.position.z = 1400;
  camera.position.y = 0;
  scene.add( camera );

  // Event listeners
  masterContainer.addEventListener( 'mousemove', mouseKeyboard.onDocumentMouseMove.bind( null, camera ), true );
  masterContainer.addEventListener( 'mousedown', mouseKeyboard.onDocumentMouseDown, true );
  masterContainer.addEventListener( 'mouseup', mouseKeyboard.onDocumentMouseUp, false );
  masterContainer.addEventListener( 'mousewheel', mouseKeyboard.onMouseWheel.bind( null, camera ), false );

  // firefox
  masterContainer.addEventListener( 'DOMMouseScroll', (e) => {
    const evt = window.event || e;
    mouseKeyboard.onMouseWheel( camera, evt );
  }, false );

  THREEx.WindowResize( renderer, camera ); // eslint-disable-line new-cap

  // Get the globe spinning (defined in mousekeyboard.js)
  mouseKeyboard.startAutoRotate();
}

function animate() {
  mouseKeyboard.updateRotation();

  rotating.rotation.x = mouseKeyboard.rotateX;
  rotating.rotation.y = mouseKeyboard.rotateY;

  requestAnimationFrame( animate );
  renderer.render( scene, camera );
}

// Loads our React components into the scene
function reactInit() {
  // Legend
  React.render(
    React.createElement( Legend, {
      types: constants.COLOUR_TYPES,
      clickCallback: visualize.toggleVisualizationType,
    }),
    document.getElementById( 'legend' )
  );

  // ... and our progress bar. We hold on to a ref so we can update its state as
  // we cycle through our data
  progressViz = React.render(
    React.createElement( Progress, null ),
    document.getElementById( 'progress' )
  );
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Startup code
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
if (!Detector.webgl) {
  Detector.addGetWebGLMessage();
} else {
  initScene();
  visualize.initMeshPool( constants.MESH_POOL_SIZE, visualizationMesh );

  // Render our React components
  reactInit();

  /*
  FIXME: We really shouldn't be doing all this loading and data manipulation
  client-side. The better solution is for a server-side process to combine
  everything together so that our data source contains nothing but a lat/long.
  That way, all we need to do is convert the lat/long to a vector in the scene's
  co-ordinate space and then start visualizing it.
  */
  dataLoading.loadCountryCodes( 'country_iso3166.json', ( isoData ) => {
    _countryLookup = isoData;
    dataLoading.loadWorldPins( 'country_lat_lon.json', ( latLonData ) => {
      _latLonData = latLonData;
      dataLoading.loadRandomizedContentData( 2000, _countryLookup, ( sampleData ) => {
        // need to convert all the timestamps to JS dates
        const mappedSampleData = us.map( sampleData, function mapSampleData( point ) {
          if (typeof point.time === Date) {
            return point;
          }
          point.time = new Date( point.time );
          return point;
        });

        _sampleData = us.sortBy( mappedSampleData, 'time' );
        _minDataTimestamp = _sampleData[0].time;
        _maxDataTimestamp = _sampleData[ _sampleData.length - 1 ].time;
        const countryData = geopins.loadGeoData( _latLonData, _countryLookup );
        visualize.buildDataVizGeometries( _sampleData, countryData );

        animate();
        startDataPump();
      });
    });
  });
}
