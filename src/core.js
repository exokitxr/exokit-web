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
    let {href} = location;
    href = href.replace(/#.*$/, '');
    src = href + (!/\/$/.test(href) ? '/' : '') + src;
  }
  options.args = options.args || {};
  options.replacements = options.replacements || {};

  // let redirectCount = 0;
  const _fetchText = src => fetch(src)
    .then(res => {
      if (res.status >= 200 && res.status < 300) {
        return res.text()
          .then(htmlString => ({
            src,
            htmlString,
          }));
      /* } else if (res.status >= 300 && res.status < 400) {
        const l = res.headers.get('Location');
        if (l) {
          if (redirectCount < 10) {
            redirectCount++;
            return _fetchTextFollow(l);
          } else {
            return Promise.reject(new Error('fetch got too many redirects: ' + res.status + ' : ' + src));
          }
        } else {
          return Promise.reject(new Error('fetch got redirect with no location header: ' + res.status + ' : ' + src));
        } */
      } else {
        return Promise.reject(new Error('fetch got invalid status code: ' + res.status + ' : ' + src));
      }
    });
  return _fetchText(src)
    .then(({src, htmlString}) => {
      let baseUrl;
      if (options.baseUrl) {
        baseUrl = options.baseUrl;
      } else {
        baseUrl = _getBaseUrl(src);
      }

      return exokit.make(htmlString, {
        url: options.url || src,
        baseUrl,
        dataPath: options.dataPath,
        args: options.args,
        replacements: options.replacements,
        onnavigate: options.onnavigate,
        onrequest: options.onrequest,
        onpointerlock: options.onpointerlock,
        onhapticpulse: options.onhapticpulse,
        onpaymentrequest: options.onpaymentrequest,
      });
    });
};
exokit.setArgs = newArgs => {
  GlobalContext.args = newArgs;
};
exokit.setVersion = newVersion => {
  GlobalContext.version = newVersion;
};

export default exokit;
