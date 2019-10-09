import path from '../modules/path-browserify.js';

// import {EventTarget, KeyboardEvent, SpatialEvent} from './Event.js';
import {CanvasRenderingContext2D, WebGLRenderingContext, WebGL2RenderingContext} from './Graphics.js';

// import LocalStorage from '../modules/window-lsm.js';
// import parseXml from '../modules/parse-xml.js';
import THREE from '../lib/three-min.js';
import {
  VRDisplay,
  VRFrameData,
  VRPose,
  VRStageParameters,
  FakeXRDisplay,
  Gamepad,
  GamepadButton,
  lookupHMDTypeString,
  getGamepads,
  getXrOffsetMatrix,
} from './VR.js';

import GlobalContext from './GlobalContext.js';
import symbols from './symbols.js';

import * as XR from './XR.js';
import utils from './utils.js';
const {_elementGetter, _elementSetter, _replaceDocument} = utils;

import XRIFrame from './xr-iframe.js';
import XRSite from './xr-site.js';

const {
  args: {
    options,
    id,
    args,
    version,
  },
} = GlobalContext.workerData;
GlobalContext.id = id;
GlobalContext.args = args;
GlobalContext.version = version;
GlobalContext.baseUrl = options.baseUrl;
GlobalContext.proxyContext = null;

// const isMac = os.platform() === 'darwin';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();

const windows = [];
GlobalContext.windows = windows;
const contexts = [];
GlobalContext.contexts = contexts;

const vrPresentState = {
  hmdType: null,
  topGlContext: null,
  glContext: null,
  fbo: 0,
  msFbo: 0,
  layers: [],
  responseAccepts: [],
};
GlobalContext.vrPresentState = vrPresentState;

// unpack xr-engine-template in recursive load scenario
class XREngineTemplate extends HTMLTemplateElement {
  constructor() {
    super();

    (async () => {
      if (document.readyState !== 'complete') {
        await new Promise((accept, reject) => {
          document.addEventListener('readystatechange', () => {
            if (document.readyState === 'complete') {
              accept();
            }
          });
        });
      }
      const childNodes = Array.from(this.content.childNodes);
      for (let i = 0; i < childNodes.length; i++) {
        const childNode = childNodes[i];
        if (childNode.nodeType === Node.ELEMENT_NODE) {
          let node = document.importNode(childNode, true);
          let scripts = node.matches('script') ? [node] : Array.from(node.querySelectorAll('script'));
          scripts = scripts.map(oldScript => {
            const {src, innerHTML} = oldScript;
            const script = document.createElement('script');
            if (src) {
              script.spec = {
                type: 'src',
                data: src,
              };
            } else {
              script.spec = {
                type: 'innerHTML',
                data: innerHTML,
              };
            }
            if (oldScript.parentNode) {
              oldScript.parentNode.replaceChild(script, oldScript);
            }
            if (oldScript === node) {
              node = script;
            }
            return script;
          });
          this.insertAdjacentElement('afterend', node);
          for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i];
            const p = new Promise((accept, reject) => {
              script.addEventListener('load', accept);
              script.addEventListener('error', reject);
            });
            if (script.spec.type === 'src') {
              script.src = script.spec.data;
            } else if (script.spec.type === 'innerHTML') {
              script.innerHTML = script.spec.data;
            }
            await p;
          }
        }
      }
    })();
  }
}
customElements.define('xr-engine-template', XREngineTemplate, {
  extends: 'template',
});

class PaymentRequest {
  constructor(methodData, details, options) {
    this.methodData = methodData;
    this.details = details;
    this.options = options;
  }

  async show() {
    const {methodData, details, options} = this;

    const listeners = window.listeners('paymentrequest');
    if (listeners.length > 0) {
      self._postMessageUp({
        method: 'paymentRequest',
        event: {
          methodData,
          details,
          options,
        },
      });
    } else {
      throw new Error('no payment request handler');
    }
  }
}

