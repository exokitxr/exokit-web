import './event-target-shim.mjs';

import util from '../modules/util.js';

import {DragEvent, KeyboardEvent, MouseEvent, WheelEvent} from './Event.js';
// import {MediaDevices, Clipboard, Navigator} from './Navigator.js';

import GlobalContext from './GlobalContext.js';

import utils from './utils.js';
const {_getProxyUrl} = utils;

const _oninitmessage = async e => {
  const {workerData, messagePort} = e.data;
  const {
    initModule,
    args,
  } = workerData;
  GlobalContext.workerData = {
    initModule,
    args,
  };
  GlobalContext.xrState = args.xrState;

  self.parent = {
    postMessage(m, transfers) {
      self._postMessageUp({
        method: 'postMessage',
        data: m,
      }, transfers);
    },
  };
  History.prototype.pushState = (_pushState => function pushState(data, title, url) {
    url = self.location.origin + url;
    const result = _pushState.call(this, data, title, url);
    return result;
  })(History.prototype.pushState);
  History.prototype.replaceState = (_replaceState => function replaceState(data, title, url) {
    url = self.location.origin + url;
    const result = _replaceState.call(this, data, title, url);
    return result;
  })(History.prototype.replaceState);
  Element.prototype.requestFullscreen = async function requestFullscreen() {};
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    get() {
      return self.innerWidth;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    get() {
      return self.innerHeight;
    },
  });
  ServiceWorkerContainer.prototype.register = async function register() {};
  const mediaDevicesPrototype = (typeof MediaDevices !== 'undefined') ? MediaDevices : navigator.mediaDevices.__proto__; // Safari
  mediaDevicesPrototype.enumerateDevices = (_enumerateDevices => function enumerateDevices() {
    return _enumerateDevices.apply(this, arguments)
      .then(ds => ds.map((d, i) => {
        d = JSON.parse(JSON.stringify(d));
        d.label = `Fake device (${i})`;
        return d;
      }));
  })(mediaDevicesPrototype.enumerateDevices);
  self.fetch = (_fetch => function fetch(u, opts) {
    const oldUrl = u;
    u = _getProxyUrl(u);
    return _fetch.call(this, u, opts);
  })(self.fetch);
  self.XMLHttpRequest = (_XMLHttpRequest => class XMLHttpRequest extends _XMLHttpRequest {
    open(method, url, async, user, password) {
      const oldUrl = url;
      url = _getProxyUrl(url);

      if (password !== undefined) {
        return super.open(method, url, async, user, password);
      } else if (user !== undefined) {
        return super.open(method, url, async, user);
      } else if (async !== undefined) {
        return super.open(method, url, async);
      } else {
        return super.open(method, url);
      }
    }
  })(self.XMLHttpRequest);
  self.Worker = (_Worker => class Worker extends _Worker {
    constructor(url, options) {
      url = _getProxyUrl(url);
      super(url, options);
    }
  })(self.Worker);
  Object.defineProperty(self.HTMLImageElement.prototype, 'src', {
    get() {
      return this.getAttribute('src');
    },
    set(newSrc) {
      newSrc = _getProxyUrl(newSrc);
      this.setAttribute('src', newSrc);
    },
  });

  /* self.Navigator = Navigator;
  const navigator = new Navigator();
  Object.defineProperty(self, 'navigator', {
    get() {
      return navigator;
    },
  }); */

  /* self.Request = Request;
  self.Response = Response;
  self.Headers = Headers;
  self.Blob = Blob;
  self.FormData = FormData; */
 
  /* const messageQueue = [];
  const _onmessageQueue = e => {
    messageQueue.push(e);
  };
  messagePort.addEventListener('message', _onmessageQueue); */
  self._onbootstrap = e => {
    const {error} = e;

    // messagePort.removeEventListener('message', _onmessageQueue);

    if (!error) {
      self._postMessageUp({
        method: 'load',
      });

      /* console.log('flush messages', messageQueue.length);
      for (let i = 0; i < messageQueue.length; i++) {
        self.dispatchEvent(messageQueue[i]);
      } */
    } else {
      self._postMessageUp({
        method: 'error',
        error,
      });
    }

    // messageQueue.length = 0;
    self._onbootstrap = undefined;
  };
  self._postMessageUp = function _postMessageUp(data, transfer) {
    messagePort.postMessageSync(data, transfer);
  };
  const {queue} = messagePort.handleMessage;
  messagePort.handleMessage = e => {
    const {data: m} = e;

    switch (m.method) {
      case 'runRepl': {
        let result, err;
        try {
          result = util.inspect((0, eval)(m.jsString));
        } catch(e) {
          err = e.stack;
        }
        self._postMessageUp({
          method: 'response',
          requestKey: m.requestKey,
          result,
          error: err,
        });
        break;
      }
      case 'runAsync': {
        let resultSpec, err;
        try {
          resultSpec = self.onrunasync ? self.onrunasync(m.request) : null;
        } catch(e) {
          err = e.stack;
        }
        if (!err) {
          let result, transfers;
          if (resultSpec) {
            result = resultSpec[0];
            transfers = resultSpec[1];
          }
          self._postMessageUp({
            method: 'response',
            requestKey: m.requestKey,
            result,
          }, transfers);
        } else {
          self._postMessageUp({
            method: 'response',
            requestKey: m.requestKey,
            error: err,
          });
        }
        break;
      }
      case 'postMessage': {
        try {
          window.dispatchEvent(new MessageEvent('message', {
            data: m.message,
          }));
        } catch(err) {
          console.warn(err.stack);
        }
        break;
      }
      case 'emit': {
        if (GlobalContext.contexts) {
          const {type, event} = m;
          let constructor, target;
          switch (type) {
            case 'keydown':
            case 'keyup':
            case 'keypress': {
              constructor = KeyboardEvent;
              target = 'input';
              break;
            }
            case 'mousedown':
            case 'mouseup':
            case 'click':
            case 'dblclick':
            case 'mousemove': {
              constructor = MouseEvent;
              target = 'input';
              break;
            }
            case 'wheel': {
              constructor = WheelEvent;
              target = 'input';
              break;
            }
            default: {
              constructor = function(type) {
                return new Event(type, {
                  bubbles: true,
                  cancelable: true,
                });
              };
              if (type === 'pointerlockchange' || type === 'fullscreenchange') {
                target = 'document';
              } else {
                target = 'window';
              }
              break;
            }
          }
          const e = new constructor(type);
          for (const k in event) {
            e[k] = event[k];
          }
          if (target === 'input') {
            for (let i = 0; i < GlobalContext.contexts.length; i++) {
              const {canvas} = GlobalContext.contexts[i];
              if (canvas.parentNode) {
                canvas.dispatchEvent(e);
                break;
              }
            }
          } else if (target === 'document') {
            document.dispatchEvent(e);
          } else {
            window.dispatchEvent(e);
          }
        }
        break;
      }
      default: throw new Error(`invalid method: ${JSON.stringify(m.method)}`);
    }
  };
  messagePort.handleMessage.lol = 'zol'; // XXX
  messagePort.addEventListener('message', messagePort.handleMessage);
  messagePort.start();

  for (let i = 0; i < queue.length; i++) {
    messagePort.handleMessage(queue[i]);
  }
  queue.length = 0;

  // run init module

  /* if (workerData.args) {
    global.args = workerData.args;
  } */

  /* process.on('uncaughtException', err => {
    console.warn('uncaught exception:', (err && err.stack) || err);
  });
  process.on('unhandledRejection', err => {
    console.warn('unhandled rejection:', (err && err.stack) || err);
  }); */

  if (args.onbeforeload) {
    GlobalContext.onbeforeload = args.onbeforeload;
    await import(args.onbeforeload);
  }

  await import(initModule);
};
self.addEventListener('message', _oninitmessage, {once: true});
