import Link from 'next/link'
import { useReducedMotion } from 'framer-motion'
import Header from '@/components/Header'
import ActionCard from '@/components/home/ActionCard'

const actions = [
  { href: '/players', num: '01 / ROSTER', title: 'プレイヤー一覧', desc: 'メンバーのレート、得意ロール、戦績をチェック。', cta: 'VIEW ROSTER', cls: 'players' },
  { href: '/players/new', num: '02 / RECRUIT', title: 'プレイヤー登録', desc: '新しい仲間を登録して、次のカスタムへ。', cta: 'ADD PLAYER', cls: 'new' },
  { href: '/matches', num: '03 / ARCHIVE', title: '試合履歴', desc: '勝敗とレート変動、MVPなどの個人補正を振り返る。', cta: 'MATCH HISTORY', cls: 'match' },
]

export default function Home() {
  const reduced = useReducedMotion()
  return (
    <div className="rift-home">
      <Header />
      <main>
        <section className="rift-hero">
          <div className="rift-wrap rift-stage">
            <div className="rift-copy">
              <p className="rift-eyebrow"><span /> LEAGUE OF LEGENDS / CUSTOM 5V5</p>
              <h1>いつもの10人で、<br />次の一戦へ。</h1>
              <p className="rift-desc">レートと希望ロールからチームを自動編成。<br />試合が終わったら、勝敗とレート変動を記録。</p>
              <Link href="/team-maker" className="rift-start">チームを作成 <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="rift-art-credit" aria-hidden="true">SUMMONER’S RIFT<br /><span>BLUE × RED / 5V5</span></div>
          </div>
          <div className="rift-wrap rift-strip">
            <span><b>01</b> メンバーを選ぶ</span><span><b>02</b> チームを分ける</span><span><b>03</b> 勝敗を記録する</span>
          </div>
        </section>
        <section className="rift-wrap rift-tools" aria-labelledby="rift-tools-title">
          <div className="rift-tools-head">
            <p className="rift-eyebrow"><span /> TEAM OPERATIONS</p>
            <h2 id="rift-tools-title">メンバーと試合記録</h2>
          </div>
          <div className="rift-actions">{actions.map((action) => <ActionCard key={action.href} action={action} reduced={reduced} />)}</div>
        </section>
      </main>
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </div>
  )
}

const css = `
.rift-home { --rift-gold:#ead29b; --rift-muted:#aab5ca; background:#0b0f19; color:#f3f5fb; }
.rift-wrap { width:min(1220px, calc(100% - 80px)); margin-inline:auto; }
.rift-hero { border-bottom:1px solid #2c3648; overflow:hidden; background:radial-gradient(ellipse at 12% 85%, #172941 0%, transparent 58%), radial-gradient(ellipse at 95% 0%, #341f32 0%, transparent 55%), #101524; }
.rift-stage { min-height:540px; display:grid; grid-template-columns:1.08fr 1fr; align-items:center; gap:20px; padding-block:52px 42px; }
.rift-eyebrow,.map-label,.map-index,.rift-strip,.rift-home .num,.rift-home .mono { font-family:var(--font-mono),monospace; letter-spacing:.13em; }
.rift-eyebrow { display:flex; align-items:center; gap:9px; color:var(--rift-gold); font-size:10px; font-weight:700; }
.rift-eyebrow > span { width:7px; height:7px; border:1px solid currentColor; transform:rotate(45deg); }
.rift-copy h1 { font:700 clamp(4.25rem,10vw,8.8rem)/.81 var(--font-display),sans-serif; margin:26px 0 25px; letter-spacing:-.075em; }
.rift-copy h1 > span { color:var(--rift-gold); }
.rift-copy h1 em { font:inherit; font-size:.47em; font-style:normal; letter-spacing:-.055em; color:#c6d5ec; white-space:nowrap; }
.rift-lede { font-weight:700; font-size:clamp(18px,2.5vw,25px); margin-bottom:8px; }
.rift-desc { color:var(--rift-muted); font-size:14px; line-height:1.8; }
.rift-start { display:inline-flex; gap:34px; align-items:center; margin-top:24px; padding:14px 20px; background:var(--rift-gold); color:#15141b; border-radius:4px; box-shadow:0 0 36px #ead29b24; font-weight:800; transition:background .18s; }
.rift-start:hover { background:#ffebba; }
.rift-start span { font-size:18px; line-height:1; }
.rift-map { position:relative; width:min(100%, 500px); margin-inline:auto; background:radial-gradient(ellipse, #5472a01c, transparent 68%); }
.rift-map svg { display:block; width:100%; filter:drop-shadow(0 18px 30px #060a1299); }
.map-label,.map-index { position:absolute; font-size:clamp(8px,1vw,11px); }
.map-label { display:flex; gap:7px; align-items:center; font-weight:700; background:#101523; border:1px solid #4d5367; padding:6px 8px; }
.map-label i { width:6px; height:6px; background:currentColor; transform:rotate(45deg); }
.map-red { top:9%; right:3%; color:#ffa5af; }
.map-blue { bottom:11%; left:3%; color:#9adfff; }
.map-index { bottom:2%; right:9%; color:var(--rift-muted); }
.rift-strip { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); border-top:1px solid #3d4a60; }
.rift-strip span { padding:15px 0; color:var(--rift-muted); font-size:11px; letter-spacing:.06em; }
.rift-strip b { color:var(--rift-gold); margin-right:8px; }
.rift-tools { padding-block:36px 64px; }
.rift-tools-head { margin-bottom:17px; }
.rift-tools h2 { font-weight:700; font-size:24px; margin-top:5px; }
.rift-actions { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
.rift-home .action-card { position:relative; overflow:hidden; min-height:166px; display:flex; flex-direction:column; padding:17px 19px; border:1px solid #343e52; border-radius:8px; background:#141c2b; }
.rift-home .action-card:hover { border-color:#98835c; }
.rift-home .action-card h3,.rift-home .action-card p,.rift-home .action-card .num,.rift-home .cta-row { position:relative; }
.rift-home .action-card h3 { font-size:17px; font-weight:700; margin-block:6px; }
.rift-home .action-card p { color:var(--rift-muted); font-size:13px; margin-bottom:14px; }
.rift-home .num,.rift-home .mono { color:var(--rift-gold); font-size:10px; }
.rift-home .cta-row { display:flex; justify-content:space-between; align-items:center; margin-top:auto; border-top:1px solid #343e52; padding-top:8px; }
.rift-home .card-shine { position:absolute; inset:0; pointer-events:none; opacity:0; background:radial-gradient(270px at var(--mx,50%) var(--my,50%),#cfa75b24,transparent 72%); }
.rift-home .action-card:hover .card-shine { opacity:1; }
.rift-home a:focus-visible { outline:2px solid var(--rift-gold); outline-offset:4px; }
@media(max-width:760px) {
  .rift-wrap { width:calc(100% - 36px); }
  .rift-stage { grid-template-columns:1fr; min-height:auto; gap:12px; padding-block:38px 14px; }
  .rift-map { max-width:340px; }
  .rift-actions { grid-template-columns:1fr; }
  .rift-tools { padding-block:26px 42px; }
  .rift-home .action-card { min-height:140px; }
}
@media(prefers-reduced-motion:reduce) { .rift-start { transition:none; } }
`
