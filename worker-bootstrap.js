(() => {

/* self.process = {
  nextTick(fn) {
    Promise.resolve().then(fn);
  },
}; */
let path = {
  normalize(m) {
    return m;
  },
};

const coreModuleMappings = {
  events: 'node_modules/events-browserify/events.js',
  stream: 'node_modules/stream-browserify/index.js',
  path: 'node_modules/path-browserify/index.js',
  util: 'node_modules/util/util.js',
};
const _remap = m => coreModuleMappings[m] || m;

const cache = {};
self.require = function require(m) {
  m = _remap(m);
  m = path.normalize(m);

  if (m in cache) {
    return cache[m];
  } else {
    self.module = {
      exports: self.exports = {},
    };
    importScripts(m);
    const exports = cache[m] = self.module.exports;
    self.module = self.exports = null;
    return exports;
  }
};

path = require('path');

})();
