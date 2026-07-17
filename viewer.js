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
  "/models/884cylinders.glb",
  (gltf) => {
    const model = gltf.scene;

    // 🔥 APPLY MATERIAL FIX HERE
    const CHANNEL_COLORS = [
      0xff4d4d,
      0x4dff88,
      0x4da6ff
    ];

    let meshIndex = 0;

    model.traverse((child) => {
      if (child.isMesh) {

        const color = CHANNEL_COLORS[meshIndex % CHANNEL_COLORS.length];

        child.material = new THREE.MeshStandardMaterial({
          color: color,

          transparent: true,
          opacity: 0.75,

          roughness: 0.35,
          metalness: 0.05,

          side: THREE.DoubleSide,
          depthWrite: true,
          depthTest: true,

          // optional but nice
          emissive: new THREE.Color(color),
          emissiveIntensity: 0.05,
        });

        meshIndex++;
      }
    });

    // 🔹 Add model AFTER modifying materials
    scene.add(model);

    // (keep your centering / camera code here if you have it)
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

