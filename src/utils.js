import path from '../modules/path-browserify.js';
// const fs = require('fs');
// const url = require('url');

import parseIntStrict from '../modules/parse-int.js';

import symbols from './symbols.js';

import GlobalContext from './GlobalContext.js';

const module = {exports: {}};

function _getBaseUrl(u) {
  let result;
  if (/^file:\/\//.test(u)) {
    result = u;
  } else if (/^(?:data|blob):/.test(u)) {
    result = location.origin;
  } else {
    if (!/^[a-z]+:/.test(u)) {
      let {href} = location;
      href = href.replace(/#.*$/, '');
      u = href + '/' + u;
    }
    const parsedUrl = new URL(u);
    parsedUrl.pathname = parsedUrl.pathname.replace(/\/[^\/]*\.[^\/]*$/, '') || '/';
    result = parsedUrl.href;
    /* result = url.format({
      protocol: parsedUrl.protocol || 'http:',
      host: parsedUrl.host || '127.0.0.1',
      pathname: parsedUrl.pathname.replace(/\/[^\/]*\.[^\/]*$/, '') || '/',
    }); */
  }
  if (!/\/$/.test(result) && !/\/[^\/]*?\.[^\/]*?$/.test(result)) {
    result += '/';
  }
  return result;
}
module.exports._getBaseUrl = _getBaseUrl;

function _normalizeUrl(src, baseUrl) {
  if (/^\/\//.test(src)) {
    src = new URL(baseUrl).protocol + src;
  }
  /* if (!/^[a-z]+:/.test(src)) {
    src = baseUrl + (!/\/$/.test(baseUrl) ? '/' : '') + src;
  } */
  if (!/^(?:https?|data|blob):/.test(src)) {
    return new URL(src, baseUrl).href
      .replace(/^(file:\/\/)\/([a-z]:.*)$/i, '$1$2');
  } else {
    return src;
  }
}
module.exports._normalizeUrl = _normalizeUrl;

function _getProxyUrl(u) {
  if (/^https?:\/\//.test(u) && !u.startsWith(self.location.origin) || !/^(?:[a-z]+:|\/\.[pdf]\/)/.test(u)) {
    const el = document.querySelector('base');
    const baseUrl = (el && el.href) || self.location.origin;
    u = self.location.origin + '/.p/' + new URL(u, baseUrl).href;
  }
  return u;
}
module.exports._getProxyUrl = _getProxyUrl;

/* const _makeHtmlCollectionProxy = (el, query) => new Proxy(el, {
  get(target, prop) {
    const propN = parseIntStrict(prop);
    if (propN !== undefined) {
      return el.querySelectorAll(query)[propN];
    } else if (prop === 'length') {
      return el.querySelectorAll(query).length;
    } else {
      return undefined;
    }
  },
  set(target, prop, value) {
    return true;
  },
  deleteProperty(target, prop) {
    return true;
  },
  has(target, prop) {
    if (typeof prop === 'number') {
      return el.querySelectorAll(query)[prop] !== undefined;
    } else if (prop === 'length') {
      return true;
    } else {
      return false;
    }
  },
});
module.exports._makeHtmlCollectionProxy = _makeHtmlCollectionProxy; */

const _elementGetter = (self, attribute) => self.listeners(attribute).filter(l => l[symbols.listenerSymbol])[0];
module.exports._elementGetter = _elementGetter;

const _elementSetter = (self, attribute, cb) => {
  const listener = _elementGetter(self, attribute);
  if (listener) {
    self.removeEventListener(attribute, listener);
    listener[symbols.listenerSymbol] = false;
  }
  
  if (typeof cb === 'function') {
    self.addEventListener(attribute, cb);
    cb[symbols.listenerSymbol] = true;
  }
};
module.exports._elementSetter = _elementSetter;

const _makeNullPromise = () => {
  let resolve, reject;
  const result = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  result.resolve = resolve;
  result.reject = reject;
  return result;
};
module.exports._makeNullPromise = _makeNullPromise;

const _replaceDocument = async htmlString => {
  document.open();
  document.write(htmlString);
  document.close();

  if (document.readyState !== 'complete') {
    await new Promise((accept, reject) => {
      document.addEventListener('readystatechange', () => {
        if (document.readyState === 'complete') {
          accept();
        }
      });
    });
  }
  await new Promise((accept, reject) => {
    const script = document.createElement('script');
    script.onload = accept;
    script.onerror = reject;
    script.src = `data:application/javascript,1`;
    document.body.appendChild(script);
  });
};
module.exports._replaceDocument = _replaceDocument;

export default module.exports;
