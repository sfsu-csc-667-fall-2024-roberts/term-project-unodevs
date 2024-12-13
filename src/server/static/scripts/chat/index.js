import { io } from "socket.io-client";

const chatWindow = document.querySelector("#chat-messages");
const roomId = document.querySelector("#room-id").value;

const chatSocket = io();

chatSocket.on(
  `chat:message:${roomId}`,
  ({ hash, from, timestamp, message }) => {
    console.log(roomId);
    const div = document.createElement("div");
    div.classList.add("message");

    const p = document.createElement("p");
    p.innerText = `${from}: ${message}`;

    div.appendChild(p);

    chatWindow.appendChild(div);
  },
);