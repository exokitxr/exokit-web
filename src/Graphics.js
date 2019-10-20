import webGlToOpenGl from '../modules/webgl-to-opengl.js';

import symbols from './symbols.js';
import GlobalContext from './GlobalContext.js';

/* const {OffscreenCanvasRenderingContext2D, WebGLRenderingContext: OffscreenWebGLRenderingContext, WebGL2RenderingContext: OffscreenWebGL2RenderingContext} = self;
self.OffscreenCanvasRenderingContext2D = undefined;
self.WebGLRenderingContext = undefined;
self.WebGL2RenderingContext = undefined; */

const {/*WebGLRenderingContext, WebGL2RenderingContext,*/ CanvasRenderingContext2D} = self;

const hasWebGL2 = !!window.WebGL2RenderingContext;

const _makeState = () => {
  const gl = GlobalContext.proxyContext;

  return {
    vao: null,

    arrayBuffer: null,
    renderbuffer: {
      [gl.RENDERBUFFER]: null,
    },
    framebuffer: hasWebGL2 ? {
      [gl.READ_FRAMEBUFFER]: null,
      [gl.DRAW_FRAMEBUFFER]: null,
    } : {
      [gl.FRAMEBUFFER]: null,
    },

    blend: false,
    cullFace: false,
    depthTest: false,
    dither: false,
    polygonOffsetFill: false,
    sampleAlphaToCoverage: false,
    sampleCoverage: false,
    scissorTest: false,
    stencilTest: false,

    activeTexture: gl.TEXTURE0,

    packAlignment: 4,
    unpackAlignment: 4,
    unpackColorspaceConversion: gl.BROWSER_DEFAULT_WEBGL,
    unpackFlipY: 0,
    unpackPremultiplyAlpha: 0,

    currentProgram: null,
    viewport: [0, 0, gl.canvas.width, gl.canvas.height],
    scissor: [0, 0, 0, 0],
    blendSrcRgb: gl.ONE,
    blendDstRgb: gl.ZERO,
    blendSrcAlpha: gl.ONE,
    blendDstAlpha: gl.ZERO,
    blendEquationRgb: gl.FUNC_ADD,
    blendEquationAlpha: gl.FUNC_ADD,
    blendColor: [0, 0, 0, 0],
    colorClearValue: [0, 0, 0, 0],
    colorMask: [true, true, true, true],
    cullFaceMode: gl.BACK,
    depthClearValue: 1,
    depthFunc: gl.LESS,
    depthRange: [0, 1],
    depthMask: true,
    frontFace: gl.CCW,
    generateMipmapHint: gl.DONT_CARE,
    lineWidth: 1,
    polygonOffsetFactor: 0,
    polygonOffsetUnits: 0,
    sampleCoverageValue: 1,
    sampleCoverageUnits: false,
    stencilBackFail: gl.KEEP,
    stencilBackFunc: gl.ALWAYS,
    stencilBackPassDepthFail: gl.KEEP,
    stencilBackPassDepthPass: gl.KEEP,
    stencilBackRef: 0,
    stencilBackValueMask: 0xFFFFFFFF,
    stencilBackWriteMask: 0xFFFFFFFF,
    stencilClearValue: 0,
    stencilFail: gl.KEEP,
    stencilFunc: gl.ALWAYS,
    stencilPassDepthFail: gl.KEEP,
    stencilPassDpethPass: gl.KEEP,
    stencilRef: 0,
    stencilValueMask: 0xFFFFFFFF,
    stencilWriteMask: 0xFFFFFFFF,

    textureUnits: (() => {
      const numTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
      const result = Array(numTextureUnits);
      for (let i = 0; i < numTextureUnits; i++) {
        result[i] = {
          texture2D: null,
          textureCubemap: null,
        };
      }
      return result;
    })(),
  };
};
HTMLCanvasElement.prototype.getContext = (oldGetContext => function getContext(type, init = {}) {
  const match = type.match(/^(?:experimental-)?(webgl2?)$/);
  if (match && (hasWebGL2 || match[1] !== 'webgl2')) {
    window[symbols.ensureProxyContext]();

    const canvas = this;
    const gl = match[1] === 'webgl2' ? new WebGL2RenderingContext(canvas) : new WebGLRenderingContext(canvas);
    // const gl = oldGetContext.call(canvas, type, init);

    canvas.getContext = function getContext() {
      return gl;
    };

    /* new MutationObserver(() => {
      GlobalContext.proxyContext.canvas.width = canvas.width;
      GlobalContext.proxyContext.canvas.height = canvas.height;
    }).observe(canvas, {
      attributes: true,
      attributeFilter: ['width', 'height'],
    }); */

    setTimeout(() => {
      window.vrdisplayactivate();
    });

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
HTMLCanvasElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
  const {canvasViewport} = GlobalContext.xrState;
  return new DOMRect(canvasViewport[0], canvasViewport[1], canvasViewport[2], canvasViewport[3]);
};

const [WebGLRenderingContext, WebGL2RenderingContext] = [window.WebGLRenderingContext, window.WebGL2RenderingContext].map(WebGLRenderingContext => {

if (!WebGLRenderingContext) {
  return WebGLRenderingContext;
}

function ProxiedWebGLRenderingContext(canvas) {
  Object.defineProperty(this, 'canvas', { // Object.defineProperty to avoid proxying
    get() {
      return canvas;
    },
  });

  this.id = ++GlobalContext.xrState.id[0];
  this.state = _makeState();
  this._enabled = {
    blend: true,
    clear: true,
  };

  if (hasWebGL2) {
    if (this.createVertexArray) {
      const vao = this.createVertexArray();
      this.bindVertexArray(vao);
    } else {
      const extension = this.getExtension('OES_vertex_array_object');
      const vao = extension.createVertexArrayOES();
      extension.bindVertexArrayOES(vao);
    }
  }

  GlobalContext.contexts.push(this);
}
ProxiedWebGLRenderingContext.prototype = Object.create(WebGLRenderingContext.prototype);

for (const k in WebGLRenderingContext) {
  ProxiedWebGLRenderingContext[k] = WebGLRenderingContext[k];
}
for (const k in WebGLRenderingContext.prototype) {
  const o = Object.getOwnPropertyDescriptor(WebGLRenderingContext.prototype, k);
  if (o.get) {
    o.get = (get => function() {
      return GlobalContext.proxyContext[k];
    })(o.get);
    o.set = (set => function(v) {
      GlobalContext.proxyContext[k] = v;
    })(o.set);
    Object.defineProperty(ProxiedWebGLRenderingContext.prototype, k, o);
  } else {
    const {value} = o;
    if (typeof value === 'function') {
      if (k === 'drawElements' || k === 'drawArrays' || k === 'drawElementsInstanced' || k === 'drawArraysInstanced' || k === 'clear') {
        ProxiedWebGLRenderingContext.prototype[k] = function() {
          if (window[symbols.mrDisplaysSymbol].vrDisplay.isPresenting) {
            this.setProxyState();
            return GlobalContext.proxyContext[k].apply(GlobalContext.proxyContext, arguments);
          }
        };
      } else if (k === 'texImage2D' || k === 'texSubImage2D') {
        ProxiedWebGLRenderingContext.prototype[k] = function(a, b, c, d, e, f, g, h, i) {
          this.setProxyState();
          if (i instanceof Float32Array) {
            c = GlobalContext.proxyContext.RGBA32F;
            return GlobalContext.proxyContext[k].call(GlobalContext.proxyContext, a, b, c, d, e, f, g, h, i);
          } else {
            return GlobalContext.proxyContext[k].apply(GlobalContext.proxyContext, arguments);
          }
        };
      } else {
        ProxiedWebGLRenderingContext.prototype[k] = function() {
          this.setProxyState();
          return GlobalContext.proxyContext[k].apply(GlobalContext.proxyContext, arguments);
        };
      }
    }
  }
}
ProxiedWebGLRenderingContext.prototype._exokitClear = function _exokitClear() {
  const gl = GlobalContext.proxyContext;
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT|gl.STENCIL_BUFFER_BIT);
};
ProxiedWebGLRenderingContext.prototype._exokitClearEnabled = function _exokitClearEnabled(enabled) {
  this._enabled.clear = enabled;
};
ProxiedWebGLRenderingContext.prototype._exokitEnable = function _exokitEnable(flag) {
  const gl = GlobalContext.proxyContext;
  gl.enable(flag);
};
ProxiedWebGLRenderingContext.prototype._exokitDisable = function _exokitDisable(flag) {
  const gl = GlobalContext.proxyContext;
  gl.disable(flag);
};
ProxiedWebGLRenderingContext.prototype._exokitBlendFuncSeparate = function _exokitBlendFuncSeparate(srcRgb, dstRgb, srcAlpha, dstAlpha) {
  const gl = GlobalContext.proxyContext;
  gl.blendFuncSeparate(srcRgb, dstRgb, srcAlpha, dstAlpha);
};
ProxiedWebGLRenderingContext.prototype._exokitBlendEquationSeparate = function _exokitBlendEquationSeparate(rgb, a) {
  const gl = GlobalContext.proxyContext;
  gl.blendEquationSeparate(rgb, a);
};
ProxiedWebGLRenderingContext.prototype._exokitBlendColor = function _exokitBlendColor(r, g, b, a) {
  const gl = GlobalContext.proxyContext;
  gl.blendColor(r, g, b, a);
};
ProxiedWebGLRenderingContext.prototype._exokitBlendEnabled = function _exokitBlendEnabled(enabled) {
  this._enabled.blend = enabled;
};
class OES_vertex_array_object {
  constructor(gl) {
    this.gl = gl;

    this.VERTEX_ARRAY_BINDING_OES = OES_vertex_array_object.VERTEX_ARRAY_BINDING_OES;
  }
  createVertexArrayOES() {
    return GlobalContext.proxyContext.createVertexArray();
  }
  bindVertexArrayOES(vao) {
    this.gl.state.vao = vao;
    return GlobalContext.proxyContext.bindVertexArray(vao);
  }
  deleteVertexArrayOES(vao) {
    if (this.gl.state.vao === vao) {
      this.gl.state.vao = null;
    }
    return GlobalContext.proxyContext.deleteVertexArray(vao);
  }
  isVertexArrayOES(vao) {
    return GlobalContext.proxyContext.isVertexArray(vao);
  }
  static get VERTEX_ARRAY_BINDING_OES() {
    return WebGL2RenderingContext.VERTEX_ARRAY_BINDING;
  }
}
class ANGLE_instanced_arrays {
  drawArraysInstancedANGLE(mode, first, count, primcount) {
    return GlobalContext.proxyContext.drawArraysInstanced(mode, first, count, primcount);
  }
  drawElementsInstancedANGLE(mode, count, type, offset, primcount) {
    return GlobalContext.proxyContext.drawElementsInstanced(mode, count, type, offset, primcount);
  }
  vertexAttribDivisorANGLE(index, divisor) {
    return GlobalContext.proxyContext.vertexAttribDivisor(index, divisor);
  }
}
ProxiedWebGLRenderingContext.prototype.getExtension = (_getExtension => function getExtension(name) {
  if (name === 'OES_vertex_array_object') {
    if (hasWebGL2) {
      return new OES_vertex_array_object(this);
    } else {
      return GlobalContext.proxyContext.getExtension(name);
    }
  } else if (name === 'ANGLE_instanced_arrays') {
    if (hasWebGL2) {
      return new ANGLE_instanced_arrays();
    } else {
      return GlobalContext.proxyContext.getExtension(name);
    }
  } else if ([
    'EXT_texture_filter_anisotropic',
    'WEBGL_debug_renderer_info',
    'EXT_disjoint_timer_query',
    'EXT_disjoint_timer_query_webgl2',
    'KHR_parallel_shader_compile',
  ].includes(name)) {
    return GlobalContext.proxyContext.getExtension(name);
  } else {
    return {};
  }
})(ProxiedWebGLRenderingContext.prototype.getExtension);
ProxiedWebGLRenderingContext.prototype.enable = (oldEnable => function enable(flag) {
  if (flag !== this.BLEND || this._enabled.blend) {
    oldEnable.apply(this, arguments);
  }
})(ProxiedWebGLRenderingContext.prototype.enable);
ProxiedWebGLRenderingContext.prototype.disable = (oldDisable => function disable(flag) {
  if (flag !== this.BLEND || this._enabled.blend) {
    oldDisable.apply(this, arguments);
  }
})(ProxiedWebGLRenderingContext.prototype.disable);
ProxiedWebGLRenderingContext.prototype.clear = (oldClear => function clear() {
  const gl = GlobalContext.proxyContext;
  if (this._enabled.clear || this.state.framebuffer[gl.DRAW_FRAMEBUFFER] !== null) {
    oldClear.apply(this, arguments);
  }
})(ProxiedWebGLRenderingContext.prototype.clear);
ProxiedWebGLRenderingContext.prototype.makeXrCompatible = function makeXrCompatible() {};
function enableDisable(gl, feature, enable) {
  if (enable) {
    gl.enable(feature);
  } else {
    gl.disable(feature);
  }
}
ProxiedWebGLRenderingContext.prototype.setProxyState = function setProxyState() {
  if (GlobalContext.proxyContext.binding !== this) {
    const {state} = this;
    const gl = GlobalContext.proxyContext;

    if (hasWebGL2) {
      gl.bindVertexArray(state.vao);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, state.arrayBuffer);
    gl.bindRenderbuffer(gl.RENDERBUFFER, state.renderbuffer[gl.RENDERBUFFER]);
    if (hasWebGL2) {
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, state.framebuffer[gl.READ_FRAMEBUFFER]);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, state.framebuffer[gl.DRAW_FRAMEBUFFER]);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, state.framebuffer[gl.FRAMEBUFFER]);
    }

    if (this._enabled.blend) {
      enableDisable(gl, gl.BLEND, state.blend);
    }
    enableDisable(gl, gl.CULL_FACE, state.cullFace);
    enableDisable(gl, gl.DEPTH_TEST, state.depthTest);
    enableDisable(gl, gl.DITHER, state.dither);
    enableDisable(gl, gl.POLYGON_OFFSET_FILL, state.polygonOffsetFill);
    enableDisable(gl, gl.SAMPLE_ALPHA_TO_COVERAGE, state.sampleAlphaToCoverage);
    enableDisable(gl, gl.SAMPLE_COVERAGE, state.sampleCoverage);
    enableDisable(gl, gl.SCISSOR_TEST, state.scissorTest);
    enableDisable(gl, gl.STENCIL_TEST, state.stencilTest);

    gl.pixelStorei(gl.PACK_ALIGNMENT, state.packAlignment);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, state.unpackAlignment);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, state.unpackColorspaceConversion);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, state.unpackFlipY);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, state.unpackPremultiplyAlpha);

    gl.useProgram(state.currentProgram);

    gl.viewport(state.viewport[0], state.viewport[1], state.viewport[2], state.viewport[3]);
    gl.scissor(state.scissor[0], state.scissor[1], state.scissor[2], state.scissor[3]);
    if (this._enabled.blend) {
      gl.blendFuncSeparate(state.blendSrcRgb, state.blendDstRgb, state.blendSrcAlpha, state.blendDstAlpha);
      gl.blendEquationSeparate(state.blendEquationRgb, state.blendEquationAlpha);
      gl.blendColor(state.blendColor[0], state.blendColor[1], state.blendColor[2], state.blendColor[3]);
    }
    gl.clearColor(state.colorClearValue[0], state.colorClearValue[1], state.colorClearValue[2], state.colorClearValue[3]);
    gl.colorMask(state.colorMask[0], state.colorMask[1], state.colorMask[2], state.colorMask[3]);
    gl.cullFace(state.cullFaceMode);
    gl.clearDepth(state.depthClearValue);
    gl.depthFunc(state.depthFunc);
    gl.depthRange(state.depthRange[0], state.depthRange[1], state.depthRange[2], state.depthRange[3]);
    gl.depthMask(state.depthMask);
    gl.frontFace(state.frontFace);
    gl.hint(gl.GENERATE_MIPMAP_HINT, state.generateMipmapHint);
    gl.lineWidth(state.lineWidth);
    gl.polygonOffset(state.polygonOffsetFactor, state.polygonOffsetUnits);
    gl.sampleCoverage(state.sampleCoverageValue, state.sampleCoverageUnits);
    gl.stencilFuncSeparate(gl.BACK, state.stencilBackFunc, state.stencilBackRef, state.stencilBackValueMask);
    gl.stencilFuncSeparate(gl.FRONT, state.stencilFunc, state.stencilRef, state.stencilValueMask);
    gl.stencilOpSeparate(gl.BACK, state.stencilBackFail, state.stencilBackPassDepthFail, state.stencilBackPassDepthPass);
    gl.stencilOpSeparate(gl.FRONT, state.stencilFail, state.stencilPassDepthFail, state.stencilPassDepthPass);
    gl.stencilMaskSeparate(gl.BACK, state.stencilBackWriteMask);
    gl.stencilMaskSeparate(gl.FRONT, state.stencilWriteMask);
    gl.clearStencil(state.stencilClearValue);

    for (let i = 0; i < state.textureUnits.length; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, state.textureUnits[i].texture2D);
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, state.textureUnits[i].textureCubemap);
    }
    gl.activeTexture(state.activeTexture);

    GlobalContext.proxyContext.binding = this;
  }
};
ProxiedWebGLRenderingContext.prototype.destroy = function destroy() {
  GlobalContext.contexts.splice(GlobalContext.contexts.indexOf(this), 1);
};

