import { useState, type FormEvent } from "react";
import { Wordmark } from "./Wordmark";
import { BRAND, MAKER } from "../lib/product";
import styles from "./Header.module.css";

// The page's top bar: the logo on the left, an email field and "Get Updates" on the right. The
// form sends nothing anywhere.

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
