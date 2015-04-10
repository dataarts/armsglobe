import visualize from './visualize';
import constants from './constants';

const vec3_origin = new THREE.Vector3( 0, 0, 0 );
const vec3_x_axis = new THREE.Vector3( 1, 0, 0 );
const vec3_y_axis = new THREE.Vector3( 0, 1, 0 );
const vec3_z_axis = new THREE.Vector3( 0, 0, 1 );

let _meshPool = [];

// Used to keep track of which types we're not currently displaying
let _typeStatus = {};
constants.COLOUR_TYPES.forEach( (type) => {
  _typeStatus[ type ] = true;
});

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Module Exports
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export function buildDataVizGeometries( linearData, countryData ) {
  let loadLayer = document.getElementById( 'loading' );
  let count = 0;

  linearData.forEach( (set) => {
    let exporterName = set.src.toUpperCase();
    let importerName = set.dest.toUpperCase();

    let exporter = countryData[exporterName];
    let importer = countryData[importerName];

    // we couldn't find the country, it wasn't in our list...
    if( !exporter || !importer ) {
      return;
    }

    // visualize this event
    set.lineGeometry = vizLines.makeConnectionLineGeometry( exporter, importer );
  });

  loadLayer.style.display = 'none';
}

export function initMeshPool( poolSize, visualizationMesh ) {
  for( let i = 0; i < poolSize; i++ ) {
    _meshPool.push( new ParticleMesh( visualizationMesh ) );
  }
}

export function initParticleViz( linearData ) {
  // Return if we have no geometry, or our type has been toggled off
  if( !linearData.lineGeometry || !_typeStatus[ linearData.colour ] ) {
    return null;
  }

  _getMeshFromPool( ( meshObj ) => {
    // get our colour
    let color = _getColourFromTypeStr( linearData.colour );

    // merge it all together
    meshObj.linesGeo.merge( linearData.lineGeometry );
    let points = linearData.lineGeometry.vertices;
    let point = points[0];
    let particle = point.clone();
    particle.moveIndex = 0;
    particle.nextIndex = 1;
    particle.lerpN = 0;
    particle.path = points;
    meshObj.particlesGeo.vertices.push( particle );

    meshObj.traceLineMat.opacity = 1.0;

    meshObj.attributes.alpha.value.push( 1.0 );
    meshObj.attributes.customColor.value.push( color );

    // Create a trail for the particles by adding extra, slightly offset, particles
    for( let num = 0; num < constants.NUM_TRAIL_PARTICLES; num++ ) {
      let trail = particle.clone();
      trail.moveIndex = 0;
      trail.nextIndex = 1;
      trail.lerpN = -1 * constants.PARTICLE_SPEED * num;
      trail.path = points;

      meshObj.particlesGeo.vertices.push( trail );
      meshObj.attributes.alpha.value.push( 1.0 - ( constants.TRAIL_OPACITY_MULTIPLIER * num ) );
      meshObj.attributes.customColor.value.push( color );
    }

    // Set the explosion color, too
    meshObj.explosionSphere.material.color = color;
    meshObj.traceLineMat.color = color;

    // since colours have been updated, tell THREE to force an update
    meshObj.attributes.alpha.needsUpdate = true;
    meshObj.attributes.customColor.needsUpdate = true;

    meshObj.vizMesh.add( meshObj.splineOutline );
    meshObj.vizMesh.add( meshObj.traceLine );
    meshObj.startParticleUpdates();
  });
}

export function initVisualization( linearData ) {
  // build the meshes. One for each entry in our data
  linearData.forEach( (data) => {
    initParticleViz( data );
  });
}

export function toggleVisualizationType( type, isActive ) {
  _typeStatus[ type ] = isActive;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// HELPER METHODS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function _getMeshFromPool( callback ) {
  if( _meshPool.length > 0 ) {
    callback( _meshPool.shift() );
  } else {
    window.setTimeout( _getMeshFromPool, 500, callback );
  }
}

