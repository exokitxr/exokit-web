// const cwd = process.cwd();
// process.chdir(__dirname); // needed for global bin to find libraries

import path from '../modules/path-browserify.js';
// const fs = require('fs');
// const url = require('url');
// const net = require('net');
// const child_process = require('child_process');
// const os = require('os');
import util from '../modules/util.js';
// const repl = require('repl');

import core from './core.js';
// const mkdirp = require('mkdirp');
// const replHistory = require('repl.history');
import minimist from '../modules/minimist.js';

const version = '0.0.1'; // const {version} = require('../package.json');
import {defaultEyeSeparation, maxNumTrackers} from './constants.js';
import symbols from './symbols.js';
import THREE from '../lib/three-min.js';

import {getHMDType, lookupHMDTypeIndex, FakeMesher, FakePlaneTracker} from './VR.js';

// const nativeBindings = require(path.join(__dirname, 'native-bindings.js'));

import GlobalContext from './GlobalContext.js';
GlobalContext.args = {};
GlobalContext.version = '';
GlobalContext.commands = [];

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();

// openvr
const localFloat32PoseArray = new Float32Array(16*(1+2+maxNumTrackers));
const localFloat32HmdPoseArray = new Float32Array(localFloat32PoseArray.buffer, localFloat32PoseArray.byteOffset + 0*Float32Array.BYTES_PER_ELEMENT*16, 16);
const localFloat32GamepadPoseArrays = [
  new Float32Array(localFloat32PoseArray.buffer, localFloat32PoseArray.byteOffset + 1*Float32Array.BYTES_PER_ELEMENT*16, 16),
  new Float32Array(localFloat32PoseArray.buffer, localFloat32PoseArray.byteOffset + 2*Float32Array.BYTES_PER_ELEMENT*16, 16),
];
const localFloat32TrackerPoseArrays = (() => {
  const result = Array(maxNumTrackers);
  for (let i = 0; i < maxNumTrackers; i++) {
    result[i] = new Float32Array(localFloat32PoseArray.buffer, localFloat32PoseArray.byteOffset + (3+i)*Float32Array.BYTES_PER_ELEMENT*16, 16);
  }
  return result;
})();
const localFloat32MatrixArray = new Float32Array(16);
const localFovArray = new Float32Array(4);
const localGamepadArray = new Float32Array(11 + 15 + 31*(3+4));

// oculus desktop
const zeroMatrix = new THREE.Matrix4();
const localFloat32Array = zeroMatrix.toArray(new Float32Array(16));
const localFloat32Array2 = zeroMatrix.toArray(new Float32Array(16));
const localFloat32Array3 = zeroMatrix.toArray(new Float32Array(16));
const localFloat32Array4 = zeroMatrix.toArray(new Float32Array(16));

const localPositionArray3 = new Float32Array(3);
const localQuaternionArray4 = new Float32Array(4);

const leftControllerPositionArray3 = new Float32Array(3);
const leftControllerQuaternionArray4 = new Float32Array(4);

const rightControllerPositionArray3 = new Float32Array(3);
const rightControllerQuaternionArray4 = new Float32Array(4);

// oculus mobile
const oculusMobilePoseFloat32Array = new Float32Array(3 + 4 + 1 + 4 + (16*2) + (16*2) + (16+12) + (16+12));

// magic leap
const transformArray = new Float32Array(7 * 2);
const projectionArray = new Float32Array(16 * 2);
const controllersArray = new Float32Array((1 + 3 + 4 + 6) * 2);

