import * as THREE from "https://esm.sh/three@0.160.0";
import { OrbitControls } from "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

console.log("viewer.js is running");

//////////////////////////////
// LOADING OVERLAY
//////////////////////////////
const loadingDiv = document.createElement("div");
loadingDiv.innerText = "Loading...";
loadingDiv.style.position = "absolute";
loadingDiv.style.top = "10px";
loadingDiv.style.left = "10px";
loadingDiv.style.color = "white";
loadingDiv.style.background = "rgba(0,0,0,0.6)";
loadingDiv.style.padding = "6px 10px";
loadingDiv.style.fontFamily = "monospace";
document.body.appendChild(loadingDiv);

//////////////////////////////
// SCENE
//////////////////////////////
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

//////////////////////////////
// CAMERA
//////////////////////////////
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(3, 3, 3);

//////////////////////////////
// RENDERER
//////////////////////////////
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

//////////////////////////////
// CONTROLS
//////////////////////////////
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);
controls.update();

//////////////////////////////
// LIGHTING (ROBUST SETUP)
//////////////////////////////
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight1.position.set(5, 5, 5);
scene.add(dirLight1);

const dirLight2 = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight2.position.set(-5, -3, -5);
scene.add(dirLight2);

const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
scene.add(hemi);

//////////////////////////////
// DEBUG OBJECT (always visible)
// Remove later if you want
//////////////////////////////
const debugMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.3),
  new THREE.MeshStandardMaterial({ color: 0xffff00 })
);
scene.add(debugMesh);

//////////////////////////////
// GLTF LOADER
//////////////////////////////
const channelMeshes = [[], [], []];

const loader = new GLTFLoader();

loader.load(
  "models/doublegyroid.glb",

  //////////////////////////////////
  // SUCCESS
  //////////////////////////////////
  (gltf) => {
    const model = gltf.scene;

    const CHANNEL_COLORS = [
      0xff0000, // red
      0x00ffff, // cyan
      0xffff00  // yellow
    ];

    let meshIndex = 0;

    model.traverse((child) => {
      if (child.isMesh) {

        const color = CHANNEL_COLORS[meshIndex % CHANNEL_COLORS.length];

        child.material = new THREE.MeshStandardMaterial({
          color: color,
        
          // 🔥 make it fully opaque
          transparent: false,
          opacity: 1.0,
        
          // 🔥 better surface response
          roughness: 0.2,
          metalness: 0.1,
        
          // 🔥 ONLY render outer faces
          side: THREE.FrontSide,
        
          // optional: subtle glow
          emissive: new THREE.Color(color),
          emissiveIntensity: 0.1,
        });

        // 🔥 CRITICAL for correct lighting
        child.geometry.computeVertexNormals();

        const channel = meshIndex % 3;
        channelMeshes[channel]..push(child);
        meshIndex++;
      }
    });


    function toggleChannel(index) {
      channelMeshes[index].forEach(mesh => {
        mesh.visible = !mesh.visible;
      });
    }

    window.addEventListener("keydown", (e) => {
      if (e.key === "1") toggleChannel(0);
      if (e.key === "2") toggleChannel(1);
      if (e.key === "3") toggleChannel(2);
    });

    ["Red", "Cyan", "Yellow"].forEach((name, i) => {
      const btn = document.createElement("button");
      btn.innerText = name;
      btn.style.position = "absolute";
      btn.style.top = `${10 + i * 35}px`;
      btn.style.right = "10px";
    
      btn.onclick = () => toggleChannel(i);
    
      document.body.appendChild(btn);
    });
    
    //////////////////////////////////
    // CENTER + SCALE MODEL
    //////////////////////////////////
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    model.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 8.0/maxDim;
    model.scale.setScalar(scale);

    scene.add(model);

    //////////////////////////////////
    // FRAME CAMERA
    //////////////////////////////////
    camera.position.set(3, 3, 3);
    // better target
    const newBox = new THREE.Box3().setFromObject(model);
    const trueCenter = newBox.getCenter(new THREE.Vector3());
    controls.target.copy(trueCenter);
    controls.update();

    //////////////////////////////////
    // CLEANUP
    //////////////////////////////////
    loadingDiv.remove();
    scene.remove(debugMesh);

    console.log("Model loaded, centered, and visible");
  },

  //////////////////////////////////
  // PROGRESS
  //////////////////////////////////
  (xhr) => {
    if (xhr.total) {
      const percent = (xhr.loaded / xhr.total) * 100;
      loadingDiv.innerText = `Loading... ${percent.toFixed(1)}%`;
    }
  },

  //////////////////////////////////
  // ERROR
  //////////////////////////////////
  (error) => {
    console.error("GLB load error:", error);
    loadingDiv.innerText = "Failed to load model";
  }
);

//////////////////////////////
// RESIZE HANDLING
//////////////////////////////
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

//////////////////////////////
// ANIMATION LOOP
//////////////////////////////
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
