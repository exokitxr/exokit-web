import GlobalContext from './GlobalContext.js';

/* const {OffscreenCanvasRenderingContext2D, WebGLRenderingContext: OffscreenWebGLRenderingContext, WebGL2RenderingContext: OffscreenWebGL2RenderingContext} = self;
self.OffscreenCanvasRenderingContext2D = undefined;
self.WebGLRenderingContext = undefined;
self.WebGL2RenderingContext = undefined; */

const {WebGLRenderingContext, WebGL2RenderingContext, CanvasRenderingContext2D} = self;

const VERTS = Float32Array.from([
   1.0,  1.0,
  -1.0,  1.0,
  -1.0, -1.0,
  -1.0, -1.0,
   1.0, -1.0,
   1.0,  1.0,
]);
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
    const offscreenCanvas = new OffscreenCanvas(this.width, this.height);
    const gl = offscreenCanvas.getContext(type, init);
    gl.id = Atomics.add(GlobalContext.xrState.id, 0) + 1;
    /* Object.defineProperty(offscreenCanvas, 'ownerDocument', {
      get() {
        return canvas.ownerDocument;
      },
    });
    Object.defineProperty(offscreenCanvas, 'parentNode', {
      get() {
        return canvas.parentNode;
      },
    });
    Object.defineProperty(gl, 'canvas', {
      get() {
        return offscreenCanvas;
      },
    }); */
    Object.defineProperty(gl, 'canvas', {
      get() {
        return canvas;
      },
    });
    canvas.getContext = function getContext() {
      return gl;
    };
    canvas.transferToImageBitmap = function transferToImageBitmap() {
      return offscreenCanvas.transferToImageBitmap();
    };

    GlobalContext.contexts.push(gl);

    const extensions = {
      WEBGL_depth_texture: gl.getExtension('WEBGL_depth_texture'),
      OES_vertex_array_object: gl.getExtension('OES_vertex_array_object'),
      EXT_frag_depth: gl.getExtension('EXT_frag_depth'),
    };
    gl._extensions = extensions;
    const defaultFramebuffer = {
      fbo: gl.createFramebuffer(),
      colorTex: gl.createTexture(),
      depthTex: gl.createTexture(),
      vao: extensions.OES_vertex_array_object.createVertexArrayOES(),
      buffer: null,
      colorVao: null,
      colorProgram: null,
      depthVao: null,
      depthProgram: null,
      decodeVao: null,
      decodeProgram: null,
      decodeColorTex: null,
      decodeDepthTex: null,
    };
    gl._defaultFramebuffer = defaultFramebuffer;
    const enabled = {
      clear: true,
    };
    gl._enabled = enabled;

    extensions.OES_vertex_array_object.bindVertexArrayOES(defaultFramebuffer.vao);

    gl._exokitBindFramebuffer(gl.FRAMEBUFFER, defaultFramebuffer.fbo);

    gl.bindTexture(gl.TEXTURE_2D, defaultFramebuffer.colorTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, defaultFramebuffer.colorTex, 0);

    gl.bindTexture(gl.TEXTURE_2D, defaultFramebuffer.depthTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, this.width, this.height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, defaultFramebuffer.depthTex, 0);

    gl.bindTexture(gl.TEXTURE_2D, null);

    new MutationObserver(() => {
      offscreenCanvas.width = this.width;
      offscreenCanvas.height = this.height;

      // const oldFramebuffer = gl._exokitGetParameter(gl.FRAMEBUFFER_BINDING);
      const oldTexture = gl._exokitGetParameter(gl.TEXTURE_BINDING_2D);

      gl.bindTexture(gl.TEXTURE_2D, defaultFramebuffer.colorTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindTexture(gl.TEXTURE_2D, defaultFramebuffer.depthTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, this.width, this.height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);

      if (defaultFramebuffer.decodeColorTex) {
        gl.bindTexture(gl.TEXTURE_2D, defaultFramebuffer.decodeColorTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
      if (defaultFramebuffer.decodeDepthTex) {
        gl.bindTexture(gl.TEXTURE_2D, defaultFramebuffer.decodeDepthTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }

      gl.bindTexture(gl.TEXTURE_2D, oldTexture);
    }).observe(this, {
      attributes: true,
      attributeFilter: ['width', 'height'],
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

WebGLRenderingContext.prototype._exokitGetParameter = (oldGetParameter => function _exokitGetParameter() {
  return oldGetParameter.apply(this, arguments);
})(WebGLRenderingContext.prototype.getParameter);
WebGLRenderingContext.prototype.getParameter = (oldGetParameter => function getParameter(key) {
  let result = oldGetParameter.call(this, key);
  // if ((key === this.FRAMEBUFFER_BINDING || key === this.READ_FRAMEBUFFER_BINDING || key === this.DRAW_FRAMEBUFFER_BINDING) && result === this._defaultFramebuffer.fbo) {
  if (key === this.FRAMEBUFFER_BINDING && result === this._defaultFramebuffer.fbo) {
    result = null;
  }
  return result;
})(WebGLRenderingContext.prototype.getParameter);
WebGLRenderingContext.prototype._exokitBindFramebuffer = (oldBindframebuffer => function _exokitBindFramebuffer() {
  oldBindframebuffer.apply(this, arguments);
})(WebGLRenderingContext.prototype.bindFramebuffer);
WebGLRenderingContext.prototype.bindFramebuffer = (oldBindframebuffer => function bindFramebuffer(target, fbo) {
  if (!fbo) {
    fbo = this._defaultFramebuffer.fbo;
  }
  oldBindframebuffer.call(this, target, fbo);
})(WebGLRenderingContext.prototype.bindFramebuffer);
WebGLRenderingContext.prototype.clear = (oldClear => function clear() {
  if (this._enabled.clear) {
    oldClear.apply(this, arguments);
  }
})(WebGLRenderingContext.prototype.clear);
WebGLRenderingContext.prototype._exokitEnsureShaders = function _exokitEnsureShaders() {
  const gl = this;
  const {_extensions: extensions, _defaultFramebuffer: defaultFramebuffer} = this;

  if (!defaultFramebuffer.buffer) {
    defaultFramebuffer.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, defaultFramebuffer.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, VERTS, gl.STATIC_DRAW);

    {
      defaultFramebuffer.colorVao = extensions.OES_vertex_array_object.createVertexArrayOES();
      extensions.OES_vertex_array_object.bindVertexArrayOES(defaultFramebuffer.colorVao);

      defaultFramebuffer.colorProgram = gl.createProgram();

      {
        const vsh = `
          attribute vec2 position;
          varying vec2 vTexCoords;
          const vec2 scale = vec2(0.5, 0.5);
          void main() {
            vTexCoords = position * scale + scale; // scale vertex attribute to [0,1] range
            // vTexCoords.y = 1.0 - vTexCoords.y;
            gl_Position = vec4(position, 0.0, 1.0);
          }
        `;
        const shader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(shader, vsh);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.log(`Error compiling vertex shader:`);
          console.log(gl.getShaderInfoLog(shader));
        }
        gl.attachShader(defaultFramebuffer.colorProgram, shader);
      }
      {
        const fsh = `
          precision highp float;
          uniform sampler2D uColorTex;
          varying vec2 vTexCoords;
          void main() {
            gl_FragColor = texture2D(uColorTex, vTexCoords);
          }
        `;
        const shader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(shader, fsh);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.log('Error compiling fragment shader:');
          console.log(gl.getShaderInfoLog(shader));
        }
        gl.attachShader(defaultFramebuffer.colorProgram, shader);
      }

      gl.linkProgram(defaultFramebuffer.colorProgram);
      if (!gl.getProgramParameter(defaultFramebuffer.colorProgram, gl.LINK_STATUS)) {
        console.log('Error linking shader program:');
        console.log(gl.getProgramInfoLog(defaultFramebuffer.colorProgram));
      }
      gl.useProgram(defaultFramebuffer.colorProgram)

      const positionLocation = gl.getAttribLocation(defaultFramebuffer.colorProgram, 'position');
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      const uColorTexLocation = gl.getUniformLocation(defaultFramebuffer.colorProgram, 'uColorTex');
      gl.uniform1i(uColorTexLocation, 0);
    }

    {
      defaultFramebuffer.depthVao = extensions.OES_vertex_array_object.createVertexArrayOES();
      extensions.OES_vertex_array_object.bindVertexArrayOES(defaultFramebuffer.depthVao);

      defaultFramebuffer.depthProgram = gl.createProgram();

      {
        const vsh = `
          attribute vec2 position;
          varying vec2 vTexCoords;
          const vec2 scale = vec2(0.5, 0.5);
          void main() {
            vTexCoords = position * scale + scale; // scale vertex attribute to [0,1] range
            // vTexCoords.y = 1.0 - vTexCoords.y;
            gl_Position = vec4(position, 0.0, 1.0);
          }
        `;
        const shader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(shader, vsh);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.log(`Error compiling vertex shader:`);
          console.log(gl.getShaderInfoLog(shader));
        }
        gl.attachShader(defaultFramebuffer.depthProgram, shader);
      }
      {
        const fsh = `
          precision highp float;
          uniform sampler2D uColorTex;
          varying vec2 vTexCoords;
          vec4 EncodeFloatRGBA(float v) {
            vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;
            enc = fract(enc);
            enc -= enc.yzww * vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);
            return enc;
          }
          void main() {
            gl_FragColor = EncodeFloatRGBA(texture2D(uColorTex, vTexCoords).r);
          }
        `;
        const shader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(shader, fsh);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.log('Error compiling fragment shader:');
          console.log(gl.getShaderInfoLog(shader));
        }
        gl.attachShader(defaultFramebuffer.depthProgram, shader);
      }

      gl.linkProgram(defaultFramebuffer.depthProgram);
      if (!gl.getProgramParameter(defaultFramebuffer.depthProgram, gl.LINK_STATUS)) {
        console.log('Error linking shader program:');
        console.log(gl.getProgramInfoLog(defaultFramebuffer.depthProgram));
      }
      gl.useProgram(defaultFramebuffer.depthProgram)

      const positionLocation = gl.getAttribLocation(defaultFramebuffer.depthProgram, 'position');
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      const uColorTexLocation = gl.getUniformLocation(defaultFramebuffer.depthProgram, 'uColorTex');
      gl.uniform1i(uColorTexLocation, 0);
    }

    {
      defaultFramebuffer.decodeVao = extensions.OES_vertex_array_object.createVertexArrayOES();
      extensions.OES_vertex_array_object.bindVertexArrayOES(defaultFramebuffer.decodeVao);

      defaultFramebuffer.decodeProgram = gl.createProgram();

      {
        const vsh = `
          attribute vec2 position;
          varying vec2 vTexCoords;
          const vec2 scale = vec2(0.5, 0.5);
          void main() {
            vTexCoords = position * scale + scale; // scale vertex attribute to [0,1] range
            vTexCoords.y = 1.0 - vTexCoords.y;
            gl_Position = vec4(position, 0.0, 1.0);
          }
        `;
        const shader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(shader, vsh);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.log(`Error compiling vertex shader:`);
          console.log(gl.getShaderInfoLog(shader));
        }
        gl.attachShader(defaultFramebuffer.decodeProgram, shader);
      }
      {
        const fsh = `
          #extension GL_EXT_frag_depth : enable
          precision highp float;
          uniform sampler2D uColorTex;
          uniform sampler2D uDepthTex;
          varying vec2 vTexCoords;
          float DecodeFloatRGBA(vec4 rgba) {
            return dot(rgba, vec4(1.0, 1.0/255.0, 1.0/65025.0, 1.0/16581375.0));
          }
          void main() {
            gl_FragColor = texture2D(uColorTex, vTexCoords);
            float depth = DecodeFloatRGBA(texture2D(uDepthTex, vTexCoords));
            if (depth == 0.0) {
              depth = 1.0;
            }
            gl_FragDepthEXT = depth;
          }
        `;
        const shader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(shader, fsh);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.log('Error compiling fragment shader:');
          console.log(gl.getShaderInfoLog(shader));
        }
        gl.attachShader(defaultFramebuffer.decodeProgram, shader);
      }

      gl.linkProgram(defaultFramebuffer.decodeProgram);
      if (!gl.getProgramParameter(defaultFramebuffer.decodeProgram, gl.LINK_STATUS)) {
        console.log('Error linking shader program:');
        console.log(gl.getProgramInfoLog(defaultFramebuffer.decodeProgram));
      }
      gl.useProgram(defaultFramebuffer.decodeProgram)

      const positionLocation = gl.getAttribLocation(defaultFramebuffer.decodeProgram, 'position');
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      const uColorTexLocation = gl.getUniformLocation(defaultFramebuffer.decodeProgram, 'uColorTex');
      gl.uniform1i(uColorTexLocation, 0);

      const uDepthTexLocation = gl.getUniformLocation(defaultFramebuffer.decodeProgram, 'uDepthTex');
      gl.uniform1i(uDepthTexLocation, 1);

      defaultFramebuffer.decodeColorTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, defaultFramebuffer.decodeColorTex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.canvas.width, this.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

      defaultFramebuffer.decodeDepthTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, defaultFramebuffer.decodeDepthTex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.canvas.width, this.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
  }
};
WebGLRenderingContext.prototype._exokitGetFrame = function _exokitGetFrame() {
  const gl = this;
  const {canvas, _defaultFramebuffer: defaultFramebuffer, _extensions: extensions} = this;

  const oldFramebuffer = gl._exokitGetParameter(gl.FRAMEBUFFER_BINDING);
  const oldActiveTexture = gl._exokitGetParameter(gl.ACTIVE_TEXTURE);
  gl.activeTexture(gl.TEXTURE0);
  const oldTexture = gl._exokitGetParameter(gl.TEXTURE_BINDING_2D);
  const oldVao = gl._exokitGetParameter(extensions.OES_vertex_array_object.VERTEX_ARRAY_BINDING_OES);
  const oldBuffer = gl._exokitGetParameter(gl.ARRAY_BUFFER_BINDING);
  const oldProgram = gl._exokitGetParameter(gl.CURRENT_PROGRAM);
  const oldViewport = gl._exokitGetParameter(gl.VIEWPORT);
  const oldScissorTest = gl._exokitGetParameter(gl.SCISSOR_TEST);

  this._exokitEnsureShaders();

  gl._exokitBindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindBuffer(gl.ARRAY_BUFFER, defaultFramebuffer.buffer);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.disable(gl.SCISSOR_TEST);

  extensions.OES_vertex_array_object.bindVertexArrayOES(defaultFramebuffer.colorVao);
  gl.useProgram(defaultFramebuffer.colorProgram);
  gl.bindTexture(gl.TEXTURE_2D, defaultFramebuffer.colorTex);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  const color = canvas.transferToImageBitmap();

  extensions.OES_vertex_array_object.bindVertexArrayOES(defaultFramebuffer.depthVao);
  gl.useProgram(defaultFramebuffer.depthProgram);
  gl.bindTexture(gl.TEXTURE_2D, defaultFramebuffer.depthTex);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  const depth = canvas.transferToImageBitmap();

  gl._exokitBindFramebuffer(gl.FRAMEBUFFER, oldFramebuffer);
  gl.bindBuffer(gl.ARRAY_BUFFER, oldBuffer);
  gl.bindTexture(gl.TEXTURE_2D, oldTexture);
  gl.activeTexture(oldActiveTexture);
  extensions.OES_vertex_array_object.bindVertexArrayOES(oldVao);
  gl.useProgram(oldProgram);
  gl.viewport(oldViewport[0], oldViewport[1], oldViewport[2], oldViewport[3]);
  if (oldScissorTest) {
    gl.enable(gl.SCISSOR_TEST);
  }

  return {
    color,
    depth,
  };
};
WebGLRenderingContext.prototype._exokitPutFrame = function _exokitPutFrame(frame) {
  const {color, depth} = frame;

  const gl = this;
  const {canvas, _defaultFramebuffer: defaultFramebuffer, _extensions: extensions} = this;

  const oldFramebuffer = gl._exokitGetParameter(gl.FRAMEBUFFER_BINDING);
  const oldActiveTexture = gl._exokitGetParameter(gl.ACTIVE_TEXTURE);
  gl.activeTexture(gl.TEXTURE0);
  const oldTexture0 = gl._exokitGetParameter(gl.TEXTURE_BINDING_2D);
  gl.activeTexture(gl.TEXTURE1);
  const oldTexture1 = gl._exokitGetParameter(gl.TEXTURE_BINDING_2D);
  gl.activeTexture(gl.TEXTURE0);
  const oldVao = gl._exokitGetParameter(extensions.OES_vertex_array_object.VERTEX_ARRAY_BINDING_OES);
  const oldBuffer = gl._exokitGetParameter(gl.ARRAY_BUFFER_BINDING);
  const oldProgram = gl._exokitGetParameter(gl.CURRENT_PROGRAM);
  const oldViewport = gl._exokitGetParameter(gl.VIEWPORT);
  const oldScissorTest = gl._exokitGetParameter(gl.SCISSOR_TEST);

  this._exokitEnsureShaders();

  gl._exokitBindFramebuffer(gl.FRAMEBUFFER, defaultFramebuffer.fbo);
  gl.bindBuffer(gl.ARRAY_BUFFER, defaultFramebuffer.buffer);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.disable(gl.SCISSOR_TEST);

  extensions.OES_vertex_array_object.bindVertexArrayOES(defaultFramebuffer.decodeVao);
  gl.useProgram(defaultFramebuffer.decodeProgram);

  this._exokitClear();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, defaultFramebuffer.decodeColorTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, color);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, defaultFramebuffer.decodeDepthTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, depth);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  gl._exokitBindFramebuffer(gl.FRAMEBUFFER, oldFramebuffer);
  gl.bindBuffer(gl.ARRAY_BUFFER, oldBuffer);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, oldTexture0);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, oldTexture1);
  gl.activeTexture(oldActiveTexture);
  extensions.OES_vertex_array_object.bindVertexArrayOES(oldVao);
  gl.useProgram(oldProgram);
  gl.viewport(oldViewport[0], oldViewport[1], oldViewport[2], oldViewport[3]);
  if (oldScissorTest) {
    gl.enable(gl.SCISSOR_TEST);
  }
};
WebGLRenderingContext.prototype._exokitClearEnabled = function _exokitClearEnabled(enabled) {
  this._enabled.clear = enabled;
};
WebGLRenderingContext.prototype._exokitClear = function _exokitClear() {
  this.clear(this.COLOR_BUFFER_BIT|this.DEPTH_BUFFER_BIT|this.STENCIL_BUFFER_BIT);
};
WebGLRenderingContext.prototype.destroy = function destroy() {
  GlobalContext.contexts.splice(GlobalContext.contexts.indexOf(this), 1);
};

export {
  WebGLRenderingContext,
  WebGL2RenderingContext,
  CanvasRenderingContext2D,
};
