# EventPro — Bkash Integration (demo)

This repository contains a simple static landing page and a small Express backend that demonstrates how to connect a payment flow (Bkash) in a secure way.

Quick start (Windows / PowerShell):

1. Install dependencies

```powershell
cd "c:\Users\DIU\Downloads\My Project"
npm install
```

2. Start the server

```powershell
npm run dev
```

3. Open the site via the demo server so the frontend can call the API:

```powershell
# after starting the server
Start-Process "http://localhost:4000/index.html"
```

How this demo works:
- The frontend opens a payment modal and calls `POST /api/pay` on this backend.
- The backend creates an in-memory order and (in this demo) simulates a Bkash provider reference.

To connect to real Bkash APIs:
- Populate `.env` (copy `.env.example`) with your Bkash sandbox/production base URL and credentials.
- Replace or extend the `createBkashPayment` and `getBkashToken` functions in `server.js` with the real request flows described in Bkash docs.
- Keep all secrets server-side and implement webhooks/callbacks to update order status when Bkash confirms payments.

This demo already includes a scaffolded server (`server.js`) that:
- Persists orders to a local `data.db` SQLite database.
- Creates a provider reference for Bkash in the order payload (simulated if env vars are missing).
- Exposes an admin page at `http://localhost:4000/admin.html` to view and mark orders paid.

If you'd like, provide your sandbox credentials and I can finish wiring `getBkashToken` and `createBkashPayment` to call the real endpoints.
