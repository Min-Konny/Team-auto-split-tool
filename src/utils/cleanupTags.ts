import { collection, doc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { AVAILABLE_TAGS } from '@/constants/playerTags'
import { Player } from '@/types'

const VALID = new Set<string>([...AVAILABLE_TAGS])

/** タグ表記を整える */
function normalizeTag(tag: string): string {
  return tag.trim()
}

// 不要なタグを削除し、表記ゆれを修正する
export async function cleanupInvalidTags() {
  try {
    console.log('タグのクリーンアップを開始します...')

    const querySnapshot = await getDocs(collection(db, 'players'))
    const players = querySnapshot.docs.map((playerDoc) => ({
      id: playerDoc.id,
      ...playerDoc.data(),
    })) as (Player & { id: string })[]

    let updatedCount = 0

    for (const player of players) {
      if (!player.tags || player.tags.length === 0) continue

      const mapped = player.tags.map(normalizeTag)
      const validTags = mapped.filter((tag) => VALID.has(tag))

      if (validTags.length !== player.tags.length || mapped.some((x, i) => x !== player.tags![i])) {
        const playerRef = doc(db, 'players', player.id)
        await updateDoc(playerRef, {
          tags: validTags.length > 0 ? validTags : undefined,
        })

        console.log(
          `プレイヤー ${player.name} のタグを更新: ${player.tags.join(', ')} → ${validTags.join(', ') || 'なし'}`
        )
        updatedCount++
      }
    }

    console.log(`タグのクリーンアップが完了しました。${updatedCount}人のプレイヤーを更新しました。`)
    return updatedCount
  } catch (error) {
    console.error('タグのクリーンアップ中にエラーが発生しました:', error)
    throw error
  }
}

export function hasValidTags(player: Player): boolean {
  if (!player.tags || player.tags.length === 0) {
    return false
  }

  return player.tags.some((tag) => VALID.has(normalizeTag(tag)))
}
