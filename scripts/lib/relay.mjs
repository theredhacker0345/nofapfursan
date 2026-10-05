/**
 * A minimal in-process Nostr relay, enough of NIP-01 to exercise the chat path.
 *
 * Public relays are unreachable from a sandbox, so Vanguard's send / receive /
 * retry behaviour could not otherwise be tested at all. Implements:
 *   ["REQ", <subId>, <filter>...]   → ["EVENT", <subId>, <event>]… ["EOSE", <subId>]
 *   ["EVENT", <event>]              → ["OK", <id>, true|false, ""]
 *   ["CLOSE", <subId>]
 *
 * Matching covers only what the app actually sends: authors, kinds, ids, #e, #t.
 */
import { createServer } from "node:http";
import { createHash } from "node:crypto";

const match = (filter, event) => {
  if (filter.kinds && !filter.kinds.includes(event.kind)) return false;
  if (filter.authors && !filter.authors.includes(event.pubkey)) return false;
  if (filter.ids && !filter.ids.includes(event.id)) return false;
  for (const [key, value] of Object.entries(filter)) {
    if (!key.startsWith("#") || !Array.isArray(value)) continue;
    const name = key.slice(1);
    if (!value.length) continue;
    // `#e` and `#p` match a tag by its first value; anything else is positional.
    const hit = (event.tags ?? []).some((t) =>
      name === "e" || name === "p" ? t[0] === name && value.includes(t[1]) : value.includes(t[1]),
    );
    if (!hit) return false;
  }
  return true;
};

/**
 * @param {{ port: number, reject?: boolean, silent?: boolean }} options
 *   `reject` answers every EVENT with OK:false — exercises the failure path.
 *   `silent` accepts writes but never pushes EVENT frames back.
 */
export const startRelay = async ({ port, reject = false, silent = false }) => {
  const stored = [];
  const received = [];
  const sockets = new Set();
  const subscriptions = new Map();
  const server = createServer();

  const debug = (dir, data) => {
    if (process.env.RELAY_DEBUG) console.log(`[relay] ${dir}`, JSON.stringify(data).slice(0, 200));
  };

  server.on("upgrade", (req, socket) => {
    // Minimal RFC 6455 handshake — no permessage-deflate, no extensions.
    const key = req.headers["sec-websocket-key"];
    const accept = createHash("sha1")
      .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
      .digest("base64");
    socket.write(
      "HTTP/1.1 101 Switching Protocols\r\n" +
        "Upgrade: websocket\r\n" +
        "Connection: Upgrade\r\n" +
        `Sec-WebSocket-Accept: ${accept}\r\n\r\n`,
    );
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    socket.on("error", () => sockets.delete(socket));

    let buffer = Buffer.alloc(0);

    socket.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      for (;;) {
        const frame = decode(buffer);
        if (!frame) break;
        buffer = buffer.subarray(frame.length);

        if (frame.opcode === 0x8) {
          socket.end();
          return;
        }
        if (frame.opcode === 0x9) {
          socket.write(Buffer.from([0x8a, 0])); // pong
          continue;
        }
        if (frame.opcode !== 0x1) continue; // text frames only

        let message;
        try {
          message = JSON.parse(frame.payload.toString("utf8"));
        } catch {
          continue;
        }
        debug("<-", message);
        handle(message, socket);
      }
    });
  });

  const send = (socket, data) => {
    if (socket.destroyed) return;
    debug("->", data);
    const payload = Buffer.from(JSON.stringify(data), "utf8");
    const length = payload.length;
    let header;
    if (length < 126) {
      header = Buffer.from([0x81, length]);
    } else if (length < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 126;
      header.writeUInt16BE(length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(length), 2);
    }
    socket.write(Buffer.concat([header, payload]));
  };

  const handle = (message, socket) => {
    if (!Array.isArray(message)) return;
    const [verb, ...rest] = message;

    if (verb === "EVENT") {
      const event = rest[0];
      received.push(event);
      if (reject) {
        send(socket, ["OK", event?.id ?? "", false, "blocked: test relay"]);
        return;
      }
      if (!stored.some((e) => e.id === event?.id)) stored.push(event);
      send(socket, ["OK", event.id, true, ""]);
      if (silent) return;
      for (const [subId, filters] of subscriptions) {
        if (filters.some((f) => match(f, event))) send(socket, ["EVENT", subId, event]);
      }
      return;
    }

    if (verb === "REQ") {
      const [subId, ...filters] = rest;
      subscriptions.set(subId, filters);
      if (!silent) {
        for (const event of stored) {
          if (filters.some((f) => match(f, event))) send(socket, ["EVENT", subId, event]);
        }
      }
      send(socket, ["EOSE", subId]);
      return;
    }

    if (verb === "CLOSE") subscriptions.delete(rest[0]);
  };

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });

  return {
    /** Injects an event as if another client had published it. */
    inject(event) {
      if (!stored.some((e) => e.id === event.id)) stored.push(event);
      if (silent) return;
      for (const [subId, filters] of subscriptions) {
        if (!filters.some((f) => match(f, event))) continue;
        for (const socket of sockets) send(socket, ["EVENT", subId, event]);
      }
    },
    /** Everything published through this relay. */
    received,
    stored,
    subscriptionCount: () => subscriptions.size,
    close() {
      for (const socket of sockets) socket.destroy();
      sockets.clear();
      server.close();
    },
    url: `ws://127.0.0.1:${port}`,
  };
};

/** Decodes one unmasked-or-masked client frame. Returns null if incomplete. */
function decode(buffer) {
  if (buffer.length < 2) return null;
  const opcode = buffer[0] & 0x0f;
  const masked = (buffer[1] & 0x80) !== 0;
  let length = buffer[1] & 0x7f;
  let offset = 2;

  if (length === 126) {
    if (buffer.length < 4) return null;
    length = buffer.readUInt16BE(2);
    offset = 4;
  } else if (length === 127) {
    if (buffer.length < 10) return null;
    length = Number(buffer.readBigUInt64BE(2));
    offset = 10;
  }

  let mask;
  if (masked) {
    if (buffer.length < offset + 4) return null;
    mask = buffer.subarray(offset, offset + 4);
    offset += 4;
  }
  if (buffer.length < offset + length) return null;

  const payload = Buffer.from(buffer.subarray(offset, offset + length));
  if (mask) for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i % 4];

  return { opcode, payload, length: offset + length };
}