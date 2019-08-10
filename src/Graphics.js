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
    const gl = this.backingCanvas.getContext('webgl');
    this.backingContext = gl;

    const extensions = {
      WEBGL_depth_texture: gl.getExtension('WEBGL_depth_texture'),
      OES_vertex_array_object: gl.getExtension('OES_vertex_array_object'),
    };
    this.extensions = extensions;
    this.defaultFramebuffer = {
      fbo: gl.createFramebuffer(),
      colorTex: gl.createTexture(),
      depthTex: gl.createTexture(),
      vao: extensions.OES_vertex_array_object.createVertexArrayOES(),
      programVao: null,
      buffer: null,
      program: null,
      positionLocation: null,
      uTexLocation: null,
    };
    extensions.OES_vertex_array_object.bindVertexArrayOES(this.defaultFramebuffer.vao);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.defaultFramebuffer.fbo);

    gl.bindTexture(gl.TEXTURE_2D, this.defaultFramebuffer.colorTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.backingCanvas.width, this.backingCanvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.defaultFramebuffer.colorTex, 0);
    gl.bindTexture(gl.TEXTURE_2D, this.defaultFramebuffer.depthTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, 0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_STENCIL, this.backingCanvas.width, this.backingCanvas.height, 0, gl.DEPTH_STENCIL, extensions.WEBGL_depth_texture.UNSIGNED_INT_24_8_WEBGL, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, this.defaultFramebuffer.depthTex, 0);

    gl.bindTexture(gl.TEXTURE_2D, null);

    // gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    GlobalContext.contexts.push(this);
  }
  getParameter(key) {
    let result = this.backingContext.getParameter(key);
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
  resize(w, h) {
    this.backingCanvas.width = w;
    this.backingCanvas.height = h;

    const {backingContext: gl, extensions} = this;
    const oldFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    const oldTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);

    gl.bindTexture(gl.TEXTURE_2D, this.defaultFramebuffer.colorTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.backingCanvas.width, this.backingCanvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindTexture(gl.TEXTURE_2D, this.defaultFramebuffer.depthTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_STENCIL, this.backingCanvas.width, this.backingCanvas.height, 0, gl.DEPTH_STENCIL, extensions.WEBGL_depth_texture.UNSIGNED_INT_24_8_WEBGL, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.defaultFramebuffer.fbo);

    gl.bindFramebuffer(gl.FRAMEBUFFER, oldFramebuffer);
    gl.bindTexture(gl.TEXTURE_2D, oldTexture);
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

    if (!this.defaultFramebuffer.programVao) {
      this.defaultFramebuffer.programVao = extensions.OES_vertex_array_object.createVertexArrayOES();
      extensions.OES_vertex_array_object.bindVertexArrayOES(this.defaultFramebuffer.programVao);

      this.defaultFramebuffer.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.defaultFramebuffer.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, VERTS, gl.STATIC_DRAW);

      this.defaultFramebuffer.program = gl.createProgram();

      {
        const vsh = `
          attribute vec2 position;
          varying vec2 vTexCoords;
          const vec2 scale = vec2(0.5, 0.5);
          void main() {
            vTexCoords  = position * scale + scale; // scale vertex attribute to [0,1] range
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
        gl.attachShader(this.defaultFramebuffer.program, shader);
      }
      {
        const fsh = `
          precision highp float;
          uniform sampler2D uTex;
          varying vec2 vTexCoords;
          void main() {
            gl_FragColor = texture2D(uTex, vTexCoords);
          }
        `;
        const shader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(shader, fsh);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.log('Error compiling fragment shader:');
          console.log(gl.getShaderInfoLog(shader));
        }
        gl.attachShader(this.defaultFramebuffer.program, shader);
      }

      gl.linkProgram(this.defaultFramebuffer.program);
      if (!gl.getProgramParameter(this.defaultFramebuffer.program, gl.LINK_STATUS)) {
        console.log('Error linking shader program:');
        console.log(gl.getProgramInfoLog(this.defaultFramebuffer.program));
      }
      gl.useProgram(this.defaultFramebuffer.program);

      this.defaultFramebuffer.positionLocation = gl.getAttribLocation(this.defaultFramebuffer.program, 'position');
      gl.enableVertexAttribArray(this.defaultFramebuffer.positionLocation);
      gl.vertexAttribPointer(this.defaultFramebuffer.positionLocation, 2, gl.FLOAT, false, 0, 0);

      this.defaultFramebuffer.uTexLocation = gl.getUniformLocation(this.defaultFramebuffer.program, 'uTex');
      gl.uniform1i(this.defaultFramebuffer.uTexLocation, 0);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    extensions.OES_vertex_array_object.bindVertexArrayOES(this.defaultFramebuffer.programVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.defaultFramebuffer.buffer);
    gl.useProgram(this.defaultFramebuffer.program);

    gl.bindTexture(gl.TEXTURE_2D, this.defaultFramebuffer.colorTex);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    const color = canvas.transferToImageBitmap();

    gl.bindTexture(gl.TEXTURE_2D, this.defaultFramebuffer.depthTex);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    const depth = canvas.transferToImageBitmap();

    gl.bindFramebuffer(gl.FRAMEBUFFER, oldFramebuffer);
    gl.bindTexture(gl.TEXTURE_2D, oldTexture);
    gl.activeTexture(oldActiveTexture);
    extensions.OES_vertex_array_object.bindVertexArrayOES(oldVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, oldBuffer);
    gl.useProgram(oldProgram);

    return {
      color,
      depth,
    };
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
