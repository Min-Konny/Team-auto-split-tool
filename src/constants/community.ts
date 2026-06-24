/** レガシー移行元（タグ分離後は参照のみ） */
export const DEFAULT_COMMUNITY_ID = 'default'

export const COMMUNITY_249_ID = '249'
export const COMMUNITY_KIRAKUNI_ID = 'kirakuni'

export const TAG_249 = '249'
export const TAG_KIRAKUNI = 'きらくに'

/** 登録時にコミュニティ所属を証明するパスコード（平文はサーバーでのみ使用） */
export const PRESET_COMMUNITIES = [
  { id: COMMUNITY_249_ID, name: '249', passcode: '0249' },
  { id: COMMUNITY_KIRAKUNI_ID, name: 'きらくに', passcode: '5656' },
] as const

export const PRESET_COMMUNITY_IDS = PRESET_COMMUNITIES.map((c) => c.id)

/** ロビー共有リンクの有効時間（ミリ秒） */
export const LOBBY_TTL_MS = 12 * 60 * 60 * 1000
