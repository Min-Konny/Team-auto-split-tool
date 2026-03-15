import { collection, doc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Player } from '@/types'

const PRIMARY_TAG = 'アーリ組'
const SECONDARY_TAG = 'その他'
const VALID_TAGS = [PRIMARY_TAG, SECONDARY_TAG]
const LEGACY_TAGS = ['249', 'SHIFT', 'きらくに']

// Ahri class用: タグを「アーリ組 / その他」の2種類に正規化
export async function cleanupInvalidTags() {
  try {
    console.log('タグ正規化を開始します...')

    const querySnapshot = await getDocs(collection(db, 'players'))
    const players = querySnapshot.docs.map((playerDoc) => ({
      id: playerDoc.id,
      ...playerDoc.data(),
    })) as (Player & { id: string })[]

    let updatedCount = 0

    for (const player of players) {
      const currentTags = player.tags || []

      let nextTag = SECONDARY_TAG
      if (currentTags.includes(PRIMARY_TAG)) {
        nextTag = PRIMARY_TAG
      } else if (currentTags.includes(SECONDARY_TAG)) {
        nextTag = SECONDARY_TAG
      } else if (currentTags.some((tag) => LEGACY_TAGS.includes(tag))) {
        nextTag = SECONDARY_TAG
      }

      const shouldUpdate = currentTags.length !== 1 || currentTags[0] !== nextTag
      if (!shouldUpdate) continue

      const playerRef = doc(db, 'players', player.id)
      await updateDoc(playerRef, {
        tags: [nextTag],
      })

      console.log(
        `プレイヤー ${player.name} のタグを更新: ${currentTags.join(', ') || 'なし'} -> ${nextTag}`
      )
      updatedCount++
    }

    console.log(`タグ正規化が完了しました。${updatedCount}人のプレイヤーを更新しました。`)
    return updatedCount
  } catch (error) {
    console.error('タグ正規化中にエラーが発生しました:', error)
    throw error
  }
}

export function hasValidTags(player: Player): boolean {
  return !!player.tags?.some((tag) => VALID_TAGS.includes(tag))
}
