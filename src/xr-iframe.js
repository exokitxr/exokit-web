import {_makeWindow} from './WindowVm.js';

import THREE from '../lib/three-min.js';
import {getXrOffsetMatrix} from './VR.js';
import {XRRigidTransform} from './XR.js';

import utils from './utils.js';
const {_normalizeUrl/*, _getProxyUrl*/} = utils;

import symbols from './symbols.js';

import GlobalContext from './GlobalContext.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();

function parseExtents(s) {
  const regex = /(?:\[([0-9]+)\s+([0-9]+)\s+([0-9]+)\s+([0-9]+)\]|([0-9]+)\s+([0-9]+))\s*/g;
  const result = [];
  let match;
  while (match = regex.exec(s)) {
    if (match[1]) {
      const x1 = parseInt(match[1], 10);
      const y1 = parseInt(match[2], 10);
      const x2 = parseInt(match[3], 10);
      const y2 = parseInt(match[4], 10);
      result.push([x1, y1, x2, y2]);
    } else if (match[5]) {
      const x = parseInt(match[5], 10);
      const y = parseInt(match[6], 10);
      result.push([x, y, x, y]);
    }
  }
  return result;
}

class XRIFrame extends HTMLElement {
  constructor() {
    super();

    this.contentWindow = null;
    this.xrOffset = new XRRigidTransform();
    this._highlight = null;
    this._extents = [];
    this._loadDistance = Infinity;
    this._data = {};
  }
  async attributeChangedCallback(name, oldValue, newValue) {
    await GlobalContext.loadPromise;

    if (newValue !== oldValue) {
      if (name === 'src') {
        let url = this.getAttribute('src');

        if (url) {
          const parentWindow = window;
          const options = parentWindow[symbols.optionsSymbol];

          const baseUrl = _normalizeUrl(url, options.baseUrl);
          // url = _getProxyUrl(baseUrl);
          url = baseUrl;

          const parent = {};
          const top = parentWindow === parentWindow.top ? parent : {};
          const win = _makeWindow({
            url,
            baseUrl,
            args: options.args,
            xrTop: false,
            // dataPath: options.dataPath,
            replacements: options.replacements,
            parent,
            top,
            // hidden: this.d === 3,
            xrOffsetBuffer: this.xrOffset._buffer,
            datasetObject: this._data,
            onnavigate: (href) => {
              this.readyState = null;

              this.setAttribute('src', href);
            },
            onrequest(req) {
              window._postMessageUp(req);
            },
            onpointerlock(event) {
              window._postMessageUp({
                method: 'emit',
                type: 'pointerLock',
                event,
              });
            },
            onhapticpulse(event) {
              window._postMessageUp({
                method: 'emit',
                type: 'hapticPulse',
                event,
              });
            },
            onpaymentrequest(event) {
              if (window.listeners('paymentrequest').length > 0) {
                window.dispatchEvent(new CustomEvent('paymentrequest', {
                  detail: event,
                }));
              } else {
                window._postMessageUp({
                  method: 'emit',
                  type: 'paymentRequest',
                  event,
                });
              }
            },
            onxroffsetchange: event => {
              const {key, value} = event;
              if (key === 'position') {
                this.position = value;
                this.xrOffset._position.set(value);
                this.xrOffset.pushUpdate();
              } else if (key === 'orientation') {
                this.orientation = value;
                this.xrOffset._orientation.set(value);
                this.xrOffset.pushUpdate();
              } else if (key === 'scale') {
                this.scale = value;
                this.xrOffset._scale.set(value);
                this.xrOffset.pushUpdate();
              }
            },
            ondatasetchange: event => {
              const {key, value} = event;
              if (this._data[key] !== value) {
                this._data[key] = value;
                this.data = this._data;
                win.iframe.contentDocument.dataset.pushUpdate(key, value);
              }
            },
          });
          win.highlight = this._highlight;
          win.addEventListener('load', () => {
            this.dispatchEvent(new CustomEvent('load'));
          });
          win.addEventListener('message', m => {
            const {data} = m;
            this.dispatchEvent(new MessageEvent('message', {
              data,
            }));
          });
          this.contentWindow = win;
        }
      } else if (name === 'position') {
        let position = newValue.split(' ');
        if (position.length === 3) {
          position = position.map(s => parseFloat(s));
          if (position.every(n => isFinite(n))) {
            this.xrOffset._position.set(position);
            this.xrOffset.pushUpdate();
          }
        }
      } else if (name === 'orientation') {
        let orientation = newValue.split(' ');
        if (orientation.length === 4) {
          orientation = orientation.map(s => parseFloat(s));
          if (orientation.every(n => isFinite(n))) {
            this.xrOffset._orientation.set(orientation);
            this.xrOffset.pushUpdate();
          }
        }
      } else if (name === 'scale') {
        let scale = newValue.split(' ');
        if (scale.length === 3) {
          scale = scale.map(s => parseFloat(s));
          if (scale.every(n => isFinite(n))) {
            this.xrOffset._scale.set(scale);
            this.xrOffset.pushUpdate();
          }
        }
      } else if (name === 'highlight') {
        let highlight = newValue.split(' ');
        if (highlight.length === 4) {
          highlight = highlight.map(s => parseFloat(s));
          if (highlight.every(n => isFinite(n))) {
            this.highlight = highlight;
          }
        }
      } else if (name === 'extents') {
        this.extents = parseExtents(newValue);
      } else if (name === 'load-distance') {
        const loadDistance = parseFloat(newValue);
        if (isFinite(loadDistance)) {
          this.loadDistance = loadDistance;
        }
      } else if (name === 'data') {
        const newData = JSON.parse(newValue);
        for (const k in this._data) {
          if (!(k in newData)) {
            delete this._data[k];
            this.contentWindow && this.contentWindow.loaded && this.contentWindow.iframe.contentDocument.dataset.pushUpdate(k, undefined);
          }
        }
        for (const k in newData) {
          const v = newData[k];
          this._data[k] = v;
          this.contentWindow && this.contentWindow.loaded && this.contentWindow.iframe.contentDocument.dataset.pushUpdate(k, v);
        }
      }
    }
  }
  static get observedAttributes() {
    return [
      'src',
      'position',
      'orientation',
      'scale',
      'highlight',
      'extents',
      'load-distance',
      'data',
    ];
  }
  get src() {
    return this.getAttribute('src');
  }
  set src(src) {
    this.setAttribute('src', src);
  }

