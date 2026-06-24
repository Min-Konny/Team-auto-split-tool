/** レガシー移行元（タグ分離後は参照のみ） */
export const DEFAULT_COMMUNITY_ID = 'default'

export const COMMUNITY_249_ID = '249'
export const COMMUNITY_KIRAKUNI_ID = 'kirakuni'
export const COMMUNITY_SHIFT_ID = 'shift'

export const TAG_249 = '249'
export const TAG_KIRAKUNI = 'きらくに'
export const TAG_SHIFT = 'SHIFT'

/** プリセットコミュニティのログインパスワード（平文はサーバーでのみ使用） */
export const PRESET_COMMUNITIES = [
  { id: COMMUNITY_249_ID, name: '249', password: 'VRC' },
  { id: COMMUNITY_KIRAKUNI_ID, name: 'きらくに', password: '5656' },
  { id: COMMUNITY_SHIFT_ID, name: 'SHIFT', password: 'LoLClub' },
] as const

export const PRESET_COMMUNITY_IDS = PRESET_COMMUNITIES.map((c) => c.id)

export function presetPasswordFor(communityId: string): string | null {
  const preset = PRESET_COMMUNITIES.find((c) => c.id === communityId)
  return preset?.password ?? null
}

/** ロビー共有リンクの有効時間（ミリ秒） */
export const LOBBY_TTL_MS = 12 * 60 * 60 * 1000