const args = (() => {
  const process = {
    argv: ['node', '.', 'example.html'],
  };
  const minimistArgs = minimist(process.argv.slice(2), {
    boolean: [
      'version',
      'home',
      'log',
      'perf',
      'performance',
      'frame',
      'minimalFrame',
      'tab',
      'quit',
      'blit',
      'require',
      'nogl',
      'headless',
      'uncapped',
    ],
    string: [
      'webgl',
      'xr',
      'size',
      'replace',
      'onbeforeload'
    ],
    alias: {
      v: 'version',
      h: 'home',
      l: 'log',
      w: 'webgl',
      x: 'xr',
      p: 'performance',
      perf: 'performance',
      s: 'size',
      f: 'frame',
      m: 'minimalFrame',
      t: 'tab',
      q: 'quit',
      b: 'blit',
      r: 'replace',
      u: 'require',
      n: 'nogl',
      e: 'headless',
      c: 'uncapped',
    },
  });
  return {
    version: minimistArgs.version,
    url: minimistArgs._[0] || '',
    home: minimistArgs.home,
    log: minimistArgs.log,
    webgl: minimistArgs.webgl || '2',
    xr: minimistArgs.xr || 'all',
    performance: !!minimistArgs.performance,
    size: minimistArgs.size,
    frame: minimistArgs.frame,
    minimalFrame: minimistArgs.minimalFrame,
    tab: minimistArgs.tab,
    quit: minimistArgs.quit,
    blit: minimistArgs.blit,
    replace: Array.isArray(minimistArgs.replace) ? minimistArgs.replace : ((minimistArgs.replace !== undefined) ? [minimistArgs.replace] : []),
    require: minimistArgs.require,
    nogl: minimistArgs.nogl,
    headless: minimistArgs.headless,
    uncapped: minimistArgs.uncapped,
    onbeforeload: minimistArgs.onbeforeload
  };
})();

core.setArgs(args);
core.setVersion(version);

