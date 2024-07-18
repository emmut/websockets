import type { ServerWebSocket } from "bun";
import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";

const { upgradeWebSocket, websocket } = createBunWebSocket();

const app = new Hono();
const messages: string[] = [];

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    return {
      onOpen(_event, ws) {
        (ws.raw as ServerWebSocket).subscribe("chat");

        ws.send(JSON.stringify(messages));
      },
      onMessage(event, ws) {
        const message = event.data.toString();
        messages.push(message);
        ws.send(JSON.stringify([message]));
        (ws.raw as ServerWebSocket).publish("chat", JSON.stringify([message]));
      },
      onClose(_event, ws) {
        (ws.raw as ServerWebSocket).unsubscribe("chat");
      },
    };
  })
);

Bun.serve({
  fetch: app.fetch,
  websocket,
  port: 3000,
});

Bun.serve({
  async fetch(req) {
    console.log(req.url);
    const index = await Bun.file("index.html");
    return new Response(index);
  },
  port: 8080,
  websocket: {
    message(ws) {
      ws.send("Hello from Bun!");
    },
  },
});
