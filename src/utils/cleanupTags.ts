import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Player } from '@/types'

// 利用可能なタグオプション
const AVAILABLE_TAGS = ['249', 'SHIFT', 'きらくに']

// 不要なタグを削除する関数
export async function cleanupInvalidTags() {
  try {
    console.log('タグのクリーンアップを開始します...')
    
    const querySnapshot = await getDocs(collection(db, 'players'))
    const players = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (Player & { id: string })[]

    let updatedCount = 0

    for (const player of players) {
      if (player.tags && player.tags.length > 0) {
        // 有効なタグのみを保持
        const validTags = player.tags.filter(tag => AVAILABLE_TAGS.includes(tag))
        
        // タグが変更された場合のみ更新
        if (validTags.length !== player.tags.length) {
          const playerRef = doc(db, 'players', player.id)
          await updateDoc(playerRef, {
            tags: validTags.length > 0 ? validTags : undefined
          })
          
          console.log(`プレイヤー ${player.name} のタグを更新: ${player.tags.join(', ')} → ${validTags.join(', ') || 'なし'}`)
          updatedCount++
        }
      }
    }

    console.log(`タグのクリーンアップが完了しました。${updatedCount}人のプレイヤーを更新しました。`)
    return updatedCount
  } catch (error) {
    console.error('タグのクリーンアップ中にエラーが発生しました:', error)
    throw error
  }
}

// プレイヤーが有効なタグを持っているかチェック
export function hasValidTags(player: Player): boolean {
  if (!player.tags || player.tags.length === 0) {
    return false
  }
  
  return player.tags.some(tag => AVAILABLE_TAGS.includes(tag))
}
