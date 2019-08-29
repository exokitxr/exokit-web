import GlobalContext from './GlobalContext.js';

/* const {OffscreenCanvasRenderingContext2D, WebGLRenderingContext: OffscreenWebGLRenderingContext, WebGL2RenderingContext: OffscreenWebGL2RenderingContext} = self;
self.OffscreenCanvasRenderingContext2D = undefined;
self.WebGLRenderingContext = undefined;
self.WebGL2RenderingContext = undefined; */

const {WebGLRenderingContext, WebGL2RenderingContext, CanvasRenderingContext2D} = self;

/* const _inherit = (a, b) => {
  for (const k in b) {
    if (!(k in a)) {
      a[k] = b[k];
    }
  }
  for (const k in b.prototype) {
    if (!(k in a.prototype)) {
      const o = Object.getOwnPropertyDescriptor(b.prototype, k);
      if (o.get) {
        o.get = (get => function() {
          return get.apply(this.backingContext, arguments);
        })(o.get);
        o.set = (set => function() {
          return set.apply(this.backingContext, arguments);
        })(o.set);
        Object.defineProperty(a.prototype, k, o);
      } else {
        const {value} = o;
        a.prototype[k] = typeof value === 'function' ? function() {
          return value.apply(this.backingContext, arguments);
        } : value;
      }
    }
  }
}; */

HTMLCanvasElement.prototype.getContext = (oldGetContext => function getContext(type, init) {
  if (/^(?:experimental-)?webgl2?$/.test(type)) {
    const canvas = this;
    const gl = oldGetContext.call(canvas, type, init);
    gl.id = Atomics.add(GlobalContext.xrState.id, 0) + 1;
    gl._proxyContext = null;
    Object.defineProperty(gl, 'canvas', {
      get() {
        return canvas;
      },
    });
    /* canvas.getContext = function getContext() {
      return gl;
    }; */

    GlobalContext.contexts.push(gl);

    const extensions = {
      WEBGL_lose_context: gl._exokitGetExtension('WEBGL_lose_context'),
    };
    gl._extensions = extensions;
    const enabled = {
      clear: true,
    };
    gl._enabled = enabled;

    /* new MutationObserver(() => {
      if (this._proxyContext) {
        this._proxyContext.canvas.width = canvas.width;
        this._proxyContext.canvas.height = canvas.height;
      }
    }).observe(this, {
      attributes: true,
      attributeFilter: ['width', 'height'],
    }); */

    return gl;
  } else {
    return oldGetContext.call(this, type, init);
  }
})(HTMLCanvasElement.prototype.getContext);
Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', {
  get() {
    return this.width;
  },
});
Object.defineProperty(HTMLCanvasElement.prototype, 'clientHeight', {
  get() {
    return this.height;
  },
});

WebGLRenderingContext.prototype._exokitGetExtension = (oldGetExtension => function _exokitGetExtension() {
  return oldGetExtension.apply(this, arguments);
})(WebGLRenderingContext.prototype.getExtension);
for (const k in WebGLRenderingContext.prototype) {
  const o = Object.getOwnPropertyDescriptor(WebGLRenderingContext.prototype, k);
  if (o.get) {
    o.get = (get => function() {
      return get.apply(this._proxyContext || this, arguments);
    })(o.get);
    o.set = (set => function() {
      return set.apply(this._proxyContext || this, arguments);
    })(o.set);
    Object.defineProperty(WebGLRenderingContext.prototype, k, o);
  } else {
    const {value} = o;
    if (typeof value === 'function') {
      const {getError} = WebGLRenderingContext.prototype;
      WebGLRenderingContext.prototype[k] = function() {
        const result = value.apply(this._proxyContext || this, arguments);
        /* const error = getError.call(this);
        if (error) {
          Error.stackTraceLimit = 300;
          console.log('fn', error, !!this._proxyContext, this.lol, k, Array.from(arguments), new Error().stack);
        } */
        return result;
      };
    }
  }
}
WebGLRenderingContext.prototype._exokitClear = (oldClear => function _exokitClear() {
  oldClear.call(this, this.COLOR_BUFFER_BIT|this.DEPTH_BUFFER_BIT|this.STENCIL_BUFFER_BIT);
})(WebGLRenderingContext.prototype.clear);
WebGLRenderingContext.prototype._exokitClearEnabled = function _exokitClearEnabled(enabled) {
  this._enabled.clear = enabled;
};
WebGLRenderingContext.prototype.setProxyContext = function setProxyContext(proxyContext) {
  const ctx = this;
  const {canvas} = ctx;

  const _resize = () => {
    proxyContext.canvas.width = canvas.width;
    proxyContext.canvas.height = canvas.height;
  };
  new MutationObserver(_resize).observe(canvas, {
    attributes: true,
    attributeFilter: ['width', 'height'],
  });

  /* canvas.addEventListener('webglcontextrestored', e => {
    console.log('re-init 1');
    const ks = ctx.getSupportedExtensions();
    for (let i = 0; i < ks.length; i++) {
      ctx.getExtension(ks[i]);
    }
    console.log('re-init 2');
  }); */
  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    setTimeout(() => {
      // console.log('load 1');
      this._extensions.WEBGL_lose_context.restoreContext();
      this._proxyContext = proxyContext;
      // console.log('load 2');
    });
  }, {once: true});
  this._extensions.WEBGL_lose_context.loseContext();
};
WebGLRenderingContext.prototype.clear = (oldClear => function clear() {
  if (this._enabled.clear) {
    oldClear.apply(this, arguments);
  }
})(WebGLRenderingContext.prototype.clear);
WebGLRenderingContext.prototype.destroy = function destroy() {
  GlobalContext.contexts.splice(GlobalContext.contexts.indexOf(this), 1);
};

export {
  WebGLRenderingContext,
  WebGL2RenderingContext,
  CanvasRenderingContext2D,
};
