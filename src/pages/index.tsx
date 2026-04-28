import Link from 'next/link'

const actions = [
  {
    href: '/team-maker',
    num: '01 / PRIMARY',
    title: '\u30c1\u30fc\u30e0\n\u4f5c\u6210',
    desc: '10\u4eba\u3092\u9078\u629e\u3057\u3001\u30ec\u30fc\u30c8\u3068\u5e0c\u671b\u30ed\u30fc\u30eb\u304b\u3089\u6700\u9069\u306a\u30c1\u30fc\u30e0\u3092\u81ea\u52d5\u751f\u6210\u3057\u307e\u3059\u3002',
    cta: 'START SPLIT',
    cls: 'primary',
  },
  {
    href: '/players',
    num: '02 / ROSTER',
    title: '\u30d7\u30ec\u30a4\u30e4\u30fc\u30ea\u30b9\u30c8',
    desc: '\u767b\u9332\u6e08\u307f\u30d7\u30ec\u30a4\u30e4\u30fc\u306e\u4e00\u89a7\u3068\u6226\u7e3e\u3001\u30ec\u30fc\u30c8\u3092\u78ba\u8a8d\u3067\u304d\u307e\u3059\u3002',
    cta: 'VIEW',
    cls: 'players',
  },
  {
    href: '/players/new',
    num: '03 / RECRUIT',
    title: '\u30d7\u30ec\u30a4\u30e4\u30fc\u767b\u9332',
    desc: '\u65b0\u3057\u3044\u30d7\u30ec\u30a4\u30e4\u30fc\u3092\u540d\u524d\u30fb\u30ed\u30fc\u30eb\u30fb\u30e9\u30f3\u30af\u3067\u8ffd\u52a0\u3057\u307e\u3059\u3002',
    cta: 'ADD',
    cls: 'new',
  },
  {
    href: '/matches',
    num: '04 / HISTORY',
    title: '\u8a66\u5408\u5c65\u6b74',
    desc: '\u904e\u53bb\u306e\u5bfe\u6226\u8a18\u9332\u3068\u52dd\u6557\u3001\u30ec\u30fc\u30c8\u5909\u52d5\u3092\u632f\u308a\u8fd4\u308a\u307e\u3059\u3002',
    cta: 'REVIEW',
    cls: 'match',
  },
]

