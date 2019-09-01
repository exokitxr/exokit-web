import util from '../modules/util.js';

import {DragEvent, KeyboardEvent, MouseEvent, WheelEvent} from './Event.js';
// import {MediaDevices, Clipboard, Navigator} from './Navigator.js';

import GlobalContext from './GlobalContext.js';

import utils from './utils.js';

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

  History.prototype.pushState = (_pushState => function pushState(data, title, url) {
    url = self.location.origin + url;
    const result = _pushState.call(this, data, title, url);
    return result;
  })(History.prototype.pushState);

  /* self.Navigator = Navigator;
  const navigator = new Navigator();
  Object.defineProperty(self, 'navigator', {
    get() {
      return navigator;
    },
  }); */

  /* self.fetch = (_fetch => function fetch(u, opts) {
    return _fetch(utils._normalizeUrl(u, GlobalContext.baseUrl), opts);
  })(self.fetch); */
  /* self.Request = Request;
  self.Response = Response;
  self.Headers = Headers;
  self.Blob = Blob;
  self.FormData = FormData;
  self.XMLHttpRequest = (Old => class XMLHttpRequest extends Old {
    open(method, url, async, user, password) {
      url = utils._normalizeUrl(url, GlobalContext.baseUrl);

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
  })(self.XMLHttpRequest); */
 
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

      messagePort.addEventListener('message', _onmessageHandle);
      messagePort.start();
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
    messagePort.postMessage(data, transfer);
  };
  const _onmessageHandle = e => {
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
        let result, err;
        try {
          result = self.onrunasync ? self.onrunasync(m.request) : null;
        } catch(e) {
          err = e.stack;
        }
        if (!err) {
          Promise.resolve(result)
            .then(resultSpec => {
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
            });
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
