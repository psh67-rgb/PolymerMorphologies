<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>3D Polymer Viewer</title>
  <style>
    body { margin: 0; overflow: hidden; }
    #loading {
      position: absolute;
      top: 10px;
      left: 10px;
      color: white;
      font-family: sans-serif;
      background: rgba(0,0,0,0.5);
      padding: 6px 10px;
      border-radius: 4px;
    }
  </style>
</head>
<body>

<div id="loading">Loading...</div>

<script type="module">
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

// 🔹 Get model ID from URL
const params = new URLSearchParams(window.location.search);
const id = params.get("id") || "000001";  // default fallback

// 🔹 CHANGE THIS to your storage bucket
const MODEL_BASE_URL = "https://github.com/psh67-rgb/PolymerMorphologies.git";
const modelUrl = `${MODEL_BASE_URL}${id}.glb`;

// 🔹 Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Camera
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(3, 3, 3);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 🔹 Lighting
const light1 = new THREE.DirectionalLight(0xffffff, 1);
light1.position.set(5, 5, 5);
scene.add(light1);

const light2 = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(light2);

// 🔹 Load model
const loader = new GLTFLoader();

loader.load(
  'models/884cylinders.glb',
  (gltf) => {
    const model = gltf.scene;
    scene.add(model);

    // Center + scale automatically
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();

    model.position.sub(center);
    camera.position.set(size, size, size);
    camera.lookAt(0, 0, 0);

    document.getElementById("loading").style.display = "none";
  },
  undefined,
  (error) => {
    document.getElementById("loading").innerText = "Failed to load model";
    console.error(error);
  }
);

// 🔹 Resize handling
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 🔹 Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

</script>

</body>
</html>
