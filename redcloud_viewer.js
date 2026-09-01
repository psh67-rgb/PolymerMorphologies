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

scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.8));

//////////////////////////////
// DATA + STATE
//////////////////////////////
const channelMeshes = {};
let currentIso = null;

const isoButtons = {};
const channelButtons = {};

//////////////////////////////
// BUTTON STYLE
//////////////////////////////
function styleButton(button, active) {
  button.style.background = active ? "#444" : "#888";
  button.style.color = "white";
  button.style.border = "none";
  button.style.padding = "6px 10px";
  button.style.cursor = "pointer";
}

//////////////////////////////
// LOADER
//////////////////////////////
const loader = new GLTFLoader();

loader.load(
  "https://redcloud2.cac.cornell.edu:8443/glb_files/double_gyroid_5.glb",

  (gltf) => {
    const model = gltf.scene;

    const CHANNEL_COLORS = [0xff0000, 0x00ffff, 0xffff00];

    //////////////////////////////////
    // PARSE
    //////////////////////////////////
    model.traverse((child) => {
      if (!child.isMesh) return;

      const match = child.name.match(/iso_(.+)_channel_(\d+)/);
      if (!match) return;

      let isoStr = match[1].replace(/p/g, ".");
      const channel = parseInt(match[2]);

      if (!channelMeshes[channel]) channelMeshes[channel] = {};
      if (!channelMeshes[channel][isoStr]) channelMeshes[channel][isoStr] = [];

      const color = CHANNEL_COLORS[channel % CHANNEL_COLORS.length];

      child.material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.2,
        metalness: 0.1,
        side: THREE.FrontSide,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.1,
      });

      child.geometry.computeVertexNormals();
      child.visible = false;

      channelMeshes[channel][isoStr].push(child);
    });

    //////////////////////////////////
    // ISO CONTROL (EXCLUSIVE)
    //////////////////////////////////
    function setIso(isoStr) {
      currentIso = isoStr;

      Object.values(channelMeshes).forEach(channel => {
        Object.entries(channel).forEach(([iso, meshes]) => {
          meshes.forEach(mesh => {
            mesh.visible = (iso === isoStr);
          });
        });
      });

      // update iso buttons
      Object.entries(isoButtons).forEach(([iso, btn]) => {
        styleButton(btn, iso === isoStr);
      });

      // reset channel buttons (all visible)
      Object.entries(channelButtons).forEach(([channel, btn]) => {
        styleButton(btn, true);
      });
    }

    //////////////////////////////////
    // CHANNEL TOGGLE
    //////////////////////////////////
    function toggleChannel(channel) {
      if (!currentIso) return;
      if (!channelMeshes[channel]) return;

      const meshes = channelMeshes[channel][currentIso];
      if (!meshes) return;

      const newVisible = !meshes[0].visible;

      meshes.forEach(mesh => {
        mesh.visible = newVisible;
      });

      styleButton(channelButtons[channel], newVisible);
    }

    //////////////////////////////////
    // UI
    //////////////////////////////////
    const ui = document.createElement("div");
    ui.style.position = "absolute";
    ui.style.top = "10px";
    ui.style.right = "10px";
    ui.style.display = "flex";
    ui.style.flexDirection = "column";
    ui.style.gap = "6px";
    document.body.appendChild(ui);

    // Collect iso values
    const isoSet = new Set();
    Object.values(channelMeshes).forEach(channel => {
      Object.keys(channel).forEach(i => isoSet.add(i));
    });

    const isoList = [...isoSet].sort(
      (a, b) => parseFloat(a) - parseFloat(b)
    );

    // ISO buttons
    isoList.forEach((iso) => {
      const btn = document.createElement("button");
      btn.innerText = `Iso ${iso}`;
      btn.onclick = () => setIso(iso);

      styleButton(btn, false);

      isoButtons[iso] = btn;
      ui.appendChild(btn);
    });

    // Channel buttons
    Object.keys(channelMeshes).forEach((channel) => {
      const btn = document.createElement("button");
      btn.innerText = `Channel ${channel}`;
      btn.onclick = () => toggleChannel(channel);

      styleButton(btn, true);

      channelButtons[channel] = btn;
      ui.appendChild(btn);
    });

    //////////////////////////////////
    // DEFAULT ISO
    //////////////////////////////////
    if (isoList.length > 0) {
      setIso(isoList[0]);
    }

    //////////////////////////////////
    // CENTER + SCALE
    //////////////////////////////////
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // create pivot
    const pivot = new THREE.Group();
    scene.add(pivot);

    // compute scale
    const scale = 2.0 / Math.max(size.x, size.y, size.z);

    // scale the center offset too
    model.position.sub(center.multiplyScalar(scale));

    // apply scale
    model.scale.setScalar(scale);

    // attach to pivot
    pivot.add(model);

    // orbit center
    controls.target.set(0, 0, 0);
    controls.update();

    loadingDiv.remove();

    console.log("Model loaded with UI state control");
  },

  undefined,

  (error) => {
    console.error("Error loading GLB:", error);
    loadingDiv.innerText = "Error loading model";
  }
);

    //////////////////////////////////
    // CHANNEL TOGGLE
    //////////////////////////////////
    function toggleChannel(channel) {
      if (!currentIso) return;
      if (!channelMeshes[channel]) return;

      const meshes = channelMeshes[channel][currentIso];
      if (!meshes) return;

      const newVisible = !meshes[0].visible;

      meshes.forEach(mesh => {
        mesh.visible = newVisible;
      });

      styleButton(channelButtons[channel], newVisible);
    }

    //////////////////////////////////
    // UI
    //////////////////////////////////
    const ui = document.createElement("div");
    ui.style.position = "absolute";
    ui.style.top = "10px";
    ui.style.right = "10px";
    ui.style.display = "flex";
    ui.style.flexDirection = "column";
    ui.style.gap = "6px";
    document.body.appendChild(ui);

    // Collect iso values
    const isoSet = new Set();
    Object.values(channelMeshes).forEach(channel => {
      Object.keys(channel).forEach(i => isoSet.add(i));
    });

    const isoList = [...isoSet].sort((a, b) => parseFloat(a) - parseFloat(b));

    // ISO buttons
    isoList.forEach((iso) => {
      const btn = document.createElement("button");
      btn.innerText = `Iso ${iso}`;
      btn.onclick = () => setIso(iso);

      styleButton(btn, false);

      isoButtons[iso] = btn;
      ui.appendChild(btn);
    });

    // Channel buttons
    Object.keys(channelMeshes).forEach((channel) => {
      const btn = document.createElement("button");
      btn.innerText = `Channel ${channel}`;
      btn.onclick = () => toggleChannel(channel);

      styleButton(btn, true);

      channelButtons[channel] = btn;
      ui.appendChild(btn);
    });

    //////////////////////////////////
    // DEFAULT ISO
    //////////////////////////////////
    if (isoList.length > 0) {
      setIso(isoList[0]);
    }

    //////////////////////////////////
    // CENTER + SCALE
    //////////////////////////////////
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // create pivot
    const pivot = new THREE.Group();
    scene.add(pivot);
    
    // compute scale
    const scale = 2.0 / Math.max(size.x, size.y, size.z);
    
    // 🔥 FIX: scale the center offset too
    model.position.sub(center.multiplyScalar(scale));
    
    // apply scale
    model.scale.setScalar(scale);
    
    // attach to pivot
    pivot.add(model);
    
    // orbit center
    controls.target.set(0, 0, 0);
    controls.update();
    loadingDiv.remove();

    console.log("Model loaded with UI state control");
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