// state memoization

if (WebGLRenderingContext.prototype.bindVertexArray) {
  ProxiedWebGLRenderingContext.prototype.bindVertexArray = (_bindVertexArray => function bindVertexArray(vao) {
    this.state.vao = vao;
    return _bindVertexArray.apply(this, arguments);
  })(ProxiedWebGLRenderingContext.prototype.bindVertexArray);
  ProxiedWebGLRenderingContext.prototype.deleteVertexArray = (_deleteVertexArray => function deleteVertexArray(vao) {
    if (this.state.vao === vao) {
      this.state.vao = null;
    }
    return _deleteVertexArray.apply(this, arguments);
  })(ProxiedWebGLRenderingContext.prototype.deleteVertexArray);
}
/* ProxiedWebGLRenderingContext.prototype.getExtension = (_getExtension => function getExtension(name) {
  const gl = this;
  const extension = _getExtension.apply(this, arguments);
  if (name === 'OES_vertex_array_object' && !extension.bindVertexArrayOES._bound) {
    extension.bindVertexArrayOES = (_bindVertexArrayOES => function bindVertexArrayOES(vao) {
      gl.state.vao = vao;
      return _bindVertexArrayOES.apply(this, arguments);
    })(extension.bindVertexArrayOES);
    extension.bindVertexArrayOES._bound = true;
  }
  return extension;
})(WebGLRenderingContext.prototype.getExtension); */
ProxiedWebGLRenderingContext.prototype.bindBuffer = (_bindBuffer => function bindBuffer(target, b) {
  if (target === this.ARRAY_BUFFER) {
    this.state.arrayBuffer = b;
  }
  return _bindBuffer.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.bindBuffer);
ProxiedWebGLRenderingContext.prototype.deleteBuffer = (_deleteBuffer => function deleteBuffer(b) {
  if (this.state.arrayBuffer === b) {
    this.state.arrayBuffer = null;
  }
  return _deleteBuffer.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.deleteBuffer);
ProxiedWebGLRenderingContext.prototype.bindRenderbuffer = (_bindRenderbuffer => function bindRenderbuffer(target, rbo) {
  this.state.renderbuffer[target] = rbo;
  return _bindRenderbuffer.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.bindRenderbuffer);
ProxiedWebGLRenderingContext.prototype.deleteRenderbuffer = (_deleteRenderbuffer => function deleteRenderbuffer(rbo) {
  for (const k in this.state.renderbuffer) {
    if (this.state.renderbuffer[k] === rbo) {
      this.state.renderbuffer[k] = null;
    }
  }
  return _deleteRenderbuffer.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.deleteRenderbuffer);
ProxiedWebGLRenderingContext.prototype.bindFramebuffer = (_bindFramebuffer => function bindFramebuffer(target, fbo) {
  const gl = GlobalContext.proxyContext;
  if (hasWebGL2 && target === gl.FRAMEBUFFER) {
    this.state.framebuffer[gl.READ_FRAMEBUFFER] = fbo;
    this.state.framebuffer[gl.DRAW_FRAMEBUFFER] = fbo;
  } else {
    this.state.framebuffer[target] = fbo;
  }
  return _bindFramebuffer.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.bindFramebuffer);
ProxiedWebGLRenderingContext.prototype.deleteFramebuffer = (_deleteFramebuffer => function deleteFramebuffer(fbo) {
  for (const k in this.state.framebuffer) {
    if (this.state.framebuffer[k] === fbo) {
      this.state.framebuffer[k] = null;
    }
  }
  return _deleteFramebuffer.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.deleteFramebuffer);
const targetStateKeys = {
  [WebGLRenderingContext.BLEND]: 'blend',
  [WebGLRenderingContext.CULL_FACE]: 'cullFace',
  [WebGLRenderingContext.DEPTH_TEST]: 'depthTest',
  [WebGLRenderingContext.DITHER]: 'dither',
  [WebGLRenderingContext.POLYGON_OFFSET_FILL]: 'polygonOffsetFill',
  [WebGLRenderingContext.SAMPLE_ALPHA_TO_COVERAGE]: 'sampleAlphaToCoverage',
  [WebGLRenderingContext.SAMPLE_COVERAGE]: 'sampleCoverage',
  [WebGLRenderingContext.SCISSOR_TEST]: 'scissorTest',
  [WebGLRenderingContext.STENCIL_TEST]: 'stencilTest',
  [WebGLRenderingContext.PACK_ALIGNMENT]: 'packAlignment',
  [WebGLRenderingContext.UNPACK_ALIGNMENT]: 'unpackAlignment',
  [WebGLRenderingContext.UNPACK_COLORSPACE_CONVERSION_WEBGL]: 'unpackColorspaceConversion',
  [WebGLRenderingContext.UNPACK_FLIP_Y_WEBGL]: 'unpackFlipY',
  [WebGLRenderingContext.UNPACK_PREMULTIPLY_ALPHA_WEBGL]: 'unpackPremultiplyAlpha',
  [WebGLRenderingContext.GENERATE_MIPMAP_HINT]: 'generateMipmapHint',
};
ProxiedWebGLRenderingContext.prototype.enable = (_enable => function enable(target) {
  const stateKey = targetStateKeys[target];
  if (stateKey !== undefined) {
    this.state[stateKey] = true;
  }
  return _enable.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.enable);
ProxiedWebGLRenderingContext.prototype.disable = (_disable => function disable(target) {
  const stateKey = targetStateKeys[target];
  if (stateKey !== undefined) {
    this.state[stateKey] = false;
  }
  return _disable.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.disable);
ProxiedWebGLRenderingContext.prototype.activeTexture = (_activeTexture => function activeTexture(slot) {
  this.state.activeTexture = slot;
  return _activeTexture.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.activeTexture);
ProxiedWebGLRenderingContext.prototype.pixelStorei = (_pixelStorei => function pixelStorei(name, value) {
  const stateKey = targetStateKeys[name];
  if (stateKey !== undefined) {
    this.state[stateKey] = value;
  }
  return _pixelStorei.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.pixelStorei);
ProxiedWebGLRenderingContext.prototype.useProgram = (_useProgram => function useProgram(program) {
  this.state.currentProgram = program;
  return _useProgram.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.useProgram);
ProxiedWebGLRenderingContext.prototype.deleteProgram = (_deleteProgram => function deleteProgram(program) {
  if (this.state.currentProgram === program) {
    this.state.currentProgram = null;
  }
  return _deleteProgram.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.deleteProgram);
ProxiedWebGLRenderingContext.prototype.viewport = (_viewport => function viewport(x, y, w, h) {
  this.state.viewport[0] = x;
  this.state.viewport[1] = y;
  this.state.viewport[2] = w;
  this.state.viewport[3] = h;
  return _viewport.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.viewport);
ProxiedWebGLRenderingContext.prototype.scissor = (_scissor => function scissor(x, y, w, h) {
  this.state.scissor[0] = x;
  this.state.scissor[1] = y;
  this.state.scissor[2] = w;
  this.state.scissor[3] = h;
  return _scissor.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.scissor);
ProxiedWebGLRenderingContext.prototype.blendFunc = (_blendFunc => function blendFunc(blendSrc, blendDst) {
  this.state.blendSrcRgb = blendSrc;
  this.state.blendDstRgb = blendDst;
  this.state.blendSrcAlpha = blendSrc;
  this.state.blendDstAlpha = blendDst;
  if (this._enabled.blend) {
    return _blendFunc.apply(this, arguments);
  }
})(ProxiedWebGLRenderingContext.prototype.blendFunc);
ProxiedWebGLRenderingContext.prototype.blendFuncSeparate = (_blendFuncSeparate => function blendFuncSeparate(blendSrcRgb, blendDstRgb, blendSrcAlpha, blendDstAlpha) {
  this.state.blendSrcRgb = blendSrcRgb;
  this.state.blendDstRgb = blendDstRgb;
  this.state.blendSrcAlpha = blendSrcAlpha;
  this.state.blendDstAlpha = blendDstAlpha;
  if (this._enabled.blend) {
    return _blendFuncSeparate.apply(this, arguments);
  }
})(ProxiedWebGLRenderingContext.prototype.blendFuncSeparate);
ProxiedWebGLRenderingContext.prototype.blendEquation = (_blendEquation => function blendEquation(blendEquation) {
  this.state.blendEquationRgb = blendEquation;
  this.state.blendEquationAlpha = blendEquation;
  if (this._enabled.blend) {
    return _blendEquation.apply(this, arguments);
  }
})(ProxiedWebGLRenderingContext.prototype.blendEquation);
ProxiedWebGLRenderingContext.prototype.blendEquationSeparate = (_blendEquationSeparate => function blendEquationSeparate(blendEquationRgb, blendEquationAlpha) {
  this.state.blendEquationRgb = blendEquationRgb;
  this.state.blendEquationAlpha = blendEquationAlpha;
  if (this._enabled.blend) {
    return _blendEquationSeparate.apply(this, arguments);
  }
})(ProxiedWebGLRenderingContext.prototype.blendEquationSeparate);
ProxiedWebGLRenderingContext.prototype.blendColor = (_blendColor => function blendColor(r, g, b, a) {
  this.state.blendColor[0] = r;
  this.state.blendColor[1] = g;
  this.state.blendColor[2] = b;
  this.state.blendColor[3] = a;
  if (this._enabled.blend) {
    return _blendColor.apply(this, arguments);
  }
})(ProxiedWebGLRenderingContext.prototype.blendColor);
ProxiedWebGLRenderingContext.prototype.clearColor = (_clearColor => function clearColor(r, g, b, a) {
  this.state.colorClearValue[0] = r;
  this.state.colorClearValue[1] = g;
  this.state.colorClearValue[2] = b;
  this.state.colorClearValue[3] = a;
  return _clearColor.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.clearColor);
ProxiedWebGLRenderingContext.prototype.colorMask = (_colorMask => function colorMask(r, g, b, a) {
  this.state.colorMask[0] = r;
  this.state.colorMask[1] = g;
  this.state.colorMask[2] = b;
  this.state.colorMask[3] = a;
  return _colorMask.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.colorMask);
ProxiedWebGLRenderingContext.prototype.cullFace = (_cullFace => function cullFace(cullFaceMode) {
  this.state.cullFaceMode = cullFaceMode;
  return _cullFace.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.cullFace);
ProxiedWebGLRenderingContext.prototype.clearDepth = (_clearDepth => function clearDepth(depthClearValue) {
  this.state.depthClearValue = depthClearValue;
  return _clearDepth.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.clearDepth);
ProxiedWebGLRenderingContext.prototype.depthFunc = (_depthFunc => function depthFunc(df) {
  this.state.depthFunc = df;
  return _depthFunc.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.depthFunc);
ProxiedWebGLRenderingContext.prototype.depthRange = (_depthRange => function depthRange(near, far) {
  this.state.depthRange[0] = near;
  this.state.depthRange[1] = far;
  return _depthRange.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.depthRange);
ProxiedWebGLRenderingContext.prototype.depthMask = (_depthMask => function depthMask(dm) {
  this.state.depthMask = dm;
  return _depthMask.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.depthMask);
ProxiedWebGLRenderingContext.prototype.frontFace = (_frontFace => function frontFace(ff) {
  this.state.frontFace = ff;
  return _frontFace.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.frontFace);
ProxiedWebGLRenderingContext.prototype.hint = (_hint => function hint(target, value) {
  const stateKey = targetStateKeys[target];
  if (stateKey !== undefined) {
    this.state[stateKey] = value;
  }
  return _hint.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.hint);
ProxiedWebGLRenderingContext.prototype.lineWidth = (_lineWidth => function lineWidth(lw) {
  this.state.lineWidth = lw;
  return _lineWidth.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.lineWidth);
ProxiedWebGLRenderingContext.prototype.polygonOffset = (_polygonOffset => function polygonOffset(polygonOffsetFactor, polygonOffsetUnits) {
  this.state.polygonOffsetFactor = polygonOffsetFactor;
  this.state.polygonOffsetUnits = polygonOffsetUnits;
  return _polygonOffset.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.polygonOffset);
ProxiedWebGLRenderingContext.prototype.sampleCoverage = (_sampleCoverage => function sampleCoverage(sampleCoverageValue, sampleCoverageUnits) {
  this.state.sampleCoverageValue = sampleCoverageValue;
  this.state.sampleCoverageUnits = sampleCoverageUnits;
  return _sampleCoverage.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.sampleCoverage);
ProxiedWebGLRenderingContext.prototype.stencilFuncSeparate = (_stencilFuncSeparate => function stencilFuncSeparate(face, func, ref, mask) {
  if (face === this.BACK) {
    this.state.stencilBackFunc = func;
    this.state.stencilBackRef = ref;
    this.state.stencilBackValueMask = mask;
  } else if (face === this.FRONT) {
    this.state.stencilFunc = func;
    this.state.stencilRef = ref;
    this.state.stencilValueMask = mask;
  }
  return _stencilFuncSeparate.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.stencilFuncSeparate);
ProxiedWebGLRenderingContext.prototype.stencilOpSeparate = (_stencilOpSeparate => function stencilOpSeparate(face, fail, zfail, zpass) {
  if (face === this.BACK) {
    this.state.stencilBackFail = fail;
    this.state.stencilBackPassDepthFail = zfail;
    this.state.stencilBackPassDepthPass = zpass;
  } else if (face === this.FRONT) {
    this.state.stencilFail = fail;
    this.state.stencilPassDepthFail = zfail;
    this.state.stencilPassDepthPass = zpass;
  }
  return _stencilOpSeparate.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.stencilOpSeparate);
ProxiedWebGLRenderingContext.prototype.stencilMaskSeparate = (_stencilMaskSeparate => function stencilMaskSeparate(face, mask) {
  if (face === this.BACK) {
    this.state.stencilBackWriteMask = mask;
  } else if (face === this.FRONT) {
    this.state.stencilWriteMask = mask;
  }
  return _stencilMaskSeparate.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.stencilMaskSeparate);
ProxiedWebGLRenderingContext.prototype.clearStencil = (_clearStencil => function stencilClearValue(stencilClearValue) {
  this.state.stencilClearValue = stencilClearValue;
  return _clearStencil.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.clearStencil);
ProxiedWebGLRenderingContext.prototype.bindTexture = (_bindTexture => function bindTexture(target, texture) {
  if (target === this.TEXTURE_2D) {
    this.state.textureUnits[this.state.activeTexture - this.TEXTURE0].texture2D = texture;
  } else if (target === this.TEXTURE_CUBE_MAP) {
    this.state.textureUnits[this.state.activeTexture - this.TEXTURE0].textureCubemap = texture;
  }
  return _bindTexture.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.bindTexture);

ProxiedWebGLRenderingContext.prototype.deleteTexture = (_deleteTexture => function deleteTexture(texture) {
  for (let i = 0; i < this.state.textureUnits.length; i++) {
    const textureUnit = this.state.textureUnits[i];
    if (textureUnit.texture2D === texture) {
      textureUnit.texture2D = null;
    }
    if (textureUnit.textureCubemap === texture) {
      textureUnit.textureCubemap = null;
    }
  }
  return _deleteTexture.apply(this, arguments);
})(ProxiedWebGLRenderingContext.prototype.deleteTexture);

// WebGL1 -> WebGL2 translations
if (hasWebGL2 && WebGLRenderingContext.name === 'WebGLRenderingContext') {
  const glslVersion = '300 es';
  ProxiedWebGLRenderingContext.prototype.createShader = (_createShader => function createShader(type) {
    const result = _createShader.call(this, type);
    result.type = type;
    return result;
  })(ProxiedWebGLRenderingContext.prototype.createShader);
  ProxiedWebGLRenderingContext.prototype.shaderSource = (_shaderSource => function shaderSource(shader, source) {
    if (shader.type === this.VERTEX_SHADER) {
      // const oldSource = source;
      source = webGlToOpenGl.vertex(source, glslVersion);
      // console.log('change source 1', this, oldSource, source);
    } else if (shader.type === this.FRAGMENT_SHADER) {
      // const oldSource = source;
      source = webGlToOpenGl.fragment(source, glslVersion);
      // console.log('change source 2', this, oldSource, source);
    }
    return _shaderSource.call(this, shader, source);
  })(ProxiedWebGLRenderingContext.prototype.shaderSource);
  ProxiedWebGLRenderingContext.prototype.getActiveAttrib = (_getActiveAttrib => function getActiveAttrib(program, index) {
    let result = _getActiveAttrib.call(this, program, index);
    if (result) {
      result = {
        size: result.size,
        type: result.type,
        name: webGlToOpenGl.unmapName(result.name),
      };
    }
    return result;
  })(ProxiedWebGLRenderingContext.prototype.getActiveAttrib);
  ProxiedWebGLRenderingContext.prototype.getActiveUniform = (_getActiveUniform => function getActiveUniform(program, index) {
    let result = _getActiveUniform.call(this, program, index);
    if (result) {
      result = {
        size: result.size,
        type: result.type,
        name: webGlToOpenGl.unmapName(result.name),
      };
    }
    return result;
  })(ProxiedWebGLRenderingContext.prototype.getActiveUniform);
  ProxiedWebGLRenderingContext.prototype.getAttribLocation = (_getAttribLocation => function getAttribLocation(program, path) {
    path = webGlToOpenGl.mapName(path);
    return _getAttribLocation.call(this, program, path);
  })(ProxiedWebGLRenderingContext.prototype.getAttribLocation);
  ProxiedWebGLRenderingContext.prototype.getUniformLocation = (_getUniformLocation => function getUniformLocation(program, path) {
    path = webGlToOpenGl.mapName(path);
    return _getUniformLocation.call(this, program, path);
  })(ProxiedWebGLRenderingContext.prototype.getUniformLocation);
}

return ProxiedWebGLRenderingContext;

});

export {
  WebGLRenderingContext,
  WebGL2RenderingContext,
  CanvasRenderingContext2D,
};
