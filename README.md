<h1 align="center">Exokit Web</h1>
<p align="center"><b>Javascript WebXR metaverse engine</b></p>

<div align="center">
  <a href="https://web.exokit.org">Demo</a>
  &mdash;
  <a href="https://docs.exokit.org/">Docs</a>
  &mdash;
  <a href="https://discordapp.com/invite/Apk6cZN">Discord</a>
  &mdash;
  <a href="https://twitter.com/exokitxr">Twitter</a>
  &mdash;
  <a href="https://mailchi.mp/ee614096d73a/exokitweb">Email List</a>
  &mdash;
  <a href="https://twitter.com/exokitxr"><img src="https://img.shields.io/twitter/follow/exokitxr.svg?style=social"></a>
</div>

<a href="https://web.exokit.org/"><img alt="Mozilla Hubs inside of Cryptovoxels" target="_blank" src="https://user-images.githubusercontent.com/29695350/64731439-d7b2f500-d4a6-11e9-958b-a8337f42c6f5.gif" height="190" width="32%"></a>
<a href="https://web.exokit.org/"><img alt="XR Sites loaded together in shared grid" target="_blank" src="https://user-images.githubusercontent.com/29695350/64731446-daade580-d4a6-11e9-8d90-d3014d4b986b.gif" height="190" width="32%"></a>
<a href="https://web.exokit.org/"><img alt="Moving Solar System site above Moon Rider on grid with UI menu" target="_blank" src="https://user-images.githubusercontent.com/29695350/64731523-04670c80-d4a7-11e9-9021-1258a6e66b98.gif" height="190" width="32%"></a>

## Overview

*Exokit Web* is a Javascript library for composing multiple WebXR applications in a regular web page. It works in all web browsers, VR and AR headsets, with no dependencies.

### index.html
```js
import 'https://web.exokit.org/ew.js';

xrEngine = document.createElement('xr-engine');
xrEngine.src = 'app.html';
```

### app.html
```js
// Create WebXR session
session = await navigator.xr.requestSession('immersive-vr');

// Add Mozilla Hub
fooFrame = document.createElement('xr-iframe');
fooFrame.src = 'https://hubs.mozilla.com/VxGmqjU/fuchsia-winding-room?vr_entry_type=vr_now';
session.layers.push(fooFrame);

// Add A-Painter too
barFrame = document.createElement('xr-iframe');
barFrame.src = 'https://aframe.io/a-painter';
session.layers.push(barFrame);
```

See [`index.html`](index.html) for a full example.

## Start example server

```
npm install
npm start
```

## How to use

Import `ew.js` into your app:

```html
<script type=module src="https://web.exokit.org/ew.js"></script>
```

In the _top-level directory of your app_, create the file `sw.js` with these contents:

```js
importScripts('https://web.exokit.org/sw.js');
```

The [boilerplate code](https://github.com/exokitxr/exokit-web/blob/master/boilerplate/sw.js) has this set up already.

Finally, make sure you are serving your app over `https://` (or `localhost`), which is [required for Service Workers](https://developers.google.com/web/fundamentals/primers/service-workers/#you_need_https).

And that's it! Read the [API Documentation](https://docs.exokit.org/).

## Future directions

- Render HTML to texture
- Cross-app messaging
- Automatic multiplayer with WebRTC
- Immersive Web Payments API
