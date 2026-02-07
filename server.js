require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = 9898;

const { SIGNALWIRE_PROJECT_ID, SIGNALWIRE_API_TOKEN, SIGNALWIRE_SPACE, PUBLIC_URL, SIGNALWIRE_FROM_NUMBER } = process.env;

if (!SIGNALWIRE_PROJECT_ID || !SIGNALWIRE_API_TOKEN || !SIGNALWIRE_SPACE || !PUBLIC_URL || !SIGNALWIRE_FROM_NUMBER) {
  console.error("Missing required env vars. Copy .env.example to .env and fill in your credentials.");
  process.exit(1);
}

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post("/api/token", async (req, res) => {
  const { resource } = req.body;
  if (!resource) {
    return res.status(400).json({ error: "resource is required" });
  }

  const url = `https://${SIGNALWIRE_SPACE}.signalwire.com/api/relay/rest/jwt`;
  const auth = Buffer.from(`${SIGNALWIRE_PROJECT_ID}:${SIGNALWIRE_API_TOKEN}`).toString("base64");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({ resource, expires_in: 120 }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("SignalWire API error:", response.status, text);
      return res.status(502).json({ error: "Failed to generate token" });
    }

    const data = await response.json();
    console.log("JWT token response:", JSON.stringify(data, null, 2));
    res.json({ project_id: SIGNALWIRE_PROJECT_ID, token: data.jwt_token });
  } catch (err) {
    console.error("Token request failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/test-call", async (req, res) => {
  const { resource } = req.body;
  if (!resource) {
    return res.status(400).json({ error: "resource is required" });
  }

  const url = `https://${SIGNALWIRE_SPACE}.signalwire.com/api/laml/2010-04-01/Accounts/${SIGNALWIRE_PROJECT_ID}/Calls`;
  const auth = Buffer.from(`${SIGNALWIRE_PROJECT_ID}:${SIGNALWIRE_API_TOKEN}`).toString("base64");

  try {
    console.log(`Initiating test call to verto:${resource}...`);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: new URLSearchParams({
        To: `verto:${resource}@${SIGNALWIRE_SPACE}.verto.signalwire.com`,
        From: SIGNALWIRE_FROM_NUMBER,
        Url: `${PUBLIC_URL}/api/cxml`,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("SignalWire Call API error:", response.status, text);
      return res.status(502).json({ error: "Failed to initiate test call" });
    }

    const data = await response.json();
    res.json({ success: true, call_sid: data.sid });
  } catch (err) {
    console.error("Test call request failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.all("/api/cxml", (req, res) => {
  res.type("text/xml");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>This is a test call from your SignalWire.</Say>
  <Pause length="60"/>
</Response>`);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/index.html`);
});
