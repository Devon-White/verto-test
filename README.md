# SignalWire Verto Call Test Harness

A browser-based test harness for making and receiving WebRTC calls via SignalWire's Relay SDK. The Express server handles authentication so no credentials are exposed to the browser.

## How It Works

### Architecture

```
Browser (index.html)  <-->  Express Server (server.js)  <-->  SignalWire API
```

1. **Authentication** is handled server-side. The browser only needs a **resource name** (an identifier for this browser endpoint). When you click Connect, the server requests a short-lived JWT from SignalWire and returns it to the browser along with the project ID.

2. **Making calls** works through the Relay JS SDK running in the browser. Once connected, you can dial other browsers, SIP endpoints, or phone numbers.

3. **Test Receiving Call** triggers the server to place an inbound call to your browser via SignalWire's LaML REST API. The call is directed to `verto:<resource>@<space>.verto.signalwire.com` and uses a cXML webhook hosted on the server that plays a short test message.

### Server Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/token` | POST | Generates a JWT for the given resource name. Body: `{ "resource": "name" }` |
| `/api/test-call` | POST | Initiates an inbound call to the given resource. Body: `{ "resource": "name" }` |
| `/api/cxml` | GET/POST | Returns cXML instructions for the test call (used as a webhook by SignalWire) |

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- A [SignalWire](https://signalwire.com/) account with a project
- A public URL for the cXML webhook (e.g. [ngrok](https://ngrok.com/))

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your SignalWire credentials:

   | Variable | Description |
   |---|---|
   | `SIGNALWIRE_PROJECT_ID` | Your project ID from the SignalWire dashboard |
   | `SIGNALWIRE_API_TOKEN` | Your API token from the SignalWire dashboard |
   | `SIGNALWIRE_SPACE` | Your space name (e.g. `example` from `example.signalwire.com`) |
   | `PUBLIC_URL` | A publicly accessible URL pointing to this server (for the cXML webhook) |

3. **Expose your server publicly** (required for Test Receiving Call)

   ```bash
   ngrok http 9898
   ```

   Copy the `https://...ngrok...` URL into `PUBLIC_URL` in your `.env`.

4. **Start the server**

   ```bash
   node server.js
   ```

5. **Open the harness**

   Navigate to [http://localhost:9898/index.html](http://localhost:9898/index.html)

## Usage

### Connecting

1. Enter a **Resource Name** (any string to identify this browser endpoint, e.g. `my-browser`)
2. Click **Connect**
3. The status will show "Connected" once the Relay client is ready

### Making an Outbound Call

1. Enter a destination in **Call To** (a phone number, SIP address, or another resource name)
2. Enter a caller ID number in **Call From**
3. Toggle **Audio** and **Video** as needed
4. Click **Call**

### Testing an Inbound Call

1. After connecting, click **Test Receiving Call**
2. The server will place a call to your browser via SignalWire's REST API
3. A browser prompt will ask you to pick up the call
4. You'll hear a test message confirming the connection works

### DTMF

While on an active call, use the DTMF keypad buttons (0-9, #, *, A-D) to send tones.
