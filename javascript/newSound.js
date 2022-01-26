let octave = 4;

const keys = [];
let prevKey = 0;

const Instruments = {
  // https://github.com/stuartmemo/qwerty-hancock
  keyboard: {
    // Lower octave.
    a: 'Cl',
    w: 'C#l',
    s: 'Dl',
    e: 'D#l',
    d: 'El',
    f: 'Fl',
    t: 'F#l',
    g: 'Gl',
    y: 'G#l',
    h: 'Al',
    u: 'A#l',
    j: 'Bl',
    '.': 'Bd',
    ',': 'A#d',
    m: 'Ad',
    n: 'G#d',
    b: 'Gd',
    v: 'F#d',
    c: 'Fd',
    // Upper octave.
    k: 'Cu',
    o: 'C#u',
    l: 'Du',
    p: 'D#u',
    ';': 'Eu',
    "'": 'Fu',
    ']': 'F#u',
    '\\': 'Gu' } };



let instrument = Instruments.keyboard;

const keyToNote = key => {
  const note = instrument[key];
  if (!note) {
    return;
  }

  return Tone.Frequency(
  note.
  replace('l', octave).
  replace('d', octave  - 1).
  replace('u', octave + 1)).
  toNote();
};

const onKeyDown = (() => {
  let listener;

  return synth => {
    document.removeEventListener('keydown', listener);

    listener = event => {
      const { key } = event;


      // Only trigger once per keydown event.
      if (!keys[key]) {
        keys[key] = true;

        const note = keyToNote(key);
        if (note) {
          synth.triggerAttack(note);
          prevKey = key;
        }
      }
    };

    document.addEventListener('keydown', listener);
  };
})();



const onKeyUp = (() => {
  let listener;
  let prev;

  return synth => {
    // Clean-up.
    if (prev) {
      prev.triggerRelease();
    }

    document.removeEventListener('keyup', listener);

    prev = synth;
    listener = event => {
      const { key } = event;
      if (keys[key]) {
        keys[key] = false;

        const note = keyToNote(key);
        if (synth instanceof Tone.PolySynth) {
          synth.triggerRelease(note);
        } else if (note && key === prevKey) {
          // Trigger release if this is the previous note played.
          synth.triggerRelease();
        }
      }
    };

    document.addEventListener('keyup', listener);
  };
})();

// Octave controls.
document.addEventListener('keydown', event => {
  // Decrease octave range (min: 0).
  if (event.key === 'z') {octave = Math.max(octave - 1, 0);}
  // Increase octave range (max: 10).
  if (event.key === 'x') {octave = Math.min(octave + 1, 9);}
});









  //...............................................Midi Keyboard
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
    var mtf = midiToFreq(note);
    midikey(mtf, velocity, channel, note);
  }

  function midiToFreq(note) {
    return Math.pow(2, (note - 69) / 12) * 440.0;
  }


  function midikey(mtf, velocity, channel, note) {
    const synth = new Tone.Synth({
      volume: -25,
      oscillator: {
        type: "sine",
        harmonicity: 0.5,
        modulationType: "square",
      },
      envelope: {
        attackCurve: "exponential",
        attack: 0.05,
        decay: 0.2,
        sustain: 0.5,
        release: 0.9,
      },

    }).toMaster();

    onKeyDown(synth);
    onKeyUp(synth);
    // synth.chain(delay1, reverb, filter);

    switch (channel) {
      case 144:
        if (velocity > 0) synth.triggerAttackRelease(mtf, "16n"); // synth.frequency.value = mtf
        break;
      case 176:
        if (note == 41) filter.frequency.value = velocity * 100;
        break;
    }
  }
















  const delay = new Tone.PingPongDelay({
    delayTime: "4t",
    feedback: 0.3,
    wet: 0.1,
  });
  const filter = new Tone.Filter({
    frequency: 5000,
    type: "lowpass",
    rolloff: -96,
  }).toMaster();

  const freeverb = new Tone.Freeverb(
    {
    dampening: 5000,
    roomSize: 0.8,
    wet: 0.2
    });
    


// Init.
function synth() {
    const synth = new Tone.PolySynth({
        volume: -10,
        envelope: {
            attack: 0.05,
            attackCurve: "linear",
            decay: 0.1,
            release: 1,
            releaseCurve: "exponential",
            sustain: 0.3
        },
        oscillator: {
            type: 'sine'
        },
        portamento: 0
    
    });
 
  synth.chain(delay,freeverb,filter);

  onKeyDown(synth);
  onKeyUp(synth);
};

synth();