let rafIndex = 0;
const _findFreeSlot = (a, startIndex = 0) => {
  let i;
  for (i = startIndex; i < a.length; i++) {
    if (a[i] === null) {
      break;
    }
  }
  return i;
};
const _makeRequestAnimationFrame = window => (fn, priority = 0) => {
  fn = fn.bind(window);
  fn[symbols.prioritySymbol] = priority;
  const id = ++rafIndex;
  fn[symbols.idSymbol] = id;
  const rafCbs = window[symbols.rafCbsSymbol];
  rafCbs[_findFreeSlot(rafCbs)] = fn;
  rafCbs.sort((a, b) => (b ? b[symbols.prioritySymbol] : 0) - (a ? a[symbols.prioritySymbol] : 0));
  return id;
};
const _fetchText = src => fetch(src)
  .then(res => {
    if (res.status >= 200 && res.status < 300) {
      return res.text();
    } else {
      return Promise.reject(new Error('fetch got invalid status code: ' + res.status + ' : ' + src));
    }
  });

(async window => {
  let htmlString = await _fetchText(options.url);

  /* for (const k in EventEmitter.prototype) {
    window[k] = EventEmitter.prototype[k];
  }
  EventEmitter.call(window); */

  // window.parent = options.parent || window;
  // window.top = options.top || window;

  Object.defineProperty(window, 'innerWidth', {
    get() {
      return GlobalContext.xrState.metrics[0];
    },
  });
  Object.defineProperty(window, 'innerHeight', {
    get() {
      return GlobalContext.xrState.metrics[1];
    },
  });
  Object.defineProperty(window, 'devicePixelRatio', {
    get() {
      return GlobalContext.xrState.devicePixelRatio[0];
    },
  });
  // window.document = null;
  /* window.history = new History(location.href);
  window.matchMedia = media => ({
    media,
    matches: false,
  }); */

  window.navigator.getVRDisplaysSync = function getVRDisplays() {
    return [window[symbols.mrDisplaysSymbol].vrDisplay];
  };
  window.navigator.getVRDisplays = async function getVRDisplays() {
    return this.getVRDisplaysSync();
  };
  window.navigator.getGamepads = getGamepads;
  delete Navigator.prototype.xr;
  window.navigator.xr = new XR.XR(window);

  window.alert = console.log;
  window[symbols.optionsSymbol] = options;
  window[symbols.styleEpochSymbol] = 0;

  // DOM.
  /* const {
    Document,
    DocumentFragment,
    Range,
  } = getBoundDocumentElements(window);
  window.Document = Document;
  window.DocumentFragment = DocumentFragment;
  window.DocumentType = DocumentType;
  window.DOMImplementation = DOMImplementation;
  window.Range = Range;

  const {
    Element,
    HTMLElement,
    HTMLHeadElement,
    HTMLBodyElement,
    HTMLAnchorElement,
    HTMLStyleElement,
    HTMLLinkElement,
    HTMLScriptElement,
    HTMLImageElement,
    HTMLAudioElement,
    HTMLVideoElement,
    HTMLSourceElement,
    SVGElement,
    HTMLIFrameElement,
    HTMLCanvasElement,
    HTMLTextareaElement,
    HTMLTemplateElement,
    HTMLDivElement,
    HTMLUListElement,
    HTMLLIElement,
    HTMLTableElement,
    Node,
    Text,
    Comment,
  } = getBoundDOMElements(window);
  window.Element = Element;
  window.HTMLElement = HTMLElement;
  window.HTMLHeadElement = HTMLHeadElement;
  window.HTMLBodyElement = HTMLBodyElement;
  window.HTMLAnchorElement = HTMLAnchorElement;
  window.HTMLStyleElement = HTMLStyleElement;
  window.HTMLLinkElement = HTMLLinkElement;
  window.HTMLScriptElement = HTMLScriptElement;
  window.HTMLImageElement = HTMLImageElement,
  window.HTMLAudioElement = HTMLAudioElement;
  window.HTMLVideoElement = HTMLVideoElement;
  window.SVGElement = SVGElement;
  window.HTMLIFrameElement = HTMLIFrameElement;
  window.HTMLCanvasElement = HTMLCanvasElement;
  window.HTMLTextareaElement = HTMLTextareaElement;
  window.HTMLTemplateElement = HTMLTemplateElement;
  window.HTMLDivElement = HTMLDivElement;
  window.HTMLUListElement = HTMLUListElement;
  window.HTMLLIElement = HTMLLIElement;
  window.HTMLTableElement = HTMLTableElement;
  window.Node = Node;
  window.Text = Text;
  window.Comment = Comment;
  window[symbols.htmlTagsSymbol] = {
    DOCUMENT: Document,
    HEAD: HTMLHeadElement,
    BODY: HTMLBodyElement,
    A: HTMLAnchorElement,
    STYLE: HTMLStyleElement,
    SCRIPT: HTMLScriptElement,
    LINK: HTMLLinkElement,
    IMG: HTMLImageElement,
    AUDIO: HTMLAudioElement,
    VIDEO: HTMLVideoElement,
    SOURCE: HTMLSourceElement,
    IFRAME: HTMLIFrameElement,
    CANVAS: HTMLCanvasElement,
    TEXTAREA: HTMLTextareaElement,
    TEMPLATE: HTMLTemplateElement,
    DIV: HTMLDivElement,
    ULIST: HTMLUListElement,
    LI: HTMLLIElement,
    TABLE: HTMLTableElement,
  };
  window.DOMTokenList = DOMTokenList;
  window.NodeList = NodeList;
  window.HTMLCollection = HTMLCollection;

  window.MediaStream = class MediaStream {
    getAudioTracks() {
      return [];
    }
    getVideoTracks() {
      return [];
    }
  }; */

  /* window.RTCPeerConnection = RTCPeerConnection;
  window.webkitRTCPeerConnection = RTCPeerConnection; // for feature detection
  window.RTCSessionDescription = RTCSessionDescription;
  window.RTCIceCandidate = RTCIceCandidate;

  window.RTCPeerConnectionIceEvent = RTCPeerConnectionIceEvent;
  window.RTCDataChannelEvent = RTCDataChannelEvent;
  window.RTCDataChannelMessageEvent = RTCDataChannelMessageEvent;
  window.RTCTrackEvent = RTCTrackEvent;

  window.RTCRtpTransceiver = RTCRtpTransceiver; */

  window.CanvasRenderingContext2D = CanvasRenderingContext2D;
  window.WebGLRenderingContext = WebGLRenderingContext;
  window.WebGL2RenderingContext = WebGL2RenderingContext;
  
  window.Gamepad = Gamepad;
  window.VRStageParameters = VRStageParameters;
  window.VRDisplay = VRDisplay;
  window.VRFrameData = VRFrameData;
  // if (window.navigator.xr) {
    window.XR = XR.XR;
    // window.XRDevice = XR.XRDevice;
    window.XRSession = XR.XRSession;
    window.XRRenderState = XR.XRRenderState;
    window.XRWebGLLayer = XR.XRWebGLLayer;
    window.XRFrame = XR.XRFrame;
    window.XRView = XR.XRView;
    window.XRViewport = XR.XRViewport;
    window.XRPose = XR.XRPose;
    window.XRViewerPose = XR.XRViewerPose;
    window.XRInputSource = XR.XRInputSource;
    window.XRRay = XR.XRRay;
    window.XRInputPose = XR.XRInputPose;
    window.XRInputSourceEvent = XR.XRInputSourceEvent;
    window.XRSpace = XR.XRSpace;
    window.XRReferenceSpace = XR.XRReferenceSpace;
    window.XRBoundedReferenceSpace = XR.XRBoundedReferenceSpace;
  // }
  window.XRIFrame = XRIFrame;
  window.XRSite = XRSite;
  window.FakeXRDisplay = FakeXRDisplay;
  window.PaymentRequest = PaymentRequest;

  window.addEventListener = (_addEventListener => function addEventListener(type, fn, opts) {
    if (type !== 'vrdisplayconnect') {
      _addEventListener.apply(this, arguments);
    }
  })(window.addEventListener);

  window.requestAnimationFrame = _makeRequestAnimationFrame(window);
  window.cancelAnimationFrame = id => {
    const index = rafCbs.findIndex(r => r && r[symbols.idSymbol] === id);
    if (index !== -1) {
      rafCbs[index] = null;
    }
  };
  window.postMessage = function(data, targetOrigin, transfer) {
    if (!options.top) { // no top passed in so we are the top
      // Promise.resolve().then(() => {
        window.dispatchEvent(new MessageEvent('message', {data}));
      // });
    } else {
      window._postMessageUp(data, transfer);
    }
  };
  /* Object.defineProperty(window, 'onload', {
    get() {
      return _elementGetter(window, 'load');
    },
    set(onload) {
      _elementSetter(window, 'load', onload);
    },
  });
  Object.defineProperty(window, 'onerror', {
    get() {
      return _elementGetter(window, 'error');
    },
    set(onerror) {
      _elementSetter(window, 'error', onerror);
    },
  });
  Object.defineProperty(window, 'onpopstate', {
    get() {
      return _elementGetter(window, 'popstate');
    },
    set(onpopstate) {
      _elementSetter(window, 'popstate', onpopstate);
    },
  }); */

  /* window.history.addEventListener('popstate', ({detail: {url, state}}) => {
    window.location.set(url);

    window.dispatchEvent(new CustomEvent('popstate', {
      detail: {
        state,
      },
    }));
  });
  let loading = false;
  window.location.addEventListener('update', ({detail: {href}}) => {
    if (!loading) {
      loading = true;

      window.dispatchEvent(new CustomEvent('beforeunload'));
      window.dispatchEvent(new CustomEvent('unload'));

      self._postMessageUp({
        method: 'emit',
        type: 'navigate',
        event: {
          href,
        },
      });
    }
  }); */

  const rafCbs = [];
  window[symbols.rafCbsSymbol] = rafCbs;
  /* const timeouts = [null];
  const intervals = [null]; */
  const localCbs = [];
  const _cacheLocalCbs = cbs => {
    for (let i = 0; i < cbs.length; i++) {
      localCbs[i] = cbs[i];
    }
    for (let i = cbs.length; i < localCbs.length; i++) {
      localCbs[i] = null;
    }
  };
  const _clearLocalCbs = () => {
    for (let i = 0; i < localCbs.length; i++) {
      localCbs[i] = null;
    }
  };
  const _updateXr = () => {
    const gamepads = getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      const xrGamepad = GlobalContext.xrState.gamepads[i];

      localMatrix
        .fromArray(xrGamepad.transformMatrix)
        .premultiply(
          localMatrix2.getInverse(getXrOffsetMatrix())
        )
        .decompose(localVector, localQuaternion, localVector2);

      localVector.toArray(gamepad.pose.position);
      localQuaternion.toArray(gamepad.pose.orientation);
    }
  };
  const _emitXrEvents = () => {
    if (window[symbols.mrDisplaysSymbol].xrSession.isPresenting) {
      window[symbols.mrDisplaysSymbol].xrSession.update();
    }
  };
  const _tickLocalRafs = () => {
    if (rafCbs.length > 0) {
      _cacheLocalCbs(rafCbs);
      
      const performanceNow = performance.now();

      for (let i = 0; i < localCbs.length; i++) {
        const rafCb = localCbs[i];
        if (rafCb) {
          try {
            rafCb(performanceNow);
          } catch (e) {
            console.warn(e);
          }

          rafCbs[i] = null;
        }
      }

      _clearLocalCbs(); // release garbage
    }
  };
  const _renderLocal = (layered, highlight) => {
    for (let i = 0; i < contexts.length; i++) {
      const context = contexts[i];
      context._exokitClearEnabled && context._exokitClearEnabled(true);
      if (context._exokitBlendEnabled) {
        if (highlight) {
          context._exokitBlendEnabled(false);
          context._exokitEnable(context.BLEND);
          context._exokitBlendFuncSeparate(context.CONSTANT_COLOR, context.ONE_MINUS_SRC_ALPHA, context.CONSTANT_COLOR, context.ONE_MINUS_SRC_ALPHA);
          context._exokitBlendEquationSeparate(context.FUNC_ADD, context.FUNC_ADD);
          context._exokitBlendColor(highlight[0], highlight[1], highlight[2], highlight[3]);
        } else {
          context._exokitBlendEnabled(true);
        }
      }
    }
    const layerContext = layered ? vrPresentState.glContext : null;
    if (layerContext) {
      layerContext._exokitClearEnabled(false);
    }
    _tickLocalRafs();
  };
  const _renderChild = (win, layered, highlight) => {
    if (win.loaded) {
      win.runAsync({
        method: 'tickAnimationFrame',
        // layered: layered && vrPresentState.layers.some(layer => layer.contentWindow === window),
        layered,
        highlight,
      });
    }
  };
  const _render = (layered, highlight) => {
    for (let i = 0; i < windows.length; i++) {
      windows[i].rendered = false;
    }
    for (let i = 0; i < vrPresentState.layers.length; i++) {
      const layer = vrPresentState.layers[i];
      const contentWindow = layer && layer.contentWindow;
      if (contentWindow) {
        if (!(layer instanceof XRIFrame) || layer.visible) {
          _renderChild(contentWindow, true, highlight || contentWindow.highlight);
        }
        contentWindow.rendered = true;
      }
    }
    for (let i = 0; i < windows.length; i++) {
      const win = windows[i];
      if (win && !win.rendered) {
        _renderChild(win, false, highlight || win.highlight);
        win.rendered = true;
      }
    }
    _renderLocal(layered, highlight);
  };
  window.tickAnimationFrame = ({layered = false, highlight = null}) => {
    _updateXr();
    _emitXrEvents();
    _render(layered, highlight);
  };

  const _ensureProxyContext = () => {
    if (!GlobalContext.proxyContext) {
      vrPresentState.responseAccepts.push(({result}) => {
        GlobalContext.proxyContext = result;
      });
      
      self._postMessageUp({
        method: 'request',
        type: 'makeProxyContext',
        keypath: [],
      });
    }
  };
  const _makeMrDisplays = () => {
    const _onrequestpresent = async () => {
      // if (!GlobalContext.xrState.isPresenting[0]) {
        await new Promise((accept, reject) => {
          vrPresentState.responseAccepts.push(accept);

          self._postMessageUp({
            method: 'request',
            type: 'requestPresent',
            keypath: [],
          });
        });
      // }

      vrPresentState.hmdType = lookupHMDTypeString(GlobalContext.xrState.hmdType[0]);
      // GlobalContext.clearGamepads();
    };
    const _onmakeswapchain = context => {
      if (context !== vrPresentState.glContext) {
        /* if (vrPresentState.glContext) {
          vrPresentState.glContext.setClearEnabled(true);
        } */

        vrPresentState.glContext = context;
        // vrPresentState.fbo = context.createFramebuffer().id;
        // vrPresentState.msFbo = context.createFramebuffer().id;
        // vrPresentState.glContext.setClearEnabled(false);

        // window.document.dispatchEvent(new CustomEvent('domchange')); // open mirror window
      }

      /* return {
        fbo: vrPresentState.fbo,
      }; */
    };
    const _onexitpresent = async () => {
      // if (GlobalContext.xrState.isPresenting[0]) {
        await new Promise((accept, reject) => {
          vrPresentState.responseAccepts.push(accept);

          self._postMessageUp({
            method: 'request',
            type: 'exitPresent',
            keypath: [],
          });
        });
      // }

      vrPresentState.hmdType = null;
      // vrPresentState.glContext.setClearEnabled(true);
      vrPresentState.glContext = null;
      // GlobalContext.clearGamepads();
    };
    const _onrequesthittest = (origin, direction, coordinateSystem) => new Promise((accept, reject) => {
      localQuaternion.setFromUnitVectors(
        localVector.set(0, 0, -1),
        localVector2.fromArray(direction)
      );
      localMatrix.compose(
        localVector.fromArray(origin),
        localQuaternion,
        localVector2.set(1, 1, 1)
      ).premultiply(
        localMatrix2.fromArray(window.document.xrOffset.matrix)
      ).decompose(
        localVector,
        localQuaternion,
        localVector2
      );
      localVector.toArray(origin);
      localVector2.set(0, 0, -1).applyQuaternion(localQuaternion).toArray(direction);
      vrPresentState.responseAccepts.push(res => {
        const {error, result} = res;
        if (!error) {
          localMatrix.fromArray(window.document.xrOffset.matrixInverse);

          for (let i = 0; i < result.length; i++) {
            const {hitMatrix} = result[i];
            localMatrix2
              .fromArray(hitMatrix)
              .premultiply(localMatrix)
              .toArray(hitMatrix);
          }

          accept(result);
        } else {
          reject(error);
        }
      });

      self._postMessageUp({
        method: 'request',
        type: 'requestHitTest',
        keypath: [],
        origin,
        direction,
        coordinateSystem,
      });
    });

    const vrDisplay = new VRDisplay('OpenVR', window);
    vrDisplay.onrequestanimationframe = _makeRequestAnimationFrame(window);
    vrDisplay.oncancelanimationframe = window.cancelAnimationFrame;
    vrDisplay.onvrdisplaypresentchange = () => {
      window.vrdisplaypresentchange();
    };
    vrDisplay.onrequestpresent = _onrequestpresent;
    vrDisplay.onmakeswapchain = _onmakeswapchain;
    vrDisplay.onexitpresent = _onexitpresent;
    vrDisplay.onlayers = layers => {
      vrPresentState.layers = layers;
    };
    
    const xrSession = new XR.XRSession({}, window);
    xrSession.onrequestpresent = (onrequestpresent => function() {
      vrDisplay.isPresenting = true;
      xrSession.addEventListener('end', () => {
        vrDisplay.isPresenting = false;
      }, {
        once: true,
      });
      return onrequestpresent.apply(this, arguments);
    })(_onrequestpresent);
    xrSession.onmakeswapchain = _onmakeswapchain;
    xrSession.onexitpresent = _onexitpresent;
    xrSession.onrequestanimationframe = _makeRequestAnimationFrame(window);
    xrSession.oncancelanimationframe = window.cancelAnimationFrame;
    xrSession.onrequesthittest = _onrequesthittest;
    xrSession.onlayers = layers => {
      vrPresentState.layers = layers;
    };

    return {
      vrDisplay,
      xrSession,
    };
  };
  window[symbols.ensureProxyContext] = _ensureProxyContext;
  window[symbols.mrDisplaysSymbol] = _makeMrDisplays();
  window.vrdisplayactivate = () => {
    const _emit = () => {
      const displays = window.navigator.getVRDisplaysSync();
      if (displays.length > 0 && !displays[0].isPresenting) {
        const e = new CustomEvent('vrdisplayactivate');
        e.display = displays[0];
        window.dispatchEvent(e);
      }
    };
    if (document.readyState === 'complete') {
      _emit();
    } else {
      window.addEventListener('load', _emit, {
        once: true,
      });
    }
  };
  window.vrdisplaypresentchange = () => {
    const {vrDisplay} = window[symbols.mrDisplaysSymbol];
    const {isPresenting} = vrDisplay;
    window.dispatchEvent(new CustomEvent('vrdisplaypresentchange', {
      detail: {
        display: vrDisplay,
      },
    }));
  };

  // window.document = _parseDocument(htmlString, window);
  /* const numChildNodes = document.childNodes.length;
  while (document.childNodes.length > 0) {
    document.removeChild(document.childNodes[0]);
  } */
  /* for (let i = numChildNodes.length - 1; i--; i >= 0) {
    document.childNodes.removeChild(document.childNodes[i]);
  } */

  const xrOffset = options.xrOffsetBuffer ? new XR.XRRigidTransform(options.xrOffsetBuffer) : new XR.XRRigidTransform();
  xrOffset.addEventListener('change', e => {
    self._postMessageUp({
      method: 'emit',
      type: 'xrOffsetChange',
      event: e.detail,
    });
  });
  window.document.xrOffset = xrOffset;

  class Dataset extends EventTarget {
    constructor(data) {
      super();

      this.data = data || {};
    }
    get(k) {
      let v = this.data[k];
      if (v === undefined) {
        v = null;
      }
      return v;
    }
    set(key, value) {
      self._postMessageUp({
        method: 'emit',
        type: 'datasetChange',
        event: {
          key,
          value,
        },
      });
    }
    pushUpdate(key, value) {
      this.dispatchEvent(new CustomEvent('change', {
        detail: {
          key,
          value,
        },
      }));
    }
  }
  const dataset = options.datasetObject ? new Dataset(options.datasetObject) : new Dataset();
  window.document.dataset = dataset;

  /* {
    const _insertAfter = s => {
      htmlString = htmlString.slice(0, match.index) + match[0] + s + htmlString.slice();
    };
    const _insertBefore = s => {
      htmlString = htmlString.slice(0, match.index) + s + match[0] + htmlString.slice();
    };

    let match = htmlString.match(/<[\s]*head[\s>]/i);
    if (match) {
      _insertAfter(`<base href="${encodeURI(GlobalContext.baseUrl)}" target="_blank">`);
    } else if (match = htmlString.match(/<[\s]*body[\s>]/i)) {
      _insertBefore(`<head><base href="${encodeURI(GlobalContext.baseUrl)}" target="_blank"></head>`);
    } else {
      throw new Error(`no head or body tag: ${htmlString}`);
    }
  } */

  await _replaceDocument(htmlString);

})(self).then(() => {
  self._onbootstrap({
    error: null,
  });
}).catch(err => {
  console.warn(err.stack);

  self._onbootstrap({
    error: err,
  });
});

