import type { Ref } from "react";
import { Button } from "./Button";
import { jumpTo } from "../lib/jump";
import styles from "./Hero.module.css";

export function Hero({ ref, cueRef, onCue }: { ref?: Ref<HTMLElement>; cueRef?: Ref<HTMLSpanElement>; onCue?: () => void }) {
  return (
    <header ref={ref} className={styles.hero}>
      <h1 className={styles.title}>
        Outgunned <br />
        <em>and Outmanned.</em>
      </h1>
      <p className={styles.lede}>
        Two knobs, a display of its own, and one flash of orange.
      </p>
      <div className={styles.cta}>
        <Button href="#buy" onClick={jumpTo("buy")}>
          Pre-order · $439
        </Button>
        <span ref={cueRef} className={styles.cue} role="button" tabIndex={0} onClick={onCue} onKeyDown={(e) => e.key === "Enter" && onCue?.()}>
          Scroll to look inside <span className={styles.arrow}>↓</span>
        </span>
      </div>
    </header>
  );
}
