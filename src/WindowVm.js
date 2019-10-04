import path from '../modules/path-browserify.js';
import GlobalContext from './GlobalContext.js';
 
const entrypointSrc = `${import.meta.url.replace(/[^\/]+$/, '')}WindowBase.js`;

class MessagePort2 extends EventTarget {
  constructor() {
    super();

    this.remotePort = null;
  }
  postMessage(data, transfer) {
    this.remotePort.dispatchEvent(new MessageEvent('message', {data}));
  }
  start() {}
}
class MessageChannel2 {
  constructor() {
    this.port1 = new MessagePort2();
    this.port2 = new MessagePort2();
    this.port1.remotePort = this.port2;
    this.port2.remotePort = this.port1;
  }
}

class WorkerVm extends EventTarget {
  constructor(options = {}) {
    super();

    const queue = [];
    const iframe = document.createElement('iframe');
    const _getFollowUrl = u => {
      if (/^[a-z]+:\/\//.test(u) && !u.startsWith('data:') && !u.startsWith(location.origin)) {
        return fetch('/.f/' + u)
          .then(res => res.text());
      } else {
        return Promise.resolve(u);
      }
    };
    _getFollowUrl(options.args.options.url)
      .then(followUrl => new Promise((accept, reject) => {
        const src = window.location.origin +
          (options.args.options.url.startsWith('data:') ?
            `/xr-engine-${Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)}.html`
          :
            options.args.options.url.replace(/^[a-z]+:\/\/[a-zA-Z0-9\-\.]+(?::[0-9]+)?/, ''));
        const dst = `\
<!doctype html>
<html>
  <body>
    <script type=module src="${entrypointSrc}"></script>
  </body>
</html>
`;

        const mc = new MessageChannel();
        navigator.serviceWorker.controller.postMessage({
          method: 'redirect',
          src,
          dst,
        }, [mc.port2]);
        mc.port1.onmessage = () => {
          iframe.src = src;

          iframe.addEventListener('load', () => {
            const {queue} = messageChannel.port2.handleMessage;

            const {contentWindow} = iframe;
            options.args.options.url = followUrl;
            contentWindow.dispatchEvent(new MessageEvent('message', {
              data: {
                method: 'init',
                workerData: {
                  initModule: options.initModule,
                  args: options.args,
                },
                messagePort: messageChannel.port2,
              },
            }));
            
            if (!messageChannel.port2.handleMessage.lol) { // XXX
              console.warn('message handler not added!!!!!!!!!!!!!!!!!', messageChannel.port2.handleMessage, messageChannel.port2.handleMessage && messageChannel.port2.handleMessage.lol);
            }

            for (let i = 0; i < queue.length; i++) {
              messageChannel.port2.handleMessage(queue[i]);
            }

            accept();
          }, {
            once: true,
          });
          iframe.addEventListener('error', reject);
        };
      }))
      .catch(err => {
        console.warn(err);
        this.dispatchEvent(new ErrorEvent({
          error: err,
        }));
      });

    const messageChannel = new MessageChannel2();
    messageChannel.port2.postMessageSync = (data, transfers) => {
      messageChannel.port1.handleMessage(new MessageEvent('message', {data}));
    };
    messageChannel.port1.postMessageSync = (data, transfers) => {
      messageChannel.port2.handleMessage(new MessageEvent('message', {data}));
    };
    messageChannel.port1.handleMessage = e => {
      const {data: m} = e;
      switch (m.method) {
        case 'request': {
          this.dispatchEvent(new CustomEvent('request', {
            detail: m,
          }));
          break;
        }
        case 'response': {
          const fn = this.queue[m.requestKey];

          if (fn) {
            fn(m.error, m.result);
            delete this.queue[m.requestKey];
          } else {
            console.warn(`unknown response request key: ${m.requestKey}`);
          }
          break;
        }
        case 'postMessage': {
          const {data} = m;
          this.dispatchEvent(new MessageEvent('message', {
            data,
          }));
          break;
        }
        case 'emit': {
          const {type, event} = m;
          const e = new CustomEvent(m.type, {
            detail: event,
          });
          /* for (const k in event) {
            e[k] = event[k];
          } */
          this.dispatchEvent(e);
          break;
        }
        case 'load': {
          iframe._postMessageDownQueued = iframe._postMessageDown;

          for (let i = 0; i < queue.length; i++) {
            const [data, transfers] = queue[i];
            iframe._postMessageDownQueued(data, transfers);
          }
          queue.length = 0;

          this.dispatchEvent(new CustomEvent('load'));
          break;
        }
        case 'error': {
          const {error} = m;
          this.dispatchEvent(new ErrorEvent('error', {
            error,
          }));
          break;
        }
        default: {
          // console.warn(`worker got unknown message: '${JSON.stringify(m)}'`);
          break;
        }
      }
    };
    messageChannel.port1.addEventListener('message', messageChannel.port1.handleMessage);
    messageChannel.port1.start();

    messageChannel.port2.handleMessage = e => {
      messageChannel.port2.handleMessage.queue.push(e);
    };
    messageChannel.port2.handleMessage.queue = [];
    
    iframe._postMessageDown = function _postMessageDown(data, transfers) {
      messageChannel.port1.postMessageSync(data, transfers);
    };
    iframe._postMessageDownQueued = function _postMessageDownQueued(data, transfers) {
      queue.push([data, transfers]);
    };
    this.iframe = iframe;

    iframe.style.position = 'absolute';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    this.requestKeys = 0;
    this.queue = {};
  }

