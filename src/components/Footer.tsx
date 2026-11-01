import { Wordmark } from "./Wordmark";
import { MAKER } from "../lib/product";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.cols}>
        <div>
          <h2>
            <Wordmark height={26} /> <small>{MAKER}</small>
          </h2>
          <p>Two knobs, a display, and a flash of orange.</p>
        </div>
        <div>
          <h2>About this project</h2>
          <p>A portfolio concept: a one-product page with a real-time 3D story, scrolled from start to finish. There are no real orders or payments here.</p>
        </div>
      </div>
      <p className={styles.legal}>Unofficial portfolio concept. Not affiliated with or endorsed by Work Louder. The product name and photos belong to their owners.</p>
    </footer>
  );
}
