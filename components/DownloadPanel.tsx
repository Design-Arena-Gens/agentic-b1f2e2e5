"use client";

import styles from "../app/page.module.css";
import { useState, useCallback } from "react";

const PRESETS = [
  { label: "512 x 512", value: 512 },
  { label: "1024 x 1024", value: 1024 },
  { label: "2048 x 2048", value: 2048 },
  { label: "4096 x 4096", value: 4096 },
  { label: "8K (7680 x 7680)", value: 7680 }
];

export default function DownloadPanel() {
  const [size, setSize] = useState<number>(1024);
  const [busy, setBusy] = useState(false);
  const [filename, setFilename] = useState("cyber-container");

  const exportNow = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      window.dispatchEvent(
        new CustomEvent("export-canvas", {
          detail: { size, filename: `${filename}-${size}.png` }
        })
      );
      // Give a small delay so UI doesn't instantly flip
      await new Promise((r) => setTimeout(r, 400));
    } finally {
      setBusy(false);
    }
  }, [size, filename, busy]);

  return (
    <div className={styles.controls}>
      <label>
        <span style={{ marginRight: 8, color: "var(--text-dim)" }}>Size</span>
        <select
          className={styles.select}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
        >
          {PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span style={{ marginRight: 8, color: "var(--text-dim)" }}>Name</span>
        <input
          className={styles.input}
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="filename"
        />
      </label>
      <button
        className={styles.button}
        onClick={exportNow}
        disabled={busy}
        title="Export current view to PNG"
      >
        {busy ? "Rendering?" : "Export PNG"}
      </button>
    </div>
  );
}

