# LivePoll — Real-Time Polling App

A full-stack web application that lets users create polls, share them via unique links, and collect votes with real-time result updates for all viewers.

**Live App:** [https://live-poll-xi.vercel.app](https://live-poll-xi.vercel.app)  
**Source Code:** [https://github.com/animeshlego5/LivePoll](https://github.com/animeshlego5/LivePoll)

---

## Tech Stack

| Layer     | Technology                          |
| --------- | ----------------------------------- |
| Frontend  | React 19, Vite, React Router       |
| Backend   | Node.js, Express                    |
| Real-Time | Socket.IO (WebSocket)               |
| Database  | MongoDB Atlas (Mongoose ODM)        |
| Hosting   | Vercel (Frontend), Render (Backend) |

---

## Features

### 1. Poll Creation
- Users can create a poll with a question and 2–8 options.
- After creation, the user is immediately redirected to the poll page with a shareable URL.

### 2. Join by Link
- Anyone with the poll URL (`/poll/:id`) can view the poll and cast a single vote.
- The share link is persistent — it continues to work across sessions and devices.

### 3. Real-Time Results
- Powered by **Socket.IO** WebSockets.
- When any user votes, all connected viewers on that poll see the results update instantly, without refreshing.
- Clients join a Socket.IO room scoped to the poll ID, so updates are efficiently broadcast only to relevant viewers.

### 4. Persistence
- All polls and votes are stored in **MongoDB Atlas**.
- Refreshing the page fetches the latest data from the database.
- Share links remain valid indefinitely.

### 5. Shareable Link with Copy Button
- Each poll page includes a "Share this poll" section with a one-click copy button and a visual toast confirmation.

---

## Fairness / Anti-Abuse Mechanisms

### Mechanism 1: Server-Side IP Hashing (Primary Defense)

**What it prevents:** A single user submitting multiple votes on the same poll.

**How it works:**
- When a vote is submitted via WebSocket, the server captures the voter's IP address from the `x-forwarded-for` header (or direct connection address).
- The IP is **hashed using SHA-256** (never stored in plain text for privacy) and compared against a list of hashes (`voterIPHashes`) stored in the poll document.
- If the hash already exists, the vote is **rejected** and the user receives an error: *"You have already voted on this poll."*
- If the hash is new, the vote is accepted and the hash is added to the list atomically using MongoDB's `$push`.

**Why hashing?** Storing raw IPs would be a privacy concern. SHA-256 is a one-way function, so even if the database is compromised, voter IPs cannot be recovered.

> **File:** [`server/socket/pollSocket.js`](server/socket/pollSocket.js)

### Mechanism 2: Client-Side LocalStorage Flag (UX Layer)

**What it prevents:** Accidental or casual re-voting from the same browser.

**How it works:**
- After a vote is submitted, the client stores a flag in the browser's LocalStorage (`voted_poll_<pollId> = true`).
- On page load, if this flag exists, the voting UI is hidden and the results view is shown directly.
- This provides immediate feedback without a server round-trip and prevents the user from even seeing the vote form again.

**Limitation:** LocalStorage can be cleared by the user, so this is a UX convenience layer, not a security mechanism. The server-side IP hash check is the authoritative defense.

> **File:** [`client/src/pages/ViewPoll.jsx`](client/src/pages/ViewPoll.jsx)

---

## Edge Cases Handled

| Edge Case                                  | How It's Handled                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Empty or whitespace-only question**      | Trimmed and validated on both client and server; rejected with error message                                   |
| **Fewer than 2 valid options**             | Client-side validation prevents submission; server also validates with Mongoose schema (`min: 2`)             |
| **Empty option strings**                   | Options are trimmed and filtered — blank options are silently removed before creation                          |
| **Max options limit**                      | Capped at 8 options on the client to keep polls manageable                                                    |
| **Question max length**                    | Input capped at 200 characters; option inputs capped at 100 characters                                       |
| **Invalid poll ID in URL**                 | Server returns 404; client shows a "Poll Not Found" page with a link back to create a new poll                |
| **Malformed MongoDB ObjectId**             | Caught by checking `err.kind === 'ObjectId'`, returns 404 instead of a 500 error                              |
| **Duplicate vote (same IP)**               | Server rejects with error message via WebSocket; vote count is not incremented                                |
| **Invalid option ID in vote**              | Server validates the option exists in the poll before accepting the vote                                      |
| **Missing pollId or optionId in vote**     | Server validates both fields are present before processing                                                    |
| **Socket reconnection**                    | Client re-joins the poll room and re-fetches latest data on `connect` event                                   |
| **Trailing slash in URLs**                 | Both `CLIENT_URL` and `VITE_SERVER_URL` are sanitized to strip trailing slashes                                |
| **Page refresh on poll route (SPA)**       | `vercel.json` rewrites all routes to `index.html` so React Router handles the routing                         |
| **CORS restrictions**                      | Server configures CORS to only allow the specific client origin                                                |

---

## Known Limitations & Future Improvements

### Limitations
1. **Shared public IP:** Users on the same Wi-Fi network share a public IP address, meaning only one person per network can vote on a poll. This is a trade-off for simplicity — it prevents abuse but can block legitimate voters in shared environments (offices, cafes, etc.).
2. **VPN/proxy bypass:** Sophisticated users can bypass the IP check using VPNs or proxies, which assign a different IP address.
3. **LocalStorage clearable:** The client-side voting flag can be cleared by the user via browser dev tools. However, the server-side IP check still prevents the duplicate vote from being counted.
4. **No poll expiration:** Polls remain open indefinitely; there's no way to close voting or set a deadline.
5. **No authentication:** The app is anonymous — there are no user accounts.

### Future Improvements
- **Browser fingerprinting** as a third anti-abuse layer (canvas fingerprint, WebGL renderer, etc.)
- **Rate limiting** on the server to prevent rapid-fire vote attempts
- **Poll expiration** — allow creators to set a voting deadline
- **Poll results privacy** — option to hide results until voting ends
- **User authentication** via OAuth for stronger identity-based vote tracking

---

## Project Structure

```
LivePoll/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── CreatePoll.jsx    # Poll creation form
│   │   │   └── ViewPoll.jsx      # Poll viewing, voting, results
│   │   ├── App.jsx               # Router + Layout
│   │   ├── socket.js             # Socket.IO client singleton
│   │   ├── index.css             # Global styles
│   │   └── main.jsx              # Entry point
│   ├── vercel.json               # SPA rewrite rules
│   └── package.json
│
├── server/                  # Node.js backend (Express)
│   ├── models/
│   │   └── Poll.js               # Mongoose schema
│   ├── routes/
│   │   └── polls.js              # REST API (create, fetch polls)
│   ├── socket/
│   │   └── pollSocket.js         # WebSocket vote handler
│   ├── server.js                 # Express + Socket.IO server
│   └── .env                      # Environment variables
│
└── README.md
```

---

## Running Locally

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas connection string (or local MongoDB)

### Setup

```bash
# Clone the repository
git clone https://github.com/animeshlego5/LivePoll.git
cd LivePoll

# Backend
cd server
npm install
# Create .env with MONGODB_URI, PORT, CLIENT_URL
npm start

# Frontend (in a new terminal)
cd client
npm install
# Create .env with VITE_SERVER_URL
npm run dev
```

---

Built by [Animesh](https://animeshlego5.github.io/animesh-portfolio/)
