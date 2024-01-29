const fork = window;
const meetElement = document.getElementById("meet");
const chatInput = document.getElementById("chatInput");
const chatbox = document.getElementById("chatbox");
const chatMessage = document.getElementById("chatMessage");
const chatForm = document.getElementById("chatForm");
const token = localStorage.getItem("meet_token");
const isHttps = window.location.href.startsWith("https");
const isDev = window.__DEV__ ?? false;
let ws, localStream = null, peers = {}, info = {};
const configuration = { "iceServers": [{ "urls": "stun:stun.l.google.com:19302" }, { "urls": "stun:stun1.l.google.com:19302" }, { "urls": "stun:stun2.l.google.com:19302" }, { "urls": "stun:stun3.l.google.com:19302" }, { "urls": "stun:stun4.l.google.com:19302" }] };
const constraints = {
  audio: true,
  video: {
    width: { ideal: 150, max: 300 }, // Setting an ideal width but allowing a higher maximum
    height: { ideal: 150, max: 300 }, // Setting an ideal height but allowing a higher maximum
    facingMode: { ideal: "user" }
  }
};

const localVideo = document.getElementById("localVideo"); // Ensure this ID matches your video element

const videoPlayer = document.getElementById('videoPlayer');

function sendVideoControlMessage(type, currentTime) {
  const message = {
    type: "videoControl",
    data: { controlType: type, time: currentTime }
  };
  ws.send(JSON.stringify(message));
}

// Event listeners for the video player
videoPlayer.addEventListener('play', () => sendVideoControlMessage('play', videoPlayer.currentTime));
videoPlayer.addEventListener('pause', () => sendVideoControlMessage('pause', videoPlayer.currentTime));
videoPlayer.addEventListener('seeked', () => sendVideoControlMessage('seek', videoPlayer.currentTime));


meetElement.style.display = token ? "block" : "none";
if (!token) window.location.href = "./";
if (!isDev && !isHttps) window.location.href = "https://" + window.location.href.replace("http://", "");

fork.logout = () => {
  localStorage.removeItem("meet_token");
  setTimeout(() => window.location.href = "./", 300);
};
fork.openChat = () => {
  chatbox.style.display = "block";
  setTimeout(() => chatInput.focus(), 300);
};
fork.closeChat = () => chatbox.style.display = "none";

function setVideoDimensions() {
  const maxUsersInRow = 2;
  const userCount = Object.keys(peers).length + 1; // Include local user
  const screenWidth = window.innerWidth;
  const availableWidth = Math.min(screenWidth, 150 * maxUsersInRow);
  const userWidth = Math.min(availableWidth / Math.min(userCount, maxUsersInRow), 150);
  const userHeight = userWidth * (9 / 16); // Assuming 16:9 aspect ratio

  // Apply dimensions to local video
  if (localVideo) {
      localVideo.style.width = `${userWidth}px`;
      localVideo.style.height = `${userHeight}px`;
  }

  // Apply dimensions to peer videos
  Object.keys(peers).forEach(peerId => {
      const videoEl = document.getElementById(peerId);
      if (videoEl) {
          videoEl.style.width = `${userWidth}px`;
          videoEl.style.height = `${userHeight}px`;
      }
  });
}

function handleVideoControl(data) {
  switch (data.controlType) {
    case 'play':
      videoPlayer.currentTime = data.time;
      videoPlayer.play();
      break;
    case 'pause':
      videoPlayer.currentTime = data.time;
      videoPlayer.pause();
      break;
    case 'seek':
      videoPlayer.currentTime = data.time;
      break;
  }
}

function init(token, stream) {
  ws = new WebSocket((isHttps ? "wss" : "ws") + "://" + window.location.host + "/ws/" + token);
  ws.onclose = () => Object.keys(peers).forEach(removePeer);
  ws.onmessage = e => handleMessage(JSON.parse(e.data), stream);
}

function handleMessage({ type, data }, stream) {
  switch (type) {
    case "initReceive":
      addPeer(data.id, false);
      ws.send(JSON.stringify({ type: "initSend", data }));
      break;
    case "opening":
      setupLocalStream(stream, data);
      break;
    case "initSend":
      addPeer(data.id, true);
      break;
    case "removePeer":
      removePeer(data.id);
      break;
    case "videoControl":
      handleVideoControl(data);
      break;
    case "signal":
      if (peers[data.id] && !peers[data.id].destroyed) {
        try {
          peers[data.id].signal(data.signal);
        } catch (error) {
          if (error.name === "InvalidStateError") {
            console.error("Signal error: Peer is in an invalid state", error);
            // Handle the error, possibly by ignoring this signal or resetting the peer connection
          } else {
            throw error; // Re-throw errors that are not handled here
          }
        }
      }
      break;
    case "full":
      alert("Room FULL");
      break;
    case "errorToken":
      fork.logout();
      break;
    case "chat":
      appendChatMessage(data);
      fork.openChat();
      break;
  }
}

function setupLocalStream(stream, data) {
  localVideo.srcObject = localStream = stream;
  info = data;
  // document.getElementById("settings").style.display = "inline-block";
}

function appendChatMessage({ id, message }) {
  chatMessage.innerHTML += `<div class="chat-message"><b>${id.split("@")[0]}: </b>${message}</div>`;
}

