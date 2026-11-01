import { useState, type FormEvent } from "react";
import { Wordmark } from "./Wordmark";
import { BRAND, MAKER } from "../lib/product";
import styles from "./Header.module.css";

// The page's top bar: the logo, the product options, and an email field with "Get Updates". The
// options do not link anywhere yet (this page is one product). To make one clickable later, give
// it an `href` below and it renders as a real link. The form sends nothing anywhere.
const LINKS: { label: string; tag?: string; href?: string }[] = [
  { label: "keyboard" },
  { label: "numpad" },
  { label: "keysets", tag: "NEW" },
  { label: "lightswitch" },
];

export function Header() {
  const [sent, setSent] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <header className={styles.header}>
      <a className={styles.logo} href="#top" aria-label={`${BRAND} ${MAKER}`} onClick={(e) => (e.preventDefault(), scrollTo({ top: 0, behavior: "smooth" }))}>
        <Wordmark height={22} />
        <small>{MAKER}</small>
      </a>
      <ul className={styles.links}>
        {LINKS.map(({ label, tag, href }, i) => {
          const inner = (
            <>
              {label}
              {tag && <b>{tag}</b>}
            </>
          );
          return (
            <li key={label} className={i === 0 ? styles.current : undefined} aria-current={i === 0 ? "page" : undefined}>
              {href ? <a href={href}>{inner}</a> : <span>{inner}</span>}
            </li>
          );
        })}
      </ul>
      <form className={styles.form} onSubmit={submit}>
        <input type="email" name="email" placeholder="your email address" aria-label="Your email address" autoComplete="off" required />
        <button type="submit">Get Updates</button>
        {sent && (
          <span className={styles.sent} role="status">
            Concept page: nothing was sent.
          </span>
        )}
      </form>
    </header>
  );
}
