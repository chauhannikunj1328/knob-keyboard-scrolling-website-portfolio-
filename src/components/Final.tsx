import type { Ref } from "react";
import { Button } from "./Button";
import { jumpTo } from "../lib/jump";
import styles from "./Final.module.css";

export function Final({ ref }: { ref?: Ref<HTMLElement> }) {
  return (
    <section ref={ref} className={styles.final}>
      <h2 className={styles.title}>
        Arriving on your <br />
        desk <em>this fall.</em>
      </h2>
      <p className={styles.closer}>KNOB by Work Louder · ISO // ANSI · PC // Mac // Bluetooth</p>
      <div className={styles.buttons}>
        <Button href="#buy" onClick={jumpTo("buy")}>
          Pre-order · $439
        </Button>
        <Button ghost href="#details" onClick={jumpTo("details")}>See the details</Button>
      </div>
      <small className={styles.footnote}>Unofficial portfolio concept</small>
    </section>
  );
}
