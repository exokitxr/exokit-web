import core from './core.js';

import GlobalContext from './GlobalContext.js';

class XRIFrame extends HTMLElement {
  constructor() {
    super();

    this.contentWindow = null;
    this.canvas = null;
    this.shadow = null;
  }
  attributeChangedCallback() {
    const src = this.getAttribute('src');

    if (src) {
      const _onnavigate = u => {
        if (this.contentWindow) {
          this.contentWindow.destroy();
          this.contentWindow = null;
        }
        const win = core.load(u, {
          dataPath: null,
          args: GlobalContext.args,
          replacements: {},
          onnavigate: _onnavigate,
          onrequest: GlobalContext.handleRequest,
          onpointerlock: GlobalContext.handlePointerLock,
          onhapticpulse: GlobalContext.handleHapticPulse,
          onpaymentrequest: GlobalContext.handlePaymentRequest,
        });
        win.frame = null;
        win.submit = () => {
          if (win.frame) {
            const {color, depth} = win.frame;
            if (!this.canvas) {
              this.canvas = document.createElement('canvas');
              this.canvas.style.width = '100%';
              this.canvas.style.height = '100%';
              this.canvas.ctx = this.canvas.getContext('bitmaprenderer');

              if (!this.shadow) {
                this.shadow = this.attachShadow({mode: 'closed'});
              }
              this.shadow.appendChild(this.canvas);
            }
            const expectedWidth = Math.floor(color.width / window.devicePixelRatio);
            const expectedHeight = Math.floor(color.height / window.devicePixelRatio);
            if (this.canvas.width !== expectedWidth || this.canvas.height !== expectedHeight) {
              this.canvas.width = expectedWidth;
              this.canvas.height = expectedHeight;
            }
            this.canvas.ctx.transferFromImageBitmap(color);

            depth.close();

            win.frame = null;
          }
        };
        win.destroy = (destroy => function() {
          if (win.frame) {
            win.frame.color.close();
            win.frame.depth.close();
            win.frame = null;
          }
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
