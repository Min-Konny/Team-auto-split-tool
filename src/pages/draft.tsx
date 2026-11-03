import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import { appendDraftChoice, champions, championsById, draftOrder, patch, type DraftRoom, type Side } from '@/lib/draft'

const portrait = (image: string) => 'https://ddragon.leagueoflegends.com/cdn/' + patch + '/img/champion/' + image

type Keys = Record<Side | 'HOST', string>

async function requestRoom(path: string, body?: object) {
  const response = await fetch('/api/draft/room' + path, body ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  } : { cache: 'no-store' })
  const data = await response.json()
  return { response, ...data } as { response: Response; room?: DraftRoom; keys?: Keys; error?: string }
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
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const activeRoom = room?.id === (id || 'local') ? room : undefined
  const turn = activeRoom?.choices.length ?? 0
  const action = activeRoom ? draftOrder[turn] : undefined
  const canChoose = action && (seat === 'HOST' || seat === action.side)
  const used = new Set(activeRoom?.choices)
  const preview = selected && !used.has(selected) ? championsById.get(selected) : undefined
  const normalize = (value: string) => value.normalize('NFKC').toLowerCase()
  const query = normalize(search.trim())
  const filtered = champions.filter((champion) => normalize(champion.name).includes(query) || normalize(champion.id).includes(query))

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
      setRoom({ ...activeRoom, choices: [...activeRoom.choices, champion] })
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

  return (
    <>
      <Header />
      <main className="draft-page">
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
            setRoom({ id: 'local', choices: [], expiresAt: 0 })
          }}>この端末だけで試す</button>
        </div>}
        {!activeRoom && id && !status && <p role="status">ルームを読み込み中…</p>}
        {status && <p role="status">{status}</p>}
        {activeRoom && <>
          {keys && id && <div className="draft-links">
            {(['BLUE', 'RED', 'VIEW'] as const).map((side) => <label key={side}>
              {side === 'VIEW' ? '観戦リンク' : side + ' 操作リンク'}
              <input readOnly value={linkFor(side === 'VIEW' ? undefined : side)} onFocus={(event) => event.currentTarget.select()} />
              <button type="button" onClick={async () => {
                try {
                  await navigator.clipboard.writeText(linkFor(side === 'VIEW' ? undefined : side))
                  setStatus('リンクをコピーしました')
                } catch {
                  setStatus('入力欄のリンクを選んでコピーしてください')
                }
              }}>コピー</button>
            </label>)}
          </div>}
          <div className="draft-turn" aria-live="polite">
            {action ? <><b>{action.side} {action.kind}</b> · {turn + 1}/{draftOrder.length} {canChoose ? '・操作できます' : '・選択待ち'}</> : <b>ドラフト完了</b>}
          </div>
          <div className="draft-sides">
            {(['BLUE', 'RED'] as const).map((side) => <section className={'draft-side ' + side.toLowerCase()} key={side} aria-label={side}>
              <h2>{side} SIDE</h2>
              {(['BAN', 'PICK'] as const).map((kind) => <div className="draft-line" key={kind}>
                <b>{kind}</b>
                {draftOrder.map((slot, index) => ({ slot, index })).filter(({ slot }) => slot.side === side && slot.kind === kind).map(({ index }) => {
                  const choice = activeRoom.choices[index]
                  const champion = choice ? championsById.get(choice) : undefined
                  return <span className="draft-slot" key={index} data-active={index === turn}>
                    {champion && <img src={portrait(champion.image)} alt="" width="24" height="24" />}
                    {champion?.name ?? (choice === null ? 'なし' : '—')}
                  </span>
                })}
              </div>)}
            </section>)}
          </div>
          {action && <>
            {preview && <figure className="draft-preview">
              <img src={'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/' + preview.id + '_0.jpg'} alt="" />
              <figcaption>{preview.name} <small>{action.side} {action.kind} 候補</small></figcaption>
            </figure>}
            <div className="draft-actions">
              <input aria-label="チャンピオン検索" placeholder="チャンピオン名で検索" value={search} onChange={(event) => setSearch(event.target.value)} />
              {canChoose && <button disabled={busy || !selected || used.has(selected)} onClick={() => confirm(selected)}>{selected ? championsById.get(selected)?.name + ' を ' : ''}{action.kind}確定</button>}
              {canChoose && action.kind === 'BAN' && <button disabled={busy} onClick={() => confirm(null)}>BANなし</button>}
            </div>
            <div className="draft-champions">
              {filtered.map((champion) => <button type="button" key={champion.id} disabled={!canChoose || busy || used.has(champion.id)}
                aria-pressed={selected === champion.id} onClick={() => setSelected(champion.id)}>
                <img src={portrait(champion.image)} alt="" loading="lazy" width="44" height="44" />
                {champion.name}
              </button>)}
              {!filtered.length && <p>該当するチャンピオンはいません。</p>}
            </div>
          </>}
        </>}
        <p className="draft-credit">LoL Team Maker isn’t endorsed by Riot Games and doesn’t reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.</p>
      </main>
      <style jsx>{`
        .draft-page { max-width: 1200px; margin: auto; padding: 20px clamp(12px,3vw,36px) 45px; }
        .draft-head { padding: 16px 20px; border: 1px solid var(--line); border-radius: 12px; background: linear-gradient(110deg,var(--blue-bg),var(--bg-1),var(--red-bg)); }
        .draft-head h1 { font: 700 clamp(34px,6vw,60px)/1 var(--font-display),sans-serif; margin-block: 5px; }
        .draft-head p,.draft-credit { color: var(--fg-1); font-size: 12px; }
        .draft-actions,.draft-links { display: flex; flex-wrap: wrap; gap: 8px; margin-block: 12px; }
        .draft-links label { display: grid; flex: 1 1 180px; gap: 4px; font-size: 12px; }
        input,button { min-width: 0; border-radius: 6px; padding: 7px 10px; border: 1px solid var(--line-2); background: var(--bg-1); color: var(--fg-0); }
        button:disabled { opacity: .5; }
        button[aria-pressed=true] { border-color: var(--gold); }
        .draft-turn { padding: 10px 0; color: var(--gold); }
        .draft-sides { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .draft-side { min-width: 0; background: var(--bg-1); padding: 9px; border-top: 2px solid var(--blue); border-radius: 8px; }
        .draft-side.red { border-color: var(--red); }
        .draft-side h2 { font-weight: 700; }
        .draft-line { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; margin-top: 7px; font-size: 12px; }
        .draft-slot { display: inline-flex; align-items: center; gap: 5px; }
        .draft-slot img, .draft-champions img { border-radius: 4px; background: var(--bg-2); }
        .draft-preview { position: relative; overflow: hidden; margin: 12px 0 0; max-width: 480px; border: 1px solid var(--line-2); border-radius: 10px; background: var(--bg-1); }
        .draft-preview img { width: 100%; height: clamp(110px, 24vw, 190px); object-fit: cover; object-position: center 32%; }
        .draft-preview figcaption { position: absolute; inset: auto 0 0; padding: 16px 12px 7px; background: linear-gradient(transparent, #080e18); font-weight: 700; }
        .draft-preview small { margin-left: 8px; color: #ead29b; }
        .draft-line span { border: 1px solid var(--line); border-radius: 5px; padding: 3px 6px; }
        .draft-line [data-active=true] { border-color: var(--gold); }
        .draft-champions { display: grid; grid-template-columns: repeat(auto-fill,minmax(85px,1fr)); gap: 6px; }
        .draft-champions button { display: grid; justify-items: center; gap: 3px; font-size: 11px; }
        .draft-credit { margin-top: 20px; }
      `}</style>
    </>
  )
}
