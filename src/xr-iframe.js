import core from './core.js';

import utils from './utils.js';
const {_getBaseUrl, _getProxyUrl} = utils;

import GlobalContext from './GlobalContext.js';

class XRIFrame extends HTMLElement {
  constructor() {
    super();

    this.contentWindow = null;
    this.canvas = null;
    this.ctx = null;
    this.shadow = null;

    /* window.addEventListener('resize', e => { // XXX
      this.shadow.childNodes[0].style.width = `${window.innerWidth}px`;
      this.shadow.childNodes[0].style.height = `${window.innerHeight}px`;
    }); */
  }
  attributeChangedCallback() {
    const src = this.getAttribute('src');

    if (src) {
      const _onnavigate = u => {
        if (this.contentWindow) {
          this.contentWindow.destroy();
          this.contentWindow = null;
        }

        const baseUrl = _getBaseUrl(u);
        // u = _getProxyUrl(u);

        const win = core.load(u, {
          baseUrl,
          dataPath: null,
          args: GlobalContext.args,
          replacements: {},
          onnavigate: _onnavigate,
          onrequest: GlobalContext.handleRequest,
          onpointerlock: GlobalContext.handlePointerLock,
          onhapticpulse: GlobalContext.handleHapticPulse,
          onpaymentrequest: GlobalContext.handlePaymentRequest,
        });
        win.install = () => {
          if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.ctx = this.canvas.getContext('webgl2');
            const extensions = this.ctx.getSupportedExtensions();
            for (let i = 0; i < extensions.length; i++) {
              this.ctx.getExtension(extensions[i]);
            }

            if (!this.shadow) {
              this.shadow = this.attachShadow({mode: 'closed'});
            }
            this.shadow.appendChild(this.canvas);
          }
          return this.ctx;
        };
        win.clear = () => {
          if (this.ctx) {
            this.ctx.clear(this.ctx.COLOR_BUFFER_BIT|this.ctx.STENCIL_BUFFER_BIT|this.ctx.DEPTH_BUFFER_BIT);
          }
        };
        win.destroy = (destroy => function() {
          if (this.canvas) {
            this.shadow.removeChild(this.canvas);
            this.canvas = null;
          }

          return destroy.apply(this, arguments);
        })(win.destroy);
        this.contentWindow = win;
      };
      _onnavigate(src);
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
