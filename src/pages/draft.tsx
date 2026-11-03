import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import positions from '@/lib/draftPositions.json'
import { appendDraftChoice, champions, championsById, draftOrder, normalizeChampionSearch, patch, type DraftRoom, type Side } from '@/lib/draft'

const portrait = (image: string) => 'https://ddragon.leagueoflegends.com/cdn/' + patch + '/img/champion/' + image

const roleFilters = ['ALL', 'TOP', 'JG', 'MID', 'ADC', 'SUP'] as const
type RoleFilter = typeof roleFilters[number]

type Keys = Record<Side | 'HOST', string>

async function requestRoom(path: string, body?: object) {
  const response = await fetch('/api/draft/room' + path, body ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  } : { cache: 'no-store' })
  const data = await response.json()
  return { response, ...data } as { response: Response; room?: DraftRoom; keys?: Keys; error?: string }
}

const turnSeconds = 30

function DraftTimer({ startedAt }: { startedAt: number }) {
  const readTime = () => Math.max(0, turnSeconds - Math.floor((Date.now() - startedAt) / 1000))
  const [seconds, setSeconds] = useState(readTime)
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds(readTime()), 250)
    return () => window.clearInterval(timer)
  }, [startedAt])
  return <span className={seconds === 0 ? 'draft-timer overtime' : 'draft-timer'} role="timer" aria-label="手番の目安">
    {Math.min(turnSeconds, seconds)}秒{seconds === 0 ? ' · 確定待ち' : ''}
  </span>
}