  get position() {
    const s = this.getAttribute('position');
    return s ? s.split(' ').map(s => parseFloat(s)) : [0, 0, 0];
  }
  set position(position) {
    if (!Array.isArray(position)) {
      position = Array.from(position);
    }
    if (position.length === 3 && position.every(n => isFinite(n))) {
      this.setAttribute('position', position.join(' '));
    }
  }

  get orientation() {
    const s = this.getAttribute('orientation');
    return s ? s.split(' ').map(s => parseFloat(s)) : [0, 0, 0, 1];
  }
  set orientation(orientation) {
    if (!Array.isArray(orientation)) {
      orientation = Array.from(orientation);
    }
    if (orientation.length === 4 && orientation.every(n => isFinite(n))) {
      this.setAttribute('orientation', orientation.join(' '));
    }
  }

  get scale() {
    const s = this.getAttribute('scale');
    return s ? s.split(' ').map(s => parseFloat(s)) : [1, 1, 1];
  }
  set scale(scale) {
    if (!Array.isArray(scale)) {
      scale = Array.from(scale);
    }
    if (scale.length === 3 && scale.every(n => isFinite(n))) {
      this.setAttribute('scale', scale.join(' '));
    }
  }

  get data() {
    const s = this.getAttribute('data');
    return s ? JSON.parse(s) : {};
  }
  set data(data) {
    this.setAttribute('data', JSON.stringify(data));
  }

  get worldOffset() {
    localMatrix
      .compose(localVector.fromArray(this.position), localQuaternion.fromArray(this.orientation), localVector2.fromArray(this.scale))
      .premultiply(getXrOffsetMatrix())
      .decompose(localVector, localQuaternion, localVector2);
    return {
      position: localVector.toArray(),
      orientation: localQuaternion.toArray(),
      scale: localVector2.toArray(),
    };
  }

  get name() {
    return this.getAttribute('name');
  }
  set name(name) {
    this.setAttribute('name', name);
  }

  get loaded() {
    return !!this.contentWindow && this.contentWindow.loaded;
  }
  set loaded(loaded) {}

  get highlight() {
    return !!this.contentWindow && this.contentWindow.highlight;
  }
  set highlight(highlight) {
    this._highlight = highlight;
    if (this.contentWindow) {
      this.contentWindow.highlight = highlight;
    }
  }

  get extents() {
    return this._extents;
  }
  set extents(extents) {
    this._extents = extents;
  }

  get loadDistance() {
    return this._loadDistance;
  }
  set loadDistance(loadDistance) {
    this._loadDistance = loadDistance;
  }

  get visible() {
    localVector
      .fromArray(GlobalContext.xrState.position)
      .applyMatrix4(
        localMatrix
          .copy(getXrOffsetMatrix())
          .getInverse(localMatrix)
      );
    const {extents, loadDistance} = this;
    if (extents.length > 0 && isFinite(loadDistance)) {
      return extents.some(([x1, y1, x2, y2]) => {
        x2++;
        y2++;
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        const sx = x2 - x1 + loadDistance * 2;
        const sy = y2 - y1 + loadDistance * 2;
        const minX = cx - sx/2;
        const minY = cy - sy/2;
        const maxX = cx + sx/2;
        const maxY = cy + sy/2;
        return localVector.x >= minX && localVector.z >= minY && localVector.x < maxX && localVector.z < maxY;
      });
    } else {
      return true;
    }
  }

  postMessage(m, transfers) {
    this.contentWindow.postMessage(m, transfers);
  }
  destroy() {
    this.contentWindow.destroy();
  }
}
customElements.define('xr-iframe', XRIFrame);
XRIFrame.parseExtents = parseExtents;

export default XRIFrame;
