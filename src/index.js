import core from './core.js';
import minimist from '../modules/minimist.js';

import {defaultEyeSeparation, maxNumTrackers} from './constants.js';
import symbols from './symbols.js';
import THREE from '../lib/three-min.js';

import {getHMDType, lookupHMDTypeIndex, FakeMesher, FakePlaneTracker} from './VR.js';

import GlobalContext from './GlobalContext.js';

import './xr-iframe.js';

let bootstrapped = false;
const _bootstrap = () => {

if (bootstrapped) {
  return;
}

GlobalContext.args = {};
GlobalContext.version = '';
GlobalContext.onbeforeload = null;

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();

const args = {};
core.setArgs(args);
core.setVersion('0.0.1');

function setOptions(opts) {
  opts = opts || {};
  if (opts.onbeforeload) {
    GlobalContext.onbeforeload = onbeforeload;
  }
}

const windows = [];
GlobalContext.windows = windows;
// const contexts = [];

const xrState = (() => {
  const _makeSab = size => {
    const sab = new SharedArrayBuffer(size);
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
  result.renderWidth = _makeTypedArray(Float32Array, 1);
  result.renderWidth[0] = 1920/2;
  result.renderHeight = _makeTypedArray(Float32Array, 1);
  result.renderHeight[0] = 1080;
  result.metrics = _makeTypedArray(Uint32Array, 2);
  result.metrics[0] = window.innerWidth;
  result.metrics[1] = window.innerHeight;
  result.devicePixelRatio = _makeTypedArray(Float32Array, 1);
  result.devicePixelRatio[0] = window.devicePixelRatio;
  result.depthNear = _makeTypedArray(Float32Array, 1);
  result.depthNear[0] = 0.1;
  result.depthFar = _makeTypedArray(Float32Array, 1);
  result.depthFar[0] = 10000.0;
  result.position = _makeTypedArray(Float32Array, 3);
  result.orientation = _makeTypedArray(Float32Array, 4);
  result.orientation[3] = 1;
  result.leftViewMatrix = _makeTypedArray(Float32Array, 16);
  result.leftViewMatrix.set(Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]));
  result.rightViewMatrix = _makeTypedArray(Float32Array, 16);
  result.rightViewMatrix.set(result.leftViewMatrix);
  result.leftProjectionMatrix = _makeTypedArray(Float32Array, 16);
  result.leftProjectionMatrix.set(Float32Array.from([0.5625000000000001, 0, 0, 0, 0, 1.0000000000000002, 0, 0, 0, 0, -1.0002000200020003, -1, 0, 0, -0.20002000200020004, 0]));
  result.rightProjectionMatrix = _makeTypedArray(Float32Array, 16);
  result.rightProjectionMatrix.set(result.leftProjectionMatrix);
  result.leftOffset = _makeTypedArray(Float32Array, 3);
  result.leftOffset.set(Float32Array.from([-defaultEyeSeparation/2, 0, 0]));
  result.rightOffset = _makeTypedArray(Float32Array, 3);
  result.leftOffset.set(Float32Array.from([defaultEyeSeparation/2, 0, 0]));
  result.leftFov = _makeTypedArray(Float32Array, 4);
  result.leftFov.set(Float32Array.from([45, 45, 45, 45]));
  result.rightFov = _makeTypedArray(Float32Array, 4);
  result.rightFov.set(result.leftFov);
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
    bones: _makeTypedArray(Float32Array, 31*16),
  });
  result.gamepads = (() => {
    const result = Array(2 + maxNumTrackers);
    for (let i = 0; i < result.length; i++) {
      result[i] = _makeGamepad();
    }
    return result;
  })();
  result.hands = (() => {
    const result = Array(2);
    for (let i = 0; i < result.length; i++) {
      const hand = _makeGamepad();
      hand.wrist = (() => {
        const result = Array(4);
        for (let i = 0; i < result.length; i++) {
          result[i] = _makeTypedArray(Float32Array, 3);
        }
        return result;
      })();
      hand.fingers = (() => {
        const result = Array(5);
        for (let i = 0; i < result.length; i++) {
          result[i] = (() => {
            const result = Array(4);
            for (let i = 0; i < result.length; i++) {
              result[i] = _makeTypedArray(Float32Array, 3);
            }
            return result;
          })();
        }
        return result;
      })();
      result[i] = hand;
    }
    return result;
  })();
  result.eye = _makeGamepad();
  result.id = _makeTypedArray(Uint32Array, 1);
  result.hmdType = _makeTypedArray(Uint32Array, 1);
  result.tex = _makeTypedArray(Uint32Array, 1);
  result.depthTex = _makeTypedArray(Uint32Array, 1);
  result.msTex = _makeTypedArray(Uint32Array, 1);
  result.msDepthTex = _makeTypedArray(Uint32Array, 1);
  result.aaEnabled = _makeTypedArray(Uint32Array, 1);
  result.fakeVrDisplayEnabled = _makeTypedArray(Uint32Array, 1);
  result.meshing = _makeTypedArray(Uint32Array, 1);
  result.planeTracking = _makeTypedArray(Uint32Array, 1);
  result.handTracking = _makeTypedArray(Uint32Array, 1);
  result.eyeTracking = _makeTypedArray(Uint32Array, 1);
  result.blobId = _makeTypedArray(Uint32Array, 1);

  return result;
})();
GlobalContext.xrState = xrState;

