const fork = window;
const meetElement = document.getElementById("meet");
const chatInput = document.getElementById("chatInput");
const chatbox = document.getElementById("chatbox");
const chatMessage = document.getElementById("chatMessage");
const chatForm = document.getElementById("chatForm");
meetElement.style.display = "none";
const token = localStorage.getItem("meet_token");
const isHttps = window.location.href.startsWith("https");
const isDev = window.__DEV__ ?? false;

fork.logout = () => {
  localStorage.removeItem("meet_token");
  setTimeout(() => {
    window.location.href = "./";
  }, 300);
};
fork.openChat = () => {
  chatbox.style.display = "block";
  setTimeout(() => {
    chatInput.focus();
  }, 300);
};
fork.closeChat = () => {
  chatbox.style.display = "none";
};

let ws;
let localStream = null;
const peers = {};
if (!isDev && !isHttps) {
  window.location.href = "https://" +
    window.location.href.replace("http://", "");
}
const configuration = {
  "iceServers": [
    {
      "urls": "stun:stun.l.google.com:19302",
    },
    {
      "urls": "stun:stun1.l.google.com:19302",
    },
    {
      "urls": "stun:stun2.l.google.com:19302",
    },
    {
      "urls": "stun:stun3.l.google.com:19302",
    },
    {
      "urls": "stun:stun4.l.google.com:19302",
    },
  ],
};
const constraints = {
  audio: true,
  video: {
    width: {
      max: 200,
    },
    height: {
      max: 200,
    },
  },
};

const videoDisabledIcon = `<svg class="w-6 h-6 text-red-800 dark:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`;
const videoEnabledIcon = ` <svg class="w-6 h-6 text-gray-800 dark:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`

const micMute = `<svg class="w-6 h-6 text-red-800 dark:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`
const micUnmute = `<svg class="w-6 h-6 text-red-800 dark:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`


constraints.video.facingMode = {
  ideal: "user",
};
let info = {};
function init(token, stream) {
  const protoWs = isHttps ? "wss" : "ws";
  ws = new WebSocket(
    protoWs + "://" + window.location.host + "/ws/" + token,
  );
  ws.onclose = () => {
    for (const id in peers) {
      removePeer(id);
    }
  };
  ws.onmessage = (e) => {
    const { type, data } = JSON.parse(e.data);
    if (type === "initReceive") {
      addPeer(data.id, false);
      ws.send(JSON.stringify({
        type: "initSend",
        data,
      }));
    } else if (type === "opening") {
      localVideo.srcObject = stream;
      localStream = stream;
      info = data;
      
      document.getElementById("me").innerHTML = `Me: ${info.id}`;
    } else if (type === "initSend") addPeer(data.id, true);
    else if (type === "removePeer") removePeer(data.id);
    else if (type === "signal") peers[data.id].signal(data.signal);
    else if (type === "full") alert("Room FULL");
    else if (type === "errorToken") fork.logout();
    else if (type === "chat") {
      chatMessage.innerHTML += `
        <div class="chat-message">
          <b>${data.id.split("@")[0]}: </b>${data.message}
        </div>
      `;
      fork.openChat();
    }
  };
}
function removePeer(id) {
  const videoEl = document.getElementById(id);
  const colEl = document.getElementById("col-" + id);
  if (colEl && videoEl) {
    const tracks = videoEl.srcObject.getTracks();
    tracks.forEach(function (track) {
      track.stop();
    });
    videoEl.srcObject = null;
    videos.removeChild(colEl);
  }
  if (peers[id]) peers[id].destroy();
  delete peers[id];
}
function addPeer(id, am_initiator) {
  peers[id] = new SimplePeer({
    initiator: am_initiator,
    stream: localStream,
    config: configuration,
  });
  peers[id].on("signal", (data) => {
    ws.send(JSON.stringify({
      type: "signal",
      data: {
        signal: data,
        id,
      },
    }));
  });
  peers[id].on("stream", (stream) => {
    // col
    const col = document.createElement("col");
    col.id = "col-" + id;
    col.className = "container";

    // video
    const newVid = document.createElement("video");
    newVid.srcObject = stream;
    newVid.id = id;
    newVid.playsinline = false;
    newVid.autoplay = true;
    newVid.className = "vid";
    newVid.onclick = () => openPictureMode(newVid, id);
    newVid.ontouchstart = () => openPictureMode(newVid, id);

    // user
    const user = document.createElement("div");
    user.className = "overlay-text";
    user.innerHTML = id;
    col.append(newVid, user);
    videos.appendChild(col);
  });
}
function openPictureMode(el, id) {
  el.requestPictureInPicture();
  el.onleavepictureinpicture = () => {
    setTimeout(() => {
      document.getElementById(id).play();
    }, 300);
  };
}

