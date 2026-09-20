# Deploying the AI backend (Phase 3)

This turns off the "paste your own Gemini key into Settings" dev-mode
warning by moving the key server-side. It's optional — the app keeps
working with the local dev-key client if you skip this.

## Why App Check instead of user accounts

There's no login system yet (that's Phase 7). Without *some* protection, a
public HTTPS function is an open door — anyone who finds the URL could hit
it directly and burn through your Gemini quota. **Firebase App Check**
solves this without requiring accounts: it verifies a request really came
from your registered web app (via reCAPTCHA v3, invisible to the person
using it) before the function does any work. That's the right amount of
protection for a single-user personal app; per-person rate limiting is a
natural Phase 7 addition once real accounts exist.

## One-time setup

1. **Create a Firebase project** at https://console.firebase.google.com if
   you don't have one, and enable the **Blaze (pay-as-you-go) plan** —
   required for functions that call external APIs. Gemini's free tier
   should keep actual cost near zero for personal use.

2. **Register a Web App** inside the project (Project Settings → General →
   Add app → Web). Copy the config object it gives you — you'll need it for
   the frontend `.env`.

3. **Enable App Check**: Project Settings → App Check → your web app →
   register a **reCAPTCHA v3** provider. Copy the site key.

4. **Point this repo at your project**:
   ```bash
   npm install -g firebase-tools   # if you don't have it
   firebase login
   ```
   Edit `.firebaserc` and replace `REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID`
   with your actual project ID.

5. **Set the Gemini key as a secret** (never committed, never in client code):
   ```bash
   cd functions
   npm install
   firebase functions:secrets:set GEMINI_API_KEY
   # paste your key when prompted
   ```

6. **Restrict CORS to your real domain** once you know it (optional but
   recommended before going beyond local use):
   ```bash
   firebase functions:config:set app.allowed_origin="https://your-deployed-domain.com"
   ```
   Locally this is unset, which allows any origin during development —
   tighten it before relying on this for anything but your own testing.

7. **Deploy**:
   ```bash
   npm run deploy
   ```
   Firebase prints the function's HTTPS URL when it finishes — you'll need
   it for the frontend.

## Frontend configuration

Copy `.env.example` to `.env` in the project root and fill in:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
VITE_RECAPTCHA_SITE_KEY=...
VITE_ASSISTANT_API_URL=https://us-central1-YOUR_PROJECT.cloudfunctions.net/assistantChat
```

The first four come from step 2, the reCAPTCHA key from step 3, and the
function URL from step 7. Once `VITE_ASSISTANT_API_URL` is set, the app
automatically switches from the local dev-key client to this backend (see
`src/store/useAssistantStore.ts`'s `getClient()`) — no code changes needed,
and Settings' API-key field simply stops being used.

## Local testing without deploying

```bash
cd functions
npm run serve
```
runs the Firebase emulator. Point `VITE_ASSISTANT_API_URL` at the emulator's
printed local URL to test end-to-end before deploying for real. Note the
emulator does not enforce App Check by default, which is fine for local
testing but means this isn't representative of production request
rejection — test that against the real deployed function once, deliberately,
from outside the app (e.g. `curl`) to confirm it actually gets rejected.
