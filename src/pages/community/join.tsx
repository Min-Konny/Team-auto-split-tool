import { useEffect, useState } from 'react'

import Head from 'next/head'

import Link from 'next/link'

import { useRouter } from 'next/router'

import Header from '@/components/Header'

import { COMMUNITY_249_ID, PRESET_COMMUNITIES } from '@/constants/community'

import { useCommunity } from '@/lib/useCommunity'



const CUSTOM_ID = '__custom__'



export default function CommunityJoinPage() {

  const [communityId, setCommunityId] = useState(COMMUNITY_249_ID)

  const [customId, setCustomId] = useState('')

  const [password, setPassword] = useState('')

  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  const { community, loading } = useCommunity()



  useEffect(() => {

    if (!loading && community) {

      window.location.replace('/team-maker')

    }

  }, [loading, community])



  useEffect(() => {

    const q = router.query.id

    if (typeof q === 'string' && q.trim()) {

      setCommunityId(CUSTOM_ID)

      setCustomId(q.trim())

    }

  }, [router.query.id])



  useEffect(() => {

    const q = router.query.error

    if (typeof q === 'string' && q.trim()) {

      setError(q.trim())

    }

  }, [router.query.error])



  const isCustom = communityId === CUSTOM_ID

  const resolvedId = isCustom ? customId.trim() : communityId



  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {

    if (!resolvedId) {

      e.preventDefault()

      setError('コミュニティ ID を入力してください')

    }

  }



  if (!loading && community) {

    return (

      <div style={{ padding: 48, textAlign: 'center', color: 'var(--fg-3)', fontFamily: 'JetBrains Mono', fontSize: 13 }}>

        ログイン済み — 移動中…

      </div>

    )

  }



  return (

    <>

      <Head>

        <title>ログイン | Team Maker</title>

      </Head>

      <Header />

      <main className="comm-page">

        <Link href="/" className="back">

          ← トップへ

        </Link>

        <h1>コミュニティに参加</h1>

        <p className="lead">

          コミュニティを選び、<strong>パスワード</strong>を入力してログインします。

          自分で作ったコミュニティは<strong>「その他」</strong>に作成時の ID を入力してください。

        </p>



        <div className="community-pick">

          {PRESET_COMMUNITIES.map((c) => (

            <button

              key={c.id}

              type="button"

              className={`comm-card${communityId === c.id ? ' active' : ''}`}

              onClick={() => setCommunityId(c.id)}

            >

              <span className="comm-name">{c.name}</span>

              <span className="comm-id">ID: {c.id}</span>

            </button>

          ))}

          <button

            type="button"

            className={`comm-card comm-card-wide${isCustom ? ' active' : ''}`}

            onClick={() => setCommunityId(CUSTOM_ID)}

          >

            <span className="comm-name">その他</span>

            <span className="comm-id">既存のコミュニティ ID を入力</span>

          </button>

        </div>



        <form method="POST" action="/api/auth/login" onSubmit={handleSubmit}>

          <input type="hidden" name="redirect" value="/team-maker" />

          {!isCustom && <input type="hidden" name="communityId" value={resolvedId} />}

          {isCustom && (

            <label>

              コミュニティ ID

              <input

                name="communityId"

                value={customId}

                onChange={(e) => setCustomId(e.target.value)}

                placeholder="作成時に表示された ID"

                autoComplete="off"

                required

              />

            </label>

          )}

          <label>

            パスワード

            <input

              type="password"

              name="password"

              value={password}

              onChange={(e) => setPassword(e.target.value)}

              autoComplete="current-password"

              required

            />

          </label>

          {error && <p className="err">{error}</p>}

          <button type="submit">ログイン</button>

        </form>



        <div className="create-box">

          <p>まだコミュニティがない場合</p>

          <Link href="/community/create" className="create-link">

            新しいコミュニティを作る →

          </Link>

        </div>

      </main>

      <style dangerouslySetInnerHTML={{ __html: css }} />

    </>

  )

}



const css = `

.comm-page{max-width:440px;margin:0 auto;padding:40px 24px}

.back{font-size:12px;color:var(--fg-3);text-decoration:none}

.comm-page h1{font-family:'Space Grotesk';font-size:22px;margin:16px 0 8px}

.lead{font-size:13px;color:var(--fg-2);line-height:1.5;margin:0 0 20px}

.community-pick{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px}

.comm-card{padding:14px;border-radius:12px;border:1px solid var(--line);background:var(--bg-1);cursor:pointer;text-align:left}

.comm-card-wide{grid-column:1/-1}

.comm-card.active{border-color:var(--blue-d);background:color-mix(in oklch,var(--blue) 12%,transparent)}

.comm-name{display:block;font-weight:700;font-size:15px}

.comm-id{display:block;font-size:11px;color:var(--fg-3);margin-top:4px;font-family:'JetBrains Mono'}

form{display:flex;flex-direction:column;gap:14px}

label{display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--fg-3)}

input{padding:11px 12px;border-radius:9px;border:1px solid var(--line);background:var(--bg-1);color:var(--fg-0)}

button[type=submit]{padding:13px;border-radius:10px;border:0;background:var(--fg-0);color:var(--bg-0);font-weight:700;cursor:pointer}

button:disabled{opacity:.4}

.err{color:var(--red);font-size:13px}

.create-box{margin-top:28px;padding-top:20px;border-top:1px solid var(--line);text-align:center}

.create-box p{margin:0 0 10px;font-size:12px;color:var(--fg-3)}

.create-link{display:inline-block;font-size:14px;font-weight:600;color:var(--blue);text-decoration:none}

.create-link:hover{text-decoration:underline}

`


