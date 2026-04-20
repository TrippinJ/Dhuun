// src/pages/PurchasedBeats.jsx
//
// My Library — beats the user has purchased.
// - alert() fully replaced with toast from ../utils/toast
// - Downloads go through /api/orders/:orderId/download/:beatId?type=wav|stems
//   which returns a short-lived signed Cloudinary URL.
// - Mobile-first. Uses PurchasedBeats.module.css.
//
// ASSUMPTIONS TO VERIFY (easy to tweak — all in one place near the top):
//   1. Axios instance path:   import API from "../api/axios"
//   2. Toast export shape:    default export with .success/.error/.info
//   3. Order payload shape:   GET /api/orders/my-orders -> [{ _id, createdAt,
//                             items: [{ beat: {...}, licenseType, price }] }]
//
// If any of those differ in your repo, only the imports / the two fetch calls
// need changing — the JSX and CSS stay the same.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import toast from "../utils/toast";
import styles from "./PurchasedBeats.module.css";

// ---------- helpers ----------

const formatDate = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

const formatPrice = (n) =>
  typeof n === "number" ? `$${n.toFixed(2)}` : "—";

// ---------- skeleton loader ----------

const SkeletonRow = () => (
  <div className={`${styles.card} ${styles.skeletonCard}`} aria-hidden="true">
    <div className={styles.skeletonArt} />
    <div className={styles.cardBody}>
      <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
      <div className={`${styles.skeletonLine} ${styles.skeletonSub}`} />
      <div className={`${styles.skeletonLine} ${styles.skeletonSub}`} />
    </div>
  </div>
);

// ---------- component ----------

