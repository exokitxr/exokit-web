import {_makeWindow} from './WindowVm.js';

import {XRRigidTransform} from './XR.js';

import utils from './utils.js';
const {_normalizeUrl} = utils;

import symbols from './symbols.js';

class XRIFrame extends HTMLElement {
  constructor() {
    super();

    this.contentWindow = null;
    this.xrOffset = new XRRigidTransform();
  }
  attributeChangedCallback() {
    let url = this.getAttribute('src');

    if (url) {
      const parentWindow = window;
      const options = parentWindow[symbols.optionsSymbol];

      url = _normalizeUrl(url, options.baseUrl);
      const parent = {};
      const top = parentWindow === parentWindow.top ? parent : {};
      this.contentWindow = _makeWindow({
        url,
        baseUrl: url,
        args: options.args,
        dataPath: options.dataPath,
        replacements: options.replacements,
        parent,
        top,
        hidden: this.d === 3,
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
    }
  }
  static get observedAttributes() {
    return [
      'src',
    ];
  }
  get src() {
    return this.getAttribute('src');
  }
  set src(src) {
    this.setAttribute('src', src);
  }
}
customElements.define('xr-iframe', XRIFrame);
