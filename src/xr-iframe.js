import {_makeWindow} from './WindowVm.js';

import {XRRigidTransform} from './XR.js';

import utils from './utils.js';
const {_normalizeUrl, _getProxyUrl} = utils;

import symbols from './symbols.js';

class XRIFrame extends HTMLElement {
  constructor() {
    super();

    this.contentWindow = null;
    this.xrOffset = new XRRigidTransform();
  }
  attributeChangedCallback(name, oldValue, newValue) {
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
          dataPath: options.dataPath,
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
    }
  }
  static get observedAttributes() {
    return [
      'src',
      'position',
      'orientation',
      'scale',
    ];
  }
  get src() {
    return this.getAttribute('src');
  }
  set src(src) {
    this.setAttribute('src', src);
  }

  get position() {
    return this.getAttribute('position').split(' ').map(s => parseFloat(s));
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
    return this.getAttribute('orientation').split(' ').map(s => parseFloat(s));
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
    return this.getAttribute('scale').split(' ').map(s => parseFloat(s));
  }
  set scale(scale) {
    if (!Array.isArray(scale)) {
      scale = Array.from(scale);
    }
    if (scale.length === 3 && scale.every(n => isFinite(n))) {
      this.setAttribute('scale', scale.join(' '));
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