export default function PurchasedBeats() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Track which (orderId|beatId|type) is currently downloading so we can
  // disable just that one button instead of the whole page.
  const [downloading, setDownloading] = useState({}); // { "oid:bid:wav": true }

  // Single shared <audio> so multiple previews don't stack on top of each other.
  const audioRef = useRef(null);
  const [nowPlaying, setNowPlaying] = useState(null); // beatId or null

  // ---------- fetch purchased beats ----------
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await API.get("/api/orders/my-orders");
        if (cancelled) return;
        // Accept either an array or { orders: [...] } for safety.
        const list = Array.isArray(data) ? data : data?.orders ?? [];
        setOrders(list);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load purchased beats:", err);
        setError("We couldn't load your library. Please try again.");
        toast.error("Couldn't load your library");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- flatten orders -> rows for rendering ----------
  const rows = useMemo(() => {
    const out = [];
    for (const order of orders) {
      const items = order.items ?? order.beats ?? [];
      for (const item of items) {
        const beat = item.beat || item; // handle either embedded or flat shape
        if (!beat || !beat._id) continue;
        out.push({
          orderId: order._id,
          purchasedAt: order.createdAt,
          licenseType: item.licenseType || beat.licenseType || "Basic",
          price: item.price ?? beat.price,
          beat,
        });
      }
    }
    // Newest first.
    out.sort(
      (a, b) =>
        new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
    );
    return out;
  }, [orders]);

  // ---------- preview playback ----------
  const togglePreview = (beat) => {
    const url = beat.previewUrl || beat.taggedMp3Url || beat.audioUrl;
    if (!url) {
      toast.info("No preview available for this beat");
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener("ended", () => setNowPlaying(null));
      audioRef.current.addEventListener("error", () => {
        toast.error("Couldn't play preview");
        setNowPlaying(null);
      });
    }

    // Clicking the currently playing beat pauses it.
    if (nowPlaying === beat._id) {
      audioRef.current.pause();
      setNowPlaying(null);
      return;
    }

    audioRef.current.src = url;
    audioRef.current
      .play()
      .then(() => setNowPlaying(beat._id))
      .catch(() => {
        toast.error("Couldn't play preview");
        setNowPlaying(null);
      });
  };

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  // ---------- signed-URL download ----------
  const handleDownload = async (row, type) => {
    const key = `${row.orderId}:${row.beat._id}:${type}`;
    setDownloading((d) => ({ ...d, [key]: true }));

    try {
      const { data } = await API.get(
        `/api/orders/${row.orderId}/download/${row.beat._id}`,
        { params: { type } }
      );

      // Backend may return { url }, { signedUrl }, or { wav, stems }.
      const signedUrl =
        data?.url ||
        data?.signedUrl ||
        (type === "wav" ? data?.wav : data?.stems);

      if (!signedUrl) {
        throw new Error("No signed URL returned");
      }

      // Trigger the download. Using an anchor keeps the Cloudinary download
      // headers (attachment, filename) that the backend set on the signed URL.
      const a = document.createElement("a");
      a.href = signedUrl;
      a.rel = "noopener noreferrer";
      // Don't force filename — let Cloudinary's Content-Disposition win.
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success(
        type === "stems" ? "Stems download starting" : "WAV download starting"
      );
    } catch (err) {
      console.error("Download failed:", err);
      const status = err?.response?.status;
      if (status === 403) {
        toast.error("This download link has expired. Refresh and try again.");
      } else if (status === 404) {
        toast.error("File not available for this beat");
      } else {
        toast.error("Download failed. Please try again.");
      }
    } finally {
      setDownloading((d) => {
        const next = { ...d };
        delete next[key];
        return next;
      });
    }
  };

  // ---------- render ----------
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>My Library</h1>
          <p className={styles.subtitle}>
            Your purchased beats. Download the WAV and stems anytime — links
            refresh automatically.
          </p>
        </div>
      </header>

      {loading && (
        <div className={styles.grid} aria-busy="true" aria-live="polite">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {!loading && error && (
        <div className={styles.errorState} role="alert">
          <p>{error}</p>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className={styles.emptyState}>
          <h2>No beats yet</h2>
          <p>Head to the marketplace and find your next vibe.</p>
          <Link to="/beats" className={styles.primaryBtn}>
            Explore beats
          </Link>
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <section className={styles.grid} aria-label="Purchased beats">
          {rows.map((row) => {
            const { beat } = row;
            const isPlaying = nowPlaying === beat._id;
            const wavKey = `${row.orderId}:${beat._id}:wav`;
            const stemsKey = `${row.orderId}:${beat._id}:stems`;
            const hasStems =
              beat.hasStems ??
              Boolean(beat.stemsUrl) ??
              row.licenseType?.toLowerCase().includes("exclusive");

            return (
              <article key={`${row.orderId}-${beat._id}`} className={styles.card}>
                <button
                  type="button"
                  className={styles.art}
                  onClick={() => togglePreview(beat)}
                  aria-label={
                    isPlaying
                      ? `Pause preview of ${beat.title}`
                      : `Play preview of ${beat.title}`
                  }
                >
                  {beat.coverImage || beat.coverUrl ? (
                    <img
                      src={beat.coverImage || beat.coverUrl}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <div className={styles.artFallback} aria-hidden="true" />
                  )}
                  <span
                    className={`${styles.playBadge} ${
                      isPlaying ? styles.playBadgeActive : ""
                    }`}
                    aria-hidden="true"
                  >
                    {isPlaying ? "❚❚" : "▶"}
                  </span>
                </button>

                <div className={styles.cardBody}>
                  <h3 className={styles.beatTitle} title={beat.title}>
                    {beat.title || "Untitled beat"}
                  </h3>
                  <p className={styles.producer}>
                    {beat.producerName ||
                      beat.producer?.name ||
                      beat.artist ||
                      "Unknown producer"}
                  </p>

                  <dl className={styles.meta}>
                    <div>
                      <dt>License</dt>
                      <dd>
                        <span className={styles.licenseTag}>
                          {row.licenseType}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt>Paid</dt>
                      <dd>{formatPrice(row.price)}</dd>
                    </div>
                    <div>
                      <dt>Purchased</dt>
                      <dd>{formatDate(row.purchasedAt)}</dd>
                    </div>
                  </dl>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      onClick={() => handleDownload(row, "wav")}
                      disabled={Boolean(downloading[wavKey])}
                    >
                      {downloading[wavKey] ? "Preparing…" : "Download WAV"}
                    </button>

                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => handleDownload(row, "stems")}
                      disabled={!hasStems || Boolean(downloading[stemsKey])}
                      title={
                        hasStems
                          ? "Download stems (ZIP)"
                          : "Stems not included with this license"
                      }
                    >
                      {downloading[stemsKey] ? "Preparing…" : "Stems ZIP"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
