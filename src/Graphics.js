import GlobalContext from './GlobalContext.js';

const {OffscreenCanvasRenderingContext2D, WebGLRenderingContext: OffscreenWebGLRenderingContext, WebGL2RenderingContext: OffscreenWebGL2RenderingContext} = self;
self.OffscreenCanvasRenderingContext2D = undefined;
self.WebGLRenderingContext = undefined;
self.WebGL2RenderingContext = undefined;

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

    GlobalContext.contexts.push(this);
  }
  resize(w, h) {
    this.backingCanvas.width = w;
    this.backingCanvas.height = h;
  }
  transferToImageBitmap() {
    return this.backingCanvas.transferToImageBitmap();
  }
  destroy() {
    GlobalContext.contexts.splice(GlobalContext.contexts.indexOf(this), 1);
  }
}
_inherit(CanvasRenderingContext2D, OffscreenCanvasRenderingContext2D);

class WebGLRenderingContext {
  constructor(canvasEl) {
    const {width, height} = canvasEl;

    this.id = Atomics.add(GlobalContext.xrState.id, 0) + 1;
    this.backingCanvas = new OffscreenCanvas(width, height);
    this.backingContext = this.backingCanvas.getContext('webgl');

    GlobalContext.contexts.push(this);
  }
  resize(w, h) {
    this.backingCanvas.width = w;
    this.backingCanvas.height = h;
  }
  transferToImageBitmap() {
    return this.backingCanvas.transferToImageBitmap();
  }
  destroy() {
    GlobalContext.contexts.splice(GlobalContext.contexts.indexOf(this), 1);
  }
}
_inherit(WebGLRenderingContext, OffscreenWebGLRenderingContext);

class WebGL2RenderingContext {
  constructor(canvasEl) {
    const {width, height} = canvasEl;

    this.id = Atomics.add(GlobalContext.xrState.id, 0) + 1;
    this.backingCanvas = new OffscreenCanvas(width, height);
    this.backingContext = this.backingCanvas.getContext('webgl2');

    GlobalContext.contexts.push(this);
  }
  resize(w, h) {
    this.backingCanvas.width = w;
    this.backingCanvas.height = h;
  }
  transferToImageBitmap() {
    return this.backingCanvas.transferToImageBitmap();
  }
  destroy() {
    GlobalContext.contexts.splice(GlobalContext.contexts.indexOf(this), 1);
  }
}
_inherit(WebGL2RenderingContext, OffscreenWebGL2RenderingContext);

export {
  CanvasRenderingContext2D,
  WebGLRenderingContext,
  WebGL2RenderingContext,
};
