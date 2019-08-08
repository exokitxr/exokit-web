// const {EventEmitter} = require('events');
import history from '../modules/history.js';

class History extends EventTarget {
  constructor(u) {
    super();

    this._history = history.createMemoryHistory({
      initialEntries: [u],
    });
    this._history.listen((location, action) => {
      if (action === 'POP') {
        const {pathname, search, hash, state} = location;
        this.emit('popstate', url.format({
          pathname,
          search,
          hash,
        }), state);
      }
    });
  }
  back(n) {
    this._history.goBack(n);
  }
  forward(n) {
    this._history.goForward(n);
  }
  go(n) {
    this._history.go(n);
  }
  pushState(state, title, url) {
    this._history.push(url, state);
  }
  replaceState(state, title, url) {
    this._history.replace(url, state);
  }
  get length() {
    return this._history.length;
  }
  set length(length) {}
  get state() {
    return this._history.location.state;
  }
  set state(state) {}
}
export default History;
