let camera, scene, renderer;
let geometry, material, mesh, clock;
var keyboard = new AudioKeys();
import { RectAreaLightHelper } from "./helper/RectAreaLightHelper.js";
import { RectAreaLightUniformsLib } from "./helper/RectAreaLightUniformsLib.js";

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 5, -15);

  // const ambient = new THREE.HemisphereLight(0xffffff, 0xffffff);
  // scene.add(ambient);

  const light = new THREE.DirectionalLight(0xffffff, 0.1);
  light.position.set(0, 6, 6);
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

  const rectLight1 = new THREE.RectAreaLight(0xff0000, 5, 4, 10);
  rectLight1.position.set(-5, 5, 5);
  scene.add(rectLight1);

  const rectLight2 = new THREE.RectAreaLight(0x00ff00, 5, 4, 10);
  rectLight2.position.set(0, 5, 5);
  scene.add(rectLight2);

  const rectLight3 = new THREE.RectAreaLight(0x0000ff, 5, 4, 10);
  rectLight3.position.set(5, 5, 5);
  scene.add(rectLight3);

  scene.add(new RectAreaLightHelper(rectLight1));
  scene.add(new RectAreaLightHelper(rectLight2));
  scene.add(new RectAreaLightHelper(rectLight3));

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
        // switch the material here - you'll need to take the settings from the
        //original material, or create your own new settings, something like:
        const oldMat = child.material;
        child.material = new THREE.MeshLambertMaterial({
          color: oldMat.color,
          map: oldMat.map,
          //etc
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
    object.position.y = 3;
    object.scale.x = 3;
    object.scale.y = 3;
    object.scale.z = 3;
    console.log(object);
    scene.add(object);
  });

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
    pickableObjects.forEach((o, i) => {
      if (intersectedObject && intersectedObject.name === o.name) {
        if (!moving.includes(pickableObjects[i].name)) {
          // document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'a', 'code': 'keyA', 'keyCode': 65}));
          // document.dispatchEvent(new KeyboardEvent('keyup', {'key': 'a', 'code': 'keyA', 'keyCode': 65}));
          move(pickableObjects[i]);
          moving.push(pickableObjects[i].name);
          pickableObjects[i].material = highlightedMaterial;
        }
      } else {
        pickableObjects[i].material = originalMaterials[o.name];
      }
    });
  }

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



//......................................................................SOUND

var sources = {};

navigator
  .requestMIDIAccess()
  .then((access) => {
    const devices = access.inputs.values();
    for (let device of devices) device.onmidimessage = onMidiMessage;
  })
  .catch(console.error);

function onMidiMessage(message) {
  let [channel, note, velocity] = message.data;
  //  console.log(message)
  // console.log({channel,note,velocity})
  var mtf = midiToFreq(note);

  midikey(mtf, velocity, channel, note);
  // console.log(message)
}

function midiToFreq(note) {
  return Math.pow(2, (note - 69) / 12) * 440.0;
}

const reverb = new Tone.Reverb({
  wet: 0.3,
  decay: 1.5,
  preDelay: 0.5,
});
const delay1 = new Tone.PingPongDelay({
  delayTime: "4t",
  feedback: 0.3,
  wet: 0.2,
});
const filter = new Tone.Filter({
  frequency: 6000,
  type: "lowpass",
  rolloff: -96,
}).toDestination();

function midikey(mtf, velocity, channel, note) {
  
  const synth = new Tone.Synth({
    volume: -15,
    oscillator: {
      type: "sine",
      harmonicity: 0.5,
      modulationType: "square",
    },
    envelope: {
      attackCurve: "exponential",
      attack: 0.05,
      decay: 0.2,
      sustain: 0.1,
      release: 2.5,
    },
    portamento: 0.05,
  });
  

  synth.chain(delay1, reverb, filter);


  switch (channel) {
    case 144:
      if (velocity > 0) synth.triggerAttackRelease(mtf, "16n"); // synth.frequency.value = mtf
      break;
    case 176:
      if (note == 41) filter.frequency.value = velocity * 100;
        console.log(velocity * 100)
      break;
  }

  const key = {
    60: 65,
    61: 87,
    83: 62,
    69: 63,
    68: 64,
    70: 65,
    77: 59,
    78: 57,
    84: 66,
    71: 67,
    89: 68,
    72: 69,
    85: 70,
    74: 71,
    75: 72,
    79: 73,
    76: 74,
    80: 75,
    186: 76,
    222: 77,
}

//GATE NOTEOFF
//  if (channel == 144 ,velocity > 0) var noteout = note; 
 
 switch (channel) {
  case 144:
    var noteout = note; 
    break;
  case 176:
  
}

// console.log(noteout)

  const movedObject = objectToMove2(noteout);
  moving.push(movedObject[0].name);
  movedObject[0].material = highlightedMaterial;
  move(movedObject[0]);
}



