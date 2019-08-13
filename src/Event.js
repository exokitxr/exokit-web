import USKeyboardLayout from './USKeyboardLayout.js';
import GlobalContext from './GlobalContext.js';

const EventTarget = (EventTargetOld => class EventTarget extends EventTargetOld {
  constructor() {
    super();

    this._listeners = {};
  }

  listeners(event) {
    return this._listeners[event] || [];
  }
  addEventListener(event, listener, options) {
    if (typeof listener === 'function') {
      if (!this.listeners(event).includes(listener)) {
        let listeners = this._listeners[event];
        if (!listeners) {
          listeners = this._listeners[event] = [];
        }
        listeners.push(listener);
      }
    }

    return super.addEventListener(event, listener, options);
  }
  removeEventListener(event, listener) {
    if (typeof listener === 'function') {
      const listeners = this._listeners[event];
      if (listeners) {
        const index = listeners.indexOf(listener);
        listeners.splice(index, 1);
      }
    }

    return super.removeEventListener(event, listener);
  }
  dispatchEvent(event) {
    self.event = event;

    const _emit = (node, event) => {
      try {
        EventTargetOld.prototype.dispatchEvent.call(node, event);
      } catch (err) {
        console.warn(err);
      }
    };
    const _recurse = (node, event) => {
      _emit(node, event);
      if (event.bubbles && node instanceof GlobalContext.Document) {
        _emit(node.defaultView, event);
      }
      if (event.bubbles && !event.cancelBubble && node.parentNode) {
        _recurse(node.parentNode, event);
      }
    };
    _recurse(this, event);

    self.event = null;
  }
})(self.EventTarget);

class KeyboardEvent extends Event {
  constructor(type, init = {}) {
    init.bubbles = true;
    init.cancelable = true;

    const findKeySpecByKeyCode = keyCode => {
      for (const k in USKeyboardLayout) {
        const keySpec = USKeyboardLayout[k];
        if (keySpec.keyCode === keyCode) {
          return keySpec;
        }
      }
      return null;
    };
    if (init.key === undefined || init.code === undefined) {
      const keySpec = findKeySpecByKeyCode(init.keyCode);
      if (keySpec) {
        init.key = keySpec.key;
        init.code = /^[a-z]$/i.test(keySpec.key) ? ('Key' + keySpec.key.toUpperCase()) : keySpec.key;
      }
    }

    super(type, init);

    KeyboardEvent.prototype.init.call(this, init);
  }

  init(init) {
    this.key = init.key !== undefined ? init.key : '';
    this.code = init.code !== undefined ? init.code : '';
    this.location = init.location !== undefined ? init.location : 0;
    this.ctrlKey = init.ctrlKey !== undefined ? init.ctrlKey : false;
    this.shiftKey = init.shiftKey !== undefined ? init.shiftKey : false;
    this.altKey = init.altKey !== undefined ? init.altKey : false;
    this.metaKey = init.metaKey !== undefined ? init.metaKey : false;
    this.repeat = init.repeat !== undefined ? init.repeat : false;
    this.isComposing = init.isComposing !== undefined ? init.isComposing : false;
    this.charCode = init.charCode !== undefined ? init.charCode : 0;
    this.keyCode = init.keyCode !== undefined ? init.keyCode : 0;
    this.which = init.which !== undefined ? init.which : 0;
  }

  initKeyboardEvent(type, canBubble, cancelable, view, charCode, keyCode, location, modifiersList, repeat) {
    this.type = type;

    const modifiers = modifiers.split(/\s/);
    const ctrlKey = modifiers.includes('Control') || modifiers.includes('AltGraph');
    const altKey = modifiers.includes('Alt') || modifiers.includes('AltGraph');
    const metaKey = modifiers.includes('Meta');

    this.init({
      charCode,
      keyCode,
      ctrlKey,
      altKey,
      metaKey,
      repeat,
    });
  }
}

class MouseEvent extends Event {
  constructor(type, init = {}) {
    init.bubbles = true;
    init.cancelable = true;
    super(type, init);

    MouseEvent.prototype.init.call(this, init);
  }

  init(init = {}) {
    this.clientX = init.clientX !== undefined ? init.clientX : 0;
    this.clientY = init.clientY !== undefined ? init.clientY : 0;
    this.pageX = init.pageX !== undefined ? init.pageX : 0;
    this.pageY = init.pageY !== undefined ? init.pageY : 0;
    this.offsetX = init.offsetX !== undefined ? init.offsetX : 0;
    this.offsetY = init.offsetY !== undefined ? init.offsetY : 0;
    this.screenX = init.offsetX !== undefined ? init.screenX : 0;
    this.screenY = init.offsetY !== undefined ? init.screenY : 0;
    this.movementX = init.movementX !== undefined ? init.movementX : 0;
    this.movementY = init.movementY !== undefined ? init.movementY : 0;
    this.ctrlKey = init.ctrlKey !== undefined ? init.ctrlKey : false;
    this.shiftKey = init.shiftKey !== undefined ? init.shiftKey : false;
    this.altKey = init.altKey !== undefined ? init.altKey : false;
    this.metaKey = init.metaKey !== undefined ? init.metaKey : false;
    this.button = init.button !== undefined ? init.button : 0;
    this.relatedTarget = init.relatedTarget !== undefined ? init.relatedTarget : null;
    this.region = init.region !== undefined ? init.region : null;
  }

  initMouseEvent(type, canBubble, cancelable, view, detail, screenX, screenY, clientX, clientY, ctrlKey, altKey, shiftKey, metaKey, button, relatedTarget) {
    this.type = type;

    this.init({
      screenX,
      screenY,
      clientX,
      clientY,
      ctrlKey,
      altKey,
      shiftKey,
      metaKey,
      button,
      relatedTarget,
    });
  }
}

class WheelEvent extends MouseEvent {
  constructor(type, init = {}) {
    init.bubbles = true;
    init.cancelable = true;
    super(type, init);

    this.deltaX = init.deltaX !== undefined ? init.deltaX : 0;
    this.deltaY = init.deltaY !== undefined ? init.deltaY : 0;
    this.deltaZ = init.deltaZ !== undefined ? init.deltaZ : 0;
    this.deltaMode = init.deltaMode !== undefined ? init.deltaMode : 0;
  }
}
WheelEvent.DOM_DELTA_PIXEL = 0x00;
WheelEvent.DOM_DELTA_LINE = 0x01;
WheelEvent.DOM_DELTA_PAGE = 0x02;

class DragEvent extends MouseEvent {
  constructor(type, init = {}) {
    super(type, init);

    DragEvent.prototype.init.call(this, init);
  }

  init(init = {}) {
    this.dataTransfer = init.dataTransfer !== undefined ? init.dataTransfer : null;
  }
}

class SpatialEvent extends Event {
  constructor(type, init = {}) {
    super(type);

    if (init.detail) {
      for (const k in init.detail) {
        this[k] = init.detail[k];
      }
    }
  }
}

export {
  EventTarget,
  KeyboardEvent,
  MouseEvent,
  WheelEvent,
  DragEvent,
  SpatialEvent,
};
