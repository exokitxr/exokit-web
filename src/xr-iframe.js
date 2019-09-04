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
    this.session = null;
    this.baseLayer = null;

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
        win.canvas = null;
        win.ctx = null;
        win.session = null;
        win.baseLayer = null;
        win.install = () => {
          if (!win.canvas) {
            win.canvas = document.createElement('canvas');
            win.canvas.width = GlobalContext.xrState.renderWidth[0] * 2;
            win.canvas.height = GlobalContext.xrState.renderHeight[0];
            win.canvas.style.width = '100%';
            win.canvas.style.height = '100%';
            win.ctx = win.canvas.getContext('webgl2', {
              xrCompatible: true,
            });
            win.ctx.bindFramebuffer = (_bindFramebuffer => function bindFramebuffer(target, fbo) { // XXX return the correct undone binding in gl.getParameter
              if (!fbo) {
                fbo = win.ctx.xrFramebuffer;
              }
              return _bindFramebuffer.call(this, target, fbo);
            })(win.ctx.bindFramebuffer);
            win.ctx.xrFramebuffer = null;
            const extensions = win.ctx.getSupportedExtensions();
            for (let i = 0; i < extensions.length; i++) {
              win.ctx.getExtension(extensions[i]);
            }

            if (!this.shadow) {
              this.shadow = this.attachShadow({mode: 'closed'});
            }
            this.shadow.appendChild(win.canvas);
          }
          return win.ctx;
        };
        win.clear = () => {
          if (win.ctx) {
            win.ctx.clear(win.ctx.COLOR_BUFFER_BIT|win.ctx.STENCIL_BUFFER_BIT|win.ctx.DEPTH_BUFFER_BIT);
          }
        };
        win.destroy = (destroy => function() {
          if (win.canvas) {
            this.shadow.removeChild(win.canvas);
            win.canvas = null;
            win.ctx = null;
          }

          return destroy.apply(this, arguments);
        })(win.destroy);
        win.addEventListener('message', m => {
          const {data} = m;
          this.dispatchEvent(new MessageEvent('message', {
            data,
          }));
        });
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
  
  postMessage(m, transfers) {
    this.contentWindow.postMessage(m, transfers);
  }

  async enterXr() {
    if (navigator.xr) {
      const {contentWindow: win} = this;
      if (!win.session) {
        if (win.canvas) {
          const session = await navigator.xr.requestSession('immersive-vr');
          let referenceSpace = await session.requestReferenceSpace('local');
          referenceSpace = referenceSpace.getOffsetReferenceSpace(new XRRigidTransform(new DOMPoint(0, -1.6, 0))); // hack: should use local-floor space
          const baseLayer = new XRWebGLLayer(session, win.ctx);
          
          session.updateRenderState({baseLayer});

          session.requestAnimationFrame(async (timestamp, frame) => {
            const pose = frame.getViewerPose(referenceSpace);
            const viewport = baseLayer.getViewport(pose.views[0]);
            const width = viewport.width;
            const height = viewport.height;
            const fullWidth = (() => {
              let result = 0;
              for (let i = 0; i < pose.views.length; i++) {
                result += baseLayer.getViewport(pose.views[i]).width;
              }
              return result;
            })();
            
            GlobalContext.xrState.isPresentingReal[0] = 1;
            GlobalContext.xrState.stereo[0] = 1;
            GlobalContext.xrState.renderWidth[0] = width;
            GlobalContext.xrState.renderHeight[0] = height;
            
            win.canvas.width = fullWidth;
            win.canvas.height = height;

            await win.runAsync({
              method: 'enterXr',
            });

            console.log('XR setup complete');
          });
          core.setSession(session);
          core.setReferenceSpace(referenceSpace);

          win.session = session;
          win.baseLayer = baseLayer;
        } else {
          throw new Error('not loaded');
        }
      }
    } else {
      throw new Error('no webxr');
    }
  }
}
customElements.define('xr-iframe', XRIFrame);
