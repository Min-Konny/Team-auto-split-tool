import type { NextApiRequest, NextApiResponse } from 'next'

/** 個別アカウントのシードは廃止。コミュニティのパスワードでログインしてください。 */
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({
    error: '個別アカウントの作成は廃止しました。コミュニティのパスワードでログインしてください。',
  })
}
