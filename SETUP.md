# TeraHub

TeraHub is a Next.js App Router application backed by Firebase Realtime Database.

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` if you do not already have a local environment file.
3. Fill in the Firebase, AdSense, and admin hash values in `.env`.
4. Start the app with `npm run dev`, then open <http://localhost:3000>.
5. Create a production build with `npm run build`; run it with `npm start`.

The existing environment variable names are mapped to public Next.js variables
by `next.config.mjs`. Firebase web configuration and the admin hash are included
in the browser bundle, as they were in the static site. Keep `.env` out of Git.

## Deployment

Netlify builds the app with `npm run build` and uses its Next.js plugin. Add the
same environment variables from `.env.example` under **Site settings →
Environment variables** before deploying.

`netlify.toml` excludes only Firebase web configuration keys from Netlify's
secrets scan because those identifiers are intentionally included in the client
bundle. Never put service-account credentials or other private keys in them.

## Security

The admin password check is client-side and is not a security boundary. Anyone
can inspect or bypass browser code. Protect writes and deletes with Firebase
Realtime Database rules and use Firebase Authentication for real admin access.
Firebase web API keys are public identifiers; restrict authorized domains and
configure database rules. Rotating a value does not remove it from Git history.

Run `npm audit` before deploying dependency updates.
