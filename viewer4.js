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
// LIGHTING
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
// DEBUG OBJECT
//////////////////////////////
const debugMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.3),
  new THREE.MeshStandardMaterial({ color: 0xffff00 })
);
scene.add(debugMesh);

//////////////////////////////
// DATA STRUCTURE
//////////////////////////////
// channel -> isoValueString -> meshes[]
const channelMeshes = {};

//////////////////////////////
// LOADER
//////////////////////////////
const loader = new GLTFLoader();

loader.load(
  "models/doublegyroid.glb",

  //////////////////////////////////
  // SUCCESS
  //////////////////////////////////
  (gltf) => {
    const model = gltf.scene;

    const CHANNEL_COLORS = [
      0xff0000,
      0x00ffff,
      0xffff00
    ];

    //////////////////////////////////
    // PARSE MESHES
    //////////////////////////////////
    model.traverse((child) => {
      if (!child.isMesh) return;

      const name = child.name || "";

      // 🔥 NEW PARSER
      const match = name.match(/iso_(.+)_channel_(\d+)/);

      if (!match) {
        console.warn("Skipping mesh (bad name):", name);
        return;
      }

      let isoStr = match[1];     // e.g. "0p50"
      const channel = parseInt(match[2]);

      // optional: convert "0p50" → "0.50"
      isoStr = isoStr.replace(/p/g, ".");

      if (!channelMeshes[channel]) channelMeshes[channel] = {};
      if (!channelMeshes[channel][isoStr]) channelMeshes[channel][isoStr] = [];

      const color = CHANNEL_COLORS[channel % CHANNEL_COLORS.length];

      child.material = new THREE.MeshStandardMaterial({
        color: color,
        transparent: false,
        opacity: 1.0,
        roughness: 0.2,
        metalness: 0.1,
        side: THREE.FrontSide,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.1,
      });

      child.geometry.computeVertexNormals();

      channelMeshes[channel][isoStr].push(child);
    });

    //////////////////////////////////
    // TOGGLES
    //////////////////////////////////
    function toggleChannel(channel) {
      if (!channelMeshes[channel]) return;

      Object.values(channelMeshes[channel]).forEach(meshList => {
        meshList.forEach(mesh => {
          mesh.visible = !mesh.visible;
        });
      });
    }

    function toggleIso(isoStr) {
      Object.values(channelMeshes).forEach(channel => {
        if (!channel[isoStr]) return;

        channel[isoStr].forEach(mesh => {
          mesh.visible = !mesh.visible;
        });
      });
    }

    //////////////////////////////////
    // UI
    //////////////////////////////////
    const ui = document.createElement("div");
    ui.style.position = "absolute";
    ui.style.top = "10px";
    ui.style.right = "10px";
    ui.style.zIndex = "1000";
    ui.style.display = "flex";
    ui.style.flexDirection = "column";
    ui.style.gap = "6px";

    document.body.appendChild(ui);

    // Channel buttons
    Object.keys(channelMeshes).forEach((channel) => {
      const btn = document.createElement("button");
      btn.innerText = `Channel ${channel}`;
      btn.onclick = () => toggleChannel(channel);
      ui.appendChild(btn);
    });

    // Iso buttons (sorted numerically)
    const isoSet = new Set();

    Object.values(channelMeshes).forEach(channel => {
      Object.keys(channel).forEach(i => isoSet.add(i));
    });

    [...isoSet]
      .sort((a, b) => parseFloat(a) - parseFloat(b))
      .forEach((iso) => {
        const btn = document.createElement("button");
        btn.innerText = `Iso ${iso}`;
        btn.onclick = () => toggleIso(iso);
        ui.appendChild(btn);
      });

    //////////////////////////////////
    // CENTER + SCALE
    //////////////////////////////////
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    model.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 8.0 / maxDim;
    model.scale.setScalar(scale);

    scene.add(model);

    //////////////////////////////////
    // CAMERA TARGET
    //////////////////////////////////
    const newBox = new THREE.Box3().setFromObject(model);
    const trueCenter = newBox.getCenter(new THREE.Vector3());
    controls.target.copy(trueCenter);
    controls.update();

    //////////////////////////////////
    // CLEANUP
    //////////////////////////////////
    loadingDiv.remove();
    scene.remove(debugMesh);

    console.log("Model loaded with iso-value parsing");
  },

  (xhr) => {
    if (xhr.total) {
      const percent = (xhr.loaded / xhr.total) * 100;
      loadingDiv.innerText = `Loading... ${percent.toFixed(1)}%`;
    }
  },

  (error) => {
    console.error("GLB load error:", error);
    loadingDiv.innerText = "Failed to load model";
  }
);

//////////////////////////////
// RESIZE
//////////////////////////////
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

//////////////////////////////
// LOOP
//////////////////////////////
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