  queueRequest(fn) {
    const requestKey = this.requestKeys++;
    this.queue[requestKey] = fn;
    return requestKey;
  }

  /* runRepl(jsString, transferList) {
    return new Promise((accept, reject) => {
      const requestKey = this.queueRequest((err, result) => {
        if (!err) {
          accept(result);
        } else {
          reject(err);
        }
      });
      this.iframe._postMessageDown({
        method: 'runRepl',
        jsString,
        requestKey,
      }, transferList);
    });
  } */
  runAsync(request, transferList) {
    let result, error;
    const requestKey = this.queueRequest((err, res) => {
      error = err;
      result = res;
    });
    this.iframe._postMessageDown({
      method: 'runAsync',
      request,
      requestKey,
    }, transferList);
    if (!error) {
      return result;
    } else {
      throw error;
    }
  }
  postMessage(message, transferList) {
    this.iframe._postMessageDownQueued({
      method: 'postMessage',
      message,
    }, transferList);
  }
  emit(type, event) {
    this.iframe._postMessageDown && this.iframe._postMessageDown({
      method: 'emit',
      type,
      event,
    });
  }
  
  destroy() {
    document.body.removeChild(this.iframe);
    this.iframe = null;
  }
}

const _clean = o => {
  const result = {};
  for (const k in o) {
    const v = o[k];
    if (typeof v !== 'function') {
      result[k] = v;
    }
  }
  return result;
};
const _makeWindow = (options = {}) => {
  const id = ++GlobalContext.xrState.id[0];
  const window = new WorkerVm({
    initModule: './Window.js',
    args: {
      options: _clean(options),
      id,
      args: GlobalContext.args,
      version: GlobalContext.version,
      xrState: GlobalContext.xrState,
    },
  });
  window.id = id;
  window.loaded = false;
  window.rendered = false;
  window.highlight = null;
  // window.framebuffer = null;
  // window.phase = 0; // XXX
  // window.rendered = false;
  // window.promise = null;
  // window.syncs = null;

  window.evalAsync = scriptString => window.runAsync({method: 'eval', scriptString});

  /* window.on('resize', ({width, height}) => {
    // console.log('got resize', width, height);
    window.width = width;
    window.height = height;
  });
  window.on('framebuffer', framebuffer => {
    // console.log('got framebuffer', framebuffer);
    window.document.framebuffer = framebuffer;
  }); */
  window.addEventListener('navigate', ({href}) => {
    window.destroy()
      // .then(() => {
        options.onnavigate && options.onnavigate(href);
      /* })
      .catch(err => {
        console.warn(err.stack);
      }); */
  });
  window.addEventListener('request', e => {
    const {detail: req} = e;
    req.keypath.push(id);
    options.onrequest && options.onrequest(req);
  });
  /* window.addEventListener('framebuffer', e => {
    const {detail: framebuffer} = e;
    window.framebuffer = framebuffer;
  }); */
  window.addEventListener('pointerLock', e => {
    options.onpointerlock && options.onpointerlock(e.detail);
  });
  window.addEventListener('hapticPulse', e => {
    options.onhapticpulse && options.onhapticpulse(e.detail);
  });
  window.addEventListener('paymentRequest', e => {
    options.onpaymentrequest && options.onpaymentrequest(e.detail);
  });
  window.addEventListener('xrOffsetChange', e => {
    options.onxroffsetchange && options.onxroffsetchange(e.detail);
  });
  window.addEventListener('datasetChange', e => {
    options.ondatasetchange && options.ondatasetchange(e.detail);
  });
  window.addEventListener('load', () => {
    window.loaded = true;
  }, {
    once: true,
  });
  /* window.addEventListener('error', err => {
    console.warn(err.stack);
  }); */
  window.destroy = (destroy => function() {
    destroy.apply(this, arguments);
    GlobalContext.windows.splice(GlobalContext.windows.indexOf(window), 1);

    const ks = Object.keys(window.queue);
    if (ks.length > 0) {
      const err = new Error('cancel request: window destroyed');
      err.code = 'ECANCEL';
      for (let i = 0; i < ks.length; i++) {
        window.queue[ks[i]](err);
      }
    }
    window.queue = null;

    // return Promise.resolve();
  })(window.destroy);
  
  GlobalContext.windows.push(window);

  return window;
};

export {
  WorkerVm,
  _makeWindow,
};
