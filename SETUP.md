# TeraHub Configuration Guide

## How configuration works

TeraHub is a static site. The browser needs a `config.js` file with your
Firebase and AdSense settings, but that file must **not** be committed to Git.

`config.js` is therefore **auto-generated at build time** by `build.js` from
environment variables:

- **Locally** — from a `.env` file.
- **On Netlify** — from Site settings → Environment variables.

## Files overview

| File | Purpose | Committed? |
| --- | --- | --- |
| `build.js` | Generates `config.js` from environment variables. | ✅ Yes |
| `.env.example` | Template for your local environment variables. | ✅ Yes |
| `.env` | Your real local values. | ❌ No (gitignored) |
| `config.js` | Generated runtime config loaded by the page. | ❌ No (gitignored) |
| `config.example.js` | Documents the generated shape (manual fallback only). | ✅ Yes |
| `.gitignore` | Keeps secrets out of version control. | ✅ Yes |

> **Note:** Firebase *web* API keys are not secrets — they are visible in any
> client app. Your real protection is **Firebase Realtime Database rules** plus
> the admin password hash. Still, keep all of it out of Git.

---

## Local setup

### 1. Create your `.env`

```bash
cp .env.example .env
```

### 2. Fill in your values

```env
GOOGLE_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXX
GOOGLE_ADSENSE_HEADER_SLOT=YOUR_HEADER_SLOT_ID
GOOGLE_ADSENSE_SIDEBAR_SLOT=YOUR_SIDEBAR_SLOT_ID
GOOGLE_ADSENSE_FEED_SLOT=YOUR_FEED_SLOT_ID

FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.region.firebasedatabase.app
# ...remaining Firebase values...
```

### 3. Generate `config.js`

```bash
node build.js
```

### 4. Serve the site

Open `terahub.html` directly, or serve the folder with any static server.

---

## Netlify setup

1. Go to **Site settings → Environment variables** and add the same variables
   from your `.env`.
2. `netlify.toml` already runs `node build.js` before publishing.
3. Trigger a new deploy. Netlify generates `config.js` during the build.

---

## Admin login

The admin password is stored as a **hash**, never in plaintext.

- The app accepts either a **SHA-256** hash (64 hex chars, recommended) or the
  legacy djb2 hash (for backwards compatibility).
- Set it via `ADMIN_PASSWORD_HASH` in `.env` / Netlify.
- Generate a SHA-256 hash at: <https://emn178.github.io/online-tools/sha256.html>

### ⚠️ Important limitations

Admin login is enforced **client-side only**. Anyone can read the page source
and bypass it. To actually protect your data you must:

1. Lock down **Firebase Realtime Database rules** (see below).
2. Consider migrating to **Firebase Authentication** for real access control.

### Recommended Firebase rules (example)

Only allow public reads and validated writes, and require auth for deletes.
Adjust to your needs, then publish in the Firebase console:

```json
{
  "rules": {
    "videos": {
      ".read": true,
      ".write": "auth != null || newData.child('url').isString()",
      "$id": {
        ".validate": "newData.hasChildren(['url'])"
      }
    }
  }
}
```

---

## Security checklist

- ✅ Keep `.env` and `config.js` out of Git (already in `.gitignore`).
- ✅ If credentials were ever committed, **rotate/regenerate them** — removing
  a file does not remove it from Git history.
- ✅ Add authorized domains to the Firebase API key restrictions.
- ✅ Set and publish Firebase Database rules.
- ❌ Do not rely on the client-side admin login as real security.

---

## Support

- Update `.env` (and Netlify env vars) when you get new ad slots.
- Reference `.env.example` when onboarding new developers.
- Never commit real credentials.
