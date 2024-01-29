import { Handler, HttpError } from "./deps.ts";

type TAny = any;

const decoder = new TextDecoder();
const encoder = new TextEncoder();
const peers = {} as TAny;
const MAX_USER = 2;
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 3000;

let retryCount = 0;

const wsSend = (ws: WebSocket, data: Record<string, TAny>, retryCount = 0) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  } else if (retryCount < MAX_RETRIES) {
    setTimeout(() => {
      wsSend(ws, data, retryCount + 1);
    }, RETRY_INTERVAL);
  } else {
    console.error("Max WebSocket retries reached.");
  }
};

const tryDecode = (str: string) => {
  try {
    const uint = Uint8Array.from(atob(str).split(",") as Iterable<number>);
    return JSON.parse(decoder.decode(uint));
  } catch (_e) {
    throw new HttpError(400, "Invalid token");
  }
};

const middleware: Handler = (rev, next) => {
  if (rev.request.headers.get("upgrade") != "websocket") {
    throw new HttpError(400, "Protocol not supported");
  }
  rev.user = tryDecode(rev.params.token);
  return next();
};

const handler: Handler = ({ request, user }) => {
  const { socket, response } = Deno.upgradeWebSocket(request);
  const { id, room } = user;
  peers[room] = peers[room] || {};
  socket.onopen = () => {
    if (!id && !room) {
      wsSend(socket, {
        type: "errorToken",
        data: {},
      });
    } else if (Object.keys(peers[room] || {}).length >= MAX_USER) {
      wsSend(socket, {
        type: "full",
        data: {},
      });
    } else {
      wsSend(socket, {
        type: "opening",
        data: { id, room },
      });
      peers[room][id] = socket;
      for (const _id in peers[room]) {
        if (_id !== id) {
          wsSend(peers[room][_id], {
            type: "initReceive",
            data: { id },
          });
        }
      }
    }
  };
  socket.onmessage = (e) => {
    const { type, data } = JSON.parse(e.data);

    if (type === "videoControl") {
      // Broadcast video control messages to all peers in the room
      for (const _id in peers[room]) {
        if (_id !== id) {
          wsSend(peers[room][_id], {
            type: "videoControl",
            data: data,
          });
        }
      }
    }
    
    if (type === "signal") {
      if (!peers[room][data.id]) return;
      wsSend(peers[room][data.id], {
        type: "signal",
        data: { id, signal: data.signal },
      });
    } else if (type === "initSend") {
      wsSend(peers[room][data.id], {
        type: "initSend",
        data: { id },
      });
    } else if (type === "chat") {
      for (const _id in peers[room]) {
        if (_id !== id) {
          wsSend(peers[room][_id], {
            type: "chat",
            data: { id, message: data.message },
          });
        }
      }
    }
  };
  socket.onclose = () => {
    for (const _id in peers[room]) {
      if (_id !== id) {
        wsSend(peers[room][_id], {
          type: "removePeer",
          data: { id },
        });
      } else {
        delete peers[room][_id];
      }
    }
    if (Object.keys(peers[room] || {}).length === 0) {
      delete peers[room];
    }
  };
  return response;
};

export const wsHandlers: Handler[] = [middleware, handler];
export const wsLogin: Handler = ({ body }) => {
  const { id, room } = body;
  if (peers[room]?.[id]) {
    throw new HttpError(400, "User " + id + " already exist");
  }
  if (Object.keys(peers[room] ?? {}).length >= MAX_USER) {
    throw new HttpError(400, "Room " + room + " full");
  }
  const token = btoa(encoder.encode(JSON.stringify(body)).toString());
  return { token };
};