self.onrunasync = req => {
  const {method} = req;

  switch (method) {
    case 'tickAnimationFrame': {
      self.tickAnimationFrame(req);
      break;
    }
    case 'enterXr': {
      console.log('handle enter xr', GlobalContext.id);
      self.vrdisplaypresentchange();
      for (let i = 0; i < windows.length; i++) {
        windows[i].runAsync({
          method: 'enterXr',
        });
      }
      break;
    }
    case 'exitXr': {
      self.vrdisplaypresentchange();
      for (let i = 0; i < windows.length; i++) {
        windows[i].runAsync({
          method: 'exitXr',
        });
      }
      break;
    }
    case 'response': {
      const {keypath} = req;

      if (keypath.length === 0) {
        if (vrPresentState.responseAccepts.length > 0) {
          vrPresentState.responseAccepts.shift()(req);
        } else {
          throw new Error(`unexpected response at window ${method}`);
        }
      } else {
        const windowId = keypath.pop();
        const window = windows.find(window => window.id === windowId);

        if (window) {
          window.runAsync({
            method: 'response',
            keypath,
            error: req.error,
            result: req.result,
          });
        } else {
          console.warn('ignoring unknown response', req, {windowId});
        }
      }
      break;
    }
    /* case 'keyEvent': {
      const {event} = request;
      switch (event.type) {
        case 'keydown':
        case 'keypress':
        case 'keyup': {
          if (vrPresentState.glContext) {
            const {canvas} = vrPresentState.glContext;
            canvas.dispatchEvent(new KeyboardEvent(event.type, event));
          }
          break;
        }
        default: {
          break;
        }
      }
      break;
    }
    case 'meshes': {
      for (let i = 0; i < windows.length; i++) {
        windows[i].runAsync(req);
      }

      const {xrOffset} = global.document;

      if (window[symbols.mrDisplaysSymbol].xrSession.isPresenting) {
        for (let i = 0; i < req.updates.length; i++) {
          const update = req.updates[i];

          if (update.transformMatrix && xrOffset) {
            localMatrix
              .fromArray(update.transformMatrix)
              .premultiply(
                localMatrix2.fromArray(xrOffset.matrixInverse)
              )
              .toArray(update.transformMatrix);          
          }
          const e = new SpatialEvent(update.type, {
            detail: {
              update,
            },
          });
          window[symbols.mrDisplaysSymbol].xrSession.dispatchEvent(e);
        }
      }
      break;
    }
    case 'planes': {
      for (let i = 0; i < windows.length; i++) {
        windows[i].runAsync(req);
      }
      
      const {xrOffset} = global.document;
      if (xrOffset) {
        localMatrix.fromArray(xrOffset.matrixInverse);
      }
      
      if (window[symbols.mrDisplaysSymbol].xrSession.isPresenting) {
        for (let i = 0; i < req.updates.length; i++) {
          const update = req.updates[i];
          if (update.position && xrOffset) {
            localVector.fromArray(update.position).applyMatrix4(localMatrix).toArray(update.position);
            localVector.fromArray(update.normal).applyQuaternion(localQuaternion).toArray(update.normal);
          }
          const e = new SpatialEvent(update.type, {
            detail: {
              update,
            },
          });
          window[symbols.mrDisplaysSymbol].xrSession.dispatchEvent(e);
        }
      }
      break;
    }
    case 'eval': {// used in tests
      (0, eval)(req.scriptString);
      break;
    } */
    default:
      throw new Error(`invalid window async request: ${JSON.stringify(req)}`);
  }
};
