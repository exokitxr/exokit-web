// importScripts('worker-bootstrap.js');
// self.window = self;
// const THREE = require('three.js');

let canvas, renderer, context, scene, camera, cubeMesh;

function animate() {
  cubeMesh.rotation.x += 0.01;
  cubeMesh.rotation.y += 0.01;

  // console.log('worker render 1');
  renderer.render(scene, camera);
  // context.commit();
  // console.log('worker render 2');
}

const _onmessage = async m => {
  console.log('got message 1 1', m.data);

  self.initModule = m.data.initModule;
  self.args = m.data.args;
  self.parentPort = self;
  canvas = m.data.canvas;

  const [_, THREE] = await Promise.all([
    import('./src/WindowBase.js'),
    import('./three.module.js'),
  ]);

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    // alpha: true,
  });
  context = renderer.getContext();
  renderer.setPixelRatio(window.devicePixelRatio);
  scene = new THREE.Scene();
  // scene.background = new THREE.Color(0xFF0000);
  camera = new THREE.PerspectiveCamera();
  camera.position.z = 1;

  const ambientLight = new THREE.AmbientLight(0x808080);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 4);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  cubeMesh = (() => {
    const geometry = new THREE.BoxBufferGeometry(0.1, 0.1, 0.1);
    const material = new THREE.MeshPhongMaterial({
      color: 0xab47bc,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.order = 'YXZ';
    mesh.frustumCulled = false;
    return mesh;
  })();
  scene.add(cubeMesh);

  console.log('got message 1 2');

  self.postMessage({
    ready: true,
  });

  self.removeEventListener('message', _onmessage);
  self.addEventListener('message', _onmessage2);
};
self.addEventListener('message', _onmessage);

const _onmessage2 = m => {
  const {viewMatrices, projectionMatrices} = m.data;
  // console.log('render message');
  animate();
  const imageBitmap = canvas.transferToImageBitmap();
  self.postMessage({
    imageBitmap,
  }, [imageBitmap]);
};
