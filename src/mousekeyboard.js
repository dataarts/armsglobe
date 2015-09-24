import * as vizLines from './visualize_lines';

// Ugly variable declarations
const rotateXMax = 90 * Math.PI / 180;

let rotateVX = 0.35 * Math.PI / 180;
let mouseX = 0;
let mouseY = 0;
let pmouseX = 0;
let pmouseY = 0;
let dragging = false;
let rotateVY = 0;
let rotateTargetX = 0;
let rotateTargetY = 0;

let _autoRotateId = null;
const keyboard = new THREEx.KeyboardState();

export var rotateX = 0; // eslint-disable-line no-var, vars-on-top
export var rotateY = 0; // eslint-disable-line no-var, vars-on-top

export function updateRotation() {
  if (rotateTargetX && rotateTargetY) {
    rotateVX += (rotateTargetX - rotateX) * 0.012;
    rotateVY += (rotateTargetY - rotateY) * 0.012;

    if (Math.abs(rotateTargetX - rotateX) < 0.1 && Math.abs(rotateTargetY - rotateY) < 0.1) {
      rotateTargetX = undefined;
      rotateTargetY = undefined;
    }
  }

  rotateX += rotateVX;
  rotateY += rotateVY;

  rotateVX *= 0.98;
  rotateVY *= 0.98;

  if (dragging || rotateTargetX) {
    rotateVX *= 0.6;
    rotateVY *= 0.6;
  }

  // constrain the pivot up/down to the poles
  // force a bit of bounce back action when hitting the poles
  if (rotateX < -rotateXMax) {
    rotateX = -rotateXMax;
    rotateVX *= -0.95;
  }

  if (rotateX > rotateXMax) {
    rotateX = rotateXMax;
    rotateVX *= -0.95;
  }
}

export function startAutoRotate() {
  _autoRotateId = window.setInterval( () => {
    rotateVY += 0.1 * Math.PI / 180 * 0.3;
  }, 100 );
}

export function stopAutoRotate() { window.clearInterval( _autoRotateId ); }

export function onDocumentMouseMove( camera, event ) {
  pmouseX = mouseX;
  pmouseY = mouseY;

  mouseX = event.clientX - window.innerWidth * 0.5;
  mouseY = event.clientY - window.innerHeight * 0.5;

  if (dragging) {
    if (!keyboard.pressed( 'shift' )) {
      rotateVY += (mouseX - pmouseX) / 2 * Math.PI / 180 * 0.3;
      rotateVX += (mouseY - pmouseY) / 2 * Math.PI / 180 * 0.3;
    } else {
      camera.position.x -= (mouseX - pmouseX) * 0.5;
      camera.position.y += (mouseY - pmouseY) * 0.5;
    }
  }
}

export function onDocumentMouseDown( event ) {
  if (event.target.className.indexOf( 'noMapDrag' ) !== -1) {
    return;
  }

  dragging = true;
  pressX = mouseX;
  pressY = mouseY;
  rotateTargetX = undefined;
  rotateTargetX = undefined;
  stopAutoRotate();
}

export function onDocumentMouseUp() {
  dragging = false;
  startAutoRotate();
}

export function handleMWheel( delta, camera ) {
  camera.scale.z += delta * 0.1;
  camera.scale.z = vizLines.constrain( camera.scale.z, 0.7, 5.0 );
}

export function onMouseWheel( camera, event ) {
  let delta = 0;

  if (event.wheelDelta) {
    delta = event.wheelDelta / 120;
  } else if (event.detail) {
    delta = -event.detail / 3;
  }

  if (delta) {
    handleMWheel( delta, camera );
  }

  event.returnValue = false;
}
