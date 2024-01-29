let room

function initFingerPrint() {
    const fp = new Fingerprint({
        canvas: true,
        ie_activex: true,
        screen_resolution: true
      });
      
    const uid = fp.get();
    console.log('FingerprintJS visitor ID:', uid);
    initializeChatRoom(uid);
}

function initializeChatRoom(fingerprintId) {
    const $ = (v) => document.querySelector(v);
    const token = localStorage.getItem("meet_token");
    const inviteroom = extractInviteFromURL();

    $("#home").style.display = token ? "none" : "block";
    if (token) {
        window.location.href = "./meet";
    } else {
        initializeRoom(inviteroom);
        $("#form").onsubmit = (e) => {
            e.preventDefault();
            joinOrCreateRoom(fingerprintId);
        };
    }
}

function extractInviteFromURL() {
    const search = window.location.search;
    return search.startsWith("?invite=") ? search.replace("?invite=", "") : null;
}

function initializeRoom(inviteroom) {
    room = inviteroom ? inviteroom : generateRoomToken();
    if (inviteroom) {
        setTimeout(() => room = inviteroom, 300);
    }
}

function generateRoomToken() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

async function joinOrCreateRoom(fingerprintId) {
    const $ = (v) => document.querySelector(v);
    try {
        const data = await sendJoinOrCreateRequest(fingerprintId, room);
        localStorage.setItem("meet_token", data.token);
        window.location.href = "./meet";
    } catch (err) {
        handleJoinOrCreateError(err);
    }
}

function sendJoinOrCreateRequest(visitorId, room) {
    return fetch("./api/join-or-create", {
        method: "POST",
        body: JSON.stringify({ id: visitorId, room }),
    }).then(response => {
        if (!response.ok) throw response;
        return response.json();
    });
}

function handleJoinOrCreateError(err) {
    console.error(err);
    err.json().then((data) => alert(data.message));
}

// Initialize FingerprintJS and the chat room logic when the script loads
initFingerPrint();