fork.switchMedia = () => {
  if (constraints.video.facingMode.ideal === "user") {
    constraints.video.facingMode.ideal = "environment";
  } else {
    constraints.video.facingMode.ideal = "user";
  }
  const tracks = localStream.getTracks();
  tracks.forEach(function (track) {
    track.stop();
  });
  localVideo.srcObject = null;
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    for (const id in peers) {
      for (const index in peers[id].streams[0].getTracks()) {
        for (const index2 in stream.getTracks()) {
          if (
            peers[id].streams[0].getTracks()[index].kind ===
              stream.getTracks()[index2].kind
          ) {
            peers[id].replaceTrack(
              peers[id].streams[0].getTracks()[index],
              stream.getTracks()[index2],
              peers[id].streams[0],
            );
            break;
          }
        }
      }
    }
    localStream = stream;
    localVideo.srcObject = stream;
    updateButtons();
  });
};

fork.shareScreen = () => {
  navigator.mediaDevices.getDisplayMedia().then((stream) => {
    for (const id in peers) {
      for (const index in peers[id].streams[0].getTracks()) {
        for (const index2 in stream.getTracks()) {
          if (
            peers[id].streams[0].getTracks()[index].kind ===
              stream.getTracks()[index2].kind
          ) {
            peers[id].replaceTrack(
              peers[id].streams[0].getTracks()[index],
              stream.getTracks()[index2],
              peers[id].streams[0],
            );
            break;
          }
        }
      }
    }
    localStream = stream;
    localVideo.srcObject = localStream;
    updateButtons();
    stream.getVideoTracks()[0].onended = function () {
      fork.switchMedia();
      addPeer(info.id, false);
    };
  });
};

fork.removeLocalStream = () => {
  if (localStream) {
    const tracks = localStream.getTracks();
    tracks.forEach(function (track) {
      track.stop();
    });
    localVideo.srcObject = null;
  }

  for (const id in peers) {
    removePeer(id);
  }
};

fork.toggleMute = () => {
  for (const index in localStream.getAudioTracks()) {
    localStream.getAudioTracks()[index].enabled = !localStream
      .getAudioTracks()[index].enabled;
    muteButton.innerText = localStream.getAudioTracks()[index].enabled
      ? micUnmute : micMute
  }
};
fork.toggleVid = () => {
  for (const index in localStream.getVideoTracks()) {
    localStream.getVideoTracks()[index].enabled = !localStream
      .getVideoTracks()[index].enabled;
    vidButton.innerText = localStream.getVideoTracks()[index].enabled
      ? videoEnabledIcon : videoDisabledIcon
  }
};
function updateButtons() {
  for (const index in localStream.getVideoTracks()) {
    vidButton.innerText = localStream.getVideoTracks()[index].enabled
      ? videoDisabledIcon
      : videoEnabledIcon
  }
  for (const index in localStream.getAudioTracks()) {
    muteButton.innerText = localStream.getAudioTracks()[index].enabled
      ? micMute
      : micUnmute
  }
}

fork.inviteFriend = () => {
  const url = window.location.origin + "/?invite=" + info.room;
  const input = document.createElement("input");
  input.setAttribute("value", url);
  document.body.appendChild(input);
  input.select();
  const result = document.execCommand("copy");
  document.body.removeChild(input);
  if (result) {
    alert("Link was copied to clipboard");
  }
};
chatForm.onsubmit = (e) => {
  e.preventDefault();
  if (!chatInput.value) {
    return;
  }
  ws.send(JSON.stringify({
    type: "chat",
    data: { id: info.id, message: chatInput.value },
  }));
  chatMessage.innerHTML += `
    <div class="chat-message">
      <b>Me: </b>${chatInput.value}
    </div>
  `;
  chatInput.value = "";
  chatMessage.scrollTop = chatMessage.scrollHeight;
};

if (token) {
  meetElement.style.display = "block";
  navigator.mediaDevices.getUserMedia(constraints)
    .then(function (stream) {
      init(token, stream);
    })
    .catch(function (err) {
      alert(`getusermedia error ${err.name}`);
    });
} else {
  window.location.href = "./";
}
