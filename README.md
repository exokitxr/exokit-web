<h1 align="center">Exokit Web</h1>
<p align="center"><b>A web engine for running highly performant WebXR experiences inside of existing browsers.</b></p>

<div align="center">
  <a href="https://web.exokit.org">Site</a>
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

## Examples

<a href="https://web.exokit.org/"><img alt="Exokit Web in Chrome browser" target="_blank" src="https://user-images.githubusercontent.com/29695350/64732206-32008580-d4a8-11e9-994c-a0e18c662b72.gif" height="190" width="32%"></a>
<a href="https://web.exokit.org/"><img alt="XR Sites loaded together in shared grid" target="_blank" src="https://user-images.githubusercontent.com/29695350/64731446-daade580-d4a6-11e9-8d90-d3014d4b986b.gif" height="190" width="32%"></a>
<a href="https://web.exokit.org/"><img alt="Playing Moon Rider in nature scene" target="_blank" src="https://user-images.githubusercontent.com/29695350/64731419-ccf86000-d4a6-11e9-9fdc-e5ca71af261f.gif" height="190" width="32%"></a>

<a href="https://web.exokit.org/"><img alt="Mozilla Hubs inside of Cryptovoxels" target="_blank" src="https://user-images.githubusercontent.com/29695350/64731439-d7b2f500-d4a6-11e9-958b-a8337f42c6f5.gif" height="190" width="32%"></a>
<a href="https://web.exokit.org/"><img alt="Manipulating A-Blast and Solar System sites loaded together" target="_blank" src="https://user-images.githubusercontent.com/29695350/64731510-fc0ed180-d4a6-11e9-87d5-b76c36c51aea.gif" height="190" width="32%"></a>
<a href="https://web.exokit.org/"><img alt="Moving Solar System site above Moon Rider on grid with UI menu" target="_blank" src="https://user-images.githubusercontent.com/29695350/64731523-04670c80-d4a7-11e9-9021-1258a6e66b98.gif" height="190" width="32%"></a>

*See more examples on [YouTube](https://www.youtube.com/c/exokit).*

----------------------------------

## Overview

### index.html
```js
xrScene = document.createElement('xr-scene');
xrIframe.src = 'app.html';
```

### app.html
```js
// put A-Painter into a Hub

fooFrame = document.createElement('xr-iframe');
fooFrame.src = 'https://hubs.mozilla.com/VxGmqjU/fuchsia-winding-room?vr_entry_type=vr_now';
session.layers.push(fooFrame);

barFrame = document.createElement('xr-iframe');
barFrame.src = 'https://aframe.io/a-painter';
session.layers.push(barFrame);
```

Exokit web is a Javascript library that gives you the powers of a 3D browser in your regular web app. Exokit web runs in any web browser with no dependency. It works with every WebXR engine, including A-Frame, Babylon.js, THREE.js, JanusWeb, Unity.

- Run multiple WebXR apps simultaneously
- Render HTML to texture
- In-world Web Payments API
- Cross-app messaging
- Automatic multiplayer with WebRTC

## How to use

Import `ew.js` into your app anywhere.

```html
<script type=module src="https://web.exokit.org/ew.js"></script>
```

If your app is limited to your own site (same origin), you're done! Read the [API Documentation](https://docs.exokit.org/).

If your app acceses other sites (i.e. [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)), you'll need to set up a service worker and an API key.

## Cross-origin setup

Exokit Web suports accessing the full web with a Service Worker and proxy API, which requires a few more steps.

### 1. Get an API key

API keys are free. Get one in our Discord.

Note that API keys are tied to your origin.

### 2. Add Service worker

In the top-level directory of your app, serve a service worker file, `sw.js`:

```js
importScripts('https://web.exokit.org/sw.js');
```

### 3. Add API key

Add your API key to your Exokit Web import:

```html
<script type=module src="https://web.exokit.org/ew.js?key=YOUR_API_KEY_HERE"></script>
```

And that's it! Read the [API Documentation](https://docs.exokit.org/).
