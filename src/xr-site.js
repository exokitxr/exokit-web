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
        const {addedNodes, removedNodes} = mutations[i];

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
  requestSession() {
    return this.sessionPromise;
  }
  addLayer(layer) {
    this.customLayers.push(layer);
  }
}
customElements.define('xr-site', XRSite);

export default XRSite;
