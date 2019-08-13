// import events from '../events-browserify.js';
// const {EventEmitter} = events;
import path from '../modules/path-browserify.js';
// const fs = require('fs');
// const http = require('http');
// const https = require('https');
// const os = require('os');
import util from '../modules/util.js';
// const {TextEncoder, TextDecoder} = util;
// const {performance} = require('perf_hooks');

import {EventTarget, KeyboardEvent, SpatialEvent} from './Event.js';
import {
  AudioContext,
  AudioNode,
  AudioBufferSourceNode,
  OscillatorNode,
  AudioDestinationNode,
  AudioParam,
  AudioListener,
  GainNode,
  AnalyserNode,
  PannerNode,
  StereoPannerNode,
} from './Audio.js';
import {MutationObserver} from './MutationObserver.js';
import {CanvasRenderingContext2D, WebGLRenderingContext, WebGL2RenderingContext} from './Graphics.js';

// const mkdirp = require('mkdirp');
// const ws = require('ws');

/* const {
  RTCIceCandidate,
  RTCPeerConnection,
  RTCRtpTransceiver,
  RTCSessionDescription,

  RTCPeerConnectionIceEvent,
  RTCDataChannelEvent,
  RTCDataChannelMessageEvent,
  RTCTrackEvent,
} = require('./RTC/index.js'); */

import LocalStorage from '../modules/window-lsm.js';
// const indexedDB = require('fake-indexeddb');
import parseXml from '../modules/parse-xml.js';
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
} from './VR.js';

import {maxNumTrackers} from './constants.js';
import GlobalContext from './GlobalContext.js';
import symbols from './symbols.js';

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

import {_parseDocument, _parseDocumentAst, getBoundDocumentElements, DocumentType, DOMImplementation, initDocument} from './Document.js';
import {
  HTMLElement,
  getBoundDOMElements,
  DOMTokenList,
  NodeList,
  HTMLCollection,
  DOMRect,
  DOMPoint,
  // createImageBitmap,
} from './DOM.js';
import History from './History.js';
import * as XR from './XR.js';
// const DevTools = require('./DevTools');
import utils from './utils.js';
const {_elementGetter, _elementSetter} = utils;

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
  vrContext: null,
  glContext: null,
  fbo: 0,
  msFbo: 0,
  layers: [],
  responseAccepts: [],
};
GlobalContext.vrPresentState = vrPresentState;

class CustomElementRegistry {
  constructor(window) {
    this._window = window;

    this.elements = {};
    this.extensions = {};
    this.elementPromises = {};
  }

  define(name, constructor, options = {}) {
    name = name.toUpperCase();

    this.elements[name] = constructor;
    if (options.extends) {
      this.extensions[options.extends.toUpperCase()] = name.toLowerCase();
    }

    this._window.document.traverse(el => {
      if (el.tagName === name) {
        this.upgrade(el, constructor);
      }
    });

    const promises = this.elementPromises[name];
    if (promises) {
      for (let i = 0; i < promises.length; i++) {
        promises[i].accept();
      }
      this.elementPromises[name] = null;
    }
  }
  get(name) {
    name = name.toUpperCase();

    return this.elements[name];
  }
  whenDefined(name) {
    name = name.toUpperCase();

    if (this.elements[name]) {
      return Promise.resolve();
    } else {
      let promises = this.elementPromises[name];
      if (!promises) {
        promises = [];
        this.elementPromises[name] = promises;
      }
      const promise = new Promise((accept, reject) => {
        promise.accept = accept;
        promise.reject = reject;
      });
      promises.push(promise);
      return promise;
    }
  }

