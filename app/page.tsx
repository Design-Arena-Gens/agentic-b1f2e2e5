import dynamic from "next/dynamic";
import styles from "./page.module.css";

const ContainerScene = dynamic(() => import("../components/ContainerScene"), {
  ssr: false
});
const DownloadPanel = dynamic(() => import("../components/DownloadPanel"), {
  ssr: false
});

export default function Page() {
  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1>Cyber Container Icon</h1>
        <p>
          Dark glass shipping container with corrugated texture. Neon green numbers and gold coins inside. Isometric, high contrast, 3D, exportable up to 8K.
        </p>
      </div>
      <div className={styles.canvasWrap}>
        <ContainerScene />
      </div>
      <DownloadPanel />
      <footer className={styles.footer}>
        <span>Designed for UI/UX ? 3D Render ? Isometric</span>
      </footer>
    </main>
  );
}

