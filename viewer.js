import * as THREE from "https://esm.sh/three@0.160.0";
import { OrbitControls } from "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

console.log("viewer.js is running");

// Loading text (create via JS instead of HTML)
const loadingDiv = document.createElement("div");
loadingDiv.innerText = "Loading...";
loadingDiv.style.position = "absolute";
loadingDiv.style.top = "10px";
loadingDiv.style.left = "10px";
loadingDiv.style.color = "white";
loadingDiv.style.background = "rgba(0,0,0,0.5)";
loadingDiv.style.padding = "6px 10px";
document.body.appendChild(loadingDiv);

// Scene
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

// Lighting

// Ambient light (base visibility)
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

// Strong directional light
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

// Fill light (opposite side to remove harsh shadows)
const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
fillLight.position.set(-5, -3, -5);
scene.add(fillLight);

// Optional: hemisphere light for softer global illumination
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
scene.add(hemi);

const lightProbe = new THREE.HemisphereLight(0xffffff, 0x222222, 1);
scene.add(lightProbe);
// Loader
const loader = new GLTFLoader();

loader.load(
  "models/884cylinders.glb",
  (gltf) => {
    const model = gltf.scene;
    scene.add(model);

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();

    model.position.sub(center);
    camera.position.set(size, size, size);
    camera.lookAt(0, 0, 0);

    loadingDiv.style.display = "none";
  },
  undefined,
  (error) => {
    loadingDiv.innerText = "Failed to load model";
    console.error(error);
  }
);

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animate
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

