// Это то, что было у нас раньше, с небольшими исправлениями, файл не принимает участия в распознавании

import io from 'socket.io-client'

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

let socket;

let AudioStreamer = {
  /**
   * @param {function} onData Callback to run on data each time it's received
   * @param {function} onError Callback to run on an error if one is emitted.
   */
  initRecording: function(onData, onError) {
    socket = io('https://speech.googleapis.com/v1p1beta1/speech:recognize', {
      ca: "-----BEGIN PRIVATE KEY-----\n" +
      "MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDJ5eFbDetAMHhP\n" +
      "bdJRyftOOSNQ9AyWNvLvtKFN/9GrwDLftXLuWSTbsKlhZWdUdaPKQLpwP7M027WC\n" +
      "sMdUYLKsu01/vto1J6uP+KLpnD0iv6t6khCQZEj+Z/A3yO9w5aYIKl9NcBXbEI0W\n" +
      "3MbNX5/gHs4MI2ACgECyAfArlOys8Ckzv1ZhImO2MylK0TG+2zq+d6HKTdc+IoFM\n" +
      "y85vA01++vnubijPxQXaJ9kisQD15ZQG+LQKtaKOB9No5QsAcxseyoCf4+amYggE\n" +
      "J5Buc/JNpQovBRz2V0PPdH5jt+xIn+k0Vqv8jCRJNcO35SZmmNajQwLtKpYzsjrT\n" +
      "U0bv3RWzAgMBAAECggEATjhEL2E8n9FHg0piffJ5bOxhHNd4WuguBaVfCxeN9XMQ\n" +
      "orArN2GNEJoofUXqmwO6sbyTHrLnLJbkgx4XE78k6hvk4hWgd5CHfM9Q2p3/54sH\n" +
      "lgSp6y8XQo0lOY+dCInIYgh8hMVkiksmxlFBqkaea5ezr2szIrTqm6x5joDzkuoG\n" +
      "avGw+RvYbiP2UFyXdHb2Bk7xxhxMBuvVST/tk8iTA5mRmrq0xYPi+ncbxkX66TN7\n" +
      "TwgBUcjIMPfz2v/4LPI1X2S/xvF/4ZbBViTo5qbrcI+IQFbWPjyE7iJc0MiLrynf\n" +
      "rd/QvRwrm8jqCO5hyvtxUrGoCrNnMb9hIJR0ENoeoQKBgQDpl5egR7gk8ioCYC05\n" +
      "5X+IpJqclcqIoyuTbu+CmAadDKrSPy9TK4AERaRSdiVjU8ndDN+WssMFWw1JTR+Y\n" +
      "ltvqKIEoaq747vJORIUfvEj4mdFm6IQ3prXVcpmlHAd3GwvucQilW0Mmbk0wPq97\n" +
      "V3T3JoRmz/pBPozHczyE5yktUwKBgQDdQ/ZZIrAOXBnsu29lDqUlm81SLz58y9DU\n" +
      "jwc7/38/7dKyPtj3Q7432xSUq3LoHa+GNnbHEdKkhYSHz2XkqIL83BIcYFOtTbRt\n" +
      "tlsr6ZaUf9tP/sKwNz+ZTCugE0/h+e9Rj40i4H5JGzwUzGGQsJBVIO71R7emem0f\n" +
      "nDmoNvMKIQKBgGe2oOHPNhlhU/meDjaIiSl4PBWOBFDKccySEtGfAkC0oRucZjy9\n" +
      "Maez7BOY1VzWlOgKkTNtx10XYjzLe13ajWXX+hCh3XI1VWwezCSdCqEmWm0gi6PR\n" +
      "5yYQLdu7KC1f2tpRYY9Zh+UGUEs9adiPqiUZ+utTKD/Tr9nWdmZj5Ep1AoGAFnLD\n" +
      "to1fYUWU18C4b39J4APrk8/5Pf4LpNUR/dNRHLJLMwxPRN7ZmJ8gemjekpAYc7xo\n" +
      "1o+HWGu3Y3P2OXmjOHY3XCulsap1iL/8hfr/7Pb/0CDfrbMdP7dLocTz0NBjqFmx\n" +
      "Dv3Jsi8SLGYD7AMN0aUyuS3agwhes9tMujVA+SECgYAGa9GdZpbESS1o+hy1PtWU\n" +
      "D2XmC/0nNO7D+M2KIrx4BTo71RtGvHINLh1XGP8id/N/2NOZqgnhov+F9stfN5mj\n" +
      "3tbvfuNxr8lr2bfEXI/hzep0F61RnT5vDT2Eqfldt4YyHz8KYXa15KRwAXl15GWM\n" +
      "l9wFcwuJ8L+J+ryd8FvHfw==\n" +
      "-----END PRIVATE KEY-----\n",
      rejectUnauthorized: false,
      secure: true,
      transports: ['polling']
    });
    socket.emit('startGoogleCloudStream', {
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        // В данном поле имеется возможность изменить язык
        languageCode: 'ru-RU',
        // languageCode: 'en-US',
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

    let handleSuccess = function (stream) {
      globalStream = stream;
      if (context) {
        input = context.createMediaStreamSource(stream);
        input.connect(processor);

        processor.onaudioprocess = function (e) {
          microphoneProcess(e);
        };
      }

    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(handleSuccess);

    // Bind the data handler callback
    if(onData) {
      socket.on('speechData', (data) => {
        onData(data);
      });
    }

    socket.on('googleCloudStreamError', (error) => {
      if(onError) {
        onError('error');
      }
      // We don't want to emit another end stream event
      closeAll();
    });
  },

  stopRecording: function() {
    if (socket) {
      closeAll();
    }
  }
};

export default AudioStreamer;

// Helper functions
/**
 * Processes microphone data into a data stream
 *
 * @param {object} e Input from the microphone
 */
function microphoneProcess(e) {
  var left = e.inputBuffer.getChannelData(0);
  var left16 = convertFloat32ToInt16(left);
  socket.emit('binaryData', left16);
}

/**
 * Converts a buffer from float32 to int16. Necessary for streaming.
 * sampleRateHertz of 1600.
 *
 * @param {object} buffer Buffer being converted
 */
function convertFloat32ToInt16(buffer) {
  let l = buffer.length;
  let buf = new Int16Array(l / 3);

  while (l--) {
    if (l % 3 === 0) {
      buf[l / 3] = buffer[l] * 0xFFFF;
    }
  }
  return buf.buffer
}

export function resumeRecording(onData, onError) {
  let tracks = globalStream ? globalStream.getTracks() : null;
  let track = tracks ? tracks[0] : null;
  if(track) {
    // track.clone();
  }
}

export function disableRecording() {
  let tracks = globalStream ? globalStream.getTracks() : null;
  let track = tracks ? tracks[0] : null;
  if(track) {
    track.stop();
  }
}

/**
 * Stops recording and closes everything down. Runs on error or on stop.
 */
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

  if (processor) {
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
    if (context.state !== 'closed') {
      context.close().then(function () {
        input = null;
        processor = null;
        context = null;
        AudioContext = null;
      });
    }
  }
}

// "-----BEGIN CERTIFICATE-----\n" +
//       "MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDJ5eFbDetAMHhP\n" +
//       "bdJRyftOOSNQ9AyWNvLvtKFN/9GrwDLftXLuWSTbsKlhZWdUdaPKQLpwP7M027WC\n" +
//       "sMdUYLKsu01/vto1J6uP+KLpnD0iv6t6khCQZEj+Z/A3yO9w5aYIKl9NcBXbEI0W\n" +
//       "3MbNX5/gHs4MI2ACgECyAfArlOys8Ckzv1ZhImO2MylK0TG+2zq+d6HKTdc+IoFM\n" +
//       "AQEAq34IQwMmATXVguVXbX4iMjtnugk+qmV4zMNpqZ1V+ucW0eXChOvicXmzm0TW\n" +
//       "LtX1WB86XkcSbscCjeI8/FeWdMiIvTj0DRzmdZo5WHLw0jgsdLfUFV00uoQbwlsW\n" +
//       "h3h2+TZToJjoPJaimftyELclCBNp+AmpNNbioyjRxZ/n8miyDdgRAB1zXPF5OAxX\n" +
//       "Qa1QMjWBpkH8cl5gOnxAlGpf/AM4vmChYcCct4jGY/SiDlPH8gcqyt4XulsSQ30b\n" +
//       "zVIDUvWQtrkmztJoTthaMtBRLQ2e4lxlTwc5hHjzzPFlGwDxFrl1AWKWDkLvUiKi\n" +
//       "Waz1ENvsf5rLH+IbNibtntLP9QIDAQABo4ICSzCCAkcwDgYDVR0PAQH/BAQDAgWg\n" +
//       "MB0GA1UdJQQWMBQGCCsGAQUFBwMBBggrBgEFBQcDAjAMBgNVHRMBAf8EAjAAMB0G\n" +
//       "A1UdDgQWBBTSkw81lsIoHWMLOO47dtPDKSHefzAfBgNVHSMEGDAWgBQULrMXt1hW\n" +
//       "y65QCUDmH6+dixTCxjBVBggrBgEFBQcBAQRJMEcwIQYIKwYBBQUHMAGGFWh0dHA6\n" +
//       "Ly9yMy5vLmxlbmNyLm9yZzAiBggrBgEFBQcwAoYWaHR0cDovL3IzLmkubGVuY3Iu\n" +
//       "b3JnLzAcBgNVHREEFTATghF2aWRlby5zaXhoYW5kcy5jbzBMBgNVHSAERTBDMAgG\n" +
//       "BmeBDAECATA3BgsrBgEEAYLfEwEBATAoMCYGCCsGAQUFBwIBFhpodHRwOi8vY3Bz\n" +
//       "LmxldHNlbmNyeXB0Lm9yZzCCAQMGCisGAQQB1nkCBAIEgfQEgfEA7wB1AG9Tdqwx\n" +
//       "8DEZ2JkApFEV/3cVHBHZAsEAKQaNsgiaN9kTAAABdnEhv9cAAAQDAEYwRAIgTSik\n" +
//       "bjcyigeBA9icCnlM+G+tLmxEIqn65g56PMkBOMECIEEMLoTKpvp385k4so3sw9Mb\n" +
//       "kxrKUy9c1vDIC2TjPlmDAHYAfT7y+I//iFVoJMLAyp5SiXkrxQ54CX8uapdomX4i\n" +
//       "8NcAAAF2cSG/2gAABAMARzBFAiEA64oeTQJlraRjXlh70k157/Nc9zIJ1j+dh0MH\n" +
//       "FOVmQ30CIAguxNFk+WxK9ElneyFZUjzFu4KLOlI9EU0Yohuqem6iMA0GCSqGSIb3\n" +
//       "DQEBCwUAA4IBAQAkw+1V/dzf03/1pCqJN3q70j6zniqV/RjUAXPlcJkm6KHx5MVE\n" +
//       "90ekb/0kO06wapxlw0UyhT37DyaQ6dP1JCZBKQefuehKfde/ae8cuEuADXsZ20jl\n" +
//       "CSh9g6s5NaKtHGIALMT01N7gmcHNR2KDIkIZEyQK3ecJ5rDJmpXuPu29M7inILam\n" +
//       "1H7VTYEUBxRAvOzFbt8V8MKh2f1eONgJkwOaAjQnkZNcNfrki3LIohan46jjMjch\n" +
//       "FzgqqcH8fwrSGQFzYwdwqAXvfyBmmzGOeLMKti0t0Pc6k7eTQSG8UcwHQFo6YJfo\n" +
//       "bLNhH4f5lHde91C/8ErcQBJjpF+PSMi70Mqx\n" +
//       "-----END CERTIFICATE-----\n"