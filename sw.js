const redirects = new Map();
const permanentRedirects = {
  // 'https://assets-prod.reticulum.io/hubs/assets/js/vendor-64ef06ca9a87923873c0.js': './vendor-64ef06ca9a87923873c0.js',
};

self.addEventListener('message', e => {
  const {data} = e;
  const {method} = data;
  if (method === 'redirect') {
    const {src, dst} = data;
    redirects.set(src, dst);
  }
  e.ports[0].postMessage({});
});

const _rewriteUrlToProxy = u => {
  if (/^[a-z]+:\/\//.test(u) && !u.startsWith(self.location.origin) && !/^[a-z]+:\/\/[a-z0-9\-]+\.proxy\.exokit\.org(?:\/|$)/.test(u)) {
    const parsedUrl = new URL(u);
    parsedUrl.host = parsedUrl.host.replace(/-/g, '--');
    return 'https://' + parsedUrl.origin.replace(/^(https?):\/\//, '$1-').replace(/:([0-9]+)$/, '-$1').replace(/\./g, '-') + '.proxy.exokit.org' + parsedUrl.pathname + parsedUrl.search;
  } else {
    return u;
  }
};
const _rewriteUrlToRaw = u => {
  const o = new URL(u);
  const match = o.host.match(/^(.+)\.proxy\.exokit\.org$/);
  const raw = match[1];
  const match2 = raw.match(/^(https?-)(.+?)(-[0-9]+)?$/);
  o.protocol = match2[1].replace(/-/g, ':');
  o.host = match2[2].replace(/--/g, '=').replace(/-/g, '.').replace(/=/g, '-').replace(/\.\./g, '-') + (match2[3] ? match2[3].replace(/-/g, ':') : '');
  return o.href;
};
const _getBaseUrl = u => {
  if (!/^(?:[a-z]+:|\/)/.test(u)) {
    u = '/' + u;
  }
  u = u.replace(/(\/)[^\/]+$/, '$1');
  return u;
};
const _insertAfter = (htmlString, match, s) => {
  return htmlString.slice(0, match.index) + match[0] + s + htmlString.slice(match.index + match[0].length);
};
const _insertBefore = (htmlString, match, s) => {
  return htmlString.slice(0, match.index) + s + match[0] + htmlString.slice(match.index + match[0].length);
};
const _addHtmlBase = (htmlString, u) => {
  let match;
  if (match = htmlString.match(/<[\s]*head[\s>]/i)) {
    return _insertAfter(htmlString, match, `<base href="${encodeURI(u)}" target="_blank">`);
  } else if (match = htmlString.match(/<[\s]*body[\s>]/i)) {
    return _insertBefore(htmlString, match, `<head><base href="${encodeURI(u)}" target="_blank"></head>`);
  } else {
    console.warn('no head or body tag', htmlString, u, new Error().stack);
    return htmlString;
  }
};
const _proxyHtmlScripts = (htmlString, originalUrl) => htmlString.replace(/(src=["'])([^"']+)(["'])/g, (all, pre, src, post) => {
  if (/^[a-z]+:\/\//.test(src) && !src.startsWith(location.origin)) {
    return pre + location.origin + '/.p/' + src + post;
  } else {
    return all;
  }
});
const _removeHtmlManifest = htmlString => htmlString.replace(/<link\s+rel="?manifest"?[^>]*>/, '');
const _rewriteResText = (res, rewriteFn) => res.text()
  .then(text => new Response(rewriteFn(text) || null, {
    status: res.status,
    headers: res.headers,
  }));
const _rewriteRes = res => {
  const {url, originalUrl} = res;
  return _rewriteResExt(res.url, res.originalUrl, res.headers, res);
};
const _flattenWebVrEyeJs = jsString => jsString.replace(
  /\.getEyeParameters\("left"\).{0,100}\.set(?:DrawingBuffer)?Size\(2\*/g,
  all => all + '(new FakeXRDisplay().stereo?1:0.5)*'
);
const _rewriteResExt = (url, originalUrl, headers, res) => {
  if (originalUrl === 'https://aframe.io/releases/0.9.2/aframe.min.js') {
    return _rewriteResText(res, jsString => 'delete navigator.xr;' + _flattenWebVrEyeJs(jsString));
  } else if (/^https:\/\/assets-prod\.reticulum\.io\/hubs\/assets\/js\/hub-[a-zA-Z0-9]+\.js$/.test(originalUrl)) {
    return _rewriteResText(res, jsString => jsString.replace('window.top', 'window.self'));
  } else if (/^https:\/\/assets-prod\.reticulum\.io\/hubs\/assets\/js\/engine-[a-zA-Z0-9]+\.js$/.test(originalUrl)) {
    return _rewriteResText(res, jsString => 'delete navigator.xr;' + jsString.replace(
      /\.getEyeParameters\("left"\);[a-z]+=2\*/g,
      all => all + '(new FakeXRDisplay().stereo?1:0.5)*'
    ));
  } else if (originalUrl === 'https://https-moonrider-xyz.proxy.exokit.org/build/build.js') {
    return _rewriteResText(res, jsString => jsString.replace('getDistance:function(){var e=this.axis;', 'getDistance:function(){if (!this.axis)this.axis=[0,0,0];var e=this.axis;'));
  } else if (originalUrl === 'https://https-moonrider-xyz.proxy.exokit.org/vendor/aframe-master.min.js') {
    return _rewriteResText(res, jsString => 'delete navigator.xr;' + _flattenWebVrEyeJs(jsString));
  } else if (originalUrl === 'https://js.cryptovoxels.com/client.js') {
    return _rewriteResText(res, jsString => {
      const result = jsString
        .replace(/https:\/\/www\.cryptovoxels\.com\//g, '/')
        .replace('n._attached&&n.getEngine().enableVR()', 'n.getEngine().enableVR()')
        .replace(/this\._rigCameras\[0\]\.viewport=new ([a-zA-Z0-9\.]+)\(0\,0\,\.5\,1\)/g, 'this._rigCameras[0].viewport=new $1(0,0,new FakeXRDisplay().stereo?0.5:1,1)')
        .replace(/this\._rigCameras\[1\]\.viewport=new ([a-zA-Z0-9\.]+)\(\.5\,0\,\.5\,1\)/g, 'this._rigCameras[1].viewport=new $1(new FakeXRDisplay().stereo?0.5:0,0,new FakeXRDisplay().stereo?0.5:0,1)')
      return result;
    });
 } else if (originalUrl === 'https://preview.babylonjs.com/babylon.js') {
    return _rewriteResText(res, jsString => {
      const result = jsString
        .replace('s._attached&&s.getEngine().enableVR()', 's.getEngine().enableVR()')
        .replace(/e\._rigCameras\[0\]\.viewport=new ([a-zA-Z0-9\.]+)\(0\,0\,\.5\,1\)/g, 'e._rigCameras[0].viewport=new $1(0,0,new FakeXRDisplay().stereo?0.5:1,1)')
        .replace(/e\._rigCameras\[1\]\.viewport=new ([a-zA-Z0-9\.]+)\(\.5\,0\,\.5\,1\)/g, 'e._rigCameras[1].viewport=new $1(new FakeXRDisplay().stereo?0.5:0,0,new FakeXRDisplay().stereo?0.5:0,1)')
        .replace('this._webVRpresenting=e.isPresenting', 'this._webVRpresenting=false')
        .replace('this._btnVR.addEventListener("click",function(){i.isInVRMode?i.exitVR():i.enterVR()})', 'this._btnVR.addEventListener("click",function(){i.isInVRMode?i.exitVR():i.enterVR()});setTimeout(() => {i.enterVR()})');
      return result;
    });
  } else if (/aframe(?:-master)?\.min\.js/.test(originalUrl)) {
    return _rewriteResText(res, _flattenWebVrEyeJs);
  } else if (originalUrl && /^text\/html(?:;|$)/.test(headers.get('Content-Type'))) {
    return _rewriteResText(res, htmlString => {
      htmlString = _addHtmlBase(htmlString, _getBaseUrl(url));
      htmlString = _proxyHtmlScripts(htmlString, originalUrl);
      htmlString = _removeHtmlManifest(htmlString);
      return htmlString;
    });
  } else if (originalUrl && /^application\/javascript(?:;|$)/.test(headers.get('Content-Type'))) {
    return res.blob()
      .then(blob => new Response(blob, {
        status: res.status,
        headers: res.headers,
      }));
  } else {
    return Promise.resolve(res);
  }
};
const _resolveFollowUrl = u => fetch(_rewriteUrlToProxy(u), {
  method: 'HEAD',
}).then(res => _rewriteUrlToRaw(res.url));

self.addEventListener('install', event => {
  // console.log('sw install');
  self.skipWaiting();

  /* event.waitUntil(
    caches.open(PRECACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
  ); */
});
self.addEventListener('activate', event => {
  // console.log('sw activate');
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  // console.log('got request', event.request.url);

  const permanentRedirect = permanentRedirects[event.request.url];
  if (permanentRedirect) {
    event.respondWith(
      fetch(permanentRedirect)
        .then(res => {
          res.originalUrl = event.request.url;
          return _rewriteRes(res);
        })
    );
    return;
  }

  if (event.request.method === 'HEAD' && event.request.url === event.request.referrer) {
    event.respondWith(new Response('', {
      headers: {
        'Content-Type': 'text/html',
        'Date': new Date().toUTCString(),
      },
    }));
  } else {
    let u = event.request.url;
    const dst = redirects.get(u);
    if (dst) {
      redirects.delete(event.request.url);

      const res = new Response(dst, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
      event.respondWith(_rewriteResExt(u, u, res.headers, res));
    } else {
      let match = u.match(/^[a-z]+:\/\/[a-zA-Z0-9\-\.:]+(.+)$/);
      if (match) {
        let match2;
        if (match2 = match[1].match(/^\/\.p\/(.+)$/)) {
          const originalUrl = match2[1];
          const permanentRedirect = permanentRedirects[originalUrl];
          if (permanentRedirect) {
            event.respondWith(
              fetch(permanentRedirect)
            );
          } else {
            const proxyUrl = _rewriteUrlToProxy(originalUrl);
            event.respondWith(
              fetch(proxyUrl).then(res => {
                res.originalUrl = originalUrl;
                return _rewriteRes(res);
              })
            );
          }
        } else if (match2 = match[1].match(/^\/.d\/(.+)$/)) {
          event.respondWith(fetch(match2[1]));
        } else if (match2 = match[1].match(/^\/.f\/(.+)$/)) {
          event.respondWith(
            _resolveFollowUrl(match2[1])
              .then(u => new Response(u, {
                headers: {
                  'Content-Type': 'text/plain',
                },
              }))
          );
        } else {
          event.respondWith(
            fetch(event.request)
              .then(res => {
                if (res.type === 'opaque') {
                  const proxyUrl = _rewriteUrlToProxy(u);
                  return fetch(proxyUrl).then(res => {
                    res.originalUrl = u;
                    return _rewriteRes(res);
                  });
                } else {
                  res.originalUrl = u;
                  return _rewriteRes(res);
                }
              })
              .catch(err => {
                const proxyUrl = _rewriteUrlToProxy(u);
                return fetch(proxyUrl).then(res => {
                  res.originalUrl = u;
                  return _rewriteRes(res);
                });
              })
          );
        }
      } else {
        event.respondWith(new Response('invalid url', {
          status: 500,
        }));
      }
    }
  }
});
