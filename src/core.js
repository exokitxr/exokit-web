// const url = require('url');
// const {URL} = url;

// const {fetch} = require('./fetch');
import GlobalContext from './GlobalContext.js';
import symbols from './symbols.js';
import utils from './utils.js';
const {_getBaseUrl} = utils;
import {_makeWindow} from './WindowVm.js';

const exokit = {};
exokit.make = (htmlString, options) => {
  if (typeof htmlString === 'object') {
    options = htmlString;
    htmlString = undefined;
  }
  htmlString = htmlString || '';
  options = options || {};

  options.url = options.url || 'http://127.0.0.1/';
  options.baseUrl = options.baseUrl || options.url;
  // options.dataPath = options.dataPath || __dirname;
  options.args = options.args || {};
  options.htmlString = htmlString;
  options.replacements = options.replacements || {};
  return _makeWindow(options);
};
exokit.load = (src, options = {}) => {
  if (!/^[a-z]+:/.test(src)) {
    const u = new URL(window.location.href);
    u.hash = '';
    u.search = '';
    u.pathname += src;
    src = u.href;
  }
  options.args = options.args || {};
  options.replacements = options.replacements || {};

  let baseUrl;
  if (options.baseUrl) {
    baseUrl = options.baseUrl;
  } else {
    baseUrl = _getBaseUrl(src);
  }

  return exokit.make({
    url: options.url || src,
    baseUrl,
    xrTop: options.xrTop,
    // dataPath: options.dataPath,
    args: options.args,
    replacements: options.replacements,
    onnavigate: options.onnavigate,
    onrequest: options.onrequest,
    onpointerlock: options.onpointerlock,
    onhapticpulse: options.onhapticpulse,
    onpaymentrequest: options.onpaymentrequest,
    onxroffsetchange: options.onxroffsetchange,
    ondatasetchange: options.ondatasetchange,
  });
};
exokit.setArgs = newArgs => {
  GlobalContext.args = newArgs;
};
exokit.setVersion = newVersion => {
  GlobalContext.version = newVersion;
};
exokit.animate = function animate() {};
let animationContext = null;
let animationFrame = null;
const _setAnimationContext = newAnimationContext => {
  if (animationContext) {
    animationContext.cancelAnimationFrame(animationFrame);
    animationContext = null;
    animationFrame = null;
  }
  animationContext = newAnimationContext;
  const _recurse = () => {
    animationFrame = animationContext.requestAnimationFrame((timestamp, frame) => {
      _recurse();
      exokit.animate(timestamp, frame, referenceSpace);
    });
  };
  _recurse();
};
let session = null;
exokit.getSession = () => session;
exokit.setSession = newSession => {
  if (newSession) {
    _setAnimationContext(newSession);
  } else {
    _setAnimationContext(window);
  }
  session = newSession;
};
let referenceSpace = null;
exokit.setReferenceSpace = newReferenceSpace => {
  referenceSpace = newReferenceSpace;
};

export default exokit;
