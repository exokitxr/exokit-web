const exports = {};
const module = {exports};

var parcelRequire = function(e,r,t,n){var i,o="function"==typeof parcelRequire&&parcelRequire,u="function"==typeof require&&require;function f(t,n){if(!r[t]){if(!e[t]){var i="function"==typeof parcelRequire&&parcelRequire;if(!n&&i)return i(t,!0);if(o)return o(t,!0);if(u&&"string"==typeof t)return u(t);var c=new Error("Cannot find module '"+t+"'");throw c.code="MODULE_NOT_FOUND",c}p.resolve=function(r){return e[t][1][r]||r},p.cache={};var l=r[t]=new f.Module(t);e[t][0].call(l.exports,p,l,l.exports,this)}return r[t].exports;function p(e){return f(p.resolve(e))}}f.isParcelRequire=!0,f.Module=function(e){this.id=e,this.bundle=f,this.exports={}},f.modules=e,f.cache=r,f.parent=o,f.register=function(r,t){e[r]=[function(e,r){r.exports=t},{}]};for(var c=0;c<t.length;c++)try{f(t[c])}catch(e){i||(i=e)}if(t.length){var l=f(t[t.length-1]);"object"==typeof exports&&"undefined"!=typeof module?module.exports=l:"function"==typeof define&&define.amd?define(function(){return l}):n&&(this[n]=l)}if(parcelRequire=f,i)throw i;return f}({"SI0m":[function(require,module,exports) {

var t,e,n=module.exports={};function r(){throw new Error("setTimeout has not been defined")}function o(){throw new Error("clearTimeout has not been defined")}function i(e){if(t===setTimeout)return setTimeout(e,0);if((t===r||!t)&&setTimeout)return t=setTimeout,setTimeout(e,0);try{return t(e,0)}catch(n){try{return t.call(null,e,0)}catch(n){return t.call(this,e,0)}}}function u(t){if(e===clearTimeout)return clearTimeout(t);if((e===o||!e)&&clearTimeout)return e=clearTimeout,clearTimeout(t);try{return e(t)}catch(n){try{return e.call(null,t)}catch(n){return e.call(this,t)}}}!function(){try{t="function"==typeof setTimeout?setTimeout:r}catch(n){t=r}try{e="function"==typeof clearTimeout?clearTimeout:o}catch(n){e=o}}();var c,s=[],l=!1,a=-1;function f(){l&&c&&(l=!1,c.length?s=c.concat(s):a=-1,s.length&&h())}function h(){if(!l){var t=i(f);l=!0;for(var e=s.length;e;){for(c=s,s=[];++a<e;)c&&c[a].run();a=-1,e=s.length}c=null,l=!1,u(t)}}function m(t,e){this.fun=t,this.array=e}function p(){}n.nextTick=function(t){var e=new Array(arguments.length-1);if(arguments.length>1)for(var n=1;n<arguments.length;n++)e[n-1]=arguments[n];s.push(new m(t,e)),1!==s.length||l||i(h)},m.prototype.run=function(){this.fun.apply(null,this.array)},n.title="browser",n.env={},n.argv=[],n.version="",n.versions={},n.on=p,n.addListener=p,n.once=p,n.off=p,n.removeListener=p,n.removeAllListeners=p,n.emit=p,n.prependListener=p,n.prependOnceListener=p,n.listeners=function(t){return[]},n.binding=function(t){throw new Error("process.binding is not supported")},n.cwd=function(){return"/"},n.chdir=function(t){throw new Error("process.chdir is not supported")},n.umask=function(){return 0};
},{}],"Bvf5":[function(require,module,exports) {
var process = require("process");
var e=require("process");e.EventEmitter||(e.EventEmitter=function(){});var t=exports.EventEmitter=e.EventEmitter,s="function"==typeof Array.isArray?Array.isArray:function(e){return"[object Array]"===Object.prototype.toString.call(e)},n=10;t.prototype.setMaxListeners=function(e){this._events||(this._events={}),this._events.maxListeners=e},t.prototype.emit=function(e){if("error"===e&&(!this._events||!this._events.error||s(this._events.error)&&!this._events.error.length))throw arguments[1]instanceof Error?arguments[1]:new Error("Uncaught, unspecified 'error' event.");if(!this._events)return!1;var t=this._events[e];if(!t)return!1;if("function"==typeof t){switch(arguments.length){case 1:t.call(this);break;case 2:t.call(this,arguments[1]);break;case 3:t.call(this,arguments[1],arguments[2]);break;default:var n=Array.prototype.slice.call(arguments,1);t.apply(this,n)}return!0}if(s(t)){n=Array.prototype.slice.call(arguments,1);for(var r=t.slice(),i=0,o=r.length;i<o;i++)r[i].apply(this,n);return!0}return!1},t.prototype.addListener=function(e,t){if("function"!=typeof t)throw new Error("addListener only takes instances of Function");if(this._events||(this._events={}),this.emit("newListener",e,t),this._events[e])if(s(this._events[e])){var r;if(!this._events[e].warned)(r=void 0!==this._events.maxListeners?this._events.maxListeners:n)&&r>0&&this._events[e].length>r&&(this._events[e].warned=!0,console.error("(node) warning: possible EventEmitter memory leak detected. %d listeners added. Use emitter.setMaxListeners() to increase limit.",this._events[e].length),console.trace());this._events[e].push(t)}else this._events[e]=[this._events[e],t];else this._events[e]=t;return this},t.prototype.on=t.prototype.addListener,t.prototype.once=function(e,t){var s=this;return s.on(e,function n(){s.removeListener(e,n),t.apply(this,arguments)}),this},t.prototype.removeListener=function(e,t){if("function"!=typeof t)throw new Error("removeListener only takes instances of Function");if(!this._events||!this._events[e])return this;var n=this._events[e];if(s(n)){var r=n.indexOf(t);if(r<0)return this;n.splice(r,1),0==n.length&&delete this._events[e]}else this._events[e]===t&&delete this._events[e];return this},t.prototype.removeAllListeners=function(e){return e&&this._events&&this._events[e]&&(this._events[e]=null),this},t.prototype.listeners=function(e){return this._events||(this._events={}),this._events[e]||(this._events[e]=[]),s(this._events[e])||(this._events[e]=[this._events[e]]),this._events[e]};
},{"process":"SI0m"}]},{},["Bvf5"], null)

export default module.exports;
