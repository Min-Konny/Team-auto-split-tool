import { Player, GameRole } from '@/types'

// 既存のプレイヤーデータ（5種類のロールレート）から新しい形式（メイン・サブレート）に移行する関数
export function migratePlayerRates(oldPlayer: any): Player {
  // 既存のratesオブジェクトからメインロールのレートを取得
  const mainRate = oldPlayer.rates[oldPlayer.mainRole] || 0
  
  // 他のロールのレートを計算（メインロールの90%）
  const subRate = Math.round(mainRate * 0.9)
  
  return {
    id: oldPlayer.id,
    name: oldPlayer.name,
    mainRole: oldPlayer.mainRole,
    mainRate,
    subRate,
    stats: oldPlayer.stats || { wins: 0, losses: 0 },
  }
}

// ロールに応じてレートを取得するヘルパー関数
export function getPlayerRate(player: Player, role: GameRole): number {
  return player.mainRole === role ? player.mainRate : player.subRate
}
