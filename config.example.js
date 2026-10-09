// ============================================================
// TeraHub Configuration EXAMPLE
// Copy this file to config.js and fill in your real values
// ============================================================

window.TERAHUB_CONFIG = {
  firebase: {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.region.firebasedatabase.app",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
  },
  adsense: {
    publisherId: "ca-pub-YOUR_PUBLISHER_ID",
    headerSlot: "YOUR_HEADER_SLOT_ID"
  },
  // SHA-256 hash of your admin password (never store plaintext password here)
  // Generate hash at: https://emn178.github.io/online-tools/sha256.html
  adminPasswordHash: "YOUR_SHA256_PASSWORD_HASH_HERE"
};
