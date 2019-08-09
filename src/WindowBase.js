// const {Console} = require('console');
// const {EventEmitter} = require('../node_modules/events-browserify/events.js');
// import events from '../modules/events-browserify.js';
// const {EventEmitter} = events;
// import stream from '../modules/stream-browserify.js';
// import path from '../modules/path-browserify.js';
// const fs = require('fs');
// import url from 'url';
// const {URL} = url;
// const vm = require('vm');
import util from '../modules/util.js';

// const crypto = require('crypto');
// const {performance} = require('perf_hooks');

// const {Buffer} = global;

import {DragEvent, KeyboardEvent, MouseEvent, WheelEvent} from './Event.js';
import {MediaDevices, Clipboard, Navigator} from './Navigator.js';
import {Location} from './Location.js';
// const {FileReader} = require('./File');
// const {XMLHttpRequest, FormData} = require('window-xhr');
// const {fetch} = require('./fetch');
// const {Request, Response, Headers, Blob} = fetch;
// const WebSocket = require('ws/lib/websocket');

// const {WorkerVm} = require('./WindowVm');
import GlobalContext from './GlobalContext.js';

import utils from './utils.js';

// const btoa = s => Buffer.from(s, 'binary').toString('base64');
// const atob = s => Buffer.from(s, 'base64').toString('binary');

// XMLHttpRequest.setFetchImplementation(fetch);

/* const {
  nativeConsole,
} = require('./native-bindings'); */
// const {process} = global;


/* const consoleStream = new stream.Writable();
consoleStream._write = (chunk, encoding, callback) => {
  nativeConsole.Log(chunk);
  callback();
};
consoleStream._writev = (chunks, callback) => {
  for (let i = 0; i < chunks.length; i++) {
    nativeConsole.Log(chunks[i]);
  }
  callback();
};
global.console = new Console(consoleStream); */

// global initialization

/* for (const k in EventEmitter.prototype) {
  global[k] = EventEmitter.prototype[k];
}
EventEmitter.call(global);

class Worker extends EventTarget {
  constructor(src) {
    super();

    if (src instanceof Blob) {
      src = 'data:application/javascript,' + src.buffer.toString('utf8');
    } else {
      const blob = URL.lookupObjectURL(src);
      src = blob ?
        'data:application/octet-stream;base64,' + blob.buffer.toString('base64')
      :
        _normalizeUrl(src);
    }

    const worker = new WorkerVm({
      initModule: path.join(__dirname, 'Worker.js'),
      args: {
        src,
        options: {
          url: src,
          baseUrl: utils._getBaseUrl(src, args.options.baseUrl),
        },
        args: args.options.args,
        xrState: args.xrState,
      },
    });
    worker.on('message', m => {
      const e = new MessageEvent('message', {
        data: m.message,
      });
      this.emit('message', e);
    });
    worker.on('error', err => {
      this.emit('error', err);
    });
    this.worker = worker;
  }

  postMessage(message, transferList) {
    this.worker.postMessage(message, transferList);
  }

  terminate() {
    this.worker.destroy();
  }

  get onmessage() {
    return this.listeners('message')[0];
  }
  set onmessage(onmessage) {
    this.on('message', onmessage);
  }
  get onerror() {
    return this.listeners('error')[0];
  }
  set onerror(onerror) {
    this.on('error', onerror);
  }
} */

