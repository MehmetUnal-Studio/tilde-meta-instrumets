let camera, scene, renderer;
let geometry, material, mesh, clock;
var keyboard = new AudioKeys();
import { RectAreaLightHelper } from "./helper/RectAreaLightHelper.js";
import { RectAreaLightUniformsLib } from "./helper/RectAreaLightUniformsLib.js";

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );

  camera.position.set(0, 13, -15);

  // const ambient = new THREE.HemisphereLight(0xffffff, 0xffffff);
  // scene.add(ambient);

  const light = new THREE.DirectionalLight(0xffffff, 0.1);
  light.position.set(0, 3, -0.5);
  scene.add(light);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  document.body.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 4, 0);
  controls.update();

  // const size = 100;
  // const sections = 100;
  // const area = new THREE.GridHelper(size, sections);
  // scene.add(area);

  RectAreaLightUniformsLib.init();

  const rectLightsBlue = [];
  for (let i = 0; i < 10; i++) {
    rectLightsBlue.push(new THREE.RectAreaLight(0x0000ff, 5, 4, 1));
    const position_y = 0.5 + i;
    rectLightsBlue[i].position.set(5, position_y, 5);
    scene.add(rectLightsBlue[i]);
    scene.add(new RectAreaLightHelper(rectLightsBlue[i]));
  }

  const rectLightsGreen = [];
  for (let i = 0; i < 10; i++) {
    rectLightsGreen.push(new THREE.RectAreaLight(0x00ff00, 5, 4, 1));
    const position_y = 0.5 + i;
    rectLightsGreen[i].position.set(-5, position_y, 5);
    scene.add(rectLightsGreen[i]);
    scene.add(new RectAreaLightHelper(rectLightsGreen[i]));
  }

  const rectLightsRed = [];
  for (let i = 0; i < 10; i++) {
    rectLightsRed.push(new THREE.RectAreaLight(0xff0000, 5, 4, 1));
    const position_y = 0.5 + i;
    rectLightsRed[i].position.set(0, position_y, 5);
    scene.add(rectLightsRed[i]);
    scene.add(new RectAreaLightHelper(rectLightsRed[i]));
  }

  const geoFloor = new THREE.BoxGeometry(2000, 0.1, 2000);
  const matStdFloor = new THREE.MeshStandardMaterial({
    color: 0x808080,
    roughness: 0.1,
    metalness: 0,
  });
  const mshStdFloor = new THREE.Mesh(geoFloor, matStdFloor);
  scene.add(mshStdFloor);

  var loader = new THREE.FBXLoader();
  const pickableObjects = new Array();
  let originalMaterials = {};
  const highlightedMaterial = new THREE.MeshBasicMaterial({ color: 0xe5c747 });

  loader.load("object/SH101_2.fbx", (object) => {
    object.traverse(function (child) {
      if (child.isMesh) {
        const oldMat = child.material;
        child.material = new THREE.MeshLambertMaterial({
          color: oldMat.color,
          map: oldMat.map,
        });
      }
      if (
        parseInt(child.name.slice(7)) <= 62 &&
        parseInt(child.name.slice(7)) >= 50
      ) {
        child.castShadow = true;
        pickableObjects.push(child);
        originalMaterials[child.name] = child.material;
      }
      if (
        parseInt(child.name.slice(7)) <= 81 &&
        parseInt(child.name.slice(7)) >= 63
      ) {
        child.castShadow = true;
        pickableObjects.push(child);
        originalMaterials[child.name] = child.material;
      }
    });
    object.position.y = 1;
    object.scale.x = 4;
    object.scale.y = 4;
    object.scale.z = 4;
    scene.add(object);
  });

  const move = async (object) => {
    for (let i = 0; i <= 0.03; i += 0.006) {
      object.rotation.x -= i;
      await delay(30);
    }
    for (let i = 0.03; i >= 0; i -= 0.006) {
      object.rotation.x += i;
      await delay(30);
    }
    moving = moving.filter((item) => item !== object.name);
    object.material = originalMaterials[object.name];
  };

  function delay(delayInms) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(2);
      }, delayInms);
    });
  }

  clock = new THREE.Clock();

  window.addEventListener("resize", resize, false);
  animate();

  //Mouse Click
  const raycaster = new THREE.Raycaster();
  let intersects, intersectedObject;
  document.addEventListener("click", onDocumentMouseMove, false);
  let moving = [];
  function onDocumentMouseMove(event) {
    raycaster.setFromCamera(
      {
        x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1,
      },
      camera
    );
    intersects = raycaster.intersectObjects(pickableObjects, false);

    if (intersects.length > 0) {
      intersectedObject = intersects[0].object;
    } else {
      intersectedObject = null;
    }
    const key = {
      50: 86,
      51: 78,
      52: 188,
      53: 87,
      54: 69,
      55: 84,
      56: 89,
      57: 85,
      58: 79,
      59: 80,
      60: 73,
      63: 67,
      64: 66,
      65: 77,
      66: 190,
      67: 65,
      68: 83,
      69: 68,
      70: 70,
      71: 71,
      72: 72,
      73: 74,
      74: 75,
      75: 76,
      76: 186,
      77: 222,
    };

    pickableObjects.forEach((o, i) => {
      if (intersectedObject && intersectedObject.name === o.name) {
        if (!moving.includes(pickableObjects[i].name)) {
          const keyCode = key[pickableObjects[i].name.slice(7)];
          document.dispatchEvent(
            new KeyboardEvent("keydown", { keyCode: keyCode })
          );
          document.dispatchEvent(
            new KeyboardEvent("keyup", { keyCode: keyCode })
          );
        }
      } else {
        pickableObjects[i].material = originalMaterials[o.name];
      }
    });
  }

  var sources = {};


  let moveLight = true;
  //Keyboard

  keyboard.down(async (event) => {
    if (!sources[event.keyCode]) {
      const synth = new Tone.Synth({
        volume: -15,
        oscillator: {
          type: "sine",
          harmonicity: 0.5,
          modulationType: "square",
        },
        envelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.3,
          release: 0.1,
        },
      });


      synth.triggerAttack();
      synth.frequency.value = event.frequency / 1;




      sources[event.keyCode] = {
        synth,
      };
      keyboard.up((event) => {

        sources[event.keyCode]

        delete sources[event.keyCode];
      });



      const movedObject = objectToMove(event.keyCode);
      moving.push(movedObject[0].name);
      movedObject[0].material = highlightedMaterial;
      move(movedObject[0]);
    }
    if (moveLight) {
      moveLight = false;
      for (let i = 0; i < 10; i++) {
        rectLightsBlue[9 - i].color.b = 0.1;
        rectLightsGreen[9 - i].color.g = 0.1;
        rectLightsRed[i].color.r = 0.1;
        await delay(30);
      }
      for (let i = 0; i < 10; i++) {
        await delay(30);
        rectLightsBlue[i].color.b = 1;
        rectLightsGreen[i].color.g = 1;
        rectLightsRed[9 - i].color.r = 1;
      }
      moveLight = true;
    }
  });



  const objectToMove = (keyCode) => {
    const key = {
      65: 67,
      83: 68,
      68: 69,
      70: 70,
      71: 71,
      72: 72,
      74: 73,
      75: 74,
      76: 75,
      190: 66,
      188: 52,
      77: 65,
      78: 51,
      66: 64,
      86: 50,
      67: 63,
      186: 76,
      222: 77,
      87: 53,
      69: 54,
      84: 55,
      89: 56,
      85: 57,
      79: 58,
      80: 59,
      73: 60,
    };
    return pickableObjects.filter((obj) => obj.name.includes(key[keyCode]));
  };
}

const animate = () => {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  renderer.render(scene, camera);
};

const resize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

$(document).ready(() => {
  init();
});