const objectToMove2 = (noteout ) => {
  switch (noteout) {
//White Keys
      case 60:
          return pickableObjects.filter((obj) => obj.name.includes("67"));
      case 62:
          return pickableObjects.filter((obj) => obj.name.includes("68"));
      case 64:
          return pickableObjects.filter((obj) => obj.name.includes("69"));
      case 65:
          return pickableObjects.filter((obj) => obj.name.includes("70"));
      case 67:
          return pickableObjects.filter((obj) => obj.name.includes("71"));
      case 69:
          return pickableObjects.filter((obj) => obj.name.includes("72"));
      case 71:
          return pickableObjects.filter((obj) => obj.name.includes("73"));
      case 72:
          return pickableObjects.filter((obj) => obj.name.includes("74"));
      case 74:
          return pickableObjects.filter((obj) => obj.name.includes("75"));
      case 59:
          return pickableObjects.filter((obj) => obj.name.includes("66"));
      case 58:
          return pickableObjects.filter((obj) => obj.name.includes("52"));
      case 57:
          return pickableObjects.filter((obj) => obj.name.includes("65"));
      case 56:
          return pickableObjects.filter((obj) => obj.name.includes("51"));
      case 55:
          return pickableObjects.filter((obj) => obj.name.includes("64"));
      case 54:
          return pickableObjects.filter((obj) => obj.name.includes("50"));
      case 53:
          return pickableObjects.filter((obj) => obj.name.includes("63"));
      case 76:
          return pickableObjects.filter((obj) => obj.name.includes("76"));
      case 77:
          return pickableObjects.filter((obj) => obj.name.includes("77"));
      case 79:
          return pickableObjects.filter((obj) => obj.name.includes("78"));
      case 81:
          return pickableObjects.filter((obj) => obj.name.includes("79"));
      case 83:
          return pickableObjects.filter((obj) => obj.name.includes("80"));
      case 84:
          return pickableObjects.filter((obj) => obj.name.includes("81"));
//Black Keys
      case 61:
          return pickableObjects.filter((obj) => obj.name.includes("53"));
      case 63:
          return pickableObjects.filter((obj) => obj.name.includes("54"));
      case 66:
          return pickableObjects.filter((obj) => obj.name.includes("55"));
      case 68:
          return pickableObjects.filter((obj) => obj.name.includes("56"));
      case 70:
          return pickableObjects.filter((obj) => obj.name.includes("57"));
      case 73:
          return pickableObjects.filter((obj) => obj.name.includes("58"));
      case 75:
          return pickableObjects.filter((obj) => obj.name.includes("59"));
      case 78:
          return pickableObjects.filter((obj) => obj.name.includes("60"));
      case 80:
          return pickableObjects.filter((obj) => obj.name.includes("61"));
      case 82:
          return pickableObjects.filter((obj) => obj.name.includes("62"));

  }
};



keyboard.down((event) => {
  if (!sources[event.keyCode]) {
    const synth = new Tone.Synth({
      volume: -15,
      oscillator: {
        type: "sine",
        harmonicity: 0.5,
        modulationType: "square",
      },
      envelope: {
        attackCurve: "exponential",
        attack: 0.05,
        decay: 0.2,
        sustain: 0.2,
        release: 1.5,
      },
      portamento: 0.05,
    });

    synth.chain(delay1, reverb, filter);
    synth.triggerAttackRelease("C4", "16n");

    synth.frequency.value = event.frequency / 1;

    sources[event.keyCode] = {
      synth,
    };
    keyboard.up((event) => {
      sources[event.keyCode];
      delete sources[event.keyCode];
    });
    const movedObject = objectToMove(event.keyCode);
    moving.push(movedObject[0].name);
    movedObject[0].material = highlightedMaterial;
    move(movedObject[0]);
  }
});







const objectToMove = (keyCode, ) => {
  switch (keyCode) {
      //White Keys
      case 65:
          return pickableObjects.filter((obj) => obj.name.includes("67"));
      case 83:
          return pickableObjects.filter((obj) => obj.name.includes("68"));
      case 68:
          return pickableObjects.filter((obj) => obj.name.includes("69"));
      case 70:
          return pickableObjects.filter((obj) => obj.name.includes("70"));
      case 71:
          return pickableObjects.filter((obj) => obj.name.includes("71"));
      case 72:
          return pickableObjects.filter((obj) => obj.name.includes("72"));
      case 74:
          return pickableObjects.filter((obj) => obj.name.includes("73"));
      case 75:
          return pickableObjects.filter((obj) => obj.name.includes("74"));
      case 76:
          return pickableObjects.filter((obj) => obj.name.includes("75"));
      case 190:
          return pickableObjects.filter((obj) => obj.name.includes("66"));
      case 188:
          return pickableObjects.filter((obj) => obj.name.includes("52"));
      case 77:
          return pickableObjects.filter((obj) => obj.name.includes("65"));
      case 78:
          return pickableObjects.filter((obj) => obj.name.includes("51"));
      case 66:
          return pickableObjects.filter((obj) => obj.name.includes("64"));
      case 86:
          return pickableObjects.filter((obj) => obj.name.includes("50"));
      case 67:
          return pickableObjects.filter((obj) => obj.name.includes("63"));
      case 186:
          return pickableObjects.filter((obj) => obj.name.includes("76"));
      case 222:
          return pickableObjects.filter((obj) => obj.name.includes("77"));
          //Black Keys
      case 87:
          return pickableObjects.filter((obj) => obj.name.includes("53"));
      case 69:
          return pickableObjects.filter((obj) => obj.name.includes("54"));
      case 84:
          return pickableObjects.filter((obj) => obj.name.includes("55"));
      case 89:
          return pickableObjects.filter((obj) => obj.name.includes("56"));
      case 85:
          return pickableObjects.filter((obj) => obj.name.includes("57"));
      case 79:
          return pickableObjects.filter((obj) => obj.name.includes("58"));
      case 80:
          return pickableObjects.filter((obj) => obj.name.includes("59"));
      case 73:
          return pickableObjects.filter((obj) => obj.name.includes("60"));

  }
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
