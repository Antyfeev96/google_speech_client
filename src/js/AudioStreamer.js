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
        // В данном поле имеется возможность изменить язык
        languageCode: 'ru-RU',
        profanityFilter: false,
        enableWordTimeOffsets: true
      },
      interimResults: true
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

/////////////////////// СОКЕТЫ ////////////////////////////

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
  // console.log(left16);
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







// ca: "-----BEGIN PRIVATE KEY-----\n" +
// "MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDJ5eFbDetAMHhP\n" +
// "bdJRyftOOSNQ9AyWNvLvtKFN/9GrwDLftXLuWSTbsKlhZWdUdaPKQLpwP7M027WC\n" +
// "sMdUYLKsu01/vto1J6uP+KLpnD0iv6t6khCQZEj+Z/A3yO9w5aYIKl9NcBXbEI0W\n" +
// "3MbNX5/gHs4MI2ACgECyAfArlOys8Ckzv1ZhImO2MylK0TG+2zq+d6HKTdc+IoFM\n" +
// "y85vA01++vnubijPxQXaJ9kisQD15ZQG+LQKtaKOB9No5QsAcxseyoCf4+amYggE\n" +
// "J5Buc/JNpQovBRz2V0PPdH5jt+xIn+k0Vqv8jCRJNcO35SZmmNajQwLtKpYzsjrT\n" +
// "U0bv3RWzAgMBAAECggEATjhEL2E8n9FHg0piffJ5bOxhHNd4WuguBaVfCxeN9XMQ\n" +
// "orArN2GNEJoofUXqmwO6sbyTHrLnLJbkgx4XE78k6hvk4hWgd5CHfM9Q2p3/54sH\n" +
// "lgSp6y8XQo0lOY+dCInIYgh8hMVkiksmxlFBqkaea5ezr2szIrTqm6x5joDzkuoG\n" +
// "avGw+RvYbiP2UFyXdHb2Bk7xxhxMBuvVST/tk8iTA5mRmrq0xYPi+ncbxkX66TN7\n" +
// "TwgBUcjIMPfz2v/4LPI1X2S/xvF/4ZbBViTo5qbrcI+IQFbWPjyE7iJc0MiLrynf\n" +
// "rd/QvRwrm8jqCO5hyvtxUrGoCrNnMb9hIJR0ENoeoQKBgQDpl5egR7gk8ioCYC05\n" +
// "5X+IpJqclcqIoyuTbu+CmAadDKrSPy9TK4AERaRSdiVjU8ndDN+WssMFWw1JTR+Y\n" +
// "ltvqKIEoaq747vJORIUfvEj4mdFm6IQ3prXVcpmlHAd3GwvucQilW0Mmbk0wPq97\n" +
// "V3T3JoRmz/pBPozHczyE5yktUwKBgQDdQ/ZZIrAOXBnsu29lDqUlm81SLz58y9DU\n" +
// "jwc7/38/7dKyPtj3Q7432xSUq3LoHa+GNnbHEdKkhYSHz2XkqIL83BIcYFOtTbRt\n" +
// "tlsr6ZaUf9tP/sKwNz+ZTCugE0/h+e9Rj40i4H5JGzwUzGGQsJBVIO71R7emem0f\n" +
// "nDmoNvMKIQKBgGe2oOHPNhlhU/meDjaIiSl4PBWOBFDKccySEtGfAkC0oRucZjy9\n" +
// "Maez7BOY1VzWlOgKkTNtx10XYjzLe13ajWXX+hCh3XI1VWwezCSdCqEmWm0gi6PR\n" +
// "5yYQLdu7KC1f2tpRYY9Zh+UGUEs9adiPqiUZ+utTKD/Tr9nWdmZj5Ep1AoGAFnLD\n" +
// "to1fYUWU18C4b39J4APrk8/5Pf4LpNUR/dNRHLJLMwxPRN7ZmJ8gemjekpAYc7xo\n" +
// "1o+HWGu3Y3P2OXmjOHY3XCulsap1iL/8hfr/7Pb/0CDfrbMdP7dLocTz0NBjqFmx\n" +
// "Dv3Jsi8SLGYD7AMN0aUyuS3agwhes9tMujVA+SECgYAGa9GdZpbESS1o+hy1PtWU\n" +
// "D2XmC/0nNO7D+M2KIrx4BTo71RtGvHINLh1XGP8id/N/2NOZqgnhov+F9stfN5mj\n" +
// "3tbvfuNxr8lr2bfEXI/hzep0F61RnT5vDT2Eqfldt4YyHz8KYXa15KRwAXl15GWM\n" +
// "l9wFcwuJ8L+J+ryd8FvHfw==\n" +
// "-----END PRIVATE KEY-----\n"