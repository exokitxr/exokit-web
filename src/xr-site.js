import XRIFrame from './xr-iframe.js';

import GlobalContext from './GlobalContext.js';

import utils from './utils.js';
const {_makeNullPromise} = utils;

class XRSite extends HTMLElement {
  async connectedCallback() {
    // console.log('connected', this);

    this.session = null;
    this.customLayers = [];
    this.sessionPromise = _makeNullPromise();

    this.fakeXrDisplay = new FakeXRDisplay();
    this.fakeXrDisplay.enable();

    const _collectLayers = () => Array.from(this.childNodes)
      .filter(childNode => childNode instanceof XRIFrame)
      .concat(this.customLayers);
    new MutationObserver(async mutations => {
      await GlobalContext.loadPromise;

      for (let i = 0; i < mutations.length; i++) {
        const {removedNodes} = mutations[i];

        for (let j = 0; j < removedNodes.length; j++) {
          const removedNode = removedNodes[j];

          if (removedNode instanceof XRIFrame) {
            const xrIframe = removedNode;
            xrIframe.destroy();
          }
        }
      }

      this.session.layers = _collectLayers();
    }).observe(this, {
      childList: true,
    });

    const session = await navigator.xr.requestSession({
      exclusive: true,
    });
    session.layers = _collectLayers();
    this.session = session;
    this.sessionPromise.resolve(session);
  }
  /* disconnectedCallback() {
    console.log('disconnected', this);
  } */
  async attributeChangedCallback(name, oldValue, newValue) {
    if (!GlobalContext.xrState.isPresentingReal[0]) {
      await GlobalContext.loadPromise;

      if (name === 'camera-position') {
        let position = newValue.split(' ');
        if (position.length === 3) {
          position = position.map(s => parseFloat(s));
          if (position.every(n => isFinite(n))) {
            this.fakeXrDisplay.position.fromArray(position);
            this.fakeXrDisplay.pushUpdate();
          }
        }
      } else if (name === 'camera-orientation') {
        let orientation = newValue.split(' ');
        if (orientation.length === 4) {
          orientation = orientation.map(s => parseFloat(s));
          if (orientation.every(n => isFinite(n))) {
            this.fakeXrDisplay.quaternion.fromArray(orientation);
            this.fakeXrDisplay.pushUpdate();
          }
        }
      } else if (name === 'camera-scale') {
        let scale = newValue.split(' ');
        if (scale.length === 3) {
          scale = scale.map(s => parseFloat(s));
          if (scale.every(n => isFinite(n))) {
            this.fakeXrDisplay.scale.fromArray(scale);
            this.fakeXrDisplay.pushUpdate();
          }
        }
      }
    }
  }
  static get observedAttributes() {
    return [
      'camera-position',
      'camera-orientation',
      'camera-scale',
    ];
  }
  get cameraPosition() {
    const s = this.getAttribute('camera-position');
    return s ? s.split(' ').map(s => parseFloat(s)) : [0, 0, 0];
  }
  set cameraPosition(cameraPosition) {
    if (!Array.isArray(cameraPosition)) {
      cameraPosition = Array.from(cameraPosition);
    }
    if (cameraPosition.length === 3 && cameraPosition.every(n => isFinite(n))) {
      this.setAttribute('camera-position', cameraPosition.join(' '));
    }
  }
  get cameraOrientation() {
    const s = this.getAttribute('cameraOrientation');
    return s ? s.split(' ').map(s => parseFloat(s)) : [0, 0, 0, 1];
  }
  set cameraOrientation(cameraOrientation) {
    if (!Array.isArray(cameraOrientation)) {
      cameraOrientation = Array.from(cameraOrientation);
    }
    if (cameraOrientation.length === 4 && cameraOrientation.every(n => isFinite(n))) {
      this.setAttribute('camera-orientation', cameraOrientation.join(' '));
    }
  }
  get cameraScale() {
    const s = this.getAttribute('camera-scale');
    return s ? s.split(' ').map(s => parseFloat(s)) : [1, 1, 1];
  }
  set cameraScale(cameraScale) {
    if (!Array.isArray(cameraScale)) {
      cameraScale = Array.from(cameraScale);
    }
    if (cameraScale.length === 3 && cameraScale.every(n => isFinite(n))) {
      this.setAttribute('camera-scale', cameraScale.join(' '));
    }
  }
  get viewMatrix() {
    return this.fakeXrDisplay.viewMatrix;
  }
  get projectionMatrix() {
    return this.fakeXrDisplay.projectionMatrix;
  }
  get width() {
    return this.fakeXrDisplay.width;
  }
  get height() {
    return this.fakeXrDisplay.height;
  }
  get layers() {
    return this.customLayers;
  }
  set layers(layers) {
    this.customLayers = layers;
  }
  requestSession() {
    return this.sessionPromise;
  }
}
customElements.define('xr-site', XRSite);

export default XRSite;
