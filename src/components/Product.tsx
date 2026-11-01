import { useEffect, useRef, useState } from "react";
import { BANNERS, BRAND, BULLETS, CHIPS, GALLERY, MAKER, PRICE, SPECS, TIMER_STEPS } from "../lib/product";
import { Footer } from "./Footer";
import styles from "./Product.module.css";

// The display's five timer screens, drawn in CSS: pick a mode, pick the minutes, running, counting down, done.
const MINUTES = [5, 10, 15, 30, 60, 120];
const picker = (sel: number) => (
  <>
    <i className={styles.glyph} />
    {MINUTES.map((m, i) => (
      <span key={m} className={i === sel ? styles.sel : undefined}>
        {m}
      </span>
    ))}
  </>
);
const SCREENS = [
  picker(0),
  picker(1),
  <><span className={styles.bar} style={{ height: "78%" }} /><em>9:59</em></>,
  <><span className={styles.bar} style={{ height: "46%" }} /><em>5:42</em></>,
  <><span>10 min timer ended</span><span>Restart</span><span className={styles.sel}>Back</span></>,
];

// The page below the 3D story: the pre-order box, the timer, the specs.
export function Product() {
  const [shot, setShot] = useState(0);
  const [noted, setNoted] = useState(false);
  const [stickyOn, setStickyOn] = useState(false);
  const buy = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = buy.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStickyOn(e.boundingClientRect.top < 0 && !e.isIntersecting), { rootMargin: "-80px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const preorder = () => setNoted(true);

  return (
    <div className={styles.page} id="details">
      <section ref={buy} id="buy" className={`${styles.wrap} ${styles.buy}`} aria-labelledby="product-title">
        <div className={styles.gallery}>
          <div className={styles.main}>
            <img key={GALLERY[shot].src} src={GALLERY[shot].src} alt={GALLERY[shot].alt} decoding="async" />
          </div>
          <ul className={styles.thumbs} aria-label="Product photos">
            {GALLERY.map((g, i) => (
              <li key={g.src}>
                <button type="button" onClick={() => setShot(i)} aria-label={`Show photo ${i + 1}`} aria-current={i === shot}>
                  <img src={g.src} alt="" loading="lazy" decoding="async" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.info}>
          <p className={styles.maker}>{MAKER}</p>
          <h1 id="product-title" className={styles.title}>
            {BRAND}
          </h1>
          <p className={styles.sub}>The keyboard with two knobs and a display.</p>
          <div className={styles.price}>
            <strong>{PRICE}</strong>
            <span>Pre-order · ships this fall</span>
          </div>
          <ul className={styles.chips}>
            {CHIPS.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={preorder}>
              Pre-order · {PRICE}
            </button>
          </div>
          {noted && (
            <p className={styles.note} role="status">
              This is a portfolio concept, so there's no checkout. Nothing was ordered.
            </p>
          )}
          <div className={styles.bullets}>
            <h2>What's different:</h2>
            <ul>
              {BULLETS.map(([k, v]) => (
                <li key={k}>
                  <b>{k}.</b> {v}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.timer} aria-labelledby="timer-title">
        <div className={styles.wrap}>
          <h2 id="timer-title">Setting a timer</h2>
          <p>Turn a knob to pick the time. The display shows it, then counts it down.</p>
          <ol className={styles.steps}>
            {TIMER_STEPS.map(([n, t], i) => (
              <li key={n}>
                <div className={styles.screen} aria-hidden="true">
                  {SCREENS[i]}
                </div>
                <b>{n}</b>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.banners} aria-label="More photos">
        {BANNERS.map((b) => (
          <img key={b.src} src={b.src} alt={b.alt} loading="lazy" decoding="async" />
        ))}
      </section>

      <section id="product-specs" className={styles.specs} aria-labelledby="specs-title">
        <div className={styles.wrap}>
          <h2 id="specs-title">The facts</h2>
          <div className={styles.groups}>
            {SPECS.map(([group, rows]) => (
              <div key={group}>
                <h3>{group}</h3>
                <dl>
                  {rows.map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      <div className={`${styles.sticky} ${stickyOn ? styles.show : ""}`} aria-hidden={!stickyOn}>
        <div>
          <strong>{PRICE}</strong>
          <span>{BRAND}</span>
        </div>
        <button type="button" tabIndex={stickyOn ? 0 : -1} onClick={preorder}>
          Pre-order
        </button>
      </div>
    </div>
  );
}