export default function Home() {
  return (
    <div>
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" href="/">
            <span className="brand-mark" />
            <span className="brand-text">
              Team Maker<span className="brand-sub">/ LoL</span>
            </span>
          </Link>
          <nav className="nav">
            <Link href="/players">{'\u30d7\u30ec\u30a4\u30e4\u30fc'}</Link>
            <Link href="/players/new">{'\u767b\u9332'}</Link>
            <Link href="/matches">{'\u8a66\u5408\u5c65\u6b74'}</Link>
            <Link className="cta" href="/team-maker">{'\u30c1\u30fc\u30e0\u4f5c\u6210'} {'\u2192'}</Link>
          </nav>
        </div>
      </header>

      <section className="v1-hero">
        <div className="v1-split">
          <div className="v1-side blue">
            <div>
              <div className="side-tag"><span>BLUE SIDE</span><span className="dot" /></div>
              <h2>Bal-<br />anced.</h2>
              <div className="hex">{'// avg rate · 1842'}</div>
            </div>
          </div>

          <div className="v1-vs" />

          <div className="v1-side red">
            <div>
              <div className="side-tag"><span className="dot" /><span>RED SIDE</span></div>
              <h2>Fair<br />fight.</h2>
              <div className="hex">{'// avg rate · 1838'}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="v1-meta">
        <div className="cell"><div className="k">{'\u0394'} Rate Diff</div><div className="v">4<span className="unit">pts</span></div></div>
        <div className="cell"><div className="k">Players Pool</div><div className="v">42</div></div>
        <div className="cell"><div className="k">Matches Logged</div><div className="v">137</div></div>
        <div className="cell"><div className="k">Last Build</div><div className="v">21:42<span className="unit">JST</span></div></div>
      </div>

      <div className="container">
        <div className="v1-actions">
          {actions.map((a) => (
            <Link key={a.href} href={a.href} legacyBehavior>
              <a className={`action-card ${a.cls}`}>
                <span className="glyph" />
                <div className="num">{a.num}</div>
                <h3>{a.title}</h3>
                <p>{a.desc}</p>
                <div className="cta-row"><span className="mono">{a.cta}</span><span className="arr">{'\u2192'}</span></div>
              </a>
            </Link>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .topbar {
          position: sticky; top: 0; z-index: 30;
          backdrop-filter: blur(18px) saturate(140%);
          -webkit-backdrop-filter: blur(18px) saturate(140%);
          background: color-mix(in oklch, var(--bg-0) 82%, transparent);
          border-bottom: 1px solid var(--line);
        }
        .topbar-inner {
          max-width: 1440px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 32px;
        }
        .brand {
          display: flex; align-items: center; gap: 12px;
          font-family: 'Space Grotesk'; font-weight: 600; letter-spacing: -0.01em;
          text-decoration: none; color: var(--fg-0);
        }
        .brand-mark { width: 28px; height: 28px; position: relative; }
        .brand-mark::before, .brand-mark::after { content: ""; position: absolute; inset: 0; border-radius: 4px; }
        .brand-mark::before {
          background: linear-gradient(135deg, var(--blue) 0%, var(--blue-d) 100%);
          clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 100%, 0 50%);
        }
        .brand-mark::after {
          background: linear-gradient(135deg, var(--red-d) 0%, var(--red) 100%);
          clip-path: polygon(50% 100%, 100% 100%, 100% 50%);
        }
        .brand-text { font-size: 15px; }
        .brand-sub  { font-size: 11px; color: var(--fg-3); margin-left: 4px; font-family:'JetBrains Mono'; text-transform: uppercase; letter-spacing: 0.1em; }
        .nav { display: flex; gap: 4px; align-items: center; }
        .nav :global(a) {
          padding: 8px 14px; border-radius: 999px;
          color: var(--fg-1); font-size: 13.5px;
          transition: background 0.15s, color 0.15s;
          text-decoration: none;
        }
        .nav :global(a:hover) { background: var(--bg-2); color: var(--fg-0); }
        .nav :global(a.cta) {
          background: var(--fg-0);
          color: var(--bg-0);
          font-weight: 600;
          margin-left: 8px;
        }
        .nav :global(a.cta:hover) { background: var(--fg-1); }

        .container { max-width: 1440px; margin: 0 auto; padding: 0 32px; }
        .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
        .v1-hero { position: relative; overflow: hidden; border-bottom: 1px solid var(--line); }
        .v1-split { display: grid; grid-template-columns: 1fr auto 1fr; min-height: 460px; align-items: stretch; }
        .v1-side { padding: 52px 56px 44px; position: relative; display: flex; flex-direction: column; justify-content: space-between; }
        .v1-side.blue {
          background: linear-gradient(180deg, color-mix(in oklch, var(--blue-bg) 55%, transparent) 0%, color-mix(in oklch, var(--blue-bg) 10%, transparent) 100%);
          text-align: right;
        }
        .v1-side.red {
          background: linear-gradient(180deg, color-mix(in oklch, var(--red-bg) 55%, transparent) 0%, color-mix(in oklch, var(--red-bg) 10%, transparent) 100%);
        }
        .v1-side .side-tag {
          font-family: 'JetBrains Mono'; font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em;
          display: flex; align-items: center; gap: 8px;
        }
        .v1-side.blue .side-tag { justify-content: flex-end; color: var(--blue); }
        .v1-side.red .side-tag { color: var(--red); }
        .side-tag .dot {
          width: 7px; height: 7px; border-radius: 50%;
          box-shadow: 0 0 0 4px color-mix(in oklch, currentColor 18%, transparent);
        }
        .v1-side.blue .side-tag .dot { background: var(--blue); }
        .v1-side.red .side-tag .dot { background: var(--red); }
        .v1-side h2 {
          font-family: 'Space Grotesk'; font-weight: 700; font-size: clamp(48px, 7.4vw, 104px);
          line-height: 0.92; letter-spacing: -0.04em; margin: 28px 0 0;
        }
        .v1-side.blue h2 { color: var(--blue); }
        .v1-side.red h2 { color: var(--red); }
        .v1-side .hex { margin-top: 14px; font-family: 'JetBrains Mono'; font-size: 12px; color: var(--fg-3); }
        .v1-vs {
          width: 1px; background: linear-gradient(180deg, transparent 0%, var(--line-2) 30%, var(--line-2) 70%, transparent 100%);
          position: relative;
        }
        .v1-vs::after {
          content: "VS"; position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%);
          font-family: 'Space Grotesk'; font-weight: 700; font-size: 20px;
          background: var(--bg-0); padding: 16px 6px; color: var(--fg-2); letter-spacing: 0.05em;
        }
        .v1-meta { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); background: var(--bg-1); }
        .v1-meta .cell { padding: 22px 32px; border-right: 1px solid var(--line); }
        .v1-meta .cell:last-child { border-right: 0; }
        .v1-meta .k { font-family: 'JetBrains Mono'; font-size: 10px; text-transform: uppercase; letter-spacing: 0.16em; color: var(--fg-3); }
        .v1-meta .v { font-family: 'Space Grotesk'; font-size: 28px; font-weight: 600; margin-top: 6px; letter-spacing: -0.02em; }
        .v1-meta .v .unit { font-size: 13px; color: var(--fg-3); margin-left: 4px; font-family: 'JetBrains Mono'; }
        .v1-actions { padding: 40px 0 72px; display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 16px; }
        .action-card {
          border: 1px solid var(--line); border-radius: 14px; padding: 26px; background: var(--bg-1);
          display: flex; flex-direction: column; transition: border-color 0.2s, transform 0.2s, background 0.2s;
          min-height: 220px; position: relative; overflow: hidden; text-decoration: none; color: inherit;
        }
        .action-card:hover { border-color: var(--line-2); transform: translateY(-2px); background: var(--bg-2); }
        .action-card.primary {
          background: linear-gradient(135deg, color-mix(in oklch, var(--blue-bg) 70%, var(--bg-1)) 0%, color-mix(in oklch, var(--red-bg) 50%, var(--bg-1)) 100%);
          border-color: var(--line-2);
        }
        .action-card .num { font-family: 'JetBrains Mono'; font-size: 11px; color: var(--fg-3); letter-spacing: 0.1em; }
        .action-card h3 { white-space: pre-line; font-family: 'Space Grotesk'; font-size: 26px; font-weight: 600; letter-spacing: -0.02em; margin: 18px 0 10px; }
        .action-card.primary h3 { font-size: 36px; }
        .action-card p { color: var(--fg-2); font-size: 13.5px; line-height: 1.55; margin: 0 0 20px; flex: 1; }
        .action-card .cta-row {
          display: flex; align-items: center; justify-content: space-between; color: var(--fg-1); font-size: 13px;
          border-top: 1px solid var(--line); padding-top: 16px;
        }
        .action-card .cta-row .arr {
          width: 28px; height: 28px; border-radius: 50%; background: var(--bg-2); display: grid; place-items: center;
          transition: background 0.15s, transform 0.15s;
        }
        .action-card:hover .cta-row .arr { background: var(--fg-0); color: var(--bg-0); transform: translateX(2px); }
        .action-card.primary .cta-row .arr { background: var(--fg-0); color: var(--bg-0); }
        .action-card .glyph { position: absolute; right: -10px; top: -10px; width: 70px; height: 70px; border-radius: 50%; opacity: 0.4; }
        .action-card.players .glyph { background: radial-gradient(circle, var(--r-mid) 0%, transparent 70%); }
        .action-card.new .glyph { background: radial-gradient(circle, var(--r-jng) 0%, transparent 70%); }
        .action-card.match .glyph { background: radial-gradient(circle, var(--r-top) 0%, transparent 70%); }

        @media (max-width: 1024px) {
          .nav { display: none; }
          .v1-split { grid-template-columns: 1fr; }
          .v1-vs { display: none; }
          .v1-side.blue { text-align: left; }
          .v1-meta { grid-template-columns: 1fr 1fr; }
          .v1-actions { grid-template-columns: 1fr 1fr; padding-top: 28px; }
        }
        @media (max-width: 768px) {
          .container { padding: 0 20px; }
          .v1-side { padding: 38px 24px 32px; }
          .v1-meta .cell { padding: 16px 18px; }
          .v1-actions { grid-template-columns: 1fr; padding-bottom: 56px; }
        }
      ` }} />
    </div>
  )
}
