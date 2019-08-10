import GlobalContext from './GlobalContext.js';

const bannedInheritances = ['canvas', 'globalAlpha', 'globalCompositeOperation', 'filter', 'imageSmoothingEnabled', 'imageSmoothingQuality'];
const _inherit = (a, b) => {
  for (const k in b) {
    a[k] = b[k];
  }
  for (const k in b.prototype) {
    const o = Object.getOwnPropertyDescriptor(b.prototype, k);
    if (o.get) {
      Object.defineProperty(a.prototype, k, o);
    } else {
      const {value} = o;
      a.prototype[k] = typeof value === 'function' ? function() {
        return value.apply(this.backingContext, arguments);
      } : value;
    }
  }
};

class CanvasRenderingContext2D {
  constructor(canvasEl) {
    const {width, height} = canvasEl;

    this.id = Atomics.add(GlobalContext.xrState.id, 0) + 1;
    this.backingCanvas = new OffscreenCanvas(width, height);
    this.backingContext = this.backingCanvas.getContext('2d');
  }

  resize(w, h) {
    this.backingCanvas.width = w;
    this.backingCanvas.height = h;
  }
}
_inherit(CanvasRenderingContext2D, OffscreenCanvasRenderingContext2D);

const {WebGLRenderingContext: OffscreenWebGLRenderingContext, WebGL2RenderingContext: OffscreenWebGL2RenderingContext} = self;
class WebGLRenderingContext {
  constructor(canvasEl) {
    const {width, height} = canvasEl;

    this.id = Atomics.add(GlobalContext.xrState.id, 0) + 1;
    this.backingCanvas = new OffscreenCanvas(width, height);
    this.backingContext = this.backingCanvas.getContext('webgl');
  }

  resize(w, h) {
    this.backingCanvas.width = w;
    this.backingCanvas.height = h;
  }
}
_inherit(WebGLRenderingContext, OffscreenWebGLRenderingContext);

class WebGL2RenderingContext {
  constructor(canvasEl) {
    const {width, height} = canvasEl;

    this.id = Atomics.add(GlobalContext.xrState.id, 0) + 1;
    this.backingCanvas = new OffscreenCanvas(width, height);
    this.backingContext = this.backingCanvas.getContext('webgl2');
  }

  resize(w, h) {
    this.backingCanvas.width = w;
    this.backingCanvas.height = h;
  }
}
_inherit(WebGL2RenderingContext, OffscreenWebGL2RenderingContext);

export {
  CanvasRenderingContext2D,
  WebGLRenderingContext,
  WebGL2RenderingContext,
};
