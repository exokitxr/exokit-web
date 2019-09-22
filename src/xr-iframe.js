import {_makeWindow} from './WindowVm.js';

import {XRRigidTransform} from './XR.js';

import utils from './utils.js';
const {_normalizeUrl/*, _getProxyUrl*/} = utils;

import symbols from './symbols.js';

import GlobalContext from './GlobalContext.js';

class XRIFrame extends HTMLElement {
  constructor() {
    super();

    this.contentWindow = null;
    this.xrOffset = new XRRigidTransform();
    this._disabled = false;
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
        win.disabled = this._disabled;
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
    } else if (name === 'disabled') {
      this.disabled = newValue === '' || newValue === 'true';
    }
  }
  static get observedAttributes() {
    return [
      'src',
      'position',
      'orientation',
      'scale',
      'disabled',
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

  get disabled() {
    return !!this.contentWindow && this.contentWindow.disabled;
  }
  set disabled(disabled) {
    this._disabled = disabled;
    if (this.contentWindow) {
      this.contentWindow.disabled = disabled;
    }
  }

  postMessage(m, transfers) {
    this.contentWindow.postMessage(m, transfers);
  }
  destroy() {
    this.contentWindow.destroy();
  }
}
customElements.define('xr-iframe', XRIFrame);

export default XRIFrame;
