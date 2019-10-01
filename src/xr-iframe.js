import {_makeWindow} from './WindowVm.js';

import {XRRigidTransform} from './XR.js';

import utils from './utils.js';
const {_normalizeUrl/*, _getProxyUrl*/} = utils;

import symbols from './symbols.js';

import GlobalContext from './GlobalContext.js';

function parseExtents(s) {
  const regex = /(?:\[([0-9]+)\s+([0-9]+)\s+([0-9]+)\s+([0-9]+)\]|([0-9]+)\s+([0-9]+))\s*/g;
  const result = [];
  let match;
  while (match = regex.exec(s)) {
    if (match[1]) {
      const x1 = parseInt(match[1], 10);
      const y1 = parseInt(match[2], 10);
      const x2 = parseInt(match[3], 10);
      const y2 = parseInt(match[4], 10);
      result.push([x1, y1, x2, y2]);
    } else if (match[5]) {
      const x = parseInt(match[5], 10);
      const y = parseInt(match[6], 10);
      result.push([x, y, x, y]);
    }
  }
  return result;
}

class XRIFrame extends HTMLElement {
  constructor() {
    super();

    this.contentWindow = null;
    this.xrOffset = new XRRigidTransform();
    this._highlight = null;
    this._extents = [];
    this._loadFactor = Infinity;
  }
  async attributeChangedCallback(name, oldValue, newValue) {
    await GlobalContext.loadPromise;

    if (name === 'src') {
      let url = this.getAttribute('src');

      if (url) {
        const parentWindow = window;
        const options = parentWindow[symbols.optionsSymbol];

        const baseUrl = _normalizeUrl(url, options.baseUrl);
        // url = _getProxyUrl(baseUrl);
        url = baseUrl;

        const parent = {};
        const top = parentWindow === parentWindow.top ? parent : {};
        const win = _makeWindow({
          url,
          baseUrl,
          args: options.args,
          xrTop: false,
          // dataPath: options.dataPath,
          replacements: options.replacements,
          parent,
          top,
          // hidden: this.d === 3,
          xrOffsetBuffer: this.xrOffset._buffer,
          onnavigate: (href) => {
            this.readyState = null;

            this.setAttribute('src', href);
          },
          onrequest(req) {
            window._postMessageUp(req);
          },
          onpointerlock(event) {
            window._postMessageUp({
              method: 'emit',
              type: 'pointerLock',
              event,
            });
          },
          onhapticpulse(event) {
            window._postMessageUp({
              method: 'emit',
              type: 'hapticPulse',
              event,
            });
          },
          onpaymentrequest(event) {
            if (window.listeners('paymentrequest').length > 0) {
              window.dispatchEvent(new CustomEvent('paymentrequest', {
                detail: event,
              }));
            } else {
              window._postMessageUp({
                method: 'emit',
                type: 'paymentRequest',
                event,
              });
            }
          },
        });
        win.highlight = this._highlight;
        win.addEventListener('load', () => {
          this.dispatchEvent(new CustomEvent('load'));
        });
        win.addEventListener('message', m => {
          const {data} = m;
          this.dispatchEvent(new MessageEvent('message', {
            data,
          }));
        });
        this.contentWindow = win;
      }
    } else if (name === 'position') {
      let position = newValue.split(' ');
      if (position.length === 3) {
        position = position.map(s => parseFloat(s));
        if (position.every(n => isFinite(n))) {
          this.xrOffset.position.set(position);
          this.xrOffset.pushUpdate();
        }
      }
    } else if (name === 'orientation') {
      let orientation = newValue.split(' ');
      if (orientation.length === 4) {
        orientation = orientation.map(s => parseFloat(s));
        if (orientation.every(n => isFinite(n))) {
          this.xrOffset.orientation.set(orientation);
          this.xrOffset.pushUpdate();
        }
      }
    } else if (name === 'scale') {
      let scale = newValue.split(' ');
      if (scale.length === 3) {
        scale = scale.map(s => parseFloat(s));
        if (scale.every(n => isFinite(n))) {
          this.xrOffset.scale.set(scale);
          this.xrOffset.pushUpdate();
        }
      }
    } else if (name === 'highlight') {
      let highlight = newValue.split(' ');
      if (highlight.length === 4) {
        highlight = highlight.map(s => parseFloat(s));
        if (highlight.every(n => isFinite(n))) {
          this.highlight = highlight;
        }
      }
    } else if (name === 'extents') {
      this.extents = parseExtents(newValue);
    } else if (name === 'load-factor') {
      const loadFactor = parseFloat(newValue);
      if (isFinite(loadFactor)) {
        this.loadFactor = loadFactor;
      }
    }
  }
  static get observedAttributes() {
    return [
      'src',
      'position',
      'orientation',
      'scale',
      'highlight',
      'extents',
      'load-factor',
    ];
  }
  get src() {
    return this.getAttribute('src');
  }
  set src(src) {
    this.setAttribute('src', src);
  }

  get position() {
    const s = this.getAttribute('position');
    return s ? s.split(' ').map(s => parseFloat(s)) : [0, 0, 0];
  }
  set position(position) {
    if (!Array.isArray(position)) {
      position = Array.from(position);
    }
    if (position.length === 3 && position.every(n => isFinite(n))) {
      this.setAttribute('position', position.join(' '));
    }
  }

  get orientation() {
    const s = this.getAttribute('orientation');
    return s ? s.split(' ').map(s => parseFloat(s)) : [0, 0, 0, 1];
  }
  set orientation(orientation) {
    if (!Array.isArray(orientation)) {
      orientation = Array.from(orientation);
    }
    if (orientation.length === 4 && orientation.every(n => isFinite(n))) {
      this.setAttribute('orientation', orientation.join(' '));
    }
  }

  get scale() {
    const s = this.getAttribute('scale');
    return s ? s.split(' ').map(s => parseFloat(s)) : [1, 1, 1];
  }
  set scale(scale) {
    if (!Array.isArray(scale)) {
      scale = Array.from(scale);
    }
    if (scale.length === 3 && scale.every(n => isFinite(n))) {
      this.setAttribute('scale', scale.join(' '));
    }
  }

  get name() {
    return this.getAttribute('name');
  }
  set name(name) {
    this.setAttribute('name', name);
  }

  get loaded() {
    return !!this.contentWindow && this.contentWindow.loaded;
  }
  set loaded(loaded) {}

  get highlight() {
    return !!this.contentWindow && this.contentWindow.highlight;
  }
  set highlight(highlight) {
    this._highlight = highlight;
    if (this.contentWindow) {
      this.contentWindow.highlight = highlight;
    }
  }

  get extents() {
    return this._extents;
  }
  set extents(extents) {
    this._extents = extents;
  }

  get loadFactor() {
    return this._loadFactor;
  }
  set loadFactor(loadFactor) {
    this._loadFactor = loadFactor;
  }

  postMessage(m, transfers) {
    this.contentWindow.postMessage(m, transfers);
  }
  destroy() {
    this.contentWindow.destroy();
  }
}
customElements.define('xr-iframe', XRIFrame);
XRIFrame.parseExtents = parseExtents;

export default XRIFrame;
