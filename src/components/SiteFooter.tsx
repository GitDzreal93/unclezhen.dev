import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__row">
          <div>
            <Link className="brand" href="/home">
              <span className="brand__mark">&gt;</span>
              <span>zhen_shu</span>
            </Link>
            <p style={{ marginTop: 12, fontFamily: "var(--font-mono)", fontSize: 13 }}>
              hacker / builder · blog · projects · shop · game
            </p>
          </div>
          <ul className="footer-links">
            <li><Link href="/blog">/blog</Link></li>
            <li><Link href="/projects">/projects</Link></li>
            <li><Link href="/shop">/shop</Link></li>
            <li><Link href="/">/game</Link></li>
          </ul>
        </div>
        <p className="footer-copy">© zhen_shu · prototype · exit 0</p>
      </div>
    </footer>
  );
}