export default function DraftPage() {
  const router = useRouter()
  const id = typeof router.query.room === 'string' ? router.query.room : ''
  const [room, setRoom] = useState<DraftRoom>()
  const [keys, setKeys] = useState<Keys>()
  const [seat, setSeat] = useState<Side | 'HOST'>()
  const [key, setKey] = useState('')
  const [selected, setSelected] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')
  const poolScroll = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState('')
  const [shareFallback, setShareFallback] = useState('')
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const activeRoom = room?.id === (id || 'local') ? room : undefined
  const turn = activeRoom?.choices.length ?? 0
  const action = activeRoom ? draftOrder[turn] : undefined
  const canChoose = action && (seat === 'HOST' || seat === action.side)
  const used = new Set(activeRoom?.choices)
  const preview = selected && !used.has(selected) ? championsById.get(selected) : undefined
  const query = normalizeChampionSearch(search.trim())
  const roleChampions = roleFilter === 'ALL' ? champions : positions[roleFilter].flatMap((championId) => championsById.get(championId) ?? [])
  const filtered = roleChampions.filter((champion) =>
    normalizeChampionSearch(champion.name).includes(query) || normalizeChampionSearch(champion.id).includes(query))

  function resetPoolScroll() {
    if (poolScroll.current) poolScroll.current.scrollTop = 0
  }

  useEffect(() => {
    if (!id) return
    let active = true
    let timer: number
    const params = new URLSearchParams(location.hash.slice(1))
    const side = params.get('side')
    const linkKey = params.get('key')
    if ((side === 'BLUE' || side === 'RED') && linkKey) {
      setSeat(side)
      setKey(linkKey)
      setKeys(undefined)
    } else {
      try {
        const stored = sessionStorage.getItem('draft:' + id)
        const localKeys = stored ? JSON.parse(stored) as Keys : undefined
        setKeys(localKeys)
        setKey(localKeys?.HOST ?? '')
        setSeat(localKeys ? 'HOST' : undefined)
      } catch {
        setKeys(undefined)
        setKey('')
        setSeat(undefined)
      }
    }
    async function poll() {
      let keepPolling = true
      try {
        if (!document.hidden) {
          const data = await requestRoom('?id=' + encodeURIComponent(id))
          if (!active) return
          if (!data.response.ok || !data.room) {
            setStatus(data.error || 'ルームに接続できませんでした')
            keepPolling = data.response.status >= 500
            if (!keepPolling) setRoom(undefined)
          } else {
            const next = data.room
            setStatus((message) => message === '通信が切れました。再接続しています。' ? '' : message)
            setRoom((current) => current?.id === id && current.choices.length > next.choices.length ? current : next)
            keepPolling = next.choices.length < draftOrder.length
          }
        }
      } catch {
        if (active) setStatus('通信が切れました。再接続しています。')
      }
      if (active && keepPolling) timer = window.setTimeout(poll, 2500)
    }
    void poll()
    return () => { active = false; window.clearTimeout(timer) }
  }, [id])

  const create = async () => {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setStatus('')
    try {
      const data = await requestRoom('', {})
      if (!data.response.ok || !data.room || !data.keys) throw new Error(data.error || '作成できませんでした')
      sessionStorage.setItem('draft:' + data.room.id, JSON.stringify(data.keys))
      setRoom(data.room)
      setSeat('HOST')
      setKey(data.keys.HOST)
      setKeys(data.keys)
      await router.replace('/draft?room=' + data.room.id)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '作成できませんでした')
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  const confirm = async (champion: string | null) => {
    if (!activeRoom || !canChoose || pending.current) return
    if (!appendDraftChoice(activeRoom.choices, turn, seat!, champion)) return
    if (!id) {
      setRoom({ ...activeRoom, choices: [...activeRoom.choices, champion], turnStartedAt: Date.now() })
      setSelected('')
      return
    }
    pending.current = true
    setBusy(true)
    setStatus('')
    try {
      const data = await requestRoom('?id=' + encodeURIComponent(id), { turn, key, champion })
      if (data.room) {
        const next = data.room
        setRoom((current) => current?.id === id && current.choices.length > next.choices.length ? current : next)
      }
      if (!data.response.ok) throw new Error(data.error || '確定できませんでした')
      setSelected('')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '確定できませんでした')
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  function linkFor(side?: Side) {
    const url = location.origin + '/draft?room=' + id
    return side && keys ? url + '#side=' + side + '&key=' + keys[side] : url
  }

  async function copyLink(text: string, combined = false) {
    setShareFallback('')
    try {
      await navigator.clipboard.writeText(text)
      setStatus(combined ? '3つのリンクをまとめてコピーしました' : 'リンクをコピーしました')
    } catch {
      if (combined) setShareFallback(text)
      setStatus(combined ? '共有メッセージを選んでコピーしてください' : '入力欄のリンクを選んでコピーしてください')
    }
  }

  function copyAllLinks() {
    return copyLink([
      'LoL BAN / PICK',
      '🔵 BLUE 操作リンク', linkFor('BLUE'),
      '🔴 RED 操作リンク', linkFor('RED'),
      '👀 観戦リンク', linkFor(),
    ].join('\n'), true)
  }

  function renderSlots(side: Side, kind: 'BAN' | 'PICK') {
    let slotNumber = 0
    return draftOrder.map((slot, index) => {
      if (slot.side !== side || slot.kind !== kind) return null
      slotNumber += 1
      const choice = activeRoom?.choices[index]
      const champion = choice ? championsById.get(choice) : undefined
      return <span className="draft-slot" key={index} data-active={index === turn} title={champion?.name}>
        {champion && <img src={portrait(champion.image)} alt={kind === 'BAN' ? champion.name : ''} width="36" height="36" />}
        {!champion && kind === 'BAN' && <span className="draft-empty" aria-hidden="true">{choice === null ? '×' : '◇'}</span>}
        {kind === 'PICK' && <span className="draft-slot-text">
          <span className="draft-summoner">サモナー{slotNumber}</span>
          {(champion || index === turn) && <span className="draft-slot-label">{champion?.name ?? '選択中'}</span>}
        </span>}
      </span>
    })
  }

  function renderPicks(side: Side) {
    return <section className={'draft-side ' + side.toLowerCase()} aria-label={side + ' PICKS'}>
      <h2>{side} <small>PICKS</small></h2>
      <div className="draft-picks">{renderSlots(side, 'PICK')}</div>
    </section>
  }

  return (
    <>
      <Header />
      <main className={activeRoom ? "draft-page room-open" : "draft-page"}>
        <header className="draft-head">
          <p>CUSTOM 5V5 · PATCH {patch}</p>
          <h1>BAN / PICK</h1>
          <p>青・赤で進める共有ドラフト</p>
        </header>
        {!activeRoom && !id && <div className="draft-actions">
          <button disabled={busy} onClick={create}>共有ルームを作成</button>
          <button disabled={busy} onClick={() => {
            setStatus('')
            setSeat('HOST')
            setRoom({ id: 'local', choices: [], expiresAt: 0, turnStartedAt: Date.now() })
          }}>この端末だけで試す</button>
        </div>}
        {!activeRoom && id && !status && <p role="status">ルームを読み込み中…</p>}
        {status && <p role="status">{status}</p>}
        {activeRoom && <>
          {keys && id && <details className="draft-room-links"><summary>共有リンク</summary><div className="draft-links">
            <div className="draft-share">
              <button type="button" onClick={copyAllLinks}>3つのリンクをまとめてコピー</button>
              {shareFallback && <textarea aria-label="共有メッセージ" readOnly value={shareFallback} rows={7}
                onFocus={(event) => event.currentTarget.select()} />}
            </div>
            {(['BLUE', 'RED', 'VIEW'] as const).map((side) => <label key={side}>
              {side === 'VIEW' ? '観戦リンク' : side + ' 操作リンク'}
              <input readOnly value={linkFor(side === 'VIEW' ? undefined : side)} onFocus={(event) => event.currentTarget.select()} />
              <button type="button" onClick={() => copyLink(linkFor(side === 'VIEW' ? undefined : side))}>コピー</button>
            </label>)}
          </div></details>}
          <div className="draft-arena">
            <div className="draft-round" aria-live="polite">
              <b>{action ? action.side + ' ' + action.kind : 'ドラフト完了'}</b>
              <span>{turn}/{draftOrder.length} 確定</span>
              {action && activeRoom.turnStartedAt !== undefined && <DraftTimer key={activeRoom.turnStartedAt} startedAt={activeRoom.turnStartedAt} />}
            </div>
            <div className="draft-arena-body">
              {renderPicks('BLUE')}
              <section className="draft-pool" aria-label="チャンピオン一覧">
                {action ? <>
                  <div className="draft-pool-toolbar">
                    <input aria-label="チャンピオン検索" placeholder="チャンピオン名で検索" value={search} onChange={(event) => { setSearch(event.target.value); resetPoolScroll() }} />
                    {preview && <details className="draft-art">
                      <summary>イラスト</summary>
                      <figure className="draft-preview">
                        <img src={'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/' + preview.id + '_0.jpg'} alt={preview.name} />
                        <figcaption>{preview.name}</figcaption>
                      </figure>
                    </details>}
                  </div>
                  <div className="draft-role-filters" role="group" aria-label="ロールで絞り込む">
                    {roleFilters.map((role) => <button type="button" key={role} aria-pressed={roleFilter === role}
                      onClick={() => { setRoleFilter(role); resetPoolScroll() }}>{role === 'ALL' ? 'すべて' : role}</button>)}
                  </div>
                  <div ref={poolScroll} className="draft-pool-scroll" tabIndex={0} role="region" aria-label="チャンピオンをスクロール">
                    <div className="draft-champions">
                      {filtered.map((champion) => <button type="button" key={champion.id} disabled={!canChoose || busy || used.has(champion.id)}
                        aria-pressed={selected === champion.id} onClick={() => setSelected(champion.id)}>
                        <img src={portrait(champion.image)} alt="" loading="lazy" width="52" height="52" />
                        <span>{champion.name}</span>
                      </button>)}
                    </div>
                    {!filtered.length && <p>該当するチャンピオンはいません。</p>}
                  </div>
                </> : <div className="draft-complete">ドラフト完了 <small>両チームの編成が確定しました</small></div>}
              </section>
              {renderPicks('RED')}
            </div>
            <div className="draft-arena-footer">
              <section className="draft-bans blue" aria-label="BLUE BANS">{renderSlots('BLUE', 'BAN')}</section>
              <div className="draft-confirm-inner">
                {action && <>
                  <span className="draft-confirm-choice" aria-live="polite">{canChoose ? preview?.name ?? 'チャンピオンを選択' : '選択待ち'}</span>
                  {canChoose && action.kind === 'BAN' && <button type="button" disabled={busy} onClick={() => confirm(null)}>BANなし</button>}
                  {canChoose && <button type="button" className="draft-confirm" disabled={busy || !preview} onClick={() => confirm(selected)}>
                    {busy ? '確定中…' : action.kind + '確定'}
                  </button>}
                </>}
              </div>
              <section className="draft-bans red" aria-label="RED BANS">{renderSlots('RED', 'BAN')}</section>
            </div>
          </div>
        </>}
        <p className="draft-credit">LoL Team Maker isn’t endorsed by Riot Games and doesn’t reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.</p>
      </main>
      <style jsx global>{`
        .draft-page { max-width: 1200px; margin: auto; padding: 20px clamp(12px,3vw,36px) 45px; }
        .draft-head { padding: 16px 20px; border: 1px solid var(--line); border-radius: 12px; background: linear-gradient(110deg,var(--blue-bg),var(--bg-1),var(--red-bg)); }
        .draft-head h1 { font: 700 clamp(34px,6vw,60px)/1 var(--font-display),sans-serif; margin-block: 5px; }
        .draft-head p,.draft-credit { color: var(--fg-1); font-size: 12px; }
        .draft-actions,.draft-links { display: flex; flex-wrap: wrap; gap: 8px; margin-block: 12px; }
        .draft-share { flex: 1 0 100%; display: grid; justify-items: start; gap: 8px; }
        .draft-share button { border-color: var(--gold); color: var(--gold); font-weight: 700; }
        .draft-share textarea { width: 100%; padding: 8px; border: 1px solid var(--line-2); border-radius: 6px; background: var(--bg-1); }
        .draft-links label { display: grid; flex: 1 1 180px; gap: 4px; font-size: 12px; }
        .draft-page input,.draft-page button { min-width: 0; border-radius: 6px; padding: 7px 10px; border: 1px solid var(--line-2); background: var(--bg-1); color: var(--fg-0); }
        .draft-page button:disabled { opacity: .5; }
        .draft-page button[aria-pressed=true] { border-color: var(--gold); }
        .draft-page.room-open { max-width: 1460px; padding: 8px clamp(10px, 2vw, 24px) 20px; }
        .room-open .draft-head { display: flex; align-items: center; justify-content: space-between; padding: 8px 14px; }
        .room-open .draft-head h1 { font-size: 20px; margin: 0; }
        .room-open .draft-head p:last-child { display: none; }
        .draft-room-links { margin-block: 6px; }
        .draft-room-links summary { cursor: pointer; color: var(--fg-1); font-size: 12px; }
        .draft-arena { --draft-side: clamp(116px, 16vw, 225px); border: 1px solid #52452f; border-radius: 10px; overflow: clip; background: #0b1019; margin-top: 6px; }
        .draft-round { display: flex; justify-content: center; align-items: center; gap: 12px; padding: 6px; min-height: 36px; color: var(--gold); background: linear-gradient(90deg,#10243a,#191815,#391c24); border-bottom: 1px solid #52452f; }
        .draft-round > span { font-size: 12px; }
        .draft-arena-body { display: grid; grid-template-columns: var(--draft-side) minmax(0, 1fr) var(--draft-side); height: clamp(280px, calc(100dvh - 225px), 660px); }
        .draft-side { min-width: 0; display: flex; flex-direction: column; gap: 6px; padding: 8px; background: #0d1a29; border-top: 2px solid var(--blue); }
        .draft-side.red { background: #23141e; border-color: var(--red); }
        .draft-side h2 { font-weight: 800; color: var(--blue); }
        .draft-side.red h2 { color: var(--red); text-align: right; }
        .draft-side small { color: var(--fg-1); font-size: 10px; }
        .draft-picks { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: repeat(5, minmax(0, 1fr)); flex: 1; min-height: 0; gap: 5px; }
        .draft-slot { min-width: 0; display: flex; align-items: center; gap: 7px; background: #0a111c; border: 1px solid var(--line); border-radius: 5px; padding: 4px; font-size: 12px; }
        .red .draft-picks .draft-slot { flex-direction: row-reverse; text-align: right; }
        .draft-slot[data-active=true] { border-color: var(--gold); color: var(--gold); }
        .draft-slot img { flex-shrink: 0; border-radius: 4px; }
        .draft-slot-text { min-width: 0; display: grid; gap: 2px; }
        .draft-summoner { color: var(--fg-1); font-size: 11px; white-space: nowrap; }
        .draft-slot-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .draft-empty { display: grid; place-items: center; width: 36px; flex-shrink: 0; color: var(--fg-2); }
        .draft-pool { display: flex; min-width: 0; min-height: 0; flex-direction: column; border-inline: 1px solid #52452f; }
        .draft-pool-toolbar { position: relative; display: flex; align-items: center; gap: 8px; padding: 7px; border-bottom: 1px solid var(--line); }
        .draft-pool-toolbar input { flex: 1; }
        .draft-art summary { color: var(--gold); cursor: pointer; font-size: 12px; }
        .draft-preview { position: absolute; z-index: 3; top: 100%; right: 5px; margin: 0; width: min(90%, 420px); background: #111621; border: 1px solid var(--gold); border-radius: 6px; overflow: hidden; }
        .draft-preview img { width: 100%; max-height: 37dvh; object-fit: cover; }
        .draft-preview figcaption { padding: 4px 8px; }
        .draft-role-filters { display: flex; flex-wrap: wrap; gap: 4px; padding: 5px 7px; border-bottom: 1px solid var(--line); }
        .draft-role-filters button { padding: 3px 7px; font-size: 10px; white-space: nowrap; }
        .draft-role-filters button[aria-pressed=true] { background: var(--gold); color: #17131a; font-weight: 800; }
        .draft-pool-scroll { min-height: 0; overflow-y: auto; padding: 7px; }
        .draft-champions { display: grid; grid-template-columns: repeat(auto-fill, minmax(58px, 1fr)); gap: 5px; }
        .draft-champions button { display: grid; justify-items: center; min-width: 0; padding: 2px; gap: 2px; font-size: 10px; }
        .draft-champions button img { width: 100%; max-width: 62px; height: auto; aspect-ratio: 1; border-radius: 3px; }
        .draft-champions button span { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .draft-arena-footer { display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; align-items: center; padding: 6px 8px; border-top: 1px solid #52452f; background: #141922; }
        .draft-bans { display: flex; min-width: 0; gap: 4px; }
        .draft-bans.red { justify-content: flex-end; }
        .draft-bans .draft-slot { display: grid; place-items: center; width: clamp(22px, 4vw, 43px); aspect-ratio: 1; padding: 2px; }
        .draft-bans .draft-slot img { width: 100%; height: auto; }
        .draft-bans .draft-empty { width: auto; }
        .draft-confirm-inner { display: flex; align-items: center; justify-content: center; gap: 6px; }
        .draft-confirm-choice { font-size: 12px; color: var(--fg-1); }
        .draft-confirm { border-color: var(--gold); background: var(--gold); color: #17131a; font-weight: 800; }
        .draft-complete { margin: auto; text-align: center; color: var(--gold); font-size: 24px; }
        .draft-complete small { display: block; color: var(--fg-1); font-size: 12px; }
        .draft-timer { font-variant-numeric: tabular-nums; color: var(--gold); }
        .draft-timer.overtime { color: var(--red); }
        @media (max-width: 720px) {
          .draft-arena { --draft-side: 51px; }
          .draft-side { padding: 4px; }
          .draft-side h2 { font-size: 10px; text-align: center; }
          .draft-side.red h2 { text-align: center; }
          .draft-side small, .draft-picks .draft-slot-label { display: none; }
          .draft-picks .draft-slot, .red .draft-picks .draft-slot { flex-direction: column; justify-content: center; gap: 2px; padding: 1px; }
          .draft-summoner { font-size: 8px; }
          .draft-picks img { width: 28px; height: 28px; }
          .draft-arena-body { height: clamp(265px, calc(100dvh - 255px), 520px); }
          .draft-pool-toolbar input { width: 100%; }
          .draft-champions { grid-template-columns: repeat(auto-fill, minmax(44px, 1fr)); }
          .draft-arena-footer { grid-template-columns: 1fr 1fr; }
          .draft-confirm-inner { grid-area: 2 / 1 / auto / 3; }
        }
        .draft-credit { margin-top: 20px; }
      `}</style>
    </>
  )
}