  upgrade(el, constructor) {
    if (el instanceof HTMLElement) {
      let isConnected = el.isConnected;
      let connectHandled = false;
      el.ownerDocument.addEventListener('domchange', () => {
        const newConnected = el.isConnected;
        if (newConnected && !isConnected) {
          el.connectedCallback && el.connectedCallback();
          isConnected = true;
        } else if (isConnected && !newConnected) {
          el.disconnectedCallback && el.disconnectedCallback();
          isConnected = false;
        }
        connectHandled = true;
      });

      const observedAttributes = constructor.observedAttributes || [];
      if (observedAttributes.length > 0) {
        el.addEventListener('attribute', ({detail: {name, value, oldValue}}) => {
          if (el.attributeChangedCallback && observedAttributes.includes(name)) {
            el.attributeChangedCallback(name, value, oldValue);
          }
        });
      }

      Object.setPrototypeOf(el, constructor.prototype);
      HTMLElement.upgradeElement = el;
      let error = null;
      try {
        Object.setPrototypeOf(el, constructor.prototype);
        Reflect.construct(constructor, []);
      } catch(err) {
        error = err;
      }
      HTMLElement.upgradeElement = null;

      if (!error) {
        if (isConnected && !connectHandled) {
          el.connectedCallback && el.connectedCallback();
        }
      } else {
        throw error;
      }
    } else {
      throw new Error('cannot upgrade non-subclass of HTMLElement');
    }
  }
}

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
      self._postMessage({
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

class MonitorManager {
  getList() {
    return nativeWindow.getMonitors();
  }

  select(index) {
    nativeWindow.setMonitor(index);
  }
}

class Screen {
  constructor(window) {
    this._window = window;
  }

  get top() {
    return 0;
  }
  set top(top) {}
  get left() {
    return 0;
  }
  set left(left) {}
  get width() {
    return this._window.innerWidth;
  }
  set width(width) {}
  get height() {
    return this._window.innerHeight;
  }
  set height(height) {}
  get colorDepth() {
    return 24;
  }
  set colorDepth(colorDepth) {}
  get orientation() {
    return {
      angle: 0,
      type: 'landscape-primary',
      onchange: null,
    };
  }
  set orientation(orientation) {}

  get pixelDepth() {
    return this.colorDepth;
  }
  set pixelDepth(pixelDepth) {}
  get availTop() {
    return this.top;
  }
  set availTop(availTop) {}
  get availLeft() {
    return this.left;
  }
  set availLeft(availLeft) {}
  get availWidth() {
    return this.width;
  }
  set availWidth(availWidth) {}
  get availHeight() {
    return this.height;
  }
  set availHeight(availHeight) {}
}

class MediaRecorder extends EventTarget {
  constructor() {
    super();
  }

  start() {}

  stop() {}

  requestData() {}
}

class DataTransfer {
  constructor({items = [], files = []} = {}) {
    this.items = items;
    this.files = files;
  }
}
class DataTransferItem {
  constructor(kind = 'string', type = 'text/plain', data = null) {
    this.kind = kind;
    this.type = type;
    this.data = data;
  }

  getAsFile() {
    return new Blob([this.data], {
      type: this.type,
    });
  }

  getAsString(callback) {
    const {data} = this;
    setImmediate(() => {
      callback(data);
    });
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

(window => {
  /* for (const k in EventEmitter.prototype) {
    window[k] = EventEmitter.prototype[k];
  }
  EventEmitter.call(window); */

  window.window = window;
  // window.self = window;
  window.parent = options.parent || window;
  window.top = options.top || window;

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
  window.document = null;
  window.history = new History(location.href);
  window.matchMedia = media => ({
    media,
    matches: false,
  });

  window.navigator.getVRDisplays = function() {
    return Promise.resolve(this.getVRDisplaysSync());
  }
  window.navigator.xr = new XR.XR(window);

  window.alert = console.log;
  /* window.setTimeout = (setTimeout => (fn, timeout, args) => {
    fn = fn.bind.apply(fn, [window].concat(args));
    const id = _findFreeSlot(timeouts, 1);
    timeouts[id] = fn;
    fn[symbols.timeoutSymbol] = setTimeout(fn, timeout, args);
    return id;
  })(setTimeout);
  window.clearTimeout = (clearTimeout => id => {
    const fn = timeouts[id];
    if (fn) {
      clearTimeout(fn[symbols.timeoutSymbol]);
      timeouts[id] = null;
    }
  })(clearTimeout);
  window.setInterval = (setInterval => (fn, interval, args) => {
    if (interval < 10) {
      interval = 10;
    }
    fn = fn.bind.apply(fn, [window].concat(args));
    const id = _findFreeSlot(intervals, 1);
    intervals[id] = fn;
    fn[symbols.timeoutSymbol] = setInterval(fn, interval, args);
    return id;
  })(setInterval);
  window.clearInterval = (clearInterval => id => {
    const fn = intervals[id];
    if (fn) {
      clearInterval(fn[symbols.timeoutSymbol]);
      intervals[id] = null;
    }
  })(clearInterval); */
  window.event = null;
  window.localStorage = new LocalStorage();
  window.sessionStorage = new LocalStorage();
  // window.indexedDB = indexedDB;
  window.screen = new Screen(window);
  window.scrollTo = function(x = 0, y = 0) {
    this.scrollX = x;
    this.scrollY = y;
  };
  window.scrollX = 0;
  window.scrollY = 0;
  window[symbols.optionsSymbol] = options;
  window[symbols.styleEpochSymbol] = 0;

  // DOM.
  const {
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

  /* window.MediaStreamTrack = MediaStreamTrack;
  window.RTCRtpReceiver = RTCRtpReceiver;
  window.RTCRtpSender = RTCRtpSender; */
  window.MediaStream = class MediaStream {
    getAudioTracks() {
      return [];
    }
    getVideoTracks() {
      return [];
    }
  };

  /* window.RTCPeerConnection = RTCPeerConnection;
  window.webkitRTCPeerConnection = RTCPeerConnection; // for feature detection
  window.RTCSessionDescription = RTCSessionDescription;
  window.RTCIceCandidate = RTCIceCandidate;

  window.RTCPeerConnectionIceEvent = RTCPeerConnectionIceEvent;
  window.RTCDataChannelEvent = RTCDataChannelEvent;
  window.RTCDataChannelMessageEvent = RTCDataChannelMessageEvent;
  window.RTCTrackEvent = RTCTrackEvent;

  window.RTCRtpTransceiver = RTCRtpTransceiver; */

  window.customElements = new CustomElementRegistry(window);
  window.CustomElementRegistry = CustomElementRegistry;
  window.MutationObserver = MutationObserver;
  window.DOMRect = DOMRect;
  window.DOMPoint = DOMPoint;
  window.getComputedStyle = el => {
    let styleSpec = el[symbols.computedStyleSymbol];
    if (!styleSpec || styleSpec.epoch !== window[symbols.styleEpochSymbol]) {
      const style = el.style.clone();
      const stylesheetEls = el.ownerDocument.documentElement.getElementsByTagName('style')
        .concat(el.ownerDocument.documentElement.getElementsByTagName('link'));
      for (let i = 0; i < stylesheetEls.length; i++) {
        const {stylesheet} = stylesheetEls[i];
        if (stylesheet) {
          const {rules} = stylesheet;
          for (let j = 0; j < rules.length; j++) {
            const rule = rules[j];
            const {selectors} = rule;
            if (selectors && selectors.some(selector => el.matches(selector))) {
              const {declarations} = rule;
              for (let k = 0; k < declarations.length; k++) {
                const {property, value} = declarations[k];
                style[property] = value;
              }
            }
          }
        }
      }
      styleSpec = {
        style,
        styleEpoch: window[symbols.styleEpochSymbol],
      };
      el[symbols.computedStyleSymbol] = styleSpec;
    }
    return styleSpec.style;
  };
  /* window.browser = {
    devTools: DevTools,
    http,
    // https,
    ws,
    magicleap: nativeMl ? {
      RequestMeshing: () => nativeMl.RequestMeshing(window),
      RequestPlaneTracking: () => nativeMl.RequestPlaneTracking(window),
      RequestHandTracking: () => nativeMl.RequestHandTracking(window),
      RequestEyeTracking: () => nativeMl.RequestEyeTracking(window),
      RequestImageTracking: (img, size) => nativeMl.RequestImageTracking(window, img, size),
      RequestDepthPopulation: nativeMl.RequestDepthPopulation,
      RequestCamera: nativeMl.RequestCamera,
    } : null,
    monitors: new MonitorManager(),
    setSetting(key, value) {
      args[key] = value;
    },
    inspect: util.inspect,
    requestDomExport(el) {
      const promises = [];
      const _getExport = el => {
        if (el.nodeType === Node.ELEMENT_NODE && el.tagName === 'IFRAME' && el.contentWindow) {
          if (el.contentWindow.evalAsync) {
            const promise = el.contentWindow.evalAsync(`browser.requestDomExport(document.body.parentNode)`)
              .then(iframeResult => {
                result.childNodes = [iframeResult];
              });
            promises.push(promise);
          }
        }

        const result = {
          nodeType: el.nodeType || 0,
          tagName: el.tagName || '',
          value: el.value || '',
          attrs: el.attrs || [],
          childNodes: el.childNodes.map(_getExport),
        };
        return result;
      };
      const result = _getExport(el);
      return Promise.all(promises).then(() => result);
    },
    async applyDomEdit(rootEl, keypath, edit) {
      const _getDomNode = (el, i = 0) => {
        if (i < keypath.length) {
          const key = keypath[i];
          const childNode = el.childNodes[key];
          if (childNode) {
            return _getDomNode(childNode, i+1);
          } else {
            return [el, keypath.slice(i)];
          }
        } else {
          return [el, []];
        }
      };
      const [el, remainingKeypath] = _getDomNode(rootEl);
      if (remainingKeypath.length === 0) {
        const {type} = edit;
        if (type === 'name') {
          const {oldName, oldValue, newName} = edit;
          el.removeAttribute(oldName);
          el.setAttribute(newName, oldValue);
        } else if (type === 'value') {
          const {name, newValue} = edit;
          el.setAttribute(name, newValue);
        } else if (type === 'remove') {
          el.parentNode.removeChild(el);
        } else {
          throw new Error(`unknown dom edit type: ${type}`);
        }
      } else {
        if (el.tagName === 'IFRAME' && el.contentWindow) {
          await el.contentWindow.evalAsync(`browser.applyDomEdit(document, ${JSON.stringify(remainingKeypath)}, ${JSON.stringify(edit)})`);
        } else {
          console.warn('unresolved dom edit', el, remainingKeypath);
        }
      }
    },
  }; */
  window.DOMParser = class DOMParser {
    parseFromString(htmlString, type) {
      const _recurse = node => {
        let nodeName = null;
        let value = null;
        if (node.type === 'text') {
          nodeName = '#text';
          value = node.text;
        } else if (node.type === 'comment') {
          nodeName = '#comment';
          value = node.content;
        }

        const tagName = node.name || null;

        const attrs = [];
        if (node.attributes) {
          for (const name in node.attributes) {
            attrs.push({
              name,
              value: node.attributes[name],
            });
          }
        }

        const childNodes = node.children ? node.children.map(childNode => _recurse(childNode)) : [];

        return {
          nodeName,
          tagName,
          attrs,
          value,
          childNodes,
        };
      };
      const xmlAst = parseXml(htmlString, {
        // preserveComments: true,
      });
      const htmlAst = _recurse(xmlAst);
      return _parseDocumentAst(htmlAst, window, false);
    }
  };
  window._listeners = {}; // EventTarget
  window.listeners = EventTarget.prototype.listeners.bind(window);
  window.addEventListener = EventTarget.prototype.addEventListener.bind(window);
  window.removeEventListener = EventTarget.prototype.removeEventListener.bind(window);
  window.dispatchEvent = EventTarget.prototype.dispatchEvent.bind(window);

  window.Image = HTMLImageElement;
  /* window.ImageData = ImageData;
  window.ImageBitmap = ImageBitmap;
  window.Path2D = Path2D;
  window.CanvasGradient = CanvasGradient; */
  window.CanvasRenderingContext2D = CanvasRenderingContext2D;
  window.WebGLRenderingContext = WebGLRenderingContext;
  window.WebGL2RenderingContext = WebGL2RenderingContext;
  window.Audio = HTMLAudioElement;
  window.MediaRecorder = MediaRecorder;
  window.DataTransfer = DataTransfer;
  window.DataTransferItem = DataTransferItem;
  window.Screen = Screen;
  window.Gamepad = Gamepad;
  window.VRStageParameters = VRStageParameters;
  window.VRDisplay = VRDisplay;
  // window.ARDisplay = ARDisplay;
  window.VRFrameData = VRFrameData;
  if (window.navigator.xr) {
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
  }
  window.FakeXRDisplay = FakeXRDisplay;
  window.TextEncoder = TextEncoder;
  window.TextDecoder = TextDecoder;
  window.AudioContext = AudioContext;
  window.AudioNode = AudioNode;
  window.AudioBufferSourceNode = AudioBufferSourceNode;
  window.OscillatorNode = OscillatorNode;
  window.AudioDestinationNode = AudioDestinationNode;
  window.AudioParam = AudioParam;
  window.AudioListener = AudioListener;
  window.GainNode = GainNode;
  window.AnalyserNode = AnalyserNode;
  window.PannerNode = PannerNode;
  window.StereoPannerNode = StereoPannerNode;
  window.createImageBitmap = (createImageBitmapOld => function createImageBitmap(image, sx, sy, sw, sh, options) {
    if (image && image.constructor && image.constructor.name === 'HTMLImageElement') {
      image = image.imageBitmap;
    }
    if (image && image.constructor && image.constructor.name === 'HTMLCanvasElement') {
      image = image.backingCanvas;
    }
    if (options !== undefined) {
      return createImageBitmapOld(image, sx, sy, sw, sh, options);
    } else if (sh !== undefined) {
      return createImageBitmapOld(image, sx, sy, sw, sh);
    } else if (sw !== undefined) {
      return createImageBitmapOld(image, sx, sy, sw);
    } else if (sy !== undefined) {
      return createImageBitmapOld(image, sx, sy);
    } else if (sx !== undefined) {
      return createImageBitmapOld(image, sx);
    } else {
      return createImageBitmapOld(image);
    }
  })(window.createImageBitmap);
  // window.Worker = Worker;
  window.PaymentRequest = PaymentRequest;
  window.requestAnimationFrame = _makeRequestAnimationFrame(window);
  window.cancelAnimationFrame = id => {
    const index = rafCbs.findIndex(r => r && r[symbols.idSymbol] === id);
    if (index !== -1) {
      rafCbs[index] = null;
    }
  };
  window.postMessage = function(data, targetOrigin, transfer) {
    if (window.top === window) {
      Promise.resolve().then(() => {
        window.dispatchEvent(new MessageEvent('message', {data}));
      });
    } else {
      window._postMessage(data, transfer);
    }
  };
  /*
    Treat function onload() as a special case that disables automatic event attach for onload, because this is how browsers work. E.g.
      <!doctype html><html><head><script>
        function onload() {
          console.log ('onload'); // NOT called; presence of top-level function onload() makes all the difference
        }
        window.onload = onload;
      </script></head></html>
  */
  /* window[symbols.disabledEventsSymbol] = {
    load: undefined,
    error: undefined,
  };
  window._emit = function(type) {
    if (!this[symbols.disabledEventsSymbol][type]) {
      Node.prototype._emit.apply(this, arguments);
    }
  }; */
  Object.defineProperty(window, 'onload', {
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
  });

  window.history.addEventListener('popstate', ({detail: {url, state}}) => {
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

      self._postMessage({
        method: 'emit',
        type: 'navigate',
        event: {
          href,
        },
      });
    }
  });

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
  const _renderLocal = (frame, layered) => {
    for (let i = 0; i < contexts.length; i++) {
      const context = contexts[i];
      context._exokitClearEnabled && context._exokitClearEnabled(true);
    }
    const layerContext = layered ? vrPresentState.glContext : null;
    if (layerContext) {
      if (frame) {
        layerContext._exokitPutFrame(frame);
        frame = null;
      } else {
        layerContext._exokitClear();
      }
      layerContext._exokitClearEnabled(false);
    }
    _tickLocalRafs();
    if (layerContext) {
      frame = layerContext._exokitGetFrame();
    }
    return Promise.resolve(frame);
  };
  const _makeRenderChild = window => (frame, layered) => window.runAsync({
    method: 'tickAnimationFrame',
    frame,
    layered: layered && vrPresentState.layers.some(layer => layer.contentWindow === window),
  }, frame ? [frame.color, frame.depth] : undefined);
  const _collectRenders = () => windows.map(_makeRenderChild).concat([_renderLocal]);
  const _render = (frame, layered) => new Promise((accept, reject) => {
    const renders = _collectRenders();
    const _recurse = i => {
      if (i < renders.length) {
        renders[i](frame, layered)
          .then(newFrame => {
            frame = newFrame;
            _recurse(i+1);
          })
          .catch(err => {
            _recurse(i+1);
          });
      } else {
        accept(frame);
      }
    };
    _recurse(0);
  });
  window.tickAnimationFrame = ({frame = null, layered = false}) => {
    _emitXrEvents(); 
    return _render(frame, layered);
  };

  const _makeMrDisplays = () => {
    const _onrequestpresent = async () => {
      // if (!GlobalContext.xrState.isPresenting[0]) {
        await new Promise((accept, reject) => {
          vrPresentState.responseAccepts.push(accept);

          self._postMessage({
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
        vrPresentState.fbo = context.createFramebuffer().id;
        vrPresentState.msFbo = context.createFramebuffer().id;
        // vrPresentState.glContext.setClearEnabled(false);

        window.document.dispatchEvent(new CustomEvent('domchange')); // open mirror window
      }

      return {
        fbo: vrPresentState.fbo,
      };
    };
    const _onexitpresent = async () => {
      // if (GlobalContext.xrState.isPresenting[0]) {
        await new Promise((accept, reject) => {
          vrPresentState.responseAccepts.push(accept);

          self._postMessage({
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

      self._postMessage({
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
      window.dispatchEvent(new CustomEvent('vrdisplaypresentchange', {
        detail: {
          display: vrDisplay,
        },
      }));
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
  window[symbols.mrDisplaysSymbol] = _makeMrDisplays();
  window.vrdisplayactivate = () => {
    const displays = window.navigator.getVRDisplaysSync();
    if (displays.length > 0 && (!window[symbols.optionsSymbol].args || ['all', 'webvr'].includes(window[symbols.optionsSymbol].args.xr)) && !displays[0].isPresenting) {
      const e = new window.Event('vrdisplayactivate');
      e.display = displays[0];
      window.dispatchEvent(e);
    }
  };

  window.document = _parseDocument(options.htmlString, window);
  window.document.hidden = options.hidden || false;
  window.document.xrOffset = options.xrOffsetBuffer ? new XR.XRRigidTransform(options.xrOffsetBuffer) : new XR.XRRigidTransform();
})(self);

self.onrunasync = req => {
  const {method} = req;

  switch (method) {
    case 'tickAnimationFrame':
      return self.tickAnimationFrame(req).then(frame => {
        const transfers = frame && [frame.color, frame.depth];
        return Promise.resolve([frame, transfers]);
      });
    case 'response': {
      const {keypath} = req;

      if (keypath.length === 0) {
        if (vrPresentState.responseAccepts.length > 0) {
          vrPresentState.responseAccepts.shift()(req);

          return Promise.resolve();
        } else {
          return Promise.reject(new Error(`unexpected response at window ${method}`));
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
        return Promise.resolve();
      }
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
    } */
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
    case 'eval': // used in tests
      return Promise.resolve([(0, eval)(req.scriptString), []]);
    default:
      return Promise.reject(new Error(`invalid window async request: ${JSON.stringify(req)}`));
  }
};
/* global.onexit = () => {
  const localContexts = contexts.slice();
  for (let i = 0; i < localContexts.length; i++) {
    localContexts[i].destroy();
  }
  
  AudioContext.Destroy();
  nativeWindow.destroyThreadPool();
}; */
// global.setImmediate = undefined; // need this for the TLS implementation