const dataPath = null;
/* const dataPath = (() => {
  const candidatePathPrefixes = [
    os.homedir(),
    __dirname,
    os.tmpdir(),
  ];
  for (let i = 0; i < candidatePathPrefixes.length; i++) {
    const candidatePathPrefix = candidatePathPrefixes[i];
    if (candidatePathPrefix) {
      const ok = (() => {
        try {
         fs.accessSync(candidatePathPrefix, fs.constants.W_OK);
         return true;
        } catch(err) {
          return false;
        }
      })();
      if (ok) {
        return path.join(candidatePathPrefix, '.exokit');
      }
    }
  }
  return null;
})(); */

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
  result.devicePixelRatio = _makeTypedArray(Uint32Array, 1);
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
    const window = windows.find(window => window.id === windowId);
    if (window) {
      window.runAsync({
        method: 'response',
        keypath,
        error,
        result,
      });
    } else {
      console.warn('cannot find window to respond request to', windowId, windows.map(window => window.id));
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

    if (!topVrPresentState.windowHandle) {
      topVrPresentState.windowHandle = nativeBindings.nativeWindow.createWindowHandle(1, 1, false);
    }
    nativeBindings.nativeWindow.setCurrentWindowContext(topVrPresentState.windowHandle);

    if (hmdType === 'fake') {
      const width = xrState.renderWidth[0]*2;
      const height = xrState.renderHeight[0];

      const [fbo, tex, depthTex, msFbo, msTex, msDepthTex] = nativeBindings.nativeWindow.createVrTopRenderTarget(width, height);

      topVrPresentState.fbo = fbo;
      topVrPresentState.msFbo = msFbo;
      xrState.tex[0] = tex;
      xrState.depthTex[0] = depthTex;
      xrState.msTex[0] = msTex;
      xrState.msDepthTex[0] = msDepthTex;
    } else if (hmdType === 'oculus') {
      const system = topVrPresentState.oculusSystem || nativeBindings.nativeOculusVR.Oculus_Init();
      // const lmContext = topVrPresentState.lmContext || (nativeBindings.nativeLm && new nativeBindings.nativeLm());

      topVrPresentState.vrContext = system;

      const {width: halfWidth, height} = system.GetRecommendedRenderTargetSize();
      const width = halfWidth * 2;

      const [fbo, tex, depthTex, msFbo, msTex, msDepthTex] = system.CreateSwapChain(width, height);

      topVrPresentState.fbo = fbo;
      topVrPresentState.msFbo = msFbo;
      xrState.tex[0] = tex;
      xrState.depthTex[0] = depthTex;
      xrState.msTex[0] = msTex;
      xrState.msDepthTex[0] = msDepthTex;
      xrState.renderWidth[0] = halfWidth;
      xrState.renderHeight[0] = height;
    } else if (hmdType === 'openvr') {
      const system = nativeBindings.nativeOpenVR.VR_Init(nativeBindings.nativeOpenVR.EVRApplicationType.Scene, path.join(__dirname, '..', 'deps', 'openvr', 'actions.json'));
      const compositor = nativeBindings.nativeOpenVR.NewCompositor();
      // const lmContext = topVrPresentState.lmContext || (nativeLm && new nativeLm());

      topVrPresentState.vrSystem = system;
      topVrPresentState.vrCompositor = compositor;

      const {width: halfWidth, height} = system.GetRecommendedRenderTargetSize();
      const width = halfWidth * 2;

      const [fbo, tex, depthTex, msFbo, msTex, msDepthTex] = nativeBindings.nativeWindow.createVrTopRenderTarget(width, height);

      topVrPresentState.fbo = fbo;
      topVrPresentState.msFbo = msFbo;
      xrState.tex[0] = tex;
      xrState.depthTex[0] = depthTex;
      xrState.msTex[0] = msTex;
      xrState.msDepthTex[0] = msDepthTex;
      xrState.renderWidth[0] = halfWidth;
      xrState.renderHeight[0] = height;
    } else if (hmdType === 'oculusMobile') {
      const vrContext = nativeBindings.nativeOculusMobileVr.OculusMobile_Init(topVrPresentState.windowHandle);

      topVrPresentState.vrContext = vrContext;

      const {width: halfWidth, height} = vrContext.GetRecommendedRenderTargetSize();
      const width = halfWidth * 2;

      const [fbo, tex, depthTex, msFbo, msTex, msDepthTex] = vrContext.CreateSwapChain(width, height);

      topVrPresentState.fbo = fbo;
      topVrPresentState.msFbo = msFbo;
      xrState.tex[0] = tex;
      xrState.depthTex[0] = depthTex;
      xrState.msTex[0] = msTex;
      xrState.msDepthTex[0] = msDepthTex;
      xrState.renderWidth[0] = halfWidth;
      xrState.renderHeight[0] = height;
    } else if (hmdType === 'magicleap') {
      topVrPresentState.vrContext = new nativeBindings.nativeMl();
      topVrPresentState.vrContext.Present(topVrPresentState.windowHandle);

      const {width: halfWidth, height} = topVrPresentState.vrContext.GetSize();
      const width = halfWidth * 2;

      const [fbo, tex, depthTex, msFbo, msTex, msDepthTex] = nativeBindings.nativeWindow.createVrTopRenderTarget(width, height);

      topVrPresentState.fbo = fbo;
      topVrPresentState.msFbo = msFbo;
      xrState.tex[0] = tex;
      xrState.depthTex[0] = depthTex;
      xrState.msTex[0] = msTex;
      xrState.msDepthTex[0] = msDepthTex;
      xrState.renderWidth[0] = halfWidth;
      xrState.renderHeight[0] = height;

      nativeBindings.nativeMl.SetEventHandler(e => {
        console.log('got ml event', e);

        // const window = canvas.ownerDocument.defaultView;

        switch (e.type) {
          case 'newInitArg':
          case 'resume':
          case 'unloadResources': {
            break;
          }
          case 'stop':
          case 'pause': {
            if (mlPresentState.mlContext) {
              mlPresentState.mlContext.Exit();
            }
            nativeBindings.nativeMl.DeinitLifecycle();
            process.exit();
            break;
          }
          case 'keydown':
          case 'keypress':
          case 'keyup': {
            const request = {
              method: 'keyEvent',
              event: e,
            };
            for (let i = 0; i < windows.length; i++) {
              windows[i].runAsync(request);
            }
            break;
          }
          default: {
            break;
          }
        }
      });
    } else {
      throw new Error('unknown hmd type');
    }

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
  const window = windows.find(window => window.id === windowId);
  if (window) {
    window.runAsync({
      method: 'response',
      keypath,
    });
  } else {
    console.warn('cannot find window to respond request to', windowId, windows.map(window => window.id));
  }
};
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
const handlePaymentRequest = () => {
  throw new Error('no payment request handler');
};

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
  const frames = [];

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
  const _tickAnimationFrame = window => window.runAsync({
    method: 'tickAnimationFrame',
    layered: true,
  })
    .catch(err => {
      if (err.code !== 'ECANCEL') {
        console.warn(err);
      }
      return Promise.resolve([]);
    })
    .then(newFrames => {
      frames.push.apply(newFrames);
    });
  const _tickAnimationFrames = () => Promise.all(windows.map(_tickAnimationFrame));
  const _submitFrame = async () => {
    if (topVrPresentState.hmdType) {
      // _blitXrFbo();
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
  mesher.on('meshes', updates => {
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
  planeTracker.on('planes', updates => {
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

const _prepare = () => Promise.resolve();/*Promise.all([
  (() => {
    if (!process.env['DISPLAY']) {
      process.env['DISPLAY'] = ':0.0';
    }
  })(),
  (() => {
    let rootPath = null;
    let runtimePath = null;
    const platform = os.platform();
    if (platform === 'win32') {
      rootPath = path.join(os.homedir(), 'AppData', 'Local', 'openvr');
      runtimePath = 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\SteamVR';
    } else if (platform === 'darwin') {
      rootPath = path.join('/Users/', os.userInfo().username, '/Library/Application Support/OpenVR/.openvr');
      runtimePath = path.join(__dirname, '/node_modules/native-openvr-deps/bin/osx64');
    } else if (platform === 'linux') {
      rootPath = path.join(os.userInfo().homedir, '.config/openvr');
      runtimePath = path.join(__dirname, '..', 'node_modules', 'native-openvr-deps/bin/linux64');
    }

    if (rootPath !== null) {
      const openvrPathsPath = path.join(rootPath, 'openvrpaths.vrpath');

      return new Promise((accept, reject) => {
        fs.lstat(openvrPathsPath, (err, stats) => {
          if (err) {
            if (err.code === 'ENOENT') {
              mkdirp(rootPath, err => {
                if (!err) {
                  const jsonString = JSON.stringify({
                    "config" : [ rootPath ],
                    "external_drivers" : null,
                    "jsonid" : "vrpathreg",
                    "log" : [ rootPath ],
                    "runtime" : [
                       runtimePath,
                     ],
                    "version" : 1
                  }, null, 2);
                  fs.writeFile(openvrPathsPath, jsonString, err => {
                    if (!err) {
                      accept();
                    } else {
                      reject(err);
                    }
                  });
                } else if (err.code === 'EACCES') {
                  accept();
                } else {
                  reject(err);
                }
              });
            } else if (err.code === 'EACCES') {
              accept();
            } else {
              reject(err);
            }
          } else {
            accept();
          }
        });
      });
    } else {
      return Promise.resolve();
    }
  })(),
  new Promise((accept, reject) => {
    mkdirp(dataPath, err => {
      if (!err) {
        accept();
      } else {
        reject(err);
      }
    });
  }),
]); */

const realityTabsUrl = path.join('..', 'examples', 'realitytabs.html');
const _start = () => {
  let {url: u} = args;
  if (!u && args.home) {
    u = realityTabsUrl;
  }
  if (u) {
    if (u === '.') {
      console.warn('NOTE: You ran `exokit . <url>`\n(Did you mean to run `node . <url>` or `exokit <url>` instead?)')
    }
    u = u.replace(/^exokit:/, '');
    if (args.tab) {
      // u = u.replace(/\/?$/, '/');
      u = `${realityTabsUrl}?t=${encodeURIComponent(u)}`
    }
    /* if (u && !/^[a-z]+:/.test(u)) {
      u = window.location.protocol + '//' + u;
    } */
    const replacements = (() => {
      const result = {};
      for (let i = 0; i < args.replace.length; i++) {
        const replaceArg = args.replace[i];
        const replace = replaceArg.split(' ');
        if (replace.length === 2) {
          result[replace[0]] = window.location.protocol + '://' + replace[1];
        } else {
          console.warn(`invalid replace argument: ${replaceArg}`);
        }
      }
      return result;
    })();
    const _onnavigate = href => {
      core.load(href, {
        dataPath,
        args,
        replacements,
        onnavigate: _onnavigate,
        onrequest: handleRequest,
        onhapticpulse: handleHapticPulse,
        onpaymentrequest: handlePaymentRequest,
      });
    };
    _onnavigate(u);
  } else {
    const _onnavigate = href => {
      window = null;

      core.load(href, {
        dataPath,
      }, {
        onnavigate: _onnavigate,
      })
        .then(newWindow => {
          window = newWindow;
        })
        .catch(err => {
          console.warn(err.stack);
        });
    };
    let window = core.make('', {
      dataPath,
      args,
      onnavigate: _onnavigate,
      onrequest: handleRequest,
      onhapticpulse: handleHapticPulse,
      onpaymentrequest: handlePaymentRequest,
    });

    const prompt = '[x] ';

    const replEval = async (cmd, context, filename, callback) => {
      cmd = cmd.slice(0, -1); // remove trailing \n

      let result, err;
      let match;

      if (/^[a-z]+:\/\//.test(cmd)) {
        cmd = `window.location.href = ${JSON.stringify(cmd)};`;
      } else if (/^\s*<(?:\!\-*)?[a-z]/i.test(cmd)) {
        cmd = `(() => {
          const e = window.document.createElement('div');
          e.innerHTML = ${JSON.stringify(cmd)};
          if (e.childNodes.length === 0) {
            return window._ = undefined;
          } else if (e.childNodes.length === 1) {
            return window._ = e.childNodes[0];
          } else {
            return window._ = e.childNodes;
          }
        })();`;
      } else if (match = cmd.match(/^\s*(?:const|var|let)?\s*([a-z][a-z0-9]*)\s*=\s*(<(?:\!\-*)?[a-z].*)$/im)) {
        const name = match[1];
        const src = match[2];
        cmd = `(() => {
          const name = ${JSON.stringify(name)};
          const e = window.document.createElement('div');
          e.innerHTML = ${JSON.stringify(src)};
          if (e.childNodes.length === 0) {
            return window[name] = window._ = undefined;
          } else if (e.childNodes.length === 1) {
            return window[name] = window._ = e.childNodes[0];
          } else {
            return window[name] = window._ = e.childNodes;
          }
        })();`;
      }
      try {
        result = await window.runRepl(cmd);
      } catch(e) {
        err = e;
      }

      if (!err) {
        if (result !== undefined) {
          r.setPrompt(prompt);
        }
      } else {
        if (err.name === 'SyntaxError') {
          err = new repl.Recoverable(err);
        }
      }

      GlobalContext.commands.push(cmd);

      callback(err, {[util.inspect.custom]() { return result; }});
    };
    const r = repl.start({
      prompt,
      eval: replEval,
    });
    // replHistory(r, path.join(dataPath, '.repl_history'));
    r.on('exit', () => {
      process.exit();
    });
  }
};

// if (require.main === module) {
  /* if (!nativeBindings.nativePlatform) { // not a mobile platform
    require(path.join(__dirname, 'bugsnag'));
    require('fault-zone').registerHandler((stack, stackLen) => {
      const message = new Buffer(stack, 0, stackLen).toString('utf8');
      console.warn(message);
      child_process.execFileSync(process.argv[0], [
        path.join(__dirname, 'bugsnag.js'),
      ], {
        input: message,
      });
      process.exit(1);
    });
  } */
  /* if (args.log) {
    const RedirectOutput = require('redirect-output').default;
    new RedirectOutput({
      flags: 'a',
    }).write(path.join(dataPath, 'log.txt'));
  } */

  /* const _logStack = err => {
    console.warn(err);
  };
  process.on('uncaughtException', _logStack);
  process.on('unhandledRejection', _logStack); */

  if (args.version) {
    console.log(version);
    // process.exit(0);
  }
  if (args.size) {
    const match = args.size.match(/^([0-9]+)x([0-9]+)$/);
    if (match) {
      const w = parseInt(match[1], 10);
      const h = parseInt(match[2], 10);
      if (w > 0 && h > 0) {
        xrState.metrics[0] = w;
        xrState.metrics[1] = h;
      }
    }
  }
  /* if (args.frame || args.minimalFrame) {
    nativeBindings.nativeGl = (OldWebGLRenderingContext => {
      function WebGLRenderingContext() {
        const result = Reflect.construct(OldWebGLRenderingContext, arguments);
        for (const k in result) {
          if (typeof result[k] === 'function') {
            result[k] = (old => function() {
              if (GlobalContext.args.frame) {
                console.log(k, arguments);
              } else if (GlobalContext.args.minimalFrame) {
                console.log(k);
              }
              return old.apply(this, arguments);
            })(result[k]);
          }
        }
        return result;
      }
      for (const k in OldWebGLRenderingContext) {
        WebGLRenderingContext[k] = OldWebGLRenderingContext[k];
      }
      return WebGLRenderingContext;
    })(nativeBindings.nativeGl);
  } */

  _prepare()
    .then(() => _start())
    .catch(err => {
      console.warn(err.stack);
      process.exit(1);
    });
// }

// module.exports = core;
