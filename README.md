<h1 align="center">Exokit Web</h1>
<p align="center"><a href="https://web.exokit.org" target="_blank"><img width="300" height="300" alt="Exokit" src="assets/icon.png"/></a></p>
<p align="center"><b>:dark_sunglasses: Meta WebXR engine for web browsers</b></p>

<p align="center">
  <a href="https://github.com/exokitxr/exokit/releases"><img src="https://img.shields.io/github/downloads/exokitxr/exokit/total.svg"></a>
  <a href="https://www.npmjs.com/package/exokit"><img src="https://img.shields.io/npm/v/exokit.svg"></a>
  <a href="https://travis-ci.org/modulesio/exokit-windows"><img src="https://travis-ci.org/modulesio/exokit-windows.svg?branch=master"></a>
  <a href="https://ci.appveyor.com/project/modulesio/exokit-windows"><img src="https://ci.appveyor.com/api/projects/status/32r7s2skrgm9ubva?svg=true"></a>  
  <a href="https://twitter.com/exokitxr"><img src="https://img.shields.io/twitter/follow/exokitxr.svg?style=social"></a>
</p>

<div align="center">
  <a href="https://web.exokit.org">Site</a>
  &mdash;
  <a href="https://docs.exokit.org/">Docs</a>
  &mdash;
  <a href="https://discordapp.com/invite/Apk6cZN">Discord</a>
  &mdash;
  <a href="https://twitter.com/exokitxr">Twitter</a>
  &mdash;
  <a href="http://eepurl.com/dFiLMz">Email List</a>
</div>

## Overview

### index.html
```
xrScene = document.createElement('xr-scene');
xrIframe.src = 'app.html';
```

### app.html
```
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

```
<script type=module src="https://web.exokit.org/ew.js"></script>
```

If your app is limited to your own site (same origin), you're done! Read the [API Documentation](https://docs.exokit.org/).

If your app acceses other sites (i.e. [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)), you'll need to set up a service worker and an API key.

## Cross-origin setup

Exokit Web suports accessing the full web with a Service Worker and proxy API, which requires a few more steps.

1. Get an API key

API keys are free. Get one in our Discord.

Note that API keys are tied to your origin.

1. Add Service worker

In the top-level directory of your app, serve a service worker file, `sw.js`:

```
importScripts('https://web.exokit.org/sw.js');
```

1. Add API key

Add your API key to your Exokit Web import:

```
<script type=module src="https://web.exokit.org/ew.js?key=YOUR_API_KEY_HERE"></script>
```

And that's it! Read the [API Documentation](https://docs.exokit.org/).