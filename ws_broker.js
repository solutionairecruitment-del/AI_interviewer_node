// Install dependencies before running:
// npm install ws

const WebSocket = require("ws");
const PORT = 8080;

// WebSocket server
const wss = new WebSocket.Server({ port: PORT }, () => {
  console.log(` WS Broker running on ws://localhost:${PORT}`);
});

// Store connections
let unrealClient = null; // Unreal Engine connection
let reactClients = []; // React app connections

wss.on("connection", (ws) => {
  console.log(" New WebSocket connection established");

  // When a client sends a message
  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      // Identify Unreal Engine client
      if (data.type === "registerUnreal") {
        unrealClient = ws;
        console.log(" Unreal Engine connected");
        ws.send(
          JSON.stringify({ type: "info", message: "Registered as Unreal" })
        );
        return;
      }

      // Identify React client
      if (data.type === "registerReact") {
        reactClients.push(ws);
        console.log(" React client connected");
        ws.send(
          JSON.stringify({ type: "info", message: "Registered as React" })
        );
        return;
      }

      // React sends playAudio command to Unreal
      if (
        data.type === "playAudio" &&
        unrealClient &&
        unrealClient.readyState === WebSocket.OPEN
      ) {
        console.log(` Sending audio URL to Unreal: ${data.url}`);
        unrealClient.send(JSON.stringify({ type: "playAudio", url: data.url }));
        return;
      }

      // Unreal sends status update → Forward to all React clients
      if (data.type === "statusUpdate") {
        console.log(` Status from Unreal: ${data.message}`);
        reactClients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({ type: "statusUpdate", message: data.message })
            );
          }
        });
      }
    } catch (err) {
      console.error(" Error parsing message:", err);
    }
  });

  // Remove client when disconnected
  ws.on("close", () => {
    if (ws === unrealClient) {
      unrealClient = null;
      console.log("Unreal Engine disconnected");
    } else {
      reactClients = reactClients.filter((client) => client !== ws);
      console.log("React client disconnected");
    }
  });
});
