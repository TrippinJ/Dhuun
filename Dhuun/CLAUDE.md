DHUUN — Beat Marketplace Project Brief
What is Dhuun:
Dhuun is a Nepali beat marketplace where music producers upload and sell beats to artists. Think BeatStars but built for the Nepali/South Asian market. Buyers purchase license tiers (Basic, Premium, Exclusive) and download the files they're entitled to.
Tech Stack:

Frontend: React (Vite), CSS Modules, react-router-dom, react-toastify, react-hot-toast
Backend: Node.js, Express, MongoDB + Mongoose, Cloudinary (storage), Stripe + Khalti (payments)
Hosting: Vercel (frontend), backend deployed separately
Future: React Native mobile app — all CSS and logic decisions should be mobile-first with this migration in mind

Design Tokens (use these everywhere, never hardcode other values):
Background:    #1a1a1a (primary), #1e1e1e (cards), #252525 (inputs)
Accent gold:   #ffba00
Purple:        #7b2cbf
Border:        #2a2a2a (default), #333 (visible)
Text:          #f0f0f0 (primary), #aaa (secondary), #666 (muted)
Error:         #ff5a5a
Success:       #4ade80
Warning:       #ffba00
Border radius: 8px (inputs), 12px (cards), 16px (sections)
File Architecture (backend):
backend/
├── models/
│   ├── beat.js          ← has audioWavPublicId, audioStemsPublicId fields
│   ├── order.js
│   ├── user.js
│   └── playEvent.js     ← heartbeat analytics
├── routes/
│   ├── beatRoutes.js    ← 3-file upload + signed download endpoint
│   ├── orderRoutes.js
│   └── analyticsRoutes.js
├── controllers/
│   ├── analyticsController.js  ← heartbeat logic, quality threshold 30s
│   └── orderController.js
└── utils/
    ├── cloudinaryConfig.js     ← generateSignedDownloadUrl()
    └── toast.js (frontend)
License Tiers — what each buyer receives:
Basic     → Tagged MP3 only (public Cloudinary URL)
Premium   → Tagged MP3 + Full WAV (signed URL, 10min expiry)
Exclusive → Tagged MP3 + Full WAV + Stems ZIP (signed URLs, 10min expiry)
Key rules — never break these:

audioWavPublicId and audioStemsPublicId on the Beat model store Cloudinary public IDs only — never URLs. URLs are generated on-demand via generateSignedDownloadUrl() in the download endpoint
Tagged MP3 (audioFile) is public — its URL is safe to store and serve
All alert() calls are banned — use src/utils/toast.js instead
Every component must be mobile-first (min breakpoint 320px, test at 375px)
CSS Modules only — no inline styles except for dynamic values

What's already built — do not rebuild:

Beat upload: 3-file system (tagged MP3, WAV, Stems ZIP) with Cloudinary authenticated assets
Heartbeat tracker: useHeartbeat hook + /api/analytics/heartbeat endpoint, quality play = 30s
src/utils/toast.js: central toast utility with presets (toast.cartAdd, toast.loginRequired, toast.beatUploaded, etc.)
GlobalAudioPlayer.jsx: all alert() replaced with toast utility
UploadBeat.jsx + UploadBeat.module.css: modernized, mobile-first, 3-file inputs
App.jsx: ToastContainer configured dark theme, bottom-center, sits above audio player

Remaining work in priority order:

PurchasedBeats.jsx + CSS — replace alert(), update download handler to call GET /api/orders/:orderId/download/:beatId, mobile-first
BeatExplorePage — sticky filter bar (genre, BPM, price, license), skeleton loaders
Beat card component — quick-buy button, play count, waveform thumbnail
Producer dashboard — wire to heartbeat analytics, time-series plays vs purchases
Cart + Checkout — move license selection earlier in the flow

How to handle toast notifications:
jsimport { toast } from '../utils/toast';
toast.success('message')
toast.error('message')
toast.cartAdd(beatTitle, licenseName)
toast.cartDuplicate(beatTitle, licenseName)
toast.loginRequired(navigate)
toast.beatUploaded(title, hasStems)
API base URL: configured in src/api/api.js — always use the API instance, never raw fetch
When the user says "send me X file" — they mean provide the complete updated file ready to copy-paste, not a diff or partial snippet. Always output the full file.