function removePeer(id) {
  const videoEl = document.getElementById(id), colEl = document.getElementById("col-" + id);
  if (colEl && videoEl) {
    videoEl.srcObject.getTracks().forEach(track => track.stop());
    videoEl.srcObject = null;
    videos.removeChild(colEl);
  }
  if (peers[id]) peers[id].destroy();
  delete peers[id];
  setVideoDimensions();
}

function addPeer(id, am_initiator) {
  peers[id] = new SimplePeer({ initiator: am_initiator, stream: localStream, config: configuration });
  peers[id].on("signal", data => ws.send(JSON.stringify({ type: "signal", data: { signal: data, id } })));
  peers[id].on("stream", (stream) => {
    createVideoElement(id, stream)
    setVideoDimensions();
  });
}

self.addEventListener('resize', setVideoDimensions);

function createVideoElement(id, stream) {
  const col = document.createElement("col"), newVid = document.createElement("video"), user = document.createElement("div");
  col.id = "col-" + id; col.className = "container";
  newVid.srcObject = stream; newVid.id = id; newVid.playsinline = false; newVid.autoplay = true; newVid.className = "vid";
  newVid.onclick = newVid.ontouchstart = () => openPictureMode(newVid, id);
  user.className = "overlay-text"; user.innerHTML = id;
  col.append(newVid, user);
  videos.appendChild(col);
}

function openPictureMode(el, id) {
  el.requestPictureInPicture();
  el.onleavepictureinpicture = () => setTimeout(() => document.getElementById(id).play(), 300);
}

fork.switchMedia = switchCameraOrScreen.bind(null, constraints, "getUserMedia", updateButtons);

fork.shareScreen = switchCameraOrScreen.bind(null, {}, "getDisplayMedia", (newStream) => {
  // Use newStream here
  newStream.getVideoTracks()[0].onended = () => {
    fork.switchMedia();
    addPeer(info.id, false);
  };
});

function switchCameraOrScreen(constraints, method, callback) {
  if (method === "getUserMedia") {
    constraints.video.facingMode.ideal = constraints.video.facingMode.ideal === "user" ? "environment" : "user";
  }
  stopTracks(localStream);
  navigator.mediaDevices[method](constraints).then(newStream => {
    replaceTracks(newStream);
    localStream = newStream;
    localVideo.srcObject = newStream;
    callback(newStream); // Pass newStream as an argument
  });
}

function stopTracks(stream) {
  stream && stream.getTracks().forEach(track => track.stop());
}

function replaceTracks(stream) {
  Object.values(peers).forEach(peer => {
    if (peer.destroyed) return; // Add this check

    peer.streams[0].getTracks().forEach(track => {
      stream.getTracks().forEach(newTrack => {
        if (track.kind === newTrack.kind) {
          peer.replaceTrack(track, newTrack, peer.streams[0]);
        }
      });
    });
  });
}


fork.removeLocalStream = () => {
  stopTracks(localStream);
  localVideo.srcObject = null;
  Object.keys(peers).forEach(removePeer);
};

const videoDisabledIcon = `<svg class="w-6 h-6 text-red-800 dark:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`;
const videoEnabledIcon = ` <svg class="w-6 h-6 text-gray-800 dark:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`

const micMute = `<svg class="w-6 h-6 text-red-800 dark:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`
const micUnmute = `<svg class="w-6 h-6 text-red-800 dark:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`

fork.toggleMute = toggleMedia.bind(null, "getAudioTracks", micUnmute, micMute);
fork.toggleVid = toggleMedia.bind(null, "getVideoTracks", videoEnabledIcon, videoDisabledIcon);

function toggleMedia(trackType, onIcon, offIcon) {
  const isAudio = trackType === "getAudioTracks";
  const button = isAudio ? muteButton : vidButton; // Assuming vidButton is your video toggle button

  localStream[trackType]().forEach(track => {
    track.enabled = !track.enabled;
    button.innerHTML = track.enabled ? onIcon : offIcon;

    // For video tracks, toggle the 'hidden' class on the local video element
    if (!isAudio) {
      if (localVideo) {
        if (track.enabled) {
          localVideo.classList.remove('hidden');
        } else {
          localVideo.classList.add('hidden');
        }
      }
    }
  });
}


function updateButtons() {
  const videoTrack = localStream.getVideoTracks()[0];
  vidButton.innerHTML = videoTrack.enabled ? videoEnabledIcon : videoDisabledIcon;

  muteButton.innerText = localStream.getAudioTracks()[0].enabled ? micUnmute : micMute;
}

fork.inviteFriend = () => {
  const url = window.location.origin + "/?invite=" + info.room;
  const input = document.createElement("input");
  input.value = url;
  document.body.appendChild(input);
  input.select();
  if (document.execCommand("copy")) alert("Link was copied to clipboard");
  document.body.removeChild(input);
};

chatForm.onsubmit = e => {
  e.preventDefault();
  if (chatInput.value) {
    ws.send(JSON.stringify({ type: "chat", data: { id: info.id, message: chatInput.value } }));
    appendChatMessage({ id: "Me", message: chatInput.value });
    chatInput.value = "";
    chatMessage.scrollTop = chatMessage.scrollHeight;
  }
};


if (token) {
  navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        init(token, stream);
        setVideoDimensions();
    })
    .catch(err => alert(`getusermedia error ${err.name}`));
}
