# TeraHub Configuration Guide

## Files Overview

### `.env` (⚠️ Keep Private)

Contains your actual sensitive credentials:

- Google AdSense Publisher ID
- Firebase API keys and config
- Active ad configuration

**Never commit this file to Git!** It's already in `.gitignore`

### `.env.example` (📋 Template)

Public template showing required environment variables.
Safe to commit and share with team members.

### `.gitignore` (🔒 Security)

Prevents `.env` from being accidentally committed to version control.

---

## Setup Instructions

### 1. Clone/Setup

```bash
# Copy the example file to create your actual .env
cp .env.example .env
```

### 2. Edit `.env` with Your Details

```env
GOOGLE_ADSENSE_PUBLISHER_ID=ca-pub-5713496705205122
GOOGLE_ADSENSE_HEADER_SLOT=YOUR_ACTUAL_SLOT_ID
GOOGLE_ADSENSE_SIDEBAR_SLOT=YOUR_ACTUAL_SLOT_ID
```

### 3. Get Your Values

- **AdSense Publisher ID**: From [Google AdSense](https://adsense.google.com)
- **Slot IDs**: Create ad units in AdSense console
- **Firebase**: From your Firebase project settings

---

## Ad Unit Configuration

| Variable                      | Size    | Placement                 | Status      |
| ----------------------------- | ------- | ------------------------- | ----------- |
| `GOOGLE_ADSENSE_HEADER_SLOT`  | 728x90  | Top of page               | ✅ Active   |
| `GOOGLE_ADSENSE_SIDEBAR_SLOT` | 300x250 | Video detail page sidebar | ✅ Active   |
| `GOOGLE_ADSENSE_FEED_SLOT`    | 300x250 | Between video grid        | ⏸️ Disabled |

---

## Node.js Integration (Optional)

If you want to load `.env` in a Node.js server:

```bash
npm install dotenv
```

```javascript
require("dotenv").config();
const publisherId = process.env.GOOGLE_ADSENSE_PUBLISHER_ID;
```

---

## Security Best Practices

✅ **DO:**

- Keep `.env` in `.gitignore`
- Use `.env.example` as template
- Regenerate keys periodically
- Never share `.env` publicly

❌ **DON'T:**

- Commit `.env` to Git
- Hardcode secrets in code
- Share credentials via email
- Use same keys across projects

---

## Front-End Access (Current Setup)

Your TeraHub currently uses hardcoded values in `terahub.html`.
To use environment variables, you'd need:

1. A build process (webpack, vite, etc.)
2. A backend server to serve config
3. Fetch config at runtime

For now, the `.env` file documents your settings for reference.

---

## Support

- Update `.env` when you get new ad slots
- Reference `.env.example` when onboarding new developers
- Keep sensitive data in `.env` only
