"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getDatabase,
  onValue,
  ref,
  remove,
  set,
  update,
} from "firebase/database";

const ads = {
  publisher: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUBLISHER_ID,
  headerSlot: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_HEADER_SLOT,
  sidebarSlot: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_SIDEBAR_SLOT,
  feedSlot: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_FEED_SLOT,
  headerEnabled: process.env.NEXT_PUBLIC_AD_HEADER_ENABLED !== "false",
  sidebarEnabled: process.env.NEXT_PUBLIC_AD_SIDEBAR_ENABLED !== "false",
  feedEnabled: process.env.NEXT_PUBLIC_AD_FEED_ENABLED === "true",
  feedInterval: Number(process.env.NEXT_PUBLIC_AD_FEED_INTERVAL) || 4,
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function parseVideo(value) {
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(url.protocol)) return null;

  const youtube = url.href.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/,
  );
  if (youtube) {
    return {
      url: url.href,
      source: "YouTube",
      embed: `https://www.youtube.com/embed/${youtube[1]}?autoplay=1`,
      thumb: `https://img.youtube.com/vi/${youtube[1]}/mqdefault.jpg`,
    };
  }

  const vimeo = url.href.match(/vimeo\.com\/(\d+)/);
  if (vimeo) {
    return {
      url: url.href,
      source: "Vimeo",
      embed: `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`,
      thumb: `https://image.thum.io/get/width/400/crop/800/${url.href}`,
    };
  }

  const dailymotion = url.href.match(/dailymotion\.com\/video\/([\w]+)/);
  if (dailymotion) {
    return {
      url: url.href,
      source: "Dailymotion",
      embed: `https://www.dailymotion.com/embed/video/${dailymotion[1]}?autoplay=1`,
      thumb: `https://www.dailymotion.com/thumbnail/video/${dailymotion[1]}`,
    };
  }

  const domain = url.hostname.replace(/^www\./, "");
  return {
    url: url.href,
    source: domain.charAt(0).toUpperCase() + domain.slice(1),
    embed: null,
    thumb: `https://image.thum.io/get/width/400/crop/800/${url.href}`,
  };
}

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function AdUnit({ slot, className = "", format }) {
  const adRef = useRef(null);

  useEffect(() => {
    if (!ads.publisher || !slot || !adRef.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ad blockers and duplicate initialization can reject an ad push.
    }
  }, [slot]);

  if (!ads.publisher || !slot) return null;
  return (
    <div className={`ad-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", minHeight: 90 }}
        data-ad-client={ads.publisher}
        data-ad-slot={slot}
        data-ad-format={format || "auto"}
        data-full-width-responsive="true"
      />
    </div>
  );
}

function VideoCard({ video, onOpen, onCopy }) {
  const shareUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}${window.location.pathname}?view=${encodeURIComponent(video.id)}`;

  return (
    <article className="video-card" onClick={() => onOpen(video)}>
      <div className="thumb">
        {video.thumb ? (
          <img src={video.thumb} alt="" loading="lazy" />
        ) : (
          <span className="thumb-placeholder" aria-hidden="true">▷</span>
        )}
        <span className="src-badge">{video.source}</span>
      </div>
      <div className="card-info">
        <h3>{video.title}</h3>
        <p className="meta">{timeAgo(video.added)} · {video.views || 0} views</p>
        <div className="card-actions">
          <button className="action-btn" onClick={(event) => { event.stopPropagation(); onOpen(video); }}>Open</button>
          <button className="action-btn" onClick={(event) => { event.stopPropagation(); onCopy(shareUrl); }}>Copy link</button>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const [database, setDatabase] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState("");
  const [activePage, setActivePage] = useState("home");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [adminModal, setAdminModal] = useState(false);
  const [password, setPassword] = useState("");
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [remaining, setRemaining] = useState(5);
  const [visits, setVisits] = useState(0);
  const logoClicks = useRef(0);
  const logoTimer = useRef(null);
  const toastTimer = useRef(null);
  const deepLinkHandled = useRef(false);

  useEffect(() => {
    if (!firebaseConfig.apiKey || !firebaseConfig.databaseURL) {
      setBackendError("Firebase is not configured. Check your environment variables.");
      setLoading(false);
      return undefined;
    }

    try {
      const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      const db = getDatabase(app);
      setDatabase(db);
      return onValue(
        ref(db, "videos"),
        (snapshot) => {
          const loaded = [];
          snapshot.forEach((child) => {
            const video = child.val();
            if (video && video.url) {
              loaded.push({ ...video, id: Number(video.id || child.key), views: video.views || 0 });
            }
          });
          loaded.sort((a, b) => new Date(b.added) - new Date(a.added));
          setVideos(loaded);
          setBackendError("");
          setLoading(false);
        },
        (error) => {
          setBackendError(`Firebase connection failed: ${error.message}`);
          setLoading(false);
        },
      );
    } catch (error) {
      setBackendError(`Firebase initialization failed: ${error.message}`);
      setLoading(false);
      return undefined;
    }
  }, []);

  useEffect(() => {
    if (loading || deepLinkHandled.current || typeof window === "undefined") return;
    deepLinkHandled.current = true;
    const viewId = new URLSearchParams(window.location.search).get("view");
    if (viewId) {
      const video = videos.find((item) => item.id === Number(viewId));
      if (video) openVideo(video);
      else notify("Post not found");
    }
  }, [loading, videos]);

  useEffect(() => {
    if (activePage !== "detail" || !selectedVideo) return undefined;
    setRemaining(5);
    const timer = window.setInterval(() => {
      setRemaining((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activePage, selectedVideo]);

  useEffect(() => {
    try {
      setVisits(Number(localStorage.getItem("th_visits") || 0));
    } catch {
      setVisits(0);
    }
    return () => {
      window.clearTimeout(toastTimer.current);
      window.clearTimeout(logoTimer.current);
    };
  }, []);

  function notify(message) {
    setToastMessage(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMessage(""), 2400);
  }

  function showPage(page) {
    if (page === "admin" && !adminLoggedIn) {
      setAdminModal(true);
      return;
    }
    setActivePage(page);
    if (page !== "detail") setSelectedVideo(null);
  }

  function handleLogoClick() {
    logoClicks.current += 1;
    window.clearTimeout(logoTimer.current);
    if (logoClicks.current === 5) {
      logoClicks.current = 0;
      setPassword("");
      setAdminModal(true);
      return;
    }
    showPage("home");
    logoTimer.current = window.setTimeout(() => { logoClicks.current = 0; }, 5000);
  }

  function openVideo(video) {
    const viewed = { ...video, views: (video.views || 0) + 1 };
    setSelectedVideo(viewed);
    setActivePage("detail");
    try {
      const nextVisits = Number(localStorage.getItem("th_visits") || 0) + 1;
      localStorage.setItem("th_visits", String(nextVisits));
      setVisits(nextVisits);
    } catch {
      // Viewing links still works when browser storage is unavailable.
    }
    if (database) update(ref(database, `videos/${video.id}`), { views: viewed.views }).catch(() => {});
    if (typeof window !== "undefined") {
      const current = new URL(window.location.href);
      current.searchParams.set("view", String(video.id));
      window.history.replaceState({}, "", current);
    }
  }

  async function copyLink(text) {
    try {
      await navigator.clipboard.writeText(text);
      notify("Link copied! You can share it now.");
    } catch {
      notify("Copy failed. Please copy the link manually.");
    }
  }

  async function shareLink(event) {
    event.preventDefault();
    if (!database) {
      notify("Backend unavailable. Check configuration.");
      return;
    }
    const parsed = parseVideo(url.trim());
    if (!url.trim()) {
      notify("Please paste a link");
      return;
    }
    if (!parsed) {
      notify("Please enter a valid URL");
      return;
    }

    const now = Date.now();
    let timestamps = [];
    try {
      timestamps = JSON.parse(localStorage.getItem("th_shares") || "[]");
      timestamps = timestamps.filter((time) => now - time < 3600000);
    } catch {
      timestamps = [];
    }
    if (timestamps.length >= 20) {
      const minutes = Math.ceil((3600000 - (now - timestamps[0])) / 60000);
      notify(`Limit reached: 20 links/hour. Try again in ${minutes} min.`);
      return;
    }
    timestamps.push(now);
    try {
      localStorage.setItem("th_shares", JSON.stringify(timestamps));
    } catch {
      // Rate limiting remains active for this submission.
    }

    const id = Date.now();
    const video = {
      id,
      ...parsed,
      title: title.trim() || `${parsed.source} Link`,
      added: new Date().toISOString(),
      views: 0,
    };
    setTitle("");
    setUrl("");
    notify("Saving link...");
    try {
      await set(ref(database, `videos/${id}`), video);
      notify("Link shared successfully!");
      window.setTimeout(() => showPage("feed"), 450);
    } catch (error) {
      notify(error.code === "PERMISSION_DENIED" ? "Permission denied. Check database rules." : `Error saving: ${error.message}`);
    }
  }

  async function submitAdminLogin(event) {
    event.preventDefault();
    if (Date.now() < lockedUntil) {
      notify(`Too many attempts. Try again in ${Math.ceil((lockedUntil - Date.now()) / 1000)}s.`);
      return;
    }
    const expected = process.env.NEXT_PUBLIC_ADMIN_PASSWORD_HASH || "";
    if (!expected) {
      notify("Admin login is not configured.");
      return;
    }

    let actual;
    if (/^[a-f\d]{64}$/i.test(expected)) {
      if (!window.crypto?.subtle) {
        notify("Cannot verify password in this browser.");
        return;
      }
      const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
      actual = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("").toLowerCase();
    } else {
      let hash = 5381;
      for (let index = 0; index < password.length; index += 1) {
        hash = ((hash << 5) + hash + password.charCodeAt(index)) | 0;
      }
      actual = String(hash >>> 0);
    }

    if (actual === expected.toLowerCase()) {
      setLoginAttempts(0);
      setAdminLoggedIn(true);
      setAdminModal(false);
      setActivePage("admin");
      notify("Admin login successful!");
      return;
    }
    const attempts = loginAttempts + 1;
    if (attempts >= 5) {
      setLockedUntil(Date.now() + 5 * 60 * 1000);
      setLoginAttempts(0);
      setAdminModal(false);
      notify("Too many failed attempts. Locked for 5 minutes.");
    } else {
      setLoginAttempts(attempts);
      setPassword("");
      notify(`Wrong password! ${5 - attempts} attempt${attempts === 4 ? "" : "s"} left.`);
    }
  }

  async function editVideo(video) {
    const updatedTitle = window.prompt("Edit title:", video.title);
    if (!updatedTitle?.trim() || !database) return;
    try {
      await update(ref(database, `videos/${video.id}`), { title: updatedTitle.trim() });
      notify("Title updated!");
    } catch (error) {
      notify(`Error: ${error.message}`);
    }
  }

  async function deleteVideo(video) {
    if (!database || !window.confirm("Delete this video?")) return;
    try {
      await remove(ref(database, `videos/${video.id}`));
      notify("Video deleted!");
    } catch (error) {
      notify(`Error: ${error.message}`);
    }
  }

  const cardProps = { onOpen: openVideo, onCopy: copyLink };
  const recentVideos = videos.slice(0, 4);

  return (
    <>
      {ads.publisher && <Script async strategy="afterInteractive" crossOrigin="anonymous" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ads.publisher}`} />}
      <nav className="top-nav">
        <button className="logo" onClick={handleLogoClick} aria-label="TeraHub home">tera<span>hub</span></button>
        <div className="nav-tabs" role="tablist" aria-label="Main navigation">
          <button className={`tab-btn ${activePage === "home" ? "active" : ""}`} onClick={() => showPage("home")}>Share</button>
          <button className={`tab-btn ${activePage === "feed" ? "active" : ""}`} onClick={() => showPage("feed")}>Browse</button>
        </div>
      </nav>

      {ads.headerEnabled && <AdUnit slot={ads.headerSlot} className="header-ad" format="horizontal" />}
      {backendError && <p className="notice" role="status">{backendError}</p>}

      {activePage === "home" && (
        <main>
          <section className="hero">
            <h1>Drop a link.<br /><em>Share what&apos;s worth watching.</em></h1>
            <p>Paste any link — videos, websites, articles, anything.</p>
            <form className="share-box" onSubmit={shareLink}>
              <label htmlFor="video-title">Video title (optional)</label>
              <input id="video-title" className="title-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Best goal of the season..." />
              <label htmlFor="video-url">Video URL</label>
              <div className="input-row">
                <input id="video-url" type="text" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://youtube.com/watch?v=..." />
                <button className="btn-primary" type="submit">Share</button>
              </div>
              <p className="supported">Supports YouTube, Vimeo, Dailymotion, and any link</p>
            </form>
          </section>
          {recentVideos.length > 0 && (
            <section className="feed recent-feed">
              <div className="feed-header"><h2>Recently shared</h2><span className="count-badge">{recentVideos.length}</span></div>
              <div className="video-grid">{recentVideos.map((video) => <VideoCard key={video.id} video={video} {...cardProps} />)}</div>
            </section>
          )}
        </main>
      )}

      {activePage === "feed" && (
        <main className="feed">
          <div className="feed-header"><h2>All videos</h2><span className="count-badge">{videos.length}</span></div>
          {loading ? <p className="empty-state">Loading links...</p> : videos.length === 0 ? <p className="empty-state">No links yet — share one to get started!</p> : (
            <div className="video-grid">
              {videos.map((video, index) => (
                <div className="feed-item" key={video.id}>
                  <VideoCard video={video} {...cardProps} />
                  {ads.feedEnabled && (index + 1) % ads.feedInterval === 0 && <AdUnit slot={ads.feedSlot} className="feed-ad-card" format="rectangle" />}
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {activePage === "detail" && selectedVideo && (
        <main className="feed detail-page">
          <button className="back-btn" onClick={() => showPage("feed")}>← <span>Back to Feed</span></button>
          <h2 className="detail-title">{selectedVideo.title}</h2>
          <p className="detail-meta">{selectedVideo.source} · {selectedVideo.views || 0} views</p>
          {ads.sidebarEnabled && <AdUnit slot={ads.sidebarSlot} className="detail-ad" />}
          <section className="unlock-container">
            <h3>Unlocking your Link</h3>
            <div className={`timer-big-number ${remaining === 0 ? "unlocked" : ""}`}>{remaining === 0 ? "✓" : remaining}</div>
            <p className={remaining === 0 ? "timer-ready" : "timer-status"}>
              {remaining === 0 ? "Link securely unlocked!" : <>Securing link in <span>{remaining}</span>s...</>}
            </p>
            <button className={`btn-primary unlock-button ${remaining === 0 ? "btn-unlocked" : "btn-locked"}`} disabled={remaining > 0} onClick={() => window.open(selectedVideo.url, "_blank", "noopener,noreferrer")}>
              {remaining === 0 ? "Open Link ↗" : "Link Locked"}
            </button>
          </section>
          {ads.sidebarEnabled && <AdUnit slot={ads.sidebarSlot} className="detail-ad" />}
        </main>
      )}

      {activePage === "admin" && adminLoggedIn && (
        <main className="feed admin-page">
          <h1>Admin Panel</h1>
          <div className="admin-stats">
            <div><strong>{videos.length}</strong><span>Total Videos Shared</span></div>
            <div><strong>{visits}</strong><span>Page Visits</span></div>
          </div>
          <section className="admin-list">
            <h2>Manage Shared Links</h2>
            {videos.length === 0 ? <p>No videos yet</p> : videos.map((video) => (
              <div className="admin-row" key={video.id}>
                <div className="admin-video-info">
                  <strong>{video.title}<small>{video.views || 0} views</small></strong>
                  <span>{video.source} · {timeAgo(video.added)}</span>
                  <a href={video.url} target="_blank" rel="noreferrer">{video.url}</a>
                </div>
                <div className="admin-actions">
                  <button className="action-btn" onClick={() => editVideo(video)}>Edit</button>
                  <button className="action-btn danger" onClick={() => deleteVideo(video)}>Delete</button>
                </div>
              </div>
            ))}
          </section>
        </main>
      )}

      {adminModal && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setAdminModal(false); }}>
          <form className="login-modal" onSubmit={submitAdminLogin}>
            <h2>Admin Access</h2>
            <p>Enter your admin password to continue</p>
            <input autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" aria-label="Admin password" />
            <div className="modal-actions">
              <button type="button" className="action-btn" onClick={() => setAdminModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Login</button>
            </div>
          </form>
        </div>
      )}
      <div className={`toast ${toastMessage ? "show" : ""}`} role="status" aria-live="polite">{toastMessage}</div>
    </>
  );
}