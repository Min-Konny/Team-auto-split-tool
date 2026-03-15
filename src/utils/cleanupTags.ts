import { collection, doc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Player } from '@/types'

const TARGET_TAG = 'アーリ組'

// Ahri class用: 全プレイヤーのタグを「アーリ組」に統一
export async function cleanupInvalidTags() {
  try {
    console.log('タグ置換を開始します...')

    const querySnapshot = await getDocs(collection(db, 'players'))
    const players = querySnapshot.docs.map((playerDoc) => ({
      id: playerDoc.id,
      ...playerDoc.data(),
    })) as (Player & { id: string })[]

    let updatedCount = 0

    for (const player of players) {
      const currentTags = player.tags || []
      const shouldUpdate = currentTags.length !== 1 || currentTags[0] !== TARGET_TAG
      if (!shouldUpdate) continue

      const playerRef = doc(db, 'players', player.id)
      await updateDoc(playerRef, {
        tags: [TARGET_TAG],
      })

      console.log(
        `プレイヤー ${player.name} のタグを更新: ${currentTags.join(', ') || 'なし'} -> ${TARGET_TAG}`
      )
      updatedCount++
    }

    console.log(`タグ置換が完了しました。${updatedCount}人のプレイヤーを更新しました。`)
    return updatedCount
  } catch (error) {
    console.error('タグ置換中にエラーが発生しました:', error)
    throw error
  }
}

export function hasValidTags(player: Player): boolean {
  return !!player.tags?.includes(TARGET_TAG)
}
