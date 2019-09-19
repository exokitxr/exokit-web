import core from './core.js';

import utils from './utils.js';
const {_getBaseUrl, _getProxyUrl} = utils;

import GlobalContext from './GlobalContext.js';

class XREngine extends HTMLTemplateElement {
  constructor() {
    super();

    this.contentWindow = null;
    this.queue = [];
    this.canvas = null;
    this.ctx = null;
    // this.shadow = null;
    this.session = null;
    this.baseLayer = null;

    const _updateInnerHTML = async () => {
      await GlobalContext.loadPromise;

      const innerHTML = this.innerHTML;
      const src = this.getAttribute('src');
      if (!src) {
        if (this.contentWindow) {
          this.contentWindow.destroy();
          this.contentWindow = null;
        }
        if (innerHTML) {
          this.navigate('data:text/html,' + innerHTML);
        }
      }
    };
    new MutationObserver(mutations => {
      _updateInnerHTML();
    }).observe(this, {
      childList: true,
      subtree: true,
    });
    _updateInnerHTML();
  }
  attributeChangedCallback() {
    const src = this.getAttribute('src');
    if (src) {
      GlobalContext.loadPromise.then(() => this.navigate(src));
    }
  }
  static get observedAttributes() {
    return ['src'];
  }
  get src() {
    return this.getAttribute('src');
  }
  set src(src) {
    this.setAttribute('src', src);
  }

  navigate(u) {
    const baseUrl = _getBaseUrl(u);

    const win = core.load(u, {
      baseUrl,
      // dataPath: null,
      args: GlobalContext.args,
      replacements: {},
      xrTop: true,
      onnavigate: this.navigate.bind(this),
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
        win.canvas.addEventListener('mousedown', e => {
          e.preventDefault();
        });
        win.canvas.addEventListener('mouseenter', e => {
          const {x, y, width, height} = win.canvas.getBoundingClientRect();
          GlobalContext.xrState.canvasViewport[0] = x;
          GlobalContext.xrState.canvasViewport[1] = y;
          GlobalContext.xrState.canvasViewport[2] = width;
          GlobalContext.xrState.canvasViewport[3] = height;
        });
        win.ctx = win.canvas.getContext(window.WebGL2RenderingContext ? 'webgl2' : 'webgl', {
          antialias: true,
          alpha: true,
          xrCompatible: true,
        });
        win.ctx.bindFramebuffer = (_bindFramebuffer => function bindFramebuffer(target, fbo) { // XXX return the correct undone binding in gl.getParameter
          if (!fbo) {
            fbo = win.ctx.xrFramebuffer;
          }
          return _bindFramebuffer.call(this, target, fbo);
        })(win.ctx.bindFramebuffer);
        win.ctx.binding = null;
        win.ctx.xrFramebuffer = null;
        const extensions = win.ctx.getSupportedExtensions();
        for (let i = 0; i < extensions.length; i++) {
          win.ctx.getExtension(extensions[i]);
        }

        /* if (!this.shadow) {
          this.shadow = this.attachShadow({mode: 'closed'});
        }
        this.shadow.appendChild(win.canvas); */

        this.dispatchEvent(new MessageEvent('canvas', {
          data: win.canvas,
        }));
        if (!win.canvas.parentNode) {
          this.parentNode.insertAfter(win.canvas, this);
        }
      }
      return win.ctx;
    };
    win.clear = () => {
      if (win.ctx) {
        win.ctx.binding = null;
        win.ctx.clearColor(0, 0, 0, 0);
        win.ctx.clear(win.ctx.COLOR_BUFFER_BIT|win.ctx.STENCIL_BUFFER_BIT|win.ctx.DEPTH_BUFFER_BIT);
      }
    };
    win.destroy = (destroy => function() {
      if (win.canvas) {
        win.canvas.parentNode.removeChild(win.canvas);
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

    for (let i = 0; i < this.queue.length; i++) {
      const [data, transfers] = this.queue[i];
      this.contentWindow.postMessage(data, transfers);
    }
    this.queue.length = 0;
  }
  
  postMessage(data, transfers) {
    if (this.contentWindow) {
      this.contentWindow.postMessage(data, transfers);
    } else {
      this.queue.push([data, transfers]);
    }
  }

  async enterXr() {
    if (navigator.xr) {
      const {contentWindow: win} = this;
      if (!win.session) {
        if (win.canvas) {
          const session = await navigator.xr.requestSession('immersive-vr', {
            requiredFeatures: ['local-floor'],
          });
          let referenceSpace;
          let referenceSpaceType = '';
          const _loadReferenceSpace = async () => {
            const lastReferenceSpaceType = referenceSpaceType;
            try {
              referenceSpace = await session.requestReferenceSpace('local-floor');
              referenceSpaceType = 'local-floor';
            } catch (err) {
              referenceSpace = await session.requestReferenceSpace('local');
              referenceSpaceType = 'local';
            }

            if (referenceSpaceType !== lastReferenceSpaceType) {
              console.log(`referenceSpace changed to ${referenceSpaceType}`);
            }
          };
          await _loadReferenceSpace();
          const loadReferenceSpaceInterval = setInterval(_loadReferenceSpace, 1000);

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

export {XREngine};
