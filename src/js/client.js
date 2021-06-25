import { io } from "socket.io-client";

const ioClient = io.connect("http://localhost:3002", {transports: ['websocket', 'polling', 'flashsocket']});

const client = async () => {
  ioClient.on("connect", (socket) => {
    ioClient.send("hello world");
    setTimeout(() => {
      ioClient.emit('startRecord', 'startRecord');
      console.log('Диктуй!');
    }, 2 * 1000);
    ioClient.on("message", (msg) => console.log(msg));
    ioClient.on("speech", (speech) => console.log(speech));
    ioClient.on("textFromGoogle", (speech) => console.log(speech));
    ioClient.on("objFromGoogle", (obj) => console.log(obj));
    ioClient.on('googleWord', wordInfo => console.log(wordInfo));
    ioClient.on('myWord', wordInfo => console.log(wordInfo));
  });
};

export default client;