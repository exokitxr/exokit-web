if (window._ew) throw 'skipping layered ew.js';

import './src/webxr-polyfill.module.js';
import './src/HelioWebXRPolyfill.js';
import './src/event-target-shim.mjs';

import core from './src/core.js';

import symbols from './src/symbols.js';
import THREE from './lib/three-min.js';

import GlobalContext from './src/GlobalContext.js';

import {XREngine, XREngineTemplate} from './src/xr-engine.js';
window.XREngine = XREngine;
window.XREngineTemplate = XREngineTemplate;

import utils from './src/utils.js';
const {_makeNullPromise} = utils;

GlobalContext.args = {};
GlobalContext.version = '';

const args = {};
core.setArgs(args);
core.setVersion('0.0.1');

const windows = [];
GlobalContext.windows = windows;
GlobalContext.loadPromise = _makeNullPromise();

const xrState = (() => {
  const _makeSab = size => {
    const sab = new ArrayBuffer(size);
    let index = 0;
    return (c, n) => {
      const result = new c(sab, index, n);
      index += result.byteLength;
      return result;
    };
  };
  const _makeTypedArray = _makeSab(32*1024);

  const result = {};
  result.isPresenting = _makeTypedArray(Uint32Array, 1);
  result.isPresentingReal = _makeTypedArray(Uint32Array, 1);
  result.renderWidth = _makeTypedArray(Float32Array, 1);
  result.renderWidth[0] = window.innerWidth / 2 * window.devicePixelRatio;
  result.renderHeight = _makeTypedArray(Float32Array, 1);
  result.renderHeight[0] = window.innerHeight * window.devicePixelRatio;
  result.metrics = _makeTypedArray(Uint32Array, 2);
  result.metrics[0] = window.innerWidth;
  result.metrics[1] = window.innerHeight;
  result.devicePixelRatio = _makeTypedArray(Float32Array, 1);
  result.devicePixelRatio[0] = window.devicePixelRatio;
  result.stereo = _makeTypedArray(Uint32Array, 1);
  // result.stereo[0] = 1;
  result.canvasViewport = _makeTypedArray(Float32Array, 4);
  result.canvasViewport.set(Float32Array.from([0, 0, window.innerWidth, window.innerHeight]));
  result.depthNear = _makeTypedArray(Float32Array, 1);
  result.depthNear[0] = 0.1;
  result.depthFar = _makeTypedArray(Float32Array, 1);
  result.depthFar[0] = 2000.0;
  result.position = _makeTypedArray(Float32Array, 3);
  result.orientation = _makeTypedArray(Float32Array, 4);
  result.orientation[3] = 1;
  result.leftViewMatrix = _makeTypedArray(Float32Array, 16);
  result.leftViewMatrix.set(Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]));
  result.rightViewMatrix = _makeTypedArray(Float32Array, 16);
  result.rightViewMatrix.set(result.leftViewMatrix);
  // new THREE.PerspectiveCamera(110, 2, 0.1, 2000).projectionMatrix.toArray()
  result.leftProjectionMatrix = _makeTypedArray(Float32Array, 16);
  result.leftProjectionMatrix.set(Float32Array.from([0.3501037691048549, 0, 0, 0, 0, 0.7002075382097098, 0, 0, 0, 0, -1.00010000500025, -1, 0, 0, -0.200010000500025, 0]));
  result.rightProjectionMatrix = _makeTypedArray(Float32Array, 16);
  result.rightProjectionMatrix.set(result.leftProjectionMatrix);
  result.leftOffset = _makeTypedArray(Float32Array, 3);
  result.leftOffset.set(Float32Array.from([-0.625/2, 0, 0]));
  result.rightOffset = _makeTypedArray(Float32Array, 3);
  result.leftOffset.set(Float32Array.from([0.625/2, 0, 0]));
  result.leftFov = _makeTypedArray(Float32Array, 4);
  result.leftFov.set(Float32Array.from([45, 45, 45, 45]));
  result.rightFov = _makeTypedArray(Float32Array, 4);
  result.rightFov.set(result.leftFov);
  result.offsetEpoch = _makeTypedArray(Uint32Array, 1);
  const _makeGamepad = () => ({
    connected: _makeTypedArray(Uint32Array, 1),
    position: _makeTypedArray(Float32Array, 3),
    orientation: (() => {
      const result = _makeTypedArray(Float32Array, 4);
      result[3] = 1;
      return result;
    })(),
    direction: (() => { // derived
      const result = _makeTypedArray(Float32Array, 4);
      result[2] = -1;
      return result;
    })(),
    transformMatrix: (() => { // derived
      const result = _makeTypedArray(Float32Array, 16);
      result.set(Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]));
      return result;
    })(),
    buttons: (() => {
      const result = Array(10);
      for (let i = 0; i < result.length; i++) {
        result[i] = {
          pressed: _makeTypedArray(Uint32Array, 1),
          touched: _makeTypedArray(Uint32Array, 1),
          value: _makeTypedArray(Float32Array, 1),
        };
      }
      return result;
    })(),
    axes: _makeTypedArray(Float32Array, 10),
  });
  result.gamepads = (() => {
    const result = Array(2);
    for (let i = 0; i < result.length; i++) {
      result[i] = _makeGamepad();
    }
    return result;
  })();
  result.id = _makeTypedArray(Uint32Array, 1);
  result.hmdType = _makeTypedArray(Uint32Array, 1);
  result.tex = _makeTypedArray(Uint32Array, 1);
  result.depthTex = _makeTypedArray(Uint32Array, 1);
  result.msTex = _makeTypedArray(Uint32Array, 1);
  result.msDepthTex = _makeTypedArray(Uint32Array, 1);
  result.aaEnabled = _makeTypedArray(Uint32Array, 1);
  result.fakeVrDisplayEnabled = _makeTypedArray(Uint32Array, 1);
  result.blobId = _makeTypedArray(Uint32Array, 1);

  return result;
})();
GlobalContext.xrState = xrState;

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();

