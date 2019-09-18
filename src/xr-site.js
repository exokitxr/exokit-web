import XRIFrame from './xr-iframe.js';

import GlobalContext from './GlobalContext.js';

import utils from './utils.js';
const {_makeNullPromise} = utils;

class XRSite extends HTMLElement {
  constructor() {
    super();
  }
  async connectedCallback() {
    console.log('connected 1', this);

    this.fakeXrDisplay = new FakeXRDisplay();
    this.fakeXrDisplay.pushUpdate();
    this.fakeXrDisplay.enable();

    this.session = null;
    this.width = this.fakeXrDisplay.width;
    this.height = this.fakeXrDisplay.height;
    this.customLayers = [];
    this.sessionPromise = _makeNullPromise();

    this.observer = new MutationObserver(async mutations => {
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

      this.session.layers = Array.from(this.childNodes)
        .filter(childNode => childNode instanceof XRIFrame)
        .concat(this.customLayers);
    });
    this.observer.observe(this, {
      childList: true,
    });

    const session = await navigator.xr.requestSession({
      exclusive: true,
    });
    this.session = session;
    this.sessionPromise.resolve(session);
  }
  disconnectedCallback() {
    console.log('disconnected', this);
  }
  async attributeChangedCallback(name, oldValue, newValue) {
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
  static get observedAttributes() {
    return [
      'camera-position',
      'camera-orientation',
      'camera-scale',
    ];
  }
  requestSession() {
    return this.sessionPromise;
  }
  addLayer(layer) {
    this.customLayers.push(layer);
  }
}
customElements.define('xr-site', XRSite);

export default XRSite;
