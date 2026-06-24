import type { NextApiRequest, NextApiResponse } from 'next'

/** パスコードなしの「メイン」入室は廃止。ユーザー登録・ログインを利用してください。 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({
    error: 'メインへのパスコードなし入室は終了しました。249 または きらくに でアカウントを作成してください。',
  })
}