customElements.define('xr-engine', XREngine);
customElements.define('xr-engine-template', XREngineTemplate, {
  extends: 'template',
});

(async () => {

navigator.serviceWorker.register('/sw.js');

if (navigator.serviceWorker.controller) {
  GlobalContext.loadPromise.resolve();
} else {
  window.location.reload();
}

['keydown', 'keyup', 'keypress', 'paste'].forEach(type => {
  window.addEventListener(type, e => {
    const event = {
      altKey: e.altKey,
      charCode: e.charCode,
      code: e.code,
      ctrlKey: e.ctrlKey,
      // detail: e.detail,
      key: e.key,
      keyCode: e.keyCode,
      location: e.location,
      metaKey: e.metaKey,
      repeat: e.repeat,
      shiftKey: e.shiftKey,
      which: e.which,
      // timeStamp: e.timeStamp,
      clipboardData: e.clipboardData,
      preventDefault() {
        e.preventDefault();
      },
      stopPropagation() {
        e.stopPropagation();
      },
    };
    for (let i = 0; i < windows.length; i++) {
      windows[i].emit(type, event);
    }
  });
});
['mousedown', 'mouseup', 'click', 'dblclick', 'mousemove', 'wheel'].forEach(type => {
  window.addEventListener(type, e => {
    const event = {
      altKey: e.altKey,
      button: e.button,
      buttons: e.buttons,
      clientX: e.clientX,
      clientY: e.clientY,
      ctrlKey: e.ctrlKey,
      deltaMode: e.deltaMode,
      deltaX: e.deltaX,
      deltaY: e.deltaY,
      deltaZ: e.deltaZ,
      // detail: e.detail,
      layerX: e.layerX,
      layerY: e.layerY,
      metaKey: e.metaKey,
      movementX: e.movementX,
      movementY: e.movementY,
      offsetX: e.offsetX,
      offsetY: e.offsetY,
      pageX: e.pageX,
      pageY: e.pageY,
      screenX: e.screenX,
      screenY: e.screenY,
      shiftKey: e.shiftKey,
      // timeStamp: e.timeStamp,
      which: e.which,
      x: e.x,
      y: e.y,
    };
    for (let i = 0; i < windows.length; i++) {
      windows[i].emit(type, event);
    }
  });
});
window.addEventListener('resize', e => {
  xrState.metrics[0] = window.innerWidth;
  xrState.metrics[1] = window.innerHeight;
  xrState.devicePixelRatio[0] = window.devicePixelRatio;

  for (let i = 0; i < windows.length; i++) {
    windows[i].emit('resize', {});
  }
});
window.document.addEventListener('pointerlockchange', e => {
  const pointerLockElement = !!window.document.pointerLockElement;

  for (let i = 0; i < windows.length; i++) {
    windows[i].emit('pointerlockchange', {
      pointerLockElement,
    });
  }
});
window.addEventListener('drop', e => {
  console.log('drop event', e);
  /* const _readFiles = paths => {
    const result = [];

    return Promise.all(paths.map(p =>
      new Promise((accept, reject) => {
        fs.lstat(p, (err, stats) => {
          if (!err) {
            if (stats.isFile()) {
              fs.readFile(p, (err, data) => {
                if (!err) {
                  const file = new window.Blob([data]);
                  file.name = path.basename(p);
                  file.path = p;
                  result.push(file);

                  accept();
                } else {
                  reject(err);
                }
              });
            } else if (stats.isDirectory()) {
              fs.readdir(p, (err, fileNames) => {
                if (!err) {
                  _readFiles(fileNames.map(fileName => path.join(p, fileName)))
                    .then(files => {
                      result.push.apply(result, files);

                      accept();
                    })
                    .catch(err => {
                      reject(err);
                    });
                } else {
                  reject(err);
                }
              });
            } else {
              accept();
            }
          } else {
            reject(err);
          }
        });
      })
    ))
      .then(() => result);
  };

  _readFiles(data.paths)
    .then(files => {
      const dataTransfer = new window.DataTransfer({
        files,
      });
      const e = new window.DragEvent('drop');
      e.dataTransfer = dataTransfer;
      canvas.dispatchEvent(e);
    })
    .catch(err => {
      console.warn(err.stack);
    });
  break; */
});
window.addEventListener('contextmenu', e => {
  e.preventDefault();
});

const topVrPresentState = {
  /* hmdType: null,
  windowHandle: null,
  fbo: null,
  msFbo: 0,
  vrContext: null,
  vrSystem: null,
  vrCompositor: null,
  hasPose: false,
  mesher: null,
  planeTracker: null,
  handTracker: null,
  eyeTracker: null, */
};

const requests = [];
const handleRequest = req => {
  if (!_handleRequestImmediate(req)) {
    requests.push(req);
  }
};
GlobalContext.handleRequest = handleRequest;
const _handleRequestImmediate = req => {
  const {type, keypath} = req;

  const windowId = keypath.pop();
  const win = windows.find(win => win.id === windowId);

  const _respond = (error, result) => {
    if (win) {
      win.runAsync({
        method: 'response',
        keypath,
        error,
        result,
      });
    } else {
      console.warn('cannot find window to respond request to', windowId, windows.map(win => win.id));
    }
  };

  switch (type) {
    case 'makeProxyContext': {
      const ctx = win.install();
      _respond(null, ctx);
      break;
    }
    case 'requestPresent': {
      xrState.isPresenting[0] = 1;
      const ctx = win.install();
      _respond(null, ctx);
      break;
    }
    case 'exitPresent': {
      // topVrPresentState.fbo = null;
      xrState.isPresenting[0] = 0;
      _respond(null, null);
      break;
    }
    case 'requestHitTest': {
      const {origin, direction, coordinateSystem} = req;

      /* if (topVrPresentState.hmdType === 'fake') {
        if (!topVrPresentState.mesher) {
          _startFakeMesher();
        }
        topVrPresentState.mesher.requestHitTest(origin, direction, coordinateSystem)
          .then(result => {
            _respond(null, result);
          })
          .catch(err => {
            _respond(err);
          });
      } else { */
        _respond(null, []);
      // }

      return true;
    }
    default:
      return false;
  }
};
/* const _waitHandleRequests = () => {
  for (let i = 0; i < requests.length; i++) {
    _waitHandleRequest(requests[i]);
  }
  requests.length = 0;
}; */
const handlePointerLock = () => {
  window.document.body.requestPointerLock();
};
GlobalContext.handlePointerLock = handlePointerLock;
const handleHapticPulse = ({index, value, duration}) => {
  /* if (topVrPresentState.hmdType === 'openvr') {
    value = Math.min(Math.max(value, 0), 1);
    const deviceIndex = topVrPresentState.vrSystem.GetTrackedDeviceIndexForControllerRole(index + 1);

    const startTime = Date.now();
    const _recurse = () => {
      if ((Date.now() - startTime) < duration) {
        topVrPresentState.vrSystem.TriggerHapticPulse(deviceIndex, 0, value * 4000);
        setTimeout(_recurse, 50);
      }
    };
    setTimeout(_recurse, 50);
  } else { */
    console.warn(`ignoring haptic pulse: ${index}/${value}/${duration}`);
    // TODO: handle the other HMD cases...
  // }
};
GlobalContext.handleHapticPulse = handleHapticPulse;
const handlePaymentRequest = () => {
  throw new Error('no payment request handler');
};
GlobalContext.handlePaymentRequest = handlePaymentRequest;

const _computeDerivedGamepadsData = () => {
  const _deriveGamepadData = gamepad => {
    localQuaternion.fromArray(gamepad.orientation);
    localVector
      .set(0, 0, -1)
      .applyQuaternion(localQuaternion)
      .toArray(gamepad.direction);
    localVector.fromArray(gamepad.position);
    localVector2.set(1, 1, 1);
    localMatrix
      .compose(localVector, localQuaternion, localVector2)
      .toArray(gamepad.transformMatrix);
  };
  for (let i = 0; i < xrState.gamepads.length; i++) {
    _deriveGamepadData(xrState.gamepads[i]);
  }
};
const _tickAnimationFrame = win => {
  win.clear();
  return win.runAsync({
    method: 'tickAnimationFrame',
    layered: true,
  });
};
const _tickAnimationFrames = () => {
  for (let i = 0; i < windows.length; i++) {
    const win = windows[i];
    if (win.loaded) {
      _tickAnimationFrame(win);
    }
  }
};
core.animate = (timestamp, frame, referenceSpace) => {
  const session = core.getSession();
  if (session) {
    // console.log('animate session', session, frame, referenceSpace);
    // debugger;
    const pose = frame.getViewerPose(referenceSpace);
    if (pose) {
      const inputSources = Array.from(session.inputSources);
      const gamepads = navigator.getGamepads();

      const _loadHmd = () => {
        const {views} = pose;

        xrState.leftViewMatrix.set(views[0].transform.inverse.matrix);
        xrState.leftProjectionMatrix.set(views[0].projectionMatrix);

        xrState.rightViewMatrix.set(views[1].transform.inverse.matrix);
        xrState.rightProjectionMatrix.set(views[1].projectionMatrix);

        localMatrix
          .fromArray(xrState.leftViewMatrix)
          .getInverse(localMatrix)
          .decompose(localVector, localQuaternion, localVector2)
        localVector.toArray(xrState.position);
        localQuaternion.toArray(xrState.orientation);
      };
      _loadHmd();

      // console.log('got gamepads', gamepads);
      // debugger;
      const _loadGamepad = i => {
        const inputSource = inputSources[i];
        const xrGamepad = xrState.gamepads[i];

        let pose, gamepad;
        if (inputSource && (pose = frame.getPose(inputSource.targetRaySpace, referenceSpace)) && (gamepad = inputSource.gamepad || gamepads[i])) {
          const {transform} = pose;
          const {position, orientation, matrix} = transform;
          if (position) { // new WebXR api
            xrGamepad.position[0] = position.x;
            xrGamepad.position[1] = position.y;
            xrGamepad.position[2] = position.z;

            xrGamepad.orientation[0] = orientation.x;
            xrGamepad.orientation[1] = orientation.y;
            xrGamepad.orientation[2] = orientation.z;
            xrGamepad.orientation[3] = orientation.w;
          } else if (matrix) { // old WebXR api
            localMatrix
              .fromArray(transform.matrix)
              .decompose(localVector, localQuaternion, localVector2);

            xrGamepad.position[0] = localVector.x;
            xrGamepad.position[1] = localVector.y;
            xrGamepad.position[2] = localVector.z;

            xrGamepad.orientation[0] = localQuaternion.x;
            xrGamepad.orientation[1] = localQuaternion.y;
            xrGamepad.orientation[2] = localQuaternion.z;
            xrGamepad.orientation[3] = localQuaternion.w;
          }
          
          for (let j = 0; j < gamepad.buttons.length; j++) {
            const button = gamepad.buttons[j];
            const xrButton = xrGamepad.buttons[j];
            xrButton.pressed[0] = button.pressed;
            xrButton.touched[0] = button.touched;
            xrButton.value[0] = button.value;
          }
          
          for (let j = 0; j < gamepad.axes.length; j++) {
            xrGamepad.axes[j] = gamepad.axes[j];
          }
          
          xrGamepad.connected[0] = 1;
        } else {
          xrGamepad.connected[0] = 0;
        }
      };
      _loadGamepad(0);
      _loadGamepad(1);
    }

    const win = windows[0];
    const {canvas, ctx} = win;
    ctx.xrFramebuffer = session.renderState.baseLayer.framebuffer;
  }
  
  _computeDerivedGamepadsData();
  _tickAnimationFrames();
};
core.setSession(null);

})();