const _oninitmessage = e => {
  self.removeEventListener('message', _oninitmessage);

  const {workerData} = e.data;
  const {
    initModule,
    args,
  } = workerData;
  GlobalContext.workerData = {
    initModule,
    args,
  };
  GlobalContext.xrState = args.xrState;

  // self.btoa = btoa;
  // self.atob = atob;

  self.KeyboardEvent = KeyboardEvent;
  self.MouseEvent = MouseEvent;
  self.WheelEvent = WheelEvent;
  self.DragEvent = DragEvent;

  self.Location = Location;
  const location = new Location(args.options.url);
  Object.defineProperty(self, 'location', {
    get() {
      return location;
    },
    set(href) {
      href = href + '';
      location.href = href;
    },
  });

  self.Navigator = Navigator;
  const navigator = new Navigator();
  Object.defineProperty(self, 'navigator', {
    get() {
      return navigator;
    },
  });

  /* self.fetch = fetch;
  self.Request = Request;
  self.Response = Response;
  self.Headers = Headers;
  self.Blob = Blob;
  self.FormData = FormData;
  self.XMLHttpRequest = XMLHttpRequest;
  self.WebSocket = (Old => {
    class WebSocket extends Old {
      constructor(url, protocols, options) {
        if (typeof protocols === 'string') {
          protocols = [protocols];
        }
        if (typeof protocols == 'object' && !Array.isArray(protocols) && protocols !== null) {
          options = protocols;
          protocols = undefined;
        }
        options = options || {};
        options.origin = options.origin || (self.location.protocol + '//' + self.location.host);

        super(url, protocols, options);
      }
    }
    for (const k in Old) {
      WebSocket[k] = Old[k];
    }
    return WebSocket;
  })(WebSocket);
  self.FileReader = FileReader; */

  // self.performance = performance;

  /* self.crypto = {
    getRandomValues(typedArray) {
      crypto.randomFillSync(Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength));
      return typedArray;
    },

    subtle: {
      digest(algo, bytes) {
        switch (algo) {
          case 'SHA-1': {
            algo = 'sha1';
            break;
          }
          case 'SHA-256': {
            algo = 'sha256';
            break;
          }
          case 'SHA-384': {
            algo = 'sha384';
            break;
          }
          case 'SHA-512': {
            algo = 'sha512';
            break;
          }
          default: throw new Error(`unknown algorithm: ${algo}`);
        }
        const hash = crypto.createHash(algo).update(bytes).digest();
        const result = new ArrayBuffer(hash.byteLength);
        new Buffer(result).set(hash);
        return Promise.resolve(result);
      },
    },
  }; */

  // self.Worker = Worker;

  /* self.MediaDevices = MediaDevices;
  self.Clipboard = Clipboard; */

  /* self.postMessage = (message, transferList) => self.postMessage({
    method: 'postMessage',
    message,
  }, transferList);
  Object.defineProperty(self, 'onmessage', {
    get() {
      return this.listeners('message')[0];
    },
    set(onmessage) {
      self.on('message', onmessage);
    },
  }); */

  // const _normalizeUrl = src => utils._normalizeUrl(src, args.options.baseUrl);

  /* const SYNC_REQUEST_BUFFER_SIZE = 5 * 1024 * 1024; // TODO: we can make this unlimited with a streaming buffer + atomics loop
  function getScript(url) {
    let match;
    if (match = url.match(/^data:.+?(;base64)?,(.*)$/)) {
      if (match[1]) {
        return Buffer.from(match[2], 'base64').toString('utf8');
      } else {
        return match[2];
      }
    } else if (match = url.match(/^file:\/\/(.*)$/)) {
      return fs.readFileSync(match[1], 'utf8');
    } else {
      const sab = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT*3 + SYNC_REQUEST_BUFFER_SIZE);
      const int32Array = new Int32Array(sab);
      const worker = new WorkerBase(path.join(__dirname, 'request.js'), {
        workerData: {
          url: _normalizeUrl(url, args.options.baseUrl),
          int32Array,
        },
      });
      worker.on('error', err => {
        console.warn(err.stack);
      });
      Atomics.wait(int32Array, 0, 0);
      const status = new Uint32Array(sab, Int32Array.BYTES_PER_ELEMENT*1, 1)[0];
      const length = new Uint32Array(sab, Int32Array.BYTES_PER_ELEMENT*2, 1)[0];
      const result = Buffer.from(sab, Int32Array.BYTES_PER_ELEMENT*3, length).toString('utf8');
      if (status >= 200 && status < 300) {
        return result;
      } else {
        throw new Error(`fetch ${url} failed (${JSON.stringify(status)}): ${result}`);
      }
    }
  }
  function importScripts() {
    for (let i = 0; i < arguments.length; i++) {
      const importScriptPath = arguments[i];
      const importScriptSource = getScript(importScriptPath);
      vm.runInThisContext(importScriptSource, global, {
        filename: /^https?:/.test(importScriptPath) ? importScriptPath : 'data-url://',
      });
    }
  }
  global.importScripts = importScripts; */

  self.addEventListener('message', e => {
    const {data: m} = e;
    // console.log('got event', e, e.data);
    switch (m.method) {
      case 'runRepl': {
        let result, err;
        try {
          result = util.inspect(eval(m.jsString));
        } catch(e) {
          err = e.stack;
        }
        self.postMessage({
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
            .then(result => {
              self.postMessage({
                method: 'response',
                requestKey: m.requestKey,
                result,
              });
            });
        } else {
          self.postMessage({
            method: 'response',
            requestKey: m.requestKey,
            error: err,
          });
        }
        break;
      }
      case 'postMessage': {
        try {
          const e = new MessageEvent('messge', {
            data: m.message,
          });
          global.emit('message', e);
        } catch(err) {
          console.warn(err.stack);
        }
        break;
      }
      default: throw new Error(`invalid method: ${JSON.stringify(m.method)}`);
    }
  });

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

  import(initModule);
};
self.addEventListener('message', _oninitmessage);
