import io from 'socket.io-client'

const socket = io.connect('http://localhost:3002/', {
  rejectUnauthorized: false,
  secure: true,
  transports: ['websocket', 'polling', 'flashsocket'],
});

// Stream Audio
let bufferSize = 2048,
  AudioContext,
  context,
  processor,
  input,
  globalStream;

//audioStream constraints
const constraints = {
  audio: true,
  video: false
};

let audioStreamer = {
  /**
   * @param {function} onData Callback to run on data each time it's received
   * @param {function} onError Callback to run on an error if one is emitted.
   */
  initRecording: () => {
    socket.emit('startGoogleCloudStream', {
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        // Here you can change language
        languageCode: 'ru-RU',
        profanityFilter: false,
        enableWordTimeOffsets: true // Here I add 99.9% correct results, but results are NOT real-time,
        // I can see them only after end of my speech
      },
      interimResults: true // Here I add REAL-TIME every interim results, but correct and incorrect
    });

    AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
    processor = context.createScriptProcessor(bufferSize, 1, 1);
    processor.connect(context.destination);
    context.resume();

    const handleSuccess = (stream) => {
      globalStream = stream;
      if (context) {
        input = context.createMediaStreamSource(stream);
        input.connect(processor);

        processor.onaudioprocess = (e) => {
          microphoneProcess(e);
        };
      }
    };

    navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess);
  },

  stopRecording: () => {
    closeAll(); 
  }
};

export default audioStreamer;

/////////////////////// SOCKETS ////////////////////////////

socket.on('connect', function (data) {
  console.log('connected to socket');
  socket.emit('join', 'Server Connected to Client');
});

socket.on('messages', function (data) {
  console.log(data);
});

socket.on('speechData', function (data) {
  console.log(data);
})

function microphoneProcess(e) {
  const left = e.inputBuffer.getChannelData(0);
  const left16 = downsampleBuffer(left, 44100, 16000);
  socket.emit('binaryData', left16);
}

const downsampleBuffer = function (buffer, sampleRate, outSampleRate) {
  if (outSampleRate === sampleRate) {
    return buffer;
  }
  if (outSampleRate > sampleRate) {
    throw 'downsampling rate show be smaller than original sample rate';
  }
  const sampleRateRatio = sampleRate / outSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Int16Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0,
      count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }

    result[offsetResult] = Math.min(1, accum / count) * 0x7fff;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result.buffer;
};

function closeAll() {
  // window.timestampLog('closing sockets with speech recognition proxy');
  // Clear the listeners (prevents issue if opening and closing repeatedly)
  socket.emit('endGoogleCloudStream', '');
  socket.off('speechData');
  socket.off('googleCloudStreamError');
  socket.disconnect()
  let tracks = globalStream ? globalStream.getTracks() : null;
  let track = tracks ? tracks[0] : null;
  if(track) {
    track.stop();
  }

  if(processor) {
    if(input) {
      try {
        // console.log('disconnecting...')
        input.disconnect(processor);
      } catch(error) {
        console.warn('Attempt to disconnect input failed.')
      }
    }
    // processor.disconnect(context.destination);
  }
  if(context) {
    context.close().then(function () {
      input = null;
      processor = null;
      context = null;
      AudioContext = null;
    });
  }
}