function _returnMeshToPool( mesh ) {
  // clean up the two geometries
  mesh.linesGeo.vertices = [];
  mesh.particlesGeo.vertices = [];
  mesh.pSystem.systemComplete = false;
  mesh.explosionSphere.complete = false;
  mesh.explosionSphere.lerpVal = constants.EXPLOSION_INITIAL_LERP_FACTOR;
  mesh.explosionSphere.finalPos = null;
  mesh.explosionSphere.rotationAxis = null;
  mesh.explosionSphere.material.opacity = 1.0;
  mesh.attributes.alpha.value = [];
  mesh.attributes.customColor.value = [];

  window.clearInterval( mesh.particleUpdateId );
  window.clearInterval( mesh.explosionUpdateId );

  // have to remove from the scene or else bad things happen
  mesh.vizMesh.remove( mesh.splineOutline );
  mesh.vizMesh.remove( mesh.traceLine );
  mesh.vizMesh.remove( mesh.explosionSphere );

  _meshPool.push( mesh );
}

function _getColourFromTypeStr( colorStr ) {
  let colour = constants.COLOUR_MAP[colorStr];
  if( !colour ) {
    colour = constants.COLOUR_MAP.r;
  }

  return colour;
}

class ParticleMesh {
  constructor( vizMesh ) {
    this.vizMesh = vizMesh;
    this.particleUpdateId = null;
    this.explosionUpdateId = null;
    this.linesGeo = new THREE.Geometry();
    this.particlesGeo = new THREE.Geometry();
    this.splineOutline = new THREE.Line( null, new THREE.LineBasicMaterial( { visible: false } ) );

    // Use custom shader to have the trail taper off in transparency
    this.attributes = {
      alpha: { type: 'f', value: [] },
      customColor: { type: 'c', value: [] }
    };

    this.uniforms = {
      color: { type: 'c', value: new THREE.Color( 0xffffff ) },
      texture: { type: 't', value: THREE.ImageUtils.loadTexture( "images/particleB.png" ) }
    };

    this.shaderMaterial = new THREE.ShaderMaterial({
      uniforms:       this.uniforms,
      attributes:     this.attributes,
      vertexShader:   document.getElementById( 'vertexshader' ).textContent,
      fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
      blending:       THREE.AdditiveBlending,
      transparent:    true,
      depthTest:      true,
      depthWrite:     false
    });

    this.pSystem = new THREE.PointCloud( this.particlesGeo, this.shaderMaterial );

    this.splineOutline.renderDepth = false;
    this.pSystem.dynamic = true;
    this.pSystem.systemComplete = false; // So we can know when to re-pool this mesh
    this.splineOutline.add( this.pSystem );
    this.splineOutline.geometry = this.linesGeo;

    // Trace line
    this.traceLineMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      opacity: 1.0,
      transparent: true
    });

    this.traceLine = new THREE.Line( new THREE.Geometry(), this.traceLineMat );
    for( let num = 0; num < constants.TRACE_LINE_VERTEX_COUNT; num++ ) {
      this.traceLine.geometry.vertices.push( vec3_origin.clone() );
    }

    // Elements for the explosion effect
    let explosionMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1.0,
      map: THREE.ImageUtils.loadTexture( 'images/explosion_texture_2.png' )
    });
    let explosionGeo = new THREE.SphereGeometry( 5, 32, 32 );

    this.explosionSphere = new THREE.Mesh( explosionGeo, explosionMat );
    this.explosionSphere.complete = false;
    this.explosionSphere.lerpVal = constants.EXPLOSION_INITIAL_LERP_FACTOR;
    this.explosionSphere.finalPos = null;
    this.explosionSphere.rotationAxis = null;

    this.explosionSphere.update = function( traceLine ) {
      if( this.complete ) return;

      if( !this.visible ) {
        this.visible = true;
      }

      if( this.lerpVal <= 0.0 ) {
        this.complete = true;
        this.visible = false;
        traceLine.visible = false;
        this.dispatchEvent( { type: 'ExplosionComplete' } );
        return;
      }

      this.lerpVal -= constants.EXPLOSION_INCREMENTAL_LERP;
      this.position.set( this.finalPos.x, this.finalPos.y, this.finalPos.z );
      this.position.lerp( vec3_origin, this.lerpVal );

      // This will "slurp up" the trace line
      for( let index = 0; index < traceLine.geometry.vertices.length; index++ ) {
        if( index > traceLine.slurpIndex ||
          traceLine.slurpIndex >= traceLine.geometry.vertices.length ) {
          break;
        }
        vertex.copy( traceLine.geometry.vertices[ traceLine.slurpIndex ] );
      }

      traceLine.slurpIndex++;
      traceLine.geometry.verticesNeedUpdate = true;
      traceLine.material.opacity -= constants.TRACE_LINE_OPACITY_LERP;

      this.rotateOnAxis( this.rotationAxis, constants.EXPLOSION_ROTATION_ANGLE );

      // Don't start fading out until we're half done
      if( this.lerpVal <= constants.EXPLOSION_INITIAL_LERP_FACTOR / 2 ) {
        this.material.opacity -= constants.EXPLOSION_OPACITY_LERP;
      }
    };


    this.pSystem.addEventListener( 'ParticleSystemComplete', this.runExplosion.bind( this ) );
    this.explosionSphere.addEventListener( 'ExplosionComplete', _returnMeshToPool.bind( this, this ) );

    // This update method is what actually gets our points moving across the scene.
    // Once the point has finished its path, this method will emit a "ParticleSystemComplete"
    // event, to allow us to re-pool the mesh.
    this.pSystem.update = function( traceLine ) {
      // no point doing all the calculations if the particle is already done
      if( this.systemComplete ) return;

      // Ensure we're visible
      if( !this.visible ) {
        this.visible = true;
        traceLine.visible = true;
      }

      for( let i = 0; i < this.geometry.vertices.length; i++ ) {
        let particle = this.geometry.vertices[i];
        let path = particle.path;

        particle.lerpN += constants.PARTICLE_SPEED;
        if( particle.lerpN > 1 ) {
          particle.lerpN = 0;
          particle.moveIndex = particle.nextIndex;
          particle.nextIndex++;

          if( i === 0 ) {
            // decrease the opacity of the trace line material so that
            // it's at 0.3 when we're done (The explosion routine handles
            // the remaining transparency)
            traceLine.material.opacity -= (0.7 / path.length);
          }

          if( particle.nextIndex >= path.length ) {
            particle.moveIndex = 0;
            particle.nextIndex = 0;

            // Even though there are multiple particles in the system now, we still
            // do things this way as we don't really care if the "trail" has completed
            this.systemComplete = true;

            // Make ourselves invisible. This resolves an issue where a pooled mesh
            // would "flicker" when being reset
            this.visible = false;
            this.dispatchEvent( { type: 'ParticleSystemComplete' } );
            return;
          }
        }

        let currentPoint = path[particle.moveIndex];
        let nextPoint = path[particle.nextIndex];

        particle.copy( currentPoint );
        particle.lerp( nextPoint, particle.lerpN );
      }

      for( let index = 0; index < traceLine.geometry.vertices.length; index++ ) {
        let vertex = traceLine.geometry.vertices[index];
        if( index >= particle.moveIndex ) {
          vertex.copy( currentPoint );
          vertex.lerp( nextPoint, particle.lerpN );
        }
      }
      traceLine.geometry.verticesNeedUpdate = true;

      this.geometry.verticesNeedUpdate = true;
    };
  }

  runExplosion() {
    let path = this.particlesGeo.vertices[0].path;

    // The final array element is the origin, hence the -2 offset
    let finalPt = path[ path.length - 2 ];
    let color = this.attributes.customColor.value[0].getHex();

    // To help "slurp up" the trace line
    this.traceLine.slurpIndex = 0;

    // Decide which axis this explosion is going to rotate about
    let choice = Math.floor( Math.random() * 3 );
    switch( choice ) {
      case 0:
        this.explosionSphere.rotationAxis = vec3_x_axis;
        break;
      case 1:
        this.explosionSphere.rotationAxis = vec3_y_axis;
        break;
      case 2:
        this.explosionSphere.rotationAxis = vec3_z_axis;
        break;
    }

    this.explosionSphere.finalPos = finalPt.clone();
    this.explosionSphere.position.set( finalPt.x, finalPt.y, finalPt.z );
    this.explosionSphere.position.lerp( vec3_origin, this.explosionSphere.lerpVal );
    this.explosionUpdateId = window.setInterval( this.explosionSphere.update.bind( this.explosionSphere, this.traceLine ), 16 );
    this.vizMesh.add( this.explosionSphere );
  }

  startParticleUpdates() {
    // 16ms interval is approx a 60FPS refresh rate
    this.particleUpdateId = window.setInterval( this.pSystem.update.bind( this.pSystem, this.traceLine ), 16 );
  }
}