['keydown', 'keyup', 'keypress'].forEach(type => {
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
  hmdType: null,
  windowHandle: null,
  fbo: 0,
  msFbo: 0,
  vrContext: null,
  vrSystem: null,
  vrCompositor: null,
  hasPose: false,
  mesher: null,
  planeTracker: null,
  handTracker: null,
  eyeTracker: null,
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

  const _respond = (error, result) => {
    const windowId = keypath.pop();
    const window = windows.find(win => win.id === windowId);
    if (window) {
      window.runAsync({
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
    case 'requestHitTest': {
      const {origin, direction, coordinateSystem} = req;

      if (topVrPresentState.hmdType === 'fake') {
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
      } else if (topVrPresentState.hmdType === 'magicleap') {
        topVrPresentState.vrContext.requestHitTest(origin, direction, coordinateSystem)
          .then(result => {
            _respond(null, result);
          })
          .catch(err => {
            _respond(err);
          });
      } else {
        _respond(null, []);
      }

      return true;
    }
    default:
      return false;
  }
};
const _waitHandleRequests = () => {
  for (let i = 0; i < requests.length; i++) {
    _waitHandleRequest(requests[i]);
  }
  requests.length = 0;
};
const _waitHandleRequest = ({type, keypath}) => {
  if (type === 'requestPresent' && topVrPresentState.hmdType === null) {
    const hmdType = getHMDType();
    // console.log('request present', hmdType);

    /* if (!topVrPresentState.windowHandle) {
      topVrPresentState.windowHandle = nativeBindings.nativeWindow.createWindowHandle(1, 1, false);
    }
    nativeBindings.nativeWindow.setCurrentWindowContext(topVrPresentState.windowHandle); */

    /* if (hmdType === 'fake') {
      const width = xrState.renderWidth[0]*2;
      const height = xrState.renderHeight[0];

      const [fbo, tex, depthTex, msFbo, msTex, msDepthTex] = nativeBindings.nativeWindow.createVrTopRenderTarget(width, height);

      topVrPresentState.fbo = fbo;
      topVrPresentState.msFbo = msFbo;
      xrState.tex[0] = tex;
      xrState.depthTex[0] = depthTex;
      xrState.msTex[0] = msTex;
      xrState.msDepthTex[0] = msDepthTex;
    } */

    topVrPresentState.hmdType = hmdType;

    xrState.isPresenting[0] = 1;
    xrState.hmdType[0] = lookupHMDTypeIndex(hmdType);
  } else if (topVrPresentState.hmdType !== null && type === 'exitPresent') {
    if (topVrPresentState.hmdType === 'fake') {
      // XXX destroy fbo
    } else {
      throw new Error(`fail to exit present for hmd type ${topVrPresentState.hmdType}`);
    }

    topVrPresentState.hmdType = null;
    topVrPresentState.fbo = null;

    xrState.isPresenting[0] = 0;
    xrState.hmdType[0] = 0;
  }

  const windowId = keypath.pop();
  const window = windows.find(win => win.id === windowId);
  if (window) {
    window.runAsync({
      method: 'response',
      keypath,
    });
  } else {
    console.warn('cannot find window to respond request to', windowId, windows.map(win => win.id));
  }
};
const handlePointerLock = () => {
  window.document.body.requestPointerLock();
};
GlobalContext.handlePointerLock = handlePointerLock;
const handleHapticPulse = ({index, value, duration}) => {
  if (topVrPresentState.hmdType === 'openvr') {
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
  } else {
    console.warn(`ignoring haptic pulse: ${index}/${value}/${duration}`);
    // TODO: handle the other HMD cases...
  }
};
GlobalContext.handleHapticPulse = handleHapticPulse;
const handlePaymentRequest = () => {
  throw new Error('no payment request handler');
};
GlobalContext.handlePaymentRequest = handlePaymentRequest;

const _startTopRenderLoop = () => {
  /* const timestamps = {
    frames: 0,
    last: Date.now(),
    idle: 0,
    wait: 0,
    events: 0,
    media: 0,
    user: 0,
    submit: 0,
    total: 0,
  }; */
  // const TIMESTAMP_FRAMES = 100;
  // let lastFrameTime = Date.now();
  // let frame = null;
  // const canvases = [];

  /* if (nativeBindings.nativeWindow.pollEvents) {
    setInterval(() => {
      nativeBindings.nativeWindow.pollEvents();
    }, 1000/60); // XXX make this run at the native frame rate
  }
  if (nativeBindings.nativeBrowser && nativeBindings.nativeBrowser.Browser && nativeBindings.nativeBrowser.Browser.pollEvents) {
    setInterval(() => {
      nativeBindings.nativeBrowser.Browser.pollEvents();
    }, 1000/60);
  } */

  /* const _waitGetPoses = async () => {
    if (!args.uncapped) {
      const fps = 60;// nativeBindings.nativeWindow.getRefreshRate();
      const expectedTimeDiff = 1000 / fps;

      const now = Date.now();
      const timeDiff = now - lastFrameTime;
      const waitTime = Math.max(expectedTimeDiff - timeDiff, 0) / 2;
      lastFrameTime = now;

      if (waitTime > 0) {
        await new Promise((accept, reject) => {
          setTimeout(accept, waitTime);
        });
      }
    }

    const _updateMeshing = () => {
      if (xrState.meshing[0] && !topVrPresentState.mesher) {
        _startFakeMesher();
      }
    };
    _updateMeshing();

    const _updatePlanes = () => {
      if (xrState.planeTracking[0] && !topVrPresentState.planeTracker) {
        _startFakePlaneTracker();
      }
    };
    _updatePlanes();

    const _updateHandTracking = () => {
      if (xrState.handTracking[0]) {
        for (let i = 0; i < xrState.hands.length; i++) {
          const hand = xrState.hands[i];
          const xrGamepad = xrState.gamepads[i];

          localMatrix.compose(
            localVector.fromArray(xrGamepad.position),
            localQuaternion.fromArray(xrGamepad.orientation),
            localVector2.set(1, 1, 1)
          );

          // wrist
          {
            localVector.set(0, 0, 0).applyMatrix4(localMatrix).toArray(hand.wrist[0]);
            localVector.set(-0.02, 0, -0.02).applyMatrix4(localMatrix).toArray(hand.wrist[1]);
            localVector.set(0.02, 0, -0.02).applyMatrix4(localMatrix).toArray(hand.wrist[2]);
          }

          // fingers
          for (let j = 0; j < hand.fingers.length; j++) {
            const finger = hand.fingers[j];
            const angle = j/(hand.fingers.length-1)*Math.PI;
            const x = -Math.cos(angle);
            const y = -Math.sin(angle);

            for (let k = 0; k < finger.length; k++) {
              const bone = finger[k];
              localVector.set(x, 0, y).multiplyScalar(0.03*k).applyMatrix4(localMatrix).toArray(bone);
            }
          }

          hand.connected[0] = 1;
        }
      }
    };
    _updateHandTracking();

    const _updateEyeTracking = () => {
      if (xrState.eyeTracking[0]) {
        const blink = (Date.now() % 2000) < 200;
        const blinkAxis = blink ? -1 : 1;

        const eye = xrState.eye;
        localMatrix
          .fromArray(GlobalContext.xrState.leftViewMatrix)
          .getInverse(localMatrix)
          .decompose(localVector, localQuaternion, localVector2);
        localVector
          .add(
            localVector2.set(0, 0, -1)
              .applyQuaternion(localQuaternion)
          )
          .toArray(eye.position);
        localQuaternion.toArray(eye.orientation);

        eye.axes[0] = blinkAxis;
        eye.axes[1] = blinkAxis;

        eye.connected[0] = 1;
      }
    };
    _updateEyeTracking();
  }; */
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
    /* if (xrState.handTracking[0]) {
      for (let i = 0; i < xrState.hands.length; i++) {
        _deriveGamepadData(xrState.hands[i]);
      }
    } */
    if (xrState.eyeTracking[0]) {
      _deriveGamepadData(xrState.eye);
    }
  };
  const _tickAnimationFrame = win => win.runAsync({
    method: 'tickAnimationFrame',
    layered: true,
  })
    .catch(err => {
      if (err.code !== 'ECANCEL') {
        console.warn(err);
      }
      return Promise.resolve([]);
    })
    .then(newFrame => {
      win.frame = newFrame;
    });
  const _tickAnimationFrames = () => Promise.all(windows.filter(win => win.loaded).map(_tickAnimationFrame));
  const _submitFrame = async () => {
    for (let i = 0; i < windows.length; i++) {
      windows[i].submit();
    }
  };
  let animating = false;
  const _topRenderLoop = async () => {
    if (!animating) {
      animating = true;

      _waitHandleRequests();
      // await _waitGetPoses();

      _computeDerivedGamepadsData();
      await _tickAnimationFrames();
      _submitFrame();

      animating = false;
    }
    animationFrame = requestAnimationFrame(_topRenderLoop);
  };
  let animationFrame = requestAnimationFrame(_topRenderLoop);

  return {
    stop() {
      cancelAnimationFrame(animationFrame);
      immediate = null;
    },
  };
};
_startTopRenderLoop();

const _startFakeMesher = () => {
  const mesher = new FakeMesher();
  mesher.addEventListener('meshes', ({detail: {updates}}) => {
    const request = {
      method: 'meshes',
      updates,
    };
    for (let i = 0; i < windows.length; i++) {
      windows[i].runAsync(request);
    }
  });
  topVrPresentState.mesher = mesher;
};
const _startFakePlaneTracker = () => {
  const planeTracker = new FakePlaneTracker();
  planeTracker.addEventListener('planes', ({detail: {updates}}) => {
    const request = {
      method: 'planes',
      updates,
    };
    for (let i = 0; i < windows.length; i++) {
      windows[i].runAsync(request);
    }
  });
  topVrPresentState.planeTracker = planeTracker;
};

bootstrapped = true;

};
_bootstrap();

export {
  setOptions,
};
