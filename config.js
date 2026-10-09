// ============================================================
// TeraHub Configuration File
// DO NOT commit this file to Git — it is listed in .gitignore
// Copy config.example.js and fill in your values
// ============================================================

window.TERAHUB_CONFIG = {
  firebase: {
    apiKey: "AIzaSyDnVfb5Za2EuVAJ4qBguhK0bAUotwdbyg8",
    authDomain: "terahub-d2680.firebaseapp.com",
    databaseURL: "https://terahub-d2680-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "terahub-d2680",
    storageBucket: "terahub-d2680.firebasestorage.app",
    messagingSenderId: "635392929605",
    appId: "1:635392929605:web:324c564ebbe63d44c1d82c",
    measurementId: "G-ZMQZJ4M235"
  },
  adsense: {
    publisherId: "ca-pub-5837561400790216",
    headerSlot: "3453469275",
    sidebarSlot: "5644518347",
    feedSlot: "6832284964",
    headerEnabled: true,
    sidebarEnabled: true,
    feedEnabled: true,
    feedInterval: 4
  },
  appSettings: {
    appName: "TeraHub",
    environment: "production",
    debug: false
  },
  // SHA-256 hash of the admin password.
  // To update: https://emn178.github.io/online-tools/sha256.html
  adminPasswordHash: "3936514773"
};
