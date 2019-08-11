import GlobalContext from './GlobalContext.js';

const {OffscreenCanvasRenderingContext2D, WebGLRenderingContext: OffscreenWebGLRenderingContext, WebGL2RenderingContext: OffscreenWebGL2RenderingContext} = self;
self.OffscreenCanvasRenderingContext2D = undefined;
self.WebGLRenderingContext = undefined;
self.WebGL2RenderingContext = undefined;

const VERTS = Float32Array.from([
   1.0,  1.0,
  -1.0,  1.0,
  -1.0, -1.0,
  -1.0, -1.0,
   1.0, -1.0,
   1.0,  1.0,
]);
const _inherit = (a, b) => {
  for (const k in b) {
    if (!(k in a)) {
      a[k] = b[k];
    }
  }
  for (const k in b.prototype) {
    if (!(k in a.prototype)) {
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
  drawImage(a, b, c, d, e, f, g, h, i) {
    if (a && a.constructor && a.constructor.name === 'HTMLImageElement') {
      a = a.imageBitmap;
    }
    if (a && a.constructor && a.constructor.name === 'HTMLCanvasElement') {
      a = a.backingCanvas;
    }

    if (i !== undefined) {
      return this.backingContext.backingContext(a, b, c, d, e, f, g, h, i);
    }
    if (e !== undefined) {
      return this.backingContext.drawImage(a, b, c, d, e);
    }
    return this.backingContext.drawImage(a, b, c);
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
    const gl = this.backingCanvas.getContext('webgl');
    this.backingContext = gl;

    const extensions = {
      WEBGL_depth_texture: gl.getExtension('WEBGL_depth_texture'),
      OES_vertex_array_object: gl.getExtension('OES_vertex_array_object'),
      EXT_frag_depth: gl.getExtension('EXT_frag_depth'),
    };
    this.extensions = extensions;
    this.defaultFramebuffer = {
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
    this.enabled = {
      clear: false,
    };

    extensions.OES_vertex_array_object.bindVertexArrayOES(this.defaultFramebuffer.vao);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.defaultFramebuffer.fbo);

    gl.bindTexture(gl.TEXTURE_2D, this.defaultFramebuffer.colorTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.backingCanvas.width, this.backingCanvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.defaultFramebuffer.colorTex, 0);

    gl.bindTexture(gl.TEXTURE_2D, this.defaultFramebuffer.depthTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, this.backingCanvas.width, this.backingCanvas.height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.defaultFramebuffer.depthTex, 0);

    gl.bindTexture(gl.TEXTURE_2D, null);

    // gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    GlobalContext.contexts.push(this);
  }
  getParameter(key) {
    const {backingContext: gl} = this;
    let result = gl.getParameter(key);
    // if ((key === gl.FRAMEBUFFER_BINDING || key === gl.READ_FRAMEBUFFER_BINDING || key === gl.DRAW_FRAMEBUFFER_BINDING) && result === this.defaultFramebuffer.fbo) {
    if (key === gl.FRAMEBUFFER_BINDING && result === this.defaultFramebuffer.fbo) {
      result = null;
    }
    return result;
  }
  bindFramebuffer(target, fbo) {
    if (!fbo) {
      fbo = this.defaultFramebuffer.fbo;
    }
  }
  clear(flags) {
    if (this.enabled.clear) {
      this.backingContext.clear(flags);
    }
  }
  texImage2D(a, b, c, d, e, f, g, h, i) {
    if (f && f.constructor && f.constructor.name === 'HTMLImageElement') {
      f = f.imageBitmap;
      return this.backingContext.texImage2D(a, b, c, d, e, f);
    }
    if (i && i.constructor && i.constructor.name === 'HTMLImageElement') {
      i = i.imageBitmap;
      return this.backingContext.texImage2D(a, b, c, d, e, f, g, h, i);
    }
    if (f && f.constructor && f.constructor.name === 'HTMLCanvasElement') {
      f = f.backingCanvas;
      return this.backingContext.texImage2D(a, b, c, d, e, f);
    }
    if (i && i.constructor && i.constructor.name === 'HTMLCanvasElement') {
      i = i.backingCanvas;
      return this.backingContext.texImage2D(a, b, c, d, e, f, g, h, i);
    }
    return this.backingContext.texImage2D.apply(this.backingContext, arguments);
  }
  resize(w, h) {
    this.backingCanvas.width = w;
    this.backingCanvas.height = h;

    const {backingContext: gl, extensions} = this;
    // const oldFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    const oldTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);

    gl.bindTexture(gl.TEXTURE_2D, this.defaultFramebuffer.colorTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.backingCanvas.width, this.backingCanvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindTexture(gl.TEXTURE_2D, this.defaultFramebuffer.depthTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, this.backingCanvas.width, this.backingCanvas.height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);

    if (this.defaultFramebuffer.decodeColorTex) {
      gl.bindTexture(gl.TEXTURE_2D, this.defaultFramebuffer.decodeColorTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.backingCanvas.width, this.backingCanvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
    if (this.defaultFramebuffer.decodeDepthTex) {
      gl.bindTexture(gl.TEXTURE_2D, this.defaultFramebuffer.decodeDepthTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.backingCanvas.width, this.backingCanvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }

    // gl.bindFramebuffer(gl.FRAMEBUFFER, this.defaultFramebuffer.fbo);

    // gl.bindFramebuffer(gl.FRAMEBUFFER, oldFramebuffer);
    gl.bindTexture(gl.TEXTURE_2D, oldTexture);
  }
  _exokitEnsureShaders() {
    const {backingContext: gl, extensions} = this;
    if (!this.defaultFramebuffer.buffer) {
      this.defaultFramebuffer.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.defaultFramebuffer.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, VERTS, gl.STATIC_DRAW);

      {
        this.defaultFramebuffer.colorVao = extensions.OES_vertex_array_object.createVertexArrayOES();
        extensions.OES_vertex_array_object.bindVertexArrayOES(this.defaultFramebuffer.colorVao);

        this.defaultFramebuffer.colorProgram = gl.createProgram();

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
          gl.attachShader(this.defaultFramebuffer.colorProgram, shader);
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
          gl.attachShader(this.defaultFramebuffer.colorProgram, shader);
        }

        gl.linkProgram(this.defaultFramebuffer.colorProgram);
        if (!gl.getProgramParameter(this.defaultFramebuffer.colorProgram, gl.LINK_STATUS)) {
          console.log('Error linking shader program:');
          console.log(gl.getProgramInfoLog(this.defaultFramebuffer.colorProgram));
        }
        gl.useProgram(this.defaultFramebuffer.colorProgram)

        const positionLocation = gl.getAttribLocation(this.defaultFramebuffer.colorProgram, 'position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const uColorTexLocation = gl.getUniformLocation(this.defaultFramebuffer.colorProgram, 'uColorTex');
        gl.uniform1i(uColorTexLocation, 0);
      }

      {
        this.defaultFramebuffer.depthVao = extensions.OES_vertex_array_object.createVertexArrayOES();
        extensions.OES_vertex_array_object.bindVertexArrayOES(this.defaultFramebuffer.depthVao);

        this.defaultFramebuffer.depthProgram = gl.createProgram();

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
          gl.attachShader(this.defaultFramebuffer.depthProgram, shader);
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
          gl.attachShader(this.defaultFramebuffer.depthProgram, shader);
        }

        gl.linkProgram(this.defaultFramebuffer.depthProgram);
        if (!gl.getProgramParameter(this.defaultFramebuffer.depthProgram, gl.LINK_STATUS)) {
          console.log('Error linking shader program:');
          console.log(gl.getProgramInfoLog(this.defaultFramebuffer.depthProgram));
        }
        gl.useProgram(this.defaultFramebuffer.depthProgram)

        const positionLocation = gl.getAttribLocation(this.defaultFramebuffer.depthProgram, 'position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const uColorTexLocation = gl.getUniformLocation(this.defaultFramebuffer.depthProgram, 'uColorTex');
        gl.uniform1i(uColorTexLocation, 0);
      }

      {
        this.defaultFramebuffer.decodeVao = extensions.OES_vertex_array_object.createVertexArrayOES();
        extensions.OES_vertex_array_object.bindVertexArrayOES(this.defaultFramebuffer.decodeVao);

        this.defaultFramebuffer.decodeProgram = gl.createProgram();

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
          gl.attachShader(this.defaultFramebuffer.decodeProgram, shader);
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
          gl.attachShader(this.defaultFramebuffer.decodeProgram, shader);
        }

        gl.linkProgram(this.defaultFramebuffer.decodeProgram);
        if (!gl.getProgramParameter(this.defaultFramebuffer.decodeProgram, gl.LINK_STATUS)) {
          console.log('Error linking shader program:');
          console.log(gl.getProgramInfoLog(this.defaultFramebuffer.decodeProgram));
        }
        gl.useProgram(this.defaultFramebuffer.decodeProgram)

        const positionLocation = gl.getAttribLocation(this.defaultFramebuffer.decodeProgram, 'position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const uColorTexLocation = gl.getUniformLocation(this.defaultFramebuffer.decodeProgram, 'uColorTex');
        gl.uniform1i(uColorTexLocation, 0);

        const uDepthTexLocation = gl.getUniformLocation(this.defaultFramebuffer.decodeProgram, 'uDepthTex');
        gl.uniform1i(uDepthTexLocation, 1);

        this.defaultFramebuffer.decodeColorTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.defaultFramebuffer.decodeColorTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.backingCanvas.width, this.backingCanvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        this.defaultFramebuffer.decodeDepthTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.defaultFramebuffer.decodeDepthTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.backingCanvas.width, this.backingCanvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
    }
  }
  _exokitGetFrame() {
    const {backingCanvas: canvas, backingContext: gl, extensions} = this;
    const oldFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    const oldActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
    gl.activeTexture(gl.TEXTURE0);
    const oldTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);
    const oldVao = gl.getParameter(extensions.OES_vertex_array_object.VERTEX_ARRAY_BINDING_OES);
    const oldBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
    const oldProgram = gl.getParameter(gl.CURRENT_PROGRAM);

    this._exokitEnsureShaders();

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.defaultFramebuffer.buffer);

    extensions.OES_vertex_array_object.bindVertexArrayOES(this.defaultFramebuffer.colorVao);
    gl.useProgram(this.defaultFramebuffer.colorProgram);
    gl.bindTexture(gl.TEXTURE_2D, this.defaultFramebuffer.colorTex);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    const color = canvas.transferToImageBitmap();

    extensions.OES_vertex_array_object.bindVertexArrayOES(this.defaultFramebuffer.depthVao);
    gl.useProgram(this.defaultFramebuffer.depthProgram);
    gl.bindTexture(gl.TEXTURE_2D, this.defaultFramebuffer.depthTex);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    const depth = canvas.transferToImageBitmap();

    gl.bindFramebuffer(gl.FRAMEBUFFER, oldFramebuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, oldBuffer);
    gl.bindTexture(gl.TEXTURE_2D, oldTexture);
    gl.activeTexture(oldActiveTexture);
    extensions.OES_vertex_array_object.bindVertexArrayOES(oldVao);
    gl.useProgram(oldProgram);

    return {
      color,
      depth,
    };
  }
  _exokitPutFrame(frame) {
    const {color, depth} = frame;

    const {backingCanvas: canvas, backingContext: gl, extensions} = this;
    const oldFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    const oldActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
    gl.activeTexture(gl.TEXTURE0);
    const oldTexture0 = gl.getParameter(gl.TEXTURE_BINDING_2D);
    gl.activeTexture(gl.TEXTURE1);
    const oldTexture1 = gl.getParameter(gl.TEXTURE_BINDING_2D);
    gl.activeTexture(gl.TEXTURE0);
    const oldVao = gl.getParameter(extensions.OES_vertex_array_object.VERTEX_ARRAY_BINDING_OES);
    const oldBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
    const oldProgram = gl.getParameter(gl.CURRENT_PROGRAM);

    this._exokitEnsureShaders();

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.defaultFramebuffer.fbo);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.defaultFramebuffer.buffer);

    extensions.OES_vertex_array_object.bindVertexArrayOES(this.defaultFramebuffer.decodeVao);
    gl.useProgram(this.defaultFramebuffer.decodeProgram);

    this._exokitClear();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.defaultFramebuffer.decodeColorTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, color);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.defaultFramebuffer.decodeDepthTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, depth);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindFramebuffer(gl.FRAMEBUFFER, oldFramebuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, oldBuffer);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, oldTexture0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, oldTexture1);
    gl.activeTexture(oldActiveTexture);
    extensions.OES_vertex_array_object.bindVertexArrayOES(oldVao);
    gl.useProgram(oldProgram);
  }
  _exokitClearEnabled(enabled) {
    this.enabled.clear = enabled;
  }
  _exokitClear() {
    const {backingContext: gl} = this;
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT|gl.STENCIL_BUFFER_BIT);
  }
  destroy() {
    GlobalContext.contexts.splice(GlobalContext.contexts.indexOf(this), 1);
  }
}
_inherit(WebGLRenderingContext, OffscreenWebGLRenderingContext);

class WebGL2RenderingContext extends WebGLRenderingContext {
  constructor(canvasEl) {
    super(canvasEl);
  }
  resize(w, h) {
    this.backingCanvas.width = w;
    this.backingCanvas.height = h;
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
