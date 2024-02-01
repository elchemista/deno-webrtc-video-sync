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

let isProgrammaticChange = false; // Flag to indicate programmatic change

function sendVideoControlMessage(type, currentTime) {
  if (!isProgrammaticChange) {
    const message = {
      type: "videoControl",
      data: { controlType: type, time: currentTime }
    };
    ws.send(JSON.stringify(message));
  }
}

// Event listeners for the video player
videoPlayer.addEventListener('play', () => {
  if (!isProgrammaticChange) {
    sendVideoControlMessage('play', videoPlayer.currentTime);
  }
});
videoPlayer.addEventListener('pause', () => {
  if (!isProgrammaticChange) {
    sendVideoControlMessage('pause', videoPlayer.currentTime);
  }
});


function handleVideoControl(data) {
  isProgrammaticChange = true; // Set flag to indicate programmatic change

  switch (data.controlType) {
    case 'play':
      videoPlayer.currentTime = data.time;
      videoPlayer.play().then(() => {
        isProgrammaticChange = false; // Reset flag after operation
      }).catch(error => {
        console.error("Error attempting to play video:", error);
        isProgrammaticChange = false; // Ensure flag is reset even if there's an error
      });
      break;
    case 'pause':
      videoPlayer.currentTime = data.time;
      videoPlayer.pause();
      isProgrammaticChange = false; // Reset flag
      break;
  }
}


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
fork.changeVideoSource = () => {
  const newUrl = prompt("Enter the URL of the video:");
  if (newUrl) {
    const videoElement = document.getElementById('videoPlayer');
    videoElement.className = "rounded-lg"
    if (videoElement) {
      const sourceElement = videoElement.querySelector('source');
      sourceElement.setAttribute('src', newUrl);
      sourceElement.setAttribute('class', "rounded-lg");
      videoElement.load();
      videoElement.play();
    } else {
      alert('Video player not found');
    }
  }
};

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
  });
};

fork.closeChat = () => chatbox.style.display = "none";

function setVideoDimensions() {
  const maxUsersInRow = 4;
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
      document.getElementById("me").innerHTML = `${data.id}`;
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
        peers[data.id].signal(data.signal);
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
}

function appendChatMessage({ id, message }) {
  chatMessage.innerHTML += `<div class="chat-message"><b>${id.split("@")[0]}: </b>${message}</div>`;
}


function removePeer(id) {
  const videosDiv = document.getElementById("videos");
  const videoEl = document.getElementById(id);
  const videoContainer = document.getElementById(`container-${id}`);
  if (videoEl && videosDiv.contains(videoEl)) { // Check if videosDiv actually contains videoEl
    videoEl.srcObject.getTracks().forEach(track => track.stop());
    videoEl.srcObject = null;
    videosDiv.removeChild(videoContainer); // Now safe to remove
  }
  if (peers[id]) peers[id].destroy();
  delete peers[id];
  setVideoDimensions();
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
    let videoEl = document.getElementById(id);
    if (!videoEl) {
      // If video element does not exist, create it
      videoEl = createVideoElement(id, stream);
    } else {
      // If video element already exists, just update the stream
      videoEl.srcObject = stream;
    }
    setVideoDimensions();
  });
}

self.addEventListener('resize', setVideoDimensions);

function createVideoElement(id, stream) {
  const videoContainer = document.createElement("div");
  videoContainer.id = `container-${id}`;
  videoContainer.className = "container m-1 text-center justify-center";

  const newVideo = document.createElement("video");
  newVideo.srcObject = stream;
  newVideo.id = id;
  newVideo.autoplay = true;
  newVideo.playsInline = true;
  newVideo.className = "opacity-25 rounded-xl bg-blue-gray-500 bg-clip-border text-white shadow-lg shadow-blue-gray-500/40";
  newVideo.onclick = () => openPictureMode(newVideo, id);
  newVideo.ontouchstart = () => openPictureMode(newVideo, id);

  const idDisplay = document.createElement("div");
  idDisplay.className = "opacity-25 p-1 text-center rounded-xl bg-white bg-clip-border text-gray-700 shadow-md";
  const idSpan = document.createElement("span");
  idSpan.className = "block text-center font-sans text-md font-semibold leading-snug tracking-normal text-blue-gray-900 antialiased";
  idSpan.textContent = id;
  idDisplay.appendChild(idSpan);

  videoContainer.appendChild(newVideo);
  videoContainer.appendChild(idDisplay);

  const videosDiv = document.getElementById("videos");
  videosDiv.appendChild(videoContainer);

  return newVideo;
}


function openPictureMode(el, id) {
  el.requestPictureInPicture();
  el.onleavepictureinpicture = () => setTimeout(() => document.getElementById(id).play(), 300);
}

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
  updateButtons();
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
  const button = isAudio ? micMute : micUnmute; // Assuming vidButton is your video toggle button

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
  updateButtons()
}

function updateButtons() {
  const videoTrack = localStream.getVideoTracks()[0];
  vidButton.innerHTML = videoTrack.enabled ? videoEnabledIcon : videoDisabledIcon;

  muteButton.innerHTML = localStream.getAudioTracks()[0].enabled ? micMute : micUnmute;
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
