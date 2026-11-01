import type { Ref } from "react";
import styles from "./Labels.module.css";

const LAYERS = [
  ["caps", "Keycaps", "Dye-sublimated legends · textured finish"],
  ["switch", "Switches", "Low-profile · 55 g · hot-swap"],
  ["frame", "Top shell", "CNC aluminium, anodised silver"],
  ["plate", "Plate", "Aluminium · under every switch"],
  ["pcb", "Logic board", "Hot-swap sockets · Bluetooth LE · USB-C"],
  ["battery", "Battery", "Sealed lithium-ion · not replaceable"],
  ["base", "Bottom shell", "Gunmetal aluminium · magnetic feet"],
] as const;

const PARTS = [
  ["cap", "Keycap", "Orange, like the cable"],
  ["switch", "Switch", "Low-profile, hot-swappable"],
  ["spring", "Spring", "55 g of resistance"],
  ["pad", "Key light", "Glows up through the cap"],
] as const;

export function Labels({ ref }: { ref?: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className={styles.labels}>
      {LAYERS.map(([layer, title, note]) => (
        <div key={layer} className={`${styles.label} ${styles.left}`} data-layer={layer}>
          <div className={styles.box}>
            <b>{title}</b>
            <span>{note}</span>
          </div>
        </div>
      ))}
      {PARTS.map(([part, title, note]) => (
        <div key={part} className={`${styles.label} ${styles.right}`} data-part={part}>
          <div className={styles.box}>
            <b>{title}</b>
            <span>{note}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
